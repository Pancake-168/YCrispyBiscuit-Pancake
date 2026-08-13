"""B站页面抓取与设备指纹服务。

照单全收原则：接口响应全量透传，页面变量通用提取（不指定字段名），
B站后续无论把字段换名还是换位置，都能被完整收集。
"""

import json  # JSON 解析（页面变量提取用 raw_decode）
import re  # 正则提取页面中的 JS 变量

from app.services.Bilibili.BilibiliSession import BilibiliSession  # 会话模型
from app.services.Bilibili.BilibiliWbi import BILIBILI_USER_AGENT  # 统一 User-Agent


# ============================================================================
# 导航信息
# ============================================================================


async def fetch_nav_info(session: BilibiliSession) -> dict:
    """调 B站 /nav 接口获取用户信息，同时吸收响应中的 Set-Cookie。"""
    resp = await session.client.get(
        "https://api.bilibili.com/x/web-interface/nav",
        headers={"Referer": "https://www.bilibili.com/"},
    )
    session.absorb_response_cookies(resp)  # 吸收 Set-Cookie（全量）
    return resp.json()  # 完整响应照单全收，不做字段筛选


# ============================================================================
# 设备指纹
# ============================================================================


async def fetch_fingerprint(session: BilibiliSession) -> dict:
    """从多个 B站端点拉取设备指纹 cookies（buvid3/buvid4 等），并全量收集响应。

    失败全部静默 — 指纹不是登录必需的，拿不到不影响核心功能；
    每个端点的响应（JSON 或原始文本）都放进返回字典，照单全收。
    """
    headers = {
        "User-Agent": BILIBILI_USER_AGENT,
        "Referer": "https://www.bilibili.com/",
    }
    collected: dict = {}  # 收集所有端点的完整响应

    # 端点1：finger/spi → 获取 buvid3/buvid4 等指纹 cookies
    try:
        resp = await session.client.get(
            "https://api.bilibili.com/x/frontend/finger/spi", headers=headers
        )
        session.absorb_response_cookies(resp)  # 吸收所有 Set-Cookie
        collected["spi"] = resp.json()  # 完整响应全量保留
    except Exception:
        pass  # 静默失败，指纹非必需

    # 端点2：gaia 网关 → 补充身份 cookies（当前接口可能已变更，能拿多少拿多少）
    try:
        resp = await session.client.get(
            "https://api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi",
            headers=headers,
        )
        session.absorb_response_cookies(resp)
        collected["gaia_gateway_status"] = resp.status_code  # 记录 HTTP 状态
        try:
            collected["gaia_gateway"] = resp.json()  # JSON 成功则全量保留
        except Exception:
            collected["gaia_gateway"] = resp.text[:200]  # 否则截断保留原文
    except Exception:
        pass

    # 端点3：在线统计 → 触发 Set-Cookie
    try:
        resp = await session.client.get(
            "https://api.bilibili.com/x/web-interface/online", headers=headers
        )
        session.absorb_response_cookies(resp)
        collected["online"] = resp.json()  # 完整响应全量保留
    except Exception:
        pass

    return collected


# ============================================================================
# 页面变量全量提取
# ============================================================================


async def fetch_page_tokens(session: BilibiliSession) -> dict:
    """请求 B站首页，把 HTML 里所有 window.XXX = ... 变量全量提取。

    不指定任何变量名：正则扫描所有 window.XXX 赋值点，
    每个赋值值先尝试 JSON 精确解析，解析不了截断保留原文——
    B站把字段换名/换位置（如 ac_time_value 被藏到别的变量）也能被完整收集。
    """
    await fetch_fingerprint(session)  # 先确保指纹 cookies 就绪
    resp = await session.client.get(
        "https://www.bilibili.com/",
        headers={
            "User-Agent": BILIBILI_USER_AGENT,
            "Referer": "https://www.bilibili.com/",
        },
    )
    session.absorb_response_cookies(resp)  # 首页也会 set cookies（全量吸收）
    html = resp.text  # 完整 HTML 文本

    tokens: dict = {}  # 收集所有提取到的变量

    # 通用提取：匹配所有 window.XXX = 赋值点，逐个尝试解析赋值内容
    for match in re.finditer(r"window\.(\w+)\s*=", html):
        name = match.group(1)  # 变量名（如 __RENDER_DATA__、__INITIAL_STATE__）
        raw = html[
            match.end() : match.end() + 5000
        ].strip()  # 取赋值号后的原文（截断上限）
        try:
            # raw_decode 精确解析一个 JSON 值（对象/数组/字符串/数字均可）
            value, _ = json.JSONDecoder().raw_decode(raw)
        except json.JSONDecodeError:
            value = raw[:500]  # 非 JSON（表达式/undefined）→ 截断保留原文
        tokens[name] = value

    tokens["cookies_after_homepage"] = dict(session.cookies)  # 首页后的全量 cookies
    tokens["html_length"] = len(html)  # 页面长度（便于判断页面结构是否变化）
    return tokens
