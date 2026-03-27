# 音乐播放器 - 启动指南

## 系统要求
- Python 3.11+
- Node.js 16+
- npm 8+

## 1. 后端启动（FastAPI）

### 步骤1：进入后端目录
```bash
cd "D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Server\FastAPI"
```

### 步骤2：创建并激活虚拟环境
```bash
# 创建虚拟环境（如果尚未创建）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 步骤3：安装依赖
```bash
# 升级pip
python -m pip install --upgrade pip

# 安装依赖（跳过Pillow，避免安装问题）
python -m pip install -r requirements-minimal.txt
```

### 步骤4：配置环境变量
```bash
# 复制环境变量文件
copy .env.example .env

# 编辑.env文件，设置音乐库路径
# 默认：MUSIC_LIBRARY_PATH=./music_library
# 你可以修改为你的音乐文件夹路径
```

### 步骤5：启动服务器
```bash
# 使用开发服务器（热重载）
python run.py

# 或直接运行主程序
python main.py
```

### 步骤6：验证后端运行
- API文档：http://localhost:8000/docs
- 首页：http://localhost:8000/

## 2. 前端启动（React）

### 步骤1：进入前端目录
```bash
cd "D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Client\Web\React\Pancake"
```

### 步骤2：安装依赖（如果尚未安装）
```bash
npm install
```

### 步骤3：启动开发服务器
```bash
npm run dev
```

### 步骤4：访问前端
- 音乐播放器首页：http://localhost:5174/music/home
- 歌曲列表：http://localhost:5174/music/songs
- 如果端口5173被占用，会自动使用5174

## 3. 快速启动脚本

### Windows PowerShell 快速启动脚本
保存为 `start-music-player.ps1`：

```powershell
# 启动后端
Write-Host "正在启动后端服务器..." -ForegroundColor Green
cd "D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Server\FastAPI"
& "venv\Scripts\activate"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python run.py"
Start-Sleep -Seconds 5

# 启动前端
Write-Host "正在启动前端服务器..." -ForegroundColor Green
cd "D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Client\Web\React\Pancake"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Start-Sleep -Seconds 5

# 打开浏览器
Write-Host "正在打开浏览器..." -ForegroundColor Green
Start-Process "http://localhost:5174/music/home"
Start-Process "http://localhost:8000/docs"
```

### 简化的启动命令
```bash
# 启动后端（在新终端中）
cd "D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Server\FastAPI" && venv\Scripts\activate && python run.py

# 启动前端（在新终端中）
cd "D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Client\Web\React\Pancake" && npm run dev
```

## 4. 首次使用配置

### 1. 创建音乐库目录
```bash
cd "D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Server\FastAPI"
mkdir music_library
```

### 2. 放入音乐文件
将你的MP3、FLAC等音频文件放入 `music_library` 目录

### 3. 扫描音乐库
- 方法1：通过API文档扫描
  访问 http://localhost:8000/docs
  找到 `/api/v1/library/scan`，点击 "Try it out" → "Execute"

- 方法2：使用curl命令
  ```bash
  curl -X POST http://localhost:8000/api/v1/library/scan
  ```

- 方法3：在前端界面点击"扫描音乐库"按钮

### 4. 查看扫描状态
```bash
curl http://localhost:8000/api/v1/library/scan/status
```

## 5. 常见问题解决

### 问题1：端口被占用
**后端**：修改 `.env` 文件中的 `PORT` 设置
**前端**：Vite会自动尝试其他端口，或手动修改 `vite.config.ts`

### 问题2：依赖安装失败
**后端**：尝试跳过有问题的包（如Pillow）
```bash
python -m pip install fastapi uvicorn sqlalchemy pydantic mutagen aiofiles
```

**前端**：清理并重新安装
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 问题3：数据库错误
删除数据库文件重新创建：
```bash
cd "D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Server\FastAPI"
rm music_player.db
python main.py
```

### 问题4：CORS错误
后端已配置CORS允许前端访问，如果仍有问题检查：
1. 后端 `main.py` 中的CORS配置
2. 前端API地址是否正确

## 6. 项目结构说明

```
YCrispyBiscuit-Pancake/
├── Server/FastAPI/          # 后端API服务
│   ├── app/                 # 应用代码
│   ├── music_library/       # 音乐文件目录（需手动创建）
│   ├── .env                 # 环境变量（需手动创建）
│   ├── requirements.txt     # 完整依赖
│   ├── requirements-minimal.txt # 最小依赖
│   ├── main.py             # 主程序
│   └── run.py              # 开发服务器
└── Client/Web/React/Pancake/ # 前端应用
    ├── src/components/player/ # 播放器组件
    ├── src/views/music/     # 音乐页面
    ├── src/stores/          # 状态管理
    ├── src/services/        # API服务
    └── package.json         # 前端依赖
```

## 7. 测试命令

### 测试后端API
```bash
# 测试API端点
curl http://localhost:8000/

# 测试歌曲API
curl http://localhost:8000/api/v1/songs?limit=5

# 测试库统计
curl http://localhost:8000/api/v1/library/stats
```

### 测试前端连接
```bash
# 检查前端是否运行
curl -I http://localhost:5174/

# 检查API连接
curl -I http://localhost:8000/api/v1/songs
```

## 8. 开发模式

### 后端开发
```bash
# 启用热重载
python run.py

# 查看日志
# 控制台会显示请求日志和错误信息
```

### 前端开发
```bash
# 启用热重载
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 9. 生产部署

### 后端生产部署
```bash
# 安装生产依赖（无开发依赖）
python -m pip install fastapi uvicorn sqlalchemy pydantic mutagen aiofiles

# 使用生产服务器
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 前端生产部署
```bash
# 构建静态文件
npm run build

# 构建结果在 dist/ 目录
# 可以使用Nginx/Apache部署
```

---

**启动成功标志**：
1. 后端：访问 http://localhost:8000/docs 能看到API文档
2. 前端：访问 http://localhost:5174/music/home 能看到音乐播放器界面
3. 功能：能扫描音乐库并播放歌曲