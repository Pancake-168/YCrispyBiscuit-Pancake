from fastapi import APIRouter

from app.api.v1.endpoints import songs, albums, artists, playlists, library

api_router = APIRouter()

api_router.include_router(songs.router, prefix="/songs", tags=["songs"])
api_router.include_router(albums.router, prefix="/albums", tags=["albums"])
api_router.include_router(artists.router, prefix="/artists", tags=["artists"])
api_router.include_router(playlists.router, prefix="/playlists", tags=["playlists"])
api_router.include_router(library.router, prefix="/library", tags=["library"])