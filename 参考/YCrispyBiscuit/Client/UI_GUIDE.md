# YCrispyBiscuit UI 样式使用指南

这份文档描述了基于 **磨砂玻璃 (Glassmorphism)** 风格的现代化 UI 设计系统的使用方法。该系统专为桌面端应用设计，支持柔和的深色/浅色主题切换。

## 1. 引入样式

确保在你的入口文件（`main.ts` 或 `main.tsx`）中引入了以下两个核心文件：

```typescript
// 1. 变量定义 (主题色, 尺寸, 玻璃特效参数)
import './styles/variables.css';
// 2. 基础重置 (Reset, 原子类, 布局约束)
import './styles/base.css';
```

## 2. 布局结构 (Layout)

系统强制应用了 **100vw / 100vh** 的视口锁定布局（类似原生 App）。

- **视口锁定**: `html` 和 `body` 设置了 `overflow: hidden`，这意味着**浏览器默认的页面级滚动条被隐藏/移除了**。应用的窗口本身不会滚动。
- **内容滚动**: 因为外部无法滚动，所以你必须在内容溢出的内部区域手动添加 `.scroll-y` 类，以开启该区域的独立滚动条（样式已美化）。

```html
<!-- 典型布局结构 -->
<div id="app"> <!-- 已自动全屏 -->
  <header>...</header> <!-- 固定头部 -->
  
  <main class="scroll-y"> <!-- 可滚动的内容区域 -->
    <!-- 你的页面内容 -->
  </main>
</div>
```

## 3. 核心组件类 (Classes)

直接在 HTML/JSX 元素上添加以下类名即可获得对应样式。

### 3.1 容器与面板 (Glass Containers)

这是设计语的核心。所有内容背景应优先使用此类。

| 类名 | 描述 |
| :--- | :--- |
| `.glass-card` | 标准圆角卡片，包含背景模糊、边框、阴影和内边距(`1.5rem`)。 |
| `.glass-panel` | 同上，通常用于侧边栏或顶部导航条。 |

```html
<div class="glass-card">
  <h2>用户资料</h2>
  <p>这是一个磨砂玻璃卡片。</p>
</div>
```

### 3.2 按钮 (Buttons)

所有按钮都有悬停(`hover`)和点击(`active`)动效。

| 类名 | 描述 | 语义/场景 |
| :--- | :--- | :--- |
| `.btn` | 基础按钮 | 默认磨砂玻璃背景，适用大多数操作。 |
| `.btn.btn-primary` | **主要按钮** | 绿色。提交、确认、保存。 |
| `.btn.btn-danger` | **危险按钮** | 红色。删除、注销、不可逆操作。 |
| `.btn.btn-ghost` | **幽灵按钮** | 透明背景，仅边框/文字。用于次要操作或取消。 |

```html
<button class="btn">默认按钮</button>
<button class="btn btn-primary">提交保存</button>
<button class="btn btn-danger">删除项目</button>
```

### 3.3 表单 (Forms)

| 类名 | 描述 |
| :--- | :--- |
| `.input` | 磨砂玻璃风格输入框。聚焦时会有主色光晕。 |

```html
<input class="input" type="text" placeholder="请输入用户名..." />
```

## 4. 主题切换 (Theming)

系统基于 CSS 变量 (`CSS Custom Properties`) 构建。

- **默认**: Dark Mode (Soft Dark)
- **切换**: 通过在 `<html>` 标签上添加 `data-theme="light"` 属性。

## 5. 设计规范与变量 (Design System Tokens)

**非常重要**：在编写 Vue 组件样式时，请务必使用以下变量，**严禁使用固定数值（如 14px, 1.5rem 等硬编码）**。

### 5.1 间距阶梯 (Spacing)
用于 `margin`, `padding`, `gap`。

| 变量 | 值 (Dark/Ref) | 适用场景 |
| :--- | :--- | :--- |
| `var(--space-xs)` | 0.25rem (4px) | 极小间距、内衬 |
| `var(--space-sm)` | 0.5rem (8px) | 元素内部间距 |
| `var(--space-md)` | 1rem (16px) | 标准间距 |
| `var(--space-lg)` | 1.5rem (24px) | 模块间距 |
| `var(--space-xl)` | 2rem (32px) | 页面内边距 |
| `var(--space-2xl)` | 3rem (48px) | 大容器/卡片内边距 |

### 5.2 字阶系统 (Typography)
用于 `font-size`。

| 变量 | 值 | 对应角色 |
| :--- | :--- | :--- |
| `var(--font-xs)` | 0.625rem (10px) | 辅助标签/小注 |
| `var(--font-sm)` | 0.75rem (12px) | 说明文本/标题栏文字 |
| `var(--font-base)` | 0.875rem (14px) | 正文/按钮/输入框 (标准) |
| `var(--font-md)` | 1rem (16px) | 默认正文 |
| `var(--font-lg)` | 1.25rem (20px) | H3 |
| `var(--font-xl)` | 1.5rem (24px) | H2 |
| `var(--font-2xl)` | 2rem (32px) | H1 |

### 5.3 交互状态 (States)
| 变量 | 描述 |
| :--- | :--- |
| `var(--hover-bg)` | 元素悬停时的半透明背景色 |
| `var(--active-bg)` | 元素点击/激活时的背景色 |

### 5.4 核心色值 & 其它
- **背景/文字**: `var(--bg-color)`, `var(--text-color)`, `var(--text-muted)`
- **品牌色**: `var(--primary-color)`, `var(--danger-color)`
- **圆角**: `var(--radius-sm)` (6px), `var(--radius-md)` (12px)
- **玻璃特效**: `var(--glass-bg)`, `var(--glass-blur)`, `var(--glass-border)`
- **组件高度**: `--titlebar-height` (32px)

---
*Updated on 2026/01/22 - Added Typography & Spacing Scale*
*Created by GitHub Copilot for YCrispyBiscuit*
