"""
图片转换功能的 Pydantic 请求/响应模型。

注意：ConvertRequest 用于类型文档和组织，
multipart/form-data 中实际参数通过 Form() 逐个声明，不直接用作 Body。
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class FormatDetail(BaseModel):
    """单个图片格式的元信息。"""

    extensions: List[str]
    mime_type: str
    supports_transparency: bool
    supports_animation: bool
    lossy_options: bool
    quality_range: Optional[List[int]] = None
    supports_lossless: bool = False


class FormatsResponse(BaseModel):
    """GET /api/picture/formats 的响应。"""

    input_formats: List[str]
    output_formats: List[str]
    format_details: dict[str, FormatDetail]


class ConvertResultItem(BaseModel):
    """单个文件的转换结果。"""

    index: int
    original_name: str
    converted_name: str = ""
    original_format: str = ""
    target_format: str = ""
    original_size: int = 0
    converted_size: int = 0
    original_resolution: str = ""
    converted_resolution: str = ""
    size_ratio: float = 0.0
    status: Literal["success", "error"]
    error: Optional[str] = None


class ConvertResponse(BaseModel):
    """POST /api/picture/convert 的响应。"""

    task_id: str
    total: int
    results: List[ConvertResultItem]
