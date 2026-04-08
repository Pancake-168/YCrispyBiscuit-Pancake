class HealthMapper:
    async def selectHealthRaw(self) -> dict:
        """返回原始数据：mapper 不负责做类型转换到 response schema"""
        return {"status": "ok"}
