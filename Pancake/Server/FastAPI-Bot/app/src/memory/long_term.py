"""长期记忆管理 — 协调 SQLite 记忆表 + ChromaDB 向量存储 + 检索注入。"""
import uuid
from datetime import datetime
from sqlmodel import Session, select
from app.core.database import engine
from app.src.models.db_models import Memory
from app.src.memory.vector_store import add_memory as chroma_add, search_memories


def save_memory(
    content: str,
    user_id: str = "",
    memory_type: str = "fact",
    importance: float = 0.5,
) -> str:
    """保存记忆：写入 SQLite + ChromaDB，返回 memory_id。"""
    memory_id = f"mem_{uuid.uuid4().hex[:12]}"
    now = datetime.utcnow()
    # 写入 SQLite
    with Session(engine) as session:
        mem = Memory(
            memory_id=memory_id,
            user_id=user_id,
            content=content,
            memory_type=memory_type,
            importance=importance,
            created_at=now,
            updated_at=now,
        )
        session.add(mem)
        session.commit()
    # 写入 ChromaDB
    chroma_add(
        memory_id=memory_id,
        content=content,
        metadata={"user_id": user_id, "type": memory_type},
    )
    return memory_id


def retrieve_memories(
    query: str,
    user_id: str = "",
    top_k: int = 5,
) -> list[dict]:
    """
    混合检索：语义检索（ChromaDB）+ 关键词检索（SQLite LIKE），合并去重后返回。
    结果按 relevance 降序排列。
    """
    # 语义检索（ChromaDB）
    semantic_results = search_memories(query, top_k=top_k)
    # 关键词检索（SQLite LIKE）
    keyword_results = _keyword_search(query, user_id, top_k)
    # 合并去重（按 content 去重）
    merged: dict[str, dict] = {}
    for r in semantic_results:
        key = r["content"][:80]
        merged[key] = {**r, "source": "semantic"}
    for r in keyword_results:
        key = r["content"][:80]
        if key not in merged:
            merged[key] = {**r, "source": "keyword"}
    # 排序：语义结果靠前
    results = list(merged.values())
    results.sort(key=lambda x: 0 if x["source"] == "semantic" else 1)
    return results[:top_k]


def _keyword_search(query: str, user_id: str = "", limit: int = 5) -> list[dict]:
    """SQLite 关键词检索：在记忆内容中搜索包含查询词条的记录。"""
    words = [w.strip() for w in query if len(w.strip()) >= 2 for w in [query]]
    if not query or len(query) < 2:
        return []
    with Session(engine) as session:
        stmt = (
            select(Memory)
            .where(
                Memory.content.contains(query),
                Memory.status == "active",
            )
            .order_by(Memory.importance.desc())
            .limit(limit)
        )
        if user_id:
            stmt = stmt.where(Memory.user_id == user_id)
        rows = session.exec(stmt).all()
        return [
            {
                "id": r.memory_id,
                "content": r.content,
                "metadata": {"user_id": r.user_id, "type": r.memory_type},
            }
            for r in rows
        ]


def memories_to_prompt_text(memories: list[dict]) -> str:
    """将检索到的记忆列表转为可注入 prompt 的文本。"""
    if not memories:
        return ""
    lines = []
    for i, m in enumerate(memories, 1):
        lines.append(f"{i}. {m['content']}")
    return "\n".join(lines)
