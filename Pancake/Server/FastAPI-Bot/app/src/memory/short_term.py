"""短期记忆 — 基于会话+用户的消息窗口管理。"""
from collections import defaultdict, deque


class ShortTermMemory:
    """每个 (session_id, user_id) 组合维护一个固定大小的消息滑动窗口。"""

    def __init__(self, max_size: int = 30):
        self.max_size = max_size
        self._windows: dict[str, deque[dict]] = defaultdict(
            lambda: deque(maxlen=max_size)
        )

    def _key(self, session_id: str, user_id: str = "") -> str:
        """组合键：session_id + user_id，确保不同用户在同一会话中窗口隔离。"""
        return f"{session_id}:{user_id}" if user_id else session_id

    def add(self, session_id: str, role: str, content: str, user_id: str = ""):
        """向窗口追加一条消息。"""
        self._windows[self._key(session_id, user_id)].append(
            {"role": role, "content": content}
        )

    def get_messages(self, session_id: str, user_id: str = "") -> list[dict]:
        """获取当前窗口内所有消息。"""
        return list(self._windows[self._key(session_id, user_id)])

    def clear(self, session_id: str, user_id: str = ""):
        """清空指定会话+用户的窗口。"""
        self._windows.pop(self._key(session_id, user_id), None)

    def get_recent(self, session_id: str, n: int, user_id: str = "") -> list[dict]:
        """获取最近 n 条消息。"""
        window = self._windows[self._key(session_id, user_id)]
        return list(window)[-n:] if len(window) >= n else list(window)
