"""
User repository for database operations
用户表相关的数据库操作方法
"""

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

# 根据用户名查询用户
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

# 创建新用户并保存到数据库
def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, email=user.email, full_name=user.full_name, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
