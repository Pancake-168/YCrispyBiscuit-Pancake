import logging
import logging.config
import logging.handlers
from pathlib import Path


def setup_logging(log_level: str = "INFO") -> None:
    level = getattr(logging, (log_level or "INFO").upper(), logging.INFO)
    # Ensure logs directory exists (no config duplication with .env keys)
    logs_dir = Path(__file__).resolve().parents[2] / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file = str(logs_dir / "app.log")
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s %(levelname)s %(name)s - %(message)s",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
            },
            "file": {
                "class": "logging.handlers.TimedRotatingFileHandler",
                "formatter": "default",
                "filename": log_file,
                "when": "midnight",
                "backupCount": 7,
                "encoding": "utf-8",
            }
        },
        "loggers": {
            "uvicorn": {"handlers": ["console", "file"], "level": level, "propagate": False},
            "uvicorn.access": {"handlers": ["console", "file"], "level": level, "propagate": False},
            "app": {"handlers": ["console", "file"], "level": level, "propagate": False},
        },
        "root": {"level": level, "handlers": ["console", "file"]},
    }
    logging.config.dictConfig(config)
