# Matrix 客户端接入与本地存储说明（项目内部记录）

> 目的：沉淀本次讨论与落地改动，方便后续直接引用，也便于其他开发者理解为什么代码这样写。
> 
> 时间：2026-01-24
> 
> SDK：`matrix-js-sdk`（项目依赖为 `^40.1.0-rc.0`）

---

## 1. 项目架构与运行平台（用于理解“存储在哪里”）

### 1.1 架构概览

- 前端渲染层：Vite + Vue 3 + TypeScript（SPA），Pinia + Vue Router + vue-i18n。
- 桌面端：Electron（Main + Preload + Renderer）。Renderer 仍然是同一套 Vue 前端。

### 1.2 平台划分

- Web（浏览器）
- Electron 桌面端（目前打包目标明确为 Windows portable；代码也考虑了跨平台路径分支）

这意味着：
- Web 端只有浏览器存储（localStorage/IndexedDB 等）。
- Electron 端同时存在：
  - Renderer 侧的浏览器存储（IndexedDB/localStorage 等）
  - Main 侧的 Node 存储（electron-store，实际通过 IPC 供 renderer 调用）

---

## 2. 核心结论（先给答案）

### 2.1 `logout()` 会清理 Matrix “本地数据库”吗？

不会。

`matrix-js-sdk` 的 `client.logout()` 本质是 **服务端登出**：让当前 `access_token` 在 homeserver 端失效。
它不负责清理本地的持久化数据（如 IndexedDB 同步缓存、存到 localStorage/electron-store 的 token 等）。

### 2.2 需不需要“手动创建数据库”？

不需要自己建表/建库。

如果要持久化同步缓存，做法是：在创建已认证 client 时启用 SDK 提供的持久化 store（常见是 IndexedDBStore）。
SDK/Chromium 会自动管理具体文件结构。

### 2.3 选择内存 store 还是 IndexedDBStore？

本项目阶段（规模未知、暂不做 E2EE/设备认证相关逻辑）推荐：

- 未认证 client（仅 `baseUrl` 用于登录前 API）：内存即可。
- 已认证 client（会 `startClient()` 开始 /sync）：优先用 IndexedDBStore。

理由：一旦消息/房间稍多，纯内存会导致每次启动都要重新“跑一遍状态/同步”，体验波动明显；IndexedDBStore 能平滑启动成本。

---

## 3. Electron 下 IndexedDB 的运行逻辑（重点）

### 3.1 IndexedDB 在 Electron 的哪个进程？

只在 **Renderer（渲染进程）**。

Renderer 本质是 Chromium 浏览器环境，因此 IndexedDB 跟 Web 一样运行。
Electron Main（Node 环境）没有 `window/indexedDB`，不能直接使用 IndexedDB。

### 3.2 IndexedDB 数据落盘在哪里？

落在 Electron 的 `userData` 目录对应的 Chromium profile 下，由 Chromium 自动创建多文件/多目录结构（不是单文件）。

本项目在 Electron Main 中会显式重定向 `userData`：
- 安装模式：指向 Temp 下的 `*-setup-mode`
- 正式模式：指向用户选择的数据目录下的 `app_data`

因此：
- 看到“数据库不见了/换了”，很可能是 `userData` 路径在安装模式与正式模式之间切换导致的（profile 根变了）。

### 3.3 IndexedDB 与 electron-store 的关系

两套存储：
- IndexedDB：Renderer/Chromium 管理（适合大量结构化数据，例如 Matrix 同步缓存）。
- electron-store：Main/Node 管理（适合业务配置键值对，例如主题/语言/登录相关 key）。

互不影响：清理 electron-store 不会清 IndexedDB，反之亦然。

---

## 4. 本项目的“主题/语言”等配置为什么是 config.json？

结论：`config.json`（常见命名）是 `electron-store` 的默认落盘文件，并非系统自动固定生成。

在本项目里：
- Renderer 通过统一适配层（`getSetting/setSetting`）读写配置。
- Electron 环境下，Renderer 实际是走 IPC 调到 Main：Main 用 `electron-store` 写盘。
- Main 侧指定了 `cwd: app.getPath('userData')`，因此配置文件会落在 userData 根目录下。
- 文件名（如 `config.json`）是 electron-store 的默认规则，没有在代码里显式指定 `name`。

主题/语言写入方式：
- 主题：`setSetting('theme', ...)`
- 语言：`setSetting('locale', ...)`

---

## 5. Matrix 客户端的本地数据库（IndexedDBStore）接入方式

### 5.1 为什么要单独封装一层 store 工具函数？

目标：
- 适配 Web/Electron renderer（都支持 IndexedDB）。
- 在非浏览器运行时（如 Electron main / Node）不会因为引用 `window/indexedDB` 报错，避免打包失败。

### 5.2 工具函数（新增）

新增文件：`src/services/Matrix/indexeddbStore.ts`

提供：
- `createMatrixIndexedDBStore({ dbName, namespace? })`
  - 仅在 renderer/browser runtime 下返回 `IndexedDBStore`（已 `startup()`）。
  - 其他环境返回 `null`（调用方可降级为内存 store）。
- `deleteMatrixIndexedDBDatabase(dbName)`
  - 删除指定 IndexedDB 数据库。
- `clearMatrixStoreOrDeleteDb({ store, dbName })`
  - 若 store 有自清理能力则优先调用，否则回退到 `deleteDatabase`。

dbName 生成策略建议：
- 包含 `homeserver + userId`，避免切号串库
- 需要更细粒度隔离可追加 `deviceId`（本次实现也支持）

---

## 6. Matrix 登录/启动同步与退出（Matrix 层）

### 6.1 `startClient()` 与“客户端同步”的关系

- `startClient()` 会启动 `/sync` 循环，也就是想要的“客户端同步”。
- 通常不需要额外再调用别的 sync 方法。

### 6.2 已认证 client 创建时做了什么

在 `useAccessTokenLogin()`（`src/services/Matrix/client.ts`）里：

- 先通过 `whoami()` 校验 token，拿到权威 `userId`。
- 初始化 IndexedDBStore（若环境不支持则返回 `null`，自动降级）。
- `sdk.createClient({ baseUrl, accessToken, userId, deviceId, store, timelineSupport, useAuthorizationHeader, localTimeoutMs })`
- 随后调用 `startClient()` 启动同步（已加 try/catch 防护）。

额外补充：
- 增加了 `localTimeoutMs: 60000`，避免网络请求长期挂起。

### 6.3 退出（Matrix 层）

`UserLogout(options?: { clearIndexedDB?: boolean })` 的顺序：

1) `stopClient()`：先停掉同步循环
2) `logout()`：服务端登出（token 失效）
3) 可选：`clearIndexedDB === true` 时清理 IndexedDB 数据库
4) 释放引用（client/store/dbName 置空）

说明：是否清库取决于产品策略。
- 普通退出：通常不必清库（保留缓存，提高下次启动体验）。
- 切号/安全退出：可以启用 `clearIndexedDB`。

---

## 7. 本次落地改动点（给后续开发者对照）

- 新增：`src/services/Matrix/indexeddbStore.ts`
  - IndexedDBStore 的创建/初始化/删除封装，避免跨端引用错误。

- 修改：`src/services/Matrix/client.ts`
  - AccessToken 登录流程接入 IndexedDBStore
  - 修正 whoami 返回字段使用
  - `UserLogout` 改为 async，加入 stopClient + 可选清库
  - 启用 `startClient()`
  - 增加 `localTimeoutMs: 60000`

---

## 8. 常见问题速查

### Q1：为什么有时 Electron 下“数据库好像换了/丢了”？
A：多半是 `userData` 路径被重定向了（安装模式 vs 正式模式），导致 Chromium profile 根变化。

### Q2：为什么不把 Matrix store 放到 electron-store？
A：Matrix 同步缓存量大且结构复杂，更适合 IndexedDBStore；electron-store 更适合少量配置键值。

### Q3：需要配置 cryptoStore 吗？
A：本阶段不需要（明确不做 E2EE/设备认证相关逻辑）。保持不配置即可。

---

## 9. 后续可选优化（不在本次必做范围）

- 根据实际体验，为 `startClient()` 传入参数（如 `initialSyncLimit/lazyLoadMembers/pollTimeout`）优化首屏同步与内存占用。
- 若未来支持“多账号快速切换”，建议统一管理 dbName 策略与清理策略。
