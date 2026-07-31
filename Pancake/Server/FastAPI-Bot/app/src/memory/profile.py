"""人物画像管理 — 自动提取、更新、注入用户画像。"""
import json
import logging
from datetime import datetime
from sqlmodel import Session, select
from app.core.database import engine
from app.src.models.db_models import UserProfile
from app.src.core.engine import LLMEngine
from app.src.core.persona import PersonaManager

_logger = logging.getLogger("app")
_engine = LLMEngine()
_persona = PersonaManager()


def get_profile(user_id: str) -> dict:
    """获取用户画像，无则返回空。"""
    with Session(engine) as session:
        row = session.exec(
            select(UserProfile).where(UserProfile.user_id == user_id)
        ).first()
    if row:
        return json.loads(row.profile_json)
    return {}


def get_profile_text(user_id: str) -> str:
    """获取用户画像的文本表示，用于注入 prompt。"""
    profile = get_profile(user_id)
    if not profile:
        return ""
    lines = []
    for key, val in profile.items():
        if val:
            lines.append(f"- {key}: {val}")
    return "\n".join(lines)


def update_profile(user_id: str, new_profile: dict):
    """保存或覆盖用户画像。"""
    now = datetime.utcnow()
    profile_json = json.dumps(new_profile, ensure_ascii=False)
    with Session(engine) as session:
        row = session.exec(
            select(UserProfile).where(UserProfile.user_id == user_id)
        ).first()
        if row:
            row.profile_json = profile_json
            row.version += 1
            row.updated_at = now
        else:
            session.add(UserProfile(
                user_id=user_id,
                profile_json=profile_json,
                created_at=now,
                updated_at=now,
            ))
        session.commit()


def extract_and_update_profile(user_id: str, messages: list[dict]):
    """从最近对话中提取事实，合并到用户画像。"""
    if not user_id:
        return
    # 格式化最近消息为文本
    msg_text = "\n".join(
        f"{m['role']}: {m['content']}" for m in messages[-10:]
    )
    # 提取新事实
    extract_prompt = _persona.load("extract_facts").replace("{messages}", msg_text)
    facts_result = _engine.chat(
        [{"role": "user", "content": extract_prompt}],
        use_reasoning=True,
        temperature=0.3,
    )
    facts_result = facts_result.strip()
    if not facts_result or facts_result == "无":
        return
    # 合并到旧画像
    old_profile = get_profile(user_id)
    old_text = json.dumps(old_profile, ensure_ascii=False, indent=2)
    merge_prompt = (
        _persona.load("profile")
        .replace("{old_profile}", old_text)
        .replace("{new_facts}", facts_result)
    )
    merged = _engine.chat(
        [{"role": "user", "content": merge_prompt}],
        use_reasoning=True,
        temperature=0.3,
    )
    # 解析合并后的 JSON
    try:
        # 尝试直接解析为 JSON
        new_profile = _parse_profile_json(merged)
    except (json.JSONDecodeError, ValueError):
        # 解析失败则保留旧画像
        return
    if new_profile:
        update_profile(user_id, new_profile)


def _parse_profile_json(text: str) -> dict:
    """从 LLM 输出中提取 JSON 对象。容错处理。"""
    text = text.strip()
    # 去掉可能的 markdown 代码块包裹
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        text = "\n".join(lines)
    # 尝试找 JSON 对象边界
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        return json.loads(text[start:end])
    return {}
