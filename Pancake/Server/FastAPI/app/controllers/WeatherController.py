from fastapi import APIRouter, Depends  # APIRouter=路由分组 Depends=依赖注入
from app.schemas.WeatherSchema import (
    WeatherResponse,
    WeatherListResponse,
)  # 天气响应模型
from app.services.WeatherService import (
    WeatherService,
    get_weather_service,
)  # 天气服务 + 工厂


router = APIRouter()  # 创建此模块的路由实例


@router.get(
    "/weather/list",  # 静态路径: 城市 id+名称 列表
    summary="获取天气支持地ID列表",
    tags=["Weather"],
    response_model=WeatherListResponse,
)
async def get_weather_list(
    service: WeatherService = Depends(get_weather_service),  # 依赖注入获取天气服务
):
    data = await service.fetch_weather_list()  # 调用天气服务读取静态城市列表
    return WeatherListResponse(success=True, data=data)  # 包装为统一响应格式


@router.get(
    "/weather",  # 查询参数形式: /api/weather?id=58457（路径固定，与 /weather/list 不冲突）
    summary="获取天气",
    tags=["Weather"],
    response_model=WeatherResponse,
)
async def get_weather(
    id: str,  # 查询参数 ?id=xxx，站点 ID（支持 K8505 等带字母 ID）
    service: WeatherService = Depends(get_weather_service),  # 依赖注入获取天气服务
):
    data = await service.fetch_weather_data(id)  # 调用天气 API 获取数据
    return WeatherResponse(success=True, data=data)  # 包装为统一响应格式
