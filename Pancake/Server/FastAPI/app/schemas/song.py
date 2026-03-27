from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# Base schemas
class SongBase(BaseModel):
    title: str
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    duration: Optional[float] = None
    bitrate: Optional[int] = None
    sample_rate: Optional[int] = None
    channels: Optional[int] = None
    album_id: Optional[int] = None
    artist_id: Optional[int] = None
    track_number: Optional[int] = None
    genre: Optional[str] = None
    year: Optional[int] = None
    lyrics: Optional[str] = None
    composer: Optional[str] = None

class SongCreate(SongBase):
    pass

class SongUpdate(BaseModel):
    title: Optional[str] = None
    album_id: Optional[int] = None
    artist_id: Optional[int] = None
    track_number: Optional[int] = None
    genre: Optional[str] = None
    year: Optional[int] = None
    lyrics: Optional[str] = None
    composer: Optional[str] = None

# Response schemas
class SongInDBBase(SongBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Song(SongInDBBase):
    pass

class SongWithRelations(Song):
    album: Optional["Album"] = None
    artist: Optional["Artist"] = None

# Import after class definition to avoid circular imports
from app.schemas.album import Album
from app.schemas.artist import Artist