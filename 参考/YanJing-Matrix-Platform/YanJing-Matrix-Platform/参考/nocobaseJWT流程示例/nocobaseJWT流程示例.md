# Nocobase JWT 代签发流程示例 (Python 版)

此文档描述了如何使用 Python 后端绕过 Nocobase 的登录界面，直接签发 Nocobase 可识别的 Token，实现 SSO 登录。

## 1. 核心原理与疑问解答

### Q1: 为什么 Python 不需要引入 Nocobase 包就能签发 Token？
**A:** Nocobase 的认证机制完全基于 **JWT (JSON Web Token)** 标准协议。
*   **JWT 是通用的**：它只是一串经过签名的 JSON 数据，任何语言（Python, Java, Node.js）只要遵循标准都能生成。
*   **信任的基础是密钥**：Nocobase 后端验证 Token 时，只看签名是否是用它的 `APP_KEY` 签发的。
*   **结论**：只要您的 Python 后端拥有 Nocobase 的 `APP_KEY`，并且按照 Nocobase 要求的格式构造 JSON 数据（Payload），生成的 Token 就和 Nocobase 自己生成的一模一样，**绝对不是“拼凑”的，而是合法的签名凭证**。

### Q2: 如何操作数据库？
**A:** Python 直接连接 Nocobase 使用的数据库（PostgreSQL/MySQL）。
*   Nocobase 的用户数据存储在 `users` 表中。
*   Python 通过 SQL 语句查询或插入该表，获取 `id`。
*   **不需要** Nocobase 的 ORM 代码，只需要标准的 SQL 操作。

## 2. 流程说明

1.  **前端 (Vue)**: 发送主 SSO Token (用于验证身份) 给 Python 后端。这里的 Token 是你们系统的主 Token (可用于换取 Matrix Token 等)。
2.  **Python 后端 (FastAPI)**:
    *   验证 SSO Token 合法性。
    *   解析出用户信息 (Email/OpenID)。
    *   查询 Nocobase 数据库 `users` 表: `SELECT id FROM users WHERE email = ?`。
    *   如果用户不存在，插入新用户: `INSERT INTO users ...` 并返回新用户 ID。
    *   如果用户已存在，返回现有用户 ID。
    *   使用 `APP_KEY` 签发 Nocobase JWT。
    *   返回 Nocobase Token 给前端。
3.  **前端 (Vue)**: 携带 Token 请求 Nocobase API。
4.  **Nocobase 服务**: 验签通过 (APP_KEY 匹配) -> 放行。

## 3. Python 后端实现

请确保安装依赖：
```bash
pip install PyJWT sqlalchemy psycopg2-binary
```

### 代码示例

```python
import jwt
import time
import uuid
from sqlalchemy import create_engine, text

# ================= 配置区域 =================
# [关键] 必须与 Nocobase 部署目录下的 .env 文件中的 APP_KEY 完全一致
# 只有密钥一致，Nocobase 才会认为这个 Token 是合法的
NOCOBASE_APP_KEY = "your-secret-key-from-nocobase-env" 

# Nocobase 数据库连接串
DB_CONNECTION_STR = "postgresql://postgres:password@localhost:5432/nocobase_db"

# Token 过期时间 (秒)
TOKEN_EXPIRATION = 7 * 24 * 3600 
# ===========================================

# 初始化数据库连接
engine = create_engine(DB_CONNECTION_STR)

def generate_nocobase_jwt(user_id):
    """
    生成 Nocobase 认可的 JWT Token
    原理：使用与 Nocobase 相同的密钥 (APP_KEY) 和算法 (HS256) 对用户信息进行签名。
    """
    now = int(time.time())
    
    # 构造 Payload (这是 Nocobase 能够识别的标准格式)
    payload = {
        "userId": user_id,          # [核心] 告诉 Nocobase 当前是谁
        "iat": now,                 # 签发时间
        "exp": now + TOKEN_EXPIRATION, # 过期时间
        "signInTime": now * 1000,   # 登录时间 (毫秒)
        "jti": str(uuid.uuid4()),   # 唯一标识
        "temp": True,               # 标识为普通访问令牌
        "roleName": None            # 默认角色
    }
    
    # 签名
    token = jwt.encode(payload, NOCOBASE_APP_KEY, algorithm="HS256")
    
    # 兼容处理：PyJWT 早期版本返回 bytes
    if isinstance(token, bytes):
        token = token.decode('utf-8')
        
    return token

def handle_sso_login(sso_token):
    """
    处理 SSO 登录请求
    :param sso_token: 前端传来的主 SSO Token (不是 Matrix Token，是你们系统的主凭证)
    """
    
    # 1. 验证主 SSO Token
    # 这里调用你们自己的验证逻辑，确认 sso_token 是有效的
    # user_info = verify_your_system_token(sso_token)
    
    # 模拟验证成功，解析出用户唯一标识 (例如邮箱)
    user_email = "user@example.com"
    user_nickname = "SSO User"
    
    # 2. 数据库操作：确保用户在 Nocobase 中存在
    # 直接操作 Nocobase 的 users 表
    with engine.connect() as conn:
        # 查询用户
        result = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": user_email})
        row = result.fetchone()
        
        if row:
            user_id = row[0]
        else:
            # 用户不存在，自动注册 (JIT Provisioning)
            # 注意：created_at 等字段根据数据库类型可能需要调整
            insert_sql = text("""
                INSERT INTO users (email, nickname, created_at, updated_at) 
                VALUES (:email, :nickname, NOW(), NOW()) 
                RETURNING id
            """)
            result = conn.execute(insert_sql, {"email": user_email, "nickname": user_nickname})
            user_id = result.fetchone()[0]
            conn.commit()
    
    # 3. 签发 Nocobase Token
    # 这一步生成的 Token，Nocobase 拿到后会用同样的 APP_KEY 验签，
    # 只要验签通过，Nocobase 就认为这个 user_id 已经登录了。
    nocobase_token = generate_nocobase_jwt(user_id)
    
    return {
        "token": nocobase_token,
        "user_id": user_id
    }
```

## 4. 前端调用示例 (Vue)

```javascript
import { useAPIClient } from '@nocobase/client';

const api = useAPIClient();

async function onSSOCallback(ssoToken) {
    // 1. 将主 SSO Token 发送给 Python 后端
    const res = await fetch('https://your-python-api/sso/login', {
        method: 'POST',
        body: JSON.stringify({ token: ssoToken })
    });
    
    const data = await res.json();
    
    // 2. 拿到 Python 签发的 Nocobase Token
    const nocobaseToken = data.token;
    
    // 3. 注入 SDK
    api.auth.setToken(nocobaseToken);
    
    // 4. 验证并跳转
    await api.auth.check();
    // router.push(...)
}
```
