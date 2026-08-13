"""
图片转换核心服务。

流程：接收文件 → 校验 → 格式检测 → 打开 → 色彩转换 → 缩放 → 保存 → 打包 zip。
"""

import asyncio
import io
import uuid
from concurrent.futures import (
    ThreadPoolExecutor,
)  # 线程池，CPU 密集型 PIL 操作放到池里避免阻塞 asyncio 事件循环
from pathlib import Path
from typing import List, Optional, Dict, Any
from dataclasses import dataclass


from PIL import Image  # Pillow：图片打开、色彩转换、缩放、保存
from PIL import ImageOps  # EXIF 方向转置（手机竖拍照片修正）
from PIL.Image import Resampling  # 缩放重采样算法（LANCZOS）
from app.exceptions.errors import (
    BadRequestError,
    NotFoundError,
    AppError,
)  # 项目统一异常体系
from app.services.PictureSwitch.PictureSwitchImageIO import open_image
from app.services.PictureSwitch.PictureSwitchSvgService import (
    save_as_svg,
    save_as_svg_embed,
)
from app.services.PictureSwitch.PictureSwitchPILService import (
    apply_color_mode,
    center_crop_square,
    center_crop_to,
)
from app.services.PictureSwitch.PictureSwitchTaskStore import (
    PictureTaskStore,
    StoredFile,
)


from app.utils.PictureSwitchUtils import (
    detect_format_by_magic,  # 魔数检测 → 确定真实文件格式
    is_supported_input,  # 扩展名白名单检查 → 快速拒绝不支持的格式
    get_pillow_format,  # 扩展名/格式标识 → Pillow 规范格式名（如 "jpg" → "JPEG"）
    get_target_extension,  # 用户目标格式 → 标准扩展名（如 "webp" → ".webp"）
    change_extension,  # 替换文件扩展名（如 "a.jpg" → "a.webp"）
    calculate_resize,  # 根据缩放模式计算目标宽高
    resolve_color_mode,  # 根据格式能力和用户请求确定输出色彩模式
    get_save_kwargs,  # 根据格式返回 Pillow save() 参数（quality/lossless/optimize）
    FORMAT_DETAILS,  # 格式详情字典 → 供 GET /formats 序列化
    INPUT_EXTENSIONS,  # 输入扩展名列表（带点）→ 供 GET /formats 返回
    OUTPUT_FORMAT_NAMES,  # 输出格式名列表（小写，去重）→ 供 GET /formats 返回，与 FORMAT_DETAILS key 对齐
    FORMAT_TO_EXT,  # 格式名 → 小写标识反向映射（报告真实解码格式用）
)
from app.core.config import (
    WRITABLE_DIR,
)  # 可写目录路径（开发=FastAPI/temp/，生产=资源目录/data/）


# ============================================================================
# 常量
# ============================================================================
MAX_FILE_SIZE = 100 * 1024 * 1024  # 单文件上限 100 MB，与前端 MAX_FILE_SIZE 保持一致
MAX_FILES = 50  # 单次批量转换最多 50 个文件
PIL_BATCH_SIZE = (
    2  # 每批并发提交到线程池的文件数（与 _PIL_EXECUTOR 的 max_workers 一致）
)
TASK_CLEANUP_SECONDS = 600  # 任务完成后 600 秒（10 分钟）自动清理临时文件
MAX_TASKS = 64  # 内存中最多保留 64 个任务的引用，超出按 LRU 淘汰最旧任务


# 临时输出目录：WRITABLE_DIR 在开发环境指向 Server/FastAPI/，生产指向打包目录
OUTPUT_DIR = WRITABLE_DIR / "temp" / "picture_conversions"


# PIL 操作线程池（CPU 密集型，避免阻塞事件循环）
# max_workers=2：限制并发 PIL 操作线程数，避免大量并发转换时 CPU 过载
_PIL_EXECUTOR = ThreadPoolExecutor(max_workers=2, thread_name_prefix="pil-")


# ============================================================================
# 内部数据结构
# ============================================================================
@dataclass
class ConversionParams:
    """一次批量转换的参数（已规范化）。

    由 Controller 层从 Form 字段构造，所有可选字段都已给定默认值或 None。
    此 dataclass 仅用于参数传递，不做校验（校验在 Controller 的 Form() 参数声明中完成）。
    """

    target_format: (
        str  # 目标格式标识（小写，如 "webp"、"jpeg"）— 来自前端 output_formats
    )
    quality: Optional[int]  # 质量参数（None=使用 Pillow 默认值；前端 quality 滑块的值）
    lossless: bool  # 无损模式（仅 WebP 有效；前端 lossless 开关为 true 时发送，否则不发送→默认 False）
    resize_mode: str  # "none" | "fit" | "fill" | "exact"
    max_width: Optional[int]  # fit/fill 模式的宽边界（前端不发送时为 None）
    max_height: Optional[int]  # fit/fill 模式的高边界
    width: Optional[int]  # exact 模式的目标宽（前端不发送时为 None）
    height: Optional[int]  # exact 模式的目标高
    keep_aspect_ratio: (
        bool  # 缩放时是否保持宽高比（exact 模式前端发 false，其余发 true）
    )
    background_color: str  # 透明填充色，格式 "#RRGGBB"（默认 "#FFFFFF"）
    color_mode: str  # "auto" | "RGB" | "RGBA" | "L" | "P"
    strip_metadata: bool  # 是否移除 EXIF/XMP 等元数据
    svg_mode: str  # "embed" | "vectorize"，仅 target_format=svg 时生效


class PictureService:
    """图片转换编排服务，共享任务状态由类级 task store 维护。"""

    _task_store = PictureTaskStore(OUTPUT_DIR, MAX_TASKS, TASK_CLEANUP_SECONDS)

    # ==========================================================================
    # 格式查询
    # ==========================================================================

    async def get_supported_formats(self) -> Dict[str, Any]:
        """返回所有支持的格式及其详情，由 GET /api/picture/formats 调用。"""
        details = {}
        for key, detail in FORMAT_DETAILS.items():  # 遍历所有注册的格式（14 种）
            details[key] = detail.to_dict()  # FormatDetail 对象 → 7 字段字典
        return {
            # INPUT_EXTENSIONS 元素带点（如 ".png"），lstrip(".") 去掉点后返回前端
            "input_formats": [ext.lstrip(".") for ext in INPUT_EXTENSIONS],
            # OUTPUT_FORMAT_NAMES 已是去重的小写格式标识
            "output_formats": OUTPUT_FORMAT_NAMES,
            "format_details": details,
        }

    # ==========================================================================
    # 转换入口
    # ==========================================================================

    async def convert_stream(
        self,
        uploads,  # List[UploadFile] — FastAPI 的上传文件对象（有 read() 和 filename 属性）
        params: ConversionParams,
    ) -> Dict[str, Any]:
        """流式批量转换：逐文件读取→线程池转换→释放，避免全量驻留内存。"""

        # ---- 请求级校验 ----
        if not uploads:
            raise BadRequestError("请至少上传一个文件")
        if len(uploads) > MAX_FILES:
            raise BadRequestError(f"单次最多转换 {MAX_FILES} 个文件")

        task_id = uuid.uuid4().hex[:12]  # 12 位随机 hex 任务 ID
        results = []  # 所有文件的转换结果
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
            if len(batch) >= PIL_BATCH_SIZE:  # 批满 → 立即并发转换
                await self._convert_batch(
                    batch, params, task_dir, results, stored, loop
                )
                batch.clear()  # 清空批次，content 引用随之释放，控制内存峰值

        if batch:  # 处理不足一批的剩余文件
            await self._convert_batch(batch, params, task_dir, results, stored, loop)

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
            "original_resolution": "",
            "converted_resolution": "",
            "size_ratio": 0.0,
            "status": "error",
            "error": message,
        }

    async def _convert_batch(
        self,
        batch: List[tuple],
        params: ConversionParams,
        task_dir: Path,
        results: List[Dict[str, Any]],
        stored: List[StoredFile],
        loop,
    ) -> None:
        """并发提交一批文件到线程池转换，结果/异常统一收集进 results 与 stored。"""
        futures = [
            loop.run_in_executor(  # 提交到线程池，避免阻塞事件循环
                _PIL_EXECUTOR,  # 专用 PIL 线程池（max_workers=2）
                self._convert_one_sync,  # 同步转换函数
                idx,
                filename,
                content,
                params,
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
                        converted_resolution=result["converted_resolution"],
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
        params: ConversionParams,
        task_dir: Path,
    ) -> Dict[str, Any]:
        """转换单个文件（同步方法，由线程池执行以避免阻塞 asyncio 事件循环）。

        文件级校验失败（过大/格式不支持/无法识别/损坏）直接 raise BadRequestError，
        由上层 convert_stream 捕获后转为 results 数组中的 error 条目。
        """

        # ---- 文件大小校验（后端防御层，前端已有 100MB 过滤） ----
        if len(data) > MAX_FILE_SIZE:
            raise BadRequestError(
                f"文件过大（>{MAX_FILE_SIZE // (1024 * 1024)}MB）: {filename}"
            )

        # ---- 扩展名白名单检查（快速拒绝不支持格式） ----
        if not is_supported_input(filename):  # 检查 Path.suffix 是否在 EXT_TO_FORMAT 中
            raise BadRequestError(f"不支持的图片格式: {filename}")

        # ---- 魔数检测（优先识别真实格式，无魔数的格式回退扩展名推断） ----
        detected = detect_format_by_magic(data, filename)  # 魔数优先，失败回退扩展名
        if detected is None:
            raise BadRequestError(f"无法识别图片格式: {filename}")

        # ---- 打开图片 ----
        try:
            img = self._open_image(
                data, detected, filename
            )  # 根据检测到的格式选打开方式
        except Exception as e:
            raise BadRequestError(f"文件损坏或无法打开: {filename}") from e

        # ---- EXIF Orientation 转正 ----
        # 手机/相机照片把旋转方向存在 EXIF 里，Pillow 打开时不自动应用；
        # 若不在此时转正，后面 strip_metadata 清掉 EXIF 后输出图片会“横躺”
        if detected in ("JPEG", "TIFF"):
            img = ImageOps.exif_transpose(img)  # 按 EXIF 方向转置；无方向信息时原样返回

        # original_format 以实际解码格式为准（Pillow 识别结果），而不是文件扩展名；
        # 伪装扩展名的文件（如 JPEG 内容命名 .png）也能报告正确格式
        actual_format = (
            getattr(img, "format", None) or detected
        )  # AVIF 等无 format 属性时用魔数结果
        original_format = FORMAT_TO_EXT.get(
            actual_format, str(actual_format).lower()
        )  # 格式名 → 小写标识（如 "JPEG" → "jpeg"）

        original_size = len(data)
        original_resolution = f"{img.width}×{img.height}"

        # ---- 色彩模式：确定目标 Pillow 模式 ----
        has_alpha = img.mode in ("RGBA", "LA", "PA") or (
            img.mode == "P" and "transparency" in (img.info or {})  # P 模式可带透明索引
        )
        target_pillow_fmt = (
            get_pillow_format(
                params.target_format
            )  # 规范化为 Pillow 名（如 "jpg"→"JPEG"）
            or params.target_format.upper()  # 极端情况 fallback
        )
        target_mode = (
            resolve_color_mode(  # 综合格式能力+原图模式+用户选择，返回目标模式
                img.mode, target_pillow_fmt, params.color_mode, has_alpha
            )
        )
        if target_mode != img.mode:  # 模式不同才转换
            img = apply_color_mode(img, target_mode, params.background_color)

        # ---- 动画输入（GIF 动画 / APNG 等多帧图片）：仅保留首帧 ----
        warning_message: Optional[str] = None  # 成功时的用户可见提示（默认无）
        if getattr(img, "is_animated", False):  # is_animated=True 表示多帧
            import logging

            warning_message = f"该文件包含 {getattr(img, 'n_frames', '?')} 帧，转换后仅保留首帧，其余帧已丢弃"  # 提示写入响应，前端在结果行中展示给用户
            logging.getLogger("app.PictureService").warning(
                f"多帧图片 '{filename}' 包含 {getattr(img, 'n_frames', '?')} 帧，转换后仅保留首帧，其余帧将被丢弃"
            )
            img.seek(0)  # 确保帧指针在首帧

        # ---- ICO：非方形→居中裁切为正方形 ----
        if target_pillow_fmt == "ICO" and img.width != img.height:
            img = center_crop_square(img)  # 以较短边为边长，居中裁切

        # ---- 缩放 ----
        new_size = calculate_resize(  # 根据 resize_mode 计算目标尺寸
            img.width,
            img.height,
            params.resize_mode,
            params.max_width,
            params.max_height,
            params.width,
            params.height,
            params.keep_aspect_ratio,
        )
        if new_size != (img.width, img.height):  # 尺寸有变化才执行 resize
            img = img.resize(new_size, Resampling.LANCZOS)  # Lanczos 高质量重采样

        # fill 模式第二步：等比缩放填满后，居中裁切至精确尺寸
        if params.resize_mode == "fill" and params.max_width and params.max_height:
            img = center_crop_to(img, params.max_width, params.max_height)

        # ---- 移除元数据（保留 ICC 色彩配置文件） ----
        if params.strip_metadata:
            icc_profile = img.info.get("icc_profile")  # 提取 ICC profile
            img.info.clear()  # 清空所有 info（EXIF/XMP 等）
            if icc_profile:
                img.info["icc_profile"] = icc_profile  # 写回 ICC profile

        # ---- 保存 ----
        if target_pillow_fmt == "SVG":
            if params.svg_mode == "embed":
                converted_data = save_as_svg_embed(img)
            else:
                converted_data = save_as_svg(
                    img, params.quality, params.background_color
                )
        else:
            save_kwargs = (
                get_save_kwargs(  # 格式特定的保存参数（传入尺寸用于选择编码参数）
                    params.target_format, params.quality, params.lossless, img.size
                )
            )
            save_format = "JPEG" if target_pillow_fmt == "JPEG" else target_pillow_fmt
            # PBM/PGM 在 Pillow 中没有独立的注册格式名，统一归口到 PPM 插件保存；
            # PPM 插件按图像 mode 自动写文件头："1"→P4（PBM）、"L"→P5（PGM）、"RGB"→P6（PPM）
            if save_format in ("PBM", "PGM"):
                save_format = "PPM"
            # 色彩模式兜底：确保写入前模式与格式严格兼容
            if save_format == "JPEG" and img.mode not in ("RGB", "L"):
                img = img.convert("RGB")  # JPEG 只接受 RGB/L
            elif save_format == "GIF" and img.mode != "P":
                img = img.convert("P")  # GIF 只接受调色板 P
            elif target_pillow_fmt == "PBM" and img.mode != "1":
                img = img.convert("1")  # PBM 只接受 1 位模式
            elif target_pillow_fmt == "PGM" and img.mode != "L":
                img = img.convert("L")  # PGM 只接受灰度模式
            elif target_pillow_fmt == "PPM" and img.mode != "RGB":
                img = img.convert("RGB")  # PPM 规范只含 P3/P6，统一转 RGB
            buf = io.BytesIO()
            img.save(buf, format=save_format, **save_kwargs)  # Pillow 编码写入内存
            converted_data = buf.getvalue()

        # ---- 写入磁盘 ----
        target_ext = get_target_extension(params.target_format)  # 如 "webp"→".webp"
        converted_name = change_extension(filename, target_ext)  # 如 "a.jpg"→"a.webp"
        out_path = task_dir / converted_name
        counter = 1
        # 重名处理：用 "xb" 独占创建，FileExistsError 时追加 _1, _2...
        # 相比先 exists 再写，独占创建在批量并发转换下也不会互相覆盖
        while True:
            try:
                with open(out_path, "xb") as fh:  # x=独占创建，b=二进制
                    fh.write(converted_data)  # 写入磁盘
                break  # 写盘成功，退出重名循环
            except FileExistsError:
                stem = Path(filename).stem
                converted_name = f"{stem}_{counter}{target_ext}"
                out_path = task_dir / converted_name
                counter += 1

        converted_size = len(converted_data)
        converted_resolution = f"{img.width}×{img.height}"
        size_ratio = (
            round(converted_size / original_size, 4) if original_size > 0 else 0.0
        )

        return {
            "index": index,
            "original_name": filename,
            "converted_name": converted_name,
            "original_format": original_format,
            "target_format": params.target_format.lstrip("."),
            "original_size": original_size,
            "converted_size": converted_size,
            "original_resolution": original_resolution,
            "converted_resolution": converted_resolution,
            "size_ratio": size_ratio,
            "status": "success",
            "error": None,
            "warning": warning_message,
        }

    # ==========================================================================
    # 图片打开（含 HEIF/AVIF/SVG 特殊处理）
    # ==========================================================================

    def _open_image(
        self, data: bytes, detected_format: str, filename: str
    ) -> Image.Image:
        """根据检测到的格式选择合适的打开方式。

        特殊路径：HEIF（pillow-heif 注册 opener）、AVIF（pyavif 临时文件解码）、
        SVG（cairosvg 渲染为 PNG）。其余走 Pillow 原生 Image.open。
        """
        return open_image(data, detected_format, filename)

    # ==========================================================================
    # 下载
    # ==========================================================================

    def get_file_path(self, task_id: str, index: int) -> Path:
        path = self._task_store.get_file_path(task_id, index)
        if path is None or not path.exists():
            raise NotFoundError("文件不存在或已过期")
        return path

    def get_filename(self, task_id: str, index: int) -> str:
        return self._task_store.get_filename(task_id, index)

    def get_zip_path(self, task_id: str) -> Path:
        path = self._task_store.get_zip_path(task_id)
        if path is None or not path.exists():
            raise NotFoundError("文件不存在或已过期")
        return path


def get_picture_service() -> PictureService:
    return PictureService()
