"""
Dependencies for API endpoints
API 路由依赖项的实现，包括数据库会话、用户认证等
"""

from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core import security
from app.schemas import token as token_schema
from app.repository import user as user_repo
from app.models.user import User

# OAuth2 认证依赖，指定 token 获取地址
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/auth/token"
)

# 获取数据库会话的依赖项
def get_db() -> Generator:
    """
    获取数据库会话，接口依赖项。
    用于 FastAPI 路由中自动获取和关闭数据库连接。
    """
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

# 获取当前登录用户的依赖项
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    """
    通过 JWT Token 获取当前用户对象。
    - db: 数据库会话
    - token: 认证令牌
    - 返回：当前用户对象
    """
    try:
        payload = jwt.decode(
            token, security.settings.SECRET_KEY, algorithms=[security.settings.ALGORITHM]
        )
        token_data = token_schema.TokenData(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = user_repo.get_user_by_username(db, username=token_data.username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# 获取当前活跃用户的依赖项
def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    校验当前用户是否为活跃状态。
    - current_user: 当前用户对象
    - 返回：活跃用户对象
    """
    if not getattr(current_user, 'is_active', True):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
