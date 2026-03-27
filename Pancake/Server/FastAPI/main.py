from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Music Player API",
    description="A self-hosted music player backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Create static directories
os.makedirs(settings.MUSIC_LIBRARY_PATH, exist_ok=True)
os.makedirs(settings.ALBUM_ART_CACHE, exist_ok=True)

# Mount static files
app.mount("/music", StaticFiles(directory=settings.MUSIC_LIBRARY_PATH), name="music")
app.mount("/cache/album_arts", StaticFiles(directory=settings.ALBUM_ART_CACHE), name="album_arts")

@app.get("/")
async def root():
    return {"message": "Music Player API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)