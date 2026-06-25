import logging
import logging.config
import logging.handlers
import sys

from app.core.config import WRITABLE_DIR


def setup_logging(log_level: str = "INFO") -> None:
    level = getattr(logging, (log_level or "INFO").upper(), logging.INFO)

    # 打包后 WRITABLE_DIR 指向 <install_dir>/data/，源码时指向 Server/FastAPI/
    logs_dir = WRITABLE_DIR / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file = str(logs_dir / "pancake.be.log")

    # 打包为 GUI 应用（--noconsole）时 sys.stdout/stderr 为 None，
    # 必须跳过 console handler，否则 uvicorn 初始化日志格式化器会崩溃
    has_console = sys.stdout is not None and sys.stderr is not None

    handlers = {
        "file": {
            "class": "logging.handlers.TimedRotatingFileHandler",
            "formatter": "default",
            "filename": log_file,
            "when": "midnight",
            "backupCount": 0,
            "encoding": "utf-8",
        },
    }
    if has_console:
        handlers["console"] = {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }

    handler_names = list(handlers.keys())

    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s %(levelname)s %(name)s - %(message)s",
            }
        },
        "handlers": handlers,
        "loggers": {
            "uvicorn": {
                "handlers": handler_names,
                "level": level,
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": handler_names,
                "level": level,
                "propagate": False,
            },
            "app": {
                "handlers": handler_names,
                "level": level,
                "propagate": False,
            },
        },
        "root": {"level": level, "handlers": handler_names},
    }
    logging.config.dictConfig(config)
