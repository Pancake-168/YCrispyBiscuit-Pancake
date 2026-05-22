/**
 * ============================================================================
 * Electron 预加载脚本（Preload Script）
 * ============================================================================
 *
 * 作用：
 * 在渲染进程加载之前运行，通过 contextBridge 将主进程的有限 API 安全地
 * 暴露给渲染进程的 window.electronAPI 对象。
 *
 * 安全模型：
 * - 渲染进程设置了 contextIsolation: true + nodeIntegration: false，
 *   无法直接访问 Node.js 或 Electron API。
 * - 本文件是唯一的"桥梁"，只暴露经过封装的安全方法。
 * - 即使前端被 XSS 攻击，攻击者也只能调用这里列出的方法，无法直接执行
 *   shell.openExternal 或访问文件系统。
 *
 * IPC 通信方式：
 * - invoke/handle   → 双向，支持返回值（用于 settings、openExternal 等需要结果的调用）
 * - send/on         → 单向，无返回值（用于窗口控件，不需要等主进程回复）
 *
 * 事件监听器返回值：
 * - onMaximizedStatus 返回一个 unsubscribe 函数，调用后停止监听。
 *   这是为了防止渲染端组件卸载时监听器泄漏（每次挂载/卸载不清理会叠加）。
 */

import { contextBridge, ipcRenderer } from "electron";
import type { LogPayload } from "../src/utils/logger";

contextBridge.exposeInMainWorld("electronAPI", {
  // ---- 日志 ----
  /**
   * 将渲染进程日志转发到主进程日志文件。
   * 打包后前端没有 DevTools 控制台，此方法确保前端错误能被追踪。
   */
  writeLog: (payload: LogPayload) => ipcRenderer.invoke("write-log", payload),

  // ---- 持久化设置 ----
  /** 读取指定键名的设置值 */
  getSetting: (key: string) => ipcRenderer.invoke("settings-get", key),
  /** 写入设置（键值对，value 需可 JSON 序列化） */
  setSetting: (key: string, value: unknown) =>
    ipcRenderer.invoke("settings-set", key, value),
  /** 删除指定设置 */
  removeSetting: (key: string) => ipcRenderer.invoke("settings-delete", key),
  /** 获取所有设置键名 */
  getAllKeys: () => ipcRenderer.invoke("settings-keys"),

  // ---- 外部链接 ----
  /**
   * 用系统默认浏览器打开链接。
   * 主进程会校验 URL 仅允许 http/https 协议。
   */
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),

  // ---- 环境判断 ----
  /** 返回 true 表示开发环境，false 表示生产环境 */
  getIsDev: () => ipcRenderer.invoke("get-is-dev"),

  // ---- 窗口控制（无边框窗口的自定义标题栏按钮） ----
  /** 最小化窗口，对应标题栏右上角 _ 按钮 */
  minimize: () => ipcRenderer.send("window-minimize"),
  /** 最大化/还原窗口，对应标题栏右上角 □ 按钮 */
  maximize: () => ipcRenderer.send("window-maximize"),
  /** 关闭窗口（实际行为是最小化到托盘），对应标题栏右上角 X 按钮 */
  close: () => ipcRenderer.send("window-close"),

  // ---- 窗口状态事件 ----
  /**
   * 监听窗口最大化/还原状态变化。
   * 前端标题栏需要根据此状态切换 □ 按钮图标（最大化图标 vs 还原图标）。
   *
   * @param callback — 接收 isMaximized: boolean
   * @returns 取消监听的函数，在 Vue 组件的 onUnmounted 中调用以防止泄漏
   */
  onMaximizedStatus: (callback: (isMaximized: boolean) => void) => {
    // 使用具名 handler 以便后续 removeListener 精确匹配
    const handler = (_event: Electron.IpcRendererEvent, value: boolean) =>
      callback(value);
    ipcRenderer.on("window-maximized-status", handler);
    // 返回清理函数：Vue 组件 unmounted 时调用此函数移除监听
    return () => {
      ipcRenderer.removeListener("window-maximized-status", handler);
    };
  },
});
