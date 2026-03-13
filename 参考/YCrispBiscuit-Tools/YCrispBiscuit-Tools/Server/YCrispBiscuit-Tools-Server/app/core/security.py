"""
安全相关的工具函数，如密码哈希、JWT Token 生成和校验
"""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# 密码加密上下文，使用 bcrypt 算法
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 校验明文密码和哈希密码是否一致
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    校验明文密码和哈希密码是否一致

    :param plain_password: 明文密码
    :param hashed_password: 哈希密码
    :return: 如果一致返回 True，否则返回 False
    """
    return pwd_context.verify(plain_password, hashed_password)

# 获取密码哈希值
def get_password_hash(password: str) -> str:
    """
    获取密码的哈希值

    :param password: 明文密码
    :return: 密码的哈希值
    """
    return pwd_context.hash(password)

# 生成 JWT 访问令牌
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    生成 JWT 访问令牌

    :param data: 包含用户信息的字典
    :param expires_delta: 令牌过期时间，默认为 None
    :return: JWT 访问令牌
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
