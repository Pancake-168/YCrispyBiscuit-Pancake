"""
图片转换功能的 Pydantic 请求/响应模型。

注意：ConvertRequest 用于类型文档和组织，
multipart/form-data 中实际参数通过 Form() 逐个声明，不直接用作 Body。
"""

from pydantic import BaseModel                     # BaseModel=序列化基类
from typing import Optional, List, Literal          # Literal=字符串字面量类型（"success"|"error"）


class FormatDetail(BaseModel):
    """单个图片格式的元信息，对应 GET /api/picture/formats 响应中 format_details 的 value。

    字段来自后端 PictureUtils.FORMAT_DETAILS 的 to_dict()，
    经 Pydantic 校验后序列化为 JSON 返回前端。
    """

    extensions: List[str]                # 该格式的文件扩展名列表（含点）如 [".jpg", ".jpeg"]
    mime_type: str                       # MIME 类型如 "image/jpeg"
    supports_transparency: bool          # 是否支持透明 → false 时前端显示背景填充色选择器
    supports_animation: bool             # 是否支持动画 → 前端未使用此字段控制 UI
    lossy_options: bool                  # 是否有有损选项 → true 时前端显示质量滑块
    quality_range: Optional[List[int]] = None   # 质量范围 [min, max] 或 null → 决定滑块 min/max
    supports_lossless: bool = False      # 是否支持无损模式 → true 时前端显示无损开关


class FormatsResponse(BaseModel):
    """GET /api/picture/formats 的完整响应体。

    前端 PictureSwitchPage 在 useEffect 中调用 getFormats()，
    将返回值 setFormatsData → 驱动整个 UI 的格式选择和行为。
    """

    input_formats: List[str]             # 不带点的扩展名列表 如 ["png", "jpg", "webp"]
    output_formats: List[str]            # 小写格式标识列表（去重）如 ["png", "jpeg", "webp"]
    format_details: dict[str, FormatDetail]  # key=格式标识 value=FormatDetail，与 output_formats 对齐


class ConvertResultItem(BaseModel):
    """POST /api/picture/convert 响应中 results 数组的单个元素。

    前端用这些字段渲染转换结果列表：
    - 文件名、格式、大小变化、分辨率变化、压缩率
    - status 决定显示成功图标还是错误图标
    """

    index: int                           # 文件在批量中的序号（从 0 开始）
    original_name: str                   # 原始文件名 如 "photo.jpg"
    converted_name: str = ""             # 转换后文件名 如 "photo.webp"（失败时为空）
    original_format: str = ""            # 原始格式标识 如 "jpg"
    target_format: str = ""              # 目标格式标识 如 "webp"
    original_size: int = 0               # 原始文件大小（字节）
    converted_size: int = 0              # 转换后文件大小（字节）（失败时为 0）
    original_resolution: str = ""        # 原始分辨率 如 "1920×1080"
    converted_resolution: str = ""       # 转换后分辨率（失败时为空）
    size_ratio: float = 0.0              # 压缩比 = converted_size / original_size（0.5=缩小一半）
    status: Literal["success", "error"]  # 转换状态：只有这两种值
    error: Optional[str] = None          # 失败时的错误描述字符串（成功时为 null）


class ConvertResponse(BaseModel):
    """POST /api/picture/convert 的完整响应体。

    前端 handleConvert 中取 response.data 来：
    - setResults(response.data.results) → 渲染转换结果列表
    - setTaskId(response.data.task_id)  → 用于后续下载 URL 拼接
    """

    task_id: str                         # 任务 ID（12 位 hex），前端用来拼下载路径
    total: int                           # 总文件数（= len(results)）
    results: List[ConvertResultItem]     # 每个文件的转换结果
