from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Artist(Base):
    __tablename__ = "artists"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True, unique=True)
    
    # Artist info
    biography = Column(Text, nullable=True)
    country = Column(String(100), nullable=True)
    
    # Artist image
    image_path = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    songs = relationship("Song", back_populates="artist", cascade="all, delete-orphan")
    albums = relationship("Album", back_populates="artist", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Artist {self.id}: {self.name}>"