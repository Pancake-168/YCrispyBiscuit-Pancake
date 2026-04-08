from fastapi import APIRouter, HTTPException
from app.schemas.HealthSchema import HealthResponse
from app.services.HealthService import HealthService

router = APIRouter()
service = HealthService()


@router.get("/health", response_model=HealthResponse)
async def health():
    data = await service.getHealth()
    return HealthResponse(**data)
