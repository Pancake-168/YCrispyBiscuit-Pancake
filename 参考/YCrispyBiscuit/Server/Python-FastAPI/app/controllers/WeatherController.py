from fastapi import APIRouter,HTTPException,Depends
from app.services.Weather import WeatherService
from app.utils.JWT import get_jwt_service
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter()



@router.get("/weather/{locatID}", summary="获取天气", tags=["Weather"])
async def get_weather(locatID: str, service: WeatherService = Depends(WeatherService),user = Depends(get_jwt_service), credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
	"""根据 locatID 获取天气数据

	Query 参数:
	- locatID: 天气数据所需的地点或城市 ID
	"""
	try:
		await user.get_current_user_id(credentials)  # 确保用户已通过身份验证
		data = service.fetch_weather_data(locatID)
		return {"success": True, "data": data}
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))
	except ConnectionError as e:
		raise HTTPException(status_code=502, detail=str(e))
	except Exception:
		raise HTTPException(status_code=500, detail="内部服务器错误：无法获取天气数据")