/**
 * ============================================================================
 * Electron API 类型声明
 * ============================================================================
 *
 * 为 window.electronAPI 提供 TypeScript 类型支持。
 * Vue 组件中直接使用 window.electronAPI.xxx，TypeScript 会自动推断参数和返回值类型。
 *
 * 与 preload.ts 中的 contextBridge.exposeInMainWorld 保持一致。
 * preload.ts 暴露了什么方法，这里就要声明什么类型。
 *
 * 全局扩展：
 * declare global { interface Window { electronAPI: IElectronAPI } }
 * 让 TypeScript 知道 window 对象上存在 electronAPI 属性，无需额外导入。
 */

import type { LogPayload } from "@/utils/logger";

export interface IElectronAPI {
  /** 将渲染进程日志转发到主进程日志文件 */
  writeLog: (payload: LogPayload) => Promise<boolean>;

  /** 读取持久化设置，key 不存在时返回 undefined */
  getSetting: (key: string) => Promise<unknown>;
  /** 写入持久化设置，返回 true 表示成功 */
  setSetting: (key: string, value: unknown) => Promise<boolean>;
  /** 删除指定持久化设置，返回 true 表示成功 */
  removeSetting: (key: string) => Promise<boolean>;
  /** 获取所有持久化设置的键名列表 */
  getAllKeys: () => Promise<string[]>;

  /** 用系统默认浏览器打开外部链接，返回 true 表示成功触发 */
  openExternal: (url: string) => Promise<boolean>;

  /** 返回 true 表示当前为开发环境（未打包） */
  getIsDev: () => Promise<boolean>;

  /** 最小化窗口 */
  minimize: () => void;
  /** 最大化/还原窗口 */
  maximize: () => void;
  /** 关闭窗口（实际行为：隐藏到系统托盘） */
  close: () => void;

  /**
   * 监听窗口最大化状态变化。
   * @param callback — 参数 isMaximized: true=已最大化, false=已还原
   * @returns 取消监听的函数（在组件 unmounted 时调用）
   */
  onMaximizedStatus: (callback: (isMaximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
