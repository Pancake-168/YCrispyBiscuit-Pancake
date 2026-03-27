from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.song import Song
from app.schemas.song import SongCreate, SongUpdate

class SongService:
    def get_songs(
        self, db: Session, skip: int = 0, limit: int = 100,
        title: Optional[str] = None,
        artist_id: Optional[int] = None,
        album_id: Optional[int] = None
    ) -> List[Song]:
        query = db.query(Song)
        
        if title:
            query = query.filter(Song.title.ilike(f"%{title}%"))
        if artist_id:
            query = query.filter(Song.artist_id == artist_id)
        if album_id:
            query = query.filter(Song.album_id == album_id)
            
        return query.order_by(Song.title).offset(skip).limit(limit).all()
    
    def get_song(self, db: Session, song_id: int) -> Optional[Song]:
        return db.query(Song).filter(Song.id == song_id).first()
    
    def get_song_by_file_path(self, db: Session, file_path: str) -> Optional[Song]:
        return db.query(Song).filter(Song.file_path == file_path).first()
    
    def create_song(self, db: Session, song: SongCreate) -> Song:
        db_song = Song(**song.model_dump())
        db.add(db_song)
        db.commit()
        db.refresh(db_song)
        return db_song
    
    def update_song(self, db: Session, song_id: int, song_update: SongUpdate) -> Optional[Song]:
        db_song = self.get_song(db, song_id)
        if not db_song:
            return None
        
        update_data = song_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_song, field, value)
        
        db.commit()
        db.refresh(db_song)
        return db_song
    
    def delete_song(self, db: Session, song_id: int) -> bool:
        db_song = self.get_song(db, song_id)
        if not db_song:
            return False
        
        db.delete(db_song)
        db.commit()
        return True
    
    def search_songs(self, db: Session, query: str, skip: int = 0, limit: int = 50) -> List[Song]:
        search_query = f"%{query}%"
        return db.query(Song).filter(
            or_(
                Song.title.ilike(search_query),
                Song.genre.ilike(search_query),
                Song.composer.ilike(search_query)
            )
        ).offset(skip).limit(limit).all()

song_service = SongService()