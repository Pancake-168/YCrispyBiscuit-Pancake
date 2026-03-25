from functools import lru_cache
from typing import List
import os

from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
from pathlib import Path


_env_file = os.getenv("ENV_FILE")
if _env_file:
    load_dotenv(_env_file)


#定义项目基础路径和JSON文件路径
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # 指向 Server/
JSON_DIR = BASE_DIR / "json"


class Settings(BaseSettings):
    app_name: str = "YCrispyBiscuit"
    app_env: str  
    debug: bool
    host: str
    port: int
    database_url: str

    # JWT 配置
    jwt_secret_key: str

    # CORS & Host 安全
    cors_origins: List[str] = ["*"]
    allowed_hosts: List[str] = ["*"]

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
