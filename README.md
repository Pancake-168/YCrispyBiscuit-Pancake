# Pancake

桌面工具箱应用，基于 **Tauri v2 + Vue 3**（前端）+ **FastAPI**（后端）。

```
Pancake/
├── Client/
│   └── Tauri-Vue/Pancake-Tauri-Vue/    # Tauri 桌面端
└── Server/
    └── FastAPI/                         # FastAPI 后端
```

---

## 环境准备

### 后端

```bash
cd Server/FastAPI
npm run setup        # 创建 venv + 安装 Python 依赖（含 PyInstaller）
```

### 前端

```bash
cd Client/Tauri-Vue/Pancake-Tauri-Vue
npm install          # 安装前端依赖
```

Tauri 还需要 Rust 工具链：去 [rustup.rs](https://rustup.rs) 下载安装，Windows 上需要 Visual Studio Build Tools（C++ 编译工具）。

---

## 开发

### 纯前端（浏览器）

```bash
cd Client/Tauri-Vue/Pancake-Tauri-Vue
npm run dev          # 仅启动 Vite → http://localhost:1420
```

### 纯后端

```bash
cd Server/FastAPI
npm run dev          # ENV_FILE=.env.development → http://localhost:8080
npm run prod         # ENV_FILE=.env.production → http://localhost:3000
```

### 桌面端（Tauri + 后端自动启动）

```bash
cd Client/Tauri-Vue/Pancake-Tauri-Vue
npm run dev:tauri    # 启动 Vite + Rust 编译 + 自动 spawn 后端
```

Tauri 窗口关闭时后端进程自动被杀。

---

## 打包

### 第一步：打后端 exe

```bash
cd Server/FastAPI
npm run build:exe
```

产物：`dist/pancake-backend-x86_64-pc-windows-msvc.exe`
同时自动拷贝到 Tauri 的 `src-tauri/binaries/`。

### 第二步：打桌面安装器

```bash
cd Client/Tauri-Vue/Pancake-Tauri-Vue
npm run build:tauri
```

产物：`src-tauri/target/release/bundle/nsis/Pancake_0.1.0_x64-setup.exe`

---

## 模式切换（dev / prod）

### 后端

| 场景 | .env 文件 | 控制方式 |
|------|-----------|---------|
| `npm run dev` | `.env.development` | `package.json` 里的 `dev` 脚本设了 `ENV_FILE` |
| `npm run prod` | `.env.production` | `package.json` 里的 `prod` 脚本设了 `ENV_FILE` |
| `build:exe` 打包后 | `.env.production` | `app/core/config.py` 里 `frozen` 时强制 prod |
| 手动覆盖 | 任意 | 设环境变量 `ENV_FILE=你的.env` |

想临时切换模式：直接互换 `.env.development` 和 `.env.production` 的内容，不碰代码。

### 前端

Vite 根据 `--mode` 自动选对应的 `.env` 文件。`tauri dev` 走 development，`tauri build` 走 production。

---

## 配置指南

### ⚠️ 改前端端口 / 窗口标题 / 后端连接地址

**都在这两个文件里，改一处全局生效**：

| 文件 | 包含字段 |
|------|---------|
| `Client/.../Pancake-Tauri-Vue/.env.development` | `VITE_PORT` `VITE_APP_NAME` `VITE_API_BASE` |
| `Client/.../Pancake-Tauri-Vue/.env.production` | 同上 |

`dotenv-cli` 在 `tauri dev/build` 前把 `.env` 注入环境变量，Vite 的 `loadEnv()` 和 Tauri 的 `{{ env.VAR }}` 都从这里读。**不需要 `src-tauri/.env`，不需要同步多处。**

### ⚠️ 改后端端口

2 个文件，独立于前端：

| 文件 | 字段 |
|------|------|
| `Server/FastAPI/.env.development` | `PORT` `DATABASE_URL` `JWT_SECRET_KEY` |
| `Server/FastAPI/.env.production` | 同上 |

### ⚠️ 改窗口大小

1 个文件：

| 文件 | 字段 |
|------|------|
| `src-tauri/tauri.conf.json` | `app.windows[0].width` / `height` |

### ⚠️ 改应用名 / 安装器文件名

1 个文件：

| 文件 | 字段 | 影响 |
|------|------|------|
| `src-tauri/tauri.conf.json` | `productName` | 安装器文件名（`Pancake_0.1.0_x64-setup.exe`）、窗口默认标题 |

### ⚠️ 改版本号

1 个文件：

| 文件 | 字段 | 影响 |
|------|------|------|
| `src-tauri/tauri.conf.json` | `version` | 安装器文件名中的版本号 |

### ⚠️ 改数据库 / JWT 密钥

1 个文件（两个环境各改各的）：

| 文件 | 字段 |
|------|------|
| `Server/FastAPI/.env.development` | `DATABASE_URL`、`JWT_SECRET_KEY` |
| `Server/FastAPI/.env.production` | 同上 |

### ⚠️ 新增 Python 依赖后打包

2 个文件：

| # | 文件 | 操作 |
|---|------|------|
| 1 | `Server/FastAPI/requirements.txt` | 加包名 |
| 2 | `Server/FastAPI/package.json` 的 `build:exe` | 如果静态分析漏了，加 `--hidden-import=包名` |

然后重跑 `npm run setup && npm run build:exe`。

### ⚠️ 改后端入口或打包行为

1 个文件：`Server/FastAPI/package.json` 的 `build:exe` 脚本。PyInstaller 参数全在这里。

### 不需要改的文件

- `Server/FastAPI/app/core/config.py` — 环境加载逻辑已做死，源码→`.env.development`，exe→`.env.production`
- `src-tauri/src/lib.rs` — 后端启动用 `cfg!(debug_assertions)` 自动判断 dev/release
- `src-tauri/tauri.conf.json` 的 `bundle.externalBin` — 除非 sidecar 二进制改名

---

## 新增 Python 依赖

1. 把包名加到 `Server/FastAPI/requirements.txt`
2. 重跑 `npm run setup`
3. 如果静态分析检测不到（动态导入的包），在 `package.json` 的 `build:exe` 里加 `--hidden-import=包名`

---

## 常用命令汇总

```bash
# 后端
cd Server/FastAPI
npm run setup         # 首次安装 / 重建 venv
npm run dev           # 开发启动
npm run prod          # 生产启动
npm run build:exe     # 打包为单文件 exe + 拷贝到 Tauri
npm run lint          # Ruff 检查
npm run format        # Ruff 格式化
npm run clean         # 删除 venv + dist

# 前端
cd Client/Tauri-Vue/Pancake-Tauri-Vue
npm run dev           # 纯前端开发
npm run build         # 纯前端打包
npm run dev:tauri     # 桌面端开发（含后端自动启动）
npm run build:tauri   # 桌面端打包为安装器
npm run preview       # 预览前端打包结果
```

---

## 相关文档

- [Tauri v2 文档](https://v2.tauri.app/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [PyInstaller 文档](https://pyinstaller.org/)
