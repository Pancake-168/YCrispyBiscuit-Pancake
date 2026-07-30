from functools import lru_cache
from typing import List
import os
import sys

from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
from pathlib import Path


def _get_base_dir() -> Path:
    """
    只读资源目录 — 存放 .env、prompts/ 等数据。
    源码: FastAPI-Bot/
    打包: sys._MEIPASS（PyInstaller 临时解压目录）
    """
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent.parent.parent  # FastAPI-Bot/


def _get_writable_dir() -> Path:
    """
    可写数据目录 — 存放数据库、日志等运行时产生的用户数据。
    源码: FastAPI-Bot/
    打包: 安装根目录下的 data/ 子目录（后端 exe 在 bin/ 下，需往上走一层）
    """
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent.parent / "data"
    return Path(__file__).resolve().parent.parent.parent  # FastAPI-Bot/


BASE_DIR = _get_base_dir()  # 读配置、prompts 等只读资源
WRITABLE_DIR = _get_writable_dir()  # 写数据库、日志等用户数据
# 源码开发时 BASE_DIR == WRITABLE_DIR，打包后二者分离
PROJECT_DIR = BASE_DIR  # 兼容别名

# 加载 .env 文件
_env_file = os.getenv("ENV_FILE")
if _env_file:
    load_dotenv(BASE_DIR / _env_file)
elif getattr(sys, "frozen", False):
    load_dotenv(BASE_DIR / ".env.production")
else:
    load_dotenv(BASE_DIR / ".env.development")


class Settings(BaseSettings):
    # ---- 应用基础 ----
    app_name: str = "MaiBot"
    app_env: str = "development"
    debug: bool = True
    host: str = "127.0.0.1"
    port: int = 8000

    # ---- 数据库 ----
    database_url: str = "sqlite+aiosqlite:///data/mai.db"

    # ---- 硅基流动 API ----
    siliconflow_api_key: str = ""
    siliconflow_base_url: str = "https://api.siliconflow.cn/v1"
    # 对话模型 ID（硅基流动上的模型全路径，如 "deepseek-ai/DeepSeek-V3"）
    chat_model: str = ""
    # 推理模型 ID（用于事实提取、摘要等复杂任务，可同 chat_model）
    reasoning_model: str = ""
    # Embedding 模型 ID
    embedding_model: str = ""

    # ---- 记忆系统 ----
    # ChromaDB 持久化目录
    chroma_persist_dir: str = "data/chroma"
    # 短期记忆窗口大小（每条消息数）
    short_term_window: int = 30
    # 长期记忆检索条数
    memory_retrieval_top_k: int = 5
    # 记忆自动写回触发间隔（秒）
    memory_writeback_interval: int = 60

    # ---- 日志 ----
    log_level: str = "INFO"

    # ---- API 文档 ----
    enable_docs: bool = True
    openapi_url: str = "/openapi.json"
    docs_url: str = "/docs"

    model_config = SettingsConfigDict(
        env_prefix="",
        env_file=None,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

