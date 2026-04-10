import type { LogPayload } from "../../logger";

export interface IElectronAPI {
  writeLog: (payload: LogPayload) => Promise<boolean>;
  getSetting: (key: string) => Promise<unknown>;
  setSetting: (key: string, value: unknown) => Promise<boolean>;
  removeSetting: (key: string) => Promise<boolean>;
  getAllKeys: () => Promise<string[]>;
  openExternal: (url: string) => Promise<boolean>;
  startWechatSSO: (
    url: string,
  ) => Promise<{ success: boolean; callbackUrl?: string; message?: string }>;
  getIsDev: () => Promise<boolean>;
  showSystemNotification: (payload: {
    title: string;
    body: string;
    roomId: string;
  }) => Promise<boolean>;
  clearRoomUnread: (roomId: string) => Promise<boolean>;
  clearAllUnread: () => Promise<boolean>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  onMaximizedStatus: (callback: (isMaximized: boolean) => void) => void;
  onSystemNotificationNavigate: (callback: (roomId: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
