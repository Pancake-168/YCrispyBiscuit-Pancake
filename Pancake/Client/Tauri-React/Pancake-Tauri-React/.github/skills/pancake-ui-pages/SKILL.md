---
name: pancake-ui-pages
description: '在 Pancake React 前端（Tauri-React）新建页面/组件或修改 UI 时使用。涵盖：设计 Token 体系（variables.css）、全局样式类、17 个通用组件复用、Radix UI、主题适配（深色/亮色）、路由注册、isTauri/logger 环境适配。DO NOT USE FOR: 非 Pancake 前端的通用前端问题、后端/服务端样式问题。'
---

# Pancake UI 页面规范

## When to Use

- 在 `src/views` 下新建页面
- 新建或修改 `src/components/common/` 下的通用组件
- 修改任何页面/组件 UI 样式
- 新增视觉 Token、调整主题

## 前置参考（必读）

写任何新页面之前，先看以下文件：

1. `src/views/DemoPage.tsx` — 全部 17 个通用组件的完整用法示例，是写新页面最重要的参考
2. `docs/基础组件规范.md` — 每个组件的 props 接口和样式要求
3. `references/ui-rules.md` — 三层 UI 体系细节（Token 完整列表、全局类、模糊值层次、主题机制）

## 新建页面流程

### 1. 外层容器

- 新页面**不需要自己写外层布局容器**。`MainPage` 已提供 `.app-content` 作为滚动区，非首页自动渲染 `RouterBar` 导航栏，页面组件直接写自己的内容即可。

### 2. 样式规则（最重要）

- 颜色/圆角/阴影**绝不写死**，只能引用 `var(--xxx)`，例如 `var(--text)`、`var(--accent)`、`var(--radius-md)`。
- 组件样式写在 `*.module.css`，只写布局/定位/动画；颜色必须引用 Token。
- 页面级样式也写在对应 `*.module.css`，不走全局 CSS。
- 需要新的视觉属性时，**先在 `variables.css` 的 `:root` 与 `:root[data-theme='light']` 中分别定义**，命名遵循语义（如 `--section-bg`），不描述实现（禁止 `--blue-500` 这类名字）。

### 3. 组件复用

- 先查 `src/components/common/index.ts` 是否已有可用组件，17 个通用组件（Button、Input、Textarea、Select、Switch、Tooltip、Popover、DropdownMenu、ContextMenu、Dialog、Confirm、Toast、Tabs、ScrollArea、EmptyState、Skeleton、IconContainer）直接复用，不手写。
- 简单场景直接用全局样式类 `.glass`、`.btn.*`、`.pill.*`、`.icon-btn`，不需要额外 CSS。
- 新通用组件放 `src/components/common/` 并从 `index.ts` 统一导出；页面私有组件放页面目录内。

### 4. 技术栈约束

- **无 CSS 框架、无 Tailwind**，样式全靠项目自身 Token + module.css。
- 交互组件用 **Radix UI 原生部件**（`@radix-ui/react-*`）做骨架，不手写弹窗/下拉/开关逻辑。
- 图标用 `react-icons`（vsc/md/si 系列），不引入其他图标库。
- 路由用 `react-router-dom` 的 `HashRouter`（Tauri 桌面端需要 hash 路由）。

### 5. 环境适配

- 桌面端专用功能用 `isTauri()` 守卫（从 `@/utils/isTauri` 导入）。
- 日志用 `createLogger(fileName, functionName)` 创建，返回 `{ debug, info, warn, error }`；Tauri 桌面端自动通过 IPC 写 Rust 日志文件，浏览器环境仅控制台。**禁止裸 `console.log`**。
- 静态资源路径用 `import.meta.env.BASE_URL` 拼接，不写死 `/`。

### 6. 代码风格

- 组件用 PascalCase，CSS 类名用 camelCase。
- 类型定义不滥用 `any`，项目 TS 配置 `strict: true`。
- 遵循项目 prettier 配置：单引号、分号、尾逗号、100 字符换行。

### 7. 路由注册

- 在 `src/router/index.tsx` 添加 `<Route>`；Tauri 专用页面用 `isTauri()` 条件渲染包裹。
- 新页面若需在首页半圆轮播中作为工具入口展示，在 `src/composables/FunctionList.ts` 的 `Pancake_Tools` 数组中添加对应 `CarouselItem`。

### 8. 主题适配

- 页面首次访问（无 localStorage）默认亮色；CSS 层 `:root` 定义暗色变量集作为 fallback，亮色通过 `:root[data-theme='light']` 叠加覆盖。
- 需在亮/暗两种 `data-theme` 状态下测试页面效果。
- 如需固定暗色（如 HomePage），进入时 `setAttribute('data-theme', 'dark')`，离开时在 `useEffect` cleanup 中恢复用户原主题。

## 硬性禁止（提交前检查清单）

- [ ] 无写死颜色/圆角/阴影值（`#fff`、`rgba(0,0,0,0.1)` 等）
- [ ] 组件样式在 `*.module.css`，颜色全部引用 `var(--xxx)`
- [ ] 优先复用通用组件/全局类而非手写
- [ ] 不使用裸 `console.log`，统一 `createLogger`
- [ ] 无 `any` 滥用（`strict: true`）
- [ ] 静态资源用 `import.meta.env.BASE_URL` 拼接
