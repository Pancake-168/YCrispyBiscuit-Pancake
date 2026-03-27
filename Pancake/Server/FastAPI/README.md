# 本地音乐播放器 - 后端

一个基于FastAPI的自托管音乐播放器后端，支持本地音乐库管理、音频流播放和播放列表功能。

## 功能特性

- ✅ **音乐库扫描**: 自动扫描本地音乐文件夹，支持MP3、FLAC、WAV、M4A等格式
- ✅ **元数据提取**: 使用mutagen库读取ID3标签（歌名、歌手、专辑、封面等）
- ✅ **音频流媒体**: 支持HTTP Range请求，实现音频流式播放和进度跳转
- ✅ **数据库管理**: SQLite数据库存储歌曲、专辑、艺术家和播放列表信息
- ✅ **RESTful API**: 完整的CRUD API接口
- ✅ **播放列表**: 创建、编辑、删除播放列表，支持智能播放列表
- ✅ **搜索功能**: 支持歌曲、专辑、艺术家搜索
- ✅ **库统计**: 显示音乐库的统计信息

## 技术栈

- **后端框架**: FastAPI + Python 3.11+
- **数据库**: SQLite + SQLAlchemy 2.0
- **ORM**: SQLAlchemy + Alembic（数据库迁移）
- **音频处理**: mutagen（元数据提取）
- **异步文件处理**: aiofiles
- **数据验证**: Pydantic 2.0
- **API文档**: 自动生成的OpenAPI文档（Swagger UI）

## 快速开始

### 1. 安装依赖

```bash
# 进入后端目录
cd D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Server\FastAPI

# 创建虚拟环境（可选但推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置环境

```bash
# 复制环境变量文件
copy .env.example .env
```

编辑 `.env` 文件，配置以下选项：
```ini
# 数据库配置
DATABASE_URL=sqlite:///./music_player.db

# 服务器配置
HOST=0.0.0.0
PORT=8000

# 音乐库路径（相对路径或绝对路径）
MUSIC_LIBRARY_PATH=./music_library
ALBUM_ART_CACHE=./cache/album_arts
```

### 3. 初始化数据库

```bash
# 运行主程序，会自动创建数据库表
python main.py
```

或使用开发服务器：
```bash
python run.py
```

### 4. 访问API文档

启动服务器后，访问以下地址：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **API根路径**: http://localhost:8000/

## API端点

### 歌曲管理
- `GET /api/v1/songs` - 获取歌曲列表（支持分页和过滤）
- `GET /api/v1/songs/{id}` - 获取单个歌曲详情
- `GET /api/v1/songs/{id}/stream` - 流式播放歌曲
- `GET /api/v1/songs/{id}/lyrics` - 获取歌词

### 专辑管理
- `GET /api/v1/albums` - 获取专辑列表
- `GET /api/v1/albums/{id}` - 获取专辑详情（含歌曲）
- `GET /api/v1/albums/{id}/songs` - 获取专辑歌曲

### 艺术家管理
- `GET /api/v1/artists` - 获取艺术家列表
- `GET /api/v1/artists/{id}` - 获取艺术家详情（含专辑和歌曲）
- `GET /api/v1/artists/{id}/songs` - 获取艺术家的歌曲
- `GET /api/v1/artists/{id}/albums` - 获取艺术家的专辑

### 播放列表管理
- `GET /api/v1/playlists` - 获取播放列表
- `GET /api/v1/playlists/{id}` - 获取播放列表详情（含歌曲）
- `POST /api/v1/playlists` - 创建播放列表
- `PUT /api/v1/playlists/{id}` - 更新播放列表
- `DELETE /api/v1/playlists/{id}` - 删除播放列表
- `POST /api/v1/playlists/{id}/songs` - 添加歌曲到播放列表
- `DELETE /api/v1/playlists/{id}/songs/{song_id}` - 从播放列表移除歌曲

### 音乐库管理
- `POST /api/v1/library/scan` - 扫描音乐库（后台任务）
- `GET /api/v1/library/scan/status` - 获取扫描状态
- `GET /api/v1/library/stats` - 获取库统计信息
- `POST /api/v1/library/rescan` - 重新扫描音乐库

## 数据库架构

```sql
-- 核心表结构
songs           # 歌曲表
├── id
├── title
├── file_path
├── duration
├── artist_id (FK)
├── album_id (FK)
└── ...

albums          # 专辑表
├── id
├── title
├── artist_id (FK)
└── ...

artists         # 艺术家表
├── id
├── name
└── ...

playlists       # 播放列表表
├── id
├── name
└── ...

playlist_songs  # 播放列表-歌曲关联表
├── playlist_id (FK)
├── song_id (FK)
└── position
```

## 文件结构

```
FastAPI/
├── app/
│   ├── api/v1/endpoints/     # API端点
│   │   ├── songs.py
│   │   ├── albums.py
│   │   ├── artists.py
│   │   ├── playlists.py
│   │   └── library.py
│   ├── models/               # 数据库模型
│   │   ├── song.py
│   │   ├── album.py
│   │   ├── artist.py
│   │   ├── playlist.py
│   │   └── playlist_song.py
│   ├── schemas/              # Pydantic数据模型
│   ├── services/             # 业务逻辑
│   │   ├── song_service.py
│   │   ├── album_service.py
│   │   ├── artist_service.py
│   │   ├── playlist_service.py
│   │   └── library_service.py
│   ├── core/                 # 核心配置
│   │   └── config.py
│   └── db/                   # 数据库配置
│       ├── session.py
│       └── base.py
├── tests/                    # 测试文件
├── migrations/               # 数据库迁移（待添加）
├── music_library/            # 音乐库目录（存放MP3等文件）
├── cache/album_arts/         # 专辑封面缓存
├── requirements.txt          # Python依赖
├── .env.example              # 环境变量示例
├── main.py                   # FastAPI应用入口
└── run.py                    # 开发服务器启动脚本
```

## 使用示例

### 1. 扫描音乐库

```bash
# 在音乐库目录中放入一些MP3文件
mkdir music_library
# 复制一些MP3文件到music_library目录

# 通过API扫描音乐库
curl -X POST http://localhost:8000/api/v1/library/scan

# 查看扫描状态
curl http://localhost:8000/api/v1/library/scan/status

# 查看库统计
curl http://localhost:8000/api/v1/library/stats
```

### 2. 获取歌曲列表

```bash
# 获取前10首歌曲
curl http://localhost:8000/api/v1/songs?limit=10

# 搜索歌曲
curl http://localhost:8000/api/v1/songs?title=love
```

### 3. 流式播放歌曲

```html
<!-- 在前端HTML中 -->
<audio controls>
  <source src="http://localhost:8000/api/v1/songs/1/stream" type="audio/mpeg">
</audio>
```

## 开发指南

### 添加新功能

1. 在 `app/models/` 中添加新的数据库模型
2. 在 `app/schemas/` 中添加Pydantic模型
3. 在 `app/services/` 中添加业务逻辑
4. 在 `app/api/v1/endpoints/` 中添加API端点
5. 在 `app/api/v1/api.py` 中注册路由

### 运行测试

```bash
# 待添加测试
```

### 数据库迁移

```bash
# 初始化Alembic（待配置）
alembic init migrations

# 创建迁移
alembic revision --autogenerate -m "Add new table"

# 应用迁移
alembic upgrade head
```

## 常见问题

### 1. 扫描音乐库失败

**问题**: 无法读取某些音频文件
**解决**: 确保文件格式受支持（MP3、FLAC、WAV、M4A、OGG、AAC），检查文件权限

### 2. 数据库连接错误

**问题**: SQLite数据库文件无法创建
**解决**: 确保运行用户有写入权限，检查路径是否正确

### 3. 音频流播放失败

**问题**: 前端无法播放音频
**解决**: 检查CORS配置，确保音频文件路径正确，检查文件权限

### 4. 内存占用过高

**问题**: 扫描大量文件时内存占用高
**解决**: 调整扫描批次大小，增加延迟

## 性能优化建议

1. **数据库索引**: 为常用查询字段添加索引
2. **文件缓存**: 缓存专辑封面和音频元数据
3. **分页查询**: 所有列表API都支持分页
4. **后台任务**: 耗时操作（如扫描）使用后台任务
5. **连接池**: 使用数据库连接池提高并发性能

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 前端项目

前端React项目位于：`../Client/Web/React/Pancake/`

启动前端：
```bash
cd ../Client/Web/React/Pancake/
npm install
npm run dev
```

访问前端：http://localhost:5173/music