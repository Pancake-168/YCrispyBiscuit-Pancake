import uuid  # 生成唯一请求 ID
from starlette.middleware.base import BaseHTTPMiddleware  # Starlette 中间件基类
from fastapi import Request  # FastAPI 请求对象（类型标注用）


class RequestIDMiddleware(BaseHTTPMiddleware):
    """为每个 HTTP 请求注入唯一 request_id，贯穿请求日志和错误响应。"""

    async def dispatch(self, request: Request, call_next):
        # 优先使用客户端传入的 X-Request-ID 头，否则自动生成一个 UUID
        rid = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        # 挂载到 request.state，供 controller/service/handler 中随时获取
        request.state.request_id = rid
        # 继续执行后续中间件和路由处理器
        response = await call_next(request)
        # 在响应头中返回 request_id，方便客户端排查问题
        response.headers["X-Request-ID"] = rid
        return response
