from fastapi import APIRouter, Depends  # APIRouter=路由分组 Depends=依赖注入
from app.schemas.UserSchema import (
    AuthResponse,
    LoginRequest,
    UserCreate,
    UserResponse,
)  # 请求/响应模型
from app.services.UserService import (
    UserService,
    get_user_service,
)  # 用户服务 + 工厂函数
from app.services.AuthService import (
    get_jwt_service,
    JWTService,
)  # JWT 服务（签发 token）
from app.entities.UserEntity import UserEntity  # ORM 实体（类型标注用）

router = APIRouter()  # 创建此模块的路由实例


def to_user_response(user: UserEntity) -> UserResponse:
    """将 ORM 实体转换为 Pydantic 响应模型。"""
    # model_validate 自动映射同名字段（id, username, email, nickname, created_at 等）
    return UserResponse.model_validate(user)


@router.post(
    "/auth/register",  # 路径: /api/auth/register
    summary="注册用户",
    tags=["User"],
    response_model=AuthResponse,  # 返回 token + 用户信息
)
async def register_user(
    user_create: UserCreate,  # 请求体 JSON → Pydantic 校验
    service: UserService = Depends(
        get_user_service
    ),  # 注入用户服务（每个请求独立实例）
    jwt_service: JWTService = Depends(
        get_jwt_service
    ),  # 注入 JWT 服务（用于签发 token）
):
    """注册新用户。

    Request Body:
    - username: 用户名
    - email: 邮箱地址
    - password: 密码
    - nickname: 昵称
    """
    # 调用服务层注册用户（含重复检查、密码哈希）
    user = await service.register_user(
        username=user_create.username,
        email=str(user_create.email),  # EmailStr → str，去掉 Pydantic 包装
        password=user_create.password,
        nickname=user_create.nickname,
    )
    # 基于新用户 ID 生成 JWT token（7 天有效）
    token = jwt_service.generate_jwt_token(str(user.id))
    return AuthResponse(
        user=to_user_response(user), token=token
    )  # 返回用户信息 + token


@router.post(
    "/auth/login",  # 路径: /api/auth/login
    summary="用户登录",
    tags=["User"],
    response_model=AuthResponse,
)
async def login_user(
    login_request: LoginRequest,  # 用户名 + 密码
    service: UserService = Depends(get_user_service),
    jwt_service: JWTService = Depends(get_jwt_service),
):
    """用户登录，校验用户名密码后签发 JWT token。"""
    # 校验用户名和密码（失败抛 AuthenticationError）
    user = await service.authenticate_user(
        login_request.username, login_request.password
    )
    # 签发 JWT token
    token = jwt_service.generate_jwt_token(str(user.id))
    return AuthResponse(user=to_user_response(user), token=token)
