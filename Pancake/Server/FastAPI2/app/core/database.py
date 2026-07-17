from pathlib import Path  # 路径处理和解析

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
)  # 异步引擎 + 会话类型
from sqlalchemy.orm import DeclarativeBase, sessionmaker  # ORM 声明式基类 + 会话工厂
from app.core.config import get_settings, WRITABLE_DIR  # 配置单例 + 可写目录路径

settings = get_settings()  # 获取全局配置实例

# ------------------------------------------------------------------
# SQLite 数据库路径解析（确保使用绝对路径，防止 CWD 变化导致数据库漂移）
# ------------------------------------------------------------------
if settings.database_url.startswith("sqlite"):  # 仅 SQLite 需要路径处理
    # 去掉 "sqlite+aiosqlite:///" 前缀，得到相对路径部分
    db_rel = settings.database_url.replace("sqlite+aiosqlite:///", "")
    db_abs = Path(db_rel)  # 转为 Path 对象
    if not db_abs.is_absolute():  # 相对路径 → 拼接可写目录
        db_abs = (WRITABLE_DIR / db_abs).resolve()  # resolve() 消除 .. 和符号链接
    db_abs.parent.mkdir(parents=True, exist_ok=True)  # 确保数据库文件父目录存在
    # 覆盖 settings 中的 URL，后续 SQLAlchemy 使用绝对路径
    settings.database_url = f"sqlite+aiosqlite:///{db_abs}"

# ------------------------------------------------------------------
# 引擎与会话
# ------------------------------------------------------------------

# 创建异步引擎（echo=debug 时打印 SQL 语句到日志）
engine = create_async_engine(settings.database_url, echo=settings.debug)

# 创建异步会话工厂（expire_on_commit=False 防止提交后属性过期，用于跨事务访问）
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ------------------------------------------------------------------
# 声明式 ORM 基类
# ------------------------------------------------------------------


class Base(DeclarativeBase):
    """所有 ORM 实体的基类。继承此类后 SQLAlchemy 自动映射表。"""

    pass


# ------------------------------------------------------------------
# 依赖注入：FastAPI Depends 使用
# ------------------------------------------------------------------


async def get_db():
    """为每个请求创建独立的数据库会话，请求结束后自动关闭。

    FastAPI 用法：db: AsyncSession = Depends(get_db)
    """
    async with async_session() as session:  # 开启会话上下文
        yield session  # 交给 FastAPI 调用层使用
    # with 块结束后自动调用 session.close() 归还连接到连接池
