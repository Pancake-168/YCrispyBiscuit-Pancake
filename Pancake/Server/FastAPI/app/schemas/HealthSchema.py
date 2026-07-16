from pydantic import BaseModel  # 所有 Schema 的基类，自动校验+序列化
from pydantic import ConfigDict  # Pydantic v2 配置字典（替代旧版 class Config）


class HealthResponse(BaseModel):
    """GET /api/health 的响应体。"""

    # from_attributes=True 允许从 ORM 对象或 dict 直接构造模型
    model_config = ConfigDict(from_attributes=True)
    status: str  # 服务状态字符串，如 "ok"
