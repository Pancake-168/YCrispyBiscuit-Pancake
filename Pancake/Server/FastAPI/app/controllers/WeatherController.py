from fastapi import APIRouter, HTTPException, Depends
from app.services.Weather import WeatherService
from app.utils.JWT import require_user_id

router = APIRouter()


@router.get("/weather/{locatID}", summary="获取天气", tags=["Weather"])
async def get_weather(
    locatID: str,
    service: WeatherService = Depends(WeatherService),
    current_user_id: str = Depends(require_user_id),
):
    """根据 locatID 获取天气数据

    Query 参数:
    - locatID: 天气数据所需的地点或城市 ID
    """
    try:
        _ = current_user_id  # 触发统一鉴权依赖
        data = await service.fetch_weather_data(locatID)
        return {"success": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="内部服务器错误：无法获取天气数据")
