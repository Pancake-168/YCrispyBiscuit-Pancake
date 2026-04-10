from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


### 用户基础信息，注册和更新时都需要用到
class UserBase(BaseModel):
    username: str
    email: EmailStr
    nickname: Optional[str] = None


### 注册时前端传来的数据
class UserCreate(UserBase):
    password: str


### 更新用户信息时前端传来的数据，所有字段都可选，暂无函数调用
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    nickname: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "user"


### 登录时前端传来的数据
class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    role: str = "user"


### 登录/注册时返回的响应
class AuthResponse(BaseModel):
    user: UserResponse
    token: str
