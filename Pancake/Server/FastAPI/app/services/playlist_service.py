from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from app.models.playlist import Playlist
from app.models.playlist_song import PlaylistSong
from app.models.song import Song
from app.schemas.playlist import PlaylistCreate, PlaylistUpdate, PlaylistSongItem

class PlaylistService:
    def get_playlists(
        self, db: Session, skip: int = 0, limit: int = 100,
        name: Optional[str] = None
    ) -> List[Playlist]:
        query = db.query(Playlist)
        
        if name:
            query = query.filter(Playlist.name.ilike(f"%{name}%"))
            
        return query.order_by(Playlist.name).offset(skip).limit(limit).all()
    
    def get_playlist(self, db: Session, playlist_id: int) -> Optional[Playlist]:
        return db.query(Playlist).filter(Playlist.id == playlist_id).first()
    
    def get_playlist_with_songs(self, db: Session, playlist_id: int) -> Optional[Playlist]:
        return db.query(Playlist).options(
            joinedload(Playlist.songs).joinedload(PlaylistSong.song)
        ).filter(Playlist.id == playlist_id).first()
    
    def create_playlist(self, db: Session, playlist: PlaylistCreate) -> Playlist:
        db_playlist = Playlist(**playlist.model_dump())
        db.add(db_playlist)
        db.commit()
        db.refresh(db_playlist)
        return db_playlist
    
    def update_playlist(self, db: Session, playlist_id: int, playlist_update: PlaylistUpdate) -> Optional[Playlist]:
        db_playlist = self.get_playlist(db, playlist_id)
        if not db_playlist:
            return None
        
        update_data = playlist_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_playlist, field, value)
        
        db.commit()
        db.refresh(db_playlist)
        return db_playlist
    
    def delete_playlist(self, db: Session, playlist_id: int) -> bool:
        db_playlist = self.get_playlist(db, playlist_id)
        if not db_playlist:
            return False
        
        db.delete(db_playlist)
        db.commit()
        return True
    
    def add_songs_to_playlist(self, db: Session, playlist_id: int, songs: List[PlaylistSongItem]) -> bool:
        playlist = self.get_playlist(db, playlist_id)
        if not playlist:
            return False
        
        # Get current max position
        max_position = db.query(PlaylistSong.position).filter(
            PlaylistSong.playlist_id == playlist_id
        ).order_by(PlaylistSong.position.desc()).first()
        
        current_position = max_position[0] + 1 if max_position else 0
        
        for song_item in songs:
            # Check if song exists
            song = db.query(Song).filter(Song.id == song_item.song_id).first()
            if not song:
                continue
            
            # Check if already in playlist
            existing = db.query(PlaylistSong).filter(
                PlaylistSong.playlist_id == playlist_id,
                PlaylistSong.song_id == song_item.song_id
            ).first()
            
            if existing:
                continue
            
            # Add to playlist
            playlist_song = PlaylistSong(
                playlist_id=playlist_id,
                song_id=song_item.song_id,
                position=song_item.position or current_position
            )
            
            db.add(playlist_song)
            current_position += 1
        
        # Update playlist stats
        self._update_playlist_stats(db, playlist_id)
        db.commit()
        return True
    
    def remove_song_from_playlist(self, db: Session, playlist_id: int, song_id: int) -> bool:
        playlist_song = db.query(PlaylistSong).filter(
            PlaylistSong.playlist_id == playlist_id,
            PlaylistSong.song_id == song_id
        ).first()
        
        if not playlist_song:
            return False
        
        db.delete(playlist_song)
        
        # Update playlist stats
        self._update_playlist_stats(db, playlist_id)
        db.commit()
        return True
    
    def reorder_playlist_songs(self, db: Session, playlist_id: int, song_order: List[int]) -> bool:
        playlist = self.get_playlist(db, playlist_id)
        if not playlist:
            return False
        
        # Update positions
        for position, song_id in enumerate(song_order):
            playlist_song = db.query(PlaylistSong).filter(
                PlaylistSong.playlist_id == playlist_id,
                PlaylistSong.song_id == song_id
            ).first()
            
            if playlist_song:
                playlist_song.position = position
        
        db.commit()
        return True
    
    def _update_playlist_stats(self, db: Session, playlist_id: int):
        """Update playlist song count and total duration"""
        playlist = self.get_playlist(db, playlist_id)
        if not playlist:
            return
        
        # Get all songs in playlist with their durations
        songs = db.query(Song).join(PlaylistSong).filter(
            PlaylistSong.playlist_id == playlist_id
        ).all()
        
        playlist.total_songs = len(songs)
        playlist.total_duration = sum([song.duration or 0 for song in songs])
        
        db.commit()

playlist_service = PlaylistService()