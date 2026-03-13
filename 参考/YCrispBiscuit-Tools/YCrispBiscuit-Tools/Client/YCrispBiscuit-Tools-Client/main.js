import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('isDev:', isDev);

function createWindow() {
  console.log('Creating Electron window...');
  
  // 移除默认菜单栏
  Menu.setApplicationMenu(null);
  
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      // 添加对ES模块的支持
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  });

  // 加载应用
  if (isDev) {
    console.log('Loading development URL: http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000'); // Vite开发服务器
  } else {
    console.log('Loading production file');
    // 生产环境：加载本地文件
    const indexPath = path.join(__dirname, 'dist/index.html');
    console.log('📁 Loading file from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load page:', errorCode, errorDescription);
  });

  // 监听JavaScript控制台错误
  mainWindow.webContents.on('console-message', (event) => {
    // 使用新的Event格式来避免弃用警告
    if (event.level === 3) { // Error level
      console.error('❌ JavaScript Error:', event.message, 'at', event.sourceId + ':' + event.line);
    }
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('✅ DOM ready - Vue app should be loading...');

    // 暂时简化检查，只记录基本信息
    setTimeout(() => {
      mainWindow.webContents.executeJavaScript(`
        console.log('📊 Basic page info:', {
          title: document.title,
          hasApp: !!document.getElementById('app'),
          url: window.location.href
        });
      `).catch(err => {
        console.error('❌ Basic check failed:', err.message);
      });
    }, 2000); // 等待2秒让Vue应用初始化
  });
}

// 当Electron完成初始化时调用
app.whenReady().then(createWindow);

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
