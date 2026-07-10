# 图片转换 API 分析文档

> 分析日期：2026-07-10
>
> **数据来源说明：**
> - 前端源码部分：API 端点、TypeScript 类型定义、UI 交互逻辑、参数发送条件、边界行为 —— 全部来自四个前端源文件的分析
> - 后端数据部分：具体的格式名列表、MIME 类型、`format_details` 各布尔字段值 —— 来自用户提供的后端数据字典（`EXT_TO_FORMAT`、`FORMAT_TO_EXT`、`EXT_TO_MIME`、`FORMAT_DETAILS`），这些数据在运行时通过 `/api/picture/formats` 返回，前端源码中不存在任何硬编码的格式列表
>
> 分析源文件：
> - `src/services/PictureSwitch.ts` — API 调用与类型定义
> - `src/ApiUrls.ts` — API 端点路径
> - `src/views/Pages/PictureSwitchPage/index.tsx` — UI 逻辑与参数交互
> - `src/types/ApiResult.ts` — 返回值包装类型

---

## 1. API 端点总览

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/api/picture/formats` | 获取后端支持的格式列表及每种格式的详细信息 |
| POST | `/api/picture/convert` | 批量转换图片（FormData 提交） |
| GET | `/api/picture/download/single/{taskId}/{index}` | 下载单个转换结果文件 |
| GET | `/api/picture/download/batch/{taskId}` | 批量下载全部转换结果（ZIP 包） |

---

## 2. 允许输入的图片格式

### 2.1 格式来源

前端**不硬编码**输入格式列表。格式列表通过 `GET /api/picture/formats` 的 `input_formats` 字段动态获取（`string[]`，元素为不带点的扩展名，如 `"png"`），前端 `filterSupportedFiles()` 函数依据该列表过滤用户选择的文件。

### 2.2 输入格式（来自后端数据字典）

`EXT_TO_FORMAT` 共定义 17 个扩展名 → 格式名映射。API 返回的 `input_formats` 即为此表中的扩展名去掉前导点（如 `.png` → `"png"`）。

| API 返回的扩展名 | 对应后端格式名 | 数据来源 |
|-----------------|---------------|----------|
| `png` | PNG | EXT_TO_FORMAT |
| `jpg` | JPEG | EXT_TO_FORMAT |
| `jpeg` | JPEG | EXT_TO_FORMAT |
| `webp` | WebP | EXT_TO_FORMAT |
| `bmp` | BMP | EXT_TO_FORMAT |
| `tiff` | TIFF | EXT_TO_FORMAT |
| `tif` | TIFF | EXT_TO_FORMAT |
| `gif` | GIF | EXT_TO_FORMAT |
| `ico` | ICO | EXT_TO_FORMAT |
| `avif` | AVIF | EXT_TO_FORMAT |
| `heif` | HEIF | EXT_TO_FORMAT（**仅输入**） |
| `heic` | HEIF | EXT_TO_FORMAT（**仅输入**） |
| `svg` | SVG | EXT_TO_FORMAT |
| `ppm` | PPM | EXT_TO_FORMAT |
| `pgm` | PGM | EXT_TO_FORMAT |
| `pbm` | PBM | EXT_TO_FORMAT |
| `tga` | TGA | EXT_TO_FORMAT |

> 前端代码中使用 `input_formats` 的细节：
> - `filterSupportedFiles()`（PictureSwitch.ts:177-178）：提取文件扩展名（不带点）后直接与 `supportedExtensions` 做 `includes` 比对
> - `<input accept>`（index.tsx:104）：手动补点 `.${e}` 拼接，因为 HTML `accept` 属性需要带点格式
> - Tauri 原生对话框 filter（index.tsx:216-218）：`extensions: supportedExtensions`，直接使用不带点形式

### 2.3 输入限制

- **单文件最大 100MB**（`MAX_FILE_SIZE = 100 * 1024 * 1024`，PictureSwitch.ts:164）
- 文件扩展名必须包含在 `input_formats` 中

### 2.4 input_formats 为空时的 fallback 行为

当 API 尚未返回（`supportedExtensions` 为空数组 `[]`）时：

- `<input accept>` 回退为 `image/*`，允许选择任意图片文件（index.tsx:103）
- `filterSupportedFiles()` 中 `supportedExtensions.length > 0` 条件为 `false`，跳过格式检查，不拒绝任何文件（PictureSwitch.ts:177）
- `formatOptions` 为空数组，格式下拉框无选项

---

## 3. 允许输出的图片格式

### 3.1 格式来源

输出格式列表通过 `GET /api/picture/formats` 的 `output_formats` 字段动态获取（`string[]`，元素为小写格式标识如 `"webp"`），前端据此渲染格式选择下拉框。

### 3.2 输出格式（来自后端数据字典）

`FORMAT_TO_EXT` 共定义 13 个格式名。API 返回的 `output_formats` 即为此表的键转为小写（如 `"PNG"` → `"png"`）。

| API 返回的格式标识 | 对应 MIME 类型（来自 EXT_TO_MIME） | 前端源码中的特殊行为 |
|-------------------|----------------------------------|---------------------|
| `png` | `image/png` | — |
| `jpeg` | `image/jpeg` | — |
| `webp` | `image/webp` | 前端 `useState` 默认值（index.tsx:51） |
| `bmp` | `image/bmp` | — |
| `tiff` | `image/tiff` | — |
| `gif` | `image/gif` | — |
| `ico` | `image/vnd.microsoft.icon` | 前端硬编码警告"非方形图片将居中裁切为正方形"（index.tsx:456-462） |
| `avif` | `image/avif` | — |
| `svg` | `image/svg+xml` | — |
| `ppm` | `image/x-portable-pixmap` | — |
| `pgm` | `image/x-portable-graymap` | — |
| `pbm` | `image/x-portable-bitmap` | — |
| `tga` | `image/x-tga` | — |

### 3.3 仅输入、不可输出的格式

`heif` / `heic`（HEIF 格式）在 `EXT_TO_FORMAT` 中存在但 **不在** `FORMAT_TO_EXT` 中，仅可作为输入。

---

## 4. 每种输出格式的附加功能

附加功能由后端 `/api/picture/formats` 返回的 `format_details: Record<string, FormatDetail>` 描述。前端不硬编码任何格式的能力值，仅通过以下接口字段做动态判断：

### 4.1 FormatDetail 接口（前端类型定义，PictureSwitch.ts:16-24）

```typescript
interface FormatDetail {
    extensions: string[];            // 该格式的扩展名列表
    mime_type: string;               // MIME 类型
    supports_transparency: boolean;  // → 控制透明填充色控件显隐
    supports_animation: boolean;     // （前端未使用此字段控制 UI）
    lossy_options: boolean;          // → 控制质量滑块显隐
    quality_range: [number, number] | null;  // → 决定滑块 min/max
    supports_lossless: boolean;      // → 控制无损开关显隐
}
```

### 4.2 前端 UI 显隐逻辑（全部来自源码）

| UI 控件 | 显隐条件（源码位置） | 判定字段 |
|---------|---------------------|----------|
| 质量滑块 | `targetDetail?.lossy_options === true` **且** `!lossless`（index.tsx:84, 476） | `lossy_options` |
| 无损开关 | `targetDetail?.supports_lossless === true`（index.tsx:85, 465） | `supports_lossless` |
| 透明填充色 | `!targetDetail.supports_transparency`（index.tsx:565） | `supports_transparency` |
| 质量滑块范围 | `qualityRange?.[0] ?? 1` 到 `qualityRange?.[1] ?? 100`（index.tsx:483-484） | `quality_range` |

> 注意：`supports_animation` 字段在 `FormatDetail` 接口中定义，但前端 UI 未使用该字段控制任何控件显隐。

### 4.3 各格式详情（来自后端 FORMAT_DETAILS 字典）

以下内容为后端数据字典的翻译，前端在运行时通过 `/api/picture/formats` 获取：

| 格式 | 支持透明<br>(supports_transparency) | 支持动画<br>(supports_animation) | 有损压缩<br>(lossy_options) | 质量范围<br>(quality_range) | 无损模式<br>(supports_lossless) |
|------|:---:|:---:|:---:|:---:|:---:|
| png | ✓ | ✗ | ✗ | — | — |
| jpeg | ✗ | ✗ | ✓ | 1–100 | — |
| webp | ✓ | ✓ | ✓ | 0–100 | ✓ |
| bmp | ✗ | ✗ | ✗ | — | — |
| tiff | ✓ | ✗ | ✗ | — | — |
| gif | ✓ | ✓ | ✗ | — | — |
| ico | ✓ | ✗ | ✗ | — | — |
| avif | ✓ | ✗ | ✓ | 0–100 | — |
| svg | ✓ | ✗ | ✗ | — | — |
| ppm | ✗ | ✗ | ✗ | — | — |
| pgm | ✗ | ✗ | ✗ | — | — |
| pbm | ✗ | ✗ | ✗ | — | — |
| tga | ✓ | ✗ | ✗ | — | — |
| **heif**（仅输入） | ✓ | ✗ | ✓ | 0–100 | — |

> 前端对任意格式使用统一的 `targetDetail?.supports_lossless === true` 判断，不做格式名判断。上表中仅 webp 的 `supports_lossless` 为 `true`（来自后端数据），因此当前仅 webp 会显示无损开关。
>
> heif 虽然在 `FORMAT_DETAILS` 中存在且 `lossy_options` 为 `true`，但其不在 `FORMAT_TO_EXT` 中，无法作为转换目标，因此对应的质量滑块永远不会对它显示。

### 4.4 ICO 特殊处理

目标格式为 `ico` 时，前端硬编码显示警告提示（index.tsx:456-462）：

> "非方形图片将居中裁切为正方形后再转换为 ICO"

此行为是前端 UI 逻辑，与后端 `format_details` 无关。

---

## 5. 转换参数发送逻辑

POST `/api/picture/convert` 的参数通过 `handleConvert`（index.tsx:336-347）构建。参数分为两组：

### 5.1 始终发送的参数

以下参数不依赖任何条件，每次请求都会作为 FormData 字段发送（`undefined` 或 `null` 值除外，由 PictureSwitch.ts:116-118 的 `if (value !== undefined && value !== null)` 过滤）：

| 参数名 | 类型 | state 初始值 | 源码行 |
|--------|------|-------------|--------|
| `target_format` | `string` | `"webp"` | index.tsx:51, 337 |
| `resize_mode` | `"none" \| "fit" \| "fill" \| "exact"` | `"none"` | index.tsx:54, 338 |
| `keep_aspect_ratio` | `boolean` | 由 resizeMode 决定 | index.tsx:339 |
| `background_color` | `string` | `"#FFFFFF"` | index.tsx:59, 344 |
| `color_mode` | `"auto" \| "RGB" \| "RGBA" \| "L" \| "P"` | `"auto"` | index.tsx:60, 345 |
| `strip_metadata` | `boolean` | `true` | index.tsx:61, 346 |

> **UI 显隐 vs 发送分离：** `background_color` 的 UI 控件仅在 `!targetDetail.supports_transparency` 时显示（index.tsx:565），但其值始终发送。

### 5.2 条件发送的参数

以下参数仅在特定条件满足时才作为 FormData 字段发送；条件不满足时该字段**不存在于请求中**（非空值、非默认值）：

| 参数名 | state 初始值 | 发送条件（源码） | 不发送时的行为 |
|--------|-------------|-----------------|---------------|
| `quality` | `85` | `showQuality && !lossless`（index.tsx:340） | 字段不发送，无默认值 |
| `lossless` | `false` | `lossless` 为 `true`（index.tsx:341） | 字段不发送（**不是**发送 `lossless=false`） |
| `max_width` | `1024` | `showFitFields && maxWidth > 0 && maxHeight > 0`（index.tsx:342） | 字段不发送 |
| `max_height` | `1024` | 同上 | 字段不发送 |
| `width` | `1024` | `showExactFields && exactWidth > 0 && exactHeight > 0`（index.tsx:343） | 字段不发送 |
| `height` | `1024` | 同上 | 字段不发送 |

> **state 初始值不等于发送值：** `quality` 的 state 初始值为 `85`，但当 `showQuality && !lossless` 为 `false` 时根本不发送；`lossless` 的 state 初始值为 `false`，但为 `false` 时也不发送。表格中的"初始值"列是 `useState` 的默认值，不要理解为"会以该值发送"。

> **输入为 0 时跳过发送：** 当用户清空尺寸输入框后值变为 `0`（`Number("") || 0`），`maxWidth > 0` / `exactWidth > 0` 等条件为 `false`，对应参数不发送。这与初始默认值（1024）不同——初始时输入框有值，条件满足，参数会发送。

### 5.3 缩放模式选项

| 值 | label（index.tsx:92-96） |
|----|-------------------------|
| `none` | 不缩放 |
| `fit` | 等比适配 |
| `fill` | 等比填充 |
| `exact` | 精确尺寸 |

### 5.4 色彩模式选项

| 值 | label（index.tsx:108-114） |
|----|---------------------------|
| `auto` | 自动 |
| `RGB` | RGB |
| `RGBA` | RGBA（保留透明） |
| `L` | 灰度 |
| `P` | 调色板 |

---

## 6. 请求与响应结构

### 6.1 GET `/api/picture/formats` 响应

```typescript
{
  input_formats: string[];          // 不带点的扩展名，如 ["png", "jpg", "webp"]
  output_formats: string[];         // 小写格式标识，如 ["png", "jpeg", "webp"]
  format_details: Record<string, {  // key 为格式标识（如 "png"），来自 FORMAT_DETAILS
    extensions: string[];
    mime_type: string;
    supports_transparency: boolean;
    supports_animation: boolean;
    lossy_options: boolean;
    quality_range: [number, number] | null;
    supports_lossless: boolean;
  }>;
}
```

### 6.2 POST `/api/picture/convert` 请求

- Content-Type: `multipart/form-data`
- 文件字段名: `files`（可多个）
- 其余参数为表单字段，仅非 `undefined`/`null` 值被 append（PictureSwitch.ts:116-118）
- `quality`、`lossless`、`max_width`/`max_height`、`width`/`height` 有条件发送，详见 Section 5.2

### 6.3 POST `/api/picture/convert` 响应

```typescript
{
  task_id: string;
  total: number;
  results: Array<{
    index: number;
    original_name: string;
    converted_name: string;
    original_format: string;
    target_format: string;
    original_size: number;
    converted_size: number;
    original_resolution: string;
    converted_resolution: string;
    size_ratio: number;
    status: "success" | "error";
    error: string | null;
  }>;
  zip_url: string | null;     // 前端未使用此字段
}
```

> **`zip_url` 未被使用：** 前端批量下载逻辑（index.tsx:300-303）直接调用 `getBatchDownloadUrl(taskId)` 拼接 `/api/picture/download/batch/{taskId}` 路径，不读取响应中的 `zip_url` 字段。`ConvertResponse` 接口虽然定义了该字段（PictureSwitch.ts:97），但仅在类型层面存在。

### 6.4 统一起始类型

```typescript
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; data: null; error: string };
```

---

## 7. 前端格式能力判定逻辑汇总

```
输入文件支持 = input_formats（后端动态提供，string[]，不带点）
  → filterSupportedFiles：扩展名提取（不带点）后直接 includes 比对
  → <input accept>：手动补点 → .${e} 拼接（accept 需要带点格式）
  → Tauri 对话框 filter：extensions: supportedExtensions（不带点，直接透传）
  → input_formats 为空时：accept 回退为 "image/*"，filterSupportedFiles 跳过格式检查

输出格式列表 = output_formats（后端动态提供，string[]，小写格式标识）
  → 渲染格式选择下拉框，默认值 "webp"

目标格式详情 = format_details[targetFormat]（后端动态提供）
  → 控制 UI 控件显隐：
    • quality 滑块       ← lossy_options && !lossless
    • lossless 开关      ← supports_lossless（对任意格式统一判断，不做格式名特判）
    • 透明填充色选择器    ← !supports_transparency（但 background_color 始终发送）
    • 质量滑块范围        ← quality_range ?? [1, 100]
  → ICO 裁切警告：前端硬编码，检测 targetFormat === 'ico'
```
