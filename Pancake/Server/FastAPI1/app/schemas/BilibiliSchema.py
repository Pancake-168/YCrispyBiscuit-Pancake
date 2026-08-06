from pydantic import BaseModel, ConfigDict  # ConfigDict=模型级配置


# ============================================================================
# Bilibili 登录相关
# ============================================================================

class BilibiliLoginUrlResponse(BaseModel):
    """GET /api/bilibili/login/url 的响应体（全量透传，不硬编码字段清单）。"""

    # 允许任意额外字段：服务层返回的所有键值原样输出
    model_config = ConfigDict(extra="allow")


class BilibiliPollResponse(BaseModel):
    """GET /api/bilibili/login/poll 的响应体（全量透传，不硬编码字段清单）。"""

    # 允许任意额外字段：服务层返回的所有键值原样输出
    model_config = ConfigDict(extra="allow")


class BilibiliCookieLoginRequest(BaseModel):
    """POST /api/bilibili/login/cookie 的请求体。"""

    cookie: str  # 用户粘贴的完整 Cookie 字符串


class BilibiliSessionResponse(BaseModel):
    """POST /api/bilibili/login/cookie 的响应体（全量透传，不硬编码字段清单）。"""

    # 允许任意额外字段：服务层返回的所有键值原样输出
    model_config = ConfigDict(extra="allow")


# ============================================================================
# Bilibili 用户/数据查询
# ============================================================================

class BilibiliUserInfoResponse(BaseModel):
    """GET /api/bilibili/user 的响应体（全量透传，不硬编码字段清单）。"""

    # 允许任意额外字段：服务层返回的所有键值原样输出
    model_config = ConfigDict(extra="allow")


class BilibiliStoredValuesResponse(BaseModel):
    """GET /api/bilibili/stored-values 的响应体（全量透传，不硬编码字段清单）。"""

    # 允许任意额外字段：服务层返回的所有键值原样输出，避免维护字段清单导致数据遗漏
    model_config = ConfigDict(extra="allow")


class BilibiliAcTimeValueResponse(BaseModel):
    """GET /api/bilibili/ac-time-value 的响应体（全量透传，不硬编码字段清单）。"""

    # 允许任意额外字段：服务层返回的所有键值原样输出，避免维护字段清单导致数据遗漏
    model_config = ConfigDict(extra="allow")
