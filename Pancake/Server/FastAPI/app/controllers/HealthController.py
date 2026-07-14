from fastapi import APIRouter, Depends  # APIRouter=路由分组 Depends=依赖注入
from app.schemas.HealthSchema import HealthResponse  # 响应模型（定义 API 文档和序列化）
from app.services.HealthService import HealthService, get_health_service  # 服务层 + 工厂函数

router = APIRouter()  # 创建此模块的路由实例


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
