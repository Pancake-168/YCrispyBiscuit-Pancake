import uvicorn
from app.main import socket_app
from app.core.config import get_settings

settings = get_settings()

if __name__ == "__main__":
    uvicorn.run(
        socket_app,
        host=settings.host,
        port=settings.port,
        reload=False,
    )
