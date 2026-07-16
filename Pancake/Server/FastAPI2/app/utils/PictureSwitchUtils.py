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

# 输出格式名称列表（按格式名去重，用于 output_formats 字段，与 FORMAT_DETAILS 的 key 对齐）
# 步骤：
#   1. OUTPUT_FORMATS.values() → {"PNG", "JPEG", "WEBP", ...}，天然去重（dict values）
#   2. v.lower() → "png", "jpeg", ...
#   3. set() 再保险一层去重
#   4. sorted() 保证顺序稳定
OUTPUT_FORMAT_NAMES = sorted(set(v.lower() for v in OUTPUT_FORMATS.values()))



# ============================================================================
# MIME 类型
# ============================================================================


