from app.mappers.HealthMapper import HealthMapper


class HealthService:
    def __init__(self, mapper: HealthMapper | None = None) -> None:
        self.mapper = mapper or HealthMapper()

    async def getHealth(self) -> dict[str, str]:
        return await self.mapper.selectHealthRaw()
