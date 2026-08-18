# 关于高质量音视频的处理

> MMD 动画（Blender Eevee NPR）从渲染到 B 站 4K60 交付的完整方案。
> 核心结论：**渲染省时间（1080p30），AI 补时间（60fps、4K）**。

## 文件说明

| 文件 | 用途 |
|---|---|
| `高画质重制全流程手册.md` | 主手册（必读）：两条路线（外部素材修复 / MMD 渲染）+ 完整流程 + 参数 + FAQ |
| `mmd_60fps_converter.py` | Blender 脚本：MMD 动作关键帧 ×2 缩放 + fps 60（**路线 A：原生 60fps 渲染**用；当前主流程走 30fps + AI 补帧，暂不需要） |
| `blender_inspect.py` | Blender 脚本：读取当前工程的渲染配置（引擎/分辨率/采样/输出等） |
| `blender_apply_settings.py` | Blender 脚本：一键应用手册推荐的渲染配置（EXR/透明/GTAO/阴影/60fps） |
| `blender_tsr_check.py` | 排查脚本：确认 Blender 版本是否有 TSR（4.5 已移除） |
| `blender_bloom_check.py` | 排查脚本：确认 Blender 版本是否有 Bloom（4.5 已移除） |
| `bili_query.ps1` | B 站 API 查询脚本（WBI 签名）：查 UP 主投稿列表 / 视频详情 / 流参数 |

## 主流程（MMD 路线，最终版）

```
Blender Eevee NPR：1080p 100% / 30fps / 采样 64~128 / GTAO / 阴影 scale 2.0 / 运动模糊 0.1~0.3
  → EXR RGBA 透明序列（mmd_tools 默认 30fps 导入，无需处理关键帧）
  → AE 32bit + ACES 合成（色彩匹配 + 特效）→ 输出【不透明】1080p30 成品
  → SVFI 补帧 30→60（开场景切换检测）
  → Topaz Video AI 超分 1080p60→4K60（Iris/Artemis 2x，锐化 0.3~0.5）
  → ffmpeg 封装 HEVC 10bit CRF 16~18
```

## Blender 脚本用法

```powershell
# 读取工程渲染配置（无副作用）
& "D:\software\blender\4.5.2\blender.exe" --background "工程.blend" --python "blender_inspect.py"

# 应用推荐渲染配置（会保存工程，先备份）
& "D:\software\blender\4.5.2\blender.exe" --background "工程.blend" --python "blender_apply_settings.py"

# MMD 动作转 60fps（在 Blender 里选中骨架+相机后运行）
# 在 Scripting 工作区打开 mmd_60fps_converter.py 运行
```

## ⚠️ 安全警告（上传前必读）

1. **`.bili_session.txt` 绝不能提交到仓库**——内含 B 站登录凭证（SESSDATA），等于账号钥匙。
   - 已在 `bili_query.ps1` 中支持读取脚本同目录的 `.bili_session.txt`（本地自用）
   - 请在仓库根 `.gitignore` 中添加：
     ```gitignore
     **/.bili_session.txt
     ```
2. 如果此前曾在聊天/网页里贴过 SESSDATA，建议到 B 站"退出所有设备"让旧凭证失效。

## 手册中的关键查证来源

- B 站 API 实测流参数（某不知名字幕组的 4K120 HDR 视频）
- mmd_tools 源码（VMD 导入强制 30fps 的 `update_scene_settings`）
- Blender 4.5 本机实测（TSR/Bloom 已移除，AO 改名 GTAO）
- Topaz 官方论坛 / SVFI Steam 商店页（AI 工具不支持透明通道）
- DSRE 官方 GitHub README（伪 Hi-Res 原理与参数）
