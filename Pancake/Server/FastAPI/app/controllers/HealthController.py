from fastapi import APIRouter
from app.schemas.HealthSchema import HealthResponse
from app.services.HealthService import HealthService

router = APIRouter()
service = HealthService()


@router.get(
    "/health", summary="健康检查", tags=["Health"], response_model=HealthResponse
)
async def health():
    data = await service.getHealth()
    return HealthResponse(**data)
