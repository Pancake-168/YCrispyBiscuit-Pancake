from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Playlist(Base):
    __tablename__ = "playlists"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Playlist settings
    is_public = Column(Boolean, default=False)
    is_smart = Column(Boolean, default=False)  # Smart playlist based on rules
    
    # Smart playlist rules (JSON string)
    rules = Column(Text, nullable=True)
    
    # Stats
    total_songs = Column(Integer, default=0)
    total_duration = Column(Float, default=0.0)  # in seconds
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    songs = relationship("PlaylistSong", back_populates="playlist", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Playlist {self.id}: {self.name}>"