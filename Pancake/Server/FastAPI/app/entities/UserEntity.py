from sqlalchemy import Column, String, Integer, DateTime  # ORM 列类型
from sqlalchemy.sql import func  # SQL 函数（用于 server_default=func.now()）
from app.core.database import Base  # 声明式 ORM 基类


class UserEntity(Base):
    """用户表 ORM 实体，映射到数据库 users 表。"""

    __tablename__ = "users"  # 数据库表名

    id = Column(Integer, primary_key=True, index=True)  # 自增主键，自动建索引
    username = Column(String(50), unique=True, nullable=False)  # 用户名，唯一约束，不可为空
    email = Column(String(100), unique=True, nullable=False)  # 邮箱，唯一约束，不可为空
    nickname = Column(String(100), nullable=True)  # 昵称，可选
    password_hash = Column(String(255), nullable=False)  # bcrypt 哈希后的密码
    role = Column(String(20), default="user")  # 用户角色，默认 "user"
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 创建时间，由数据库自动填充
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())  # 更新时间，每次更新自动刷新
