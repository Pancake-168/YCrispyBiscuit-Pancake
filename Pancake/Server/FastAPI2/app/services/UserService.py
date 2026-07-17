"""用户服务。处理注册、登录、用户查询等业务逻辑。"""

import bcrypt  # 密码哈希（SHA-256 + salt）
from typing import Optional  # 可选字段类型标注

from fastapi import Depends  # 依赖注入
from sqlalchemy.ext.asyncio import AsyncSession  # 异步 SQLAlchemy 会话
from app.core.database import get_db  # 获取数据库会话的 Depends 函数
from app.entities.UserEntity import UserEntity  # 用户 ORM 实体
from app.exceptions.errors import AuthenticationError, ConflictError  # 项目异常
from app.mappers.UserMapper import UserMapper  # 用户数据访问层


def get_user_service(db: AsyncSession = Depends(get_db)) -> "UserService":
    """工厂函数：每次请求创建新的 UserService（绑定独立数据库会话）。"""
    return UserService(db)


class UserService:
    """用户业务逻辑。依赖 UserMapper 进行数据库操作。"""

    def __init__(self, db: AsyncSession):
        self.mapper = UserMapper(db)  # 用一个数据库会话初始化 mapper

    # ------------------------------------------------------------------
    # 查询
    # ------------------------------------------------------------------

    async def get_user_by_username(self, username: str) -> Optional[UserEntity]:
        """根据用户名获取用户实体，不存在返回 None。"""
        return await self.mapper.find_by_username(username)  # 委托 mapper 查询

    async def get_user_by_email(self, email: str) -> Optional[UserEntity]:
        """根据邮箱获取用户实体，不存在返回 None。"""
        return await self.mapper.find_by_email(email)

    async def get_user_by_id(self, user_id: int) -> Optional[UserEntity]:
        """根据用户 id 获取用户实体，不存在返回 None。"""
        return await self.mapper.find_by_id(user_id)

    # ------------------------------------------------------------------
    # 注册
    # ------------------------------------------------------------------

    async def register_user(
        self,
        username: str,
        email: str,
        password: str,
        nickname: Optional[str] = None,
    ) -> UserEntity:
        """注册新用户。

        1. 检查用户名和邮箱是否已被占用
        2. bcrypt 哈希密码
        3. 创建用户实体并持久化
        """
        # 检查用户名重复
        existing_user = await self.mapper.find_by_username(username)
        if existing_user:
            raise ConflictError("用户名已存在")  # 409

        # 检查邮箱重复
        existing_email = await self.mapper.find_by_email(email)
        if existing_email:
            raise ConflictError("邮箱已存在")  # 409

        # bcrypt 哈希密码（自动加盐）
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        # 调用 mapper 创建并持久化用户
        return await self.mapper.create_user(
            username=username,
            email=email,
            password_hash=password_hash,
            nickname=nickname,
        )

    # ------------------------------------------------------------------
    # 登录
    # ------------------------------------------------------------------

    async def authenticate_user(self, username: str, password: str) -> UserEntity:
        """校验用户名和密码，成功返回用户实体，失败抛出异常。"""
        # 根据用户名查找用户
        user = await self.mapper.find_by_username(username)
        # 用户不存在 或 密码不匹配 → 统一抛认证失败异常（避免泄露具体原因）
        if not user or not bcrypt.checkpw(
            password.encode(),
            user.password_hash.encode(),  # bcrypt 校验
        ):
            raise AuthenticationError("用户名或密码错误")  # 401
        return user  # 认证成功，返回用户实体
