from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import get_settings, WRITABLE_DIR

settings = get_settings()

# 确保 SQLite 数据库使用绝对路径，否则 SQLAlchemy 以 CWD 为基准解析
if settings.database_url.startswith("sqlite"):
    db_rel = settings.database_url.replace("sqlite+aiosqlite:///", "")
    db_abs = Path(db_rel)
    if not db_abs.is_absolute():
        db_abs = (WRITABLE_DIR / db_abs).resolve()
    db_abs.parent.mkdir(parents=True, exist_ok=True)
    # 覆盖为绝对路径 URL，避免 CWD 变化导致数据库位置漂移
    settings.database_url = f"sqlite+aiosqlite:///{db_abs}"

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
