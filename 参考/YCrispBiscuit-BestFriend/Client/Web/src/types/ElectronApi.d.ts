export {};

declare global {
  interface ElectronAPI {
    // 目前已不提供进程/后端管理相关方法；按需再扩展。
  }
  interface Window {
    electronAPI?: ElectronAPI;
  }
}