/**
 * ============================================================================
 * Pancake 前端日志系统（Tauri 版）
 * ============================================================================
 *
 * 设计思路：
 * 采用"传输器模式"（Transport Pattern）—— 日志产生后分发给所有注册的
 * 传输器，每个传输器独立决定如何处理日志（写文件、输出控制台、发送到远程等）。
 *
 * 架构：
 *   createLogger(fileName, functionName)
 *        ↓ 生成带上下文的日志对象
 *   writeLog(payload)
 *        ↓ 添加时间戳，分发
 *   ┌─ writeToConsole()          → console.log/warn/error（开发环境可见）
 *   └─ registerTauriTransport()  → Tauri IPC 写入 pancake.app.log
 *
 * Tauri 集成：
 * - 浏览器开发：仅控制台输出，不写文件
 * - Tauri 桌面端：通过 invoke("write_log") 将日志发送到 Rust 层，
 *   由 Rust 层写入与后端相同的 logs/ 目录
 * - registerGlobalErrorHandlers() 捕获 window.onerror 和
 *   unhandledrejection，确保未捕获错误也能进入日志
 */

import { invoke } from '@tauri-apps/api/core';

// ---- 类型定义 ----

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 日志载荷（Log Payload）
 * 贯穿整个日志管道的数据结构。
 */
export type LogPayload = {
  level: LogLevel;
  fileName: string;
  functionName: string;
  message: string;
  details?: unknown[];
  timestamp?: string;
};

/** 发送到 Rust 层的日志条目 */
type LogEntry = {
  level: string;
  file_name: string;
  function_name: string;
  message: string;
  details: string[] | null;
};

/**
 * 日志传输器函数类型。
 * 接收一个完整的 LogPayload，执行具体的输出操作。
 */
type LogTransport = (payload: LogPayload) => void | Promise<void>;

// ---- 内部状态 ----

const transports = new Set<LogTransport>();

/** 运行时标记，确保副作用只执行一次 */
const runtimeFlags = globalThis as {
  __pancakeTauriTransportRegistered?: boolean;
  __pancakeGlobalErrorHandlersRegistered?: boolean;
};

// ---- 格式化函数 ----

/** 格式化日志前缀：[Pancake:fileName:functionName]message */
const formatLogPrefix = (fileName: string, functionName: string, message: string) =>
  `[Pancake:${fileName}:${functionName}]${message}`;

/** 将日志详情中的单个值转为字符串 */
const stringifyLogDetail = (detail: unknown): string => {
  if (detail instanceof Error) {
    return detail.stack || `${detail.name}: ${detail.message}`;
  }

  if (typeof detail === 'string') {
    return detail;
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
};

// ---- 传输器管理 ----

/** 注册日志传输器，返回取消注册的函数 */
const registerLogTransport = (transport: LogTransport) => {
  transports.add(transport);
  return () => transports.delete(transport);
};

// ---- 控制台输出（默认传输器） ----

const writeToConsole = (payload: LogPayload) => {
  const prefix = formatLogPrefix(payload.fileName, payload.functionName, payload.message);
  const details = payload.details || [];

  if (payload.level === 'error') {
    console.error(prefix, ...details);
    return;
  }

  if (payload.level === 'warn') {
    console.warn(prefix, ...details);
    return;
  }

  if (payload.level === 'debug') {
    console.debug(prefix, ...details);
    return;
  }

  console.log(prefix, ...details);
};

// ---- 日志写入核心 ----

/** 写入一条日志：控制台 + 所有注册的传输器 */
const writeLog = (payload: LogPayload) => {
  const normalizedPayload: LogPayload = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  // 1. 控制台输出（总是执行）
  writeToConsole(normalizedPayload);

  // 2. 分发给所有传输器
  for (const transport of transports) {
    try {
      void transport(normalizedPayload);
    } catch (error) {
      console.error(formatLogPrefix('logger.ts', 'writeLog', '日志传输失败'), error);
    }
  }
};

// ---- Logger 工厂 ----

/**
 * 创建带上下文的日志记录器。
 *
 * 使用方式：
 *   const log = createLogger("App.tsx", "handleLogin");
 *   log.info("用户登录成功", { userId: 123 });
 *   log.error("登录失败", new Error("token expired"));
 */
export const createLogger = (fileName: string, functionName: string) => {
  const emit = (level: LogLevel, message: string, details: unknown[] = []) => {
    writeLog({
      level,
      fileName,
      functionName,
      message,
      details,
    });
  };

  return {
    debug: (message: string, ...details: unknown[]) => emit('debug', message, details),
    info: (message: string, ...details: unknown[]) => emit('info', message, details),
    warn: (message: string, ...details: unknown[]) => emit('warn', message, details),
    error: (message: string, ...details: unknown[]) => emit('error', message, details),
  };
};

// ============================================================================
// Tauri 桌面端集成
// ============================================================================

/** 检测是否运行在 Tauri 环境（v2 使用 __TAURI_INTERNALS__） */
const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * 注册 Tauri 桌面端的日志桥接传输器。
 *
 * 浏览器环境不注册此传输器（此时日志仅输出到控制台）。
 * Tauri 环境将日志通过 IPC 发送到 Rust 层，写入与后端相同的 logs/ 目录。
 */
export const registerTauriTransport = () => {
  if (runtimeFlags.__pancakeTauriTransportRegistered) {
    return;
  }

  if (!isTauri()) {
    return;
  }

  runtimeFlags.__pancakeTauriTransportRegistered = true;

  registerLogTransport((payload) => {
    const entry: LogEntry = {
      level: payload.level,
      file_name: payload.fileName,
      function_name: payload.functionName,
      message: payload.message,
      details: payload.details ? payload.details.map(stringifyLogDetail) : null,
    };
    invoke('write_log', { entry }).catch((e) => {
      // invoke 失败时仅输出控制台，不再次走 logger（避免无限循环）
      console.error('[logger] invoke write_log 失败:', e);
    });
  });
};

// ============================================================================
// 全局错误捕获
// ============================================================================

/**
 * 注册全局错误捕获。
 * 捕获 window.onerror 和 unhandledrejection，确保未捕获错误也能进入日志。
 */
export const registerGlobalErrorHandlers = () => {
  if (runtimeFlags.__pancakeGlobalErrorHandlersRegistered) {
    return;
  }

  const runtime = globalThis as {
    addEventListener?: (type: string, listener: (event: any) => void) => void;
  };

  if (typeof runtime.addEventListener !== 'function') return;

  runtimeFlags.__pancakeGlobalErrorHandlersRegistered = true;

  const errorLogger = createLogger('main.tsx', 'window.onerror');
  const rejectionLogger = createLogger('main.tsx', 'window.unhandledrejection');

  // 捕获同步异常和资源加载错误
  runtime.addEventListener('error', (event: ErrorEvent) => {
    errorLogger.error('捕获到未处理异常', event?.error || event?.message, {
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
    });
  });

  // 捕获未处理的 Promise rejection
  runtime.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    rejectionLogger.error('捕获到未处理 Promise 拒绝', event?.reason);
  });
};
