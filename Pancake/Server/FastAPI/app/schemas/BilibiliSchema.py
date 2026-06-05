from typing import Any, Optional
from pydantic import BaseModel


class BilibiliLoginUrlResponse(BaseModel):
    qrcode_key: str
    url: str
    qrcode_image: str


class BilibiliPollResponse(BaseModel):
    status: str  # waiting | scanned | done | expired
    message: str = ""
    session_id: Optional[str] = None
    cookies: Optional[dict] = None
    refresh_token: Optional[str] = None


class BilibiliCookieLoginRequest(BaseModel):
    cookie: str


class BilibiliSessionResponse(BaseModel):
    session_id: str


class BilibiliUserInfoResponse(BaseModel):
    mid: Optional[int] = None
    uname: Optional[str] = None
    isLogin: bool = False
    vip: Optional[dict] = None
    wallet: Optional[dict] = None


class BilibiliStoredValuesResponse(BaseModel):
    cookies: dict = {}
    sessdata: str = ""
    bili_jct: str = ""
    dedeuserid: str = ""
    access_token: str = ""
    refresh_token: str = ""
    cookie_string: str = ""
    ac_time_value: int = 0
    ac_time_value_alt: str = ""
    nav_info: Optional[dict] = None
    page_tokens: Optional[dict] = None


class BilibiliAcTimeValueResponse(BaseModel):
    timestamp: int
    timestamp_ms: int
    ac_time_value: int
    api_test: Optional[Any] = None
