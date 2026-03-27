from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./music_player.db"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Music library
    MUSIC_LIBRARY_PATH: str = "./music_library"
    ALBUM_ART_CACHE: str = "./cache/album_arts"
    
    # Security (optional for future)
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File upload limits (50MB)
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()