from sqlalchemy import text

# 用于执行原始 SQL 文本
from app.core.database import engine
# 异步 SQLAlchemy 引擎（已配置数据库连接）


async def connect_db():
    """验证数据库连通性。启动时调用，失败不阻断应用继续运行。"""
    # 使用异步上下文管理器获取连接，执行 SELECT 1 探测
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))


async def disconnect_db():
    """释放数据库引擎所有连接，优雅关闭时调用。"""
    await engine.dispose()  # 关闭连接池，释放所有活跃连接
