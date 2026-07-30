from pathlib import Path

from sqlmodel import SQLModel, create_engine, Session
from app.core.config import get_settings, WRITABLE_DIR

settings = get_settings()

# SQLite 路径解析：确保使用绝对路径
if settings.database_url.startswith("sqlite"):
    db_rel = settings.database_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    db_abs = Path(db_rel)
    if not db_abs.is_absolute():
        db_abs = (WRITABLE_DIR / db_abs).resolve()
    db_abs.parent.mkdir(parents=True, exist_ok=True)
    settings.database_url = f"sqlite:///{db_abs}"

# 同步引擎（SQLModel 基于 SQLAlchemy 2.0，线程安全）
engine = create_engine(settings.database_url, echo=settings.debug)


def create_db_and_tables():
    """创建所有 SQLModel 注册的表。启动时调用。"""
    SQLModel.metadata.create_all(engine)


def get_session():
    """每个请求获取独立会话，结束后自动关闭。"""
    with Session(engine) as session:
        yield session

