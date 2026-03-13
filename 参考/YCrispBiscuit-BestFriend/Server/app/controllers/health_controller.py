from fastapi import APIRouter, HTTPException
from app.schemas.health_schema import HealthResponse
from app.services.health_service import HealthService

router = APIRouter()
_service = HealthService()


@router.get("/health", response_model=HealthResponse)
async def health():
    try:
        """Route layer: 只负责 HTTP 层，调用 service 并返回 schema 定义的类型"""
        return await _service.get_health()
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")
