from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.lifespan import create_lifespan
from app.exceptions.handlers import register_exception_handlers
from app.middlewares.request_id import RequestIDMiddleware

settings = get_settings()
lifespan = create_lifespan()


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
    openapi_url=settings.openapi_url if settings.enable_docs else None,
    docs_url=settings.docs_url if settings.enable_docs else None,
)

# 中间件：RequestID
app.add_middleware(RequestIDMiddleware)

# CORS：开发阶段允许所有来源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册异常处理器
register_exception_handlers(app)

# 后续各模块路由在此注册
# from app.api.router import router
# app.include_router(router)


@app.get("/", summary="根路径", tags=["Root"])
async def root():
    return {"msg": "MaiBot Running!", "debug": settings.debug}


# ---- 测试接口 ----

class ChatRequest(BaseModel):
    message: str


@app.post("/chat", summary="对话测试", tags=["Test"])
def chat_test(req: ChatRequest):
    """单轮对话测试 — 验证硅基流动 API 连通性。"""
    from app.src.core.engine import LLMEngine
    from app.src.core.persona import PersonaManager

    engine = LLMEngine()
    persona_mgr = PersonaManager()
    system_prompt = persona_mgr.render("persona")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": req.message},
    ]
    reply = engine.chat(messages)
    return {"reply": reply}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )

