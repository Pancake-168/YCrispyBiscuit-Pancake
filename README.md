# Pancake

个人桌面工具箱 — 图片转码、音频转码、MMD 工作流一键启动。

基于 Tauri 2 + React 19 + FastAPI 构建，Windows 桌面应用。

## 功能

| 模块 | 说明 |
|---|---|
| **图片转码** | 格式互转、质量调节、缩放裁切、色彩模式选择、批量处理 |
| **音频转码** | 基于 ffmpeg，支持 MP3/FLAC/WAV/OGG/OPUS 互转 |
| **松饼工作流** | MMD 工作流相关文件夹一键打开（Tauri 本地独占） |
| **账号系统** | JWT 注册/登录，7 天有效期 |

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面壳 | Tauri 2 (Rust) |
| 前端 | React 19 + TypeScript + Vite 7 |
| UI | Radix UI + CSS Modules + react-icons |
| 路由 | react-router-dom v7 |
| 后端 | FastAPI (Python) + Uvicorn |
| 数据库 | SQLAlchemy + aiosqlite |
| 认证 | PyJWT + bcrypt |
| 实时通信 | Socket.IO |
| 图片处理 | Pillow + pillow-heif + cairosvg + numpy |
| 后端打包 | PyInstaller → 嵌入 Tauri 为 sidecar |

## 项目结构

```
Pancake/
├── Client/Tauri-React/Pancake-Tauri-React/   # 前端
│   ├── src/
│   │   ├── components/common/    # 17 个基础 UI 组件
│   │   ├── views/Pages/          # 页面
│   │   ├── services/             # API 调用层
│   │   ├── composables/          # 工具列表配置
│   │   ├── router/               # 路由
│   │   └── stores/               # Zustand 状态
│   └── src-tauri/                # Rust 壳 + sidecar 管理
├── Server/FastAPI/                # 后端
│   ├── app/
│   │   ├── controllers/          # API 端点
│   │   ├── services/             # 业务逻辑
│   │   ├── core/                 # 配置 / 日志 / 生命周期
│   │   ├── exceptions/           # 统一异常处理
│   │   └── utils/                # 工具函数
│   ├── json/                     # 配置文件（Apis / 工作流）
│   └── ffmpeg/                   # ffmpeg 二进制（本地下载）
└── Pancake/Server/FastAPI2/      # 图片转码新版开发目录
```

## 快速开始

### 环境要求

- Node.js >= 18
- Python 3.12
- Rust 工具链（Tauri 构建需要）

### 后端

```bash
cd Pancake/Server/FastAPI

# 安装 Python 依赖 + 下载 ffmpeg
npm run setup
npm run download:ffmpeg

# 启动后端（开发模式）
npm run dev         
```

### 前端

```bash
cd Pancake/Client/Tauri-React/Pancake-Tauri-React

npm install

# 纯前端开发（需要后端已启动）
npm run dev       

# Tauri 桌面开发
npm run dev:tauri

# 生产构建
npm run build:tauri
```

## API 文档

后端启动后访问 http://127.0.0.1:8080/docs 查看 Swagger 文档。

### 主要接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录（返回 JWT） |
| GET | `/api/picture/formats` | 图片格式列表 |
| POST | `/api/picture/convert` | 批量图片转换 |
| GET | `/api/pcmethods/getmmd` | MMD 工作流路径 |
| POST | `/api/pcmethods/openmmd` | 打开全部 MMD 文件夹 |
| POST | `/api/pcmethods/openmmd/{name}` | 打开指定 MMD 文件夹 |

## PCmethods 配置

安装后，`data/json/PCmethods.json` 可手动编辑，修改文件夹路径。首次启动时从内置默认配置自动复制。

```json
[
  {
    "name": "MMD工作流",
    "folder": [
      { "name": "MMD", "path": "E:\\software\\MMD\\..." },
      { "name": "Music", "path": "E:\\resources\\music\\..." }
    ]
  }
]
```

修改后刷新前端页面即可生效，无需重启应用。
