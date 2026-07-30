import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.logging import setup_logging
from app.core.config import get_settings
from app.db import connect_db, disconnect_db
from app.core.database import create_db_and_tables


def create_lifespan():
    settings = get_settings()
    logger = logging.getLogger("app")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        setup_logging(settings.log_level)

        banner = f"""
  ╔══════════════════════════════════════════════════════════
  ║
  ║     MaiBot
  ║     LLM 智能体 · 长期记忆
  ║
  ║     启动中...
  ║
  ║     Swagger      http://{settings.host}:{settings.port}/docs
  ║
  ╚══════════════════════════════════════════════════════════
"""
        print(banner, flush=True)
        logger.info("MaiBot 启动中...")

        # 数据库连接验证
        app.state.db_connected = False
        try:
            connect_db()
            app.state.db_connected = True
            logger.info("数据库已连接")
        except Exception as exc:
            logger.exception("数据库连接失败: %s", exc)

        # 自动建表（开发阶段默认开启）
        try:
            create_db_and_tables()
            logger.info("数据库表已就绪")
        except Exception as exc:
            logger.exception("数据库建表失败: %s", exc)

        try:
            yield
        finally:
            if getattr(app.state, "db_connected", False):
                try:
                    disconnect_db()
                    logger.info("数据库已断开")
                except Exception as exc:
                    logger.exception("数据库断开失败: %s", exc)
            logger.info("应用关闭完成")

    return lifespan
