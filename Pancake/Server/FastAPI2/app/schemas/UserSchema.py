from pydantic import BaseModel, EmailStr, ConfigDict  # EmailStr=邮箱格式校验 ConfigDict=Pydantic v2 配置
from typing import Optional  # 可选字段标注
from datetime import datetime  # 时间戳字段类型

# ============================================================================
# 用户基础模型
# ============================================================================


class UserBase(BaseModel):
    """用户基础信息 Schema，作为 UserCreate / UserResponse 的共享基类。"""

    username: str  # 用户名（唯一标识）
    email: EmailStr  # 邮箱地址（Pydantic 自动校验格式）
    nickname: Optional[str] = None  # 昵称，可选





# ============================================================================
# 用户请求体模型
# ============================================================================
class UserCreate(UserBase):
    """POST /api/auth/register 的请求体，继承 UserBase 并追加密码字段。"""

    password: str  # 明文密码（Service 层做 bcrypt 哈希）

class UserUpdate(BaseModel):
    """PUT /api/auth/update 的请求体，所有字段可选，暂无函数调用。"""

    username: Optional[str] = None
    email: Optional[EmailStr] = None  # 更新邮箱时也会做格式校验
    nickname: Optional[str] = None
    password: Optional[str] = None  # 新密码
    role: Optional[str] = "user"  # 角色，默认保持 "user"

class LoginRequest(BaseModel):
    """POST /api/auth/login 的请求体。"""

    username: str  # 用户名
    password: str  # 明文密码







# ============================================================================
# 响应模型
# ============================================================================
class UserResponse(UserBase):
    """用户信息响应体，继承 UserBase 并追加数据库生成字段。"""

    # from_attributes=True 允许从 SQLAlchemy UserEntity 直接构造
    model_config = ConfigDict(from_attributes=True)
    id: int  # 数据库自增主键
    created_at: datetime  # 注册时间
    updated_at: Optional[datetime] = None  # 最后更新时间（首次注册时为 None）
    role: str = "user"  # 用户角色

class AuthResponse(BaseModel):
    """POST /api/auth/register 和 /api/auth/login 的响应体。"""

    user: UserResponse  # 用户信息
    token: str  # JWT token 字符串
