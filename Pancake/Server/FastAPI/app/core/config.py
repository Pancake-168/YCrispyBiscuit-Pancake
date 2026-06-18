from functools import lru_cache
from typing import List
import os
import sys

from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
from pathlib import Path


def _get_base_dir() -> Path:
    """项目根目录，兼容源码运行和 PyInstaller 打包"""
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent.parent.parent  # 指向 Server/FastAPI


BASE_DIR = _get_base_dir()
JSON_DIR = BASE_DIR / "json"


_env_file = os.getenv("ENV_FILE")
if _env_file:
    load_dotenv(BASE_DIR / _env_file)
elif getattr(sys, "frozen", False):
    # 打包后只认 production
    load_dotenv(BASE_DIR / ".env.production")
else:
    # 源码默认 development（想切就互换两个 .env 文件内容）
    load_dotenv(BASE_DIR / ".env.development")


class Settings(BaseSettings):
    app_name: str = "Pancake"
    app_env: str
    debug: bool
    host: str
    port: int
    database_url: str
    database_auto_create: bool = False

    # JWT 配置
    jwt_secret_key: str

    # CORS & Host 安全
    cors_origins: List[str] = ["http://localhost:1420", "http://localhost:5173", "http://localhost:5175"]
    cors_allow_credentials: bool = True
    allowed_hosts: List[str] = ["localhost", "127.0.0.1"]

    # 日志与文档
    log_level: str = "INFO"  # DEBUG, INFO, WARNING, ERROR
    enable_docs: bool = True
    openapi_url: str = "/openapi.json"
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"

    # 不在代码内绑定具体 env 文件，由启动脚本通过 ENV_FILE+python-dotenv 控制
    model_config = SettingsConfigDict(
        env_prefix="",
        env_file=None,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    # 通过 uvicorn --env-file 预先注入环境变量后，直接读取
    return Settings()
