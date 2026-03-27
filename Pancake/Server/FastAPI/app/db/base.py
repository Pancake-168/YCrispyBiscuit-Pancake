from app.db.session import Base
from app.db.session import engine

# Import all models here so they are registered with Base
from app.models.song import Song
from app.models.album import Album
from app.models.artist import Artist
from app.models.playlist import Playlist
from app.models.playlist_song import PlaylistSong

__all__ = ["Base", "engine"]