export interface IElectronAPI {
  getSetting: (key: string) => Promise<unknown>
  setSetting: (key: string, value: unknown) => Promise<boolean>
  removeSetting: (key: string) => Promise<boolean>
  getAllKeys: () => Promise<string[]>
  openExternal: (url: string) => Promise<boolean>
  startWechatSSO: (url: string) => Promise<{ success: boolean; callbackUrl?: string; message?: string }>
  confirmDataPath: () => Promise<{ success: boolean; path?: string; message?: string }>
  confirmInstallPath: () => Promise<{ success: boolean; path?: string }>
  getIsDev: () => Promise<boolean>
  getAppPath: () => Promise<string>
  executeSetup: (config: { installPath: string, dataPath: string }) => Promise<{ success: boolean; message?: string; targetPath?: string }>
  launchApp: (targetPath: string) => Promise<boolean>
  showSystemNotification: (payload: { title: string; body: string; roomId: string }) => Promise<boolean>
  clearRoomUnread: (roomId: string) => Promise<boolean>
  clearAllUnread: () => Promise<boolean>
  minimize: () => void
  maximize: () => void
  close: () => void
  onMaximizedStatus: (callback: (isMaximized: boolean) => void) => void
  onSystemNotificationNavigate: (callback: (roomId: string) => void) => void
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
