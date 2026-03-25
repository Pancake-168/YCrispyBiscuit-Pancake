import bcrypt
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.entities.UserEntity import UserEntity
from app.mappers.UserMapper import UserMapper
from app.schemas.UserSchema import UserCreate,UserResponse


class UserService:
    def __init__(self, db: AsyncSession):
        self.mapper = UserMapper(db)

    async def getUserByUsername(self, username: str) -> Optional[UserResponse]:
        """根据用户名获取用户"""
        user = await self.mapper.findByUsername(username)
        return UserResponse.from_orm(user) if user else None

    async def getUserByEmail(self, email: str) -> Optional[UserResponse]:
        """根据邮箱获取用户"""
        user = await self.mapper.findByEmail(email)
        return UserResponse.from_orm(user) if user else None

    async def getUserById(self, user_id: int) -> Optional[UserResponse]:
        """根据用户 id 获取用户"""
        user = await self.mapper.findById(user_id)
        return UserResponse.from_orm(user) if user else None

    async def registerUser(self, user_create: UserCreate) -> UserResponse:
        """注册新用户"""
        # 检查用户名或邮箱是否已存在
        existing_user = await self.mapper.findByUsername(user_create.username)
        if existing_user:
            raise ValueError("用户名已存在")
        
        existing_email = await self.mapper.findByEmail(user_create.email)
        if existing_email:
            raise ValueError("邮箱已存在")
        # 哈希密码
        password_hash = bcrypt.hashpw(user_create.password.encode(), bcrypt.gensalt()).decode()

        # 创建用户实体
        user_entity = await self.mapper.createUser(
            username=user_create.username,
            email=user_create.email,
            password_hash=password_hash,
            nickname=user_create.nickname
        )

        return UserResponse.from_orm(user_entity)

    
    async def authenticateUser(self, username: str, password: str) -> Optional[UserResponse]:
        """用户认证，返回用户对象"""
        user = await self.mapper.findByUsername(username)
        if user and bcrypt.checkpw(password.encode(), user.password_hash.encode()):
            return UserResponse.from_orm(user)
        return None
