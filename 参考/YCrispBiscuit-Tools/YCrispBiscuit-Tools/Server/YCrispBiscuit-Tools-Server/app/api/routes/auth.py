"""
用户认证相关接口，包括登录和注册
"""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import schemas
from app.core import security
from app.dependencies import get_db
from app.repository import user as user_repo

# 创建 APIRouter 实例，用于注册认证相关路由
router = APIRouter()

@router.post("/token", response_model=schemas.token.Token)
def login_for_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    用户登录，获取访问令牌（JWT）。

    - **db**: 数据库会话
    - **form_data**: 登录表单数据（用户名、密码）

    返回：access_token 和 token_type
    """
    user = user_repo.get_user_by_username(db, username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=schemas.user.User)
def register_user(
    *, 
    db: Session = Depends(get_db),
    user_in: schemas.user.UserCreate
):
    """
    用户注册接口。

    - **db**: 数据库会话
    - **user_in**: 用户注册信息（用户名、密码、邮箱等）

    返回：新注册的用户信息
    """
    user = user_repo.get_user_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = user_repo.create_user(db, user=user_in)
    return user
