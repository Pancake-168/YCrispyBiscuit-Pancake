"""B站登录服务。处理扫码登录、Cookie 登录和登录后的会话构建。"""

import urllib.parse  # URL 编码（生成二维码图片链接）
import uuid  # 生成唯一 session_id

import httpx  # 异步 HTTP 客户端

from app.exceptions.errors import (
    ExternalServiceError,
)  # 外部服务异常（B站 API 返回错误时抛出）
from app.services.Bilibili.BilibiliPageService import (
    fetch_fingerprint,  # 设备指纹抓取
    fetch_nav_info,  # 导航信息
)
from app.services.Bilibili.BilibiliSession import BilibiliSession  # 会话模型
from app.services.Bilibili.BilibiliWbi import BILIBILI_USER_AGENT  # 统一 User-Agent


class BilibiliLoginService:
    """Bilibili 登录业务逻辑，由 BilibiliService 持有和调用。"""

    def __init__(self, sessions: dict, qrcode_store: dict):
        self._sessions = sessions  # 共享的全局会话字典（key=session_id）
        self._qrcode_store = qrcode_store  # 共享的二维码状态字典（key=qrcode_key）

    # ------------------------------------------------------------------
    # QR 扫码登录
    # ------------------------------------------------------------------

    async def get_login_url(self) -> dict:
        """调 B站 API 生成登录二维码，返回 qrcode_key 和二维码图片地址。"""
        async with httpx.AsyncClient() as cli:  # 创建临时 HTTP 客户端
            resp = await cli.get(
                "https://passport.bilibili.com/x/passport-login/web/qrcode/generate",
                headers={"User-Agent": BILIBILI_USER_AGENT},
            )
        data = resp.json()  # 解析 JSON 响应
        if data.get("code") != 0:  # B站 API 返回非 0 表示失败
            raise ExternalServiceError(f"获取B站登录二维码失败: {data}")
        qr_data = data.get("data") or {}
        key = qr_data.get("qrcode_key")  # 二维码唯一标识
        qr_content = qr_data.get("url", "")  # 二维码承载的 URL（B站登录页）
        self._qrcode_store[key] = {
            "status": "pending",
            "session": None,
        }  # 记录为待扫码状态
        return {
            "qrcode_key": key,
            "url": qr_content,
            # 通过第三方 qrserver API 将 B站 URL 渲染为可显示的二维码图片
            "qrcode_image": (
                "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data="
                + urllib.parse.quote(qr_content, safe="")
            ),
            "generate_response": data,  # 生成接口的完整响应照单全收
        }

    async def poll_qr_login(self, qrcode_key: str) -> dict:
        """轮询二维码扫码状态。

        注意：B站已调整响应结构，真实状态码在 data.code（顶层 code 恒为 0）：
        86101=未扫码、86090=已扫码未确认、0=已确认登录。
        """
        async with httpx.AsyncClient() as cli:
            resp = await cli.get(
                "https://passport.bilibili.com/x/passport-login/web/qrcode/poll",
                params={"qrcode_key": qrcode_key},  # 查询参数
                headers={"User-Agent": BILIBILI_USER_AGENT},
            )
        data = resp.json()
        inner = data.get("data") or {}  # 新结构：真实状态在 data.data 内
        code = inner.get("code")  # 真实状态码
        if code == 86101:  # 未扫码
            return {"status": "waiting", "message": "等待扫码"}
        if code == 86090:  # 已扫码但未确认
            return {"status": "scanned", "message": "已扫码，等待确认"}
        if code != 0:  # 其他非零 → 二维码过期或错误
            return {
                "status": "expired",
                "message": inner.get("message") or "二维码已过期",
            }
        # code == 0 → 用户已确认登录
        session = await self._build_session_from_qr(resp, inner)  # 构建会话
        session_id = str(uuid.uuid4())[:8]  # 生成 8 位短 ID
        self._sessions[session_id] = session  # 注册到全局会话字典
        self._qrcode_store[qrcode_key] = {"status": "done", "session_id": session_id}
        return {
            "status": "done",
            "session_id": session_id,
            "cookies": session.cookies,
            "refresh_token": session.refresh_token,
            "poll_response": data,  # 轮询接口的完整响应照单全收
        }

    # ------------------------------------------------------------------
    # Cookie 登录
    # ------------------------------------------------------------------

    async def login_by_cookie(self, cookie_str: str) -> str:
        """用用户提供的 Cookie 字符串直接创建会话。"""
        session = BilibiliSession()  # 新建空会话
        session.set_cookies(cookie_str)  # 解析并设置 cookies（全量）
        # 拉取指纹和 nav 信息以验证 cookies 是否有效（失败静默，不影响会话建立）
        await fetch_fingerprint(session)
        await fetch_nav_info(session)
        session_id = str(uuid.uuid4())[:8]  # 生成 8 位短 ID
        self._sessions[session_id] = session  # 注册
        return session_id

    # ------------------------------------------------------------------
    # 内部
    # ------------------------------------------------------------------

    async def _build_session_from_qr(
        self, response, login_data: dict
    ) -> BilibiliSession:
        """从扫码登录的 HTTP 响应和 data.data 构建 BilibiliSession。"""
        session = BilibiliSession()
        session.absorb_response_cookies(response)  # 从轮询响应头提取 Set-Cookie
        if login_data.get("refresh_token"):  # 提取 refresh_token
            session.refresh_token = login_data["refresh_token"]
        if login_data.get("token"):  # 提取 access_token
            session.access_token = login_data["token"]
        # 确认登录后，B站会把完整登录 cookies 放在确认 URL 的响应里；
        # 访问该 URL 全量吸收 SESSDATA 等凭证（失败静默，不影响会话创建）
        confirm_url = login_data.get("url")
        if confirm_url:
            try:
                confirm_resp = await session.client.get(confirm_url)
                session.absorb_response_cookies(confirm_resp)
            except Exception:
                pass  # 确认 URL 请求失败时依赖轮询响应里已有的 cookies
        # 拉取设备指纹和 nav 信息以预热会话
        await fetch_fingerprint(session)
        if session.sessdata:  # 有 SESSDATA 才拉取 nav（说明登录成功）
            await fetch_nav_info(session)
        return session
