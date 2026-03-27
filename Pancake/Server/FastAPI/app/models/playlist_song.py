from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class PlaylistSong(Base):
    __tablename__ = "playlist_songs"
    
    id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id"), nullable=False)
    song_id = Column(Integer, ForeignKey("songs.id"), nullable=False)
    
    # Order in playlist
    position = Column(Integer, default=0)
    
    # Additional metadata
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    playlist = relationship("Playlist", back_populates="songs")
    song = relationship("Song", back_populates="playlists")
    
    # Unique constraint
    __table_args__ = (UniqueConstraint('playlist_id', 'song_id', name='uq_playlist_song'),)
    
    def __repr__(self):
        return f"<PlaylistSong playlist:{self.playlist_id} song:{self.song_id}>"