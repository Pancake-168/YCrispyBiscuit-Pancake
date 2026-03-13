"""用户控制器（Controller）"""

from fastapi import APIRouter, HTTPException, Depends
from app.schemas.user_schema import UserCreate, UserResponse, LoginRequest
from app.services.user_service import UserService
from app.utils.jwt_utils import generate_jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter()

@router.post("/register")
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """用户注册"""
    service = UserService(db)
    try:
        user = await service.register_user(user_data)
        # 注册成功后生成 token 并返回
        token = generate_jwt(user.id)
        return {"user": user, "token": token}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """用户登录，返回用户信息和 JWT Token"""
    service = UserService(db)
    user = await service.authenticate_user(login_data.username, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = generate_jwt(user.id)
    return {"user": user, "token": token}