from app.schemas.HealthSchema import HealthResponse
from app.mappers.HealthMapper import HealthMapper


class HealthService:
    def __init__(self, mapper: HealthMapper | None = None) -> None:
        self.mapper = mapper or HealthMapper()

    async def getHealth(self) -> HealthResponse:
        try:
            data = await self.mapper.selectHealthRaw()
            return HealthResponse(**data)
        except Exception as e:
            raise ValueError(f"Failed to get health: {str(e)}")
