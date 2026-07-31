"""向量存储 — ChromaDB 封装，管理长期记忆的向量化存取。"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import get_settings, WRITABLE_DIR
from app.src.core.engine import LLMEngine

settings = get_settings()

# ChromaDB 客户端（持久化到 data/chroma/）
_chroma_dir = str(WRITABLE_DIR / settings.chroma_persist_dir)
_chroma_client = chromadb.PersistentClient(
    path=_chroma_dir,
    settings=ChromaSettings(anonymized_telemetry=False),
)
# 记忆集合
_memory_collection = _chroma_client.get_or_create_collection(
    name="long_term_memories",
    metadata={"description": "长期记忆向量存储"},
)

# Embedding 引擎（复用 LLMEngine 的 embed 方法）
_embed_engine = LLMEngine()


def add_memory(memory_id: str, content: str, metadata: dict | None = None):
    """将记忆写入向量库。"""
    embedding = _embed_engine.embed(content)
    _memory_collection.add(
        ids=[memory_id],
        embeddings=[embedding],
        documents=[content],
        metadatas=[metadata or {}],
    )


def search_memories(query: str, top_k: int = 5) -> list[dict]:
    """语义检索相关记忆，返回 [{id, content, metadata, distance}, ...]。"""
    query_embedding = _embed_engine.embed(query)
    results = _memory_collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )
    items = []
    if results["ids"] and results["ids"][0]:
        for i, mem_id in enumerate(results["ids"][0]):
            items.append({
                "id": mem_id,
                "content": results["documents"][0][i] if results["documents"] else "",
                "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                "distance": results["distances"][0][i] if results["distances"] else 0,
            })
    return items


def delete_memory(memory_id: str):
    """从向量库删除指定记忆。"""
    _memory_collection.delete(ids=[memory_id])


def memory_count() -> int:
    """当前向量库中的记忆总数。"""
    return _memory_collection.count()
