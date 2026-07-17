# 日志记录
import logging

# FastAPI 应用、请求对象、HTTP 异常
from fastapi import FastAPI, Request, HTTPException

# JSON 格式响应
from fastapi.responses import JSONResponse

# FastAPI 参数校验失败异常
from fastapi.exceptions import RequestValidationError

# SQLAlchemy 数据库异常
from sqlalchemy.exc import IntegrityError, OperationalError

# 超时异常类型
import asyncio

from app.exceptions.errors import AppError  # 项目自定义异常基类


def register_exception_handlers(app: FastAPI) -> None:
    """在 app 上注册所有全局异常处理器，统一错误响应格式（均含 request_id）。"""
    logger = logging.getLogger("app")  # 应用级日志器

    # ------------------------------------------------------------------
    # 项目自定义业务异常
    # ------------------------------------------------------------------

    async def app_error_handler(request: Request, exc: AppError):
        """捕获 AppError 及其子类，按各自的 status_code 返回。"""
        rid = getattr(request.state, "request_id", "-")  # 从中间件注入的 request_id
        logger.warning(
            "AppError [%s] %s %s -> %s",
            rid,
            request.method,  # HTTP 方法（GET/POST/...）
            request.url.path,  # 请求路径
            exc.detail,  # 错误详情
        )
        return JSONResponse(
            status_code=exc.status_code,  # 异常子类定义的 HTTP 状态码
            content={"detail": exc.detail, "request_id": rid},  # 统一响应体结构
        )

    # ------------------------------------------------------------------
    # FastAPI / Starlette 内置异常
    # ------------------------------------------------------------------

    async def http_exception_handler(request: Request, exc: HTTPException):
        """捕获 FastAPI 直接抛出的 HTTPException（如 404 路由未匹配）。"""
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
        """捕获 Pydantic 请求参数校验失败（422）。返回校验错误列表。"""
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "ValidationError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            exc.errors(),  # 校验错误详情列表
        )
        return JSONResponse(
            status_code=422,  # Unprocessable Entity
            content={"detail": exc.errors(), "request_id": rid},
        )

    # ------------------------------------------------------------------
    # Python 标准异常 → 转为有意义的 HTTP 错误
    # ------------------------------------------------------------------

    async def value_error_handler(request: Request, exc: ValueError):
        """Python ValueError → 400 响应。比如无效的枚举值、非法数字格式。"""
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "ValueError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=400,  # Bad Request
            content={"detail": str(exc), "request_id": rid},
        )

    async def integrity_error_handler(request: Request, exc: IntegrityError):
        """SQLAlchemy IntegrityError（唯一约束冲突等）→ 400。"""
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
        """SQLAlchemy OperationalError（数据库连接失败等）→ 500。"""
        rid = getattr(request.state, "request_id", "-")
        logger.error(  # 数据库连接失败用 error 级别
            "OperationalError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=500,  # Internal Server Error
            content={"detail": "Database connection error", "request_id": rid},
        )

    async def timeout_error_handler(request: Request, exc: asyncio.TimeoutError):
        """asyncio 超时 → 408。"""
        rid = getattr(request.state, "request_id", "-")
        logger.warning("TimeoutError [%s] %s %s", rid, request.method, request.url.path)
        return JSONResponse(
            status_code=408,  # Request Timeout
            content={"detail": "Request timeout", "request_id": rid},
        )

    async def connection_error_handler(request: Request, exc: ConnectionError):
        """网络连接错误 → 502 Bad Gateway。"""
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "ConnectionError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=502,  # Bad Gateway
            content={
                "detail": "Bad gateway: upstream service failure",
                "request_id": rid,
            },
        )

    async def key_error_handler(request: Request, exc: KeyError):
        """字典/配置 KeyError（未做防护的键访问）→ 400。"""
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "KeyError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=400,
            content={"detail": f"Missing key: {str(exc)}", "request_id": rid},
        )

    async def file_not_found_error_handler(request: Request, exc: FileNotFoundError):
        """文件不存在 → 404。"""
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "FileNotFoundError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=404,  # Not Found
            content={"detail": "File not found", "request_id": rid},
        )

    async def permission_error_handler(request: Request, exc: PermissionError):
        """文件/目录权限不足 → 403。"""
        rid = getattr(request.state, "request_id", "-")
        logger.warning(
            "PermissionError [%s] %s %s -> %s",
            rid,
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=403,  # Forbidden
            content={"detail": "Permission denied", "request_id": rid},
        )

    async def unhandled_exception_handler(request: Request, exc: Exception):
        """兜底处理器：所有未被上面捕获的未知异常 → 500。"""
        rid = getattr(request.state, "request_id", "-")
        logger.exception(  # 用 exception 级别记录完整 traceback
            "UnhandledException [%s] %s %s", rid, request.method, request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "request_id": rid},
        )

    # 按捕获优先级注册处理器（具体异常先于通用异常）
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(ValueError, value_error_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(KeyError, key_error_handler)
    app.add_exception_handler(PermissionError, permission_error_handler)
    app.add_exception_handler(FileNotFoundError, file_not_found_error_handler)
    app.add_exception_handler(asyncio.TimeoutError, timeout_error_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(OperationalError, operational_error_handler)
    app.add_exception_handler(ConnectionError, connection_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)  # 兜底放最后
