"""
Socket.IO 服务端模块。
基于 python-socketio 库，提供实时双向通信能力。

与原生 WebSocket 的区别：
- 自动处理断线重连（内置 exponential backoff）
- 自动心跳保活（ping/pong）
- 支持"房间"和"命名空间"语义，无需自己造轮子
- 协议降级：如果 WebSocket 不可用，自动回退到 HTTP 长轮询
- 事件模型：emit / on 模式，比 WebSocket 的 send/onmessage 更易组织代码

架构位置：
    Tauri 前端 <--Socket.IO--> FastAPI 后端
    127.0.0.1 本地通信，连接必然可用，降级机制作为安全保障
"""

import logging
import socketio

from app.core.config import get_settings

logger = logging.getLogger("app.socketio")

settings = get_settings()

# =============================================================================
# 创建 Socket.IO 服务端实例
# =============================================================================
# async_mode='asgi'：告诉 Socket.IO 我们跑在 ASGI 框架（FastAPI）里
#                    它会用 asyncio 事件循环，和 FastAPI 共用同一个 loop
# cors_allowed_origins：允许跨域连接（本地桌面端通常不需要，作为安全基线保留）
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.cors_origins or ["*"],
    logger=False,  # 关闭 python-socketio 内部日志，统一走 app logger
    engineio_logger=False,
)


# =============================================================================
# 生命周期钩子
# =============================================================================
# 以下每个装饰器对应 Socket.IO 的一个内置事件。
# 当客户端触发对应行为时，python-socketio 自动回调这些函数。
# 函数签名由 python-socketio 约定，不能随意改名。


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None = None):
    """
    客户端连接成功时触发。

    参数：
        sid (str)：           Socket.IO 为每个连接生成的唯一 Session ID
        environ (dict)：       ASGI 原始环境变量（类似 HTTP 请求头）
        auth (dict | None)：   客户端发来的认证数据（如 token），可选
                               -- 客户端在 io.connect() 时通过 { auth: {...} } 传入

    典型用途：
        - 记录连接日志
        - 验证 auth token（拒绝非法连接）
        - 将 sid 与用户 ID 绑定，方便后续定向推送
    """
    logger.info("Socket.IO 客户端已连接: sid=%s", sid)
    # 加入默认房间，用于全局广播
    await sio.enter_room(sid, "lobby")


@sio.event
async def disconnect(sid: str):
    """
    客户端断开连接时触发。

    触发场景：
        - 客户端主动调用 socket.disconnect()
        - 网络断开 / 标签页关闭
        - 服务端调用 sio.disconnect(sid)

    典型用途：
        - 清理该用户的临时状态
        - 通知其他用户"XXX 已下线"
    """
    logger.info("Socket.IO 客户端已断开: sid=%s", sid)
    await sio.leave_room(sid, "lobby")


# =============================================================================
# 业务事件
# =============================================================================
# 以下是通过 @sio.on("事件名") 注册的自定义业务事件。
# 客户端通过 socket.emit("事件名", 数据) 来调用。
# 函数名不需要和事件名相同，但建议保持一致以便查找。


@sio.on("echo")
async def handle_echo(sid: str, data: dict):
    """
    回音事件：客户端发送什么，服务端原样返回。

    设计目的：
        - 最基本的连通性验证
        - 调试时快速确认消息能到后端并返回
        - 可以作为性能测试（配合 client_timestamp 算 RTT）

    客户端调用方式：
        socket.emit("echo", { message: "hello", client_timestamp: Date.now() })

    返回：
        { message: "hello", server_timestamp: ..., client_timestamp: ... }
    """
    import time

    logger.debug("收到 echo 事件: sid=%s data=%s", sid, data)

    # 返回给发送者（不是广播）
    await sio.emit(
        "echo_reply",
        {
            "message": data.get("message", ""),
            "server_timestamp": time.time(),
            "client_timestamp": data.get("client_timestamp"),
        },
        to=sid,
    )


@sio.on("broadcast")
async def handle_broadcast(sid: str, data: dict):
    """
    广播事件：将一个客户端的消息广播给房间内所有其他客户端。

    设计目的：
        - 演示 Socket.IO 房间（Room）机制
        - 可用于实时通知："后台任务完成"、"新数据已抓取" 等

    实现方式：
        - 使用 skip_sid=sid 排除发送者自己
        - 广播到 "lobby" 房间（在 connect 时加入）

    客户端调用方式：
        socket.emit("broadcast", { message: "新数据到了！" })
    """
    logger.info("收到广播事件: sid=%s data=%s", sid, data)

    await sio.emit(
        "notification",
        {
            "message": data.get("message", ""),
            "from_sid": sid,
        },
        room="lobby",   # 广播到 lobby 房间内的所有人
        skip_sid=sid,   # 排除发送者自己
    )


@sio.on("ping_from_client")
async def handle_client_ping(sid: str, data: dict | None = None):
    """
    客户端主动心跳：前端定期调用，服务端立即回复。

    设计目的：
        - 验证连接仍然存活（补充内置 ping/pong 机制）
        - 前端可以测量 RTT（Round-Trip Time）
        - 记录最后活跃时间，用于超时踢出

    注意：
        - Socket.IO 已有内置的 engine.io ping/pong（默认 25s 间隔）
        - 这个事件是应用层的心跳，用于业务级别的健康检查
        - 如果只需要保持连接，内置机制已足够，不需要这个事件

    客户端调用方式：
        socket.emit("ping_from_client", { client_time: Date.now() })
    """
    import time

    await sio.emit(
        "pong_from_server",
        {
            "server_time": time.time(),
            "client_time": data.get("client_time") if data else None,
        },
        to=sid,
    )
