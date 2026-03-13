# Region SSO — API 接口文档

> 完整架构与模块文档请参阅 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 概览

### 基础信息

| 项目 | 值 |
|------|----|
| Base URL | `http://<host>/api/auth` |
| 默认端口 | `9003`（见 `APP_PORT` 环境变量） |
| 响应格式 | JSON |
| 认证方式 | Bearer Token（JWT，通过登录接口获取） |

### 认证说明

需要认证的接口必须在请求头中携带 JWT Token：
```
Authorization: Bearer <token>
```
Token 通过任意登录接口获取，默认有效期 30 天（由 `JWT_ACCESS_TOKEN_EXPIRE_DAY` 配置）。

### 通用错误码

| HTTP 状态码 | 含义 |
|------------|------|
| `400` | 请求参数错误（详见各接口描述） |
| `401` | Token 无效或已过期 |
| `403` | 账户已禁用 |
| `404` | 资源不存在 |
| `409` | 资源冲突（如手机号/用户名重复） |
| `429` | 请求过于频繁（冷却期内重复发送） |
| `503` | 服务未配置（功能未启用） |

### 接口速览

| 方法 | 路径 | 认证 | 功能 |
|------|------|------|------|
| `POST` | `/password/login` | ❌ | 密码登录 |
| `POST` | `/password/token` | ❌ | 密码登录（OAuth2 兼容路由） |
| `POST` | `/password/register` | ❌ | 密码注册 |
| `POST` | `/password/logout` | ✅ | 登出 |
| `POST` | `/sms/send-code` | ❌ | 发送短信验证码 |
| `POST` | `/sms/login` | ❌ | 短信验证码登录 |
| `POST` | `/sms/register` | ❌ | 短信验证码注册 |
| `POST` | `/sms/bind-phone` | ✅ | 绑定手机号 |
| `GET` | `/captcha/generate` | ❌ | 生成图形验证码 |
| `GET` | `/wx/login` | ❌ | 获取微信登录 URL |
| `GET` | `/wx/callback` | ❌ | 微信 OAuth2 回调 |
| `POST` | `/wx/signUp` | ❌ | 微信注册 |
| `POST` | `/wx/userinfo` | ❌ | 获取微信用户信息（注册前） |
| `GET` | `/wx/callback/bridge` | ❌ | 微信回调桥接页（HTML） |
| `POST` | `/userinfo` | ✅ | 获取当前用户信息 |
| `GET` | `/userdetail` | ❌ | 按 openid 查询用户详情 |
| `PUT` | `/userdetail` | ✅ | 更新用户昵称 |
| `POST` | `/refresh_token` | ✅ | 刷新 JWT Token |
| `POST` | `/{appid}/bdstc` | ✅ | 生成 Nocobase Token |
| `POST` | `/msyanc` | ✅ | 生成 Matrix Token |
| `GET` | `/userconfig` | ✅ | 获取用户配置 |
| `POST` | `/userconfig` | ✅ | 设置用户配置 |
| `DELETE` | `/cancel` | ✅ | 注销账户 |
| `POST` | `/bot/{bot_username}/login` | ❌ | Bot 账户登录 |

---

## 目录

- [密码认证](#密码认证)
  - [密码登录](#密码登录)
  - [密码注册](#密码注册)
  - [登出](#登出)
- [短信认证](#短信认证)
  - [发送验证码](#发送验证码)
  - [短信登录](#短信登录)
  - [短信注册](#短信注册)
  - [绑定手机号](#绑定手机号)
- [图形验证码](#图形验证码)
  - [生成验证码](#生成验证码)
- [微信登录](#微信登录)
  - [获取微信登录 URL](#获取微信登录-url)
  - [微信 OAuth2 回调](#微信-oauth2-回调)
  - [微信注册](#微信注册)
  - [获取微信用户信息](#获取微信用户信息)
  - [微信回调桥接页](#微信回调桥接页)
- [用户信息](#用户信息)
  - [获取当前用户信息](#获取当前用户信息)
  - [查询用户详情](#查询用户详情)
  - [更新用户昵称](#更新用户昵称)
- [Token 管理](#token-管理)
  - [刷新 Token](#刷新-token)
  - [生成 Nocobase Token](#生成-nocobase-token)
  - [生成 Matrix Token](#生成-matrix-token)
- [用户配置](#用户配置)
  - [获取用户配置](#获取用户配置)
  - [设置用户配置](#设置用户配置)
- [账户管理](#账户管理)
  - [注销账户](#注销账户)
- [Bot 登录](#bot-登录)

---

## 密码认证

### 密码登录

登录成功后同时完成 Matrix JWT 登录并创建/更新登录会话。

> **双路由**：`/password/login` 和 `/password/token` 指向同一处理函数，行为完全相同。`/password/token` 符合 OAuth2 Password Flow 规范，用于兼容标准 OAuth2 客户端。

```
POST /api/auth/password/login
POST /api/auth/password/token
```

**Content-Type:** `application/x-www-form-urlencoded`（表单编码，**非 JSON**）

**认证：** 不需要

**请求字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | ✅ | 用户名 |
| `password` | string | ✅ | 密码（明文，传输层须 HTTPS） |
| `captcha_id` | string | 条件必填 | 验证码会话 ID，来自 `GET /captcha/generate`。同一 IP 密码失败 ≥ 3 次后必填 |
| `captcha_text` | string | 条件必填 | 用户输入的验证码字符（大小写不敏感）。同上条件 |

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | 固定值 `"Login successful"` |
| `token` | string | SSO JWT Token（用于所有需认证的接口） |
| `matrix_token` | string \| null | Matrix/Synapse 访问令牌（首次登录时生成） |
| `expires_at` | string | Token 过期时间（ISO 8601 格式） |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 已达阈值，未提供验证码字段 | `"Captcha verification required."` |
| `400` | 验证码错误或已过期 | `"Captcha verification failed."` |
| `400` | 账户查询系统错误 | `"Account retrieval error!"` |
| `403` | 账户已被禁用 | `"Account is disabled!"` |
| `404` | 用户名不存在或密码错误（前 2 次失败） | `"Please check your username and password!"` |
| `401` | 密码错误且达到失败阈值（第 3 次及以后）| `"Please check your username and password!"` + 响应头 `X-Captcha-Required: true` |

> **验证码触发机制**：同一 IP 密码连续失败 3 次后，所有后续登录请求必须附带有效验证码（需先调用 `GET /captcha/generate`）。登录成功后计数器自动清零。失败记录 15 分钟后自动过期。

**curl 示例（正常登录）：**
```bash
curl -X POST http://localhost:9003/api/auth/password/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=myuser&password=mypassword"
```

**curl 示例（附带验证码）：**
```bash
# 1. 先获取验证码
CAPTCHA=$(curl -s http://localhost:9003/api/auth/captcha/generate)
CAPTCHA_ID=$(echo $CAPTCHA | python3 -c "import sys,json; print(json.load(sys.stdin)['captchaId'])")

# 2. 用户输入验证码图片中的字符后提交
curl -X POST http://localhost:9003/api/auth/password/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=myuser&password=mypassword&captcha_id=${CAPTCHA_ID}&captcha_text=A3B7"
```

---

### 密码注册

注册新的用户账户。注册后需单独调用登录接口获取 Token。

```
POST /api/auth/password/register
```

**Content-Type:** `application/json`

**认证：** 不需要

**请求字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | ✅ | 用户名（唯一） |
| `password` | string | ✅ | 密码（bcrypt 存储） |

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | 固定值 `"User registered"` |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 用户名已存在 | `"User already exists!"` |
| `400` | 账户查询系统错误 | `"Account retrieval error!"` |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/password/register \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "mypassword123"}'
```

---

### 登出

销毁当前登录会话（删除 LoginSession 记录并清除内存缓存）。

> ⚠️ 注意：由于 JWT 本地撤销机制尚未启用，已颁发的 Token 在过期前仍然有效。

```
POST /api/auth/password/logout
```

**Content-Type：** 无请求体

**认证：** ✅ 必须（Bearer Token）

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | 固定值 `"Logged out successfully"` |

**错误码：**

| 状态码 | 触发条件 |
|--------|---------|
| `401` | Token 无效或已过期 |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/password/logout \
  -H "Authorization: Bearer <token>"
```

---

## 短信认证

> 短信功能需 `SSO_SMS_ENABLED=true` 且配置火山引擎 SMS 参数，否则所有 `/sms/*` 接口返回 `503`。

### 发送验证码

向指定手机号发送 6 位数字 OTP 验证码。支持三种场景：登录、注册、绑定手机号。

```
POST /api/auth/sms/send-code
```

**Content-Type:** `application/json`

**认证：** 不需要

**请求字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `phone` | string | ✅ | 手机号。支持 11 位国内号码（以 `1` 开头）或 E.164 格式（`+` 前缀，7–15 位）|
| `scene` | string | ✅ | 发送场景。枚举值：`"login"` \| `"register"` \| `"bind"` |
| `captcha_id` | string | 条件必填 | 验证码会话 ID。`SSO_CAPTCHA_ENABLED=true` 时必填 |
| `captcha_text` | string | 条件必填 | 用户输入的验证码字符。同上条件 |

**场景说明：**

| `scene` 值 | 说明 | 预检逻辑 |
|-----------|------|---------|
| `"login"` | 短信登录 | 手机号必须已注册，否则 404 |
| `"register"` | 短信注册 | 手机号必须未注册，否则 409 |
| `"bind"` | 绑定手机号 | 无预检，需在 `POST /sms/bind-phone` 使用 |

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | 固定值 `"Verification code sent"` |
| `cooldown_seconds` | integer | 冷却时间（秒），默认 `60` |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | `SSO_CAPTCHA_ENABLED=true` 且缺少验证码字段 | `"Captcha verification required. Provide captcha_id and captcha_text."` |
| `400` | 验证码错误或已过期 | `"Captcha verification failed."` |
| `400` | `scene` 值不在枚举范围内 | `"Invalid scene '...'. Must be one of: login, register, bind"` |
| `400` | 手机号格式不合法 | `"Invalid phone number format"` |
| `404` | `scene=login` 且手机号未注册 | `"Account not found"` |
| `409` | `scene=register` 且手机号已注册 | `"Phone already registered"` |
| `429` | 60 秒冷却期内重复请求 | `"SMS cooldown active. Please wait N second(s) before resending."` |
| `503` | SMS 服务未配置 | `"SMS service not configured."` |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/sms/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "13800138000", "scene": "login"}'
```

**带验证码示例：**
```bash
curl -X POST http://localhost:9003/api/auth/sms/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "scene": "login",
    "captcha_id": "550e8400-e29b-41d4-a716-446655440000",
    "captcha_text": "A3B7"
  }'
```

---

### 短信登录

使用手机号 + 短信验证码登录。

```
POST /api/auth/sms/login
```

**Content-Type:** `application/json`

**认证：** 不需要

**请求字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `phone` | string | ✅ | 手机号（格式同发送验证码） |
| `code` | string | ✅ | 收到的短信验证码 |

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | `"Login successful"` |
| `token` | string | SSO JWT Token |
| `matrix_token` | string \| null | Matrix 访问令牌 |
| `expires_at` | string | Token 过期时间 |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 验证码错误 | `"Invalid verification code"` |
| `400` | 验证码已过期 | `"Verification code expired"` |
| `400` | 账户查询系统错误 | `"Account retrieval error!"` |
| `403` | 账户已禁用 | `"Account is disabled!"` |
| `404` | 手机号未注册 | `"Account not found"` |
| `503` | SMS 服务未配置 | `"SMS service not configured."` |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/sms/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "13800138000", "code": "123456"}'
```

---

### 短信注册

使用手机号 + 短信验证码注册新账户，注册成功后**自动登录**并返回 Token。

```
POST /api/auth/sms/register
```

**Content-Type:** `application/json`

**认证：** 不需要

**请求字段：**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `phone` | string | ✅ | — | 手机号（同时作为 username） |
| `code` | string | ✅ | — | 短信验证码 |
| `nickname` | string | ❌ | `""` | 用户昵称（可为空） |

**成功响应 `200`：** 同短信登录（自动登录，直接返回 Token）

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 验证码错误 | `"Invalid verification code"` |
| `400` | 验证码已过期 | `"Verification code expired"` |
| `409` | 手机号已注册 | `"Phone already registered"` |
| `503` | SMS 服务未配置 | `"SMS service not configured."` |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/sms/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "13800138000", "code": "123456", "nickname": "张三"}'
```

---

### 绑定手机号

为已登录账户绑定手机号。需先通过 `POST /sms/send-code?scene=bind` 获取验证码。

```
POST /api/auth/sms/bind-phone
```

**Content-Type:** `application/json`

**认证：** ✅ 必须（Bearer Token）

**请求字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `phone` | string | ✅ | 要绑定的手机号 |
| `code` | string | ✅ | 验证码（`scene=bind` 发送的） |

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | `"Phone number bound successfully"` |
| `phone` | string | 已绑定的手机号 |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 验证码错误 | `"Invalid verification code"` |
| `400` | 验证码已过期 | `"Verification code expired"` |
| `400` | 账户更新失败 | `"Failed to update phone number!"` |
| `401` | Token 无效 | — |
| `409` | 手机号已绑定其他账户 | `"Phone already bound to another account"` |
| `503` | SMS 服务未配置 | `"SMS service not configured."` |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/sms/bind-phone \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"phone": "13900139000", "code": "654321"}'
```

---

## 图形验证码

> 图形验证码功能需 `SSO_CAPTCHA_ENABLED=true`，否则返回 `503`。

### 生成验证码

生成一张图形验证码图片及对应的会话 ID。

```
GET /api/auth/captcha/generate
```

**认证：** 不需要

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `captchaId` | string (UUID v4) | 验证码会话 ID。使用一次后立即失效（防重放），3 分钟内未使用自动过期 |
| `image` | string | Base64 编码的 PNG 图片，含 `data:image/png;base64,` 前缀，可直接用于 `<img src="...">` |

**使用规则：**
- 验证码字符集：`23456789ABCDEFGHJKMNPQRSTUVWXYZ`（排除 `0/O/I/1/L` 等易混淆字符）
- 默认长度：4 个字符
- 验证时**大小写不敏感**（`a3b7` 与 `A3B7` 等价）
- 每个 `captchaId` 只能使用一次（无论成功还是失败，验证后立即销毁）
- 需要新验证码时须重新调用此接口

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `503` | `SSO_CAPTCHA_ENABLED=false` | `"Captcha service not configured."` |

**curl 示例：**
```bash
curl -s http://localhost:9003/api/auth/captcha/generate | python3 -m json.tool
```

**前端集成示例（JavaScript）：**
```javascript
const res = await fetch('/api/auth/captcha/generate');
const { captchaId, image } = await res.json();
document.getElementById('captcha-img').src = image;
// 用户填写验证码后，将 captchaId + captcha_text 随主请求一起提交
```

---

## 微信登录

> 微信登录需 `SSO_WECHAT_WEB=true` 且配置 AppID/Secret，否则路由不注册。

### 获取微信登录 URL

返回微信 OAuth2 授权跳转（302 重定向到微信扫码页面）。

```
GET /api/auth/wx/login
```

**认证：** 不需要

**响应：** HTTP `302` 重定向至微信授权 URL（`open.weixin.qq.com`）

微信完成授权后会回调 `SSO_WECHAT_WEB_CALLBACK_URL`（即 `GET /api/auth/wx/callback`）。

**curl 示例：**
```bash
curl -v http://localhost:9003/api/auth/wx/login
# 响应 302 Location: https://open.weixin.qq.com/connect/qrconnect?...
```

---

### 微信 OAuth2 回调

微信授权完成后的服务端回调。由微信服务器自动调用，客户端通常不直接请求此接口。

```
GET /api/auth/wx/callback?code=<code>&state=<state>
```

**认证：** 不需要

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `code` | string | 微信返回的授权码（一次性使用，5 分钟有效） |
| `state` | string | 防 CSRF 的随机 state 值（由 `/wx/login` 生成） |

**处理逻辑：**
1. 用 `code` 向微信换取 `access_token` 和 `openid`
2. 用 `openid` 查询 WxAccount 表
3. **已绑定账户** → 直接登录，跳转到 `SSO_WECHAT_WEB_CALLBACK_REDIRECT_URL`（附带 Token 参数）
4. **未绑定账户** → 将微信信息临时存储，跳转到前端注册页（附带 `sub` + `code` 供 `POST /wx/signUp` 使用）

---

### 微信注册

使用微信账号完成注册（在 `/wx/callback` 返回未绑定状态后调用）。注册成功后**自动登录**并返回 SSO Token。

```
POST /api/auth/wx/signUp
```

**Content-Type:** `application/json`

**认证：** 不需要

**请求字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sub` | integer | ✅ | 微信账户临时记录 ID（来自 `/wx/callback` 跳转参数） |
| `code` | string | ✅ | 微信账户验证码（来自 `/wx/callback` 跳转参数，非短信验证码） |
| `phone` | string | ✅ | 11 位国内手机号（纯数字） |
| `nickname` | string | ❌ | 用户昵称（默认 `""`） |
| `password` | string | ❌ | 登录密码（可选，默认 `""`，微信账户无需密码即可登录） |

**成功响应 `200`：** 返回 SSO JWT Token 字符串（直接是 token 字符串，非 JSON 对象）

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 手机号格式错误（非 11 位数字） | `"Phone number format is invalid!"` |
| `400` | 微信 access_token 无效或已过期 | `"Wechat access token is invalid or expired!"` |
| `400` | 刷新微信 access_token 失败 | `"Failed to refresh Wechat access token!"` |
| `400` | 微信账户查询系统错误 | `"Failed to retrieve Wechat account!"` |
| `404` | `sub` + `code` 对应的微信账户不存在（可能已超时） | `"Wechat account not found!"` |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/wx/signUp \
  -H "Content-Type: application/json" \
  -d '{
    "sub": 42,
    "code": "callback-state-token",
    "phone": "13800138000",
    "nickname": "微信用户"
  }'
```

---

### 获取微信用户信息

查询微信回调阶段暂存的微信用户信息（昵称、头像），用于注册前展示给用户确认。

```
POST /api/auth/wx/userinfo
```

**Content-Type:** `application/json`

**认证：** 不需要

**请求字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sub` | integer | ✅ | 微信账户临时记录 ID（来自 `/wx/callback` 跳转参数） |
| `code` | string | ✅ | 微信账户验证码（来自 `/wx/callback` 跳转参数） |

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 微信昵称 |
| `headimgurl` | string | 微信头像 URL |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 微信 access_token 已失效 | `"Wechat access token is invalid or expired!"` |
| `400` | 查询系统错误 | `"Failed to retrieve Wechat account!"` |
| `404` | 账户不存在（sub/code 无效） | `"Wechat account not found!"` |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/wx/userinfo \
  -H "Content-Type: application/json" \
  -d '{"sub": 42, "code": "callback-state-token"}'
```

---

### 微信回调桥接页

微信扫码登录完成后的 HTML 桥接页面，通过 `window.postMessage` 将登录结果传回父窗口（适用于弹窗/新标签页式的微信扫码接入方式）。

```
GET /api/auth/wx/callback/bridge?<微信回调参数>
```

**认证：** 不需要

**响应：** `text/html`，页面加载后自动执行 `window.opener.postMessage(data, '*')` 并关闭自身。

---

## 用户信息

### 获取当前用户信息

返回当前登录用户的基本信息及已授权的应用列表。

```
POST /api/auth/userinfo
```

**认证：** ✅ 必须（Bearer Token）

**成功响应 `200`（普通用户）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `username` | string | 用户名 |
| `nickname` | string | 昵称（若未设置则等于用户名） |
| `apps` | array | 已授权的应用列表 |
| `apps[].app_id` | string | 应用 ID |
| `apps[].app_tag` | string | 应用标签 |

**成功响应 `200`（Bot 用户，额外字段）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `owner.username` | string | Bot 所属用户的用户名 |
| `owner.nickname` | string | Bot 所属用户的昵称 |
| `owner.matrix_user_id` | string | Bot 所属用户的 Matrix ID（`@openid:homeserver`） |

**错误码：**

| 状态码 | 触发条件 |
|--------|---------|
| `401` | Token 无效或已过期 |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/userinfo \
  -H "Authorization: Bearer <token>"
```

---

### 查询用户详情

通过 `openid` 查询用户的用户名和昵称。

> ⚠️ **安全提示**：此接口当前**无需认证**。详见 [SECURITY_THREATS.md](SECURITY_THREATS.md) C-3。

```
GET /api/auth/userdetail?openid=<openid>
```

**认证：** ❌（当前无认证，计划修复）

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `openid` | string (UUID) | ✅ | 用户 openid（账户唯一标识符） |

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `username` | string | 用户名 |
| `nickname` | string | 昵称 |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 账户查询系统错误 | `"Failed to retrieve account info!"` |
| `400` | 用户查询系统错误 | `"Failed to retrieve user info!"` |
| `404` | openid 对应账户不存在 | `"Account not found!"` |
| `404` | 关联用户记录不存在 | `"User not found!"` |

**curl 示例：**
```bash
curl "http://localhost:9003/api/auth/userdetail?openid=00000000-0000-0000-0000-000000000001"
```

---

### 更新用户昵称

更新当前用户在 Nocobase（root 和 market app）及 Matrix 中的显示昵称。

```
PUT /api/auth/userdetail
```

**Content-Type:** `application/json`

**认证：** ✅ 必须（Bearer Token）

**请求字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `nickname` | string | ✅ | 新昵称 |

**成功响应 `200`：** 空响应体（`null`）

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 昵称更新失败 | `"Failed to update user nickname!"` |
| `401` | Token 无效 | — |

**curl 示例：**
```bash
curl -X PUT http://localhost:9003/api/auth/userdetail \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nickname": "新昵称"}'
```

---

## Token 管理

### 刷新 Token

为当前用户生成新的 JWT Token，并更新 LoginSession 中的过期时间。

```
POST /api/auth/refresh_token
```

**认证：** ✅ 必须（Bearer Token，即将过期的 Token 也可使用，只要尚未过期）

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | `"Token refreshed"` |
| `token` | string | 新的 SSO JWT Token |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 会话记录不存在 | `"Session not found!"` |
| `400` | Token 刷新失败 | `"Failed to refresh token!"` |
| `400` | 会话查询系统错误 | `"Session retrieval error!"` |
| `401` | 当前 Token 已过期 | — |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/refresh_token \
  -H "Authorization: Bearer <token>"
```

---

### 生成 Nocobase Token

为当前用户在指定 Nocobase 应用中生成临时访问 Token。

```
POST /api/auth/{appid}/bdstc
```

**认证：** ✅ 必须（Bearer Token）

**Path 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `appid` | string | Nocobase 应用 ID。根容器通常为 `"root"` |

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `token` | string | Nocobase JWT Token（临时，用于直接调用 Nocobase API） |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | `appid` 为空 | `"AppID is required"` |
| `401` | Token 无效 | — |
| `404` | 用户在该应用中无 UAP 记录 | `"UAP not found for the specified AppID"` |
| `404` | UAP 中未找到用户 ID | `"User ID not found in UAP for the specified AppID"` |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/root/bdstc \
  -H "Authorization: Bearer <token>"
```

---

### 生成 Matrix Token

登出当前 Matrix 会话（如果存在），重新以 JWT 方式登录 Matrix，并更新数据库中的 matrix_token。

```
POST /api/auth/msyanc
```

**认证：** ✅ 必须（Bearer Token）

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | string | Matrix 用户 ID（格式 `@openid:homeserver`） |
| `device_id` | string | Matrix 设备 ID |
| `access_token` | string | Matrix 访问令牌 |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | Matrix JWT 登录失败 | `"Matrix login failed!"` |
| `400` | 数据库更新 Matrix token 失败 | — |
| `401` | SSO Token 无效 | — |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/msyanc \
  -H "Authorization: Bearer <token>"
```

---

## 用户配置

用户配置存储在 Nocobase `Userconfig` 表中，以 JSON 格式持久化，每个用户一条记录（不存在时自动创建）。

### 获取用户配置

```
GET /api/auth/userconfig
```

**认证：** ✅ 必须（Bearer Token）

**成功响应 `200`：** 用户配置 JSON 对象（无配置时返回 `{}`）

```json
{
  "theme": "dark",
  "language": "zh-CN"
}
```

**错误码：**

| 状态码 | 触发条件 |
|--------|---------|
| `400` | 配置查询系统错误 |
| `401` | Token 无效 |

**curl 示例：**
```bash
curl http://localhost:9003/api/auth/userconfig \
  -H "Authorization: Bearer <token>"
```

---

### 设置用户配置

覆盖写入用户配置（完整替换，非 merge）。配置不存在时自动创建。

```
POST /api/auth/userconfig
```

**Content-Type:** `application/json`

**认证：** ✅ 必须（Bearer Token）

**请求字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `config` | object | ✅ | 任意 JSON 对象，完整覆盖现有配置 |

**成功响应 `200`：** 空响应体

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `400` | 更新失败 | `"更改失败"` |
| `400` | 创建失败 | `"创建失败"` |
| `401` | Token 无效 | — |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/userconfig \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"config": {"theme": "dark", "language": "zh-CN"}}'
```

---

## 账户管理

### 注销账户

删除当前用户的全部数据：Account、WxAccount、NocobaseAccount、LoginSession、LoginLog 等跨多张表的记录，以及 Nocobase users 表中的用户记录。

> ⚠️ **不可逆操作**。删除为非原子操作，中间步骤失败可能导致数据部分残留。

```
DELETE /api/auth/cancel
```

**认证：** ✅ 必须（Bearer Token）

**成功响应 `200`：** 空响应体

**删除范围：**

| 表 | 说明 |
|----|------|
| `users`（root） | 根用户记录 |
| `users`（market） | Market 应用用户记录 |
| `NocobaseAccount` | Nocobase 账户映射记录 |
| `WxAccount` | 微信账户记录 |
| `Account` | SSO 账户主记录 |
| `LoginSession` | 所有登录会话 |

**curl 示例：**
```bash
curl -X DELETE http://localhost:9003/api/auth/cancel \
  -H "Authorization: Bearer <token>"
```

---

## Bot 登录

Bot 账户（`atype=bot`）专用登录接口，返回有效期**10 年**的 SSO Token 和 Matrix Token。

> ⚠️ **安全警告**：此接口当前**无需认证**，任何人知道 bot 用户名即可获取长期 Token。详见 [SECURITY_THREATS.md](SECURITY_THREATS.md) C-1。

```
POST /api/auth/bot/{bot_username}/login
```

**认证：** ❌（当前无认证，计划修复）

**Path 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `bot_username` | string | Bot 账户的用户名（`atype=bot`） |

**成功响应 `200`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | `"Login successful"` |
| `token` | string | SSO JWT Token（有效期 10 年） |
| `matrix_token` | string \| null | Matrix 访问令牌 |
| `expires_at` | string | Token 过期时间（约 10 年后） |

**错误码：**

| 状态码 | 触发条件 | detail 消息 |
|--------|---------|-------------|
| `404` | Bot 用户名不存在 | `"Bot account not found!"` |

**curl 示例：**
```bash
curl -X POST http://localhost:9003/api/auth/bot/my_assistant_bot/login
```
