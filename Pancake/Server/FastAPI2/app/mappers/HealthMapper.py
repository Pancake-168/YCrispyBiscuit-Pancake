class HealthMapper:
    """健康检查数据层。当前直接返回常量数据，不访问数据库。"""

    async def select_health_raw(self) -> dict:
        """返回健康状态原始数据。mapper 不负责类型转换到 response schema。"""
        return {"status": "ok"}  # 硬编码健康状态，无需数据库查询

