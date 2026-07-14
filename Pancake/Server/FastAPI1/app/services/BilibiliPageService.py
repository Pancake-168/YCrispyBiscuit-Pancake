"""B站页面抓取与设备指纹服务。从 B站页面提取指纹、token 和渲染数据。"""

import json  # 解析 JSON
import re  # 正则提取页面中的 JS 变量
import time  # ac_time_value 时间戳

from app.services.BilibiliSession import BilibiliSession  # 会话模型
from app.services.BilibiliWbi import BILIBILI_USER_AGENT  # 统一 User-Agent


# ============================================================================
# 导航信息
# ============================================================================


async def fetch_nav_info(session: BilibiliSession) -> dict:
    """调 B站 /nav 接口获取用户信息，同时吸收响应中的 Set-Cookie。"""
    resp = await session.client.get(
        "https://api.bilibili.com/x/web-interface/nav",
        headers={"Referer": "https://www.bilibili.com/"},
    )
    session.absorb_response_cookies(resp)  # 吸收 Set-Cookie
    return resp.json()  # 返回 JSON（含 mid, uname, isLogin, vip, wallet 等）


# ============================================================================
# Cookie 辅助
# ============================================================================


def ensure_cookie(session: BilibiliSession, name: str, value: str) -> None:
    """仅在 cookie 不存在时才设置，避免覆盖已有值。"""
    if value and name not in session.cookies:
        session.cookies[name] = value
        session.client.cookies.set(name, value, domain=".bilibili.com")  # 设置 cookie 的域属性


# ============================================================================
# 设备指纹
# ============================================================================


async def fetch_fingerprint(session: BilibiliSession) -> None:
    """从多个 B站端点拉取设备指纹 cookies（buvid3/buvid4 等）。

    失败全部静默 — 指纹不是登录必需的，拿不到不影响核心功能。
    """
    headers = {"User-Agent": BILIBILI_USER_AGENT, "Referer": "https://www.bilibili.com/"}

    # 端点1：finger/spi → 获取 buvid3/buvid4
    try:
        resp = await session.client.get(
            "https://api.bilibili.com/x/frontend/finger/spi",
            headers=headers,
        )
        session.absorb_response_cookies(resp)  # 吸收所有 Set-Cookie
        data = resp.json()
        if data.get("code") == 0 and data.get("data"):
            d = data["data"]
            if d.get("b_3"):  # buvid3 的生成参数
                ensure_cookie(session, "buvid3", d["b_3"])
            if d.get("b_4"):  # buvid4 的生成参数
                ensure_cookie(session, "buvid4", d["b_4"])
    except Exception:
        pass  # 静默失败，指纹非必需

    # 端点2：gaia 网关 → 补充身份 cookies
    try:
        resp = await session.client.get(
            "https://api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi",
            headers=headers,
        )
        session.absorb_response_cookies(resp)
    except Exception:
        pass

    # 端点3：在线统计 → 触发 Set-Cookie
    try:
        resp = await session.client.get(
            "https://api.bilibili.com/x/web-interface/online",
            headers=headers,
        )
        session.absorb_response_cookies(resp)
    except Exception:
        pass


# ============================================================================
# 页面 token 提取
# ============================================================================


async def fetch_page_tokens(session: BilibiliSession) -> dict:
    """请求 B站首页，从 HTML 中正则提取 __RENDER_DATA__、__INITIAL_STATE__ 等 JS 变量。"""
    await fetch_fingerprint(session)  # 先确保指纹 cookies 就绪
    resp = await session.client.get(
        "https://www.bilibili.com/",
        headers={
            "User-Agent": BILIBILI_USER_AGENT,
            "Referer": "https://www.bilibili.com/",
        },
    )
    session.absorb_response_cookies(resp)  # 首页也会 set cookies
    html = resp.text  # 完整 HTML 文本

    tokens: dict[str, object] = {}  # 收集所有提取的 token

    # 提取 window.__RENDER_DATA__ = {...}
    render_match = re.search(r"window\.__RENDER_DATA__\s*=\s*({.*?})[\s;]", html)
    if render_match:
        try:
            tokens["__RENDER_DATA__"] = json.loads(render_match.group(1))  # 解析为 dict
        except json.JSONDecodeError:
            tokens["__RENDER_DATA__"] = render_match.group(1)[:500]  # 解析失败取前 500 字符

    # 提取 window.__INITIAL_STATE__ = {...};
    initial_state_match = re.search(r"window\.__INITIAL_STATE__\s*=\s*({.*?});", html)
    if initial_state_match:
        try:
            tokens["__INITIAL_STATE__"] = json.loads(initial_state_match.group(1))
        except json.JSONDecodeError:
            tokens["__INITIAL_STATE__"] = initial_state_match.group(1)[:500]

    # 提取 ac_time_value 模式（可能是 JS 赋值或 JSON 字段）
    ac_time_match = re.search(r'ac_time_value[=:]\s*["\']?(\d+)["\']?', html)
    if ac_time_match:
        tokens["ac_time_value_from_html"] = ac_time_match.group(1)

    # 收集所有已知指纹相关 cookie 的值
    for key in ["buvid3", "buvid4", "buvid_fp", "b_nut", "_uuid", "b_lsid", "b_source", "sid"]:
        val = session.cookies.get(key)
        if val:
            tokens[key] = val

    # 附加当前时间戳作为 ac_time_value 的备选值
    tokens["ac_time_value_current"] = int(time.time())  # Unix 秒
    tokens["ac_time_value_current_ms"] = int(time.time() * 1000)  # Unix 毫秒

    return tokens
