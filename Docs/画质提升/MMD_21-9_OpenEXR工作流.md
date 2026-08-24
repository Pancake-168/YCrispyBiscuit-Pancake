# MMD 21:9 三渲二 OpenEXR 工作流（质量优先版）

> 适用对象：使用 Blender Eevee 做三渲二/MMD，使用 AE 做后期，最终希望提升画质并上传 B站的用户。
> 质量策略：**质量优先，允许慢。视频平均 5 分钟以内，一周一个也没问题。**
> 核心思路：**用高分辨率超采样渲染 + 10bit SDR + 高码率输出，最大化保留细节，同时耐住 B站压缩。**

---

## 1. 目标规格

### 1.1 21:9 分辨率建议（质量优先）

| 优先级 | 分辨率 | 说明 |
|---|---|---|
| 首选质量方案 | **5120 × 2160** | 21:9 5K 超采样，渲染后缩到 4K，细节和抗锯齿最好 |
| 标准 4K 方案 | **3840 × 1600** | 直接作为 B站 4K 上传，兼顾质量和效率 |
| 性能保底 | 3440 × 1440 | 如果 5K/4K 实在跑不动，再退回这个 |

### 1.2 推荐路线（质量优先）

```text
Blender 渲染 5120×2160 OpenEXR 序列
  → AE 后期
  → 输出 3840×1600 4K 视频
  → 上传 B站 4K
```

如果你不想渲染 5K，可以直接用 3840×1600 渲染，仍然是质量优先的好方案。

> 注意：OpenEXR 序列体积很大。5 分钟、30fps 的视频如果渲染 5120×2160 Half Float，可能占用非常大的硬盘空间。  
> 建议：**先渲染 10~30 秒测试，确认文件体积和渲染时间可以接受后，再决定用 5K 还是 4K。**

### 1.3 帧率策略：MMD 30fps → 最终 60fps

- MMD 动作/相机导入 Blender 后一般会被固定为 **30fps**
- 质量优先推荐：
  1. **Blender 按 30fps 渲染 EXR 序列**，保留 MMD 原始动作节奏
  2. 在 AE 完成调色、锐化等后期后
  3. 最后做 **30fps → 60fps 补帧**
  4. 输出 60fps 视频
- 不建议在 Blender 里强行改成 60fps 渲染，除非你确认导入后的动画曲线在 60fps 下没有异常、不会破坏 MMD 动作

---

## 2. Blender 导出配置

### 2.1 输出属性（Output Properties）

| 项目 | 推荐配置 |
|---|---|
| Resolution X | **5120**（或 3840） |
| Resolution Y | **2160**（或 1600） |
| Resolution % | **100（最终渲染必须 100%，85% 只适合测试/预览）** |
| Pixel Aspect Ratio | 1.0 |
| Frame Rate | **30**（与 MMD 导入后的 Blender 工程一致） |
| 输出目录 | 单独建一个 `EXR` 文件夹，例如 `//render/EXR/` |
| File Format | **OpenEXR**（一种高动态范围图像序列格式） |
| Color | RGBA（红绿蓝 + 透明通道） |
| Color Depth | **Half Float**（半浮点，16bit；推荐，体积可控）；短片段可试 **Float**（浮点，32bit；精度更高但体积巨大） |
| Codec / Compression | **PIZ** 或 **ZIP**（无损压缩算法，优先 PIZ）；**不要用 DWAA/DWAB 85%**（有损压缩，会损失细节，仅当硬盘严重不足时才考虑） |
| MultiLayer | 关（多层 EXR 格式，除非你需要多通道合成） |

> 提示：OpenEXR 保存的是线性数据，不要在 Blender 里直接压成最终视频，避免多次压缩。  
> 质量优先不等于无脑 32bit Float，5 分钟视频用 Float 很容易撑爆硬盘，建议先用 Half Float。  
> 注意：DWAA/DWAB 后面的百分比是“压缩质量”，不是分辨率百分比。质量优先请用 PIZ/ZIP，不要用 DWAB 85%。

### 2.2 Eevee 渲染设置（Render Properties）

| 项目 | 推荐配置 |
|---|---|
| Render Engine | Eevee（Blender 实时渲染引擎） |
| Sampling → Render Samples | **32 ~ 64**（渲染采样，质量优先取 64，先测试） |
| Sampling → Viewport Samples | 4 ~ 8（视口采样，只影响预览） |
| TAA Samples | **16**（TAA 抗锯齿采样，Temporal Anti-Aliasing，时间抗锯齿） |
| Depth of Field | 建议关掉（景深），后期 AE 做 |
| Motion Blur | 按需开启（运动模糊），60fps 项目可开 1/2 shutter（快门角度） |
| Bloom | 按三渲二风格决定（辉光/泛光）；如果开，Threshold 不要过低 |
| Ambient Occlusion | 按需开启（环境光遮蔽），采样不用太高 |
| Screen Space Reflections | 只在你需要反射时开（屏幕空间反射） |
| Shadow Cube Size | **2048 或 4096**（阴影立方体贴图大小） |
| Shadow Cascade Size | **4096**（阴影级联大小） |
| Film → Transparent | 按需（透明背景），一般关 |
| Simplify | 测试渲染时可开启（简化模式），正式渲染关闭 |

### 2.3 颜色管理（Color Management）

| 项目 | 推荐配置 |
|---|---|
| View Transform | **Standard**（视图变换，三渲二常用）或 **AgX**（Blender 的电影感色彩管理方案） |
| Look | None（色调风格） |
| Exposure | 0（曝光） |
| Gamma | 1.0（伽马） |
| Sequencer | sRGB（序列器色彩空间） |

> OpenEXR 输出的是线性颜色，最终颜色校正放到 AE 做。

### 2.4 三渲二/Line Art 建议（线条艺术）

- 如果有 **Line Art / Freestyle 线条**（线条艺术 / 自由风格描边）：
  - 可以先输出一版完整画面
  - 也可以单独输出线条层，方便在 AE 里强化线条
- 线条不要做得太细，否则 B站压缩后会断线
- 推荐在 Blender 里把线条处理得“干净、连贯、稍微粗一点点”

### 2.5 性能与时间策略（质量优先）

- 渲染前关闭其他占显卡的程序
- 测试时用 `Render Region`（渲染区域）只渲染一小块，或用 10~30 秒片段先跑完整流程
- 视频只有 5 分钟以内，一周一个视频可以接受：
  - 先挂机渲染，不影响日常使用
  - 建议用 `Blender 渲染` 时不要同时开大型 3D 软件或游戏
- 如果 5120×2160 太慢：
  - 先用 3840×1600 渲染，画质仍然很好
  - 不要为了追求 5K 把项目拖到无法完成
- Eevee 主要吃 GPU（图形处理器/显卡），确认 Blender 使用独立显卡（NVIDIA RTX 3060/3050 系）
- 硬盘空间要提前留足：
  - 5 分钟 30fps = 9000 帧
  - OpenEXR 序列体积可能达到数百 GB
  - 建议渲染到 SSD（固态硬盘）/大容量机械盘，并保留至少两倍余量

---

## 3. AE 后期配置

### 3.1 项目设置

| 项目 | 推荐配置 |
|---|---|
| Project Settings → Depth（项目设置 → 位深） | **32 bits per channel (float)**（每通道 32 位浮点，质量优先） |
| Working Space（工作色彩空间） | **Rec.709 Gamma 2.4** 或 **sRGB** |
| Comp 分辨率（合成分辨率） | **3840 × 1600**（4K 最终输出） |
| Comp Pixel Aspect（合成像素宽高比） | 1.0 |
| Comp Frame Rate（合成帧率） | **60**（若用 AE Pixel Motion 补帧）；外部 AI 补帧时合成可先用 30 |

> 如果 AE 打开 EXR 后颜色发灰/发暗，说明线性到显示空间的转换没有自动做。可以先在素材上右键 `Interpret Footage → Color Management`（解释素材 → 色彩管理）检查，或先用 16bit/32bit + sRGB 工作空间试跑一段。

### 3.2 导入 OpenEXR 序列

1. 在 AE 中 `File → Import → File...`（文件 → 导入 → 文件）
2. 选择 EXR 文件夹里的第一帧
3. 勾选 `OpenEXR Sequence`（OpenEXR 序列）
4. 导入后检查第一帧和最后一帧是否连续
5. 建议把 EXR 序列放进一个单独的文件夹，方便管理

### 3.3 后期节点/效果顺序

推荐在 AE 里按这个顺序叠加效果：

```text
EXR 序列
  → 调色（Curves / Lumetri）
  → 缩放/裁切到目标分辨率
  → 锐化（Unsharp Mask）
  → 防色带（微噪点）
  → 30fps → 60fps 补帧
  → 输出
```

### 3.4 调色建议

| 效果 | 参数参考 |
|---|---|
| Curves（曲线） | 拉一个轻微 S 形曲线，增加对比度 |
| Lumetri Color（Lumetri 调色） | 微调色温、饱和度，让三渲二颜色更干净 |
| 色带控制 | 加 2% ~ 4% 的 Noise（噪点），勾选 Monochromatic（单色噪点）更好 |
| Unsharp Mask（USM 锐化） | Amount（数量）20~50，Radius（半径）0.5~1.0，Threshold（阈值）0 |

> 不要锐化过度，否则线条边缘会出现白边/黑边。

### 3.5 防 B站压缩技巧

- 最终输出前加一点 **细微噪点**，能有效防止大面积渐变出现色带
- 画面里不要出现极细的高反差线条
- 避免纯色大色块直接硬切，容易让编码器产生色块
- 高光不要过曝太多，B站压缩后容易变成“死白”

### 3.6 30fps → 60fps 补帧

#### 方案 A：AE 内置补帧（免费、简单）

1. 将 AE 合成帧率设为 **60fps**
2. 放入 30fps 的 EXR 序列
3. 图层上开启：
   ```text
   Layer → Frame Blending → Pixel Motion
   （图层 → 帧混合 → 像素运动/光流补帧）
   ```
4. 预览快速动作，重点检查：
   - 手指/裙摆/头发
   - 镜头快速移动
   - 是否有扭曲、果冻感

如果效果可以，直接输出 60fps。

#### 方案 B：AI 补帧（质量更好，推荐）

1. 在 AE 完成调色、锐化、降噪后
2. 先导出一版 **30fps 无损中间片**
   - 例如 ProRes 4444（苹果高保真视频编码格式）、PNG 序列、或高码率 OpenEXR
3. 使用：
   - **Flowframes + RIFE**（Flowframes 补帧工具 + RIFE 插帧算法）
   - **Topaz Video AI**（Topaz 视频 AI 增强软件）
   - **Twixtor**（一款补帧/变速插件）
4. 补到 60fps
5. 再回到 AE 合成音频、最终输出

> 注意：AI 补帧如果遇到快速运动，可能出现鬼影/扭曲。  
> 如果 30fps 原生画面已经很满意，也可以不强行 60fps，B站 30fps 一样能看。

---

## 4. 导出配置

### 4.1 首选：B站 4K 上传（质量优先）

```text
格式：HEVC / H.265（高效视频编码）
分辨率：3840 × 1600
码率：40 ~ 60 Mbps（兆比特每秒）
帧率：60（由 30fps 补帧后输出）
色彩空间：Rec.709（高清电视标准色彩空间）
像素格式：YUV 4:2:0（色度抽样格式）
色彩深度：10bit
音频：AAC 320kbps（高级音频编码，千比特每秒）
```

### 4.2 备选：B站 1080p 高码率

```text
格式：H.264（高级视频编码）
分辨率：2560 × 1080
码率：20 ~ 30 Mbps（兆比特每秒）
帧率：30 / 60
色彩空间：Rec.709（高清电视标准色彩空间）
像素格式：YUV 4:2:0（色度抽样格式）
色彩深度：8bit 或 10bit
音频：AAC 320kbps（高级音频编码，千比特每秒）
```

### 4.3 不建议

- 不建议为了“看起来高级”强行上杜比视界（Dolby Vision）/ HDR（高动态范围）
- MMD 三渲二更适合 SDR（标准动态范围）Rec.709
- 杜比视界需要额外权限、设备和完整 HDR 链路，普通 MMD 大概率会翻车

---

## 5. 完整流程总结

```text
Blender
  ├─ 分辨率 5120×2160 或 3840×1600
  ├─ 帧率 30fps（与 MMD 导入一致）
  ├─ Eevee 三渲二
  ├─ OpenEXR Half Float / PIZ
  └─ 输出 30fps EXR 序列

AE
  ├─ 32bit 项目
  ├─ 导入 30fps EXR 序列
  ├─ 调色
  ├─ 缩放至 3840×1600
  ├─ 锐化
  ├─ 加 2~4% 噪点
  ├─ 30fps → 60fps 补帧（AE Pixel Motion 或 RIFE/Topaz）
  └─ 导出 HEVC 10bit 60fps

上传 B站
  └─ 4K 60fps：HEVC 10bit 40~60 Mbps
```

---

## 6. 检查清单

- [ ] Blender 输出的是 OpenEXR 序列，不是 MP4
- [ ] EXR 序列在 AE 中连续导入
- [ ] AE 工程分辨率是 21:9 的 3840×1600
- [ ] 调色后没有明显色带
- [ ] 锐化没有产生白边
- [ ] 加了 2%~4% 微噪点
- [ ] 最终导出是 HEVC 10bit，码率足够
- [ ] 输出帧率为 60fps（如补帧失败可接受 30fps）
- [ ] 30fps → 60fps 补帧没有明显鬼影/扭曲
- [ ] 没有强行开 HDR/杜比视界
- [ ] 渲染前先用 10~30 秒小片段测试
- [ ] 硬盘剩余空间足够存放 EXR 序列

---

## 附录：英文名词速查表

| 英文 | 中文/说明 |
|---|---|
| OpenEXR | 一种高动态范围图像序列格式 |
| EXR Sequence | EXR 序列，逐帧保存的图像序列 |
| Half Float | 半浮点，16bit 浮点数据 |
| Float | 浮点，32bit 浮点数据 |
| PIZ / ZIP | OpenEXR 的无损压缩算法；PIZ 压缩率更高，ZIP 速度更快、兼容性更好 |
| DWAA / DWAB | OpenEXR 的有损压缩算法，百分比越低损失越大；质量优先不要用 |
| MultiLayer | 多层 EXR，可在一个文件里保存多个通道 |
| Eevee | Blender 的实时渲染引擎 |
| Render Samples | 渲染采样，决定画质/速度 |
| Viewport Samples | 视口采样，只影响预览 |
| TAA | Temporal Anti-Aliasing，时间抗锯齿 |
| Depth of Field | 景深 |
| Motion Blur | 运动模糊 |
| Bloom | 辉光/泛光 |
| Ambient Occlusion | 环境光遮蔽 |
| Screen Space Reflections | 屏幕空间反射 |
| Shadow Cube Size | 阴影立方体贴图大小 |
| Shadow Cascade Size | 阴影级联大小 |
| Simplify | 简化模式，用于加快预览/测试 |
| Line Art / Freestyle | 线条艺术 / 自由风格描边 |
| Render Region | 渲染区域，只渲染画面的一部分 |
| GPU | 图形处理器/显卡 |
| SSD | 固态硬盘 |
| View Transform | 视图变换，控制画面显示风格 |
| Look | 色调风格 |
| Exposure | 曝光 |
| Gamma | 伽马 |
| Sequencer | 序列器 |
| AgX | Blender 的电影感色彩管理方案 |
| Rec.709 | 高清电视标准色彩空间 |
| sRGB | 通用显示色彩空间 |
| Project Settings | 项目设置 |
| Working Space | 工作色彩空间 |
| Comp | Composition，合成 |
| Pixel Aspect | 像素宽高比 |
| Frame Blending | 帧混合 |
| Pixel Motion | 像素运动/光流补帧 |
| Interpret Footage | 解释素材 |
| Curves | 曲线调色 |
| Lumetri Color | AE 自带调色工具 |
| Noise | 噪点 |
| Monochromatic | 单色噪点 |
| Unsharp Mask | USM 锐化 |
| Amount / Radius / Threshold | 数量 / 半径 / 阈值 |
| ProRes 4444 | 苹果高保真视频编码格式 |
| Flowframes | 一款 AI 补帧工具 |
| RIFE | 一种 AI 插帧算法 |
| Topaz Video AI | Topaz 视频 AI 增强软件 |
| Twixtor | 补帧/变速插件 |
| HEVC / H.265 | 高效视频编码 |
| H.264 | 高级视频编码 |
| Mbps / kbps | 兆比特每秒 / 千比特每秒 |
| YUV 4:2:0 | 色度抽样格式 |
| AAC | 高级音频编码 |
| HDR | 高动态范围 |
| SDR | 标准动态范围 |
| Dolby Vision | 杜比视界，一种动态 HDR 格式 |
