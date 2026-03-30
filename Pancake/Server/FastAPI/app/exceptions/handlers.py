import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, OperationalError
import asyncio


def register_exception_handlers(app: FastAPI) -> None:
    logger = logging.getLogger("app")

    async def http_exception_handler(request: Request, exc: HTTPException):
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "HTTPException [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            exc.detail,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "request_id": rid},
        )

    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "ValidationError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            exc.errors(),
        )
        return JSONResponse(
            status_code=422, content={"detail": exc.errors(), "request_id": rid}
        )

    async def value_error_handler(request: Request, exc: ValueError):
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "ValueError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=400, content={"detail": str(exc), "request_id": rid}
        )

    async def integrity_error_handler(request: Request, exc: IntegrityError):
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "IntegrityError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=400,
            content={"detail": "Data integrity error", "request_id": rid},
        )

    async def operational_error_handler(request: Request, exc: OperationalError):
        rid = getattr(request.state, "request_id", "-")
        logger.error(
            "OperationalError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Database connection error", "request_id": rid},
        )

    async def timeout_error_handler(request: Request, exc: asyncio.TimeoutError):
        rid = getattr(request.state, "request_id", "-")
        logger.warning("TimeoutError [%s] %s %s", rid, request.method, request.url.path)
        return JSONResponse(
            status_code=408, content={"detail": "Request timeout", "request_id": rid}
        )

    async def connection_error_handler(request: Request, exc: ConnectionError):
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "ConnectionError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=502,
            content={
                "detail": "Bad gateway: upstream service failure",
                "request_id": rid,
            },
        )

    async def key_error_handler(request: Request, exc: KeyError):
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "KeyError [%s] %s %s -> %s", rid, request.method, request.url.path, str(exc)
        )
        return JSONResponse(
            status_code=400,
            content={"detail": f"Missing key: {str(exc)}", "request_id": rid},
        )

    async def file_not_found_error_handler(request: Request, exc: FileNotFoundError):
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "FileNotFoundError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=404, content={"detail": "File not found", "request_id": rid}
        )

    async def permission_error_handler(request: Request, exc: PermissionError):
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "PermissionError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=403, content={"detail": "Permission denied", "request_id": rid}
        )

    async def unhandled_exception_handler(request: Request, exc: Exception):
        rid = getattr(request.state, "request_id", "-")
        logger.exception(
            "UnhandledException [%s] %s %s", rid, request.method, request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "request_id": rid},
        )

    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(ValueError, value_error_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(KeyError, key_error_handler)
    app.add_exception_handler(PermissionError, permission_error_handler)
    app.add_exception_handler(FileNotFoundError, file_not_found_error_handler)
    app.add_exception_handler(asyncio.TimeoutError, timeout_error_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(OperationalError, operational_error_handler)
    app.add_exception_handler(ConnectionError, connection_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
