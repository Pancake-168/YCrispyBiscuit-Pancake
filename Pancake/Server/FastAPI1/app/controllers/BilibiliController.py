from fastapi import APIRouter, Depends  # APIRouter=路由分组 Depends=依赖注入
from app.schemas.BilibiliSchema import (
    BilibiliLoginUrlResponse,  # 获取登录二维码 URL 的响应
    BilibiliPollResponse,  # 轮询扫码状态的响应
    BilibiliCookieLoginRequest,  # Cookie 登录的请求体
    BilibiliSessionResponse,  # 登录成功返回的 session_id
    BilibiliUserInfoResponse,  # 用户信息响应
    BilibiliStoredValuesResponse,  # 会话存储值响应
    BilibiliAcTimeValueResponse,  # ac_time_value 响应
)
from app.services.BilibiliService import BilibiliService, get_bilibili_service  # B站服务 + 工厂

router = APIRouter()  # 创建此模块的路由实例


# ============================================================================
# 登录流程
# ============================================================================

@router.get(
    "/bilibili/login/url",  # 路径: /api/bilibili/login/url
    summary="获取B站扫码登录URL",
    tags=["Bilibili"],
    response_model=BilibiliLoginUrlResponse,
)
async def get_login_url(
    service: BilibiliService = Depends(get_bilibili_service),  # 注入服务（模块级单例）
):
    """获取B站二维码登录的URL和 qrcode_key，前端据此生成二维码图片。"""
    result = await service.get_login_url()  # 调 B站 API 生成 qrcode_key
    return BilibiliLoginUrlResponse(**result)  # dict → Pydantic 校验


@router.get(
    "/bilibili/login/poll",  # 路径: /api/bilibili/login/poll?qrcode_key=xxx
    summary="轮询扫码登录状态",
    tags=["Bilibili"],
    response_model=BilibiliPollResponse,
)
async def poll_login(
    qrcode_key: str,  # 由 get_login_url 返回的二维码 key
    service: BilibiliService = Depends(get_bilibili_service),
):
    """轮询二维码扫码状态，成功登录后返回 session_id 和 cookies。"""
    result = await service.poll_qr_login(qrcode_key)  # 调 B站 API 查询扫码状态
    return BilibiliPollResponse(**result)


@router.post(
    "/bilibili/login/cookie",  # 路径: /api/bilibili/login/cookie
    summary="通过Cookie直接登录",
    tags=["Bilibili"],
    response_model=BilibiliSessionResponse,
)
async def login_by_cookie(
    req: BilibiliCookieLoginRequest,  # 从请求体 JSON 解析 cookie 字段
    service: BilibiliService = Depends(get_bilibili_service),
):
    """直接输入 Cookie 字符串进行登录，无需扫码。"""
    session_id = await service.login_by_cookie(req.cookie)  # 解析 cookie 建立会话
    return BilibiliSessionResponse(session_id=session_id)  # 返回新会话 ID


# ============================================================================
# 用户与数据查询
# ============================================================================

@router.get(
    "/bilibili/user",  # 路径: /api/bilibili/user?session_id=xxx
    summary="获取B站用户信息",
    tags=["Bilibili"],
    response_model=BilibiliUserInfoResponse,
)
async def get_user_info(
    session_id: str,  # 会话标识符
    service: BilibiliService = Depends(get_bilibili_service),
):
    """根据 session_id 获取当前登录用户的 mid、用户名、VIP 状态等。"""
    result = await service.get_user_info(session_id)  # 调 B站 nav 接口取用户数据
    return BilibiliUserInfoResponse(**result)


@router.get(
    "/bilibili/stored-values",  # 路径: /api/bilibili/stored-values?session_id=xxx
    summary="获取所有B站存储值",
    tags=["Bilibili"],
    response_model=BilibiliStoredValuesResponse,
)
async def get_stored_values(
    session_id: str,
    service: BilibiliService = Depends(get_bilibili_service),
):
    """获取当前会话中所有可用的 B站存储值，包括 cookies、token 和 ac_time_value 等。"""
    result = await service.get_all_stored_values(session_id)  # 聚合所有存储值
    return BilibiliStoredValuesResponse(**result)


@router.get(
    "/bilibili/ac-time-value",  # 路径: /api/bilibili/ac-time-value?session_id=xxx
    summary="获取ac_time_value",
    tags=["Bilibili"],
    response_model=BilibiliAcTimeValueResponse,
)
async def get_ac_time_value(
    session_id: str,
    service: BilibiliService = Depends(get_bilibili_service),
):
    """专门获取 ac_time_value 及相关参数（客户端时间戳、API 连通性等）。"""
    result = await service.get_ac_time_value(session_id)  # 计算并测试 ac_time_value
    return BilibiliAcTimeValueResponse(**result)


# ============================================================================
# 会话管理
# ============================================================================

@router.get(
    "/bilibili/sessions",  # 路径: /api/bilibili/sessions
    summary="列出所有活跃会话",
    tags=["Bilibili"],
)
async def list_sessions(
    service: BilibiliService = Depends(get_bilibili_service),
):
    """列出当前所有活跃的 B站会话 ID 列表。"""
    return {"sessions": service.list_sessions()}  # 直接返回 dict 包装的列表


@router.delete(
    "/bilibili/session",  # 路径: /api/bilibili/session?session_id=xxx
    summary="删除会话",
    tags=["Bilibili"],
)
async def delete_session(
    session_id: str,  # 要删除的会话 ID
    service: BilibiliService = Depends(get_bilibili_service),
):
    """删除指定会话，释放内存中的 session 和 cookies。"""
    service.delete_session(session_id)  # 从内部字典移除
    return {"message": f"Session {session_id} deleted"}  # 返回确认消息
