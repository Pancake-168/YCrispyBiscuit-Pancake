import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VITE_URL = 'http://localhost:5174';
const isDev = process.env.NODE_ENV === 'development';
console.log('Electron main starting. NODE_ENV:', process.env.NODE_ENV);

// 已移除在主进程中直接启动或管理后端进程的逻辑。
// 以后仅保留窗口与 IPC 交互（按需再添加）。

function createWindow() {
  console.log('Creating Electron window...');
  Menu.setApplicationMenu(null);

  
const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // 隐藏默认标题栏（frameless窗口）
    webPreferences: {
      nodeIntegration: false, // 禁用Node.js集成，安全
      contextIsolation: true, // 启用上下文隔离，安全
      enableRemoteModule: false, // 禁用remote模块，安全
      webSecurity: true, // 启用Web安全
      allowRunningInsecureContent: false, // 禁用不安全内容
      experimentalFeatures: false, // 禁用实验性功能
      preload: path.join(__dirname, 'preload.js') // 预加载脚本
    }
  });

  // 图标
  try {
    const candidates = ['icon.png', 'icon.ico'];
    for (const file of candidates) {
      const p = path.join(__dirname, file);
      if (fs.existsSync(p)) {
        try {
          mainWindow.setIcon(p);
          console.log('✅ Using icon:', p);
          break;
        } catch (e) {
          console.warn('Icon set failed:', e?.message);
        }
      }
    }
  } catch (e) {
    console.warn('Icon check error:', e?.message);
  }

  if (isDev) {
    mainWindow.loadURL(VITE_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  if (isDev && process.env.ELECTRON_OPEN_DEVTOOLS === 'true') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('dom-ready', () => {
    console.log('✅ DOM ready');
  });

  // IPC 处理器：窗口控制
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow.close());

  // IPC 处理器：外观设置（只保留有效的）
  ipcMain.on('window-set-size', (event, width, height) => mainWindow.setSize(width, height));
  ipcMain.on('window-set-position', (event, x, y) => mainWindow.setPosition(x, y));
  ipcMain.handle('window-get-size', () => mainWindow.getSize());
  ipcMain.handle('window-get-position', () => mainWindow.getPosition());
}

app.whenReady().then(createWindow);

// 无需在退出时清理后端外部进程（已移除相关功能）。
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });