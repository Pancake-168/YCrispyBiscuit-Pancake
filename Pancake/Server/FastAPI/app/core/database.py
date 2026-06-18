from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import get_settings, BASE_DIR

settings = get_settings()

# 确保 SQLite 数据库文件所在目录存在
if settings.database_url.startswith("sqlite"):
    db_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
    db_dir = Path(db_path).parent
    if db_dir and not db_dir.is_absolute():
        db_dir = (BASE_DIR / db_dir).resolve()
    db_dir.mkdir(parents=True, exist_ok=True)

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
