"""天气服务。从本地 JSON 配置读取天气 API 地址，调上游 API 获取天气数据。"""

import json  # 解析 JSON 配置文件
from urllib.parse import parse_qs, urlparse, urlunparse  # URL 解析/重组

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
    """天气数据获取服务。"""


    """杭州是58457"""

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
        """根据 location_id 从天气 API 获取数据。"""
        if not location_id:  # 参数防空
            raise BadRequestError("location_id 不能为空")

        weather_api_url = self.get_weather_api()  # 获取 API 基础 URL
        base = str(weather_api_url)  # 确保为字符串类型

        # 统一请求头，模拟浏览器
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Referer": "https://weather.cma.cn/",
            "X-Requested-With": "XMLHttpRequest",
            "Accept-Language": "zh-CN,zh;q=0.9",
        }

        try:
            timeout = httpx.Timeout(8.0)  # 8 秒超时
            parsed = urlparse(base)  # 解析 API URL

            # 根据 URL 格式决定如何拼接 location_id
            if parsed.query:  # URL 已有查询参数 → 替换参数值
                qdict = parse_qs(parsed.query)  # 解析查询参数为 dict
                if qdict:
                    key = next(iter(qdict.keys()))  # 取第一个参数名
                    url_without_q = urlunparse(
                        (parsed.scheme, parsed.netloc, parsed.path, parsed.params, "", parsed.fragment)
                    )  # 去掉查询串的 URL
                    async with httpx.AsyncClient(timeout=timeout) as client:
                        resp = await client.get(url_without_q, params={key: location_id}, headers=headers)
                else:  # 空查询串 → 直接拼接
                    request_url = base + str(location_id).lstrip("/")
                    async with httpx.AsyncClient(timeout=timeout) as client:
                        resp = await client.get(request_url, headers=headers)
            else:  # URL 无查询参数 → location_id 拼到路径或参数尾部
                if base.rstrip().endswith("="):  # URL 以 = 结尾 → 直接追加
                    request_url = base + str(location_id).lstrip("/")
                else:  # URL 以其他字符结尾 → 加 / 分隔
                    request_url = base.rstrip("/") + "/" + str(location_id).lstrip("/")
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.get(request_url, headers=headers)

            resp.raise_for_status()  # 非 2xx 状态码 → 抛 httpx.HTTPError
            return resp.json()  # 返回 JSON 解析后的天气数据
        except httpx.HTTPError as e:
            raise ExternalServiceError(f"无法获取天气数据：{e}") from e  # 统一转为项目异常
