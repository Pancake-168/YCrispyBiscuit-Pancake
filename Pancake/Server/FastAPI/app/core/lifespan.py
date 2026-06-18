import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.logging import setup_logging
from app.core.config import get_settings
from app.db import connect_db, disconnect_db
from app.core.database import engine, Base


def _process_alive(pid: int) -> bool:
    """
    跨平台进程存活检测。
    Windows: 用 tasklist 查（不用 os.kill 或 OpenProcess，两者在 GUI 子进程场景下不可靠）
    其他平台: os.kill(pid, 0)
    """
    if sys.platform != "win32":
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False

    import subprocess
    result = subprocess.run(
        ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
        capture_output=True,
        text=True,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )
    return str(pid) in result.stdout


async def _watch_parent():
    """
    监控父进程（Tauri 壳），父进程退出时自动关闭后端。

    Windows 上子进程不会随父进程退出而自动终止，
    Tauri 侧的 kill 逻辑在某些退出路径下可能不到达，
    因此后端自己定期检查父进程是否还活着，作为兜底。
    """
    logger = logging.getLogger("app")

    if not getattr(sys, "frozen", False):
        return  # 开发模式不监控

    try:
        ppid = os.getppid()
    except Exception as e:
        logger.warning("无法获取父进程 PID: %s", e)
        return

    if ppid == 1:
        return  # 已经是孤儿进程

    logger.info("开始监控父进程 PID=%d", ppid)

    while True:
        await asyncio.sleep(5)
        try:
            alive = _process_alive(ppid)
        except Exception as e:
            logger.warning("检测父进程存活失败: %s", e)
            continue

        if not alive:
            logger.info("父进程 PID=%d 已退出，后端自动关闭", ppid)
            os._exit(0)

# Import entities to register them with SQLAlchemy
# from app.entities import calendar
# from app.entities import user


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

        # 后台监控父进程，Tauri 退出时自动关后端
        asyncio.create_task(_watch_parent())

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
