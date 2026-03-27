from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.album import Album
from app.schemas.album import AlbumCreate, AlbumUpdate

class AlbumService:
    def get_albums(
        self, db: Session, skip: int = 0, limit: int = 100,
        title: Optional[str] = None, artist_id: Optional[int] = None
    ) -> List[Album]:
        query = db.query(Album)
        
        if title:
            query = query.filter(Album.title.ilike(f"%{title}%"))
        if artist_id:
            query = query.filter(Album.artist_id == artist_id)
            
        return query.order_by(Album.title).offset(skip).limit(limit).all()
    
    def get_album(self, db: Session, album_id: int) -> Optional[Album]:
        return db.query(Album).filter(Album.id == album_id).first()
    
    def create_album(self, db: Session, album: AlbumCreate) -> Album:
        db_album = Album(**album.model_dump())
        db.add(db_album)
        db.commit()
        db.refresh(db_album)
        return db_album
    
    def update_album(self, db: Session, album_id: int, album_update: AlbumUpdate) -> Optional[Album]:
        db_album = self.get_album(db, album_id)
        if not db_album:
            return None
        
        update_data = album_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_album, field, value)
        
        db.commit()
        db.refresh(db_album)
        return db_album
    
    def delete_album(self, db: Session, album_id: int) -> bool:
        db_album = self.get_album(db, album_id)
        if not db_album:
            return False
        
        db.delete(db_album)
        db.commit()
        return True
    
    def search_albums(self, db: Session, query: str, skip: int = 0, limit: int = 50) -> List[Album]:
        search_query = f"%{query}%"
        return db.query(Album).filter(Album.title.ilike(search_query)).offset(skip).limit(limit).all()

album_service = AlbumService()