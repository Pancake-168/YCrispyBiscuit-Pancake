/**
 * ============================================================================
 * Electron 主进程入口
 * ============================================================================
 *
 * 架构概述：
 * - 本文件是 Electron 应用的主进程（Main Process），负责窗口管理、系统托盘、
 *   原生 API 调用、IPC 通信中枢。
 * - 渲染进程（Vue 前端）通过 preload.ts 暴露的 electronAPI 与主进程通信。
 * - 所有需要提权或访问 Node.js/系统 API 的操作都在这里完成，渲染进程无法直接
 *   访问 Node.js 环境（contextIsolation + nodeIntegration:false）。
 *
 * 关键设计决策：
 * 1. 自定义 app:// 协议 — 打包后前端 History 路由刷新不会 404
 * 2. 关闭按钮最小化到托盘 — 适合常驻型聊天应用，真正退出通过托盘菜单
 * 3. 无边框窗口（frame:false）— 前端自行绘制标题栏
 * 4. electron-store 管理持久化配置 — 替代 localStorage（后者在 Electron 中不可靠）
 */

import {
  app,             // 应用生命周期：ready、quit、before-quit 等
  BrowserWindow,   // 创建和管理原生窗口
  ipcMain,         // 主进程端 IPC（Inter-Process Communication）接收器
  dialog,          // 原生对话框（错误弹窗等）
  shell,           // 用系统默认方式打开 URL/文件
  protocol,        // 注册自定义协议（app://）
  net,             // Chromium 网络层，配合 protocol.handle 返回网络响应
  Menu,            // 原生菜单（托盘右键菜单）
  Tray,            // 系统托盘图标
} from "electron";
import path from "path";
import { pathToFileURL } from "url";   // 将本地文件路径转为 file:// URL
import dotenv from "dotenv";           // 加载 .env 环境变量文件
import Store from "electron-store";    // 持久化键值存储（底层是 JSON 文件）
import fs from "fs";
import {
  createLogger,        // 创建带上下文的日志记录器
  registerLogTransport,// 注册日志输出目标（文件、控制台等）
  serializeLogPayload, // 将日志对象序列化为单行字符串
  type LogPayload,     // 日志数据结构的 TypeScript 类型
} from "../src/utils/logger";

// ============================================================================
// 日志系统 — 文件输出
// ============================================================================

/** 日志文件存放的子目录名，位于 userData 目录下 */
const LOG_DIR_NAME = "logs";

/**
 * 日志目录路径缓存。
 * 首次访问时创建目录并缓存路径，后续复用，避免每次写日志都调 mkdirSync。
 */
let logDir: string | null = null;

/**
 * 获取日志目录路径（懒初始化）。
 * 首次调用时创建目录（recursive 保证父目录不存在也能成功），之后直接返回缓存。
 */
const getLogDir = () => {
  if (!logDir) {
    logDir = path.join(app.getPath("userData"), LOG_DIR_NAME);
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
};

/**
 * 生成当天的日志文件名，格式为 YYYY-MM-DD.log。
 * 每次调用根据当前系统时间计算，跨天自动切换到新文件。
 */
const getDailyLogFileName = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}.log`;
};

/**
 * 注册文件日志传输器。
 * 所有通过 createLogger 产生的日志最终都会走到这里，以追加方式写入当天日志文件。
 * serializeLogPayload 已经内置了 ISO 时间戳，所以每行日志都带精确时间。
 */
registerLogTransport((payload: LogPayload) => {
  const line = serializeLogPayload(payload);
  const logFilePath = path.join(getLogDir(), getDailyLogFileName());
  fs.appendFileSync(logFilePath, `${line}\n`, "utf8");
});

// ============================================================================
// 便捷日志函数 — 为 main.ts 提供简化的日志接口
// ============================================================================

/**
 * 三个便捷函数封装了 createLogger("main.ts", functionName)，避免每次手动传文件名。
 * details 参数支持任意类型的额外信息，会被 stringifyLogDetail 序列化。
 */
const logInfo = (functionName: string, message: string, details: unknown[] = []) => {
  createLogger("main.ts", functionName).info(message, ...details);
};

const logWarn = (functionName: string, message: string, details: unknown[] = []) => {
  createLogger("main.ts", functionName).warn(message, ...details);
};

const logError = (functionName: string, message: string, details: unknown[] = []) => {
  createLogger("main.ts", functionName).error(message, ...details);
};

/** 启动时记录日志路径，方便排查问题 */
logInfo("bootstrap", "主进程日志系统初始化完成", [app.getPath("userData")]);

// ============================================================================
// 自定义协议注册（app://）
// ============================================================================

/** 自定义协议名称，前端页面通过 app://-/ 访问 */
const APP_PROTOCOL = "app";

/**
 * 注册自定义协议为"特权协议"。
 *
 * 必须在 app.ready 之前调用，否则会报错。
 * 各项特权含义：
 * - standard: true   → 让 app:// 行为像标准 URL（支持 History API pushState/replaceState）
 * - secure: true     → 视为安全上下文（允许 Service Worker、Crypto API 等）
 * - supportFetchAPI: true → 允许 fetch() 请求
 * - corsEnabled: true → 允许跨域（对本地文件协议其实无所谓，但保持开启）
 */
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

/**
 * 注册 app:// 协议的请求处理器。
 *
 * 处理逻辑：
 * 1. 解析请求 URL，提取路径
 * 2. 如果路径包含文件扩展名 → 映射到 dist/ 下对应静态资源（JS/CSS/图片等）
 * 3. 如果路径没有扩展名 → 不管什么路由，统一返回 index.html
 *    （这是 Vue Router History 模式的关键：/chat、/login 这些前端路由
 *     在服务端不存在，必须返回入口 HTML，让前端路由接管）
 * 4. 安全检查：解析后的路径必须在 distRoot 范围内，防止 ../ 路径遍历攻击
 *
 * 使用 protocol.handle（Electron 25+ 推荐），替代已废弃的 registerFileProtocol。
 * net.fetch + pathToFileURL 将本地文件以 file:// URL 形式返回给 Chromium。
 */
const registerAppProtocol = () => {
  // dist-electron 与 dist 是同级目录（开发时是源码，打包后也保持同一结构）
  const distRoot = path.join(__dirname, "..", "dist");

  protocol.handle(APP_PROTOCOL, (request) => {
    try {
      const url = new URL(request.url);
      // decodeURIComponent 处理中文路径和特殊字符
      const rawPath = decodeURIComponent(url.pathname || "/");
      const normalizedPath = rawPath.replace(/^\/+/, "");

      // 有扩展名 = 静态资源请求；无扩展名 = 前端路由，回退到 index.html
      const isAssetRequest = path.extname(normalizedPath) !== "";
      const relFile = isAssetRequest ? normalizedPath : "index.html";

      // 拼接并规范化路径
      const resolved = path.normalize(path.join(distRoot, relFile));

      // 路径遍历防护：确保解析后的路径仍在 distRoot 下
      if (!resolved.startsWith(path.normalize(distRoot))) {
        return net.fetch(pathToFileURL(path.join(distRoot, "index.html")).toString());
      }

      return net.fetch(pathToFileURL(resolved).toString());
    } catch {
      // 任何异常（包括 URL 解析失败）都安全降级到 index.html
      return net.fetch(pathToFileURL(path.join(distRoot, "index.html")).toString());
    }
  });
};

// ============================================================================
// 环境变量加载
// ============================================================================

/**
 * 查找 .env 文件的路径。
 * 开发环境：项目根目录下的 .env.development
 * 生产环境：按优先级尝试多个可能位置（适配不同打包方式）
 *   - resources/app/  → electron-builder 打包后的资源目录
 *   - __dirname/..    → 相对于 main.js 的上层
 *   - app.getAppPath() → asar 包内的根路径
 */
const getEnvPath = () => {
  if (app.isPackaged) {
    const paths = [
      path.join(process.resourcesPath, "app", ".env.production"),
      path.join(__dirname, "..", ".env.production"),
      path.join(app.getAppPath(), ".env.production"),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return path.join(process.cwd(), ".env.development");
};

const envPath = getEnvPath();
dotenv.config({ path: envPath });

// ============================================================================
// 应用名称 & 全局状态
// ============================================================================

/** 应用显示名称，从环境变量读取，保底值为 RegionAI */
const APP_NAME = process.env.VITE_APP_NAME || "RegionAI";

/**
 * 设置应用名称。
 * 影响：系统级对话框标题、默认 userData 路径名（如 %APPDATA%/RegionAI/）。
 * 注意：必须在 app.ready 之前调用才对所有路径生效。
 */
app.setName(APP_NAME);

/**
 * electron-store 的运行时接口。
 *
 * electron-store v11 的 TypeScript 类型（继承 Conf 的 #private 字段）
 * 在项目当前编译配置下解析异常，因此手动声明所需方法的类型。
 * 运行时方法（get/set/delete/store）均存在，不受影响。
 */
interface IStore {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  delete(key: string): void;
  readonly store: Record<string, unknown>;
}

/**
 * electron-store 实例（持久化键值存储）。
 * 懒初始化 — 首次 getStore() 调用时才创建。
 * 底层在 userData 目录下生成 config.json 文件。
 */
let store: IStore | null = null;

/** 主窗口引用，单例。关闭/隐藏时置 null。 */
let mainWindow: BrowserWindow | null = null;

/** 系统托盘图标引用 */
let tray: Tray | null = null;

/**
 * 退出标记。
 * 当用户通过托盘菜单点击"退出"时设为 true，此时关闭窗口不会隐藏到托盘，
 * 而是真正关闭（shouldCloseToTray 返回 false），走正常退出流程。
 */
let isQuitting = false;

// ============================================================================
// 窗口 & 托盘 — 工具函数
// ============================================================================

/** 窗口默认尺寸（也作为最小尺寸，防止窗口缩得过小导致布局错乱） */
const NORMAL_WINDOW_SIZE = { width: 1200, height: 800 };

/**
 * 获取应用图标路径。
 * 开发环境：public/icon.png
 * 生产环境：dist/icon.png（打包后与 dist-electron 同级）
 */
const getWindowIconPath = () =>
  path.join(
    __dirname,
    app.isPackaged ? "../dist/icon.png" : "../public/icon.png",
  );

/**
 * 显示并聚焦主窗口。
 * 处理三种状态：最小化 → 还原，隐藏 → 显示，已显示 → 聚焦。
 */
const showMainWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  mainWindow.focus();
};

// ============================================================================
// 系统托盘
// ============================================================================

/**
 * 创建系统托盘图标和右键菜单。
 * 菜单包含：打开主窗口、退出应用。
 * 点击托盘图标 = 打开主窗口。
 * 仅在首次调用时创建（幂等检查）。
 */
const createTray = () => {
  if (tray) return;
  logInfo("createTray", "开始创建系统托盘");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "打开主窗口",
      click: () => showMainWindow(),
    },
    {
      label: "退出",
      click: () => {
        // 设置退出标记，确保后续窗口关闭事件不会拦截为"隐藏到托盘"
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray = new Tray(getWindowIconPath());
  tray.setContextMenu(contextMenu);
  tray.setToolTip(APP_NAME);
  // 点击托盘图标 = 打开主窗口（Windows 常见行为）
  tray.on("click", () => showMainWindow());
  logInfo("createTray", "系统托盘创建完成");
};

// ============================================================================
// 窗口关闭行为 — 最小化到托盘
// ============================================================================

/**
 * 判断当前是否应该"关闭到托盘"而非真正关闭。
 * 返回 true → 隐藏窗口（保留在托盘）
 * 返回 false → 真正关闭窗口
 *
 * 退出流程：用户点击托盘菜单"退出" → isQuitting = true
 *           → shouldCloseToTray() 返回 false → 窗口正常关闭 → app.quit()
 */
const shouldCloseToTray = () => {
  if (isQuitting) return false;
  return true;
};

// ============================================================================
// 窗口存活检查 — Type Guard
// ============================================================================

/**
 * 类型守卫：检查 BrowserWindow 是否仍然存活。
 * 同时检查三层状态：null、窗口已销毁、webContents 已销毁。
 * 避免了在事件回调中操作已销毁窗口导致的崩溃。
 */
const isWindowAlive = (
  win: BrowserWindow | null | undefined,
): win is BrowserWindow => {
  if (!win) return false;
  if (win.isDestroyed()) return false;
  if (win.webContents.isDestroyed()) return false;
  return true;
};

// ============================================================================
// 持久化存储（electron-store）
// ============================================================================

/**
 * 获取 electron-store 实例（懒初始化）。
 * 首次调用时在 app.getPath("userData") 下创建 config.json。
 * 所有持久化设置都通过这个 store 读写。
 */
const getStore = (): IStore => {
  if (!store) {
    store = new Store() as unknown as IStore;
  }
  return store;
};

// ============================================================================
// IPC 处理器 — 渲染进程与主进程的通信桥梁
// ============================================================================

/**
 * get-is-dev：判断当前是否为开发环境。
 * 渲染进程可能根据此结果决定是否显示调试面板、开发工具等。
 */
ipcMain.handle("get-is-dev", () => !app.isPackaged);

/**
 * write-log：接收渲染进程的日志并写入主进程日志文件。
 *
 * 背景：渲染进程的 console 输出在打包后不可见（无 DevTools），
 * 通过此 IPC 将前端日志统一汇聚到主进程日志文件，方便排查用户端问题。
 * payload 包含 fileName、functionName、level、message、details 字段。
 */
ipcMain.handle("write-log", async (_event, payload) => {
  try {
    const logger = createLogger(payload.fileName, payload.functionName);
    if (payload.level === "error") {
      logger.error(payload.message, ...(payload.details || []));
    } else if (payload.level === "warn") {
      logger.warn(payload.message, ...(payload.details || []));
    } else if (payload.level === "debug") {
      logger.debug(payload.message, ...(payload.details || []));
    } else {
      logger.info(payload.message, ...(payload.details || []));
    }
    return true;
  } catch (error) {
    logError("write-log", "write-log failed", [error]);
    return false;
  }
});

/**
 * settings-get：读取持久化设置。
 * @param key 设置键名
 * @returns 对应的值（unknown），失败返回 null
 */
ipcMain.handle("settings-get", async (_event, key: string) => {
  try {
    return getStore().get(key);
  } catch (error) {
    logWarn("settings-get", "settings-get failed", [error]);
    return null;
  }
});

/**
 * settings-set：写入持久化设置。
 * @param key   设置键名
 * @param value 任意可 JSON 序列化的值
 * @returns 成功 true，失败 false
 */
ipcMain.handle("settings-set", async (_event, key: string, value: unknown) => {
  try {
    getStore().set(key as string, value);
    return true;
  } catch (error) {
    logWarn("settings-set", "settings-set failed", [error]);
    return false;
  }
});

/**
 * settings-delete：删除指定持久化设置。
 * @param key 设置键名
 * @returns 成功 true，失败 false
 */
ipcMain.handle("settings-delete", async (_event, key: string) => {
  try {
    getStore().delete(key);
    return true;
  } catch (error) {
    logWarn("settings-delete", "settings-delete failed", [error]);
    return false;
  }
});

/**
 * settings-keys：获取所有持久化设置的键名列表。
 * @returns 键名字符串数组，失败返回空数组
 */
ipcMain.handle("settings-keys", async () => {
  try {
    return Object.keys(getStore().store);
  } catch (error) {
    logWarn("settings-keys", "settings-keys failed", [error]);
    return [];
  }
});

/**
 * open-external：用系统默认浏览器打开外部链接。
 * 安全措施：仅允许 http/https 协议的 URL，拒绝 file:// 等危险协议。
 * @param url 目标网址
 * @returns 成功 true，失败或被拒绝返回 false
 */
ipcMain.handle("open-external", async (_event, url: string) => {
  try {
    // 安全校验：只允许 http/https，防止 file:// 或 javascript: 等危险协议
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      logWarn("open-external", "open-external rejected url", [url]);
      return false;
    }
    await shell.openExternal(url);
    return true;
  } catch (error) {
    logWarn("open-external", "open-external failed", [error]);
    return false;
  }
});

// ============================================================================
// 窗口控件 IPC — 无边框窗口的拖拽区域按钮
// ============================================================================

/**
 * 窗口控制按钮（最小化/最大化/关闭）的 IPC 监听器。
 *
 * 由于应用使用无边框窗口（frame: false），标题栏的窗口控制按钮由前端
 * 自行绘制。前端通过 ipcRenderer.send() 发送单向消息，主进程执行对应操作。
 *
 * 注意：使用 ipcMain.on（不是 ipcMain.handle），因为前端用 send() 而非 invoke()。
 * send() 是单向的，不需要返回值。
 *
 * 这些监听器只在模块顶层注册一次，不在 createWindow() 内部注册，
 * 以防止窗口销毁重建时监听器叠加（每次 createWindow 都会新增 on 监听器）。
 */
ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on("window-close", () => mainWindow?.close());

// ============================================================================
// 创建主窗口
// ============================================================================

/**
 * 创建并配置主窗口。
 *
 * 配置要点：
 * - frame: false       → 无边框，前端通过自定义组件绘制标题栏
 * - contextIsolation   → 渲染进程无法直接访问 Node.js API，安全隔离
 * - nodeIntegration    → 禁用，防止渲染进程直接 require Node 模块
 * - backgroundThrottling → 禁用后台节流（聊天应用需要及时收到消息）
 * - preload            → 指向 preload.ts 编译产物，暴露安全的 electronAPI
 *
 * 加载策略：
 * - 开发环境 → 连接 Vite 开发服务器（HMR 热更新）
 * - 生产环境 → 加载 app:// 自定义协议（History 路由支持）
 */
const createWindow = () => {
  logInfo("createWindow", "开始创建主窗口");
  const win = new BrowserWindow({
    title: APP_NAME,
    icon: getWindowIconPath(),
    width: NORMAL_WINDOW_SIZE.width,
    height: NORMAL_WINDOW_SIZE.height,
    minWidth: NORMAL_WINDOW_SIZE.width,
    minHeight: NORMAL_WINDOW_SIZE.height,
    frame: false, // 无边框窗口，标题栏由前端绘制
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 预加载脚本（编译后为 .js）
      nodeIntegration: false,     // 禁止渲染进程使用 Node.js API（安全）
      contextIsolation: true,     // 启用上下文隔离（安全）
      backgroundThrottling: false,// 后台不节流，确保消息推送及时到达
    },
  });

  // 移除原生菜单栏（无边框窗口不需要，且 macOS 不考虑）
  win.setMenu(null);

  // 挂载到全局变量
  mainWindow = win;

  // 解析开发服务器地址（Vite 默认 localhost:5173，端口可通过 VITE_PORT 自定义）
  const port = process.env.VITE_PORT;
  const devServerUrl =
    process.env.VITE_DEV_SERVER_URL || `http://localhost:${port}`;

  // 根据打包状态选择加载策略
  if (!app.isPackaged) {
    // 开发环境：直连 Vite 开发服务器，享受 HMR 热更新
    logInfo("createWindow", "加载开发环境页面", [devServerUrl]);
    win.loadURL(devServerUrl);
  } else {
    // 生产环境：加载 app:// 协议，内部映射到 dist/index.html
    // History 路由（如 /chat、/settings）刷新时不会 404
    logInfo("createWindow", "加载桌面应用页面", [`${APP_PROTOCOL}://-/`]);
    win.loadURL(`${APP_PROTOCOL}://-/`);
  }

  // 可选的开发工具自动打开（通过环境变量 ELECTRON_DEV_TOOLS=true 控制）
  if (process.env.ELECTRON_DEV_TOOLS === "true") {
    win.webContents.openDevTools();
  }

  // ---- 窗口生命周期事件 ----

  /**
   * 关闭事件拦截 → 最小化到托盘。
   * 用户点击窗口 X 按钮时，默认隐藏窗口而不是退出应用。
   * 只有在 isQuitting = true（用户从托盘菜单选择"退出"）时才真正关闭。
   */
  win.on("close", (event) => {
    if (!shouldCloseToTray()) return;
    event.preventDefault(); // 阻止默认关闭行为
    win.hide();             // 隐藏窗口（保留在托盘）
    win.flashFrame(false);  // 停止任务栏闪烁（如果有）
  });

  /**
   * 最大化/还原事件 → 通知渲染进程切换标题栏按钮图标。
   * 前端 onMaximizedStatus 回调接收 true（最大化）/false（还原）。
   */
  win.on("maximize", () => {
    if (!isWindowAlive(win)) return;
    win.webContents.send("window-maximized-status", true);
  });
  win.on("unmaximize", () => {
    if (!isWindowAlive(win)) return;
    win.webContents.send("window-maximized-status", false);
  });

  /**
   * 窗口真正关闭时清理全局引用。
   * 注意区分 closed（已销毁）和 close（即将关闭，在此被拦截）。
   */
  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  /**
   * 窗口获得焦点时清除任务栏闪烁。
   * 用户通过托盘图标恢复窗口时，任务栏不应该继续闪烁。
   */
  win.on("focus", () => {
    if (!isWindowAlive(win)) return;
    win.flashFrame(false);
  });

  // ---- 子窗口处理 ----

  /**
   * 统一处理前端 window.open() 调用。
   * 为所有子窗口应用相同的安全配置（preload、contextIsolation 等），
   * 然后阻止默认行为（前端不需要拿到子窗口引用，由主进程管理）。
   */
  win.webContents.setWindowOpenHandler(({ url }) => {
    const child = new BrowserWindow({
      parent: win,
      show: true,
      width: 1000,
      height: 760,
      icon: getWindowIconPath(),
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
      },
    });

    child.setMenu(null);
    child.loadURL(url);

    // 阻止默认的窗口创建行为（我们已手动创建子窗口）
    return { action: "deny" };
  });
};

// ============================================================================
// 应用启动流程 — app.whenReady
// ============================================================================

/**
 * Electron 应用启动入口。
 * app.whenReady() 在所有初始化完成后触发，此时可以安全地创建窗口。
 *
 * 启动顺序：
 * 1. 初始化持久化存储（electron-store）
 * 2. （生产环境）注册 app:// 自定义协议
 * 3. 创建系统托盘
 * 4. 创建主窗口
 *
 * 任何步骤失败都会弹出错误对话框并退出应用。
 */
app.whenReady().then(async () => {
  try {
    logInfo("app.whenReady", "Electron ready 事件已触发");

    // 初始化持久化存储（首次访问时在 userData 下创建 config.json）
    getStore();

    // 生产环境注册自定义协议，开发环境使用 localhost 不需要
    if (app.isPackaged) {
      registerAppProtocol();
    }

    createTray();
    createWindow();
    logInfo("app.whenReady", "主进程启动完成");
  } catch (error) {
    logError("app.whenReady", "应用启动失败", [error]);
    dialog.showErrorBox(
      "应用启动失败",
      error instanceof Error ? error.message : String(error),
    );
    app.exit(1);
  }
});

// ============================================================================
// 应用生命周期事件
// ============================================================================

/**
 * before-quit：应用即将退出。
 * 设置 isQuitting 标记，确保后续窗口 close 事件不会拦截为"隐藏到托盘"。
 */
app.on("before-quit", () => {
  isQuitting = true;
});

/**
 * window-all-closed：所有窗口关闭时退出应用。
 * 不区分平台（不考虑 macOS 的 dock 常驻行为），直接退出。
 */
app.on("window-all-closed", () => {
  app.quit();
});

// ============================================================================
// 全局错误捕获 — 最后防线
// ============================================================================

/**
 * 捕获主进程同步异常。
 * 这些异常如果没有被上层的 try/catch 处理，至少会被记录到日志文件，
 * 否则用户端崩溃后无法追溯原因。
 */
process.on("uncaughtException", (error) => {
  logError("process.uncaughtException", "主进程未捕获异常", [error]);
});

/**
 * 捕获主进程中未处理的 Promise rejection。
 * 与 uncaughtException 互补，覆盖异步错误场景。
 */
process.on("unhandledRejection", (reason) => {
  logError("process.unhandledRejection", "主进程未处理 Promise 拒绝", [
    reason,
  ]);
});
