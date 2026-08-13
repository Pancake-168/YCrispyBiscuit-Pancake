"""音频转换核心服务。流程：接收文件 → 校验 → ffprobe 元数据 → ffmpeg 转换 → 打包 zip。"""

import asyncio  # 异步并发提交批次
import json  # 解析 ffprobe 的 JSON 输出
import logging  # 日志记录（app 命名空间，输出到 pancake.be.log）
import shutil  # 在系统 PATH 中查找 ffmpeg
import subprocess  # 调用 ffmpeg/ffprobe 子进程
import uuid  # 生成任务 ID
from concurrent.futures import (
    ThreadPoolExecutor,
)  # 子进程调用放线程池，避免阻塞 asyncio 事件循环
from pathlib import Path  # 路径操作
from typing import Any, Dict, List  # 类型标注

from app.core.config import (
    BASE_DIR,  # 只读资源目录（打包后 = sys._MEIPASS，ffmpeg 二进制所在）
    WRITABLE_DIR,  # 可写数据目录（临时输出文件所在）
)
from app.exceptions.errors import (
    AppError,  # 业务异常基类（_error_result 判定用）
    BadRequestError,  # 参数/文件级错误（400）
    ConfigurationError,  # 依赖缺失（500）
    NotFoundError,  # 资源不存在（404）
)  # 项目统一异常体系，全部在 service 层抛出
from app.services.AudioSwitch.AudioSwitchTaskStore import (
    AudioTaskStore,  # 任务存储管理器
    StoredFile,  # 成功文件的引用结构
)
from app.utils.AudioSwitchUtils import (
    AUDIO_ENCODE_ARGS,  # 有损输出编码参数表（设计文档 2.5 策略）
    FORMAT_DETAILS,  # 格式详情字典 → GET /formats 序列化
    INPUT_EXTENSIONS,  # 输入扩展名列表（带点）→ GET /formats
    LOSSY_FORMAT_IDS,  # 有损格式标识集合（warning 判定）
    LOSSLESS_FORMAT_IDS,  # 无损格式标识集合（warning 判定）
    OUTPUT_FORMAT_NAMES,  # 输出格式标识列表（target_format 白名单）
    change_extension,  # 替换文件扩展名
    get_target_extension,  # 目标格式 → 标准扩展名
    is_supported_input,  # 输入扩展名白名单检查
    resolve_original_format,  # ffprobe 真实格式识别
)

logger = logging.getLogger("app.AudioSwitchService")  # 模块日志器（app 命名空间）


# ============================================================================
# 常量
# ============================================================================
MAX_FILE_SIZE = 200 * 1024 * 1024  # 单文件上限 200 MB，与前端 MAX_FILE_SIZE 一致
MAX_FILES = 50  # 单次批量转换最多 50 个文件
AUDIO_BATCH_SIZE = (
    2  # 每批并发提交到线程池的文件数（与 _AUDIO_EXECUTOR 的 max_workers 一致）
)
TASK_CLEANUP_SECONDS = 600  # 任务完成后 600 秒（10 分钟）自动清理临时文件
MAX_TASKS = 64  # 内存中最多保留 64 个任务的引用，超出按 LRU 淘汰最旧任务

# 子进程超时（秒）：ffmpeg/ffprobe 遇到畸形输入可能挂起，
# 无超时会把线程池 2 个 worker 永久占满，导致后续所有转换请求排队卡死
FFPROBE_TIMEOUT_SECONDS = 10  # 本地文件探测元数据，10 秒足够
FFMPEG_TIMEOUT_SECONDS = 300  # 200MB 音频转换，5 分钟上限

# ---- ffmpeg / ffprobe 路径 ----
# 模块加载时只计算路径（可能为 None），不在模块顶层 raise——
# 否则 dev 环境未下载 ffmpeg 时，import 本模块会连带整个后端（含 /docs）无法启动
_BUNDLED_FFMPEG = BASE_DIR / "ffmpeg" / "bin" / "ffmpeg.exe"
_BUNDLED_FFPROBE = BASE_DIR / "ffmpeg" / "bin" / "ffprobe.exe"
FFMPEG = str(_BUNDLED_FFMPEG) if _BUNDLED_FFMPEG.exists() else shutil.which("ffmpeg")
FFPROBE = (
    str(_BUNDLED_FFPROBE) if _BUNDLED_FFPROBE.exists() else shutil.which("ffprobe")
)

# 临时输出目录：WRITABLE_DIR 在开发环境指向 Server/FastAPI/，生产指向打包目录
OUTPUT_DIR = WRITABLE_DIR / "temp" / "audio_conversions"

# 子进程执行线程池（2 个 worker：每 worker 同时只跑一个 ffmpeg 子进程）
_AUDIO_EXECUTOR = ThreadPoolExecutor(max_workers=2, thread_name_prefix="audio-")


# ============================================================================
# 模块级辅助函数
# ============================================================================


def _ensure_ffmpeg() -> None:
    """惰性依赖检查：真正要转换时才发现缺失，而不是 import 即崩溃。"""
    if not FFMPEG or not FFPROBE:  # 任一缺失说明未下载或下载不完整
        raise ConfigurationError(
            "ffmpeg/ffprobe 未找到，请运行 npm run download:ffmpeg"
        )


def _probe_metadata(path: str) -> dict:
    """ffprobe 提取音频元数据（时长/采样率/真实编码）。失败时返回默认值，让 ffmpeg 继续尝试转换。"""
    try:
        result = subprocess.run(  # 同步子进程（由线程池调用，不阻塞事件循环）
            [
                FFPROBE,
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                path,
            ],
            capture_output=True,  # 捕获 stdout/stderr 到内存
            # 不设 text=True：Windows 下 text 模式用 locale 编码（GBK）解码子进程输出，
            # 中文文件名会让 ffprobe 输出 UTF-8 字节 → GBK 解码崩溃导致 stdout 变 None；
            # json.loads 原生接受 bytes（自动检测 UTF-8/UTF-16/UTF-32），直接传 bytes 最稳
            check=True,  # 非零退出码抛 CalledProcessError
            timeout=FFPROBE_TIMEOUT_SECONDS,  # 防挂起
            # Windows 下不弹出黑色控制台窗口，避免每次探测都闪一下终端
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        info = json.loads(result.stdout)  # 解析 JSON 输出（bytes 直接传入）
        fmt = info.get("format", {})
        stream = next(  # 取第一条音频流
            (s for s in info.get("streams", []) if s["codec_type"] == "audio"), {}
        )
        return {
            "duration": float(fmt.get("duration", 0)),  # 时长（秒）
            "sample_rate": int(stream.get("sample_rate", 0)),  # 采样率（Hz）
            "codec_name": str(stream.get("codec_name", "")),  # 真实编码名，如 mp3/flac
        }
    except (
        subprocess.CalledProcessError,  # ffprobe 退出码非 0（文件损坏等）
        subprocess.TimeoutExpired,  # 探测超时
        json.JSONDecodeError,  # 输出不是合法 JSON
        ValueError,  # 数值字段解析失败
        KeyError,  # 字段缺失
        StopIteration,  # 没有音频流
    ):
        logger.warning("ffprobe 读取元数据失败: %s", path)
        return {"duration": 0.0, "sample_rate": 0, "codec_name": ""}


def get_audio_service() -> "AudioService":
    """工厂函数：每次请求创建新的 AudioService（共享类级 task store）。"""
    return AudioService()


class AudioService:
    """音频转换编排服务，共享任务状态由类级 task store 维护。"""

    _task_store = AudioTaskStore(OUTPUT_DIR, MAX_TASKS, TASK_CLEANUP_SECONDS)

    # ==========================================================================
    # 格式查询
    # ==========================================================================

    async def get_supported_formats(self) -> Dict[str, Any]:
        """返回所有支持的格式及其详情，由 GET /api/audio/formats 调用。"""
        return {
            # INPUT_EXTENSIONS 元素带点（如 ".wav"），lstrip(".") 去掉点后返回前端
            "input_formats": [ext.lstrip(".") for ext in INPUT_EXTENSIONS],
            # OUTPUT_FORMAT_NAMES 已是去重的小写格式标识
            "output_formats": OUTPUT_FORMAT_NAMES,
            # FORMAT_DETAILS 是 plain dict，直接序列化（每个 value 都是 3 字段字典）
            "format_details": FORMAT_DETAILS,
        }

    # ==========================================================================
    # 转换入口
    # ==========================================================================

    async def convert_stream(
        self,
        uploads,  # List[UploadFile] — FastAPI 的上传文件对象（有 read() 和 filename 属性）
        target_format: str,
    ) -> Dict[str, Any]:
        """流式批量转换：按批读取→线程池转换→释放，避免全量驻留内存。"""
        # ---- 请求级校验（全部在 service 层抛出，controller 不参与） ----
        if not uploads:
            raise BadRequestError("请至少上传一个文件")
        if len(uploads) > MAX_FILES:
            raise BadRequestError(f"单次最多转换 {MAX_FILES} 个文件")
        normalized_target = target_format.lower().lstrip(".")  # 统一小写去前导点
        if normalized_target not in OUTPUT_FORMAT_NAMES:  # 目标格式白名单
            raise BadRequestError(f"不支持的目标格式: {target_format}")
        _ensure_ffmpeg()  # 惰性检查 ffmpeg/ffprobe 存在

        task_id = uuid.uuid4().hex[:12]  # 12 位随机 hex 任务 ID
        results: List[Dict[str, Any]] = []  # 所有文件的转换结果
        stored: List[StoredFile] = []  # 成功的文件引用

        task_dir = OUTPUT_DIR / task_id  # 任务独占临时目录
        task_dir.mkdir(parents=True, exist_ok=True)

        loop = asyncio.get_running_loop()  # 获取当前事件循环（读取/批量转换共用）

        # ---- 第一步：按批读取+转换（批满即提交，及时释放内容引用控制内存峰值） ----
        batch: List[tuple] = []  # 当前待转换批次：(idx, filename, content)
        for idx, f in enumerate(uploads):  # 遍历上传文件，idx 从 0 开始
            filename = getattr(f, "filename", None) or "unknown"  # 安全提取文件名
            try:
                content = await f.read()  # 异步读取文件全部字节
            except (
                Exception
            ) as e:  # 读取失败（如客户端断开）→ 该文件记为 error，继续处理其余文件
                results.append(self._error_result(idx, filename, e))
                continue
            batch.append((idx, filename, content))
            if len(batch) >= AUDIO_BATCH_SIZE:  # 批满 → 立即并发转换
                await self._convert_batch(
                    batch, normalized_target, task_dir, results, stored, loop
                )
                batch.clear()  # 清空批次，content 引用随之释放，控制内存峰值

        if batch:  # 处理不足一批的剩余文件
            await self._convert_batch(
                batch, normalized_target, task_dir, results, stored, loop
            )

        await self._task_store.register_async(task_id, task_dir, stored)

        return {
            "task_id": task_id,
            "total": len(results),
            "results": results,
        }

    def _error_result(
        self, index: int, filename: str, exc: BaseException
    ) -> Dict[str, Any]:
        """把异常转换为 results 数组中的 error 条目（AppError 用业务文案，其余用通用文案）。"""
        if isinstance(exc, AppError):  # 业务异常：直接使用其 detail 文案
            message = exc.detail
        else:  # 非预期异常：包装成通用错误文案
            message = f"转换失败: {str(exc)}"
        return {
            "index": index,
            "original_name": filename,
            "converted_name": "",
            "original_format": "",
            "target_format": "",
            "original_size": 0,
            "converted_size": 0,
            "size_ratio": 0.0,
            "duration_seconds": 0.0,
            "sample_rate": 0,
            "status": "error",
            "error": message,
        }

    async def _convert_batch(
        self,
        batch: List[tuple],
        target_format: str,
        task_dir: Path,
        results: List[Dict[str, Any]],
        stored: List[StoredFile],
        loop,
    ) -> None:
        """并发提交一批文件到线程池转换，结果/异常统一收集进 results 与 stored。"""
        futures = [
            loop.run_in_executor(  # 提交到线程池，避免阻塞事件循环
                _AUDIO_EXECUTOR,  # 专用音频线程池（max_workers=2）
                self._convert_one_sync,  # 同步转换函数（内部跑 ffmpeg 子进程）
                idx,
                filename,
                content,
                target_format,
                task_dir,  # 按位置传参
            )
            for idx, filename, content in batch
        ]
        # return_exceptions=True：单文件失败以异常对象返回，不中断整批
        outcomes = await asyncio.gather(*futures, return_exceptions=True)
        for (idx, filename, _content), outcome in zip(batch, outcomes):
            if isinstance(outcome, BaseException):  # 转换抛异常 → 转为 error 条目
                result = self._error_result(idx, filename, outcome)
            else:
                result = outcome  # 正常返回的结果字典
            results.append(result)  # 收集结果（成功或失败都收集）
            if result["status"] == "success":  # 仅成功文件加入 stored
                stored.append(
                    StoredFile(
                        path=task_dir / result["converted_name"],
                        converted_name=result["converted_name"],
                        converted_size=result["converted_size"],
                    )
                )

    # ==========================================================================
    # 单文件转换
    # ==========================================================================

    def _convert_one_sync(
        self,
        index: int,
        filename: str,
        data: bytes,
        target_format: str,
        task_dir: Path,
    ) -> Dict[str, Any]:
        """转换单个文件（同步方法，由线程池执行以避免阻塞 asyncio 事件循环）。

        文件级校验失败（过大/格式不支持/转换失败/超时）直接 raise BadRequestError，
        由上层 _convert_batch 捕获后转为 results 数组中的 error 条目。
        """
        # ---- 文件大小校验（后端防御层，前端已有 200MB 过滤） ----
        if len(data) > MAX_FILE_SIZE:
            raise BadRequestError(
                f"文件过大（>{MAX_FILE_SIZE // (1024 * 1024)}MB）: {filename}"
            )

        # ---- 扩展名白名单检查（快速拒绝不支持格式） ----
        if not is_supported_input(filename):  # 检查 Path.suffix 是否在白名单集合
            raise BadRequestError(f"不支持的音频格式: {filename}")

        # ---- 写入临时输入文件（保留原扩展名，便于 ffmpeg 按容器探测） ----
        ext = Path(filename).suffix.lower()  # 提取含点扩展名并小写（如 ".wav"）
        input_path = task_dir / f"_in_{index}{ext}"  # 含 index 的唯一临时输入名
        input_path.write_bytes(data)  # 字节写入磁盘

        # ---- ffprobe 读取元数据（含真实编码，供 original_format 与展示） ----
        metadata = _probe_metadata(str(input_path))

        # ---- original_format 以 ffprobe 识别的真实格式为准，而不是扩展名 ----
        # 如把 MP3 改名 .wav 上传，仍报告 mp3；识别失败时回退扩展名
        original_format = resolve_original_format(metadata, filename)

        # ---- 输出路径：先写含 index 的唯一临时名，成功后原子 rename 到最终名 ----
        # ffmpeg 自行打开输出文件，无法用图片版的 "xb" 独占创建防竞态；
        # 唯一临时名保证同批次并发（2 线程）互不干扰，rename 阶段再做重名去重
        target_ext = get_target_extension(target_format)  # 如 "mp3"→".mp3"
        tmp_output = task_dir / f"_out_{index}{target_ext}"  # 含 index 的唯一临时输出名
        converted_name = change_extension(
            filename, target_ext
        )  # 如 "song.wav"→"song.mp3"
        final_path = task_dir / converted_name

        # ---- ffmpeg 转换（带编码参数 + 超时） ----
        # 编码参数来自 AUDIO_ENCODE_ARGS（设计文档 2.5 策略表）；无损格式无参数
        args = [
            FFMPEG,
            "-y",  # 输出文件已存在时直接覆盖
            "-i",
            str(input_path),  # 输入文件
            # 只取第一条音频流：带内嵌封面的 FLAC（mjpeg 视频流）会被 ffmpeg
            # 默认映射进输出，而 m4a/mp3/ogg 等音频容器不支持视频流，
            # 导致写容器头失败、整次转换失败（音频流被连累写不进去）
            "-map",
            "0:a:0",
            *AUDIO_ENCODE_ARGS.get(target_format, []),  # 有损格式的编码器参数
            str(tmp_output),  # 输出到唯一临时名
        ]
        try:
            subprocess.run(
                args,
                check=True,  # 非零退出码抛 CalledProcessError
                stdout=subprocess.DEVNULL,  # ffmpeg 正常输出丢弃
                stderr=subprocess.PIPE,  # 错误输出捕获（拼进异常消息给用户看）
                # 显式 UTF-8 + errors="replace"：Windows 默认 locale 编码是 GBK，
                # ffmpeg 输出含中文文件名（UTF-8 字节）时会解码崩溃；replace 保证不崩且不乱码
                encoding="utf-8",
                errors="replace",
                timeout=FFMPEG_TIMEOUT_SECONDS,  # 防挂起
                # Windows 下不弹出黑色控制台窗口，避免转换时闪终端干扰用户
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
        except subprocess.CalledProcessError as e:
            input_path.unlink(missing_ok=True)  # 清理临时输入
            tmp_output.unlink(missing_ok=True)  # 清理不完整输出
            stderr_tail = e.stderr.strip().split("\n")[-2:] if e.stderr else []
            raise BadRequestError(
                f"音频转换失败: {filename} — {'; '.join(stderr_tail)}"
            ) from e
        except subprocess.TimeoutExpired:
            # subprocess.run 超时时已 kill 子进程；清理临时文件后给用户明确错误
            input_path.unlink(missing_ok=True)
            tmp_output.unlink(missing_ok=True)
            raise BadRequestError(f"音频转换超时: {filename}")

        # ---- 原子 rename 到最终名（含重名处理：目标已存在时追加 _1, _2...） ----
        # Windows 上 os.rename 目标存在时抛 FileExistsError，用异常循环替代 exists 预检
        counter = 1
        while True:
            try:
                tmp_output.rename(final_path)  # 同目录 rename 是原子操作
                break  # 改名成功，退出循环
            except FileExistsError:
                converted_name = f"{Path(filename).stem}_{counter}{target_ext}"
                final_path = task_dir / converted_name
                counter += 1

        # ---- 读取结果并清理临时输入 ----
        converted_data = final_path.read_bytes()  # 转换结果字节
        input_path.unlink(missing_ok=True)  # 删除临时输入

        # ---- warning：源有损 → 目标无损时提示用户 ----
        # 判定依据 LOSSY_FORMAT_IDS/LOSSLESS_FORMAT_IDS（与 FORMAT_DETAILS 的 lossy 标记同源）
        warning = None
        if original_format in LOSSY_FORMAT_IDS and target_format in LOSSLESS_FORMAT_IDS:
            warning = "源文件为有损格式，转换为无损格式不会恢复已损失的音质"

        return {
            "index": index,
            "original_name": filename,
            "converted_name": converted_name,
            "original_format": original_format,
            "target_format": target_format,
            "original_size": len(data),
            "converted_size": len(converted_data),
            "size_ratio": round(len(converted_data) / len(data), 4) if data else 0.0,
            "duration_seconds": round(metadata["duration"], 1),
            "sample_rate": metadata["sample_rate"],
            "status": "success",
            "error": None,
            "warning": warning,
        }

    # ==========================================================================
    # 下载
    # ==========================================================================

    def get_file_path(self, task_id: str, index: int) -> Path:
        """根据 task_id 和文件序号返回磁盘路径，不存在时抛 NotFoundError。"""
        path = self._task_store.get_file_path(task_id, index)
        if path is None or not path.exists():  # 任务不存在/序号越界/文件已过期
            raise NotFoundError("文件不存在或已过期")
        return path

    def get_filename(self, task_id: str, index: int) -> str:
        """根据 task_id 和序号返回转换后的文件名（下载 Content-Disposition 用）。"""
        return self._task_store.get_filename(task_id, index)

    def get_zip_path(self, task_id: str) -> Path:
        """根据 task_id 返回 batch.zip 路径，不存在时抛 NotFoundError。"""
        path = self._task_store.get_zip_path(task_id)
        if path is None or not path.exists():  # 任务不存在/zip 未生成/已过期
            raise NotFoundError("文件不存在或已过期")
        return path
