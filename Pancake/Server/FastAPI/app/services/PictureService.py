"""
图片转换核心服务。

流程：接收文件 → 校验 → 格式检测 → 打开 → 色彩转换 → 缩放 → 保存 → 打包 zip。
"""

import asyncio
import io
import math
import os
import uuid
import zipfile
import tempfile
import shutil
import time
from collections import OrderedDict                # 有序字典，LRU 淘汰依赖插入顺序
from concurrent.futures import ThreadPoolExecutor   # 线程池，CPU 密集型 PIL 操作放到池里避免阻塞 asyncio 事件循环
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass, field

import numpy as np                                   # 用于 AVIF 编解码的像素数组、SVG 矢量化的颜色量化
from PIL import Image, ImageOps                     # Pillow：图片打开、色彩转换、缩放、保存
from PIL.Image import Resampling                    # 缩放重采样算法（LANCZOS）

from app.utils.PictureUtils import (
    detect_format_by_magic,   # 魔数检测 → 确定真实文件格式
    is_supported_input,       # 扩展名白名单检查 → 快速拒绝不支持的格式
    get_pillow_format,        # 扩展名/格式标识 → Pillow 规范格式名（如 "jpg" → "JPEG"）
    get_output_extension,     # Pillow 格式名 → 标准扩展名（如 "JPEG" → ".jpg"）
    get_target_extension,     # 用户目标格式 → 标准扩展名（如 "webp" → ".webp"）
    change_extension,         # 替换文件扩展名（如 "a.jpg" → "a.webp"）
    calculate_resize,         # 根据缩放模式计算目标宽高
    resolve_color_mode,       # 根据格式能力和用户请求确定输出色彩模式
    get_save_kwargs,          # 根据格式返回 Pillow save() 参数（quality/lossless/optimize）
    FORMAT_DETAILS,           # 格式详情字典 → 供 GET /formats 序列化
    INPUT_EXTENSIONS,         # 输入扩展名列表（带点）→ 供 GET /formats 返回
    OUTPUT_FORMAT_NAMES,      # 输出格式名列表（小写，去重）→ 供 GET /formats 返回，与 FORMAT_DETAILS key 对齐
)
from app.core.config import WRITABLE_DIR  # 可写目录路径（开发=FastAPI/temp/，生产=资源目录/data/）

# ============================================================================
# 常量
# ============================================================================

MAX_FILE_SIZE = 100 * 1024 * 1024  # 单文件上限 100 MB，与前端 MAX_FILE_SIZE 保持一致
MAX_FILES = 50                     # 单次批量转换最多 50 个文件
TASK_CLEANUP_SECONDS = 600         # 任务完成后 600 秒（10 分钟）自动清理临时文件
MAX_TASKS = 64                     # 内存中最多保留 64 个任务的引用，超出按 LRU 淘汰最旧任务

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

    target_format: str            # 目标格式标识（小写，如 "webp"、"jpeg"）— 来自前端 output_formats
    quality: Optional[int]        # 质量参数（None=使用 Pillow 默认值；前端 quality 滑块的值）
    lossless: bool                # 无损模式（仅 WebP 有效；前端 lossless 开关为 true 时发送，否则不发送→默认 False）
    resize_mode: str              # "none" | "fit" | "fill" | "exact"
    max_width: Optional[int]      # fit/fill 模式的宽边界（前端不发送时为 None）
    max_height: Optional[int]     # fit/fill 模式的高边界
    width: Optional[int]          # exact 模式的目标宽（前端不发送时为 None）
    height: Optional[int]         # exact 模式的目标高
    keep_aspect_ratio: bool       # 缩放时是否保持宽高比（exact 模式前端发 false，其余发 true）
    background_color: str         # 透明填充色，格式 "#RRGGBB"（默认 "#FFFFFF"）
    color_mode: str               # "auto" | "RGB" | "RGBA" | "L" | "P"
    strip_metadata: bool          # 是否移除 EXIF/XMP 等元数据


@dataclass
class StoredFile:
    """转换完成的文件引用。"""

    path: Path                    # 磁盘上的完整路径（如 OUTPUT_DIR/<task_id>/photo.webp）
    converted_name: str           # 转换后的文件名（如 "photo.webp"）
    converted_size: int           # 文件大小（字节），用于前端展示压缩比
    converted_resolution: str     # 分辨率字符串（如 "1920×1080"）


class PictureService:
    """图片转换服务。单例，由 PictureController 在模块加载时创建。"""

    _tasks: OrderedDict[str, List[StoredFile]] = OrderedDict()  # 任务存储（LRU，超出 MAX_TASKS 时淘汰最旧）

    # ==========================================================================
    # 格式查询
    # ==========================================================================

    async def get_supported_formats(self) -> Dict[str, Any]:
        """返回所有支持的格式及其详情，由 GET /api/picture/formats 调用。"""
        details = {}
        for key, detail in FORMAT_DETAILS.items():        # 遍历所有注册的格式（14 种）
            details[key] = detail.to_dict()               # FormatDetail 对象 → 7 字段字典
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
        task_id = uuid.uuid4().hex[:12]     # 12 位随机 hex 任务 ID
        results = []                         # 所有文件的转换结果
        stored: List[StoredFile] = []        # 成功的文件引用

        task_dir = OUTPUT_DIR / task_id      # 任务独占临时目录
        task_dir.mkdir(parents=True, exist_ok=True)

        for idx, f in enumerate(uploads):    # 遍历上传文件，idx 从 0 开始
            content = await f.read()         # 异步读取文件全部字节
            filename = getattr(f, "filename", None) or "unknown"  # 安全提取文件名
            loop = asyncio.get_running_loop()                     # 获取当前事件循环
            result = await loop.run_in_executor(  # 提交到线程池，避免阻塞事件循环
                _PIL_EXECUTOR,                    # 专用 PIL 线程池（max_workers=2）
                self._convert_one_sync,           # 同步转换函数
                idx, filename, content, params, task_dir,  # 按位置传参
            )
            results.append(result)               # 收集结果（成功或失败都收集）
            del content                           # 显式释放字节引用，帮助 GC
            if result["status"] == "success":     # 仅成功文件加入 stored
                stored.append(
                    StoredFile(
                        path=task_dir / result["converted_name"],
                        converted_name=result["converted_name"],
                        converted_size=result["converted_size"],
                        converted_resolution=result["converted_resolution"],
                    )
                )

        self._tasks[task_id] = stored            # 注册到任务字典
        # LRU 淘汰：超出容量时删除最早的任务及其临时目录
        while len(self._tasks) > MAX_TASKS:
            oldest_id, _ = self._tasks.popitem(last=False)  # 从 OrderedDict 头部弹出
            oldest_dir = OUTPUT_DIR / oldest_id
            if oldest_dir.exists():
                shutil.rmtree(oldest_dir, ignore_errors=True)  # 递归删目录

        # 多个文件时打包 batch.zip
        if len(stored) > 1:
            zip_path = task_dir / "batch.zip"
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for sf in stored:
                    zf.write(sf.path, sf.converted_name)  # 写入 zip，文件名为 converted_name

        self._schedule_cleanup(task_id, task_dir)  # 启动 10 分钟后自动清理

        return {
            "task_id": task_id,
            "total": len(results),
            "results": results,
        }

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
        """转换单个文件（同步方法，由线程池执行以避免阻塞 asyncio 事件循环）。"""
        # 默认失败结果模板
        base_result = {
            "index": index, "original_name": filename,
            "converted_name": "", "original_format": "", "target_format": "",
            "original_size": 0, "converted_size": 0,
            "original_resolution": "", "converted_resolution": "",
            "size_ratio": 0.0, "status": "error", "error": None,
        }

        # ---- 文件大小校验（后端防御层，前端已有 100MB 过滤） ----
        if len(data) > MAX_FILE_SIZE:
            base_result["error"] = f"文件过大（>{MAX_FILE_SIZE // (1024 * 1024)}MB）"
            return base_result

        # ---- 扩展名白名单检查（快速拒绝不支持格式） ----
        if not is_supported_input(filename):  # 检查 Path.suffix 是否在 EXT_TO_FORMAT 中
            base_result["error"] = "不支持的图片格式"
            return base_result

        # ---- 魔数检测（绕过扩展名伪造） ----
        detected = detect_format_by_magic(data, filename)  # 魔数优先，失败回退扩展名
        if detected is None:
            base_result["error"] = "无法识别图片格式"
            return base_result

        ext = Path(filename).suffix.lower()          # 提取含点扩展名并小写（如 ".jpg"）
        original_format = ext.lstrip(".")            # 去点得格式标识（如 "jpg"）

        # ---- 打开图片 ----
        try:
            img = self._open_image(data, detected, filename)  # 根据检测到的格式选打开方式
        except Exception as e:
            base_result["error"] = f"文件损坏或无法打开: {str(e)}"
            return base_result

        original_size = len(data)
        original_resolution = f"{img.width}×{img.height}"

        try:
            # ---- 色彩模式：确定目标 Pillow 模式 ----
            has_alpha = img.mode in ("RGBA", "LA", "PA") or (
                img.mode == "P" and "transparency" in (img.info or {})  # P 模式可带透明索引
            )
            target_pillow_fmt = (
                get_pillow_format(params.target_format)        # 规范化为 Pillow 名（如 "jpg"→"JPEG"）
                or params.target_format.upper()               # 极端情况 fallback
            )
            target_mode = resolve_color_mode(  # 综合格式能力+原图模式+用户选择，返回目标模式
                img.mode, target_pillow_fmt, params.color_mode, has_alpha
            )
            if target_mode != img.mode:  # 模式不同才转换
                img = self._apply_color_mode(img, target_mode, params.background_color)

            # ---- GIF 动画：取首帧 ----
            if detected == "GIF" and getattr(img, "is_animated", False):  # is_animated 表示多帧
                import logging
                logging.getLogger("app.PictureService").warning(
                    f"GIF 动画 '{filename}' 包含 {getattr(img, 'n_frames', '?')} 帧，转换后仅保留首帧，其余帧将被丢弃"
                )
                img.seek(0)  # 确保帧指针在首帧

            # ---- ICO：非方形→居中裁切为正方形 ----
            if target_pillow_fmt == "ICO" and img.width != img.height:
                img = self._center_crop_square(img)  # 以较短边为边长，居中裁切

            # ---- 缩放 ----
            new_size = calculate_resize(  # 根据 resize_mode 计算目标尺寸
                img.width, img.height,
                params.resize_mode, params.max_width, params.max_height,
                params.width, params.height, params.keep_aspect_ratio,
            )
            if new_size != (img.width, img.height):    # 尺寸有变化才执行 resize
                img = img.resize(new_size, Resampling.LANCZOS)  # Lanczos 高质量重采样

            # fill 模式第二步：等比缩放填满后，居中裁切至精确尺寸
            if params.resize_mode == "fill" and params.max_width and params.max_height:
                img = self._center_crop_to(img, params.max_width, params.max_height)

            # ---- 移除元数据（保留 ICC 色彩配置文件） ----
            if params.strip_metadata:
                icc_profile = img.info.get("icc_profile")  # 提取 ICC profile
                img.info.clear()                            # 清空所有 info（EXIF/XMP 等）
                if icc_profile:
                    img.info["icc_profile"] = icc_profile   # 写回 ICC profile

            # ---- 保存 ----
            if target_pillow_fmt == "SVG":
                # SVG：走独立矢量化路径（Pillow 不支持写 SVG）
                converted_data = self._save_as_svg(img, params.quality, params.background_color)
            else:
                save_kwargs = get_save_kwargs(  # 格式特定的保存参数
                    params.target_format, params.quality, params.lossless
                )
                save_format = "JPEG" if target_pillow_fmt == "JPEG" else target_pillow_fmt
                # 色彩模式兼容性：确保写入前模式与格式兼容
                if save_format == "JPEG" and img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")   # JPEG 只接受 RGB/L
                elif save_format == "GIF" and img.mode != "P":
                    img = img.convert("P")     # GIF 只接受调色板 P
                buf = io.BytesIO()
                img.save(buf, format=save_format, **save_kwargs)  # Pillow 编码写入内存
                converted_data = buf.getvalue()

            # ---- 写入磁盘 ----
            target_ext = get_target_extension(params.target_format)  # 如 "webp"→".webp"
            converted_name = change_extension(filename, target_ext)  # 如 "a.jpg"→"a.webp"
            out_path = task_dir / converted_name
            counter = 1
            while out_path.exists():                          # 处理重名：追加 _1, _2...
                stem = Path(filename).stem
                converted_name = f"{stem}_{counter}{target_ext}"
                out_path = task_dir / converted_name
                counter += 1
            out_path.write_bytes(converted_data)              # 写入磁盘

            converted_size = len(converted_data)
            converted_resolution = f"{img.width}×{img.height}"
            size_ratio = round(converted_size / original_size, 4) if original_size > 0 else 0.0

            return {
                "index": index, "original_name": filename,
                "converted_name": converted_name, "original_format": original_format,
                "target_format": params.target_format.lstrip("."),
                "original_size": original_size, "converted_size": converted_size,
                "original_resolution": original_resolution,
                "converted_resolution": converted_resolution,
                "size_ratio": size_ratio, "status": "success", "error": None,
            }

        except Exception as e:
            base_result["error"] = f"转换失败: {str(e)}"
            return base_result

    # ==========================================================================
    # 图片打开（含 HEIF/AVIF/SVG 特殊处理）
    # ==========================================================================

    def _open_image(self, data: bytes, detected_format: str, filename: str) -> Image.Image:
        """根据检测到的格式选择合适的打开方式。

        特殊路径：HEIF（pillow-heif 注册 opener）、AVIF（pyavif 临时文件解码）、
        SVG（cairosvg 渲染为 PNG）。其余走 Pillow 原生 Image.open。
        """
        if detected_format == "HEIF":                     # HEIF/HEIC：需要 pillow-heif 插件
            try:
                from pillow_heif import register_heif_opener
                register_heif_opener()                    # 注册后 Pillow 可直接 open HEIF
            except ImportError:
                raise RuntimeError("pillow-heif 未安装，无法读取 HEIF/HEIC 文件")

        if detected_format == "AVIF":                     # AVIF：pyavif 解码
            return self._open_avif(data)

        if detected_format == "SVG":                      # SVG：cairosvg 渲染为位图
            try:
                import cairosvg
                from xml.etree import ElementTree
                svg_kwargs = {}
                try:  # 解析 viewBox/width，仅在自然尺寸 >4096 时才限制渲染宽度
                    root = ElementTree.fromstring(data)   # 解析 SVG XML
                    vb = root.get("viewBox")              # viewBox="min-x min-y w h"
                    if vb:
                        parts = vb.split()
                        if len(parts) == 4:
                            nat_w, nat_h = float(parts[2]), float(parts[3])
                    else:                                 # 无 viewBox，尝试 width/height 属性
                        nat_w = float(root.get("width", 0))
                        nat_h = float(root.get("height", 0))
                    if nat_w > 4096 or nat_h > 4096:      # 仅超大图限制
                        svg_kwargs["output_width"] = 4096 # 宽度限制，高度等比
                except Exception:
                    pass                                  # XML 解析失败→走默认
                png_data = cairosvg.svg2png(bytestring=data, **svg_kwargs)  # 渲染 SVG→PNG 字节
                return Image.open(io.BytesIO(png_data))   # PNG 字节→Pillow Image
            except ImportError:
                raise RuntimeError("cairosvg 未安装，无法渲染 SVG 文件")

        # 通用路径：PNG/JPEG/WEBP/BMP/TIFF/GIF/ICO/PPM/PGM/PBM/TGA
        img = Image.open(io.BytesIO(data))                # 从内存字节打开
        img.load()                                         # 强制加载像素数据（避免惰性加载）
        return img

    # ==========================================================================
    # AVIF 解码（pyavif 需临时文件）
    # ==========================================================================

    def _open_avif(self, data: bytes) -> Image.Image:
        """pyavif 解码 AVIF：字节→临时文件→解码→numpy 数组→Pillow Image。

        pyavif 不支持内存流输入，必须写临时文件。
        """
        try:
            import pyavif
        except ImportError:
            raise RuntimeError("pyavif 未安装，无法读取 AVIF 文件")
        tmp_path = None                                   # 临时文件路径，finally 清理
        try:
            fd, tmp_path = tempfile.mkstemp(suffix=".avif")  # 创建临时文件，返回 (fd, path)
            os.close(fd)                                     # 关闭 fd（用 open 写）
            with open(tmp_path, "wb") as f:
                f.write(data)                                # 写入 AVIF 字节
            decoder = pyavif.Decoder()
            decoder.init(tmp_path)                           # 从文件初始化解码器
            count = decoder.get_image_count()                # 图片数量（序列图）
            if count == 0:
                raise RuntimeError("AVIF 文件中无图像")
            img_data = decoder.get_image(0)                  # 取第一帧（numpy 数组）
            has_alpha = decoder.has_alpha()                  # 是否有 alpha 通道
            mode = "RGBA" if has_alpha else "RGB"
            return Image.fromarray(img_data, mode)           # numpy→Pillow
        finally:
            if tmp_path:
                try:
                    os.unlink(tmp_path)                      # 删除临时文件
                except OSError:
                    pass

    # ==========================================================================
    # SVG 矢量化输出
    # ==========================================================================

    def _save_as_svg(
        self, img: Image.Image, quality: Optional[int] = None,
        background_color: str = "#FFFFFF",
    ) -> bytes:
        """将位图矢量化输出为真正的 SVG 矢量路径。

        颜色量化 + 连通区域轮廓提取 → SVG <path> 元素。
        quality 控制颜色量化层级（越高越精细、路径越多、文件越大）。
        """
        # ---- 处理透明：用 background_color 填充 alpha 区域 ----
        if img.mode in ("RGBA", "LA", "PA") or (
            img.mode == "P" and "transparency" in (img.info or {})
        ):
            bg = Image.new("RGB", img.size, background_color)  # 纯色 RGB 背景
            if img.mode == "RGBA":
                bg.paste(img, mask=img.split()[3])  # alpha 通道做遮罩
            elif img.mode in ("LA", "PA"):
                bg.paste(img.convert("RGBA"), mask=img.convert("RGBA").split()[3])
            else:
                bg.paste(img)
            img = bg                                        # 替换为无透明的 RGB 图
        elif img.mode not in ("RGB",):
            img = img.convert("RGB")                       # 统一为 RGB

        arr = np.array(img)                                # (h, w, 3) uint8 数组
        h, w = arr.shape[:2]

        # ---- 颜色量化：连续颜色→离散层级 ----
        # quality 0–100 → levels 3–16。桶大小 = 256 // levels
        levels = max(3, min(16, round((quality or 85) * 16 / 100)))
        bucket = 256 // levels                              # 量化桶大小
        q_arr = (arr // bucket) * (256 // (levels - 1))    # 整除归并 → 映射回色域
        q_arr = np.clip(q_arr, 0, 255).astype(np.uint8)    # 钳位防溢出

        paths: list[str] = []                               # 收集 SVG <path> 元素
        seen_colors: set[tuple] = set()                     # 已处理的量化色调

        for y in range(0, h, 2):                            # 步长 2 采样（相邻像素通常同色）
            for x in range(0, w, 2):
                color = tuple(q_arr[y, x].tolist())         # 量化色 RGB 元组
                if color in seen_colors:                     # 已处理→跳过
                    continue
                seen_colors.add(color)
                ref_color = q_arr[y, x]                     # 当前像素的量化色值
                # 生成二值 mask（True=该颜色的像素）
                mask = np.all(q_arr == ref_color, axis=2) if q_arr.ndim == 3 else (q_arr == ref_color)
                if not mask.any():
                    continue
                contours = self._trace_contours(mask)       # 提取该颜色的所有轮廓
                if not contours:
                    continue
                hex_color = "#{:02x}{:02x}{:02x}".format(*color)  # #RRGGBB
                for contour in contours:
                    if len(contour) < 3:                    # 至少 3 个点才能闭合
                        continue
                    # 构建 SVG path d 属性：M=moveto L=lineto Z=closepath
                    d_parts = [f"M{contour[0][0]},{contour[0][1]}"]  # 起始点
                    for px, py in contour[1:]:
                        d_parts.append(f"L{px},{py}")       # 连线到后续点
                    d_parts.append("Z")                      # 闭合路径
                    paths.append(
                        f'<path d="{" ".join(d_parts)}" fill="{hex_color}"'
                        f' stroke="{hex_color}" stroke-width="1"/>'  # 同色描边消除间隙
                    )

        svg_body = "\n  ".join(paths) if paths else (
            f'<rect width="{w}" height="{h}" fill="{background_color}"/>'  # 无路径=纯色图
        )
        svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg"'
            f' width="{w}" height="{h}" viewBox="0 0 {w} {h}">\n'
            f'  {svg_body}\n</svg>'
        )
        return svg.encode("utf-8")

    @staticmethod
    def _trace_contours(mask: "np.ndarray") -> list[list[tuple[int, int]]]:
        """从二值 mask 提取连通区域外轮廓（BFS + 边界点极角排序 + 采样简化）。"""
        contours: list[list[tuple[int, int]]] = []
        visited = np.zeros_like(mask, dtype=bool)          # BFS 访问标记
        h, w = mask.shape
        dirs = [(-1, 0), (-1, 1), (0, 1), (1, 1),         # 8-邻域方向
                (1, 0), (1, -1), (0, -1), (-1, -1)]

        for y in range(h):
            for x in range(w):
                if not mask[y, x] or visited[y, x]:        # 非目标色或已访问→跳过
                    continue
                # BFS flood-fill：找该颜色的连通区域
                region: list[tuple[int, int]] = []
                stack = [(y, x)]
                visited[y, x] = True
                while stack:
                    cy, cx = stack.pop()
                    region.append((cx, cy))                 # 存入 (x, y)
                    for dy, dx in dirs:
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = True
                            stack.append((ny, nx))

                # 提取边界点：4-邻域不全在区域内=边界
                boundary: set[tuple[int, int]] = set()
                for (cx, cy) in region:
                    if cx == 0 or cx == w - 1 or cy == 0 or cy == h - 1:  # 图像边缘
                        boundary.add((cx, cy))
                    elif not all(mask[cy + dy, cx + dx] for dy, dx in
                                 [(0, 1), (0, -1), (1, 0), (-1, 0)]):   # 4-邻域有缺口
                        boundary.add((cx, cy))
                if len(boundary) < 3:                       # 点数不足→跳过
                    continue

                # 极角排序 + 采样简化
                centroid = (sum(p[0] for p in boundary) / len(boundary),
                           sum(p[1] for p in boundary) / len(boundary))
                sorted_boundary = sorted(boundary,
                    key=lambda p: math.atan2(p[1] - centroid[1], p[0] - centroid[0]))
                step = max(1, len(sorted_boundary) // 128)  # 保留约 128 点
                simplified = sorted_boundary[::step]
                if simplified[-1] != simplified[0]:          # 确保闭合
                    simplified.append(simplified[0])
                contours.append(simplified)

        return contours

    # ==========================================================================
    # 色彩模式转换
    # ==========================================================================

    def _apply_color_mode(
        self, img: Image.Image, target_mode: str,
        background_color: str = "#FFFFFF",
    ) -> Image.Image:
        """将图片转换为目标色彩模式。

        三条路径：调色板→中间 RGB、含 alpha→背景填充、标准 convert。
        """
        current = img.mode
        # P（调色板）→ 先转 RGB 或 RGBA（视是否含透明索引）
        if current == "P":
            img = img.convert("RGBA" if "transparency" in (img.info or {}) else "RGB")
            current = img.mode                              # 更新，后续分支继续处理

        # RGBA/LA → RGB/L/1：用背景色填充透明区域
        if current in ("RGBA", "LA") and target_mode in ("RGB", "L", "1"):
            bg = Image.new("RGB", img.size, background_color)
            if current == "RGBA":
                bg.paste(img, mask=img.split()[3])          # alpha 通道做遮罩
            else:  # LA
                bg.paste(img, mask=img.split()[1])
            img = bg
            if target_mode != "RGB":
                img = img.convert(target_mode)
            return img

        # PA → RGB/L/1：先转 RGBA 再合成
        if current == "PA" and target_mode in ("RGB", "L", "1"):
            bg = Image.new("RGB", img.size, background_color)
            bg.paste(img.convert("RGBA"), mask=img.convert("RGBA").split()[3])
            img = bg
            if target_mode != "RGB":
                img = img.convert(target_mode)
            return img

        # 标准转换：模式不同→Pillow convert
        if current != target_mode:
            img = img.convert(target_mode)
        return img

    # ==========================================================================
    # 裁剪工具
    # ==========================================================================

    def _center_crop_square(self, img: Image.Image) -> Image.Image:
        """居中裁切为正方形（取短边边长），用于 ICO 预处理。"""
        w, h = img.size
        side = min(w, h)                                   # 短边作为边长
        left = (w - side) // 2                              # 水平居中偏移
        top = (h - side) // 2                               # 垂直居中偏移
        return img.crop((left, top, left + side, top + side))

    def _center_crop_to(self, img: Image.Image, target_w: int, target_h: int) -> Image.Image:
        """居中裁切到指定尺寸，用于 fill 模式第二步。"""
        w, h = img.size
        left = max(0, (w - target_w) // 2)                  # max 防负偏移
        top = max(0, (h - target_h) // 2)
        right = min(w, left + target_w)                     # min 防出界
        bottom = min(h, top + target_h)
        return img.crop((left, top, right, bottom))

    # ==========================================================================
    # 下载
    # ==========================================================================

    def get_file_path(self, task_id: str, index: int) -> Optional[Path]:
        """根据 task_id 和序号返回单个文件路径，供下载端点调用。"""
        stored = self._tasks.get(task_id, [])               # 查任务列表
        if index < 0 or index >= len(stored):               # 序号越界
            return None
        return stored[index].path                           # 返回磁盘路径

    def get_zip_path(self, task_id: str) -> Optional[Path]:
        """根据 task_id 返回 batch.zip 路径，供批量下载端点调用。"""
        if task_id not in self._tasks:                      # 任务不存在或已过期
            return None
        zip_path = OUTPUT_DIR / task_id / "batch.zip"
        if zip_path.exists():                               # 文件确实存在
            return zip_path
        return None

    # ==========================================================================
    # 清理
    # ==========================================================================

    def _schedule_cleanup(self, task_id: str, task_dir: Path):
        """延迟清理：10 分钟后删除任务临时目录和内存引用。"""

        async def _clean():
            await asyncio.sleep(TASK_CLEANUP_SECONDS)      # 等 600 秒
            if task_dir.exists():
                shutil.rmtree(task_dir, ignore_errors=True) # 删目录
            self._tasks.pop(task_id, None)                  # 清内存引用

        loop = asyncio.get_running_loop()
        loop.create_task(_clean())                          # 非阻塞后台协程
