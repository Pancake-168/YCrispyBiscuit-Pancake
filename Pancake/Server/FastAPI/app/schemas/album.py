from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class AlbumBase(BaseModel):
    title: str
    artist_id: Optional[int] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    album_art_path: Optional[str] = None
    description: Optional[str] = None
    total_tracks: Optional[int] = 0

class AlbumCreate(AlbumBase):
    pass

class AlbumUpdate(BaseModel):
    title: Optional[str] = None
    artist_id: Optional[int] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    album_art_path: Optional[str] = None
    description: Optional[str] = None
    total_tracks: Optional[int] = None

class AlbumInDBBase(AlbumBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Album(AlbumInDBBase):
    pass

class AlbumWithRelations(Album):
    artist: Optional["Artist"] = None
    songs: List["Song"] = []

from app.schemas.artist import Artist
from app.schemas.song import Song