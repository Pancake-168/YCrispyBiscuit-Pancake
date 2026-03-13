import os
import time
import uuid
import jwt
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = FastAPI()

# ================= 配置区域 =================
# 从环境变量获取配置
NOCOBASE_APP_KEY = os.getenv("NOCOBASE_APP_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
TOKEN_EXPIRATION = 7 * 24 * 3600  # 7天

if not NOCOBASE_APP_KEY:
    raise ValueError("NOCOBASE_APP_KEY is not set in .env file")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env file")

# 初始化数据库连接
engine = create_engine(DATABASE_URL)

# ================= 数据模型 =================
class SSOLoginRequest(BaseModel):
    token: str

class SSOLoginResponse(BaseModel):
    token: str
    user_id: int

# ================= 核心逻辑 =================

def generate_nocobase_jwt(user_id: int) -> str:
    """
    生成 Nocobase 认可的 JWT Token
    """
    now = int(time.time())
    
    payload = {
        "userId": user_id,
        "iat": now,
        "exp": now + TOKEN_EXPIRATION,
        "signInTime": now * 1000,
        "jti": str(uuid.uuid4()),
        "temp": True,
        "roleName": None
    }
    
    token = jwt.encode(payload, NOCOBASE_APP_KEY, algorithm="HS256")
    
    if isinstance(token, bytes):
        token = token.decode('utf-8')
        
    return token

def verify_sso_token(token: str):
    """
    验证 SSO Token 的合法性
    这里需要替换为您实际的验证逻辑
    """
    # 示例：假设 Token 是 JWT，验证签名
    # try:
    #     payload = jwt.decode(token, os.getenv("SSO_PUBLIC_KEY"), algorithms=["RS256"])
    #     return payload
    # except jwt.InvalidTokenError:
    #     return None
    
    # 模拟验证成功
    return {
        "email": "user@example.com",
        "nickname": "SSO User"
    }

def get_or_create_nocobase_user(email: str, nickname: str) -> int:
    """
    在 Nocobase 数据库中查找或创建用户
    """
    with engine.connect() as conn:
        # 1. 查询用户是否存在
        result = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
        row = result.fetchone()
        
        if row:
            return row[0]
        
        # 2. 用户不存在，创建新用户
        # 注意：不同数据库的 SQL 语法可能略有不同，这里以 PostgreSQL 为例
        insert_sql = text("""
            INSERT INTO users (email, nickname, created_at, updated_at) 
            VALUES (:email, :nickname, NOW(), NOW()) 
            RETURNING id
        """)
        
        try:
            result = conn.execute(insert_sql, {"email": email, "nickname": nickname})
            user_id = result.fetchone()[0]
            conn.commit()
            return user_id
        except Exception as e:
            conn.rollback()
            raise e

# ================= 接口定义 =================

@app.post("/api/sso/login", response_model=SSOLoginResponse)
async def sso_login(request: SSOLoginRequest):
    """
    SSO 登录接口
    接收 SSO Token，返回 Nocobase Token
    """
    # 1. 验证 SSO Token
    user_info = verify_sso_token(request.token)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid SSO Token")
    
    # 2. 获取 Nocobase 用户 ID
    try:
        user_id = get_or_create_nocobase_user(user_info["email"], user_info["nickname"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    # 3. 签发 Nocobase Token
    nocobase_token = generate_nocobase_jwt(user_id)
    
    return {
        "token": nocobase_token,
        "user_id": user_id
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
