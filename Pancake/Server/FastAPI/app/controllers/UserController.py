from fastapi import APIRouter, HTTPException, Depends
from app.schemas.UserSchema import AuthResponse, LoginRequest, UserCreate, UserResponse
from app.services.UserService import UserService
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.JWT import get_jwt_service, JWTService
from app.entities.UserEntity import UserEntity

router = APIRouter()


def to_user_response(user: UserEntity) -> UserResponse:
    return UserResponse.model_validate(user)


@router.post("/sso/register", 
              summary="注册用户",
    tags=["User"],
             response_model=AuthResponse)
async def register_user(
    user_create: UserCreate,
    db: AsyncSession = Depends(get_db),
    jwt_service: JWTService = Depends(get_jwt_service),
):
    """注册
    Request Body:
    - username: 用户名
    - email: 邮箱地址
    - password: 密码
    - nickname: 昵称
    """
    service = UserService(db)
    user = await service.registerUser(
        username=user_create.username,
        email=str(user_create.email),
        password=user_create.password,
        nickname=user_create.nickname,
    )
    token = jwt_service.generate_jwt_token(str(user.id))
    return AuthResponse(user=to_user_response(user), token=token)


@router.post("/sso/login", response_model=AuthResponse)
async def login_user(
    login_request: LoginRequest,
    db: AsyncSession = Depends(get_db),
    jwt_service: JWTService = Depends(get_jwt_service),
):
    """登录"""
    service = UserService(db)
    user = await service.authenticateUser(login_request.username, login_request.password)
    token = jwt_service.generate_jwt_token(str(user.id))
    return AuthResponse(user=to_user_response(user), token=token)
