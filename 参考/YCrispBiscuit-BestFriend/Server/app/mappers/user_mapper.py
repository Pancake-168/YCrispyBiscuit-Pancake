"""用户数据访问层（Mapper/DAO）：实现与数据库的交互方法（异步）"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.entities.user import UserEntity


class UserMapper:
    """用户 Mapper：封装数据库操作"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_username(self, username: str) -> Optional[UserEntity]:
        """根据用户名查找用户"""
        try:
            stmt = select(UserEntity).where(UserEntity.username == username)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            raise ValueError(f"Failed to find user by username: {str(e)}")

    async def find_by_email(self, email: str) -> Optional[UserEntity]:
        """根据邮箱查找用户"""
        try:
            stmt = select(UserEntity).where(UserEntity.email == email)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            raise ValueError(f"Failed to find user by email: {str(e)}")

    async def create_user(self, username: str, email: str, password_hash: str, nickname: Optional[str] = None) -> UserEntity:
        """创建新用户"""
        try:
            entity = UserEntity(
                username=username,
                email=email,
                password_hash=password_hash,
                nickname=nickname
            )
            self.db.add(entity)
            await self.db.commit()
            await self.db.refresh(entity)
            return entity
        except Exception as e:
            raise ValueError(f"Failed to create user: {str(e)}")