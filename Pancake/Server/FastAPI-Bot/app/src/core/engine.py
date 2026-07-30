"""LLM 调用引擎 — 统一封装硅基流动 API（OpenAI 兼容接口）。"""
from openai import OpenAI
from app.core.config import get_settings


class LLMEngine:
    """LLM 调用统一入口。支持对话生成、流式输出、Embedding。"""

    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(
            api_key=settings.siliconflow_api_key,
            base_url=settings.siliconflow_base_url,
        )
        self.chat_model = settings.chat_model
        self.reasoning_model = settings.reasoning_model or settings.chat_model
        self.embedding_model = settings.embedding_model

    def chat(
        self,
        messages: list[dict],  # [{"role": "system/user/assistant", "content": "..."}]
        use_reasoning: bool = False,  # 是否用推理模型（事实提取等复杂任务）
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """同步对话，返回完整回复文本。"""
        model = self.reasoning_model if use_reasoning else self.chat_model
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    def chat_stream(
        self,
        messages: list[dict],
        use_reasoning: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ):
        """流式对话，逐步 yield 回复片段。"""
        model = self.reasoning_model if use_reasoning else self.chat_model
        stream = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    def embed(self, text: str) -> list[float]:
        """文本 → 向量。"""
        response = self.client.embeddings.create(
            model=self.embedding_model,
            input=text,
        )
        return response.data[0].embedding
