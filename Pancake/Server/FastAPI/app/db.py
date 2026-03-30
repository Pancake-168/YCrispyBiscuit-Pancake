from sqlalchemy import text
from app.core.database import engine


async def connect_db():
    # 验证数据库连通性，统一走 SQLAlchemy async 引擎。
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))


async def disconnect_db():
    await engine.dispose()
