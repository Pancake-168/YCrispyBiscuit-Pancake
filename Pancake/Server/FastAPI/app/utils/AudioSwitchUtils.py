"""音频转换工具函数 —— 格式映射、MIME 表、编码参数、真实格式识别。

纯函数 + 常量，无副作用，不依赖 FastAPI 或数据库。
"""

from pathlib import Path  # 路径处理（扩展名提取）
from typing import Dict, List  # 类型标注


# ============================================================================
# 扩展名与 MIME
# ============================================================================

# 扩展名 → MIME 类型（下载接口设置 Content-Type 用）
EXT_TO_MIME: Dict[str, str] = {
    ".wav": "audio/wav",
    ".flac": "audio/flac",
    ".aiff": "audio/aiff",
    ".aif": "audio/aiff",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",  # 裸 AAC 流（ADTS）的标准 MIME，与 .m4a 容器不同
    ".ogg": "audio/ogg",
    ".opus": "audio/opus",
}

# 格式标识 → 标准输出扩展名（含点）。
# 用户选的是编码方式：aac 统一输出 .m4a（MP4 容器），后端不向用户暴露容器细节
FORMAT_TO_EXT: Dict[str, str] = {
    "wav": ".wav",
    "flac": ".flac",
    "aiff": ".aiff",
    "mp3": ".mp3",
    "aac": ".m4a",
    "ogg": ".ogg",
    "opus": ".opus",
}

# 输入扩展名白名单（含 .aif / .aac 等别名变体）
SUPPORTED_EXTENSIONS = set(EXT_TO_MIME.keys())

# 输入格式列表（带点，排序保证展示顺序稳定）
INPUT_EXTENSIONS = sorted(SUPPORTED_EXTENSIONS)

# 输出格式标识列表（小写，排序稳定，与 FORMAT_DETAILS 的 key 对齐）
OUTPUT_FORMAT_NAMES = sorted(FORMAT_TO_EXT.keys())


# ============================================================================
# 格式元信息（GET /api/audio/formats 返回）
# ============================================================================

# key 是小写格式标识，value 的 extensions/mime_type/lossy 直接序列化给前端
FORMAT_DETAILS: Dict[str, Dict] = {
    "wav": {"extensions": [".wav"], "mime_type": "audio/wav", "lossy": False},
    "flac": {"extensions": [".flac"], "mime_type": "audio/flac", "lossy": False},
    "aiff": {
        "extensions": [".aiff", ".aif"],
        "mime_type": "audio/aiff",
        "lossy": False,
    },
    "mp3": {"extensions": [".mp3"], "mime_type": "audio/mpeg", "lossy": True},
    "aac": {"extensions": [".m4a", ".aac"], "mime_type": "audio/mp4", "lossy": True},
    "ogg": {"extensions": [".ogg"], "mime_type": "audio/ogg", "lossy": True},
    "opus": {"extensions": [".opus"], "mime_type": "audio/opus", "lossy": True},
}

# 有损/无损格式标识集合（warning 判定用，与 FORMAT_DETAILS 的 lossy 标记同源）
LOSSY_FORMAT_IDS = {"mp3", "aac", "ogg", "opus"}
LOSSLESS_FORMAT_IDS = {"wav", "flac", "aiff"}

# 有损输出的编码参数（设计文档 2.5 策略表的固化形态，已实测内置 ffmpeg 含全部编码器）
AUDIO_ENCODE_ARGS: Dict[str, List[str]] = {
    "mp3": ["-c:a", "libmp3lame", "-q:a", "0"],  # LAME VBR 最高档 V0（约 245 kbps）
    "ogg": ["-c:a", "libvorbis", "-q:a", "6"],  # libvorbis 高质量档（约 192 kbps）
    "aac": ["-c:a", "aac"],  # 原生 AAC 编码器（VBR）
    "opus": [],  # libopus 默认 VBR，不额外指定
}


# ============================================================================
# 真实格式识别（报告 original_format 用，而不是扩展名）
# ============================================================================

# ffprobe codec_name → 格式标识。WAV/AIFF 的 codec_name 是 pcm_*，需前缀匹配
CODEC_NAME_TO_ID: Dict[str, str] = {
    "mp3": "mp3",
    "flac": "flac",
    "vorbis": "ogg",
    "opus": "opus",
    "aac": "aac",
}

# 扩展名 → 格式标识归一（.m4a 是容器扩展名，格式标识是 aac；.aif 归一到 aiff）
EXT_ID_TO_FORMAT_ID: Dict[str, str] = {
    "m4a": "aac",
    "aif": "aiff",
}


def resolve_original_format(metadata: dict, filename: str) -> str:
    """以 ffprobe 识别的真实格式为准，识别失败回退扩展名。"""
    codec = str(metadata.get("codec_name", ""))  # 提取真实编码名（如 mp3/flac/vorbis）
    if codec in CODEC_NAME_TO_ID:
        return CODEC_NAME_TO_ID[codec]  # 精确映射（mp3/flac/vorbis/opus/aac）
    ext_id = Path(filename).suffix.lower().lstrip(".")  # 回退路径先取扩展名标识
    if codec.startswith("pcm_"):
        # WAV/AIFF 的编码都是 PCM（pcm_s16le 等），按扩展名区分两者
        return "wav" if ext_id == "wav" else "aiff"
    return EXT_ID_TO_FORMAT_ID.get(ext_id, ext_id)  # 归一化别名（m4a→aac）后返回


# ============================================================================
# 基础工具函数
# ============================================================================


def is_supported_input(filename: str) -> bool:
    """检查扩展名是否在输入白名单（含 .aif / .aac 变体）。"""
    return Path(filename).suffix.lower() in SUPPORTED_EXTENSIONS  # 统一小写后查集合


def get_target_extension(target_format: str) -> str:
    """目标格式标识 → 标准扩展名（小写、去点、补点）。"""
    fmt = target_format.lower().lstrip(".")  # 统一小写并去掉可能的前导点
    return FORMAT_TO_EXT.get(fmt, f".{fmt}")  # 找不到时按输入原样补点（防御）


def change_extension(filename: str, new_ext: str) -> str:
    """替换文件扩展名（"song.wav" + ".mp3" → "song.mp3"）。"""
    return f"{Path(filename).stem}{new_ext}"  # stem 去掉原扩展名后拼接新扩展名
