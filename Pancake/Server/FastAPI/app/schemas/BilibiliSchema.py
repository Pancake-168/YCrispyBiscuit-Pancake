from typing import Any, Optional  # Any=宽松类型 Optional=可选字段

from pydantic import BaseModel, Field  # Field 提供 default_factory


# ============================================================================
# Bilibili 登录相关
# ============================================================================

class BilibiliLoginUrlResponse(BaseModel):
    """GET /api/bilibili/login/url 的响应体。"""

    qrcode_key: str  # 二维码唯一 key，用于后续轮询
    url: str  # B站登录页 URL（二维码内容）
    qrcode_image: str  # 通过 qrserver API 生成的二维码图片 URL


class BilibiliPollResponse(BaseModel):
    """GET /api/bilibili/login/poll 的响应体。"""

    status: str  # 扫码状态: waiting(等待扫码) | scanned(已扫码) | done(已确认) | expired(已过期)
    message: str = ""  # 状态对应的提示文本
    session_id: Optional[str] = None  # 登录成功时返回的会话 ID
    cookies: Optional[dict] = None  # 登录成功时返回的 cookies
    refresh_token: Optional[str] = None  # 登录成功时返回的 refresh_token


class BilibiliCookieLoginRequest(BaseModel):
    """POST /api/bilibili/login/cookie 的请求体。"""

    cookie: str  # 用户粘贴的完整 Cookie 字符串


class BilibiliSessionResponse(BaseModel):
    """POST /api/bilibili/login/cookie 的响应体。"""

    session_id: str  # 创建成功的会话 ID


# ============================================================================
# Bilibili 用户/数据查询
# ============================================================================

class BilibiliUserInfoResponse(BaseModel):
    """GET /api/bilibili/user 的响应体。"""

    mid: Optional[int] = None  # B站用户 mid
    uname: Optional[str] = None  # B站用户名
    isLogin: bool = False  # 是否处于登录状态
    vip: Optional[dict] = None  # 大会员信息
    wallet: Optional[dict] = None  # B币/积分等钱包信息


class BilibiliStoredValuesResponse(BaseModel):
    """GET /api/bilibili/stored-values 的响应体。"""

    cookies: dict = Field(default_factory=dict)  # 所有 cookies 键值对
    sessdata: str = ""  # SESSDATA cookie 的值
    bili_jct: str = ""  # bili_jct（CSRF token）cookie 的值
    dedeuserid: str = ""  # DedeUserID cookie 的值
    access_token: str = ""  # OAuth access token
    refresh_token: str = ""  # OAuth refresh token
    cookie_string: str = ""  # 拼接好的完整 cookie 字符串
    ac_time_value: int = 0  # 客户端时间戳（Unix 秒），用于防重放
    ac_time_value_alt: str = ""  # 客户端时间戳（字符串格式）
    nav_info: Optional[dict] = None  # B站 nav 接口返回的 JSON 数据
    page_tokens: Optional[dict] = None  # 从 B站首页提取的各种 token


class BilibiliAcTimeValueResponse(BaseModel):
    """GET /api/bilibili/ac-time-value 的响应体。"""

    timestamp: int  # 当前 Unix 时间戳（秒）
    timestamp_ms: int  # 当前 Unix 时间戳（毫秒）
    ac_time_value: int  # 推算的 ac_time_value 值
    api_test: Optional[Any] = None  # 测试 B站 API 连通性的结果（状态码或错误文本）
