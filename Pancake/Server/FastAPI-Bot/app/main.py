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


# ---- 对话接口 ----
from app.src.core.engine import LLMEngine
from app.src.core.persona import PersonaManager
from app.src.memory.short_term import ShortTermMemory
from app.src.memory.long_term import retrieve_memories, memories_to_prompt_text, save_memory
from app.src.memory.profile import get_profile_text, extract_and_update_profile

# 全局实例（后续迁移到 app.state）
llm_engine = LLMEngine()
persona_mgr = PersonaManager()
short_term = ShortTermMemory(max_size=settings.short_term_window)


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    user_id: str = ""  # 用户标识，用于记忆归属和画像


@app.post("/chat", summary="多轮对话", tags=["Chat"])
def chat(req: ChatRequest):
    """带短期记忆 + 长期记忆 + 人物画像的多轮对话。"""
    # 1. 检索长期记忆
    raw_memories = retrieve_memories(req.message, user_id=req.user_id)
    memory_text = memories_to_prompt_text(raw_memories)
    # 2. 获取人物画像
    profile_text = get_profile_text(req.user_id)
    # 3. 构建 system prompt（注入画像 + 长期记忆）
    system_prompt = persona_mgr.render(
        "persona", profile_text=profile_text, memory_text=memory_text
    )
    # 4. 构建消息列表
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(short_term.get_messages(req.session_id, user_id=req.user_id))
    messages.append({"role": "user", "content": req.message})
    # 5. 调用 LLM
    reply = llm_engine.chat(messages)
    # 6. 写入短期记忆
    short_term.add(req.session_id, "user", req.message, user_id=req.user_id)
    short_term.add(req.session_id, "assistant", reply, user_id=req.user_id)
    # 7. 长期记忆写回
    _try_save_memory(req.message, user_id=req.user_id)
    # 8. 画像更新（用最近的对话窗口提取事实）
    recent_msgs = short_term.get_recent(req.session_id, 10, user_id=req.user_id)
    extract_and_update_profile(req.user_id, recent_msgs)
    return {
        "reply": reply,
        "session_id": req.session_id,
        "memories_used": len(raw_memories),
        "has_profile": bool(profile_text),
    }


def _try_save_memory(text: str, user_id: str = ""):
    """尝试从消息中提取并保存长期记忆。简单版：直接存有实质内容的消息。"""
    text = text.strip()
    if len(text) >= 10 and len(text) <= 200:
        save_memory(content=text, user_id=user_id, memory_type="fact")


@app.delete("/chat/session/{session_id}", summary="清除会话", tags=["Chat"])
def clear_session(session_id: str):
    """清除指定会话的短期记忆。"""
    short_term.clear(session_id)
    return {"msg": f"session '{session_id}' cleared"}


@app.get("/memories", summary="记忆统计", tags=["Memory"])
def memory_stats(user_id: str = ""):
    """查看长期记忆统计。"""
    from app.src.memory.vector_store import memory_count
    return {"total_in_chroma": memory_count()}


@app.get("/profile/{user_id}", summary="查看画像", tags=["Profile"])
def get_user_profile(user_id: str):
    """查看指定用户的画像内容。"""
    from app.src.memory.profile import get_profile
    return {"user_id": user_id, "profile": get_profile(user_id)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )

