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
