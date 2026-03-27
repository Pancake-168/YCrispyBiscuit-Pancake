from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Song(Base):
    __tablename__ = "songs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    file_path = Column(String(500), nullable=False, unique=True)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)  # in bytes
    duration = Column(Float)  # in seconds
    
    # Audio metadata
    bitrate = Column(Integer)  # in kbps
    sample_rate = Column(Integer)  # in Hz
    channels = Column(Integer)  # 1=mono, 2=stereo
    
    # Music metadata
    album_id = Column(Integer, ForeignKey("albums.id"), nullable=True)
    artist_id = Column(Integer, ForeignKey("artists.id"), nullable=True)
    track_number = Column(Integer)
    genre = Column(String(100))
    year = Column(Integer)
    
    # Additional info
    lyrics = Column(Text, nullable=True)
    composer = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    album = relationship("Album", back_populates="songs")
    artist = relationship("Artist", back_populates="songs")
    playlists = relationship("PlaylistSong", back_populates="song", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Song {self.id}: {self.title}>"