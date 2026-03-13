"""
User model for database
数据库中用户表的 ORM 模型定义
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

# 创建基础类
Base = declarative_base()

class User(Base):
    """
    用户表 ORM 模型
    - id: 主键，自增
    - username: 用户名，唯一
    - email: 邮箱，唯一
    - full_name: 用户全名
    - hashed_password: 加密后的密码
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, index=True)
    hashed_password = Column(String)
