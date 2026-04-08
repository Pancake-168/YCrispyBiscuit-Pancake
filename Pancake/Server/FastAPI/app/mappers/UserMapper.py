from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import Optional
from app.entities.UserEntity import UserEntity
from app.exceptions.errors import ConflictError, DatabaseError


class UserMapper:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def findByUsername(self, username: str) -> Optional[UserEntity]:
        """根据用户名查找用户实体"""
        try:
            result = await self.db.execute(
                select(UserEntity).where(UserEntity.username == username)
            )
            return result.scalar_one_or_none()
        except SQLAlchemyError as exc:
            raise DatabaseError("通过用户名查找用户实体失败") from exc

    async def findByEmail(self, email: str) -> Optional[UserEntity]:
        """根据邮箱查找用户实体"""
        try:
            result = await self.db.execute(
                select(UserEntity).where(UserEntity.email == email)
            )
            return result.scalar_one_or_none()
        except SQLAlchemyError as exc:
            raise DatabaseError("通过邮箱查找用户实体失败") from exc

    async def findById(self, user_id: int) -> Optional[UserEntity]:
        """根据用户 id 查找用户实体"""
        try:
            result = await self.db.execute(
                select(UserEntity).where(UserEntity.id == int(user_id))
            )
            return result.scalar_one_or_none()
        except SQLAlchemyError as exc:
            raise DatabaseError("通过 id 查找用户实体失败") from exc

    async def createUser(
        self,
        username: str,
        email: str,
        password_hash: str,
        nickname: Optional[str] = None,
    ) -> UserEntity:
        """创建新用户实体"""
        try:
            entity = UserEntity(
                username=username,
                email=email,
                password_hash=password_hash,
                nickname=nickname,
            )
            self.db.add(entity)
            await self.db.commit()
            await self.db.refresh(entity)
            return entity
        except IntegrityError as exc:
            await self.db.rollback()
            raise ConflictError("用户数据冲突，无法创建用户") from exc
        except SQLAlchemyError as exc:
            await self.db.rollback()
            raise DatabaseError("创建用户实体失败") from exc
