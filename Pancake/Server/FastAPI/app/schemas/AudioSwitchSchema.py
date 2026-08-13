"""音频转换功能的 Pydantic 请求/响应模型。

ConvertRequest 不存在：音频参数只有 target_format 一个 Form 字段，
由 Controller 逐个声明，无 multipart 下不可用的复合 Body 场景。
"""

from pydantic import BaseModel  # BaseModel=序列化基类
from typing import (
    List,  # 列表字段
    Literal,  # 字符串字面量类型（"success"|"error"）
    Optional,  # 可选字段
)


class FormatDetail(BaseModel):
    """单个音频格式的元信息，对应 GET /api/audio/formats 响应中 format_details 的 value。

    字段来自后端 AudioSwitchUtils.FORMAT_DETAILS，经 Pydantic 校验后序列化返回前端。
    """

    extensions: List[str]  # 该格式的文件扩展名列表（含点）如 [".m4a", ".aac"]
    mime_type: str  # MIME 类型如 "audio/mpeg"
    lossy: bool  # 是否是有损格式（前端据此显示格式提示）


class FormatsResponse(BaseModel):
    """GET /api/audio/formats 的完整响应体。

    前端 AudioSwitchPage 在 useEffect 中调用 getFormats()，
    将返回值 setFormatsData → 驱动格式选择器与文件过滤白名单。
    """

    input_formats: List[str]  # 不带点的输入扩展名列表 如 ["wav", "mp3"]
    output_formats: List[str]  # 小写格式标识列表 如 ["aac", "flac", "mp3"]
    format_details: dict[str, FormatDetail]  # key=格式标识 value=FormatDetail


class ConvertResultItem(BaseModel):
    """POST /api/audio/convert 响应中 results 数组的单个元素。

    前端用这些字段渲染转换结果列表：
    - 文件名、格式、大小变化、压缩率、时长、采样率
    - status 决定显示成功图标还是错误图标
    - warning 是成功时的用户可见提示（如"有损转无损不恢复音质"）
    """

    index: int  # 文件在批量中的序号（从 0 开始）
    original_name: str  # 原始文件名 如 "song.wav"
    converted_name: str = ""  # 转换后文件名 如 "song.mp3"（失败时为空）
    original_format: str = ""  # 原始格式标识 如 "wav"（以 ffprobe 识别为准）
    target_format: str = ""  # 目标格式标识 如 "mp3"
    original_size: int = 0  # 原始文件大小（字节）
    converted_size: int = 0  # 转换后文件大小（字节，失败时为 0）
    size_ratio: float = 0.0  # 压缩比 = converted_size / original_size（0.5=缩小一半）
    duration_seconds: float = 0.0  # 音频时长（秒）
    sample_rate: int = 0  # 采样率（Hz），如 44100
    status: Literal["success", "error"]  # 转换状态：只有这两种值
    error: Optional[str] = None  # 失败时的错误描述字符串（成功时为 null）
    warning: Optional[str] = (
        None  # 成功时的提示信息（如"有损转无损不恢复音质"），无提示为 null
    )


class ConvertResponse(BaseModel):
    """POST /api/audio/convert 的完整响应体。

    前端 handleConvert 中取 response.data 来：
    - setResults(response.data.results) → 渲染转换结果列表
    - setTaskId(response.data.task_id)  → 用于后续下载 URL 拼接
    """

    task_id: str  # 任务 ID（12 位 hex），前端用来拼下载路径
    total: int  # 总文件数（= len(results)）
    results: List[ConvertResultItem]  # 每个文件的转换结果
