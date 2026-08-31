# Pancake

个人桌面工具箱 — 图片转码、音频转码、MMD 工作流一键启动、天气查询、B 站登录信息获取、本地 AI 助手内嵌。

基于 Tauri 2 + React 19 + FastAPI 构建，Windows 桌面应用。

> 本文档范围：`Pancake/Client/Tauri-React/Pancake-Tauri-React` 前端 + `Pancake/Server/FastAPI` 后端。
> `Pancake/Server/FastAPI-Bot` 不在本文档范围内。

## 功能总览

| 功能 | 说明 |
|---|---|
| **图片转码** | 批量格式互转、质量/无损压缩、缩放/裁切、色彩模式选择、EXIF 清理、SVG 位图封装/矢量化输出 |
| **音频转码** | 基于 ffmpeg 的批量格式转换，支持 WAV / FLAC / AIFF / MP3 / AAC / OGG / OPUS |
| **松饼工作流** | 读取本地 `PCmethods.json` 配置，一键打开 MMD 工作流全部或指定文件夹（Tauri 本地独占） |
| **天气查询** | 中国天气网城市列表搜索，展示当前实况与 7 天预报 |
| **B 站登录信息获取** | 扫码登录 / Cookie 登录、用户信息、全量存储值、ac_time_value 与会话管理 |
| **AI 助手** | 内嵌 DeepSeek Harness Web 页面，后端本地代理解决跨站 iframe 的 SameSite Cookie 问题 |
| **用户系统** | 后端提供 JWT 注册/登录接口，当前前端页面尚未接入登录流程 |

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面壳 | Tauri 2 (Rust) |
| 前端 | React 19 + TypeScript + Vite 7 |
| UI | Radix UI + CSS Modules + react-icons |
| 路由 | react-router-dom v7 |
| 状态管理 | Zustand |
| 后端 | FastAPI (Python) + Uvicorn |
| 数据库 | SQLAlchemy (async) + aiosqlite |
| 认证 | PyJWT + bcrypt |
| 实时通信 | Socket.IO |
| 图片处理 | Pillow + pillow-heif + pyavif + cairosvg + numpy |
| 音频处理 | ffmpeg / ffprobe |
| 后端打包 | PyInstaller → 嵌入 Tauri 为 sidecar |

## 项目结构

```text
Pancake/
├── Client/Tauri-React/Pancake-Tauri-React/   # 前端 + Tauri 桌面壳
│   ├── src/
│   │   ├── components/common/    # 17 个基础 UI 组件
│   │   ├── views/Pages/          # 功能页面
│   │   ├── services/             # 前端 API 调用层
│   │   ├── composables/          # 首页工具列表配置
│   │   ├── router/               # 路由
│   │   ├── stores/               # Zustand 状态
│   │   └── utils/                # HTTP / 日志 / 文件工具
│   └── src-tauri/                # Rust 壳、后端进程管理、下载拦截、日志写入
└── Server/FastAPI/                # FastAPI 后端
    ├── app/
    │   ├── api/router.py         # 路由汇总，统一挂载 /api
    │   ├── controllers/          # HTTP 端点
    │   ├── services/             # 业务逻辑
    │   ├── core/                 # 配置 / 数据库 / 生命周期 / 日志
    │   ├── entities/             # ORM 实体
    │   ├── mappers/              # 数据访问
    │   ├── schemas/              # 请求/响应模型
    │   ├── exceptions/           # 统一异常体系
    │   ├── middlewares/          # RequestID 等中间件
    │   ├── utils/                # 格式映射等工具
    │   ├── socketio.py           # Socket.IO 实时通信
    │   └── dsh_proxy.py          # DeepSeek Harness 本地反向代理
    ├── json/                     # Apis.json / PCmethods.json / WeatherCities.json
    └── ffmpeg/                   # ffmpeg 二进制（本地下载，不入库）
```

## 快速开始

### 环境要求

- Node.js >= 20.19（Vite 7 要求）
- Python 3.12
- Rust 工具链（Tauri 构建需要）
- Windows 环境（部分功能依赖 Windows API）

### 后端

```bash
cd Pancake/Server/FastAPI

# 创建 .venv 并安装 Python 依赖
pnpm run setup

# 下载 ffmpeg / ffprobe（音频转换必需）
pnpm run download:ffmpeg

# 启动后端（开发模式，默认 127.0.0.1:8080）
pnpm run dev

# 打包后端为独立 exe
pnpm run build:exe
```

后端启动后：

- Swagger 文档：http://127.0.0.1:8080/docs
- OpenAPI：http://127.0.0.1:8080/openapi.json

### 前端

```bash
cd Pancake/Client/Tauri-React/Pancake-Tauri-React

# 安装前端依赖
pnpm install

# 纯前端开发（需要后端已启动）
pnpm run dev

# Tauri 桌面开发（会自动拉起后端）
pnpm run dev:tauri

# 纯前端生产构建
pnpm run build

# Tauri 桌面应用生产构建
pnpm run build:tauri
```

## 后端功能与 API

### 健康检查

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 服务健康状态 |

### 用户认证

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 注册用户，返回用户信息 + JWT |
| POST | `/api/auth/login` | 用户名密码登录，返回用户信息 + JWT |

JWT 有效期 7 天，密码使用 bcrypt 哈希。当前前端页面未接入注册/登录 UI。

### 图片转换

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/picture/formats` | 获取支持的输入/输出格式及格式详情 |
| POST | `/api/picture/convert` | 批量图片转换（multipart/form-data） |
| GET | `/api/picture/download/single/{task_id}/{index}` | 下载单个转换结果 |
| GET | `/api/picture/download/batch/{task_id}` | 下载全部结果 ZIP |

支持的输入格式：

```text
png jpg jpeg webp bmp tiff tif gif ico avif heif heic svg ppm pgm pbm tga
```

支持输出到除 HEIF/HEIC 外的格式，包括：

```text
png jpg jpeg webp bmp tif tiff gif ico svg ppm pgm pbm tga avif
```

图片转换参数：

- 目标格式
- 质量（有损格式）
- WebP 无损模式
- 缩放模式：不缩放 / 等比适配 / 等比填充 / 精确尺寸
- 色彩模式：自动 / RGB / RGBA / 灰度 / 调色板
- 透明填充色
- 移除元数据
- SVG 输出模式：位图封装 / 矢量化描摹

单文件上限 100MB，单次最多 50 个文件，任务结果保留 10 分钟。

### 音频转换

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/audio/formats` | 获取支持的音频格式及详情 |
| POST | `/api/audio/convert` | 批量音频转换 |
| GET | `/api/audio/download/single/{task_id}/{index}` | 下载单个转换结果 |
| GET | `/api/audio/download/batch/{task_id}` | 下载全部结果 ZIP |

支持输入：

```text
wav flac aiff aif mp3 m4a aac ogg opus
```

支持输出：

```text
wav flac aiff mp3 aac ogg opus
```

说明：

- `aac` 统一输出为 `.m4a`（MP4 容器）
- `ogg` 与 `opus` 使用 OGG 容器
- 转换依赖本地 `ffmpeg` / `ffprobe`

单文件上限 200MB，单次最多 50 个文件，任务结果保留 10 分钟。

### 松饼工作流（PCmethods）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/pcmethods/getmmd` | 获取 MMD 工作流所有文件夹路径 |
| POST | `/api/pcmethods/openmmd` | 在资源管理器中打开全部文件夹 |
| POST | `/api/pcmethods/openmmd/{folder_name}` | 打开指定名称的文件夹 |

配置来源：`data/json/PCmethods.json`，首次启动时从内置默认配置自动复制到可写目录。

### 天气查询

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/weather/list` | 获取城市 ID + 名称列表 |
| GET | `/api/weather?id={id}` | 获取指定城市实况与 7 天预报 |

城市列表来自 `json/WeatherCities.json`，天气数据由后端代理请求中国天气网接口。

### B 站登录信息获取

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/bilibili/login/url` | 获取扫码登录二维码 |
| GET | `/api/bilibili/login/poll` | 轮询扫码登录状态 |
| POST | `/api/bilibili/login/cookie` | 使用 Cookie 直接登录 |
| GET | `/api/bilibili/user` | 获取用户信息（nav 完整响应） |
| GET | `/api/bilibili/stored-values` | 获取全量存储值聚合 |
| GET | `/api/bilibili/ac-time-value` | 获取 ac_time_value 与页面变量 |
| GET | `/api/bilibili/sessions` | 列出活跃会话 |
| DELETE | `/api/bilibili/session` | 删除会话 |

### Socket.IO

服务与 FastAPI 同端口提供 WebSocket/长轮询实时通信：

- `echo`：回音测试
- `broadcast`：广播通知
- `ping_from_client`：应用层心跳

### DeepSeek Harness 内嵌代理

后端启动时会在 `127.0.0.1:3081` 启动本地反向代理，转发到 `127.0.0.1:3080`：

- 保留浏览器 Host，使 Cookie 正确绑定到代理端口
- 将 `SameSite=Strict` 改写为 `SameSite=None; Secure`
- 同时代理 WebSocket `/api/remote.mux`

前端“AI 助手”页面默认加载该代理地址。

## 前端页面

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | 首页 | 工具导航 |
| `/picture_switch` | 图片转码 | 批量图片转换 |
| `/audio_switch` | 音频转码 | 批量音频转换 |
| `/pancake_workflow` | 松饼工作流 | MMD 文件夹一键打开，仅 Tauri 环境显示 |
| `/weather` | 天气查询 | 城市搜索 + 实况 + 7 天预报 |
| `/bilibili_login` | B 站登录 | 扫码/Cookie 登录与数据获取 |
| `/web_embed` | AI 助手 | 内嵌 DeepSeek Harness 页面 |
| `/demo` | Demo | 示例页 |
| `*` | 404 | 未匹配路由 |

## 桌面端集成（Tauri）

- 开发模式：`pnpm run dev:tauri` 会自动使用 `Server/FastAPI/.venv` 启动 FastAPI 后端。
- 生产模式：Tauri 启动时拉起 sidecar `bin/pancake-backend.exe`，关闭时自动结束后端进程。
- 自定义标题栏：无边框窗口 + 最小化/最大化/关闭按钮。
- 主题切换：首页强制深色，其他页面可切换明暗主题。
- 前端日志：通过 Tauri IPC 写入 `pancake.app.log`，与后端日志目录一致。
- 下载拦截：内嵌 iframe 页面触发的下载会保存到应用下载目录，并通过 Toast 提示开始/完成状态。

## 配置说明

### 后端环境变量

`Pancake/Server/FastAPI/.env.development`

```ini
APP_ENV=development
HOST=127.0.0.1
PORT=8080
DEBUG=true
DATABASE_URL=sqlite+aiosqlite:///./pancake.db
DSH_PROXY_PORT=3081
DSH_UPSTREAM_URL=http://127.0.0.1:3080
```

`Pancake/Server/FastAPI/.env.production`

```ini
APP_ENV=production
HOST=0.0.0.0
PORT=3000
DEBUG=false
DATABASE_URL=sqlite+aiosqlite:///./pancake.db
DSH_PROXY_PORT=3081
DSH_UPSTREAM_URL=http://127.0.0.1:3080
```

### 前端环境变量

`Pancake/Client/Tauri-React/Pancake-Tauri-React/.env.development`

```ini
VITE_PORT=1420
VITE_API_BASE=http://localhost:8080
VITE_DSH_PROXY_BASE=http://127.0.0.1:3081
```

### JSON 配置

- `json/Apis.json`：外部 API 地址（天气接口等）
- `json/WeatherCities.json`：天气城市列表
- `json/PCmethods.json`：MMD 工作流默认配置

## PCmethods 配置示例

安装后，可编辑 `data/json/PCmethods.json`：

```json
[
  {
    "name": "MMD工作流",
    "folder": [
      { "name": "MMD", "path": "E:\software\MMD\..." },
      { "name": "Music", "path": "E:\resources\music\..." }
    ]
  }
]
```

修改后刷新前端页面即可生效，无需重启应用。
