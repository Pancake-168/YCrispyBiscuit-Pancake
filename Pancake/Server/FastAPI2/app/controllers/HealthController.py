# APIRouter=路由分组
from fastapi import APIRouter

# Depends=依赖注入
from fastapi import Depends

# 响应模型（定义 API 文档和序列化）
from app.schemas.HealthSchema import HealthResponse

# 服务层
from app.services.HealthService import HealthService

# 工厂函数
from app.services.HealthService import get_health_service

router = APIRouter()


@router.get(
    "/health",  # 路径: /api/health（router.py 中设置了 prefix="/api"）
    summary="健康检查",  # OpenAPI 文档中的简短描述
    tags=["Health"],  # Swagger UI 中按此标签分组
    response_model=HealthResponse,  # 告诉 FastAPI 按此模型序列化返回值
)
async def health(
    service: HealthService = Depends(get_health_service),  # 依赖注入获取 service 实例
):
    """返回服务健康状态。"""
    data = await service.get_health()  # 调用服务层获取健康数据
    return HealthResponse(**data)  # 将 dict 展开为 Pydantic 模型（触发校验+序列化）
