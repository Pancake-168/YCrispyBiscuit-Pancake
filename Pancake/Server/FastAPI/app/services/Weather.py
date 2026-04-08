import json
from app.core.config import JSON_DIR
import httpx
from urllib.parse import urlparse, parse_qs, urlunparse

from app.exceptions.errors import BadRequestError, ConfigurationError, ExternalServiceError


class WeatherService:
    def __init__(self):
        pass

    def get_weather_api(self) -> str:
        # 从本地json文件读取天气API地址
        json_path = JSON_DIR / "Apis.json"
        # 读取JSON文件
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            if item.get("name") == "Weather":
                return item.get("url")
        raise ConfigurationError("天气预报API链接未找到")

    async def fetch_weather_data(self, locatID: str) -> dict:
        """获取天气数据"""
        """杭州编号58457"""

        if not locatID:
            raise BadRequestError("locatID 不能为空")

        weather_api_url = self.get_weather_api()

        base = str(weather_api_url)

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Referer": "https://weather.cma.cn/",
            "X-Requested-With": "XMLHttpRequest",
            "Accept-Language": "zh-CN,zh;q=0.9",
        }

        try:
            timeout = httpx.Timeout(8.0)
            parsed = urlparse(base)
            if parsed.query:
                qdict = parse_qs(parsed.query)
                if qdict:
                    key = next(iter(qdict.keys()))
                    url_without_q = urlunparse(
                        (
                            parsed.scheme,
                            parsed.netloc,
                            parsed.path,
                            parsed.params,
                            "",
                            parsed.fragment,
                        )
                    )
                    async with httpx.AsyncClient(timeout=timeout) as client:
                        resp = await client.get(
                            url_without_q, params={key: locatID}, headers=headers
                        )
                else:
                    request_url = base + str(locatID).lstrip("/")
                    async with httpx.AsyncClient(timeout=timeout) as client:
                        resp = await client.get(request_url, headers=headers)
            else:
                if base.rstrip().endswith("="):
                    request_url = base + str(locatID).lstrip("/")
                else:
                    request_url = base.rstrip("/") + "/" + str(locatID).lstrip("/")
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.get(request_url, headers=headers)

            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise ExternalServiceError(f"无法获取天气数据：{e}") from e
