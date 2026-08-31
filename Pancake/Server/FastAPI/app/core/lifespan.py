import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.logging import setup_logging
from app.core.config import get_settings
from app.db import connect_db, disconnect_db
from app.core.database import engine, Base
from app.dsh_proxy import (
    start_dsh_proxy_server,
    wait_dsh_proxy_started,
    stop_dsh_proxy_server,
)

# 显式导入全部实体：Base.metadata.create_all 只会创建"已被导入"的表，
# 不能依赖路由导入链的副作用，否则新增实体容易静默漏建
from app.entities.UserEntity import UserEntity  # noqa: F401 仅注册表映射，不直接使用


def create_lifespan():
    settings = get_settings()
    logger = logging.getLogger("app")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        setup_logging(settings.log_level)

        # 启动横幅
        banner = r"""
  ╔══════════════════════════════════════════════════════════
  ║                                                      
  ║     Pancake                               
  ║     桌面工具箱                        
  ║                                                           
  ║     启动中...                          
  ║ 
  ║     Swagger      http://{host}:{port}/docs 
  ║               
  ║                                          
  ╚══════════════════════════════════════════════════════════
""".format(host=settings.host, port=settings.port)
        print(banner, flush=True)

        logger.info("应用启动中...")

        # 尝试连接数据库：失败时仅记录日志，不阻断应用启动
        app.state.db_connected = False
        try:
            await connect_db()
            app.state.db_connected = True
            logger.info("数据库已连接")
        except Exception as exc:
            logger.exception("数据库连接失败，继续运行无数据库模式: %s", exc)

        # 仅在显式开启时自动建表，避免生产环境在启动阶段修改数据库结构
        if settings.database_auto_create:
            try:
                async with engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)
                logger.info("数据库表已创建或存在")
            except Exception as exc:
                logger.exception("数据库表创建失败: %s", exc)
        else:
            logger.info("已禁用自动建表，请手动维护数据库结构")

        # 检查 ffmpeg/ffprobe 可用性（音频转换依赖）：缺失不阻断启动，仅记录状态
        app.state.ffmpeg_ready = False
        try:
            from app.services.AudioSwitch.AudioSwitchService import (
                FFMPEG,
                FFPROBE,
            )  # 惰性导入，避免模块加载期依赖

            app.state.ffmpeg_ready = bool(
                FFMPEG and FFPROBE
            )  # 两个二进制都找到才算就绪
            if app.state.ffmpeg_ready:
                logger.info("ffmpeg/ffprobe 已就绪，音频转换可用")
            else:
                logger.error(
                    "ffmpeg/ffprobe 未找到，音频转换不可用，请运行 pnpm run download:ffmpeg"
                )
        except Exception as exc:
            logger.exception("ffmpeg 可用性检查失败: %s", exc)

        # DeepSeek Harness 内嵌代理：启动失败不阻断 Pancake 主服务
        dsh_proxy_server = None
        dsh_proxy_thread = None
        if settings.dsh_proxy_enabled:
            try:
                dsh_proxy_server, dsh_proxy_thread = start_dsh_proxy_server()
                await wait_dsh_proxy_started(dsh_proxy_server)
                logger.info(
                    "DeepSeek Harness 内嵌代理已启动: http://%s:%s",
                    settings.dsh_proxy_host,
                    settings.dsh_proxy_port,
                )
            except Exception as exc:
                logger.exception("DeepSeek Harness 内嵌代理启动失败: %s", exc)
                dsh_proxy_server = None
                dsh_proxy_thread = None

        try:
            yield
        finally:
            # 关闭 DeepSeek Harness 内嵌代理
            if dsh_proxy_server is not None and dsh_proxy_thread is not None:
                try:
                    await stop_dsh_proxy_server(dsh_proxy_server, dsh_proxy_thread)
                    logger.info("DeepSeek Harness 内嵌代理已关闭")
                except Exception as exc:
                    logger.exception("DeepSeek Harness 内嵌代理关闭失败: %s", exc)

            # 优雅关闭：只有在已连接情况下尝试断开；失败也不阻断关闭
            if getattr(app.state, "db_connected", False):
                try:
                    await disconnect_db()
                    logger.info("数据库已断开连接")
                except Exception as exc:
                    logger.exception("数据库断开连接失败: %s", exc)
            logger.info("应用关闭完成")

    return lifespan
