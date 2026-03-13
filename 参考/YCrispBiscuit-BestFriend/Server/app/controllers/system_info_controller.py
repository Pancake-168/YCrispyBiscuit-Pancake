from fastapi import APIRouter, WebSocket, HTTPException
import asyncio
from app.services.system_info_service import SystemInfoService

router = APIRouter()
_service = SystemInfoService()


@router.websocket("/system-info")
async def websocket_system_info(websocket: WebSocket):
    """WebSocket 端点：实时推送系统信息"""
    await websocket.accept()
    while True:
        try:
            info = _service.get_system_info()
            await websocket.send_json(info)
        except Exception as e:
            await websocket.send_json({"error": "Internal server error"})
            break
        await asyncio.sleep(1)  # 每秒推送