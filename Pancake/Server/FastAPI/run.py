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
        log_config=None,  # 禁用 uvicorn 日志配置（noconsole 下 stderr 为 None 会崩）
    )
