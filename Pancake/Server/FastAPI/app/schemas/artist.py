from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ArtistBase(BaseModel):
    name: str
    biography: Optional[str] = None
    country: Optional[str] = None
    image_path: Optional[str] = None

class ArtistCreate(ArtistBase):
    pass

class ArtistUpdate(BaseModel):
    name: Optional[str] = None
    biography: Optional[str] = None
    country: Optional[str] = None
    image_path: Optional[str] = None

class ArtistInDBBase(ArtistBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Artist(ArtistInDBBase):
    pass

class ArtistWithRelations(Artist):
    songs: List["Song"] = []
    albums: List["Album"] = []

from app.schemas.song import Song
from app.schemas.album import Album