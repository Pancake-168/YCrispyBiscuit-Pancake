import jwt
import time
import uuid
from typing import Dict
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import get_settings
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.UserService import UserService


settings = get_settings()
security = HTTPBearer()


def get_jwt_service(db: AsyncSession = Depends(get_db)) -> "JWTService":
    return JWTService(db)


class JWTService:
    JWT_SECRET_KEY = settings.jwt_secret_key
    JWT_ALGORITHM = "HS256"
    TOKEN_EXPIRATION = 7 * 24 * 3600

    def __init__(self, db: AsyncSession):
        self.service = UserService(db)

    # 生成 JWT token
    def generate_jwt_token(self, user_id: str) -> str:
        now = int(time.time())

        payload = {
            "userId": user_id,
            "iat": now,
            "exp": now + self.TOKEN_EXPIRATION,
            "jti": str(uuid.uuid4()),
            "temp": True,
            "roleName": "YCrispyBiscuitSystemUser"
        }
        token = jwt.encode(payload, self.JWT_SECRET_KEY, algorithm=self.JWT_ALGORITHM)
        return token

    # 解码并验证 JWT token
    def decode_jwt_token(self, token: str) -> Dict:
        try:
            payload = jwt.decode(token, self.JWT_SECRET_KEY, algorithms=[self.JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
                
    # 便捷辅助：返回完整用户响应对象（异步）
    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)):
        """在验证 token 和用户存在性后，返回完整的用户对象（Pydantic）。"""
        # 拿到token
        token = credentials.credentials

        # 解码token
        payload = self.decode_jwt_token(token)

        # 提取时间iat
        iat = payload.get("iat")

        # 验证时间iat
        if not iat or not isinstance(iat, int):
            raise HTTPException(status_code=401, detail="非法的签发时间")
        now = int(time.time())
        if iat > now:
            raise HTTPException(status_code=401, detail="非法的签发时间")

        # 提取时间exp
        exp = payload.get("exp")

        # 验证时间exp
        if not exp or not isinstance(exp, int):
            raise HTTPException(status_code=401, detail="非法的过期时间")
        if exp < now:
            raise HTTPException(status_code=401, detail="Token 已过期")

        # 提取roleName
        role_name = payload.get("roleName")
        # 验证roleName
        if role_name != "YCrispyBiscuitSystemUser":
            raise HTTPException(status_code=401, detail="非法的角色")

        # 提取用户ID
        user_id = payload.get("userId")

        # 验证用户ID
        if not user_id:
            raise HTTPException(status_code=401, detail="非法的用户ID")
        try:
            uid = int(user_id)
        except Exception:
            raise HTTPException(status_code=401, detail="非法的用户ID")
        # 使用 Service 验证并获取用户
        try:
            user = await self.service.getUserById(uid)
        except Exception:
            raise HTTPException(status_code=401, detail="用户查询失败")
        if not user:
            raise HTTPException(status_code=401, detail="用户未找到")
        return user

    # token验证是否有效，返回用户ID（异步）
    async def get_current_user_id(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
        user = await self.get_current_user(credentials)
        return str(user.id)
 