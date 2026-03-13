"""用户业务逻辑层（Service）"""

import bcrypt
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.entities.user import UserEntity
from app.schemas.user_schema import UserCreate, UserResponse
from app.mappers.user_mapper import UserMapper
from app.utils.jwt_utils import generate_jwt


class UserService:
    """用户 Service：业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.mapper = UserMapper(db)

    async def authenticate_user(self, username: str, password: str) -> Optional[UserResponse]:
        """用户认证，返回用户对象"""
        user = await self.mapper.find_by_username(username)
        if user and bcrypt.checkpw(password.encode(), user.password_hash.encode()):
            return UserResponse.from_orm(user)
        return None

    async def register_user(self, user_data: UserCreate) -> UserResponse:
        """用户注册"""
        # 检查用户名和邮箱是否已存在
        if await self.mapper.find_by_username(user_data.username):
            raise ValueError("Username already exists")
        if await self.mapper.find_by_email(user_data.email):
            raise ValueError("Email already exists")

        # 哈希密码
        password_hash = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()

        # 创建用户
        user_entity = await self.mapper.create_user(user_data.username, user_data.email, password_hash, user_data.nickname)
        return UserResponse.from_orm(user_entity)

    async def get_user_by_username(self, username: str) -> Optional[UserResponse]:
        """根据用户名获取用户"""
        user = await self.mapper.find_by_username(username)
        return UserResponse.from_orm(user) if user else None

    async def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        """根据邮箱获取用户"""
        user = await self.mapper.find_by_email(email)
        return UserResponse.from_orm(user) if user else None