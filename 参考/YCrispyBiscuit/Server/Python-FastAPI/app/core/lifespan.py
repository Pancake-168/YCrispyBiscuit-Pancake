import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.logging import setup_logging
from app.core.config import get_settings
from app.db import connect_db, disconnect_db
from app.core.database import engine, Base

# Import entities to register them with SQLAlchemy
# from app.entities import calendar
# from app.entities import user


def create_lifespan():
    settings = get_settings()
    logger = logging.getLogger("app")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        setup_logging(settings.log_level)
        logger.info("应用启动中...")

        # 尝试连接数据库：失败时仅记录日志，不阻断应用启动
        app.state.db_connected = False
        try:
            await connect_db()
            app.state.db_connected = True
            logger.info("数据库已连接")
        except Exception as exc:
            logger.exception("数据库连接失败，继续运行无数据库模式: %s", exc)

        # 创建表
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("数据库表已创建或存在")
        except Exception as exc:
            logger.exception("数据库表创建失败: %s", exc)

        try:
            yield
        finally:
            # 优雅关闭：只有在已连接情况下尝试断开；失败也不阻断关闭
            if getattr(app.state, "db_connected", False):
                try:
                    await disconnect_db()
                    logger.info("数据库已断开连接")
                except Exception as exc:
                    logger.exception("数据库断开连接失败: %s", exc)
            logger.info("应用关闭完成")

    return lifespan
