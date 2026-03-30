from fastapi import APIRouter, HTTPException, Depends
from app.schemas.UserSchema import UserCreate, LoginRequest
from app.services.UserService import UserService
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.JWT import get_jwt_service, JWTService

router = APIRouter()


@router.post("/sso/register")
async def register_user(
    user_create: UserCreate,
    db: AsyncSession = Depends(get_db),
    jwt_service: JWTService = Depends(get_jwt_service),
):
    """注册"""
    service = UserService(db)
    try:
        user = await service.registerUser(user_create)
        token = jwt_service.generate_jwt_token(str(user.id))
        return {"user": user, "token": token}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sso/login")
async def login_user(
    login_request: LoginRequest,
    db: AsyncSession = Depends(get_db),
    jwt_service: JWTService = Depends(get_jwt_service),
):
    """登录"""
    service = UserService(db)
    try:
        user = await service.authenticateUser(
            login_request.username, login_request.password
        )
        if not user:
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        token = jwt_service.generate_jwt_token(str(user.id))
        return {"user": user, "token": token}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
