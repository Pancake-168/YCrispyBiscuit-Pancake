"""
User-related Pydantic models
用户相关的 Pydantic 数据模型
"""

from pydantic import BaseModel

# 用户基础属性
class UserBase(BaseModel):
    username: str  # 用户名
    email: str | None = None  # 邮箱（可选）
    full_name: str | None = None  # 全名（可选）

# 创建用户时需要的属性
class UserCreate(UserBase):
    password: str  # 密码

# 更新用户时需要的属性
class UserUpdate(UserBase):
    password: str | None = None  # 密码（可选）

# 数据库存储的用户属性
class UserInDB(UserBase):
    hashed_password: str  # 加密后的密码

# 返回给客户端的用户属性
class User(UserBase):
    class Config:
        orm_mode = True  # 支持 ORM 对象到 Pydantic 模型的自动转换
