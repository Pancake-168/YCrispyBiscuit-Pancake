from typing import Any  # 宽松类型标注，用于天气数据这种不固定结构的字典

from pydantic import BaseModel


class WeatherResponse(BaseModel):
    """GET /api/weather/{location_id} 的响应体。"""

    success: bool  # 请求是否成功（始终为 true，失败走异常处理器）
    data: dict[str, Any]  # 天气数据字典，结构由上游天气 API 决定，此处不做强约束
