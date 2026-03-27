import os
import hashlib
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import mutagen
from mutagen.id3 import ID3
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.mp4 import MP4

from app.models.song import Song
from app.models.album import Album
from app.models.artist import Artist
from app.models.playlist import Playlist
from app.core.config import settings

class LibraryService:
    def __init__(self):
        self.scanning = False
        self.scan_progress = 0
        self.scan_total = 0
        self.scan_current = 0
        self.last_scan = None
    
    def scan_library(self, db: Session) -> Dict:
        """Scan music library directory and import songs"""
        if self.scanning:
            return {"status": "already_scanning"}
        
        self.scanning = True
        self.scan_progress = 0
        
        try:
            music_path = settings.MUSIC_LIBRARY_PATH
            if not os.path.exists(music_path):
                os.makedirs(music_path, exist_ok=True)
                return {"status": "directory_created", "path": music_path}
            
            # Get all audio files
            audio_extensions = {'.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac'}
            audio_files = []
            
            for root, dirs, files in os.walk(music_path):
                for file in files:
                    if os.path.splitext(file)[1].lower() in audio_extensions:
                        audio_files.append(os.path.join(root, file))
            
            self.scan_total = len(audio_files)
            self.scan_current = 0
            
            imported = 0
            skipped = 0
            errors = 0
            
            for file_path in audio_files:
                self.scan_current += 1
                self.scan_progress = (self.scan_current / self.scan_total) * 100
                
                # Check if already in database
                existing = db.query(Song).filter(Song.file_path == file_path).first()
                if existing:
                    skipped += 1
                    continue
                
                try:
                    self._import_audio_file(db, file_path)
                    imported += 1
                except Exception as e:
                    print(f"Error importing {file_path}: {e}")
                    errors += 1
            
            self.last_scan = datetime.utcnow()
            return {
                "status": "completed",
                "imported": imported,
                "skipped": skipped,
                "errors": errors,
                "total_files": self.scan_total
            }
            
        finally:
            self.scanning = False
    
    def _import_audio_file(self, db: Session, file_path: str):
        """Import a single audio file and extract metadata"""
        # Get basic file info
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        # Parse audio metadata
        metadata = self._extract_audio_metadata(file_path)
        
        # Get or create artist
        artist = None
        if metadata.get('artist'):
            artist = db.query(Artist).filter(Artist.name == metadata['artist']).first()
            if not artist:
                artist = Artist(name=metadata['artist'])
                db.add(artist)
                db.commit()
                db.refresh(artist)
        
        # Get or create album
        album = None
        if metadata.get('album'):
            album = db.query(Album).filter(
                Album.title == metadata['album'],
                Album.artist_id == artist.id if artist else None
            ).first()
            
            if not album:
                album = Album(
                    title=metadata['album'],
                    artist_id=artist.id if artist else None,
                    year=metadata.get('year'),
                    genre=metadata.get('genre'),
                    total_tracks=metadata.get('total_tracks', 0)
                )
                db.add(album)
                db.commit()
                db.refresh(album)
        
        # Create song record
        song = Song(
            title=metadata.get('title', file_name),
            file_path=file_path,
            file_name=file_name,
            file_size=file_size,
            duration=metadata.get('duration'),
            bitrate=metadata.get('bitrate'),
            sample_rate=metadata.get('sample_rate'),
            channels=metadata.get('channels'),
            album_id=album.id if album else None,
            artist_id=artist.id if artist else None,
            track_number=metadata.get('track_number'),
            genre=metadata.get('genre'),
            year=metadata.get('year'),
            lyrics=metadata.get('lyrics'),
            composer=metadata.get('composer')
        )
        
        db.add(song)
        db.commit()
        db.refresh(song)
        
        # Update album track count if needed
        if album:
            album.total_tracks = db.query(Song).filter(Song.album_id == album.id).count()
            db.commit()
    
    def _extract_audio_metadata(self, file_path: str) -> Dict:
        """Extract metadata from audio file"""
        metadata = {}
        
        try:
            audio = mutagen.File(file_path, easy=True)
            if not audio:
                return metadata
            
            # Basic info
            metadata['title'] = audio.get('title', [os.path.splitext(os.path.basename(file_path))[0]])[0]
            metadata['artist'] = audio.get('artist', ['Unknown Artist'])[0] if audio.get('artist') else None
            metadata['album'] = audio.get('album', ['Unknown Album'])[0] if audio.get('album') else None
            metadata['genre'] = audio.get('genre', [None])[0]
            metadata['year'] = audio.get('date', [None])[0]
            
            # Track number
            if audio.get('tracknumber'):
                try:
                    track_num = audio['tracknumber'][0].split('/')[0]
                    metadata['track_number'] = int(track_num)
                except:
                    pass
            
            # Total tracks
            if audio.get('tracknumber'):
                try:
                    if '/' in audio['tracknumber'][0]:
                        total = audio['tracknumber'][0].split('/')[1]
                        metadata['total_tracks'] = int(total)
                except:
                    pass
            
            # Audio properties
            if hasattr(audio.info, 'length'):
                metadata['duration'] = audio.info.length
            
            if hasattr(audio.info, 'bitrate'):
                metadata['bitrate'] = audio.info.bitrate // 1000 if audio.info.bitrate else None
            
            if hasattr(audio.info, 'sample_rate'):
                metadata['sample_rate'] = audio.info.sample_rate
            
            if hasattr(audio.info, 'channels'):
                metadata['channels'] = audio.info.channels
            
            # Try to get lyrics
            try:
                if hasattr(audio, 'tags'):
                    for tag in audio.tags.values():
                        if hasattr(tag, 'desc') and tag.desc.lower() == 'lyrics':
                            metadata['lyrics'] = str(tag.text[0])
                            break
            except:
                pass
            
            # Composer
            if audio.get('composer'):
                metadata['composer'] = audio['composer'][0]
            
        except Exception as e:
            print(f"Error extracting metadata from {file_path}: {e}")
        
        return metadata
    
    def get_library_stats(self, db: Session) -> Dict:
        """Get library statistics"""
        total_songs = db.query(Song).count()
        total_artists = db.query(Artist).count()
        total_albums = db.query(Album).count()
        total_playlists = db.query(Playlist).count()
        
        # Calculate total duration
        total_duration = db.query(Song.duration).filter(Song.duration.isnot(None)).all()
        total_duration_sum = sum([d[0] for d in total_duration if d[0]])
        
        # Calculate total file size
        total_size = db.query(Song.file_size).filter(Song.file_size.isnot(None)).all()
        total_size_sum = sum([s[0] for s in total_size if s[0]])
        
        return {
            "total_songs": total_songs,
            "total_artists": total_artists,
            "total_albums": total_albums,
            "total_playlists": total_playlists,
            "total_duration_hours": total_duration_sum / 3600 if total_duration_sum else 0,
            "total_size_gb": total_size_sum / (1024**3) if total_size_sum else 0,
            "last_scan": self.last_scan.isoformat() if self.last_scan else None
        }
    
    def get_scan_status(self) -> Dict:
        return {
            "scanning": self.scanning,
            "progress": self.scan_progress,
            "current": self.scan_current,
            "total": self.scan_total,
            "last_scan": self.last_scan.isoformat() if self.last_scan else None
        }
    
    def rescan_library(self, db: Session) -> Dict:
        """Clear and rescan library"""
        # Clear all data (be careful with this in production!)
        db.query(Song).delete()
        db.query(Album).delete()
        db.query(Artist).delete()
        db.commit()
        
        return self.scan_library(db)

library_service = LibraryService()