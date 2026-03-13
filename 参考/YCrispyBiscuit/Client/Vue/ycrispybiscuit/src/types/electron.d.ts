export interface IElectronAPI {
  getSetting: (key: string) => Promise<unknown>
  setSetting: (key: string, value: unknown) => Promise<boolean>
  removeSetting: (key: string) => Promise<boolean>
  getAllKeys: () => Promise<string[]>
  confirmDataPath: () => Promise<{ success: boolean; path?: string; message?: string }>
  confirmInstallPath: () => Promise<{ success: boolean; path?: string }>
  getIsDev: () => Promise<boolean>
  getAppPath: () => Promise<string>
  executeSetup: (config: { installPath: string, dataPath: string }) => Promise<{ success: boolean; message?: string; targetPath?: string }>
  launchApp: (targetPath: string) => Promise<boolean>
  minimize: () => void
  maximize: () => void
  close: () => void
  onMaximizedStatus: (callback: (isMaximized: boolean) => void) => void
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
