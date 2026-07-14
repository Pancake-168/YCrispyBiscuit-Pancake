"""B站会话模型。封装单个用户登录后的 cookies、token 和 httpx 异步客户端。"""

import time  # ac_time_value 时间戳
from typing import Any

import httpx  # 异步 HTTP 客户端

from app.services.BilibiliWbi import BILIBILI_USER_AGENT  # 统一 User-Agent


class BilibiliSession:
    """Holds a Bilibili login session with cookies and tokens.

    每个登录成功的用户对应一个 BilibiliSession 实例，
    持有 cookies、access_token、refresh_token 和预配置的 httpx.AsyncClient。
    """

    def __init__(self):
        # 当前会话的 cookies 字典
        self.cookies: dict[str, str] = {}
        # 预配置异步客户端（统一 UA + Referer + 跟随重定向）
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": BILIBILI_USER_AGENT,
                "Referer": "https://www.bilibili.com/",
            },
            follow_redirects=True,  # 自动跟随 301/302 重定向
        )
        self.refresh_token: str = ""  # OAuth refresh token
        self.access_token: str = ""  # OAuth access token

    # ------------------------------------------------------------------
    # Cookie 管理
    # ------------------------------------------------------------------

    def absorb_response_cookies(self, resp: httpx.Response):
        """从 httpx 响应中提取所有 Set-Cookie 并合并到会话 cookies。"""
        for name, value in resp.cookies.items():
            if value:  # 过滤空值
                self.cookies[name] = value
        self.client.cookies.update(self.cookies)  # 同步到 httpx 客户端

    def set_cookies(self, raw: str | dict):
        """从原始 Cookie 字符串或字典设置 cookies。"""
        if isinstance(raw, dict):
            self.cookies.update(raw)  # 字典直接合并
        elif isinstance(raw, str):
            # 解析 "key1=val1; key2=val2" 格式
            for item in raw.split(";"):
                item = item.strip()
                if "=" in item:
                    k, v = item.split("=", 1)  # 仅按第一个 = 分割
                    self.cookies[k.strip()] = v.strip()
        self.client.cookies.update(self.cookies)  # 同步到 httpx 客户端

    def get_cookie_string(self) -> str:
        """将 cookies 拼接为标准 Cookie 请求头字符串。"""
        return "; ".join(f"{k}={v}" for k, v in self.cookies.items())

    # ------------------------------------------------------------------
    # 便捷属性（常用 cookie 字段）
    # ------------------------------------------------------------------

    @property
    def sessdata(self) -> str:
        """SESSDATA cookie 值，B站登录会话的核心凭证。"""
        return self.cookies.get("SESSDATA", "")

    @property
    def bili_jct(self) -> str:
        """bili_jct cookie 值，B站 CSRF token。"""
        return self.cookies.get("bili_jct", "")

    @property
    def dedeuserid(self) -> str:
        """DedeUserID cookie 值，B站用户数字 ID。"""
        return self.cookies.get("DedeUserID", "")

    # ------------------------------------------------------------------
    # 数据导出
    # ------------------------------------------------------------------

    def dump_stored_values(self) -> dict[str, Any]:
        """导出当前会话所有存储值。供 API 调用者获取可用的 credentials。"""
        return {
            "cookies": dict(self.cookies),  # 复制一份避免外部修改
            "sessdata": self.sessdata,
            "bili_jct": self.bili_jct,
            "dedeuserid": self.dedeuserid,
            "access_token": self.access_token,
            "refresh_token": self.refresh_token,
            "cookie_string": self.get_cookie_string(),
            # ac_time_value：B站客户端用 Math.floor(Date.now()/1000) 生成的防重放时间戳
            "ac_time_value": int(time.time()),
            "ac_time_value_alt": str(int(time.time())),  # 字符串版本
        }
