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
    ".jpg": "JPEG",         # JPEG 有两种常见扩展名，都映射到同一个 Pillow 格式
    ".jpeg": "JPEG",
    ".webp": "WEBP",
    ".bmp": "BMP",
    ".tiff": "TIFF",        # TIFF 也有两种扩展名变体
    ".tif": "TIFF",
    ".gif": "GIF",
    ".ico": "ICO",
    ".avif": "AVIF",
    ".heif": "HEIF",        # HEIF/HEIC 仅读取，不在 OUTPUT_FORMATS 中
    ".heic": "HEIF",
    ".svg": "SVG",
    ".ppm": "PPM",
    ".pgm": "PGM",
    ".pbm": "PBM",
    ".tga": "TGA",
}


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
     "png": FormatDetail([".png"], "image/png", True, False, None),
}
