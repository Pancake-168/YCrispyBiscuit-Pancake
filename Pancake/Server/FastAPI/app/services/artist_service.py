from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.artist import Artist
from app.schemas.artist import ArtistCreate, ArtistUpdate

class ArtistService:
    def get_artists(
        self, db: Session, skip: int = 0, limit: int = 100,
        name: Optional[str] = None
    ) -> List[Artist]:
        query = db.query(Artist)
        
        if name:
            query = query.filter(Artist.name.ilike(f"%{name}%"))
            
        return query.order_by(Artist.name).offset(skip).limit(limit).all()
    
    def get_artist(self, db: Session, artist_id: int) -> Optional[Artist]:
        return db.query(Artist).filter(Artist.id == artist_id).first()
    
    def get_artist_by_name(self, db: Session, name: str) -> Optional[Artist]:
        return db.query(Artist).filter(Artist.name == name).first()
    
    def create_artist(self, db: Session, artist: ArtistCreate) -> Artist:
        db_artist = Artist(**artist.model_dump())
        db.add(db_artist)
        db.commit()
        db.refresh(db_artist)
        return db_artist
    
    def update_artist(self, db: Session, artist_id: int, artist_update: ArtistUpdate) -> Optional[Artist]:
        db_artist = self.get_artist(db, artist_id)
        if not db_artist:
            return None
        
        update_data = artist_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_artist, field, value)
        
        db.commit()
        db.refresh(db_artist)
        return db_artist
    
    def delete_artist(self, db: Session, artist_id: int) -> bool:
        db_artist = self.get_artist(db, artist_id)
        if not db_artist:
            return False
        
        db.delete(db_artist)
        db.commit()
        return True
    
    def search_artists(self, db: Session, query: str, skip: int = 0, limit: int = 50) -> List[Artist]:
        search_query = f"%{query}%"
        return db.query(Artist).filter(Artist.name.ilike(search_query)).offset(skip).limit(limit).all()

artist_service = ArtistService()