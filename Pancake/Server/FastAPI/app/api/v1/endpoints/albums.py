from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.album import Album
from app.models.song import Song
from app.schemas.album import Album, AlbumCreate, AlbumUpdate, AlbumWithRelations
from app.services.album_service import album_service

router = APIRouter()

@router.get("/", response_model=List[Album])
def read_albums(
    skip: int = 0,
    limit: int = 100,
    title: Optional[str] = None,
    artist_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all albums"""
    return album_service.get_albums(
        db, skip=skip, limit=limit, title=title, artist_id=artist_id
    )

@router.get("/{album_id}", response_model=AlbumWithRelations)
def read_album(album_id: int, db: Session = Depends(get_db)):
    """Get a specific album by ID"""
    album = album_service.get_album(db, album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

@router.post("/", response_model=Album)
def create_album(album: AlbumCreate, db: Session = Depends(get_db)):
    """Create a new album"""
    return album_service.create_album(db, album)

@router.put("/{album_id}", response_model=Album)
def update_album(album_id: int, album_update: AlbumUpdate, db: Session = Depends(get_db)):
    """Update an album"""
    album = album_service.update_album(db, album_id, album_update)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

@router.delete("/{album_id}")
def delete_album(album_id: int, db: Session = Depends(get_db)):
    """Delete an album"""
    success = album_service.delete_album(db, album_id)
    if not success:
        raise HTTPException(status_code=404, detail="Album not found")
    return {"message": "Album deleted successfully"}

@router.get("/{album_id}/songs", response_model=List[Song])
def get_album_songs(album_id: int, db: Session = Depends(get_db)):
    """Get all songs in an album"""
    album = album_service.get_album(db, album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album.songs