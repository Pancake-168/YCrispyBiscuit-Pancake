"""认证与授权服务。JWT token 签发、验证，以及统一鉴权依赖注入。"""


import time  # token 签发时间/过期时间
import uuid  # JWT jti 唯一标识
from typing import Dict  # payload 类型标注

import jwt  # PyJWT 库：JWT 编码和解码
from fastapi import Depends  # FastAPI 依赖注入
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer  # Bearer token 认证
from sqlalchemy.ext.asyncio import AsyncSession  # 异步数据库会话类型

from app.core.config import get_settings  # 配置（jwt_secret_key）
from app.core.database import get_db  # 数据库会话依赖
from app.exceptions.errors import AuthenticationError  # 认证失败异常
from app.services.UserService import UserService  # 用户查询服务

settings = get_settings()  # 获取全局配置实例
security = HTTPBearer()  # FastAPI 安全依赖：从 Authorization 头提取 Bearer token

# ============================================================================
# 依赖注入工厂
# ============================================================================

def get_jwt_service(db: AsyncSession = Depends(get_db)) -> "JWTService":
    """工厂函数：创建绑定数据库会话的 JWTService 实例。"""
    return JWTService(db)


async def require_user_id(
    jwt_service: "JWTService" = Depends(get_jwt_service),  # 先获取 JWTService
    credentials: HTTPAuthorizationCredentials = Depends(security),  # 提取 Bearer token
) -> str:
    """统一鉴权依赖：验证 token 并返回当前用户 ID。

    在任何需要鉴权的端点中声明此 Depends，FastAPI 自动校验 token。
    """
    return await jwt_service.get_current_user_id(credentials)  # 验证并提取 user_id


# ============================================================================
# JWT 服务
# ============================================================================

class JWTService:
    """JWT token 签发与验证。"""

    # 配置常量
    JWT_SECRET_KEY = settings.jwt_secret_key  # HS256 签名密钥
    JWT_ALGORITHM = "HS256"  # HMAC-SHA256 算法
    TOKEN_EXPIRATION = 7 * 24 * 3600  # token 有效期：7 天

    def __init__(self, db: AsyncSession):
        self.service = UserService(db)  # 内部持有用户服务，用于验证用户存在性
   
    # ------------------------------------------------------------------
    # Token 签发
    # ------------------------------------------------------------------

    def generate_jwt_token(self, user_id: str) -> str:
        """为用户签发 JWT token。"""
        now = int(time.time())  # 当前 Unix 时间戳
        payload = {
            "userId": user_id,  # 用户 ID（字符串）
            "iat": now,  # 签发时间（Issued At）
            "exp": now + self.TOKEN_EXPIRATION,  # 过期时间（Expiration）
            "jti": str(uuid.uuid4()),  # JWT 唯一标识，防止重放
            "temp": True,  # 标记为临时 token
            "roleName": "PancakeSystemUser",  # 固定角色名
        }
        return jwt.encode(payload, self.JWT_SECRET_KEY, algorithm=self.JWT_ALGORITHM)  # 编码为 JWT 字符串

    # ------------------------------------------------------------------
    # Token 验证
    # ------------------------------------------------------------------

    def decode_jwt_token(self, token: str) -> Dict:
        """解码并验证 JWT token。过期或格式非法时抛出 AuthenticationError。"""
        try:
            return jwt.decode(token, self.JWT_SECRET_KEY, algorithms=[self.JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:  # token 已过期
            raise AuthenticationError("Token expired")
        except jwt.InvalidTokenError:  # token 格式无效或签名不匹配
            raise AuthenticationError("Invalid token")

    def _validate_payload(self, payload: Dict) -> int:
        """对已解码的 payload 做业务级别的合法性检查，返回 user_id（int）。"""
        now = int(time.time())  # 当前时间

        # 验证签发时间（不能晚于当前时间）
        if not isinstance(payload.get("iat"), int) or payload["iat"] > now:
            raise AuthenticationError("非法的签发时间")

        # 验证过期时间（不能早于当前时间）
        if not isinstance(payload.get("exp"), int) or payload["exp"] < now:
            raise AuthenticationError("Token 已过期")

        # 验证角色名
        if payload.get("roleName") != "PancakeSystemUser":
            raise AuthenticationError("非法的角色")

        # 提取 user_id 并转为 int
        try:
            return int(payload.get("userId"))
        except Exception:
            raise AuthenticationError("非法的用户ID")


 # ------------------------------------------------------------------
    # 用户验证
    # ------------------------------------------------------------------

    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)):
        """验证 token 并从数据库加载用户实体，返回完整 UserEntity。

        使用 Depends 注入时，FastAPI 先调用 HTTPBearer 提取 token，
        然后传入此方法进行解析和用户加载。
        """
        token = credentials.credentials  # 提取 token 字符串
        payload = self.decode_jwt_token(token)  # 解码 + 验证
        user_id = self._validate_payload(payload)  # 业务校验 + 提取 user_id
        # 从数据库加载用户
        try:
            user = await self.service.get_user_by_id(user_id)
        except Exception as exc:
            raise AuthenticationError("用户查询失败") from exc
        if not user:
            raise AuthenticationError("用户未找到")
        return user  # 返回完整用户实体

    async def get_current_user_id(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
        """验证 token 并返回当前用户 ID 字符串。

        这是 require_user_id 依赖的实际实现。
        """
        user = await self.get_current_user(credentials)  # 完整验证流程
        return str(user.id)  # 返回字符串类型的用户 ID



