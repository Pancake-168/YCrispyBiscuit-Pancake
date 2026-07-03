"""
图片转换工具函数 —— 格式映射、魔数检测、MIME 映射、尺寸计算。

纯函数，无副作用，不依赖 FastAPI 或数据库。
"""

from typing import Optional, Tuple, Dict, Any, List
from pathlib import Path


# ============================================================================
# 格式映射
# ============================================================================

# 扩展名 → Pillow 格式名
EXT_TO_FORMAT: Dict[str, str] = {
    ".png": "PNG",
    ".jpg": "JPEG",
    ".jpeg": "JPEG",
    ".webp": "WEBP",
    ".bmp": "BMP",
    ".tiff": "TIFF",
    ".tif": "TIFF",
    ".gif": "GIF",
    ".ico": "ICO",
    ".avif": "AVIF",
    ".heif": "HEIF",
    ".heic": "HEIF",
    ".svg": "SVG",
    ".ppm": "PPM",
    ".pgm": "PGM",
    ".pbm": "PBM",
    ".tga": "TGA",
}

# 输出格式（排除 HEIF/SVG——HEIF 仅读取，SVG Pillow 无法写入）
OUTPUT_FORMATS: Dict[str, str] = {
    k: v for k, v in EXT_TO_FORMAT.items() if v not in ("HEIF", "SVG")
}

# Pillow 格式名 → 标准扩展名（包含点）
FORMAT_TO_EXT: Dict[str, str] = {
    "PNG": ".png",
    "JPEG": ".jpg",
    "WEBP": ".webp",
    "BMP": ".bmp",
    "TIFF": ".tiff",
    "GIF": ".gif",
    "ICO": ".ico",
    "AVIF": ".avif",
    "SVG": ".svg",
    "PPM": ".ppm",
    "PGM": ".pgm",
    "PBM": ".pbm",
    "TGA": ".tga",
}

# 输入格式列表
INPUT_EXTENSIONS = sorted(EXT_TO_FORMAT.keys())
# 输出格式列表
OUTPUT_EXTENSIONS = sorted(OUTPUT_FORMATS.keys())


# ============================================================================
# MIME 类型
# ============================================================================

EXT_TO_MIME: Dict[str, str] = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".gif": "image/gif",
    ".ico": "image/vnd.microsoft.icon",
    ".avif": "image/avif",
    ".heif": "image/heif",
    ".heic": "image/heic",
    ".svg": "image/svg+xml",
    ".ppm": "image/x-portable-pixmap",
    ".pgm": "image/x-portable-graymap",
    ".pbm": "image/x-portable-bitmap",
    ".tga": "image/x-tga",
}


# ============================================================================
# 格式详情（供 GET /formats 返回）
# ============================================================================


class FormatDetail:
    """单个格式的元信息。"""

    def __init__(
        self,
        extensions: List[str],
        mime_type: str,
        supports_transparency: bool,
        supports_animation: bool,
        lossy_options: bool,
        quality_range: Optional[Tuple[int, int]],
        supports_lossless: bool = False,
    ):
        self.extensions = extensions
        self.mime_type = mime_type
        self.supports_transparency = supports_transparency
        self.supports_animation = supports_animation
        self.lossy_options = lossy_options
        self.quality_range = list(quality_range) if quality_range else None
        self.supports_lossless = supports_lossless

    def to_dict(self) -> Dict[str, Any]:
        return {
            "extensions": self.extensions,
            "mime_type": self.mime_type,
            "supports_transparency": self.supports_transparency,
            "supports_animation": self.supports_animation,
            "lossy_options": self.lossy_options,
            "quality_range": self.quality_range,
            "supports_lossless": self.supports_lossless,
        }


FORMAT_DETAILS: Dict[str, FormatDetail] = {
    "png": FormatDetail([".png"], "image/png", True, False, False, None),
    "jpeg": FormatDetail([".jpg", ".jpeg"], "image/jpeg", False, False, True, (1, 100)),
    "webp": FormatDetail([".webp"], "image/webp", True, True, True, (0, 100), supports_lossless=True),
    "bmp": FormatDetail([".bmp"], "image/bmp", False, False, False, None),
    "tiff": FormatDetail([".tiff", ".tif"], "image/tiff", True, False, False, None),
    "gif": FormatDetail([".gif"], "image/gif", True, True, False, None),
    "ico": FormatDetail([".ico"], "image/vnd.microsoft.icon", True, False, False, None),
    "heif": FormatDetail([".heif", ".heic"], "image/heif", True, False, True, (0, 100)),
    "avif": FormatDetail(
        [".avif"], "image/avif", True, False, True, (0, 100)
    ),  # 通过 pyavif 读写
    "svg": FormatDetail([".svg"], "image/svg+xml", True, False, False, None),
    "ppm": FormatDetail([".ppm"], "image/x-portable-pixmap", False, False, False, None),
    "pgm": FormatDetail(
        [".pgm"], "image/x-portable-graymap", False, False, False, None
    ),
    "pbm": FormatDetail([".pbm"], "image/x-portable-bitmap", False, False, False, None),
    "tga": FormatDetail([".tga"], "image/x-tga", True, False, False, None),
}


# ============================================================================
# 格式检测（文件头魔数）
# ============================================================================

# 魔数字节签名 → 格式名
MAGIC_SIGNATURES: Dict[bytes, str] = {
    b"\x89PNG\r\n\x1a\n": "PNG",
    b"\xff\xd8\xff": "JPEG",
    b"RIFF": "WEBP",  # 后面 8 字节是 "WEBP"，但先靠 RIFF 做初步判断
    b"BM": "BMP",
    b"MM\x00\x2a": "TIFF",  # big-endian TIFF
    b"II\x2a\x00": "TIFF",  # little-endian TIFF
    b"GIF8": "GIF",
    b"\x00\x00\x01\x00": "ICO",
    # AVIF 是 ISOBMFF 容器，魔数与 HEIF 相同
    # HEIF/HEIC 也走 ISOBMFF，这里用 ftyp box 做进一步区分
    b"<?xml": "SVG",
    b"<svg": "SVG",
    b"P6\n": "PPM",  # binary PPM
    b"P3\n": "PPM",  # ASCII PPM
    b"P5\n": "PGM",
    b"P2\n": "PGM",
    b"P4\n": "PBM",
    b"P1\n": "PBM",
    # TGA 没有标准魔数，最后 18 字节的 footer 含 "TRUEVISION-XFILE"
}


def detect_format_by_magic(data: bytes, filename: str = "") -> Optional[str]:
    """
    通过文件头魔数检测图片格式。
    优先魔数，失败时回退到扩展名。
    """
    if len(data) < 4:
        return _detect_by_extension(filename)

    # 按最长匹配排序
    for magic, fmt in sorted(MAGIC_SIGNATURES.items(), key=lambda x: -len(x[0])):
        if data.startswith(magic):
            if fmt == "WEBP" and len(data) >= 12:
                if data[8:12] != b"WEBP":
                    continue
            return fmt

    # ISOBMFF 容器检测（AVIF / HEIF / HEIC）
    if len(data) >= 12 and data[4:8] == b"ftyp":
        brand = data[8:12]
        if brand in (b"avif", b"avis"):
            return "AVIF"
        if brand in (b"heic", b"heix", b"hevc", b"hevx", b"mif1"):
            return "HEIF"

    # TGA footer 检测（文件末尾 18 字节）
    if len(data) >= 18 and data[-18:-2] == b"TRUEVISION-XFILE":
        return "TGA"

    return _detect_by_extension(filename)


def _detect_by_extension(filename: str) -> Optional[str]:
    """通过文件扩展名推断格式。"""
    if not filename:
        return None
    ext = Path(filename).suffix.lower()
    return EXT_TO_FORMAT.get(ext)


def is_supported_input(filename: str) -> bool:
    """检查文件扩展名是否为支持的输入格式。"""
    ext = Path(filename).suffix.lower()
    return ext in EXT_TO_FORMAT


# ============================================================================
# 尺寸计算
# ============================================================================


def calculate_resize(
    orig_w: int,
    orig_h: int,
    resize_mode: str,
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    target_width: Optional[int] = None,
    target_height: Optional[int] = None,
    keep_aspect_ratio: bool = True,
) -> Tuple[int, int]:
    """
    根据缩放模式计算目标尺寸。
    返回 (new_width, new_height)。
    """
    if resize_mode == "none":
        return orig_w, orig_h

    if resize_mode == "exact" and target_width and target_height:
        if keep_aspect_ratio:
            return _fit_into(orig_w, orig_h, target_width, target_height)
        return target_width, target_height

    if resize_mode == "fit" and max_width and max_height:
        return _fit_into(orig_w, orig_h, max_width, max_height)

    if resize_mode == "fill" and max_width and max_height:
        return _fill_into(orig_w, orig_h, max_width, max_height)

    # 部分参数缺失时回退到不缩放
    return orig_w, orig_h


def _fit_into(orig_w: int, orig_h: int, bound_w: int, bound_h: int) -> Tuple[int, int]:
    """等比缩放，使图片完整容纳在边界内。"""
    ratio = min(bound_w / orig_w, bound_h / orig_h)
    if ratio >= 1.0:
        return orig_w, orig_h
    return max(1, round(orig_w * ratio)), max(1, round(orig_h * ratio))


def _fill_into(orig_w: int, orig_h: int, bound_w: int, bound_h: int) -> Tuple[int, int]:
    """等比缩放，使短边至少达到边界尺寸（超出部分将被裁剪）。"""
    ratio = max(bound_w / orig_w, bound_h / orig_h)
    if ratio <= 0:
        return orig_w, orig_h
    return max(1, round(orig_w * ratio)), max(1, round(orig_h * ratio))


# ============================================================================
# 色彩模式处理
# ============================================================================


def resolve_color_mode(
    img_mode: str,
    target_format: str,
    requested_mode: str,
    has_transparency: bool,
) -> str:
    """
    根据目标格式和用户请求确定输出色彩模式。

    规则：
    - JPEG/BMP 不支持 alpha，强制转 RGB（如有透明则填充背景色）
    - GIF 仅支持调色板模式 P
    - 用户明确指定时不自动调整（除非格式不支持）
    """
    # 格式本身不支持透明 → 丢弃 alpha
    no_alpha_formats = {"JPEG", "BMP", "GIF", "PPM", "PBM"}
    # 格式只支持调色板
    palette_only = {"GIF"}
    # 格式只支持灰度
    gray_only = {"PGM"}

    if requested_mode != "auto":
        # 用户指定了模式，验证是否兼容
        if requested_mode == "RGBA" and target_format in no_alpha_formats:
            return "RGB"  # 格式不支持透明，降级
        if requested_mode in ("RGBA", "RGB", "L") and target_format in palette_only:
            return "P"
        if requested_mode in ("RGBA", "RGB", "P") and target_format in gray_only:
            return "L"
        return requested_mode

    # auto 模式
    if target_format in palette_only:
        return "P"
    if target_format in gray_only:
        return "L"
    if target_format in no_alpha_formats:
        if img_mode in ("RGBA", "LA", "PA") or has_transparency:
            return "RGB"
        return img_mode if img_mode in ("RGB", "L", "1") else "RGB"

    # 支持透明通道的格式：保留原样
    return img_mode


# ============================================================================
# 格式名规范化
# ============================================================================


def get_pillow_format(ext: str) -> Optional[str]:
    """扩展名 → Pillow 格式名。"""
    return EXT_TO_FORMAT.get(ext.lower())


def get_output_extension(pillow_format: str) -> str:
    """Pillow 格式名 → 标准扩展名。"""
    return FORMAT_TO_EXT.get(pillow_format, ".png")


def get_target_extension(target_format: str) -> str:
    """用户输入的目标格式 → 标准扩展名（含点）。"""
    target = target_format.lower().lstrip(".")
    return f".{target}"


def change_extension(filename: str, new_ext: str) -> str:
    """替换文件扩展名。"""
    stem = Path(filename).stem
    return f"{stem}{new_ext}"


# ============================================================================
# 格式保存参数
# ============================================================================


def get_save_kwargs(
    target_format: str,
    quality: Optional[int] = None,
    lossless: bool = False,
    optimize: bool = True,
) -> Dict[str, Any]:
    """
    根据目标格式返回 Pillow save() 的参数。
    """
    fmt = get_pillow_format(target_format)
    if fmt is None:
        fmt = target_format.upper()

    kwargs: Dict[str, Any] = {}

    if fmt == "JPEG":
        if quality is not None:
            kwargs["quality"] = max(1, min(100, quality))
        kwargs["optimize"] = optimize
    elif fmt == "WEBP":
        if lossless:
            kwargs["lossless"] = True
        elif quality is not None:
            kwargs["quality"] = max(0, min(100, quality))
        kwargs["method"] = 6  # 最慢但压缩率最高
    elif fmt == "AVIF":
        if quality is not None:
            kwargs["quality"] = max(0, min(100, quality))
    elif fmt == "PNG":
        kwargs["optimize"] = optimize
    elif fmt == "TIFF":
        kwargs["compression"] = "tiff_lzw"
    elif fmt == "TGA":
        kwargs["compress"] = True
    elif fmt == "GIF":
        kwargs["optimize"] = optimize

    return kwargs
