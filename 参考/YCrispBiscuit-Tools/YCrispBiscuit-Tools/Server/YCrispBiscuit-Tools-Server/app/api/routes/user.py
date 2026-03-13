# 用户相关接口路由
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas, models
from app.dependencies import get_current_active_user

# 创建 APIRouter 实例，用于注册用户相关路由
router = APIRouter()

@router.get("/profile", response_model=schemas.user.User)
def read_users_me(
    current_user: models.user.User = Depends(get_current_active_user)
):
    """
    获取当前登录用户的个人信息。
    - current_user: 通过依赖注入获取当前活跃用户对象
    - 返回：当前用户的详细信息（User 模型）
    """
    return current_user
