from sqlalchemy import select  # 构建 SELECT 查询
from sqlalchemy.ext.asyncio import AsyncSession  # 异步数据库会话类型
from sqlalchemy.exc import IntegrityError, SQLAlchemyError  # SQLAlchemy 异常类型
from typing import Optional
from app.entities.UserEntity import UserEntity  # 用户 ORM 实体
from app.exceptions.errors import ConflictError, DatabaseError  # 项目统一异常


class UserMapper:
    """用户数据访问层，只负责数据库读写和 ORM 查询，不处理业务逻辑。"""

    def __init__(self, db: AsyncSession):
        self.db = db  # 异步数据库会话，由 Service 层注入

    # ------------------------------------------------------------------
    # 查询
    # ------------------------------------------------------------------

    async def find_by_username(self, username: str) -> Optional[UserEntity]:
        """根据用户名查找用户实体，不存在返回 None。"""
        try:
            # 构造 SELECT ... WHERE username = :username
            result = await self.db.execute(
                select(UserEntity).where(UserEntity.username == username)
            )
            return result.scalar_one_or_none()  # 最多一条记录，不存在返回 None
        except SQLAlchemyError as exc:
            raise DatabaseError("通过用户名查找用户实体失败") from exc  # 底层异常 → 项目异常

    async def find_by_email(self, email: str) -> Optional[UserEntity]:
        """根据邮箱查找用户实体，不存在返回 None。"""
        try:
            result = await self.db.execute(
                select(UserEntity).where(UserEntity.email == email)
            )
            return result.scalar_one_or_none()
        except SQLAlchemyError as exc:
            raise DatabaseError("通过邮箱查找用户实体失败") from exc

    async def find_by_id(self, user_id: int) -> Optional[UserEntity]:
        """根据用户 id 查找用户实体，不存在返回 None。"""
        try:
            # int(user_id) 防御性类型转换（API 层传入的 id 可能是字符串）
            result = await self.db.execute(
                select(UserEntity).where(UserEntity.id == int(user_id))
            )
            return result.scalar_one_or_none()
        except SQLAlchemyError as exc:
            raise DatabaseError("通过 id 查找用户实体失败") from exc

    # ------------------------------------------------------------------
    # 写入
    # ------------------------------------------------------------------

    async def create_user(
        self,
        username: str,
        email: str,
        password_hash: str,
        nickname: Optional[str] = None,
    ) -> UserEntity:
        """创建新用户实体并持久化到数据库，返回刷新后的实体。"""
        try:
            # 构造 ORM 实体（仅构造，暂未写入数据库）
            entity = UserEntity(
                username=username,
                email=email,
                password_hash=password_hash,
                nickname=nickname,
            )
            self.db.add(entity)  # 加入会话待提交队列
            await self.db.commit()  # 提交事务，写入数据库
            await self.db.refresh(entity)  # 刷新以获取数据库生成的 id、created_at 等字段
            return entity
        except IntegrityError as exc:
            await self.db.rollback()  # 唯一约束冲突时回滚
            raise ConflictError("用户数据冲突，无法创建用户") from exc
        except SQLAlchemyError as exc:
            await self.db.rollback()  # 其他数据库错误时回滚
            raise DatabaseError("创建用户实体失败") from exc
