"""B站 API 聚合服务。对外暴露统一的登录、用户查询、存储值获取和会话管理接口。"""

import time  # ac_time_value 时间戳
from typing import Any, Optional

from app.exceptions.errors import NotFoundError  # 会话不存在时抛出 404
from app.services.BilibiliLoginService import BilibiliLoginService  # 登录逻辑
from app.services.BilibiliPageService import (
    fetch_fingerprint,  # 拉取设备指纹
    fetch_nav_info,  # 拉取用户 nav 信息
    fetch_page_tokens,  # 从 B站首页提取 JS 变量
)
from app.services.BilibiliSession import BilibiliSession  # 会话模型


class BilibiliService:
    """Bilibili API service: QR login, user info, stored values.

    此模块是 B站功能的聚合入口，持有全局会话字典，委托子模块执行具体逻辑。
    """

    def __init__(self):
        self._sessions: dict[str, BilibiliSession] = {}  # 全局会话字典（key=8位短ID）
        self._qrcode_store: dict[str, dict] = {}  # 二维码状态字典
        self._login_service = BilibiliLoginService(self._sessions, self._qrcode_store)  # 委托登录逻辑

    # ------------------------------------------------------------------
    # QR 登录
    # ------------------------------------------------------------------

    async def get_login_url(self) -> dict:
        """获取 B站登录二维码 URL 和 key。"""
        return await self._login_service.get_login_url()  # 委托给登录子服务

    async def poll_qr_login(self, qrcode_key: str) -> dict:
        """轮询二维码扫码状态。"""
        return await self._login_service.poll_qr_login(qrcode_key)

    # ------------------------------------------------------------------
    # Cookie 登录
    # ------------------------------------------------------------------

    async def login_by_cookie(self, cookie_str: str) -> str:
        """通过 Cookie 字符串登录，返回 session_id。"""
        return await self._login_service.login_by_cookie(cookie_str)

    # ------------------------------------------------------------------
    # 用户 / nav 信息
    # ------------------------------------------------------------------

    async def _fetch_nav_info(self, session: BilibiliSession) -> dict:
        """内部用：拉取 nav 信息。"""
        return await fetch_nav_info(session)

    async def get_nav_info(self, session_id: str) -> dict:
        """对外接口：根据 session_id 获取 B站 nav 信息。"""
        session = self._sessions.get(session_id)  # 查找会话
        if not session:
            raise NotFoundError(f"Session {session_id} not found")  # 会话不存在 → 404
        return await fetch_nav_info(session)  # 调 B站 API 获取 nav 信息

    async def get_user_info(self, session_id: str) -> dict:
        """对外接口：根据 session_id 获取用户基本信息。"""
        session = self._sessions.get(session_id)
        if not session:
            raise NotFoundError(f"Session {session_id} not found")
        nav = await self.get_nav_info(session_id)  # 获取完整 nav 数据
        # 仅提取用户关心的字段
        return {
            "mid": nav.get("data", {}).get("mid"),  # 用户数字 ID
            "uname": nav.get("data", {}).get("uname"),  # 用户名
            "isLogin": nav.get("data", {}).get("isLogin"),  # 是否登录
            "vip": nav.get("data", {}).get("vip"),  # 大会员信息
            "wallet": nav.get("data", {}).get("wallet"),  # 钱包信息
        }

    # ------------------------------------------------------------------
    # 存储值
    # ------------------------------------------------------------------

    async def get_all_stored_values(self, session_id: str) -> dict:
        """获取会话中所有可用的 B站存储值。"""
        session = self._sessions.get(session_id)
        if not session:
            raise NotFoundError(f"Session {session_id} not found")

        # 先获取 nav 信息以捕获最新的 Set-Cookie
        try:
            nav = await self.get_nav_info(session_id)
        except Exception:
            nav = None  # nav 失败不阻塞主流程

        # 尝试从 B站首页提取额外 token（__RENDER_DATA__ 等）
        try:
            page_tokens = await self._fetch_page_tokens(session)
        except Exception:
            page_tokens = None  # 页面解析失败不阻塞

        # 导出会话中的所有存储值
        result = session.dump_stored_values()
        result["nav_info"] = nav.get("data") if nav else None  # nav data 子对象
        result["page_tokens"] = page_tokens  # 页面 token 数据

        return result

    async def _fetch_fingerprint(self, session: BilibiliSession):
        """内部用：拉取设备指纹。"""
        await fetch_fingerprint(session)

    async def _fetch_page_tokens(self, session: BilibiliSession) -> dict:
        """内部用：从 B站首页提取 JS 变量。"""
        return await fetch_page_tokens(session)

    # ------------------------------------------------------------------
    # ac_time_value
    # ------------------------------------------------------------------

    async def get_ac_time_value(self, session_id: str) -> dict:
        """获取 ac_time_value 及相关时间戳参数。"""
        session = self._sessions.get(session_id)
        if not session:
            raise NotFoundError(f"Session {session_id} not found")

        result: dict[str, Any] = {
            "timestamp": int(time.time()),  # 当前 Unix 秒
            "timestamp_ms": int(time.time() * 1000),  # 当前 Unix 毫秒
        }

        # ac_time_value 是 B站客户端的防重放时间戳。
        # 在浏览器环境下由 JS（Math.floor(Date.now()/1000)）生成。
        # 服务端无法执行 JS，因此用本地时间戳作为近似值。
        result["ac_time_value"] = int(time.time())

        # 尝试调 B站 feed API 以验证会话连通性
        try:
            resp = await session.client.get(
                "https://api.bilibili.com/x/web-interface/wbi/index/top/feed/0",
                headers={"Referer": "https://www.bilibili.com/"},
            )
            result["api_test"] = resp.status_code  # 记录 HTTP 状态码
        except Exception:
            result["api_test"] = "failed"  # 请求失败标记

        return result

    # ------------------------------------------------------------------
    # 会话管理
    # ------------------------------------------------------------------

    def get_session(self, session_id: str) -> Optional[BilibiliSession]:
        """获取指定会话对象，不存在返回 None。"""
        return self._sessions.get(session_id)

    def list_sessions(self) -> list[str]:
        """列出所有活跃会话的 ID 列表。"""
        return list(self._sessions.keys())

    def delete_session(self, session_id: str):
        """删除指定会话及其所有状态。"""
        self._sessions.pop(session_id, None)  # pop 不存在时返回 None，不抛异常


# ============================================================================
# 工厂
# ============================================================================

# 模块级单例：B站会话状态需要在整个进程中共享
_bilibili_service = BilibiliService()


def get_bilibili_service() -> BilibiliService:
    """返回全局单例 BilibiliService。"""
    return _bilibili_service
