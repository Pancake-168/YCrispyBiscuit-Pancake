from fastapi import APIRouter,HTTPException
from app.schemas.HealthSchema import HealthResponse
from app.services.HealthService import HealthService

router = APIRouter()
service=HealthService()

@router.get("/health",response_model=HealthResponse)
async def health():
    try:
        return await service.getHealth()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))