from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.playlist import Playlist
from app.schemas.playlist import (
    Playlist, PlaylistCreate, PlaylistUpdate, 
    PlaylistWithSongs, PlaylistAddSongs, PlaylistSongItem
)
from app.services.playlist_service import playlist_service

router = APIRouter()

@router.get("/", response_model=List[Playlist])
def read_playlists(
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all playlists"""
    return playlist_service.get_playlists(db, skip=skip, limit=limit, name=name)

@router.get("/{playlist_id}", response_model=PlaylistWithSongs)
def read_playlist(playlist_id: int, db: Session = Depends(get_db)):
    """Get a specific playlist by ID with songs"""
    playlist = playlist_service.get_playlist_with_songs(db, playlist_id)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@router.post("/", response_model=Playlist)
def create_playlist(playlist: PlaylistCreate, db: Session = Depends(get_db)):
    """Create a new playlist"""
    return playlist_service.create_playlist(db, playlist)

@router.put("/{playlist_id}", response_model=Playlist)
def update_playlist(playlist_id: int, playlist_update: PlaylistUpdate, db: Session = Depends(get_db)):
    """Update a playlist"""
    playlist = playlist_service.update_playlist(db, playlist_id, playlist_update)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@router.delete("/{playlist_id}")
def delete_playlist(playlist_id: int, db: Session = Depends(get_db)):
    """Delete a playlist"""
    success = playlist_service.delete_playlist(db, playlist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Playlist deleted successfully"}

@router.post("/{playlist_id}/songs")
def add_songs_to_playlist(
    playlist_id: int, 
    playlist_songs: PlaylistAddSongs,
    db: Session = Depends(get_db)
):
    """Add songs to a playlist"""
    success = playlist_service.add_songs_to_playlist(db, playlist_id, playlist_songs.songs)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Songs added to playlist"}

@router.delete("/{playlist_id}/songs/{song_id}")
def remove_song_from_playlist(playlist_id: int, song_id: int, db: Session = Depends(get_db)):
    """Remove a song from a playlist"""
    success = playlist_service.remove_song_from_playlist(db, playlist_id, song_id)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist or song not found")
    return {"message": "Song removed from playlist"}

@router.put("/{playlist_id}/reorder")
def reorder_playlist_songs(
    playlist_id: int,
    song_order: List[int],  # List of song IDs in new order
    db: Session = Depends(get_db)
):
    """Reorder songs in a playlist"""
    success = playlist_service.reorder_playlist_songs(db, playlist_id, song_order)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Playlist reordered"}