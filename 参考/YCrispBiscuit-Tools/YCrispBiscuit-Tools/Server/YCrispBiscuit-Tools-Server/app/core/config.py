"""
项目基础配置文件
可用于存放数据库连接、环境变量、全局常量等配置
类似 Spring Boot 的 application.yml 或 application.properties
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 应用名称
    APP_NAME: str = "YCrispBiscuit-Tools-Server"
    # 是否开启调试模式
    DEBUG: bool = False

    # 数据库相关配置
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "20021109"
    DB_NAME: str = "YCrispBiscuitTools"
    # 数据库连接 URL
    DATABASE_URL: str = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    # JWT 相关配置
    SECRET_KEY: str = "a_very_secret_key"  # 用于加密 JWT 的密钥
    ALGORITHM: str = "HS256"  # JWT 加密算法
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Token 过期时间（分钟）

    class Config:
        env_file = ".env"  # 环境变量文件路径

# 实例化全局配置对象
settings = Settings()
