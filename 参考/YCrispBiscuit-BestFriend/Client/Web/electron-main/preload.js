const { contextBridge, ipcRenderer } = require('electron');

// 暴露窗口控制和有效外观 API
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  // 大小和位置（有效）
  setSize: (width, height) => ipcRenderer.send('window-set-size', width, height),
  setPosition: (x, y) => ipcRenderer.send('window-set-position', x, y),
  getSize: () => ipcRenderer.invoke('window-get-size'),
  getPosition: () => ipcRenderer.invoke('window-get-position'),
});