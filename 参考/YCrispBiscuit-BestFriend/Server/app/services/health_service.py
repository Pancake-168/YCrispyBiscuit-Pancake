from app.schemas.health_schema import HealthResponse
from app.mappers.health_mapper import HealthMapper


class HealthService:
    """业务逻辑层：每文件一个类，依赖注入 mapper"""

    def __init__(self, mapper: HealthMapper | None = None) -> None:
        self._mapper = mapper or HealthMapper()

    async def get_health(self) -> HealthResponse:
        try:
            data = await self._mapper.select_health_raw()
            return HealthResponse(**data)
        except Exception as e:
            raise ValueError(f"Failed to get health: {str(e)}")
