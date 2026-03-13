import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.logging import setup_logging
from app.core.config import get_settings
from app.db import connect_db, disconnect_db
from app.core.database import engine, Base

# Import entities to register them with SQLAlchemy
from app.entities import calendar
from app.entities import user


def create_lifespan():
    settings = get_settings()
    logger = logging.getLogger("app")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        setup_logging(settings.log_level)
        logger.info("Application starting...")

        # 尝试连接数据库：失败时仅记录日志，不阻断应用启动
        app.state.db_connected = False
        try:
            await connect_db()
            app.state.db_connected = True
            logger.info("Database connected")
        except Exception as exc:
            logger.exception("Database connect failed, continue running without DB: %s", exc)

        # 创建表
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Tables created")
        except Exception as exc:
            logger.exception("Table creation failed: %s", exc)

        try:
            yield
        finally:
            # 优雅关闭：只有在已连接情况下尝试断开；失败也不阻断关闭
            if getattr(app.state, "db_connected", False):
                try:
                    await disconnect_db()
                    logger.info("Database disconnected")
                except Exception as exc:
                    logger.exception("Database disconnect failed: %s", exc)
            logger.info("Application shutdown complete")

    return lifespan
