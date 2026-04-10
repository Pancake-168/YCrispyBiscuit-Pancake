import { contextBridge, ipcRenderer } from "electron";
import type { LogPayload } from "../logger";

contextBridge.exposeInMainWorld("electronAPI", {
  writeLog: (payload: LogPayload) => ipcRenderer.invoke("write-log", payload),
  // Settings/Store
  getSetting: (key: string) => ipcRenderer.invoke("settings-get", key),
  setSetting: (key: string, value: unknown) =>
    ipcRenderer.invoke("settings-set", key, value),
  removeSetting: (key: string) => ipcRenderer.invoke("settings-delete", key),
  getAllKeys: () => ipcRenderer.invoke("settings-keys"),

  // External navigation
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),

  // WeChat SSO (in-app window)
  startWechatSSO: (url: string) => ipcRenderer.invoke("wechat-sso-start", url),

  getIsDev: () => ipcRenderer.invoke("get-is-dev"),
  showSystemNotification: (payload: {
    title: string;
    body: string;
    roomId: string;
  }) => ipcRenderer.invoke("show-system-notification", payload),
  clearRoomUnread: (roomId: string) =>
    ipcRenderer.invoke("clear-room-unread", roomId),
  clearAllUnread: () => ipcRenderer.invoke("clear-all-unread"),

  // Window Controls
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),

  // UI State Monitoring
  // 监听窗口最大化状态变化，供 Vue 组件更新按钮图标
  onMaximizedStatus: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on("window-maximized-status", (_event, value) =>
      callback(value),
    );
  },
  onSystemNotificationNavigate: (callback: (roomId: string) => void) => {
    ipcRenderer.on("system-notification-navigate", (_event, roomId) =>
      callback(roomId),
    );
  },
});
