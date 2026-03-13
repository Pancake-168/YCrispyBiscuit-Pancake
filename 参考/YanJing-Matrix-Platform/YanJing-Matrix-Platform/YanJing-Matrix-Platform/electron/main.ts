import { app, BrowserWindow, ipcMain, dialog, shell, protocol, Notification, Menu, Tray } from 'electron'
import path from 'path'
import dotenv from 'dotenv'
import Store from 'electron-store'
import fs from 'fs'
import { exec } from 'child_process'

const APP_PROTOCOL = 'app'

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
])

const registerAppProtocol = () => {
  // dist-electron 与 dist 是同级目录（无论开发还是打包）
  const distRoot = path.join(__dirname, '..', 'dist')

  protocol.registerFileProtocol(APP_PROTOCOL, (request, callback) => {
    try {
      const url = new URL(request.url)
      const rawPath = decodeURIComponent(url.pathname || '/')
      const normalizedPath = rawPath.replace(/^\/+/, '')

      // 1) 静态资源（有扩展名）直接映射到 dist 下对应文件
      // 2) 其余（如 /chat、/login）统一回退到 index.html（History 模式必须）
      const isAssetRequest = path.extname(normalizedPath) !== ''
      const relFile = isAssetRequest ? normalizedPath : 'index.html'

      const resolved = path.normalize(path.join(distRoot, relFile))
      if (!resolved.startsWith(path.normalize(distRoot))) {
        callback({ path: path.join(distRoot, 'index.html') })
        return
      }
      callback({ path: resolved })
    } catch {
      callback({ path: path.join(distRoot, 'index.html') })
    }
  })
}

// 1. 尽力加载环境变量 (优先识别打包后的路径)
const getEnvPath = () => {
    if (app.isPackaged) {
        // 打包后，文件位于 resources/app/.env.production 或被打在 asar 里
        // 尝试多个可能的位置
        const paths = [
            path.join(process.resourcesPath, 'app', '.env.production'),
            path.join(__dirname, '..', '.env.production'),
            path.join(app.getAppPath(), '.env.production')
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) return p;
        }
    }
    return path.join(process.cwd(), '.env.development');
};

const envPath = getEnvPath();
dotenv.config({ path: envPath });

// 如果环境变量加载失败，从 package.json 获取一个硬编码的保底值
const APP_NAME = process.env.VITE_APP_NAME || 'RegionAI';

// 设置应用名称，这会影响系统菜单、对话框标题以及默认磁盘路径名
app.setName(APP_NAME);

/**
 * 助手函数：获取当前真正“物理”所在的目录
 * 打包成便携版后，process.execPath 可能在 Temp 下，
 * process.env.PORTABLE_EXECUTABLE_DIR 才是用户双击的那个目录。
 */
const getAppBaseDir = () => {
    if (!app.isPackaged) return process.cwd();
    return process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
}

// 外部路径配置文件
const CONFIG_FILE_PATH = path.join(getAppBaseDir(), 'data-path-config.json')

interface AppConfig {
  userDataPath?: string;
}

/**
 * 核心逻辑：从外部文件中读取用户确认过的数据存放路径
 */
function initializeDataPath() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8')
      if (configContent) {
        const config = JSON.parse(configContent) as AppConfig
        if (config.userDataPath) {
          if (!fs.existsSync(config.userDataPath)) {
            fs.mkdirSync(config.userDataPath, { recursive: true })
          }
          app.setPath('userData', config.userDataPath)
          console.log('[System:main.ts:initializeDataPath] UserData redirected to:', config.userDataPath)
        }
      }
    } else {
      // 使用环境变量获取 TEMP 目录，避免过早调用 app.getPath('temp') 触发默认路径创建
      const sysTemp = process.env.TEMP || process.env.TMP || (process.platform === 'darwin' ? '/tmp' : '/var/tmp');
      const setupTempPath = path.join(sysTemp, `${APP_NAME.toLowerCase().replace(/\s+/g, '-')}-setup-mode`);
      
      if (!fs.existsSync(setupTempPath)) {
        fs.mkdirSync(setupTempPath, { recursive: true });
      }
      app.setPath('userData', setupTempPath);
      console.log(`[System:main.ts:initializeDataPath][${APP_NAME}] 运行于安装模式，数据已临时重定向至 Temp`);
    }
  } catch (err) {
    console.warn('[System:main.ts:initializeDataPath] 初始化路径失败:', err)
  }
}

// 必须在开头尽早调用
initializeDataPath()

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

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false
const unreadCountByRoom = new Map<string, number>()

const NORMAL_WINDOW_SIZE = { width: 1200, height: 800 }
const SETUP_WINDOW_SIZE = { width: 560, height: 760 }

const getWindowIconPath = () => path.join(__dirname, app.isPackaged ? '../dist/icon.png' : '../public/icon.png')

const getUnreadTotal = () => {
  let total = 0
  for (const count of unreadCountByRoom.values()) {
    total += count
  }
  return total
}

const showMainWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) return

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show()
  }

  mainWindow.focus()
}

const updateTrayMenu = () => {
  if (!tray) return

  const unreadTotal = getUnreadTotal()
  const contextMenu = Menu.buildFromTemplate([
    {
      label: unreadTotal > 0 ? `未读消息 ${unreadTotal} 条` : '暂无未读消息',
      enabled: false,
    },
    {
      label: '打开主窗口',
      click: () => showMainWindow(),
    },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
}

const updateUnreadPresentation = () => {
  const unreadTotal = getUnreadTotal()
  const title = unreadTotal > 0 ? `(${unreadTotal}) ${APP_NAME}` : APP_NAME

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setTitle(title)

    const shouldFlash = unreadTotal > 0 && !mainWindow.isFocused()
    mainWindow.flashFrame(shouldFlash)
  }

  if (typeof app.setBadgeCount === 'function') {
    app.setBadgeCount(unreadTotal)
  }

  if (tray) {
    tray.setToolTip(unreadTotal > 0 ? `${APP_NAME} (${unreadTotal} 条未读)` : APP_NAME)
    updateTrayMenu()
  }
}

const incrementUnreadCount = (roomId: string) => {
  if (!roomId) return
  unreadCountByRoom.set(roomId, (unreadCountByRoom.get(roomId) ?? 0) + 1)
  updateUnreadPresentation()
}

const clearUnreadCount = (roomId: string) => {
  if (!roomId) return
  if (!unreadCountByRoom.has(roomId)) return
  unreadCountByRoom.delete(roomId)
  updateUnreadPresentation()
}

const clearAllUnreadCounts = () => {
  if (unreadCountByRoom.size === 0) return
  unreadCountByRoom.clear()
  updateUnreadPresentation()
}

const createTray = () => {
  if (tray) return
  tray = new Tray(getWindowIconPath())
  tray.on('click', () => showMainWindow())
  updateUnreadPresentation()
}

const shouldCloseToTray = (win: BrowserWindow) => {
  if (isQuitting) return false

  try {
    const currentUrl = win.webContents.getURL() || ''
    if (isSetupRouteUrl(currentUrl)) {
      return false
    }
  } catch {
    return false
  }

  return true
}

const isSetupRouteUrl = (urlText: string): boolean => {
  try {
    const parsed = new URL(urlText)
    const routePath = parsed.pathname
    return routePath === '/setup' || routePath.endsWith('/setup')
  } catch {
    return false
  }
}

const isWindowAlive = (win: BrowserWindow | null | undefined): win is BrowserWindow => {
  if (!win) return false
  if (win.isDestroyed()) return false
  if (win.webContents.isDestroyed()) return false
  return true
}

const applyWindowSizeByRoute = (win: BrowserWindow, urlText?: string) => {
  if (!isWindowAlive(win)) return

  let currentUrl = urlText || ''
  if (!currentUrl) {
    try {
      currentUrl = win.webContents.getURL() || ''
    } catch {
      return
    }
  }

  const setupMode = isSetupRouteUrl(currentUrl)
  const target = setupMode ? SETUP_WINDOW_SIZE : NORMAL_WINDOW_SIZE

  const minSize = setupMode
    ? { width: SETUP_WINDOW_SIZE.width, height: SETUP_WINDOW_SIZE.height }
    : { width: NORMAL_WINDOW_SIZE.width, height: NORMAL_WINDOW_SIZE.height }

  try {
    if (!isWindowAlive(win)) return
    win.setMinimumSize(minSize.width, minSize.height)

    const [currentWidth, currentHeight] = win.getSize()
    if (currentWidth === target.width && currentHeight === target.height) return

    win.setSize(target.width, target.height, true)
    win.center()
  } catch {
    // 窗口关闭过程中偶发导航事件，安全忽略
  }
}

/**
 * 统一获取 Store 实例的方法
 * 确保无论是在安装模式还是正式模式，Store 总是同步到最新的 app.getPath('userData')
 */
const getStore = (): StoreInstance => {
    if (!store) {
        const userDataPath = app.getPath('userData');
        // 关键：强制 cwd 为 userData 根目录，避免 electron-store 再套一层应用名文件夹
        // 这也保证了 execute-setup 写入的路径 with 后续读取的路径 100% 一致
        store = new Store({ cwd: userDataPath }) as unknown as StoreInstance;
    }
    return store;
}

ipcMain.handle('get-is-dev', () => !app.isPackaged);

ipcMain.handle('show-system-notification', async (_event, payload: { title: string; body: string; roomId: string }) => {
  if (!Notification.isSupported()) return false

  incrementUnreadCount(payload.roomId)

  const notification = new Notification({
    title: payload.title,
    body: payload.body,
    icon: getWindowIconPath(),
  })

  notification.on('click', () => {
    showMainWindow()
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.webContents.send('system-notification-navigate', payload.roomId)
  })

  notification.show()
  return true
})

ipcMain.handle('clear-room-unread', async (_event, roomId: string) => {
  clearUnreadCount(roomId)
  return true
})

ipcMain.handle('clear-all-unread', async () => {
  clearAllUnreadCounts()
  return true
})

// Register handlers early so renderer can call them before app.whenReady if needed
ipcMain.handle('settings-get', async (_event, key: string) => {
  const currentStore = getStore();
  
  // 核心防御：如果配置文件不存在，说明用户尚未完成初始化配置
  // 强制返回 is_installed 为 false，防止受旧 AppData 缓存干扰
  if (key === 'is_installed') {
    const configExists = fs.existsSync(CONFIG_FILE_PATH)
    if (!configExists) return false
  }

  try {
    return currentStore.get(key)
  } catch (error) {
    console.warn('[System:main.ts:settings-get] settings-get failed:', error)
    return null
  }
})

ipcMain.handle('settings-set', async (_event, key: string, value: unknown) => {
  const currentStore = getStore();
  try {
    currentStore.set(key as string, value)
    return true
  } catch (error) {
    console.warn('[System:main.ts:settings-set] settings-set failed:', error)
    return false
  }
})

ipcMain.handle('settings-delete', async (_event, key: string) => {
  const currentStore = getStore();
  try {
    currentStore.delete(key)
    return true
  } catch (error) {
    console.warn('[System:main.ts:settings-delete] settings-delete failed:', error)
    return false
  }
})

ipcMain.handle('settings-keys', async () => {
  const currentStore = getStore();
  try {
    return Object.keys(currentStore.store)
  } catch (error) {
    console.warn('[System:main.ts:settings-keys] settings-keys failed:', error)
    return []
  }
})

ipcMain.handle('open-external', async (_event, url: string) => {
  try {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      console.warn('[System:main.ts:open-external] open-external rejected url:', url)
      return false
    }
    await shell.openExternal(url)
    return true
  } catch (error) {
    console.warn('[System:main.ts:open-external] open-external failed:', error)
    return false
  }
})

ipcMain.handle('wechat-sso-start', async (_event, url: string) => {
  if (!mainWindow) return { success: false, message: 'mainWindow not ready' }
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return { success: false, message: 'invalid url' }
  }

  const parseCallbackParams = (targetUrl: string) => {
    try {
      const parsed = new URL(targetUrl)
      const fromSearch = new URLSearchParams(parsed.search)
      const hash = parsed.hash || ''
      const qIndex = hash.indexOf('?')
      const fromHashQuery = qIndex >= 0 ? new URLSearchParams(hash.slice(qIndex + 1)) : new URLSearchParams('')
      const pick = (k: string) => fromSearch.get(k) ?? fromHashQuery.get(k)
      return {
        state: pick('state') || '',
        loginToken: pick('loginToken') || '',
        code: pick('code') || '',
        sub: pick('sub') || '',
        errMsg: pick('err_msg') || '',
      }
    } catch {
      return {
        state: '',
        loginToken: '',
        code: '',
        sub: '',
        errMsg: '',
      }
    }
  }

  const looksLikeFinalCallback = (targetUrl: string) => {
    const { state, loginToken, errMsg, sub } = parseCallbackParams(targetUrl)

    // 最终态信号：
    // 1) 已拿到 loginToken（可直接登录）
    // 2) bind_required（需要绑定）
    // 3) err_msg（后端显式错误）
    // 4) state=ok 且有 sub（部分后端会用此表示可继续流程）
    if (loginToken) return true
    if (errMsg) return true
    if (state === 'bind_required') return true
    if (state === 'ok' && sub) return true

    // 注意：仅有 code 且 state 为空通常是中间跳转，不能提前关闭窗口
    return false
  }

  return await new Promise<{ success: boolean; callbackUrl?: string; message?: string }>((resolve) => {
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
    })

    let settled = false
    const cleanupAndResolve = (payload: { success: boolean; callbackUrl?: string; message?: string }) => {
      if (settled) return
      settled = true
      try {
        if (!authWin.isDestroyed()) authWin.close()
      } catch {
        // ignore
      }
      resolve(payload)
    }

    const tryCapture = (targetUrl: string, event?: Electron.Event) => {
      if (!looksLikeFinalCallback(targetUrl)) return
      const maybePreventable = event as (Electron.Event & { preventDefault?: () => void }) | undefined
      if (maybePreventable && typeof maybePreventable.preventDefault === 'function') {
        try {
          maybePreventable.preventDefault()
        } catch {
          // ignore
        }
      }
      cleanupAndResolve({ success: true, callbackUrl: targetUrl })
    }

    const timeout = setTimeout(() => {
      cleanupAndResolve({ success: false, message: 'timeout' })
    }, 5 * 60 * 1000)

    authWin.on('closed', () => {
      clearTimeout(timeout)
      if (!settled) resolve({ success: false, message: 'window_closed' })
    })

    authWin.webContents.on('will-redirect', (event, targetUrl) => tryCapture(targetUrl, event))
    authWin.webContents.on('will-navigate', (event, targetUrl) => tryCapture(targetUrl, event))
    authWin.webContents.on('did-redirect-navigation', (_event, targetUrl) => tryCapture(targetUrl))
    authWin.webContents.on('did-navigate', (_event, targetUrl) => tryCapture(targetUrl))

    authWin.loadURL(url).catch((err) => {
      clearTimeout(timeout)
      cleanupAndResolve({ success: false, message: String(err) })
    })
  })
})

/**
 * 开放修改权限：弹出对话框让用户确认新的数据存放位置
 * 并将其持久化到 EXE 同级目录的配置文件中
 */
ipcMain.handle('open-data-path-confirmation', async () => {
  const result = await dialog.showOpenDialog({
    title: '用户确认：选择数据存档存放位置',
    buttonLabel: '确认选择此目录',
    properties: ['openDirectory', 'createDirectory']
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0]
    return { success: true, path: selectedPath }
  }
  return { success: false }
})

/**
 * 开放修改权限：弹出对话框让用户确认软件“安装/存放”位置
 */
ipcMain.handle('open-install-path-confirmation', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择软件安装目录',
    buttonLabel: '就装在这里',
    properties: ['openDirectory', 'createDirectory']
  })

  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] }
  }
  return { success: false }
})

/**
 * 获取当前程序的基础路径
 */
ipcMain.handle('get-app-path', () => {
  return getAppBaseDir()
})

/**
 * 执行超级安装逻辑：搬运自己，配置数据，创建快捷方式
 */
ipcMain.handle('execute-setup', async (_event, config: { installPath: string, dataPath: string }) => {
  try {
    const isPackaged = app.isPackaged;
    
    // 【优化结构】
    // EXE 放在用户选的安装目录根目录下
    const targetExeFolder = config.installPath;
    const targetExePath = path.join(targetExeFolder, `${APP_NAME}.exe`);
    
    // 数据文件夹名为 'app_data'，放在用户选的数据目录里，保持外部美观
    const finalUserDataPath = path.join(config.dataPath, 'app_data');
    
    const sourceExePath = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
    
    // 1. 确保目录存在
    if (!fs.existsSync(targetExeFolder)) {
      fs.mkdirSync(targetExeFolder, { recursive: true });
    }
    if (!fs.existsSync(finalUserDataPath)) {
      fs.mkdirSync(finalUserDataPath, { recursive: true });
    }

    // 2. 如果是打包后的便携版，把自己这个单个 EXE 复制过去
    if (isPackaged) {
      fs.copyFileSync(sourceExePath, targetExePath);
      
      // 3. 在目标 EXE 旁边写入路径配置文件，指向我们新建的 app_data 文件夹
      const targetConfigPath = path.join(targetExeFolder, 'data-path-config.json');
      fs.writeFileSync(targetConfigPath, JSON.stringify({ userDataPath: finalUserDataPath }, null, 2));

      // 4. 重要：立即更新当前进程的路径并刷新 store
      app.setPath('userData', finalUserDataPath);
      store = null; // 强制清除原有 store 实例，下次 getStore() 时会创建指向新 cwd 的实例
      getStore().set('is_installed', true);

      // 5. 创建桌面快捷方式 (Windows)
      if (process.platform === 'win32') {
        const desktopPath = app.getPath('desktop');
        const shortcutPath = path.join(desktopPath, `${APP_NAME}.lnk`);
        // 增加 WorkingDirectory 确保图标和相对路径能选对
        const createShortcutCmd = `powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('${shortcutPath}');$s.TargetPath='${targetExePath}';$s.WorkingDirectory='${targetExeFolder}';$s.Save()"`;
        exec(createShortcutCmd);
      }
    }

    return { success: true, targetPath: targetExePath }
  } catch (err: unknown) {
    console.warn('[System:main.ts:execute-setup] Setup failed:', err);
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message }
  }
})

/**
 * 启动生产环境的应用并退出安装程序
 */
ipcMain.handle('launch-app', (_event, targetPath: string) => {
  if (fs.existsSync(targetPath)) {
    // 获取当前安装器正在使用的临时数据目录
    const tempUserData = app.getPath('userData');
    
    // 启动新程序
    shell.openPath(targetPath)
    
    // 如果当前的 userData 包含 setup-mode，说明在 C 盘产生了临时垃圾，需要清理
    const setupModeFlag = `${APP_NAME.toLowerCase().replace(/\s+/g, '-')}-setup-mode`;
    if (tempUserData.includes(setupModeFlag)) {
      console.log(`[System:main.ts:launch-app][${APP_NAME}] 正在清理安装模式临时文件:`, tempUserData);
      // 使用延迟清理：使用 PowerShell 彻底删除目录，不受进程占用影响
      const cleanupCmd = `start /b "" cmd /c "timeout /t 3 >nul & powershell -Command \\"Remove-Item -Recurse -Force '${tempUserData}'\\""`;
      exec(cleanupCmd);
    }

    // 强行退出，不触发任何确认对话框，确保安装器窗口消失
    setTimeout(() => {
      app.exit(0);
    }, 500);
    return true
  }
  return false
})

const createWindow = () => {
  const preferSetupWindow = app.isPackaged && !fs.existsSync(CONFIG_FILE_PATH)
  const initialSize = preferSetupWindow ? SETUP_WINDOW_SIZE : NORMAL_WINDOW_SIZE
  const initialMinSize = preferSetupWindow ? SETUP_WINDOW_SIZE : NORMAL_WINDOW_SIZE

  const win = new BrowserWindow({
    title: APP_NAME,
    icon: getWindowIconPath(),
    width: initialSize.width,
    height: initialSize.height,
    minWidth: initialMinSize.width,
    minHeight: initialMinSize.height,
    frame: false, // 移除系统边框和标题栏
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), 
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  })

  // 移除顶部菜单栏
  win.setMenu(null)

  mainWindow = win
  let windowClosed = false

  // Check for dev server URL from environment
  // Electron 严格从环境变量读取端口
  const port = process.env.VITE_PORT
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || `http://localhost:${port}`
  
  // Decide whether to load dev server or static file
  if (!app.isPackaged) {
    win.loadURL(devServerUrl)
  } else {
    // 打包后使用自定义 app:// 协议承载前端，保证 History 路由刷新不 404
    win.loadURL(`${APP_PROTOCOL}://-/`)
  }

  // DevTools logic
  if (process.env.ELECTRON_DEV_TOOLS === 'true') {
    win.webContents.openDevTools()
  }

  // Window Controls IPC
  ipcMain.on('window-minimize', () => win.minimize())
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on('window-close', () => win.close())

  win.on('close', (event) => {
    if (!shouldCloseToTray(win)) return
    event.preventDefault()
    win.hide()
    win.flashFrame(false)
  })

  // 发送窗口状态给渲染进程，用于 UI 图标切换（最大化/还原）
  win.on('maximize', () => {
    if (!isWindowAlive(win) || windowClosed) return
    win.webContents.send('window-maximized-status', true)
  })
  win.on('unmaximize', () => {
    if (!isWindowAlive(win) || windowClosed) return
    win.webContents.send('window-maximized-status', false)
  })

  win.on('closed', () => {
    windowClosed = true
    if (mainWindow === win) {
      mainWindow = null
    }
  })

  win.on('focus', () => {
    if (!isWindowAlive(win) || windowClosed) return
    win.flashFrame(false)
  })

  win.webContents.on('did-finish-load', () => {
    if (windowClosed || !isWindowAlive(win)) return
    applyWindowSizeByRoute(win)
  })

  win.webContents.on('did-navigate-in-page', (_event, urlText) => {
    if (windowClosed || !isWindowAlive(win)) return
    applyWindowSizeByRoute(win, urlText)
  })

  win.webContents.on('did-navigate', (_event, urlText) => {
    if (windowClosed || !isWindowAlive(win)) return
    applyWindowSizeByRoute(win, urlText)
  })

  // 统一处理 window.open 打开的子窗口，复用主窗口图标
  win.webContents.setWindowOpenHandler(({ url }) => {
    const child = new BrowserWindow({
      parent: win,
      show: true,
      width: 1000,
      height: 760,
      icon: getWindowIconPath(),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
      },
    })

    child.setMenu(null)
    child.loadURL(url)

    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  
  // 确保 store 实例在路径重定向生效后才被创建
  // 使用 getStore() 确保它指向正确的 userData (无论是在 Temp 还是用户选定的目录)
  getStore();

  if (app.isPackaged) {
    registerAppProtocol()
  }

  createTray()
  createWindow()
  updateUnreadPresentation()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else showMainWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
