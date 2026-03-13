"""JWT 工具函数"""

import jwt
import time
import uuid
from typing import Dict
from app.core.config import get_settings

settings = get_settings()

# JWT 密钥，从环境变量获取
JWT_SECRET_KEY = settings.jwt_secret_key 
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRATION = 7 * 24 * 3600  # 7 天

def generate_jwt(user_id: int) -> str:
    """
    生成 JWT Token
    :param user_id: 用户 ID
    """
    now = int(time.time()) - 60  # 缓冲时间
    payload = {
        "userId": user_id,
        "iat": now,
        "exp": now + TOKEN_EXPIRATION,
        "signInTime": now * 1000,
        "jti": str(uuid.uuid4()),
        "temp": True,
        "roleName": None
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_jwt(token: str) -> Dict:
    """
    验证 JWT Token
    :param token: JWT Token
    :return: payload 或抛出异常
    """
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])