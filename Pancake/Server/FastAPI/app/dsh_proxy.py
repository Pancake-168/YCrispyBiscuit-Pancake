"""DeepSeek Harness 内嵌代理。

deepseek-harness 的浏览器会话 Cookie 是 SameSite=Strict，
直接放进 Tauri 的跨站 iframe 时，Cookie 不会随重定向后的请求发送，
导致 303 -> / 后 401。
本模块在 Pancake 后端进程内启动一个本地反向代理：
- 浏览器访问 http://127.0.0.1:<dsh_proxy_port> 时，请求转发到 127.0.0.1:3080
- 转发时保留浏览器 Host，使 deepseek 签发的 Cookie 绑定到代理端口
- 把 Set-Cookie 中的 SameSite=Strict 改写成 SameSite=None; Secure，
  使跨站 iframe 也能保存/发送该 Cookie
- 同时转发 WebSocket /api/remote.mux，保证 deepseek 的流式通道可用
"""

import asyncio
import logging
import threading
from collections.abc import AsyncIterator, Mapping

import httpx
import uvicorn
import websockets
from fastapi import FastAPI, Request, Response, WebSocket
from fastapi.responses import StreamingResponse

from app.core.config import get_settings

logger = logging.getLogger("app.dsh_proxy")

# HTTP 逐跳头：代理转发时必须剔除，避免把浏览器与代理之间的连接语义透传给上游
HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}

# DeepSeek 的认证 Cookie 名前缀；代理侧加前缀后保存在浏览器代理域下，
# 转发给上游时再去掉前缀，使上游按原生 127.0.0.1:3080 的 authority 校验
DSH_AUTH_COOKIE_PREFIX = "dsh-auth-"
PROXY_COOKIE_PREFIX = "__dsh_p_"


# 与响应对象兼容的多值头映射：
# Starlette Response 只接受 Mapping，但 Set-Cookie 允许同名的多个响应头，
# 这里用自定义 Mapping 保留多个 Set-Cookie，而不是把多个值合并成一个。
class _HeaderPairs(Mapping[str, str]):
    def __init__(self, pairs: list[tuple[str, str]]):
        self._pairs = pairs

    def __getitem__(self, key: str) -> str:
        lowered = key.lower()
        for name, value in self._pairs:
            if name.lower() == lowered:
                return value
        raise KeyError(key)

    def __iter__(self):
        return (name for name, _ in self._pairs)

    def __len__(self) -> int:
        return len(self._pairs)

    def items(self):
        return iter(self._pairs)


def _translate_request_cookie(cookie_header: str) -> str:
    """把浏览器 Cookie 头里的代理前缀名还原为上游认识的 Cookie 名。"""
    translated: list[str] = []
    for segment in cookie_header.split(";"):
        segment = segment.strip()
        if not segment:
            continue
        if "=" in segment:
            name, value = segment.split("=", 1)
            if name.startswith(PROXY_COOKIE_PREFIX):
                name = name[len(PROXY_COOKIE_PREFIX) :]
            translated.append(f"{name}={value}")
        else:
            translated.append(segment)
    return "; ".join(translated)


def _rewrite_set_cookie(value: str) -> str:
    """把 SameSite=Strict 改写为 SameSite=None 并补 Secure，同时改写 Cookie 名。

    deepseek-harness 原样签发 Strict Cookie 是为了常规同站使用；
    在 Pancake 的跨站 iframe 场景下 Strict 不会被携带。
    这里仅在 Pancake 本地代理这一侧放宽 SameSite，不改动上游代码。
    Cookie 名加前缀是为了让浏览器把上游 127.0.0.1:3080 的 Cookie 存到
    代理 127.0.0.1:3081 域下；转发请求时再去掉前缀。
    """
    parts = [part.strip() for part in value.split(";")]
    first = parts[0]
    if "=" in first:
        name, pair_value = first.split("=", 1)
        if name.startswith(DSH_AUTH_COOKIE_PREFIX) and not name.startswith(
            PROXY_COOKIE_PREFIX
        ):
            first = f"{PROXY_COOKIE_PREFIX}{name}={pair_value}"
            parts[0] = first
    rewritten: list[str] = []
    has_secure = False
    for part in parts:
        lowered = part.lower()
        if lowered.startswith("samesite="):
            # SameSite=None 必须搭配 Secure，浏览器才会接受
            rewritten.append("SameSite=None")
        else:
            if lowered == "secure":
                has_secure = True
            rewritten.append(part)
    if not has_secure:
        # 本地回环 HTTP 也属于可信上下文，Secure Cookie 可正常写入 127.0.0.1
        rewritten.append("Secure")
    return "; ".join(rewritten)


def _request_headers(headers: Mapping[str, str]) -> dict[str, str]:
    """把浏览器请求头转成可转发给上游的字典。

    Host 交给 httpx/websockets 按上游地址自动生成；这里只负责翻译 Cookie 名。
    """
    forwarded: dict[str, str] = {}
    for key, value in headers.items():
        lowered = key.lower()
        if (
            lowered in HOP_BY_HOP_HEADERS
            or lowered.startswith("proxy-")
            or lowered in ("host", "origin")
        ):
            continue
        if lowered == "cookie":
            value = _translate_request_cookie(value)
        forwarded[key] = value
    return forwarded


def _response_headers(headers: httpx.Headers) -> _HeaderPairs:
    """转换上游响应头，同时改写 Set-Cookie 的 SameSite。"""
    pairs: list[tuple[str, str]] = []
    for key, value in headers.multi_items():
        lowered = key.lower()
        if lowered in HOP_BY_HOP_HEADERS or lowered.startswith("proxy-"):
            continue
        if lowered == "set-cookie":
            value = _rewrite_set_cookie(value)
        pairs.append((key, value))
    return _HeaderPairs(pairs)


def create_dsh_proxy_app() -> FastAPI:
    """创建 DeepSeek Harness 本地代理的 ASGI 应用。"""
    settings = get_settings()
    upstream_base = settings.dsh_upstream_url.rstrip("/")

    app = FastAPI(
        title="DeepSeek Harness Proxy",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )

    async def proxy_http(request: Request) -> Response:
        """把普通 HTTP 请求反向代理到 deepseek-harness。"""
        # 拼上游地址：保留浏览器请求的路径与查询串
        url = f"{upstream_base}{request.url.path}"
        if request.url.query:
            url = f"{url}?{request.url.query}"

        headers = _request_headers(request.headers)
        body = await request.body()

        client = httpx.AsyncClient(timeout=None, trust_env=False)
        try:
            # stream=True 保留 SSE/下载等流式响应，不把整个响应体读进内存
            req = client.build_request(
                request.method, url, headers=headers, content=body
            )
            upstream_response = await client.send(req, stream=True)
        except Exception as exc:
            logger.warning("dsh proxy upstream request failed: %s", exc)
            await client.aclose()
            return Response("dsh proxy upstream error", status_code=502)

        response_headers = _response_headers(upstream_response.headers)

        async def body_stream() -> AsyncIterator[bytes]:
            try:
                async for chunk in upstream_response.aiter_raw():
                    yield chunk
            finally:
                await upstream_response.aclose()
                await client.aclose()

        return StreamingResponse(
            body_stream(),
            status_code=upstream_response.status_code,
            headers=response_headers,
        )

    @app.api_route(
        "/", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
    )
    async def proxy_root(request: Request) -> Response:
        return await proxy_http(request)

    @app.api_route(
        "/{path:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    )
    async def proxy_path(request: Request, path: str) -> Response:
        return await proxy_http(request)

    @app.websocket("/api/remote.mux")
    async def proxy_remote_mux(websocket: WebSocket) -> None:
        """把 deepseek 的 WebSocket 多路复用通道也代理到本地端口。"""
        await websocket.accept()
        headers = _request_headers(websocket.headers)
        # websockets 客户端会按上游 URI 自动生成 Host，不能把浏览器 Host 转发过去
        headers.pop("Host", None)
        headers.pop("host", None)
        # WebSocket 握手头由 websockets 客户端自行生成，不能把浏览器的握手头转发给上游
        for handshake_header in (
            "sec-websocket-key",
            "sec-websocket-version",
            "sec-websocket-extensions",
            "sec-websocket-accept",
            "sec-websocket-protocol",
        ):
            headers.pop(handshake_header, None)
        # websockets.connect 的 additional_headers 需要可哈希的键值，直接传字典即可
        upstream_ws = upstream_base.replace("http", "ws", 1) + "/api/remote.mux"

        try:
            async with websockets.connect(
                upstream_ws,
                additional_headers=headers,
                max_size=None,
                ping_interval=None,
                proxy=None,
            ) as upstream:

                async def upstream_to_client() -> None:
                    """把上游 WebSocket 消息转发给浏览器。"""
                    try:
                        async for message in upstream:
                            if isinstance(message, bytes):
                                await websocket.send_bytes(message)
                            else:
                                await websocket.send_text(message)
                    except Exception:
                        # 任一侧断开都会由外层 close 收尾，这里不重复抛错
                        pass

                async def client_to_upstream() -> None:
                    """把浏览器 WebSocket 消息转发给上游。"""
                    try:
                        while True:
                            message = await websocket.receive()
                            if message["type"] == "websocket.disconnect":
                                break
                            if message.get("text") is not None:
                                await upstream.send(message["text"])
                            elif message.get("bytes") is not None:
                                await upstream.send(message["bytes"])
                    except Exception:
                        pass

                # 任意一个方向结束就关闭整个链路，避免任务悬挂
                tasks = [
                    asyncio.create_task(upstream_to_client()),
                    asyncio.create_task(client_to_upstream()),
                ]
                done, pending = await asyncio.wait(
                    tasks, return_when=asyncio.FIRST_COMPLETED
                )
                for task in pending:
                    task.cancel()
                for task in done:
                    try:
                        await task
                    except Exception:
                        pass
        except Exception as exc:
            logger.warning("dsh proxy websocket failed: %s", exc)
        finally:
            try:
                await websocket.close()
            except Exception:
                pass

    return app


def start_dsh_proxy_server():
    """在独立线程中启动代理服务，返回 (server, thread)。"""
    settings = get_settings()
    proxy_app = create_dsh_proxy_app()
    config = uvicorn.Config(
        proxy_app,
        host=settings.dsh_proxy_host,
        port=settings.dsh_proxy_port,
        log_level="warning",
        access_log=False,
        # noconsole 打包后 sys.stderr 为 None，uvicorn 默认日志配置会崩；
        # 这里与 run.py 一样禁用 uvicorn 自身日志配置
        log_config=None,
    )
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, name="dsh-proxy", daemon=True)
    thread.start()
    return server, thread


async def wait_dsh_proxy_started(server, timeout: float = 5.0) -> None:
    """等待代理端口真正开始监听，超时则记录错误。"""
    waited = 0.0
    while not server.started:
        if server.should_exit:
            raise RuntimeError("dsh proxy server exited before startup")
        if waited >= timeout:
            raise TimeoutError("dsh proxy server did not start in time")
        await asyncio.sleep(0.05)
        waited += 0.05


async def stop_dsh_proxy_server(server, thread) -> None:
    """请求代理服务退出，并等待线程结束。"""
    server.should_exit = True
    thread.join(timeout=5.0)
