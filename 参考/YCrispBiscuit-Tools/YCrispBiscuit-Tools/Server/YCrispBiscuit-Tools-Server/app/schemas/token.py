"""
Token-related Pydantic models
Token 相关的 Pydantic 数据模型
"""

from pydantic import BaseModel

# Token 响应模型
class Token(BaseModel):
    access_token: str  # 访问令牌
    token_type: str    # 令牌类型

# Token 数据载体
class TokenData(BaseModel):
    username: str | None = None  # 用户名（可选）
