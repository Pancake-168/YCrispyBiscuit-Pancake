from fastapi import APIRouter, Depends  # APIRouter=路由分组 Depends=依赖注入
from app.schemas.WeatherSchema import WeatherResponse  # 天气响应模型
from app.services.WeatherService import WeatherService, get_weather_service  # 天气服务 + 工厂
from app.services.AuthService import require_user_id  # 统一鉴权依赖（验证 token 并返回 user_id）

router = APIRouter()  # 创建此模块的路由实例


@router.get(
    "/weather/{location_id}",  # 路径参数: 地点/城市 ID
    summary="获取天气",
    tags=["Weather"],
    response_model=WeatherResponse,
)
async def get_weather(
    location_id: str,  # URL 中 {location_id} 占位符的值
    service: WeatherService = Depends(get_weather_service),  # 依赖注入获取天气服务
    current_user_id: str = Depends(require_user_id),  # 触发统一鉴权，未登录返回 401
):
    """根据 location_id 获取天气数据。

    Query 参数:
    - location_id: 天气数据所需的地点或城市 ID
    """
    _ = current_user_id  # 显式消费当前用户 ID（仅触发鉴权，后续暂未使用）
    data = await service.fetch_weather_data(location_id)  # 调用天气 API 获取数据
    return WeatherResponse(success=True, data=data)  # 包装为统一响应格式
