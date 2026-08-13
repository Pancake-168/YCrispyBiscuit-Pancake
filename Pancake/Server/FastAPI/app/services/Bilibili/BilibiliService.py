"""B站 API 聚合服务。对外暴露统一的登录、用户查询、存储值获取和会话管理接口。

照单全收原则：所有 B站接口响应原样透传，不筛选字段；
存储值导出聚合 cookies、token、nav、指纹、页面变量等全部可用信息。
"""

import time  # ac_time_value 时间戳
from typing import Any, Optional  # 类型标注

from app.exceptions.errors import NotFoundError  # 会话不存在时抛出 404
from app.services.Bilibili.BilibiliLoginService import BilibiliLoginService  # 登录逻辑
from app.services.Bilibili.BilibiliPageService import (
    fetch_fingerprint,  # 拉取设备指纹
    fetch_nav_info,  # 拉取用户 nav 信息
    fetch_page_tokens,  # 全量提取页面变量
)
from app.services.Bilibili.BilibiliSession import BilibiliSession  # 会话模型


class BilibiliService:
    """Bilibili API 聚合服务：扫码登录、用户信息、全量存储值、会话管理。"""

    def __init__(self):
        self._sessions: dict[str, BilibiliSession] = {}  # 全局会话字典（key=8位短ID）
        self._qrcode_store: dict[str, dict] = {}  # 二维码状态字典
        # 委托登录逻辑（共享同一份会话/二维码状态字典）
        self._login_service = BilibiliLoginService(self._sessions, self._qrcode_store)

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

    async def get_user_info(self, session_id: str) -> dict:
        """根据 session_id 获取用户信息（nav 接口完整响应照单全收）。"""
        session = self._sessions.get(session_id)
        if not session:
            raise NotFoundError(f"会话不存在: {session_id}")
        return await fetch_nav_info(session)  # 完整响应透传，不挑字段

    # ------------------------------------------------------------------
    # 全量存储值
    # ------------------------------------------------------------------

    async def get_all_stored_values(self, session_id: str) -> dict:
        """获取会话中所有可用的 B站存储值（cookies/token/nav/指纹/页面变量全量聚合）。"""
        session = self._sessions.get(session_id)
        if not session:
            raise NotFoundError(f"会话不存在: {session_id}")

        # nav 完整响应（拿最新 Set-Cookie + 用户信息）
        try:
            nav = await fetch_nav_info(session)
        except Exception:
            nav = None  # nav 失败不阻塞主流程

        # 设备指纹端点的完整响应
        try:
            fingerprint = await fetch_fingerprint(session)
        except Exception:
            fingerprint = None  # 指纹失败不阻塞

        # 首页所有 window 变量的全量提取（含被 B站换位隐藏的字段）
        try:
            page_tokens = await fetch_page_tokens(session)
        except Exception:
            page_tokens = None  # 页面解析失败不阻塞

        # 基础导出 + 各来源全量数据聚合
        result = session.dump_stored_values()
        result["nav"] = nav  # nav 完整响应
        result["fingerprint"] = fingerprint  # 指纹端点完整响应
        result["page_tokens"] = page_tokens  # 页面变量全量提取
        return result

    # ------------------------------------------------------------------
    # ac_time_value
    # ------------------------------------------------------------------

    async def get_ac_time_value(self, session_id: str) -> dict:
        """获取 ac_time_value 及相关时间戳参数（全量返回，真实值随接口响应透传）。"""
        session = self._sessions.get(session_id)
        if not session:
            raise NotFoundError(f"会话不存在: {session_id}")

        result: dict[str, Any] = {
            "timestamp": int(time.time()),  # 当前 Unix 秒
            "timestamp_ms": int(time.time() * 1000),  # 当前 Unix 毫秒
            # ac_time_value 是 B站客户端的防重放时间戳：
            # 浏览器下由 JS 生成，服务端先给本地时间戳近似值；
            # 若任一接口响应里带回了真实值，会通过 page_tokens 全量透传出去
            "ac_time_value": int(time.time()),
        }

        # 全量提取页面变量：真实 ac_time_value 若还在页面/接口里就会被带出
        try:
            result["page_tokens"] = await fetch_page_tokens(session)
        except Exception:
            result["page_tokens"] = None  # 解析失败不阻塞

        # 调 B站 feed API 验证会话连通性
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
