import bcrypt
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.entities.UserEntity import UserEntity
from app.exceptions.errors import AuthenticationError, ConflictError
from app.mappers.UserMapper import UserMapper


class UserService:
    def __init__(self, db: AsyncSession):
        self.mapper = UserMapper(db)

    async def getUserByUsername(self, username: str) -> Optional[UserEntity]:
        """根据用户名获取用户"""
        return await self.mapper.findByUsername(username)

    async def getUserByEmail(self, email: str) -> Optional[UserEntity]:
        """根据邮箱获取用户"""
        return await self.mapper.findByEmail(email)

    async def getUserById(self, user_id: int) -> Optional[UserEntity]:
        """根据用户 id 获取用户"""
        return await self.mapper.findById(user_id)

    async def registerUser(
        self,
        username: str,
        email: str,
        password: str,
        nickname: Optional[str] = None,
    ) -> UserEntity:
        """注册新用户"""
        # 检查用户名或邮箱是否已存在
        existing_user = await self.mapper.findByUsername(username)
        if existing_user:
            raise ConflictError("用户名已存在")

        existing_email = await self.mapper.findByEmail(email)
        if existing_email:
            raise ConflictError("邮箱已存在")
        # 哈希密码
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        # 创建用户实体
        return await self.mapper.createUser(
            username=username,
            email=email,
            password_hash=password_hash,
            nickname=nickname,
        )

    async def authenticateUser(
        self, username: str, password: str
    ) -> UserEntity:
        """用户认证，返回用户对象"""
        user = await self.mapper.findByUsername(username)
        if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
            raise AuthenticationError("用户名或密码错误")
        return user
