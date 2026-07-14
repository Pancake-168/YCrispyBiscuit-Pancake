"""健康检查服务。提供最基本的服务可用性验证。"""

from app.mappers.HealthMapper import HealthMapper  # 健康检查数据层


def get_health_service() -> "HealthService":
    """工厂函数：每次请求创建新实例（服务本身无状态）。"""
    return HealthService()


class HealthService:
    """健康检查业务逻辑。"""

    def __init__(self, mapper: HealthMapper | None = None) -> None:
        self.mapper = mapper or HealthMapper()  # 允许注入自定义 mapper，默认使用 HealthMapper

    async def get_health(self) -> dict[str, str]:
        """返回服务健康状态数据。"""
        return await self.mapper.select_health_raw()  # 委托 mapper 获取健康数据
