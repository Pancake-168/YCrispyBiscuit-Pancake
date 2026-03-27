from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    is_smart: bool = False
    rules: Optional[str] = None
    total_songs: int = 0
    total_duration: float = 0.0

class PlaylistCreate(PlaylistBase):
    pass

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    is_smart: Optional[bool] = None
    rules: Optional[str] = None

class PlaylistInDBBase(PlaylistBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Playlist(PlaylistInDBBase):
    pass

class PlaylistWithSongs(Playlist):
    songs: List["Song"] = []

class PlaylistSongItem(BaseModel):
    song_id: int
    position: Optional[int] = 0

class PlaylistAddSongs(BaseModel):
    songs: List[PlaylistSongItem]

from app.schemas.song import Song