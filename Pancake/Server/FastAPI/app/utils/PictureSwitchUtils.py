"""
图片转换工具函数 —— 格式映射、魔数检测、MIME 映射、尺寸计算。

纯函数，无副作用，不依赖 FastAPI 或数据库。
"""

import math  # 向上取整（fill 模式保证至少填满边界）

from typing import Optional, Tuple, Dict, Any, List
from pathlib import Path


# ============================================================================
# 格式映射
# ============================================================================

# 扩展名 → Pillow 格式名
# key 都带前导点（如 ".png"），用于输入文件的扩展名检测和魔数回退
# value 是 Pillow 原生格式名（如 "PNG"），传给 Image.open()/save() 的 format 参数
"""
"魔数"就是文件头固定字节签名，用来识别文件的真实格式，不依赖扩展名。
MAGIC_SIGNATURES: Dict[bytes, str] = {
    b"\x89PNG\r\n\x1a\n": "PNG",    # PNG 文件固定以这 8 个字节开头
    b"\xff\xd8\xff": "JPEG",         # JPEG 以 0xFF 0xD8 0xFF 开头
    b"GIF8": "GIF",                  # GIF 以 "GIF8" 开头
    b"BM": "BMP",                    # BMP 前 2 字节是 "BM"
    ...
}

比如有人把一个 PNG 文件改名叫 photo.jpg，靠扩展名判断就会误认为是 JPEG。
但读文件头几个字节发现是 \x89PNG\r\n\x1a\n，就知道它其实是 PNG。

"""
EXT_TO_FORMAT: Dict[str, str] = {
    ".png": "PNG",
    ".jpg": "JPEG",  # JPEG 有两种常见扩展名，都映射到同一个 Pillow 格式
    ".jpeg": "JPEG",
    ".webp": "WEBP",
    ".bmp": "BMP",
    ".tiff": "TIFF",  # TIFF 也有两种扩展名变体
    ".tif": "TIFF",
    ".gif": "GIF",
    ".ico": "ICO",
    ".avif": "AVIF",
    ".heif": "HEIF",  # HEIF/HEIC 仅读取，不在 OUTPUT_FORMATS 中
    ".heic": "HEIF",
    ".svg": "SVG",
    ".ppm": "PPM",
    ".pgm": "PGM",
    ".pbm": "PBM",
    ".tga": "TGA",
}

# 格式名 → 小写扩展名标识（不带点）的反向映射，用于报告图片的真实解码格式
# 例："JPEG" → "jpeg"；jpg/jpeg 同值，后写的覆盖先写，取其中一个即可
FORMAT_TO_EXT: Dict[str, str] = {}
for _ext, _fmt in EXT_TO_FORMAT.items():
    FORMAT_TO_EXT[_fmt] = _ext.lstrip(".")


# 输出格式（排除 HEIF——HEIF 仅读取）
# 从 EXT_TO_FORMAT 过滤，保留的值（Pillow 格式名）去重后形成输出格式集合
# 过滤条件：v != "HEIF"，即只要不是 HEIF 就保留；SVG 被保留，走 _save_as_svg 矢量化路径
OUTPUT_FORMATS: Dict[str, str] = {}
for k, v in EXT_TO_FORMAT.items():
    if v != "HEIF":
        OUTPUT_FORMATS[k] = v

# 输入格式列表
# sorted() 保证列表顺序稳定，方便调试和前端展示
# 元素是带点的扩展名（如 ".png"），前端 input_formats 字段会 lstrip(".") 去掉点后返回
INPUT_EXTENSIONS = sorted(EXT_TO_FORMAT.keys())

# 输出格式名称列表（保留所有扩展名变体，用于 output_formats 字段，与 FORMAT_DETAILS 的 key 对齐）
# 使用 OUTPUT_FORMATS.keys() 而非 values()，确保 jpg 和 jpeg、tif 和 tiff 都作为独立选项出现
# sorted() 保证顺序稳定
OUTPUT_FORMAT_NAMES = sorted(k.lstrip(".") for k in OUTPUT_FORMATS.keys())


# ============================================================================
# MIME 类型
# ============================================================================
# 扩展名 → MIME 类型
# 用于下载接口设置 Content-Type 响应头，让浏览器正确识别文件类型

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
    """单个格式的元信息。

    每个字段的含义和前端 UI 效果：
    - extensions:        该格式可用的文件扩展名列表（含点）
    - mime_type:         对应的 MIME 类型字符串
    - supports_transparency: 是否支持透明通道 → false 时前端显示背景填充色选择器
    - lossy_options:        是否有有损压缩选项   → true 时前端显示质量滑块
    - quality_range:        质量参数的有效范围   → 决定滑块 min/max，null 表示无质量参数
    - supports_lossless:    是否支持无损模式     → true 时前端显示"无损压缩/质量优先"切换开关
    """

    def __init__(
        self,
        extensions: List[str],
        mime_type: str,
        supports_transparency: bool,
        lossy_options: bool,
        quality_range: Optional[Tuple[int, int]],
        supports_lossless: bool = False,  # 默认不支持无损模式（大多数格式如此）
    ):
        self.extensions = extensions
        self.mime_type = mime_type
        self.supports_transparency = supports_transparency
        self.lossy_options = lossy_options
        # quality_range 可能是 tuple 或 None；转成 list 以匹配 Pydantic 模型的 List[int] 类型
        # 同时方便 JSON 序列化（tuple → list）
        self.quality_range = list(quality_range) if quality_range else None
        self.supports_lossless = supports_lossless

    def to_dict(self) -> Dict[str, Any]:
        """转为字典，供 Pydantic FormatDetail(**dict) 构造和 JSON 序列化。"""
        return {
            "extensions": self.extensions,
            "mime_type": self.mime_type,
            "supports_transparency": self.supports_transparency,
            "lossy_options": self.lossy_options,
            "quality_range": self.quality_range,
            "supports_lossless": self.supports_lossless,
        }


# 所有格式的元信息注册表
# key 是小写格式标识（如 "png"、"jpeg"），与前端 output_formats 和 target_format 对齐
# 这个字典在 GET /api/picture/formats 时序列化为 JSON 返回给前端

FORMAT_DETAILS: Dict[str, FormatDetail] = {
    # FormatDetail(extensions, mime_type, supports_transparency, lossy_options, quality_range, supports_lossless)
    "png": FormatDetail([".png"], "image/png", True, False, None),
    "jpg": FormatDetail([".jpg"], "image/jpeg", False, True, (1, 100)),
    "jpeg": FormatDetail([".jpeg"], "image/jpeg", False, True, (1, 100)),
    "webp": FormatDetail(
        [".webp"], "image/webp", True, True, (0, 100), supports_lossless=True
    ),
    "bmp": FormatDetail([".bmp"], "image/bmp", False, False, None),
    "tif": FormatDetail([".tif"], "image/tiff", True, False, None),
    "tiff": FormatDetail([".tiff"], "image/tiff", True, False, None),
    "gif": FormatDetail([".gif"], "image/gif", True, False, None),
    "ico": FormatDetail([".ico"], "image/vnd.microsoft.icon", True, False, None),
    "svg": FormatDetail([".svg"], "image/svg+xml", False, False, None),
    "ppm": FormatDetail([".ppm"], "image/x-portable-pixmap", False, False, None),
    "pgm": FormatDetail([".pgm"], "image/x-portable-graymap", False, False, None),
    "pbm": FormatDetail([".pbm"], "image/x-portable-bitmap", False, False, None),
    "tga": FormatDetail([".tga"], "image/x-tga", True, False, None),
    "avif": FormatDetail(
        [".avif"], "image/avif", True, True, (0, 100)
    ),  # 通过 pyavif 读取，Pillow 12.3 原生写入
}


# ============================================================================
# 格式检测（文件头魔数）
# ============================================================================

# 魔数字节签名 → 格式名
# 每个格式的文件头固定字节序列，用于在不依赖扩展名的情况下识别真实格式
# 检测顺序：按签名长度降序（长签名优先匹配），避免短签名误匹配长签名的前缀
MAGIC_SIGNATURES: Dict[bytes, str] = {
    b"\x89PNG\r\n\x1a\n": "PNG",  # PNG 固定 8 字节文件头
    b"\xff\xd8\xff": "JPEG",  # JPEG SOI 标记（0xFF 0xD8 0xFF）
    b"RIFF": "WEBP",  # WEBP 外层是 RIFF 容器，后面 8 字节需验证 "WEBP" 子标签
    b"BM": "BMP",  # BMP 文件头前 2 字节 "BM"
    b"MM\x00\x2a": "TIFF",  # TIFF big-endian（Motorola 字节序）
    b"II\x2a\x00": "TIFF",  # TIFF little-endian（Intel 字节序）
    b"GIF8": "GIF",  # GIF 文件头 "GIF87a" 或 "GIF89a" 的前 4 字节
    b"\x00\x00\x01\x00": "ICO",  # ICO 文件头（前 4 字节固定）
    # AVIF 是 ISOBMFF 容器，魔数与 HEIF 相同
    # HEIF/HEIC 也走 ISOBMFF，这里用 ftyp box 做进一步区分
    b"<?xml": "SVG",  # XML 声明开头，SVG 通常以 <?xml 开头
    b"<svg": "SVG",  # 或直接以 <svg 标签开头
    b"P6\n": "PPM",  # binary PPM（P6 魔数后紧跟换行）
    b"P3\n": "PPM",  # ASCII PPM（P3 魔数后紧跟换行）
    b"P5\n": "PGM",  # binary PGM
    b"P2\n": "PGM",  # ASCII PGM
    b"P4\n": "PBM",  # binary PBM
    b"P1\n": "PBM",  # ASCII PBM
    # TGA 没有标准文件头魔数，在文件末尾 18 字节检测 "TRUEVISION-XFILE" footer
}


def detect_format_by_magic(data: bytes, filename: str = "") -> Optional[str]:
    """
    通过文件头魔数检测图片格式。
    优先魔数，失败时回退到扩展名。

    流程：
    1. 数据不足 4 字节 → 回退到扩展名推断
    2. 按魔数签名长度降序遍历，找到首个匹配 → 返回格式名
    3. 魔数都不匹配 → 检查 ISOBMFF 容器（AVIF/HEIF 共用的 ftyp box）
    4. 检查 TGA footer（文件末尾 18 字节）
    5. 全部失败 → 回退到扩展名推断
    """
    if len(data) < 4:
        # 数据太短，连最短的魔数（2 字节）都不可靠，直接用扩展名
        return _detect_by_extension(filename)

    # 按最长匹配排序：长魔数（如 PNG 的 8 字节）优先于短魔数（如 BMP 的 2 字节）
    # 避免 "BM" 误匹配到恰好以 "BM" 开头但实际是其他格式的文件
    for magic, fmt in sorted(MAGIC_SIGNATURES.items(), key=lambda x: -len(x[0])):
        if data.startswith(magic):
            # WEBP 特殊处理：RIFF 容器内必须有 "WEBP" 子标签才是真正的 WebP
            # 其他 RIFF 文件（如 AVI、WAV）也会以 "RIFF" 开头，需要排除
            if fmt == "WEBP" and len(data) >= 12:
                if data[8:12] != b"WEBP":  # 偏移 8-11 是 RIFF 的 form type
                    continue  # 不是 WebP，继续尝试后续魔数
            return fmt  # 确认匹配，直接返回格式名

    # ISOBMFF 容器检测（AVIF / HEIF / HEIC 共用此容器格式）
    # ISOBMFF 结构：前 4 字节长度 + "ftyp" + 4 字节 brand
    # 位置 4-7 是 "ftyp"，位置 8-11 是 brand 标识
    if len(data) >= 12 and data[4:8] == b"ftyp":
        brand = data[8:12]  # ftyp brand：标识具体编码格式
        if brand in (b"avif", b"avis"):  # AVIF 的两种 brand
            return "AVIF"
        if brand in (
            b"heic",
            b"heix",
            b"hevc",
            b"hevx",
            b"mif1",
        ):  # HEIF/HEIC 的各种 brand
            return "HEIF"

    # TGA footer 检测（文件末尾 18 字节）
    # TGA v2.0 规范要求文件最后 18 字节：前 8 字节是签名 "TRUEVISION-XFILE"
    # data[-18:-2] 取倒数第 18 到倒数第 3 个字节（排除末尾的 "\0"）
    if len(data) >= 18 and data[-18:-2] == b"TRUEVISION-XFILE":
        return "TGA"

    # 所有魔数检测失败，回退到扩展名推断
    return _detect_by_extension(filename)


def _detect_by_extension(filename: str) -> Optional[str]:
    """通过文件扩展名推断格式。

    Path(filename).suffix 提取扩展名（含点，如 ".png"），
    EXT_TO_FORMAT 查找对应的 Pillow 格式名（如 "PNG"）。
    这是魔数检测失败后的最后回退手段。
    """
    if not filename:
        return None  # 连文件名都没有，无法推断
    ext = Path(filename).suffix.lower()  # 统一转小写避免大小写不匹配
    return EXT_TO_FORMAT.get(ext)  # 找不到返回 None


def is_supported_input(filename: str) -> bool:
    """检查文件扩展名是否为支持的输入格式。

    用于 convert 入口处的文件过滤——扩展名不在 EXT_TO_FORMAT 中的文件直接拒绝，
    避免走到后面的魔数检测或 PIL 打开步骤浪费资源。
    """
    ext = Path(filename).suffix.lower()  # 提取扩展名并转小写
    return ext in EXT_TO_FORMAT  # 在支持列表中返回 True


# ============================================================================
# 尺寸计算
# ============================================================================
def calculate_resize(
    orig_w: int,  # 原始宽度（像素）
    orig_h: int,  # 原始高度（像素）
    resize_mode: str,  # "none" | "fit" | "fill" | "exact"
    max_width: Optional[int] = None,  # fit/fill 模式的边界宽度
    max_height: Optional[int] = None,  # fit/fill 模式的边界高度
    target_width: Optional[int] = None,  # exact 模式的目标宽度
    target_height: Optional[int] = None,  # exact 模式的目标高度
    keep_aspect_ratio: bool = True,  # 是否保持原始宽高比
    allow_upscale: bool = True,  # 图片小于边界时是否允许放大
) -> Tuple[int, int]:
    """
    根据缩放模式计算目标尺寸。
    返回 (new_width, new_height)。

    四种模式：
    - none:  不缩放，返回原始尺寸
    - fit:   等比缩放至完全位于边界内（图片整体可见，不留白）
    - fill:  等比缩放至短边填满边界（长边超出部分将被裁切）
    - exact: 精确缩放至指定尺寸（keep_aspect_ratio=False 时直接拉伸，可能变形）
    """
    if resize_mode == "none":
        # 不缩放：直接返回原始宽高
        return orig_w, orig_h

    if resize_mode == "exact" and target_width and target_height:
        # exact 模式：参数有效（非 None 且非零）时执行
        if keep_aspect_ratio:
            # 保持比例：在目标尺寸范围内等比适配（最终可能小于目标尺寸）
            return _fit_into(orig_w, orig_h, target_width, target_height, allow_upscale)
        # 不保持比例：直接返回用户指定的精确尺寸（强制拉伸）
        return target_width, target_height

    if resize_mode == "fit" and max_width and max_height:
        # fit 模式：等比缩放到边界框内（保证整张图可见）
        return _fit_into(orig_w, orig_h, max_width, max_height, allow_upscale)

    if resize_mode == "fill" and max_width and max_height:
        # fill 模式：等比缩放到短边填满边界（超出部分由 PictureService._center_crop_to 裁切）
        return _fill_into(orig_w, orig_h, max_width, max_height)

    # 部分参数缺失时回退到不缩放
    # 如 resize_mode="fit" 但 max_width 为 None → 无法计算，保持原尺寸
    return orig_w, orig_h


def _fit_into(
    orig_w: int, orig_h: int, bound_w: int, bound_h: int, allow_upscale: bool = True
) -> Tuple[int, int]:
    """等比缩放，使图片完整容纳在边界内。

    - ratio = min(bound_w / orig_w, bound_h / orig_h)
    - allow_upscale=False 时 ratio >= 1.0 不做放大，保持原尺寸
    - allow_upscale=True 时也会放大到边界（默认）
    - 结果用 max(1, ...) 保证至少 1px
    """
    ratio = min(bound_w / orig_w, bound_h / orig_h)
    if not allow_upscale and ratio >= 1.0:
        return orig_w, orig_h
    return max(1, round(orig_w * ratio)), max(1, round(orig_h * ratio))


def _fill_into(orig_w: int, orig_h: int, bound_w: int, bound_h: int) -> Tuple[int, int]:
    """等比缩放，使短边至少达到边界尺寸（超出部分将被裁剪）。

    算法：计算宽高两个方向的比例，取较大值
    - ratio = max(bound_w / orig_w, bound_h / orig_h)
    - ratio < 1.0 时图片比边界大，缩小后短边刚好填满，长边略超出（后续裁切）
    - 结果用 max(1, ...) 保证至少 1px

    类比 CSS object-fit: cover。
    """
    ratio = max(bound_w / orig_w, bound_h / orig_h)  # 取较大比例 → 保证填满
    if ratio <= 0:
        return orig_w, orig_h  # 防御：非法参数时保持原尺寸
    # 向上取整：保证缩放后至少达到边界尺寸，后续居中裁切才能得到精确的目标宽高
    return max(1, math.ceil(orig_w * ratio)), max(
        1, math.ceil(orig_h * ratio)
    )  # 等比缩放


# ============================================================================
# 色彩模式处理
# ============================================================================


def resolve_color_mode(
    img_mode: str,  # 原图的 Pillow 模式字符串（如 "RGB"、"RGBA"、"P"、"L"）
    target_format: str,  # 目标 Pillow 格式名（如 "JPEG"、"PNG"、"GIF"），应为规范大写
    requested_mode: str,  # 用户请求的模式 "auto" | "RGB" | "RGBA" | "L" | "P"
    has_transparency: bool,  # 原图是否实际包含透明信息（调色板模式的 transparency 标记）
) -> str:
    """
    根据目标格式和用户请求确定输出色彩模式。
    返回目标 Pillow 模式字符串。

    规则优先级：
    1. 用户明确指定时 → 做兼容性检查，不兼容则降级
    2. auto 模式时 → 根据目标格式的能力自动选择最佳模式
    """
    # 格式能力分类
    # 这些格式的编码器不支持 alpha 通道 → 有色透明时必须转为 RGB（填充背景色）
    no_alpha_formats = {"JPEG", "BMP", "GIF", "PPM", "PBM"}
    # GIF 只能用调色板模式（最多 256 色），不能是 RGB/RGBA
    palette_only = {"GIF"}
    # PGM 只能用灰度模式（单通道）
    gray_only = {"PGM"}
    # PBM 只能用 1 位模式（黑白点阵）
    bit_only = {"PBM"}

    if requested_mode != "auto":
        # ---- 用户明确指定了色彩模式 ----
        # 多通道/灰度/调色板模式都无法写入位图专用格式 → 统一降级为 1
        if requested_mode in ("RGBA", "RGB", "L", "P") and target_format in bit_only:
            return "1"
        # 逐级检查兼容性：RGBA 无法写入不支持透明的格式 → 降级为 RGB
        if requested_mode == "RGBA" and target_format in no_alpha_formats:
            return "RGB"  # 格式不支持透明，降级
        # RGB/RGBA/L 无法写入调色板专用格式 → 降级为 P
        if requested_mode in ("RGBA", "RGB", "L") and target_format in palette_only:
            return "P"
        # RGBA/RGB/P 无法写入灰度专用格式 → 降级为 L
        if requested_mode in ("RGBA", "RGB", "P") and target_format in gray_only:
            return "L"
        return requested_mode  # 模式兼容，直接采用用户指定

    # ---- auto 模式：后端自动选择 ----
    # 优先级：格式专用模式 > 格式能力限制 > 保留原图模式

    if target_format in bit_only:
        return "1"  # PBM 统一走 1 位模式

    if target_format in palette_only:
        return "P"  # GIF 统一走调色板模式

    if target_format in gray_only:
        return "L"  # PGM 统一走灰度模式

    if target_format in no_alpha_formats:
        # 目标格式不支持透明
        if img_mode in ("RGBA", "LA", "PA") or has_transparency:
            return (
                "RGB"  # 原图有透明信息→丢弃 alpha，后续 _apply_color_mode 用背景色填充
            )
        # 原图本就无透明，保留其模式（可能已是 RGB/L/1）
        return img_mode if img_mode in ("RGB", "L", "1") else "RGB"

    # 支持透明通道的格式（如 PNG、WebP、TIFF、TGA）：
    # 保留原图模式，不做额外转换
    return img_mode


# ============================================================================
# 格式名规范化
# ============================================================================
def get_pillow_format(ext: str) -> Optional[str]:
    """扩展名（带点或不带点均可） → Pillow 格式名。

    两种输入来源：
    1. 输入侧：文件扩展名（含点，如 ".png"）→ Path.suffix 提取的
    2. 输出侧：前端 target_format（不含点，如 "png"）→ output_formats 字段

    逻辑：先查原始值，查不到补点再查（兼容不带点的输入）。
    修复前此函数写死了只查原始值，导致前端 target_format 传入时永远返回 None，
    全部依赖 .upper() fallback，选 "jpg" 时产生 "JPG"→Pillow 无法识别→崩溃。
    """
    ext_lower = ext.lower()  # 统一小写，避免 ".PNG" 等大小写问题
    if ext_lower in EXT_TO_FORMAT:
        return EXT_TO_FORMAT[ext_lower]  # 带点匹配（如 ".png" → "PNG"）
    return EXT_TO_FORMAT.get(
        f".{ext_lower}"
    )  # 不带点→补点后匹配（如 "png" → ".png" → "PNG"）


def get_target_extension(target_format: str) -> str:
    """用户输入的目标格式 → 标准扩展名（含点）。

    处理流程：
    1. target.lower() → 统一小写
    2. .lstrip(".") → 去掉可能的前导点（防御性处理）
    3. f".{target}" → 补点，保证返回格式如 ".png"

    示例："webp" → ".webp"、".PNG" → ".png"、"JPG" → ".jpg"
    """
    target = target_format.lower().lstrip(".")  # 小写 + 去前导点
    return f".{target}"  # 统一补点


def change_extension(filename: str, new_ext: str) -> str:
    """替换文件扩展名。

    Path(filename).stem 提取不含扩展名的文件名部分（如 "photo.jpg" → "photo"），
    然后拼接新扩展名。

    示例：change_extension("photo.jpg", ".webp") → "photo.webp"
    """
    stem = Path(filename).stem  # 提取文件名主干（去掉原扩展名）
    return f"{stem}{new_ext}"  # 拼接新扩展名


# ============================================================================
# 格式保存参数
# ============================================================================


def get_save_kwargs(
    target_format: str,  # 用户指定的目标格式（如 "jpeg"、"webp"，来自前端 target_format 字段）
    quality: Optional[
        int
    ] = None,  # 质量参数（None=使用 Pillow 默认值；前端 quality 滑块的值）
    lossless: bool = False,  # 无损模式（仅 WebP 有效，前端 lossless 开关）
    optimize: bool = True,  # 是否启用 Pillow 的 optimize 优化（减小文件体积）
    img_size: Optional[
        Tuple[int, int]
    ] = None,  # 图片尺寸 (宽, 高)，用于按像素总量选择编码参数
) -> Dict[str, Any]:
    """
    根据目标格式返回 Pillow Image.save() 的关键字参数。

    每个格式有不同的保存选项，此函数封装了格式差异：
    - JPEG: quality（1-100）+ optimize
    - WebP: lossless=True 或 quality（0-100）+ method=6
    - AVIF: quality（0-100）
    - PNG: optimize
    - TIFF: LZW 压缩
    - TGA: RLE 压缩
    - GIF: optimize
    - SVG/BMP/PPM/PGM/PBM/ICO: 无特殊参数（SVG 走 _save_as_svg 独立路径）

    注意：quality 在此处做钳位处理（max/min），防止超出 Pillow 的合法范围。
    """
    # 将用户传入的格式名（可能是 "jpg"、"jpeg" 等变体）规范化为 Pillow 格式名
    fmt = get_pillow_format(target_format)  # 如 "jpg" → "JPEG"、"tif" → "TIFF"
    if fmt is None:
        fmt = (
            target_format.upper()
        )  # 最终 fallback：纯大写（防御 get_pillow_format 失败的极端情况）

    kwargs: Dict[
        str, Any
    ] = {}  # 收集的保存参数，最终传给 img.save(buf, format=..., **kwargs)

    if fmt == "JPEG":
        if quality is not None:
            kwargs["quality"] = max(
                1, min(100, quality)
            )  # JPEG 不接受 quality=0，下限钳位到 1
        kwargs["optimize"] = (
            optimize  # Pillow 的 optimize 会对 Huffman 表做优化，减小体积
        )

    elif fmt == "WEBP":
        if lossless:
            # 无损模式：不设 quality，直接标记 lossless=True
            # 无损 WebP 压缩率接近 PNG，但保持 WebP 容器
            kwargs["lossless"] = True
        elif quality is not None:
            kwargs["quality"] = max(
                0, min(100, quality)
            )  # WebP 接受 quality=0（极端压缩）
        # method 6 压缩率最高但编码极慢；按像素总量降档，大图改用 4 避免单文件编码数分钟
        pixel_count = img_size[0] * img_size[1] if img_size else 0  # 宽×高得像素总数
        kwargs["method"] = (
            6 if pixel_count <= 4_000_000 else 4
        )  # ≤400 万像素用 6，否则 4

    elif fmt == "AVIF":
        if quality is not None:
            kwargs["quality"] = max(0, min(100, quality))  # AVIF 接受 quality=0
        # Pillow 12.3 原生 AVIF 写入使用此 kwargs

    elif fmt == "PNG":
        kwargs["optimize"] = optimize  # PNG optimize 会尝试不同的压缩策略，不影响画质

    elif fmt == "TIFF":
        kwargs["compression"] = "tiff_lzw"  # LZW 无损压缩，广泛兼容

    elif fmt == "TGA":
        kwargs["compress"] = True  # TGA RLE 压缩，减小体积

    elif fmt == "GIF":
        kwargs["optimize"] = optimize  # GIF optimize 优化调色板

    # SVG/BMP/PPM/PGM/PBM/ICO 走这里：kwargs 为空，使用 Pillow 默认设置
    # SVG 实际不经过此路径——_convert_one_sync 中有独立的 SVG 分支调用 _save_as_svg

    return kwargs
