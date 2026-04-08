from fastapi import APIRouter, Depends
from app.schemas.WeatherSchema import WeatherResponse
from app.services.Weather import WeatherService
from app.utils.JWT import require_user_id

router = APIRouter()


@router.get(
    "/weather/{locatID}",
    summary="获取天气",
    tags=["Weather"],
    response_model=WeatherResponse,
)
async def get_weather(
    locatID: str,
    service: WeatherService = Depends(WeatherService),
    current_user_id: str = Depends(require_user_id),
):
    """根据 locatID 获取天气数据

    Query 参数:
    - locatID: 天气数据所需的地点或城市 ID
    """
    _ = current_user_id  # 触发统一鉴权依赖
    data = await service.fetch_weather_data(locatID)
    return WeatherResponse(success=True, data=data)
