# 本地音乐播放器 - 前端

基于React的本地音乐播放器前端，模仿QQ音乐桌面端UI，支持本地音乐库管理和播放。

## 功能特性

- ✅ **仿QQ音乐UI**: 现代化设计，响应式布局
- ✅ **音乐播放**: 播放控制、进度条、音量控制
- ✅ **音乐库浏览**: 歌曲、专辑、艺术家列表
- ✅ **播放列表**: 创建、管理播放列表
- ✅ **搜索功能**: 全局搜索歌曲、专辑、艺术家
- ✅ **快捷键支持**: 空格播放/暂停、Ctrl+左右箭头切换歌曲
- ✅ **状态管理**: 使用Zustand管理播放状态
- ✅ **音频流**: 集成后端音频流服务

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand
- **路由**: React Router v7
- **UI组件**: 自定义CSS组件
- **HTTP客户端**: Fetch API
- **音频播放**: HTML5 Audio API

## 项目结构

```
src/
├── components/player/          # 播放器组件
│   ├── MusicPlayerLayout.tsx  # 主布局
│   ├── Sidebar.tsx            # 侧边导航
│   └── PlayerControls.tsx     # 播放控制栏
├── views/music/               # 音乐相关页面
│   ├── MusicHomeView.tsx      # 音乐首页
│   └── SongsView.tsx          # 歌曲列表
├── stores/                    # 状态管理
│   ├── player.store.ts        # 播放器状态
│   └── app.store.ts           # 应用状态
├── services/                  # API服务
│   └── music.api.ts           # 音乐API客户端
├── styles/                    # 样式文件
│   └── music-player.css       # 播放器样式
└── router/                    # 路由配置
    └── index.tsx              # 路由定义
```

## 快速开始

### 1. 安装依赖

```bash
# 进入前端项目目录
cd D:\res\Projects\YCrispyBiscuit-Pancake\Pancake\Client\Web\React\Pancake

# 安装依赖
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:5173/music

### 3. 配置后端API

确保后端服务器正在运行（默认 http://localhost:8000）。

如果需要更改API地址，修改 `src/services/music.api.ts` 中的 `API_BASE_URL`：

```typescript
const API_BASE_URL = "http://localhost:8000/api/v1";
```

## 主要组件

### MusicPlayerLayout

主布局组件，包含：

- 侧边导航栏
- 顶部搜索栏
- 主内容区
- 底部播放控制栏
- 键盘快捷键支持

### PlayerControls

播放控制组件，包含：

- 播放/暂停按钮
- 上一首/下一首
- 进度条
- 音量控制
- 播放模式切换（顺序/循环/随机）

### Sidebar

侧边导航栏，包含：

- 发现（首页、发现）
- 我的音乐（歌曲、专辑、艺术家、播放列表）
- 播放列表快捷列表
- 用户信息

## 状态管理

### Player Store (`player.store.ts`)

管理播放器状态，包括：

- 当前播放的歌曲
- 播放列表
- 播放状态（播放/暂停）
- 播放模式（顺序/循环/随机）
- 音量设置
- 播放进度

### 使用示例

```typescript
import { usePlayerStore } from '@/stores/player.store'

function MyComponent() {
  const {
    currentSong,
    playbackState,
    play,
    pause,
    playNext
  } = usePlayerStore()

  return (
    <button onClick={() => play(song)}>播放</button>
  )
}
```

## API服务

### Music API (`music.api.ts`)

封装所有后端API调用，包括：

- 歌曲管理
- 专辑管理
- 艺术家管理
- 播放列表管理
- 音乐库管理
- 音频播放工具

### 使用示例

```typescript
import { songApi } from "@/services/music.api";

// 获取歌曲列表
const songs = await songApi.getSongs({ limit: 10 });

// 播放歌曲
const audioUrl = songApi.streamSong(songId);
const audio = new Audio(audioUrl);
audio.play();
```

## 路由配置

音乐播放器路由配置在 `src/router/index.tsx`：

```typescript
{
  path: '/music',
  element: <MusicPlayerLayout />,
  children: [
    { path: 'home', element: <MusicHomeView /> },
    { path: 'songs', element: <SongsView /> },
    // 更多路由...
  ],
}
```

访问地址：

- 音乐首页: http://localhost:5173/music/home
- 歌曲列表: http://localhost:5173/music/songs

## 键盘快捷键

- **空格键**: 播放/暂停
- **Ctrl + 右箭头**: 下一首
- **Ctrl + 左箭头**: 上一首
- **Ctrl + M**: 静音/取消静音
- **Ctrl + L**: 显示/隐藏歌词

## 样式设计

使用CSS变量实现主题系统：

```css
:root {
  --player-height: 80px;
  --sidebar-width: 240px;
  --color-accent: #007aff;
  --color-bg-surface: #ffffff;
  /* ...更多变量 */
}
```

响应式设计：

- 桌面端: 完整布局
- 平板端: 简化侧边栏
- 移动端: 垂直布局

## 开发指南

### 添加新页面

1. 在 `src/views/music/` 中创建新组件
2. 在 `src/router/index.tsx` 中添加路由
3. 在 `src/components/player/Sidebar.tsx` 中添加导航项

### 添加新API

1. 在 `src/services/music.api.ts` 中添加API方法
2. 在相关组件中调用API

### 修改样式

1. 编辑 `src/styles/music-player.css`
2. 使用CSS变量保持一致性

## 与后端集成

### 1. 启动后端服务器

```bash
cd ../../../Server/FastAPI
python run.py
```

### 2. 扫描音乐库

首次使用需要扫描音乐库：

1. 在 `music_library` 目录中放入MP3文件
2. 通过前端界面点击"扫描音乐库"
3. 或直接调用API: `POST /api/v1/library/scan`

### 3. 播放音乐

1. 在前端浏览歌曲列表
2. 点击歌曲播放
3. 或创建播放列表批量播放

## 已知问题

### 1. CORS问题

确保后端已启用CORS，允许前端域名：

```python
# 在FastAPI后端配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    # ...
)
```

### 2. 音频格式支持

确保浏览器支持音频格式：

- MP3: 广泛支持
- FLAC: 现代浏览器支持
- WAV: 广泛支持
- M4A: 部分浏览器需要解码器

### 3. 大文件处理

对于大音乐库：

- 使用分页加载
- 实现虚拟滚动
- 缓存已加载数据

## 性能优化

1. **代码分割**: 使用React.lazy按需加载
2. **图片懒加载**: 专辑封面懒加载
3. **API缓存**: 缓存API响应
4. **音频预加载**: 预加载下一首歌曲
5. **虚拟滚动**: 长列表使用虚拟滚动

## 浏览器兼容性

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

## 未来功能

- [ ] 歌词同步显示
- [ ] 音效均衡器
- [ ] 智能播放列表
- [ ] 在线音乐源集成
- [ ] 多主题切换
- [ ] 下载管理
- [ ] 播放统计

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
