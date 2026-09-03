# UI规则与新建页面注意事项

---

## 提问：该项目UI规则是什么样的？如何定制的？

该项目的 UI 规则体系分为三层：**设计 Token 层 → 全局样式类层 → 组件层**。每一层有严格的约束。

### 第一层：设计 Token（`src/styles/variables.css`）

所有视觉属性通过 CSS 自定义属性定义，组件**禁止写死颜色值、圆角、阴影**。

#### 暗色 Token（`:root` 默认）

`:root` 中共 52 个 CSS 自定义属性，以下为完整列表：

```css
/* 背景 */
--bg: #0b0d11;
--bg-elev: #11141a;
--glass: rgba(255,255,255,0.05);
--glass-brd: rgba(255,255,255,0.08);

/* 文字 */
--text: #e6e9ef;
--muted: #9aa3b2;

/* 强调色（琥珀金） */
  --accent: #fbbf24;
  --accent-2: #fcd34d;
--accent-rgb: 251, 191, 36;

/* 功能域色 */
--color-system: #82aaff;
--color-job: #c792ea;
--color-agent: #ffcb6b;
--color-tool: #89ddff;
--color-success: #2fcb5b;
--color-warn: #ff9a69;
--color-error: #f07178;
--color-error-rgb: 240, 113, 120;

/* 边框 */
--border: rgba(255,255,255,0.08);

/* 阴影 */
--shadow-sm: 0 2px 8px rgba(0,0,0,0.2);
--shadow-md: 0 6px 20px rgba(0,0,0,0.3);
--shadow-lg: 0 12px 32px rgba(0,0,0,0.4);

/* 间距 */
--spacing-xs(4px) → --spacing-2xl(24px) 六级

/* 圆角 */
--radius-sm(6px) → --radius-full(9999px) 五级

/* 字号 */
--text-xs(11px) / --text-sm(12px) / --text-base(13px) / --text-md(14px) 四级

/* 布局 */
--titlebar-height: 32px;
--sidebar-width: 48px;
--nav-height: 36px;

/* 过渡 */
--transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;

/* 输入控件 */
--input-bg: rgba(255,255,255,0.04);
--switch-track-bg: rgba(255,255,255,0.12);

/* 字体 */
--font-sans: system-ui, ...;
--font-heading: '优设标题黑', ...;
--font-mono: 'SFMono-Regular', ...;
```

#### 亮色主题（`:root[data-theme='light']` 覆盖）

亮色主题覆盖了几乎所有颜色/阴影/边框 Token（共 23 个），核心变化：

```css
:root[data-theme='light'] {
  --bg: #f7f8fa;
  --bg-elev: #ffffff;
  --glass: #ffffff;
  --glass-brd: rgba(0,0,0,0.14);

  --text: #10151c;
  --muted: #5b6472;

  --accent: #fbbf24;
  --accent-2: #fcd34d;
  --accent-rgb: 217, 119, 6;

  --color-system/job/agent/tool/success/warn/error 均作了对应调整;
  --color-error-rgb: 217, 79, 86;
  --border: rgba(0,0,0,0.12);
  --dialog-overlay-bg: rgba(15,23,42,0.18);

  --shadow-sm/md/lg 减弱（透明度和偏移降低）;

  --input-bg: rgba(0,0,0,0.04);
  --switch-track-bg: rgba(0,0,0,0.12);
}
```

#### 固定深色的 Token（仅在 `:root`，亮色不覆盖）

| Token              | 值                       | 用途                     |
| ------------------ | ------------------------ | ------------------------ |
| `--tooltip-bg`     | `rgba(32,32,32,0.92)`    | Tooltip 背景（永远深色） |
| `--tooltip-text`   | `rgba(255,255,255,0.93)` | Tooltip 文字             |
| `--tooltip-border` | `rgba(255,255,255,0.12)` | Tooltip 边框             |
| `--blur-overlay`   | `4px`                    | Dialog 遮罩层模糊        |
| `--blur-panel`     | `10px`                   | 面板/卡片模糊            |
| `--blur-tooltip`   | `12px`                   | Tooltip 模糊             |

#### 自定义字体

`index.css` 中通过 `@font-face` 声明了"优设标题黑"字体（woff2 + ttf），对应 `--font-heading` Token。**仅加载这一个自定义字体，禁止引入其他字体文件。**

```css
@font-face {
  font-family: '优设标题黑';
  src:
    url('/fonts/优设标题黑.woff2') format('woff2'),
    url('/fonts/优设标题黑.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

### 第二层：全局样式类（`src/styles/index.css`）

无需写组件的场景直接用类名，**不写 inline style**。

#### 布局框架

所有页面的外层容器，由 `MainPage` 提供：

| 类名           | 作用                                               |
| -------------- | -------------------------------------------------- |
| `.app-layout`  | 根容器（`flex column, height: 100vh`）             |
| `.main-page`   | 主区域（`flex: 1, flex column, overflow: hidden`） |
| `.app-content` | 内容滚动区（`flex: 1, overflow: auto`）            |
| `.app-nav`     | 顶部导航栏（32px 高，底部边框分隔）                |

新页面组件渲染在 `.app-content` 内部，不需要自己写外层容器。

#### 按钮系统

```html
<!-- 四种变体 -->
<button class="btn primary">主按钮</button>
<button class="btn secondary">次要按钮</button>
<button class="btn subtle">低调按钮</button>
<button class="btn danger">危险按钮</button>
<!-- 加载态 -->
<button class="btn primary spinning">提交中</button>
```

行为规则：

- hover：`translateY(-1px)` + 颜色/背景/边框变化；禁止外阴影、外发光
- active：回弹 `translateY(0)`
- disabled：`opacity: 0.5` + 禁止点击

#### 其他全局类

| 类名                                           | 用途                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `.glass`                                       | 毛玻璃面板（`var(--glass)` 背景 + `blur(var(--blur-panel))` + 细边框） |
| `.icon-btn`                                    | 图标按钮（透明底色 + hover 高亮）                                      |
| `.pill.success` / `.error` / `.warn` / `.info` | 状态标签                                                               |

### 第三层：组件规范

项目共有 **44 个通用组件**，统一从 `src/components/common/index.ts` 导出：

**基础组件（§1-§17）**

1. Button
2. IconContainer
3. Input
4. Textarea
5. Select
6. Switch
7. Tooltip
8. Popover
9. DropdownMenu
10. ContextMenu
11. Dialog
12. Confirm
13. Toast
14. Tabs
15. ScrollArea
16. EmptyState
17. Skeleton

**Radix 封装组件（§18-§32）**

18. Accordion
19. AlertDialog
20. AspectRatio
21. Checkbox
22. Collapsible
23. HoverCard
24. Label
25. Menubar
26. NavigationMenu
27. Progress
28. RadioGroup
29. Separator
30. Slider
31. Toggle
32. VisuallyHidden
    **扩展控件（§33-§44）**

33. Drawer
34. SegmentedControl
35. Rating
36. Breadcrumb
37. Combobox
38. CommandPalette
39. Stepper
40. Toolbar
41. Calendar
42. DatePicker
43. TreeSelect
44. Cascader
    详细规范见 [基础组件规范.md](基础组件规范.md)，完整用法示例见 [DemoPage.tsx](../src/views/DemoPage.tsx)。

#### 硬性约束

1. **组件 CSS 写在 `*.module.css`**，只能处理**布局/定位/动画**，颜色/圆角/阴影**必须引用 `var(--xxx)`**
2. **绝对禁止写死颜色值**（如 `#fff`、`rgba(0,0,0,0.1)`）
3. 需要新 Token 时**先在 `variables.css` 定义**，语法遵循项目命名规则（语义命名，不描述实现）
4. 复杂交互组件用 **Radix UI 原生部件**做骨架，样式用自己的 CSS
5. 新组件放 `src/components/common/`，统一从 `index.ts` 导出

#### 永久 UI 规则（必须遵守）

1. **禁原生组件**：凡是能用 common 封装或 Radix 原语替代的原生控件，禁止直接写 `<button>`、`<label>`、`<input>`、`<select>`、`<textarea>`。只有 `Button`、`Input`、`Textarea` 这类底层控件封装本身才允许保留对应的原生标签。
2. **border + 外发光禁止并存**：当元素已有 `border` 时，禁止再叠加外发光、泛光、模糊外边框、外 `box-shadow`。需要层次时靠 `border` + 背景 + 间距表达；`box-shadow` 只允许内阴影（`inset`）。
3. **弹窗/浮层必须主题适配**：light 下不允许像 dark 一样昏暗。弹窗、浮层、面板在 light/dark 下必须有明确可辨的区分度与对比度。

#### 模糊值使用层次

| 场景                                                | Token            | 值   |
| --------------------------------------------------- | ---------------- | ---- |
| Dialog 遮罩层                                       | `--blur-overlay` | 4px  |
| `.glass`、Popover、DropdownMenu、Select 面板、Toast | `--blur-panel`   | 10px |
| Tooltip                                             | `--blur-tooltip` | 12px |

#### 按钮 hover 规则

- 统一 `translateY(-1px)` + 颜色/背景/边框变化
- 禁止外阴影、外发光
- **不缩放**（不用 `scale`）

### 主题切换机制

`src/stores/theme.store.ts` — Zustand store：

1. 初始化从 `localStorage` 读 `pancake-theme` key
2. 调用 `document.documentElement.setAttribute('data-theme', theme)` 切换 CSS 变量
3. **首次访问（无 localStorage）默认 `light`**。CSS 层 `:root` 定义的是暗色变量集作为 fallback（清除 `data-theme` 属性时使用），亮色通过 `:root[data-theme='light']` 选择器叠加覆盖。

```ts
function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'light'; // 首次访问默认亮色
}

toggleTheme: () =>
  set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('pancake-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  });
```

首页特殊处理：进入时强制切暗色（`setAttribute('data-theme', 'dark')`），离开时在 `useEffect` cleanup 中恢复用户原主题。

### 总结

UI 定制链路是：

```
variables.css（定义 Token）
    ↓ 引用
index.css（全局类 .glass / .btn.* / .pill.* / 布局框架）
    ↓ 引用
*.module.css（组件布局/动画，引用 var(--xxx)）
    ↓ 组合
组件（Radix 骨架 + module.css + 全局类）
```

核心原则：**视觉属性集中在 Token 层，组件永远通过 `var(--xxx)` 间接引用，不写死任何颜色/圆角/阴影值。**

---

## 提问：如果现在让你写一个全新的页面，你该注意什么？

基于项目实际代码，写新页面需注意以下事项：

### 一、外层容器和参考文件

1. 新建页面**不需要自己写外层布局容器**。`MainPage` 已经提供 `.app-content` 作为滚动区，非首页还自动渲染 `RouterBar` 导航栏。页面组件直接写自己的内容即可。
2. **先看两个关键参考文件**：
   - [DemoPage.tsx](../src/views/DemoPage.tsx) — 所有 44 个通用组件的完整用法示例，是写新页面最重要的参考
   - [基础组件规范.md](基础组件规范.md) — 每个组件的 props 接口和样式要求

### 二、样式规则（最重要）

3. **颜色/圆角/阴影绝不写死**。只能引用 `var(--xxx)`，例如 `var(--text)`、`var(--accent)`、`var(--radius-md)`。
4. **组件样式写在 `*.module.css`**，只写布局/定位/动画。颜色引用 Token。
5. **页面级样式写在对应 `*.module.css`**，不走全局 CSS。
6. 需要新的视觉属性时，**先在 `variables.css` 的 `:root` 和 `:root[data-theme='light']` 中分别定义**，命名遵循语义（如 `--section-bg`），不描述实现（不用 `--blue-500` 这类名字）。

### 三、组件复用

7. 先查 `src/components/common/index.ts` 是否已有可用组件。目前已有 44 个 common 组件，直接复用，不要重复造轮子。
8. 全局样式类 `.glass`、`.btn.*`、`.pill.*`、`.icon-btn` 在简单场景直接使用，不需要额外 CSS。
9. 新通用组件放 `src/components/common/`，从 `index.ts` 统一导出。页面私有组件放页面目录内。

### 四、技术栈约束

10. **无 CSS 框架、无 Tailwind**。样式全靠项目自身的 Token + module.css。
11. 交互组件用 **Radix UI 原生部件**（`@radix-ui/react-*`）做骨架，不手写弹窗/下拉/开关逻辑。
12. 图标用 `react-icons`（vsc/md/si 系列），不引入其他图标库。
13. 路由用 `react-router-dom` 的 `HashRouter`（Tauri 桌面端需要 hash 路由）。

### 五、环境适配

14. 桌面端专用功能用 `isTauri()` 守卫（从 `@/utils/isTauri` 导入）。
15. 日志用 `createLogger(fileName, functionName)` 创建，返回 `{ debug, info, warn, error }` 四个方法。Tauri 桌面端会自动通过 IPC（`invoke('write_log')`）将日志写到 Rust 后端日志文件，浏览器环境仅控制台输出。禁止使用裸 `console.log`。
16. 静态资源路径用 `import.meta.env.BASE_URL` 拼接，不写死 `/`。

### 六、代码风格

17. 组件用 **PascalCase**，CSS 类名用 **camelCase**。
18. 类型定义不滥用 `any`，项目 TS 配置 `strict: true`。
19. 遵循项目 prettier 配置：单引号、分号、尾逗号、100 字符换行。

### 七、路由注册

20. 在 `src/router/index.tsx` 添加 `<Route>`。如果是 Tauri 专用页面，用 `isTauri()` 条件渲染包裹。
21. 如果新页面需要在首页半圆轮播中作为工具入口展示，在 `src/composables/FunctionList.ts` 的 `Pancake_Tools` 数组中添加对应的 `CarouselItem`。

### 八、主题适配

22. 页面**首次访问（无 localStorage）默认亮色**；CSS 层 `:root` 定义了暗色变量集作为 fallback。开发时需要在亮/暗两种 `data-theme` 状态下测试页面效果。
23. 如需固定暗色（像 HomePage 那样），进入时设置 `data-theme="dark"`，离开时在 `useEffect` cleanup 中恢复。
