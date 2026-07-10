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
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass, field

import numpy as np
from PIL import Image, ImageOps
from PIL.Image import Resampling

from app.utils.PictureUtils import (
    detect_format_by_magic,
    is_supported_input,
    get_pillow_format,
    get_output_extension,
    get_target_extension,
    change_extension,
    calculate_resize,
    resolve_color_mode,
    get_save_kwargs,
    FORMAT_DETAILS,
    INPUT_EXTENSIONS,
    OUTPUT_FORMAT_NAMES,
)
from app.core.config import WRITABLE_DIR

# ============================================================================
# 常量
# ============================================================================

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_FILES = 50
TASK_CLEANUP_SECONDS = 600  # 10 分钟
MAX_TASKS = 64  # _tasks 字典最大容量，超出时淘汰最旧条目

# 临时输出目录
OUTPUT_DIR = WRITABLE_DIR / "temp" / "picture_conversions"

# PIL 操作线程池（CPU 密集型，避免阻塞事件循环）
_PIL_EXECUTOR = ThreadPoolExecutor(max_workers=2, thread_name_prefix="pil-")


# ============================================================================
# 内部数据结构
# ============================================================================


@dataclass
class ConversionParams:
    """一次批量转换的参数（已规范化）。"""

    target_format: str
    quality: Optional[int]
    lossless: bool
    resize_mode: str
    max_width: Optional[int]
    max_height: Optional[int]
    width: Optional[int]
    height: Optional[int]
    keep_aspect_ratio: bool
    background_color: str
    color_mode: str
    strip_metadata: bool


@dataclass
class StoredFile:
    """转换完成的文件引用。"""

    path: Path
    converted_name: str
    converted_size: int
    converted_resolution: str


class PictureService:
    """图片转换服务。"""

    # 任务存储（LRU，超出 MAX_TASKS 时淘汰最旧）
    _tasks: OrderedDict[str, List[StoredFile]] = OrderedDict()

    # ==========================================================================
    # 格式查询
    # ==========================================================================

    async def get_supported_formats(self) -> Dict[str, Any]:
        """返回所有支持的格式及其详情。"""
        details = {}
        for key, detail in FORMAT_DETAILS.items():
            details[key] = detail.to_dict()
        return {
            "input_formats": [ext.lstrip(".") for ext in INPUT_EXTENSIONS],
            "output_formats": OUTPUT_FORMAT_NAMES,
            "format_details": details,
        }

    # ==========================================================================
    # 转换入口
    # ==========================================================================

    async def convert_stream(
        self,
        uploads,  # List[UploadFile] — 有 read() 和 filename 的对象
        params: ConversionParams,
    ) -> Dict[str, Any]:
        """
        流式批量转换：逐文件读取→转换→释放，避免全量驻留内存。
        适用于 Web 多用户并发场景。
        """
        task_id = uuid.uuid4().hex[:12]
        results = []
        stored: List[StoredFile] = []

        task_dir = OUTPUT_DIR / task_id
        task_dir.mkdir(parents=True, exist_ok=True)

        for idx, f in enumerate(uploads):
            content = await f.read()
            filename = getattr(f, "filename", None) or "unknown"
            # PIL 操作放入线程池，避免阻塞事件循环
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                _PIL_EXECUTOR,
                self._convert_one_sync,
                idx,
                filename,
                content,
                params,
                task_dir,
            )
            results.append(result)
            # 释放文件字节引用
            del content
            if result["status"] == "success":
                stored.append(
                    StoredFile(
                        path=task_dir / result["converted_name"],
                        converted_name=result["converted_name"],
                        converted_size=result["converted_size"],
                        converted_resolution=result["converted_resolution"],
                    )
                )

        self._tasks[task_id] = stored
        # LRU 淘汰最旧任务
        while len(self._tasks) > MAX_TASKS:
            oldest_id, _ = self._tasks.popitem(last=False)
            oldest_dir = OUTPUT_DIR / oldest_id
            if oldest_dir.exists():
                shutil.rmtree(oldest_dir, ignore_errors=True)

        if len(stored) > 1:
            zip_path = task_dir / "batch.zip"
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for sf in stored:
                    zf.write(sf.path, sf.converted_name)

        self._schedule_cleanup(task_id, task_dir)

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
        """转换单个文件（同步，放入线程池执行以避免阻塞事件循环）。"""
        base_result = {
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
            "error": None,
        }

        # ---- 文件大小校验 ----
        if len(data) > MAX_FILE_SIZE:
            base_result["error"] = f"文件过大（>{MAX_FILE_SIZE // (1024 * 1024)}MB）"
            return base_result

        # ---- 格式检测 ----
        if not is_supported_input(filename):
            base_result["error"] = "不支持的图片格式"
            return base_result

        detected = detect_format_by_magic(data, filename)
        if detected is None:
            base_result["error"] = "无法识别图片格式"
            return base_result

        ext = Path(filename).suffix.lower()
        original_format = ext.lstrip(".")

        # ---- 打开图片 ----
        try:
            img = self._open_image(data, detected, filename)
        except Exception as e:
            base_result["error"] = f"文件损坏或无法打开: {str(e)}"
            return base_result

        original_size = len(data)
        original_resolution = f"{img.width}×{img.height}"

        try:
            # ---- 色彩模式 ----
            has_alpha = img.mode in ("RGBA", "LA", "PA") or (
                img.mode == "P" and "transparency" in (img.info or {})
            )
            target_pillow_fmt = (
                get_pillow_format(params.target_format) or params.target_format.upper()
            )
            target_mode = resolve_color_mode(
                img.mode, target_pillow_fmt, params.color_mode, has_alpha
            )

            if target_mode != img.mode:
                img = self._apply_color_mode(img, target_mode, params.background_color)

            # ---- GIF 动画处理：取首帧 ----
            if detected == "GIF" and getattr(img, "is_animated", False):
                import logging

                logging.getLogger("app.PictureService").warning(
                    f"GIF 动画 '{filename}' 包含 {getattr(img, 'n_frames', '?')} 帧，转换后仅保留首帧，其余帧将被丢弃"
                )
                img.seek(0)

            # ---- ICO 非方形预处理 ----
            if target_pillow_fmt == "ICO" and img.width != img.height:
                img = self._center_crop_square(img)

            # ---- 缩放 ----
            new_size = calculate_resize(
                img.width,
                img.height,
                params.resize_mode,
                params.max_width,
                params.max_height,
                params.width,
                params.height,
                params.keep_aspect_ratio,
            )
            if new_size != (img.width, img.height):
                img = img.resize(new_size, Resampling.LANCZOS)

            # 填充模式：等比缩放到填满后居中裁切
            if params.resize_mode == "fill" and params.max_width and params.max_height:
                img = self._center_crop_to(img, params.max_width, params.max_height)

            # ---- 移除元数据 ----
            if params.strip_metadata:
                # 清除 EXIF/XMP，但保留 icc_profile（色彩准确性）
                icc_profile = img.info.get("icc_profile")
                img.info.clear()
                if icc_profile:
                    img.info["icc_profile"] = icc_profile

            # ---- 保存 ----
            if target_pillow_fmt == "SVG":
                converted_data = self._save_as_svg(
                    img, params.quality, params.background_color
                )
            else:
                save_kwargs = get_save_kwargs(
                    params.target_format, params.quality, params.lossless
                )
                # 格式名
                if target_pillow_fmt == "JPEG":
                    save_format = "JPEG"
                else:
                    save_format = target_pillow_fmt

                # 确保输出模式与保存格式兼容
                if save_format == "JPEG" and img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                elif save_format == "GIF" and img.mode != "P":
                    img = img.convert("P")

                buf = io.BytesIO()
                img.save(buf, format=save_format, **save_kwargs)
                converted_data = buf.getvalue()

            # ---- 写入磁盘 ----
            target_ext = get_target_extension(params.target_format)
            converted_name = change_extension(filename, target_ext)
            out_path = task_dir / converted_name
            # 处理重名
            counter = 1
            while out_path.exists():
                stem = Path(filename).stem
                converted_name = f"{stem}_{counter}{target_ext}"
                out_path = task_dir / converted_name
                counter += 1
            out_path.write_bytes(converted_data)

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
            }

        except Exception as e:
            base_result["error"] = f"转换失败: {str(e)}"
            return base_result

    # ==========================================================================
    # 图片打开（含 HEIF/AVIF/SVG 特殊处理）
    # ==========================================================================

    def _open_image(
        self, data: bytes, detected_format: str, filename: str
    ) -> Image.Image:
        """根据检测格式选择合适的打开方式。"""
        if detected_format == "HEIF":
            try:
                from pillow_heif import register_heif_opener

                register_heif_opener()
            except ImportError:
                raise RuntimeError("pillow-heif 未安装，无法读取 HEIF/HEIC 文件")

        if detected_format == "AVIF":
            return self._open_avif(data)

        if detected_format == "SVG":
            try:
                import cairosvg
                from xml.etree import ElementTree

                svg_kwargs = {}
                # 解析 viewBox/width，仅当自然尺寸 > 4096 时才限制
                try:
                    root = ElementTree.fromstring(data)
                    vb = root.get("viewBox")
                    if vb:
                        parts = vb.split()
                        if len(parts) == 4:
                            nat_w, nat_h = float(parts[2]), float(parts[3])
                    else:
                        nat_w = float(root.get("width", 0))
                        nat_h = float(root.get("height", 0))
                    if nat_w > 4096 or nat_h > 4096:
                        svg_kwargs["output_width"] = 4096
                except Exception:
                    pass  # 解析失败走默认

                png_data = cairosvg.svg2png(bytestring=data, **svg_kwargs)
                return Image.open(io.BytesIO(png_data))
            except ImportError:
                raise RuntimeError("cairosvg 未安装，无法渲染 SVG 文件")

        img = Image.open(io.BytesIO(data))
        # 确保像素数据已加载（避免惰性加载问题）
        img.load()
        return img

    # ==========================================================================
    # 色彩模式转换
    # ==========================================================================

    def _open_avif(self, data: bytes) -> Image.Image:
        """用 pyavif 解码 AVIF 字节为 Pillow Image（pyavif 仅支持文件路径，需临时文件）。"""
        try:
            import pyavif
        except ImportError:
            raise RuntimeError("pyavif 未安装，无法读取 AVIF 文件")
        tmp_path = None
        try:
            fd, tmp_path = tempfile.mkstemp(suffix=".avif")
            os.close(fd)
            with open(tmp_path, "wb") as f:
                f.write(data)
            decoder = pyavif.Decoder()
            decoder.init(tmp_path)
            count = decoder.get_image_count()
            if count == 0:
                raise RuntimeError("AVIF 文件中无图像")
            img_data = decoder.get_image(0)
            has_alpha = decoder.has_alpha()
            mode = "RGBA" if has_alpha else "RGB"
            return Image.fromarray(img_data, mode)
        finally:
            if tmp_path:
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

    def _save_as_svg(
        self,
        img: Image.Image,
        quality: Optional[int] = None,
        background_color: str = "#FFFFFF",
    ) -> bytes:
        """将位图矢量化输出为真正的 SVG 矢量路径。

        使用 marching squares 提取各颜色层的轮廓，生成 <path> 元素。
        quality 控制颜色量化的层级数（越高 → 越精细、路径越多、文件越大）。
        """
        # 处理透明：用 background_color 填充
        if img.mode in ("RGBA", "LA", "PA") or (
            img.mode == "P" and "transparency" in (img.info or {})
        ):
            bg = Image.new("RGB", img.size, background_color)
            if img.mode == "RGBA":
                bg.paste(img, mask=img.split()[3])
            elif img.mode in ("LA", "PA"):
                bg.paste(img.convert("RGBA"), mask=img.convert("RGBA").split()[3])
            else:
                bg.paste(img)
            img = bg
        elif img.mode not in ("RGB",):
            img = img.convert("RGB")

        arr = np.array(img)
        h, w = arr.shape[:2]

        # 颜色量化：quality 映射为颜色层级数（3–16）
        levels = max(3, min(16, round((quality or 85) * 16 / 100)))
        q_arr = (arr // (256 // levels)) * (256 // (levels - 1))
        q_arr = np.clip(q_arr, 0, 255).astype(np.uint8)

        paths: list[str] = []
        seen_colors: set[tuple] = set()

        for y in range(0, h, 2):
            for x in range(0, w, 2):
                color = tuple(q_arr[y, x].tolist())
                if color in seen_colors:
                    continue
                seen_colors.add(color)
                # 生成该量化颜色的 mask（用量化后的值比对，不是原始值）
                ref_color = q_arr[y, x]
                mask = np.all(q_arr == ref_color, axis=2) if q_arr.ndim == 3 else (q_arr == ref_color)
                if not mask.any():
                    continue
                contours = self._trace_contours(mask)
                if not contours:
                    continue
                hex_color = "#{:02x}{:02x}{:02x}".format(*color)
                for contour in contours:
                    if len(contour) < 3:
                        continue
                    d_parts = [f"M{contour[0][0]},{contour[0][1]}"]
                    for px, py in contour[1:]:
                        d_parts.append(f"L{px},{py}")
                    d_parts.append("Z")
                    paths.append(
                        f'<path d="{" ".join(d_parts)}" fill="{hex_color}"'
                        f' stroke="{hex_color}" stroke-width="1"/>'
                    )

        svg_body = "\n  ".join(paths) if paths else (
            f'<rect width="{w}" height="{h}" fill="{background_color}"/>'
        )
        svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg"'
            f' width="{w}" height="{h}" viewBox="0 0 {w} {h}">\n'
            f'  {svg_body}\n'
            f'</svg>'
        )
        return svg.encode("utf-8")

    @staticmethod
    def _trace_contours(mask: "np.ndarray") -> list[list[tuple[int, int]]]:
        """从二值 mask 中提取连通区域的外轮廓（简化版 marching squares）。"""
        contours: list[list[tuple[int, int]]] = []
        visited = np.zeros_like(mask, dtype=bool)
        h, w = mask.shape

        # 8-邻域方向
        dirs = [(-1, 0), (-1, 1), (0, 1), (1, 1),
                (1, 0), (1, -1), (0, -1), (-1, -1)]

        for y in range(h):
            for x in range(w):
                if not mask[y, x] or visited[y, x]:
                    continue
                # BFS 找到该连通区域的所有点
                region: list[tuple[int, int]] = []
                stack = [(y, x)]
                visited[y, x] = True
                while stack:
                    cy, cx = stack.pop()
                    region.append((cx, cy))
                    for dy, dx in dirs:
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = True
                            stack.append((ny, nx))

                # 对该区域提取外轮廓（边界点，按角度排序）
                boundary: set[tuple[int, int]] = set()
                for (cx, cy) in region:
                    # 检查 4-邻域，如果任一不在区域内，该点为边界点
                    if (cx == 0 or cx == w - 1 or cy == 0 or cy == h - 1):
                        boundary.add((cx, cy))
                    elif not all(mask[cy + dy, cx + dx] for dy, dx in [(0, 1), (0, -1), (1, 0), (-1, 0)]):
                        boundary.add((cx, cy))

                if len(boundary) < 3:
                    continue

                # 按极角排序边界点形成闭合路径
                centroid = (sum(p[0] for p in boundary) / len(boundary),
                           sum(p[1] for p in boundary) / len(boundary))
                sorted_boundary = sorted(boundary,
                    key=lambda p: math.atan2(p[1] - centroid[1], p[0] - centroid[0]))
                # 简化：保留每第 N 个点
                step = max(1, len(sorted_boundary) // 128)
                simplified = sorted_boundary[::step]
                if simplified[-1] != simplified[0]:
                    simplified.append(simplified[0])
                contours.append(simplified)

        return contours

    def _apply_color_mode(
        self,
        img: Image.Image,
        target_mode: str,
        background_color: str = "#FFFFFF",
    ) -> Image.Image:
        """将图片转换为目标色彩模式。"""
        current = img.mode

        # 调色板 → RGB 作为中间步骤
        if current == "P":
            img = img.convert("RGBA" if "transparency" in (img.info or {}) else "RGB")
            current = img.mode

        # RGBA/LA → RGB（填充背景色）
        if current in ("RGBA", "LA") and target_mode in ("RGB", "L", "1"):
            bg = Image.new("RGB", img.size, background_color)
            if current == "RGBA":
                bg.paste(img, mask=img.split()[3])
            else:
                bg.paste(img, mask=img.split()[1])
            img = bg
            if target_mode != "RGB":
                img = img.convert(target_mode)
            return img

        # PA → RGB（填充背景色）
        if current == "PA" and target_mode in ("RGB", "L", "1"):
            bg = Image.new("RGB", img.size, background_color)
            bg.paste(img.convert("RGBA"), mask=img.convert("RGBA").split()[3])
            img = bg
            if target_mode != "RGB":
                img = img.convert(target_mode)
            return img

        # 标准转换
        if current != target_mode:
            img = img.convert(target_mode)

        return img

    # ==========================================================================
    # 裁剪工具
    # ==========================================================================

    def _center_crop_square(self, img: Image.Image) -> Image.Image:
        """居中裁切为正方形（取较短边）。"""
        w, h = img.size
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        return img.crop((left, top, left + side, top + side))

    def _center_crop_to(
        self, img: Image.Image, target_w: int, target_h: int
    ) -> Image.Image:
        """居中裁切到指定尺寸。"""
        w, h = img.size
        left = max(0, (w - target_w) // 2)
        top = max(0, (h - target_h) // 2)
        right = min(w, left + target_w)
        bottom = min(h, top + target_h)
        return img.crop((left, top, right, bottom))

    # ==========================================================================
    # 下载
    # ==========================================================================

    def get_file_path(self, task_id: str, index: int) -> Optional[Path]:
        """获取单个转换结果的文件路径。"""
        stored = self._tasks.get(task_id, [])
        if index < 0 or index >= len(stored):
            return None
        return stored[index].path

    def get_zip_path(self, task_id: str) -> Optional[Path]:
        """获取批量 zip 文件路径。"""
        if task_id not in self._tasks:
            return None
        zip_path = OUTPUT_DIR / task_id / "batch.zip"
        if zip_path.exists():
            return zip_path
        return None

    # ==========================================================================
    # 清理
    # ==========================================================================

    def _schedule_cleanup(self, task_id: str, task_dir: Path):
        """在事件循环中延迟清理任务文件（必须在 async 上下文中调用）。"""

        async def _clean():
            await asyncio.sleep(TASK_CLEANUP_SECONDS)
            if task_dir.exists():
                shutil.rmtree(task_dir, ignore_errors=True)
            self._tasks.pop(task_id, None)

        loop = asyncio.get_running_loop()
        loop.create_task(_clean())
