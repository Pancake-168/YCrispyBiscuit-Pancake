import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  protocol,
  Notification,
  Menu,
  Tray,
} from "electron";
import path from "path";
import dotenv from "dotenv";
import Store from "electron-store";
import fs from "fs";
import { createHash } from "crypto";
import {
  createLogger,
  registerLogTransport,
  serializeLogPayload,
  type LogPayload,
} from "../logger";

const APP_LOG_FILE = "app.log";
const ERROR_LOG_FILE = "error.log";
const DEBUG_LOG_FILE = "debug.log";
const LOG_DIR_NAME = "logs";

const ensureLogDirectory = () => {
  const logDir = path.join(app.getPath("userData"), LOG_DIR_NAME);
  fs.mkdirSync(logDir, { recursive: true });
  return logDir;
};

const appendLogLine = (fileName: string, line: string) => {
  const logFilePath = path.join(ensureLogDirectory(), fileName);
  fs.appendFileSync(logFilePath, `${line}\n`, "utf8");
};

registerLogTransport((payload: LogPayload) => {
  const line = serializeLogPayload(payload);
  appendLogLine(APP_LOG_FILE, line);

  if (payload.level === "debug") {
    appendLogLine(DEBUG_LOG_FILE, line);
  }

  if (payload.level === "error") {
    appendLogLine(ERROR_LOG_FILE, line);
  }
});

const logInfo = (functionName: string, message: string, details: unknown[] = []) => {
  createLogger("main.ts", functionName).info(message, ...details);
};

const logWarn = (functionName: string, message: string, details: unknown[] = []) => {
  createLogger("main.ts", functionName).warn(message, ...details);
};

const logError = (functionName: string, message: string, details: unknown[] = []) => {
  createLogger("main.ts", functionName).error(message, ...details);
};

logInfo("bootstrap", "主进程日志系统初始化完成", [app.getPath("userData")]);

const APP_PROTOCOL = "app";

// 让自定义协议具备“标准 URL”的能力（支持 History API 路由）
// 必须在 app ready 之前调用
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

if (app.isPackaged) {
  const hasSingleInstanceLock = app.requestSingleInstanceLock();
  if (!hasSingleInstanceLock) {
    app.exit(0);
  }
}

const registerAppProtocol = () => {
  // dist-electron 与 dist 是同级目录（无论开发还是打包）
  const distRoot = path.join(__dirname, "..", "dist");

  protocol.registerFileProtocol(APP_PROTOCOL, (request, callback) => {
    try {
      const url = new URL(request.url);
      const rawPath = decodeURIComponent(url.pathname || "/");
      const normalizedPath = rawPath.replace(/^\/+/, "");

      // 1) 静态资源（有扩展名）直接映射到 dist 下对应文件
      // 2) 其余（如 /chat、/login）统一回退到 index.html（History 模式必须）
      const isAssetRequest = path.extname(normalizedPath) !== "";
      const relFile = isAssetRequest ? normalizedPath : "index.html";

      const resolved = path.normalize(path.join(distRoot, relFile));
      if (!resolved.startsWith(path.normalize(distRoot))) {
        callback({ path: path.join(distRoot, "index.html") });
        return;
      }
      callback({ path: resolved });
    } catch {
      callback({ path: path.join(distRoot, "index.html") });
    }
  });
};

// 1. 尽力加载环境变量 (优先识别打包后的路径)
const getEnvPath = () => {
  if (app.isPackaged) {
    // 打包后，文件位于 resources/app/.env.production 或被打在 asar 里
    // 尝试多个可能的位置
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

// 如果环境变量加载失败，从 package.json 获取一个硬编码的保底值
const APP_NAME = process.env.VITE_APP_NAME || "RegionAI";

// 设置应用名称，这会影响系统菜单、对话框标题以及默认磁盘路径名
app.setName(APP_NAME);

const getAppBaseDir = () => {
  if (!app.isPackaged) return process.cwd();
  return path.dirname(process.execPath);
};

function initializeDataPath() {
  try {
    if (!app.isPackaged) return;

    const userDataPath = path.join(getAppBaseDir(), "app_data");
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    app.setPath("userData", userDataPath);
    logInfo("initializeDataPath", "UserData redirected to", [userDataPath]);
  } catch (err) {
    logWarn("initializeDataPath", "初始化路径失败", [err]);
  }
}

// 必须在开头尽早调用
initializeDataPath();

// 只有在打包后的环境下，才强制用户进行初始化检查
// 这样在开发模式下可以跳过安装页面直接开发内页

// NOTE: We will create the electron-store instance after possibly calling app.setPath('userData')
interface StoreInstance {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  delete(key: string): void;
  store: Record<string, unknown>;
}

let store: StoreInstance | null = null;
let storeEncryptionKey: string | null = null;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
const unreadCountByRoom = new Map<string, number>();

const NORMAL_WINDOW_SIZE = { width: 1200, height: 800 };

const getWindowIconPath = () =>
  path.join(
    __dirname,
    app.isPackaged ? "../dist/icon.png" : "../public/icon.png",
  );

const getUnreadTotal = () => {
  let total = 0;
  for (const count of unreadCountByRoom.values()) {
    total += count;
  }
  return total;
};

const getStoreConfigFilePath = () =>
  path.join(app.getPath("userData"), "config.json");
const getStoreBackupFilePath = () =>
  path.join(
    app.getPath("userData"),
    `config.plaintext.backup.${Date.now()}.json`,
  );
const getStoreCorruptedBackupFilePath = () =>
  path.join(
    app.getPath("userData"),
    `config.unrecoverable.backup.${Date.now()}.json`,
  );
const getLegacyStoreKeyFilePath = () =>
  path.join(app.getPath("userData"), "config.key");

const ensureStoreDirectory = () => {
  const userDataPath = app.getPath("userData");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
};

const createEncryptedStoreInstance = (
  userDataPath: string,
  encryptionKey: string,
) => {
  return new Store({
    cwd: userDataPath,
    encryptionKey,
  }) as unknown as StoreInstance;
};

const readPlaintextStoreSnapshot = (userDataPath: string) => {
  const plainStore = new Store({
    cwd: userDataPath,
  }) as unknown as StoreInstance;
  return { ...plainStore.store };
};

const writeEncryptedStoreSnapshot = (
  userDataPath: string,
  encryptionKey: string,
  snapshot: Record<string, unknown>,
) => {
  const encryptedStore = createEncryptedStoreInstance(
    userDataPath,
    encryptionKey,
  );
  for (const [key, value] of Object.entries(snapshot)) {
    encryptedStore.set(key, value);
  }
  void encryptedStore.store;
  return encryptedStore;
};

const loadStoreEncryptionKey = () => {
  if (storeEncryptionKey) return storeEncryptionKey;

  const keySeed = [
    APP_NAME,
    process.platform,
    process.env.COMPUTERNAME || "",
    process.env.USERNAME || "",
  ].join("|");

  storeEncryptionKey = createHash("sha256").update(keySeed).digest("hex");
  return storeEncryptionKey;
};

const removeLegacyStoreKeyFile = () => {
  const legacyKeyFilePath = getLegacyStoreKeyFilePath();
  if (!fs.existsSync(legacyKeyFilePath)) return;

  try {
    fs.unlinkSync(legacyKeyFilePath);
  } catch (error) {
    logWarn("removeLegacyStoreKeyFile", "删除旧密钥文件失败", [error]);
  }
};

const tryReadPlaintextStoreSnapshot = (userDataPath: string) => {
  try {
    return readPlaintextStoreSnapshot(userDataPath);
  } catch (error) {
    logWarn("tryReadPlaintextStoreSnapshot", "明文配置读取失败", [
      error,
      userDataPath,
    ]);
    return null;
  }
};

const resetCorruptedStoreFiles = () => {
  const configFilePath = getStoreConfigFilePath();
  const corruptedBackupPath = getStoreCorruptedBackupFilePath();

  if (fs.existsSync(configFilePath)) {
    try {
      fs.renameSync(configFilePath, corruptedBackupPath);
      logWarn("resetCorruptedStoreFiles", "已备份无法恢复的配置文件", [
        corruptedBackupPath,
      ]);
    } catch (error) {
      logWarn("resetCorruptedStoreFiles", "备份损坏配置失败，尝试直接删除", [
        error,
      ]);
      try {
        fs.unlinkSync(configFilePath);
      } catch (deleteError) {
        logWarn("resetCorruptedStoreFiles", "删除损坏配置失败", [deleteError]);
      }
    }
  }

  removeLegacyStoreKeyFile();
};

const recreateEncryptedStore = (userDataPath: string) => {
  removeLegacyStoreKeyFile();
  return createEncryptedStoreInstance(userDataPath, loadStoreEncryptionKey());
};

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

app.on("second-instance", () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }

  showMainWindow();
});

const updateTrayMenu = () => {
  if (!tray) return;

  const unreadTotal = getUnreadTotal();
  const contextMenu = Menu.buildFromTemplate([
    {
      label: unreadTotal > 0 ? `未读消息 ${unreadTotal} 条` : "暂无未读消息",
      enabled: false,
    },
    {
      label: "打开主窗口",
      click: () => showMainWindow(),
    },
    {
      label: "退出",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
};

const updateUnreadPresentation = () => {
  const unreadTotal = getUnreadTotal();
  const title = unreadTotal > 0 ? `(${unreadTotal}) ${APP_NAME}` : APP_NAME;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setTitle(title);

    const shouldFlash = unreadTotal > 0 && !mainWindow.isFocused();
    mainWindow.flashFrame(shouldFlash);
  }

  if (typeof app.setBadgeCount === "function") {
    app.setBadgeCount(unreadTotal);
  }

  if (tray) {
    tray.setToolTip(
      unreadTotal > 0 ? `${APP_NAME} (${unreadTotal} 条未读)` : APP_NAME,
    );
    updateTrayMenu();
  }
};

const incrementUnreadCount = (roomId: string) => {
  if (!roomId) return;
  unreadCountByRoom.set(roomId, (unreadCountByRoom.get(roomId) ?? 0) + 1);
  updateUnreadPresentation();
};

const clearUnreadCount = (roomId: string) => {
  if (!roomId) return;
  if (!unreadCountByRoom.has(roomId)) return;
  unreadCountByRoom.delete(roomId);
  updateUnreadPresentation();
};

const clearAllUnreadCounts = () => {
  if (unreadCountByRoom.size === 0) return;
  unreadCountByRoom.clear();
  updateUnreadPresentation();
};

const createTray = () => {
  if (tray) return;
  logInfo("createTray", "开始创建系统托盘");
  tray = new Tray(getWindowIconPath());
  tray.on("click", () => showMainWindow());
  updateUnreadPresentation();
  logInfo("createTray", "系统托盘创建完成");
};

const shouldCloseToTray = () => {
  if (isQuitting) return false;
  return true;
};

const isWindowAlive = (
  win: BrowserWindow | null | undefined,
): win is BrowserWindow => {
  if (!win) return false;
  if (win.isDestroyed()) return false;
  if (win.webContents.isDestroyed()) return false;
  return true;
};

/**
 * 统一获取 Store 实例的方法
 * 确保 Store 总是同步到当前 app.getPath('userData')
 */
const getStore = (): StoreInstance => {
  if (!store) {
    ensureStoreDirectory();
    const userDataPath = app.getPath("userData");
    const configFilePath = getStoreConfigFilePath();
    // 强制 cwd 为 userData 根目录，避免 electron-store 再套一层应用名文件夹
    try {
      store = recreateEncryptedStore(userDataPath);
      void store.store;
    } catch (error) {
      logWarn("getStore", "读取加密配置失败，尝试迁移或重建", [error]);

      if (fs.existsSync(configFilePath)) {
        storeEncryptionKey = null;
        const plaintextSnapshot = tryReadPlaintextStoreSnapshot(userDataPath);

        if (plaintextSnapshot) {
          const backupPath = getStoreBackupFilePath();
          fs.renameSync(configFilePath, backupPath);
          logInfo("getStore", "已备份明文配置并迁移为加密配置", [backupPath]);
          store = writeEncryptedStoreSnapshot(
            userDataPath,
            loadStoreEncryptionKey(),
            plaintextSnapshot,
          );
        } else {
          resetCorruptedStoreFiles();
          store = recreateEncryptedStore(userDataPath);
          void store.store;
        }
      } else {
        store = recreateEncryptedStore(userDataPath);
        void store.store;
      }
    }
  }
  return store;
};

ipcMain.handle("get-is-dev", () => !app.isPackaged);

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

ipcMain.handle(
  "show-system-notification",
  async (_event, payload: { title: string; body: string; roomId: string }) => {
    if (!Notification.isSupported()) return false;

    incrementUnreadCount(payload.roomId);

    const notification = new Notification({
      title: payload.title,
      body: payload.body,
      icon: getWindowIconPath(),
      silent: true,
    });

    notification.on("click", () => {
      showMainWindow();
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.webContents.send(
        "system-notification-navigate",
        payload.roomId,
      );
    });

    notification.show();
    return true;
  },
);

ipcMain.handle("clear-room-unread", async (_event, roomId: string) => {
  clearUnreadCount(roomId);
  return true;
});

ipcMain.handle("clear-all-unread", async () => {
  clearAllUnreadCounts();
  return true;
});

// Register handlers early so renderer can call them before app.whenReady if needed
ipcMain.handle("settings-get", async (_event, key: string) => {
  const currentStore = getStore();

  try {
    return currentStore.get(key);
  } catch (error) {
    logWarn("settings-get", "settings-get failed", [error]);
    return null;
  }
});

ipcMain.handle("settings-set", async (_event, key: string, value: unknown) => {
  const currentStore = getStore();
  try {
    currentStore.set(key as string, value);
    return true;
  } catch (error) {
    logWarn("settings-set", "settings-set failed", [error]);
    return false;
  }
});

ipcMain.handle("settings-delete", async (_event, key: string) => {
  const currentStore = getStore();
  try {
    currentStore.delete(key);
    return true;
  } catch (error) {
    logWarn("settings-delete", "settings-delete failed", [error]);
    return false;
  }
});

ipcMain.handle("settings-keys", async () => {
  const currentStore = getStore();
  try {
    return Object.keys(currentStore.store);
  } catch (error) {
    logWarn("settings-keys", "settings-keys failed", [error]);
    return [];
  }
});

ipcMain.handle("open-external", async (_event, url: string) => {
  try {
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

ipcMain.handle("wechat-sso-start", async (_event, url: string) => {
  if (!mainWindow) return { success: false, message: "mainWindow not ready" };
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return { success: false, message: "invalid url" };
  }

  const parseCallbackParams = (targetUrl: string) => {
    try {
      const parsed = new URL(targetUrl);
      const fromSearch = new URLSearchParams(parsed.search);
      const hash = parsed.hash || "";
      const qIndex = hash.indexOf("?");
      const fromHashQuery =
        qIndex >= 0
          ? new URLSearchParams(hash.slice(qIndex + 1))
          : new URLSearchParams("");
      const pick = (k: string) => fromSearch.get(k) ?? fromHashQuery.get(k);
      return {
        state: pick("state") || "",
        loginToken: pick("loginToken") || "",
        code: pick("code") || "",
        sub: pick("sub") || "",
        errMsg: pick("err_msg") || "",
      };
    } catch {
      return {
        state: "",
        loginToken: "",
        code: "",
        sub: "",
        errMsg: "",
      };
    }
  };

  const looksLikeFinalCallback = (targetUrl: string) => {
    const { state, loginToken, errMsg, sub } = parseCallbackParams(targetUrl);

    // 最终态信号：
    // 1) 已拿到 loginToken（可直接登录）
    // 2) bind_required（需要绑定）
    // 3) err_msg（后端显式错误）
    // 4) state=ok 且有 sub（部分后端会用此表示可继续流程）
    if (loginToken) return true;
    if (errMsg) return true;
    if (state === "bind_required") return true;
    if (state === "ok" && sub) return true;

    // 注意：仅有 code 且 state 为空通常是中间跳转，不能提前关闭窗口
    return false;
  };

  return await new Promise<{
    success: boolean;
    callbackUrl?: string;
    message?: string;
  }>((resolve) => {
    const authWin = new BrowserWindow({
      parent: mainWindow ?? undefined,
      modal: true,
      show: true,
      width: 520,
      height: 720,
      resizable: true,
      icon: getWindowIconPath(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
      },
    });

    let settled = false;
    const cleanupAndResolve = (payload: {
      success: boolean;
      callbackUrl?: string;
      message?: string;
    }) => {
      if (settled) return;
      settled = true;
      try {
        if (!authWin.isDestroyed()) authWin.close();
      } catch {
        // ignore
      }
      resolve(payload);
    };

    const tryCapture = (targetUrl: string, event?: Electron.Event) => {
      if (!looksLikeFinalCallback(targetUrl)) return;
      const maybePreventable = event as
        | (Electron.Event & { preventDefault?: () => void })
        | undefined;
      if (
        maybePreventable &&
        typeof maybePreventable.preventDefault === "function"
      ) {
        try {
          maybePreventable.preventDefault();
        } catch {
          // ignore
        }
      }
      cleanupAndResolve({ success: true, callbackUrl: targetUrl });
    };

    const timeout = setTimeout(
      () => {
        cleanupAndResolve({ success: false, message: "timeout" });
      },
      5 * 60 * 1000,
    );

    authWin.on("closed", () => {
      clearTimeout(timeout);
      if (!settled) resolve({ success: false, message: "window_closed" });
    });

    authWin.webContents.on("will-redirect", (event, targetUrl) =>
      tryCapture(targetUrl, event),
    );
    authWin.webContents.on("will-navigate", (event, targetUrl) =>
      tryCapture(targetUrl, event),
    );
    authWin.webContents.on("did-redirect-navigation", (_event, targetUrl) =>
      tryCapture(targetUrl),
    );
    authWin.webContents.on("did-navigate", (_event, targetUrl) =>
      tryCapture(targetUrl),
    );

    authWin.loadURL(url).catch((err) => {
      clearTimeout(timeout);
      cleanupAndResolve({ success: false, message: String(err) });
    });
  });
});

const createWindow = () => {
  logInfo("createWindow", "开始创建主窗口");
  const win = new BrowserWindow({
    title: APP_NAME,
    icon: getWindowIconPath(),
    width: NORMAL_WINDOW_SIZE.width,
    height: NORMAL_WINDOW_SIZE.height,
    minWidth: NORMAL_WINDOW_SIZE.width,
    minHeight: NORMAL_WINDOW_SIZE.height,
    frame: false, // 移除系统边框和标题栏
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  // 移除顶部菜单栏
  win.setMenu(null);

  mainWindow = win;
  let windowClosed = false;

  // Check for dev server URL from environment
  // Electron 严格从环境变量读取端口
  const port = process.env.VITE_PORT;
  const devServerUrl =
    process.env.VITE_DEV_SERVER_URL || `http://localhost:${port}`;

  // Decide whether to load dev server or static file
  if (!app.isPackaged) {
    logInfo("createWindow", "加载开发环境页面", [devServerUrl]);
    win.loadURL(devServerUrl);
  } else {
    // 打包后使用自定义 app:// 协议承载前端，保证 History 路由刷新不 404
    logInfo("createWindow", "加载桌面应用页面", [`${APP_PROTOCOL}://-/`]);
    win.loadURL(`${APP_PROTOCOL}://-/`);
  }

  // DevTools logic
  if (process.env.ELECTRON_DEV_TOOLS === "true") {
    win.webContents.openDevTools();
  }

  // Window Controls IPC
  ipcMain.on("window-minimize", () => win.minimize());
  ipcMain.on("window-maximize", () => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on("window-close", () => win.close());

  win.on("close", (event) => {
    if (!shouldCloseToTray()) return;
    event.preventDefault();
    win.hide();
    win.flashFrame(false);
  });

  // 发送窗口状态给渲染进程，用于 UI 图标切换（最大化/还原）
  win.on("maximize", () => {
    if (!isWindowAlive(win) || windowClosed) return;
    win.webContents.send("window-maximized-status", true);
  });
  win.on("unmaximize", () => {
    if (!isWindowAlive(win) || windowClosed) return;
    win.webContents.send("window-maximized-status", false);
  });

  win.on("closed", () => {
    windowClosed = true;
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  win.on("focus", () => {
    if (!isWindowAlive(win) || windowClosed) return;
    win.flashFrame(false);
  });

  // 统一处理 window.open 打开的子窗口，复用主窗口图标
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

    return { action: "deny" };
  });
};

app.whenReady().then(async () => {
  try {
    logInfo("app.whenReady", "Electron ready 事件已触发");
    // 确保 store 实例在路径重定向生效后才被创建
    // 使用 getStore() 确保它指向正确的 userData (无论是在 Temp 还是用户选定的目录)
    getStore();

    if (app.isPackaged) {
      registerAppProtocol();
    }

    createTray();
    createWindow();
    updateUnreadPresentation();
    logInfo("app.whenReady", "主进程启动完成");

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else showMainWindow();
    });
  } catch (error) {
    logError("app.whenReady", "应用启动失败", [error]);
    dialog.showErrorBox(
      "应用启动失败",
      error instanceof Error ? error.message : String(error),
    );
    app.exit(1);
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

process.on("uncaughtException", (error) => {
  logError("process.uncaughtException", "主进程未捕获异常", [error]);
});

process.on("unhandledRejection", (reason) => {
  logError("process.unhandledRejection", "主进程未处理 Promise 拒绝", [
    reason,
  ]);
});
