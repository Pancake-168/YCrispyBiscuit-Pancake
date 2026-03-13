

# 前置数据
1. **APP_Key**: Nocobase `.env` 环境变量中的 `APP_KEY`。
2. **user_id**: Nocobase 数据库 `users` 表中的用户 ID（注意：是 Nocobase 的 ID，不是 Matrix 的 ID）。

# Python 实现代码

```python
import jwt
import time
import uuid

# 必须与 Nocobase .env 中的 APP_KEY 完全一致
NOCOBASE_APP_KEY = "复制过来的KEY" 

# Token 有效期 
TOKEN_EXPIRATION = 7 * 24 * 3600

def generate_nocobase_jwt(user_id):
    """
    生成 Nocobase 认可的 JWT Token
    :param user_id: Nocobase users 表的主键 ID (int)
    """
     # 使用当前时间，减去 60 秒作为缓冲，防止服务器时间略微滞后导致 "Token issued in the future"
    now = int(time.time()) - 60
    
    # 构造 Payload (必须严格遵循此结构)
    payload = {
        "userId": user_id,                    # Nocobase users 表的主键 ID
        "iat": now,                           # 签发时间
        "exp": now + TOKEN_EXPIRATION,        # 过期时间
        "signInTime": now * 1000,             # 登录时间 (毫秒级时间戳)
        "jti": str(uuid.uuid4()),             # JWT ID (唯一标识)
        "temp": True,                         # 必须为 True
        "roleName": None                      # 角色名称 (可选)
    }

    # 使用 HS256 算法进行签名
    return jwt.encode(payload, NOCOBASE_APP_KEY, algorithm="HS256")
```



