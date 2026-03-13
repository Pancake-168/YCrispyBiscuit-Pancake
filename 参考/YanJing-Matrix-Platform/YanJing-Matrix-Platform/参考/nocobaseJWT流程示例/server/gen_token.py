import jwt
import time
import uuid

NOCOBASE_APP_KEY = "y9&&QhiT!aNY&@v78$xU4%#Xy5we2^578@Sy8w&it&8fp$!A"
TOKEN_EXPIRATION = 7 * 24 * 3600

def generate_nocobase_jwt(user_id):
    # 使用当前时间，减去 60 秒作为缓冲，防止服务器时间略微滞后导致 "Token issued in the future"
    now = int(time.time()) - 60
    
    payload = {
        "userId": user_id,
        "iat": now,
        "exp": now + TOKEN_EXPIRATION,
        "signInTime": now * 1000,
        "jti": str(uuid.uuid4()),
        "temp": True,
        "roleName": None
    }
    return jwt.encode(payload, NOCOBASE_APP_KEY, algorithm="HS256")

# 假设 admin 的 ID 为 1
print(generate_nocobase_jwt(2))
