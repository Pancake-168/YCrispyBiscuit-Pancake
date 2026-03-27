from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.artist import Artist
from app.models.album import Album
from app.models.song import Song
from app.schemas.artist import Artist, ArtistCreate, ArtistUpdate, ArtistWithRelations
from app.services.artist_service import artist_service

router = APIRouter()

@router.get("/", response_model=List[Artist])
def read_artists(
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all artists"""
    return artist_service.get_artists(db, skip=skip, limit=limit, name=name)

@router.get("/{artist_id}", response_model=ArtistWithRelations)
def read_artist(artist_id: int, db: Session = Depends(get_db)):
    """Get a specific artist by ID"""
    artist = artist_service.get_artist(db, artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist

@router.post("/", response_model=Artist)
def create_artist(artist: ArtistCreate, db: Session = Depends(get_db)):
    """Create a new artist"""
    return artist_service.create_artist(db, artist)

@router.put("/{artist_id}", response_model=Artist)
def update_artist(artist_id: int, artist_update: ArtistUpdate, db: Session = Depends(get_db)):
    """Update an artist"""
    artist = artist_service.update_artist(db, artist_id, artist_update)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist

@router.delete("/{artist_id}")
def delete_artist(artist_id: int, db: Session = Depends(get_db)):
    """Delete an artist"""
    success = artist_service.delete_artist(db, artist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Artist not found")
    return {"message": "Artist deleted successfully"}

@router.get("/{artist_id}/albums", response_model=List[Album])
def get_artist_albums(artist_id: int, db: Session = Depends(get_db)):
    """Get all albums by an artist"""
    artist = artist_service.get_artist(db, artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist.albums

@router.get("/{artist_id}/songs", response_model=List[Song])
def get_artist_songs(artist_id: int, db: Session = Depends(get_db)):
    """Get all songs by an artist"""
    artist = artist_service.get_artist(db, artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist.songs