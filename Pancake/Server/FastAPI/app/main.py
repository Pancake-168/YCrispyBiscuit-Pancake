from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import get_settings
from app.core.lifespan import create_lifespan
from app.exceptions.handlers import register_exception_handlers
from app.middlewares.request_id import RequestIDMiddleware
from app.api.router import router

settings = get_settings()
lifespan = create_lifespan()


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
    openapi_url=settings.openapi_url if settings.enable_docs else None,
    docs_url=settings.docs_url if settings.enable_docs else None,
    redoc_url=settings.redoc_url if settings.enable_docs else None,
)

# 中间件：RequestID, CORS, TrustedHost
cors_origins = settings.cors_origins or []
if settings.cors_allow_credentials and "*" in cors_origins:
    raise RuntimeError("启用凭证模式时，CORS origins 不能包含通配符 '*'")

app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)
if settings.allowed_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)


app.include_router(router)


@app.get("/")
async def root():
    return {"msg": "FastAPI skeleton running", "debug": settings.debug}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        factory=False,
    )

register_exception_handlers(app)
