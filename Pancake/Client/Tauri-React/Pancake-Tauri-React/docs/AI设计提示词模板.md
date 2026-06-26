# AI 设计提示词模板

## 项目环境
- React 19 + TypeScript + Vite 7 + Tauri 2
- 图标库：react-icons (md 系列)
- 无头交互库：@radix-ui/react-*
- 无 CSS 框架，无 Tailwind

## 样式系统
- 设计 Token 在 `src/styles/variables.css`，CSS 变量命名：
  - 背景：`--bg`、`--bg-elev`、`--glass`、`--glass-brd`
  - 文字：`--text`、`--muted`
  - 强调：`--accent`、`--accent-2`、`--accent-rgb`
  - 功能色：`--color-system`、`--color-job`、`--color-agent`、`--color-tool`、`--color-success`、`--color-warn`、`--color-error`
  - 间距：`--spacing-xs`(4px)、`--spacing-sm`(6px)、`--spacing-md`(8px)、`--spacing-lg`(12px)、`--spacing-xl`(16px)、`--spacing-2xl`(24px)
  - 圆角：`--radius-sm`(6px)、`--radius-md`(8px)、`--radius-lg`(10px)、`--radius-xl`(12px)、`--radius-full`(9999px)
  - 阴影：`--shadow-sm`、`--shadow-md`、`--shadow-lg`
  - 字体：
    - `--font-sans`：系统字体栈（零加载），用于正文/UI
    - `--font-heading`：`"优设标题黑"` + fallback 系统字体栈，**仅用于标题**
    - `--font-mono`：等宽字体栈，用于代码
  - 仅加载一个自定义字体（优设标题黑 woff2），禁止引入其他字体文件
  - 字号：`--text-xs`(11px)、`--text-sm`(12px)、`--text-base`(13px)、`--text-md`(14px)
- 全局样式类在 `src/styles/index.css`：
  - `.glass` — 毛玻璃面板（半透明背景 + `backdrop-filter: blur(10px)` + 细边框 + 圆角）
  - `.btn.primary` — 渐变主按钮（accent 底色 + 高光边缘 + hover 抬升）
  - `.btn.secondary` — 点缀色边框按钮（半透明 accent + 边框 + hover 抬升）
  - `.btn.subtle` — 透明低存在感按钮（hover 才显背景）
  - `.btn.danger` — 危险操作按钮（红色半透明 + hover 增强）
  - `.btn.spinning` — 加载中旋转状态
  - `.icon-btn` — 图标按钮（透明底色 + hover 高亮）
  - `.pill.success / .pill.error / .pill.warn / .pill.info` — 四种状态标签
- 组件自己的样式写在 `*.module.css`，**只能处理布局/定位/动画**，颜色和圆角必须引用 `var(--xxx)`，**绝对禁止写死颜色值**

## 组件规范
- 有交互的复杂组件用 **Radix UI 原生部件**做骨架（Dialog、DropdownMenu、Tooltip、Switch、Select、Popover 等），样式用自己的 CSS
- 简单展示组件直接用全局样式类（`.glass`、`.btn.*`、`.pill.*` 等），不需要额外 CSS 文件
- 新组件放在 `src/components/common/`，统一从 `index.ts` 导出
- 组件用 PascalCase，CSS 类用 camelCase

## 视觉风格
- **暗色优先**（`:root` 是暗色，亮色通过 `data-theme="light"` 覆盖）
- **毛玻璃面板**：半透明背景 + `backdrop-filter: blur(10px)` + `1px solid var(--glass-brd)`
- **圆角偏克制**：默认 6px，面板 10px，大面板 12px，不滥用大圆角
- **按钮 hover**：`translateY(-1px)` + 增强阴影，不缩放
- **文字层级**：通过字重（600/700）和大小写（uppercase + letter-spacing）建立，不靠多种字体
- 组件模板参考：`src/components/common/PancakeDialog.tsx` 及其 `*.module.css`

## 任务

<!-- 这里写具体要做的页面/组件 -->
