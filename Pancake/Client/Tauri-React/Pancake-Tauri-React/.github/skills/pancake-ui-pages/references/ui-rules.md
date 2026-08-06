# Pancake UI 三层规则体系（细节参考）

UI 规则体系分为三层：**设计 Token 层 → 全局样式类层 → 组件层**，每一层有严格约束。

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

## 第一层：设计 Token（`src/styles/variables.css`）

所有视觉属性通过 CSS 自定义属性定义，组件**禁止写死颜色值、圆角、阴影**。

### 暗色 Token（`:root` 默认，共 52 个）

```css
/* 背景 */
--bg: #0b0d11;
--bg-elev: #11141a;
--glass: rgba(255,255,255,0.05);
--glass-brd: rgba(255,255,255,0.08);

/* 文字 */
--text: #e6e9ef;
--muted: #9aa3b2;

/* 强调色 */
--accent: #e2b04a;
--accent-2: #f0c060;
--accent-rgb: 226, 176, 74;

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

/* 间距 --spacing-xs(4px) → --spacing-2xl(24px) 六级 */
/* 圆角 --radius-sm(6px) → --radius-full(9999px) 五级 */
/* 字号 --text-xs(11px) / --text-sm(12px) / --text-base(13px) / --text-md(14px) 四级 */

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

### 亮色主题（`:root[data-theme='light']` 覆盖，共 23 个）

亮色覆盖几乎所有颜色/阴影/边框 Token，核心变化：

```css
:root[data-theme='light'] {
  --bg: #ffffff;
  --bg-elev: #ffffff;
  --glass: rgba(0,0,0,0.02);
  --glass-brd: rgba(0,0,0,0.08);

  --text: #0c1117;
  --muted: #5a6678;

  --accent: #c78c2e;
  --accent-2: #d4a040;
  --accent-rgb: 199, 140, 46;

  /* --color-system/job/agent/tool/success/warn/error 均作对应调整 */
  --color-error-rgb: 217, 79, 86;
  --border: rgba(0,0,0,0.08);

  /* --shadow-sm/md/lg 减弱（透明度和偏移降低） */

  --input-bg: rgba(0,0,0,0.04);
  --switch-track-bg: rgba(0,0,0,0.12);
}
```

### 不跟随主题的 Token（仅在 `:root`，亮色不覆盖）

| Token                 | 值                       | 用途                     |
| --------------------- | ------------------------ | ------------------------ |
| `--dialog-overlay-bg` | `rgba(0,0,0,0.45)`       | Dialog 遮罩层            |
| `--tooltip-bg`        | `rgba(32,32,32,0.92)`    | Tooltip 背景（永远深色） |
| `--tooltip-text`      | `rgba(255,255,255,0.93)` | Tooltip 文字             |
| `--tooltip-border`    | `rgba(255,255,255,0.12)` | Tooltip 边框             |
| `--blur-overlay`      | `4px`                    | Dialog 遮罩层模糊        |
| `--blur-panel`        | `10px`                   | 面板/卡片模糊            |
| `--blur-tooltip`      | `12px`                   | Tooltip 模糊             |

### 自定义字体

`index.css` 中通过 `@font-face` 声明「优设标题黑」字体（woff2 + ttf），对应 `--font-heading` Token。**仅加载这一个自定义字体，禁止引入其他字体文件。**

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

---

## 第二层：全局样式类（`src/styles/index.css`）

无需写组件的场景直接用类名，**不写 inline style**。

### 布局框架

所有页面的外层容器由 `MainPage` 提供：

| 类名           | 作用                                               |
| -------------- | -------------------------------------------------- |
| `.app-layout`  | 根容器（`flex column, height: 100vh`）             |
| `.main-page`   | 主区域（`flex: 1, flex column, overflow: hidden`） |
| `.app-content` | 内容滚动区（`flex: 1, overflow: auto`）            |
| `.app-nav`     | 顶部导航栏（32px 高，底部边框分隔）                |

新页面组件渲染在 `.app-content` 内部，不需要自己写外层容器。

### 按钮系统

```html
<button class="btn primary">主按钮</button>
<button class="btn secondary">次要按钮</button>
<button class="btn subtle">低调按钮</button>
<button class="btn danger">危险按钮</button>
<button class="btn primary spinning">提交中</button>
```

行为规则：

- hover：`translateY(-1px)` + 增强阴影（**不缩放**，不用 `scale`）
- active：回弹 `translateY(0)`
- disabled：`opacity: 0.5` + 禁止点击

### 其他全局类

| 类名                                           | 用途                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `.glass`                                       | 毛玻璃面板（`var(--glass)` 背景 + `blur(var(--blur-panel))` + 细边框） |
| `.icon-btn`                                    | 图标按钮（透明底色 + hover 高亮）                                      |
| `.pill.success` / `.error` / `.warn` / `.info` | 状态标签                                                               |

---

## 第三层：组件规范

项目共有 **17 个通用组件**，统一从 `src/components/common/index.ts` 导出：

| #   | 组件          | 用途                          | #   | 组件        | 用途                |
| --- | ------------- | ----------------------------- | --- | ----------- | ------------------- |
| §1  | Button        | 按钮（loading/disabled 封装） | §10 | ContextMenu | 右键菜单            |
| §2  | IconContainer | 统一图片/图标容器             | §11 | Dialog      | 通用弹窗            |
| §3  | Input         | 单行文本输入                  | §12 | Confirm     | Dialog 子集确认弹窗 |
| §4  | Textarea      | 多行文本输入                  | §13 | Toast       | 全局通知通道        |
| §5  | Select        | 下拉选择器                    | §14 | Tabs        | 标签页切换          |
| §6  | Switch        | 开关                          | §15 | ScrollArea  | 统一样式滚动区域    |
| §7  | Tooltip       | 悬停提示                      | §16 | EmptyState  | 空状态占位          |
| §8  | Popover       | 弹出卡片                      | §17 | Skeleton    | 骨架屏              |
| §9  | DropdownMenu  | 下拉菜单                      |     |             |                     |

详细规范见 `docs/基础组件规范.md`，完整用法示例见 `src/views/DemoPage.tsx`。

### 硬性约束

1. **组件 CSS 写在 `*.module.css`**，只能处理布局/定位/动画，颜色/圆角/阴影**必须引用 `var(--xxx)`**
2. **绝对禁止写死颜色值**（如 `#fff`、`rgba(0,0,0,0.1)`）
3. 需要新 Token 时**先在 `variables.css` 定义**，语法遵循项目命名规则（语义命名，不描述实现）
4. 复杂交互组件用 **Radix UI 原生部件**做骨架，样式用自己的 CSS
5. 新组件放 `src/components/common/`，统一从 `index.ts` 导出

### 模糊值使用层次

| 场景                                                | Token            | 值   |
| --------------------------------------------------- | ---------------- | ---- |
| Dialog 遮罩层                                       | `--blur-overlay` | 4px  |
| `.glass`、Popover、DropdownMenu、Select 面板、Toast | `--blur-panel`   | 10px |
| Tooltip                                             | `--blur-tooltip` | 12px |

---

## 主题切换机制

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
