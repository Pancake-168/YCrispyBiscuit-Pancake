from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import get_settings

settings = get_settings()

# 创建异步引擎
engine = create_async_engine(settings.database_url, echo=settings.debug)

# 创建异步会话工厂
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# 声明式基类
class Base(DeclarativeBase):
    pass

# 获取会话的依赖函数
async def get_db():
    async with async_session() as session:
        yield session