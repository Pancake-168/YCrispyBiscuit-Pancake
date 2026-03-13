"""数据访问层（Mapper/DAO）：实现与数据库/ORM 的交互方法（异步）"""


class HealthMapper:
    """示例 Mapper：与数据库交互的封装类（每文件一个类）"""

    async def select_health_raw(self) -> dict:
        """返回原始数据：mapper 不负责做类型转换到 response schema"""
        try:
            return {"status": "ok"}
        except Exception as e:
            raise ValueError(f"Failed to select health raw: {str(e)}")
