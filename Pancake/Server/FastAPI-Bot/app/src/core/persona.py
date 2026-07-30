"""人设 Prompt 管理 — 从文件加载模板，支持变量替换。"""
from pathlib import Path
from app.core.config import BASE_DIR


class PersonaManager:
    """管理人设 Prompt 模板的加载和渲染。"""

    def __init__(self, prompt_dir: Path | None = None):
        if prompt_dir is None:
            prompt_dir = BASE_DIR / "prompts"
        self.prompt_dir = Path(prompt_dir)

    def load(self, name: str) -> str:
        """加载 prompt 模板文件。"""
        filepath = self.prompt_dir / f"{name}.txt"
        if not filepath.exists():
            return ""
        return filepath.read_text(encoding="utf-8").strip()

    def render(
        self,
        name: str,
        profile_text: str = "",  # 人物画像
        memory_text: str = "",  # 长期记忆检索结果
    ) -> str:
        """加载人设模板并注入动态内容。"""
        persona = self.load(name)
        parts = [persona]
        if profile_text:
            parts.append(f"\n[关于当前对话对象的了解]\n{profile_text}")
        if memory_text:
            parts.append(f"\n[相关的历史记忆]\n{memory_text}")
        return "\n".join(parts)
