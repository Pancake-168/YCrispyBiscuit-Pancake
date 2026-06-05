from fastapi import APIRouter
from app.schemas.BilibiliSchema import (
    BilibiliLoginUrlResponse,
    BilibiliPollResponse,
    BilibiliCookieLoginRequest,
    BilibiliSessionResponse,
    BilibiliUserInfoResponse,
    BilibiliStoredValuesResponse,
    BilibiliAcTimeValueResponse,
)
from app.services.BilibiliService import BilibiliService

router = APIRouter()
service = BilibiliService()


@router.get(
    "/bilibili/login/url",
    summary="获取B站扫码登录URL",
    tags=["Bilibili"],
    response_model=BilibiliLoginUrlResponse,
)
async def get_login_url():
    """获取B站二维码登录的URL和key"""
    result = await service.get_login_url()
    return BilibiliLoginUrlResponse(**result)


@router.get(
    "/bilibili/login/poll",
    summary="轮询扫码登录状态",
    tags=["Bilibili"],
    response_model=BilibiliPollResponse,
)
async def poll_login(qrcode_key: str):
    """轮询二维码扫码状态，成功登录后返回session_id和cookies"""
    result = await service.poll_qr_login(qrcode_key)
    return BilibiliPollResponse(**result)


@router.post(
    "/bilibili/login/cookie",
    summary="通过Cookie直接登录",
    tags=["Bilibili"],
    response_model=BilibiliSessionResponse,
)
async def login_by_cookie(req: BilibiliCookieLoginRequest):
    """直接输入Cookie字符串进行登录"""
    session_id = await service.login_by_cookie(req.cookie)
    return BilibiliSessionResponse(session_id=session_id)


@router.get(
    "/bilibili/user",
    summary="获取B站用户信息",
    tags=["Bilibili"],
    response_model=BilibiliUserInfoResponse,
)
async def get_user_info(session_id: str):
    """根据session_id获取当前登录用户信息"""
    result = await service.get_user_info(session_id)
    return BilibiliUserInfoResponse(**result)


@router.get(
    "/bilibili/stored-values",
    summary="获取所有B站存储值",
    tags=["Bilibili"],
    response_model=BilibiliStoredValuesResponse,
)
async def get_stored_values(session_id: str):
    """获取当前会话中所有可用的B站存储值，包括cookies、token和ac_time_value等"""
    result = await service.get_all_stored_values(session_id)
    return BilibiliStoredValuesResponse(**result)


@router.get(
    "/bilibili/ac-time-value",
    summary="获取ac_time_value",
    tags=["Bilibili"],
    response_model=BilibiliAcTimeValueResponse,
)
async def get_ac_time_value(session_id: str):
    """专门获取ac_time_value及相关参数"""
    result = await service.get_ac_time_value(session_id)
    return BilibiliAcTimeValueResponse(**result)


@router.get(
    "/bilibili/sessions",
    summary="列出所有活跃会话",
    tags=["Bilibili"],
)
async def list_sessions():
    """列出当前所有活跃的B站会话ID"""
    return {"sessions": service.list_sessions()}


@router.delete(
    "/bilibili/session",
    summary="删除会话",
    tags=["Bilibili"],
)
async def delete_session(session_id: str):
    """删除指定会话"""
    service.delete_session(session_id)
    return {"message": f"Session {session_id} deleted"}
