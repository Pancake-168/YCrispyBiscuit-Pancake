"""Bilibili 登录/信息获取的 Pydantic 模型。

照单全收原则：响应模型不声明任何字段（extra="allow"），
B站接口返回什么就透传什么，前端按全量 JSON 展示；
只有必须由前端提交的请求体才声明字段。
"""

from pydantic import BaseModel, ConfigDict  # BaseModel=序列化基类 ConfigDict=模型配置


class BilibiliLoginUrlResponse(BaseModel):
    """GET /api/bilibili/login/url 的响应体（全量透传，不声明字段清单）。"""

    model_config = ConfigDict(extra="allow")  # 服务层返回的所有键值原样输出


class BilibiliPollResponse(BaseModel):
    """GET /api/bilibili/login/poll 的响应体（全量透传，不声明字段清单）。"""

    model_config = ConfigDict(extra="allow")  # 服务层返回的所有键值原样输出


class BilibiliCookieLoginRequest(BaseModel):
    """POST /api/bilibili/login/cookie 的请求体。"""

    cookie: str  # 用户粘贴的完整 Cookie 字符串


class BilibiliSessionResponse(BaseModel):
    """POST /api/bilibili/login/cookie 的响应体（全量透传，不声明字段清单）。"""

    model_config = ConfigDict(extra="allow")


class BilibiliUserInfoResponse(BaseModel):
    """GET /api/bilibili/user 的响应体（nav 接口完整响应全量透传）。"""

    model_config = ConfigDict(extra="allow")


class BilibiliStoredValuesResponse(BaseModel):
    """GET /api/bilibili/stored-values 的响应体（全量透传）。"""

    model_config = ConfigDict(extra="allow")


class BilibiliAcTimeValueResponse(BaseModel):
    """GET /api/bilibili/ac-time-value 的响应体（全量透传）。"""

    model_config = ConfigDict(extra="allow")
