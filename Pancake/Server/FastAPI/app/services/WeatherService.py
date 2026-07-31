import json  # 解析 JSON 配置文件

import httpx  # 异步 HTTP 客户端

from app.core.config import JSON_DIR  # JSON 配置目录路径

from app.exceptions.errors import (
    BadRequestError,  # 参数不合法
    ConfigurationError,  # API 配置缺失
    ExternalServiceError,  # 外部 API 调用失败
)


def get_weather_service() -> "WeatherService":
    """工厂函数：每次请求创建新实例。"""
    return WeatherService()


class WeatherService:
    def get_weather_api(self) -> str:
        """从 Apis.json 中读取 Weather API 的 URL。"""
        json_path = JSON_DIR / "Apis.json"  # 拼接 JSON 文件路径
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)  # 解析 JSON → list[dict]
        for item in data:  # 遍历查找
            if item.get("name") == "Weather":  # name 字段匹配
                return item.get("url")  # 返回 url 字段
        raise ConfigurationError("天气预报API链接未找到")  # 未找到 → 500

    async def fetch_weather_data(self, location_id: str) -> dict:
        if not location_id:
            raise BadRequestError("location_id 不能为空")
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(8.0)) as client:
                resp = await client.get(
                    self.get_weather_api() + location_id,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
                        "Accept": "application/json, text/javascript, */*; q=0.01",
                        "Referer": "https://weather.cma.cn/",
                        "X-Requested-With": "XMLHttpRequest",
                        "Accept-Language": "zh-CN,zh;q=0.9",
                    },
                )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise ExternalServiceError(f"无法获取天气数据：{e}") from e

    async def fetch_weather_list(self) -> dict:
        """读取静态城市 id+名称 列表（WeatherCities.json），不请求远程接口。"""
        json_path = JSON_DIR / "WeatherCities.json"  # 静态城市列表文件路径
        with open(json_path, "r", encoding="utf-8") as f:
            cities = json.load(f)  # 解析 JSON → [[id, name], ...]
        return {"cities": cities}
