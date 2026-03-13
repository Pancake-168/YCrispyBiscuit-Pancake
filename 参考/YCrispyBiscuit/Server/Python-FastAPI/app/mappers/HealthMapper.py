class HealthMapper:
    async def selectHealthRaw(self) -> dict:
        """返回原始数据：mapper 不负责做类型转换到 response schema"""
        try:
            return {"status": "ok"}
        except Exception as e:
            raise ValueError(f"系统健康检查失败: {str(e)}")
