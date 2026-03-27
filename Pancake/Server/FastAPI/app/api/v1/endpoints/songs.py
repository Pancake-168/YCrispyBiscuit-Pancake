from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.song import Song
from app.schemas.song import Song, SongCreate, SongUpdate, SongWithRelations
from app.services.song_service import song_service

router = APIRouter()

@router.get("/", response_model=List[Song])
def read_songs(
    skip: int = 0,
    limit: int = 100,
    title: Optional[str] = None,
    artist_id: Optional[int] = None,
    album_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all songs with optional filters"""
    return song_service.get_songs(
        db, skip=skip, limit=limit,
        title=title, artist_id=artist_id, album_id=album_id
    )

@router.get("/{song_id}", response_model=SongWithRelations)
def read_song(song_id: int, db: Session = Depends(get_db)):
    """Get a specific song by ID"""
    song = song_service.get_song(db, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song

@router.post("/", response_model=Song)
def create_song(song: SongCreate, db: Session = Depends(get_db)):
    """Create a new song"""
    return song_service.create_song(db, song)

@router.put("/{song_id}", response_model=Song)
def update_song(song_id: int, song_update: SongUpdate, db: Session = Depends(get_db)):
    """Update a song"""
    song = song_service.update_song(db, song_id, song_update)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song

@router.delete("/{song_id}")
def delete_song(song_id: int, db: Session = Depends(get_db)):
    """Delete a song"""
    success = song_service.delete_song(db, song_id)
    if not success:
        raise HTTPException(status_code=404, detail="Song not found")
    return {"message": "Song deleted successfully"}

@router.get("/{song_id}/stream")
def stream_song(song_id: int, db: Session = Depends(get_db)):
    """Stream a song audio file"""
    # This would implement actual audio streaming
    # For now, return the file path
    song = song_service.get_song(db, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return {"file_path": song.file_path, "file_name": song.file_name}

@router.get("/{song_id}/lyrics")
def get_song_lyrics(song_id: int, db: Session = Depends(get_db)):
    """Get lyrics for a song"""
    song = song_service.get_song(db, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return {"lyrics": song.lyrics}