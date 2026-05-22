/**
 * ============================================================================
 * Pancake 日志系统
 * ============================================================================
 *
 * 设计思路：
 * 本模块采用"传输器模式"（Transport Pattern）—— 日志产生后分发给所有注册的
 * 传输器，每个传输器独立决定如何处理日志（写文件、输出控制台、发送到远程等）。
 *
 * 架构：
 *   createLogger(fileName, functionName)
 *        ↓ 生成带上下文的日志对象
 *   writeLog(payload)
 *        ↓ 添加时间戳，分发
 *   ┌─ writeToConsole()         → console.log/warn/error（开发环境可见）
 *   └─ registerLogTransport()  → 主进程写文件 / 渲染进程 IPC 到主进程
 *
 * Electron 集成：
 * - 主进程：registerLogTransport 注册文件写入器（main.ts 中调用）
 * - 渲染进程：registerElectronRendererTransport() 将前端日志通过 IPC
 *   桥接到主进程，统一写入同一个日志文件
 * - 渲染进程还通过 registerGlobalRendererLogHandlers() 捕获
 *   window.onerror 和 unhandledrejection，确保未捕获错误也能进入日志
 */

// ---- 类型定义 ----

export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * 日志载荷（Log Payload）
 * 贯穿整个日志管道的数据结构。
 * - level       → 日志级别
 * - fileName    → 产生日志的源文件名（如 "main.ts"、"App.vue"）
 * - functionName→ 产生日志的函数名（如 "createWindow"）
 * - message     → 日志消息主体（中文或英文）
 * - details     → 附加信息数组（对象、Error、字符串等，会被序列化）
 * - timestamp   → ISO 格式时间戳，未提供时自动生成
 */
export type LogPayload = {
  level: LogLevel;
  fileName: string;
  functionName: string;
  message: string;
  details?: unknown[];
  timestamp?: string;
};

/**
 * 日志传输器函数类型。
 * 接收一个完整的 LogPayload，执行具体的输出操作（写文件/发网络请求等）。
 * 支持同步和异步（Promise）两种返回值，但调用方用 void 忽略返回值。
 */
type LogTransport = (payload: LogPayload) => void | Promise<void>;

// ---- 内部状态 ----

/**
 * 传输器集合。所有注册的传输器都存储在这里。
 * 使用 Set 保证同一传输器不会重复注册（虽然目前只有一个文件传输器）。
 */
const transports = new Set<LogTransport>();

/**
 * 运行时标记（存储在 globalThis 上，跨模块共享）。
 * 用于确保某些副作用只执行一次（如注册渲染进程的日志桥接）。
 *
 * 使用 globalThis 而非模块级变量，是因为在 Vite HMR 热更新时模块会重新加载，
 * 但 globalThis 上的标记会保留，避免重复注册监听器。
 */
const runtimeFlags = globalThis as {
  __pancakeElectronRendererTransportRegistered?: boolean;
  __pancakeGlobalRendererLogHandlersRegistered?: boolean;
};

// ---- 格式化函数 ----

/**
 * 生成日志前缀，格式：[Pancake:fileName:functionName]message
 * 示例：[Pancake:App.vue:handleLogin]登录失败
 */
export const formatLogPrefix = (
  fileName: string,
  functionName: string,
  message: string,
) => `[Pancake:${fileName}:${functionName}]${message}`;

/**
 * 将日志详情中的单个值转为字符串。
 *
 * 处理三种情况：
 * 1. Error 对象 → 优先输出 stack（含调用栈），其次 name: message
 * 2. 字符串    → 直接返回
 * 3. 其他对象  → JSON.stringify，序列化失败则 String()
 *
 * 设计理由：Error 对象的 stack 属性在 JSON.stringify 时会被丢弃，
 * 必须特殊处理才能保留调试信息。
 */
export const stringifyLogDetail = (detail: unknown) => {
  if (detail instanceof Error) {
    return detail.stack || `${detail.name}: ${detail.message}`;
  }

  if (typeof detail === "string") {
    return detail;
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
};

/**
 * 将 LogPayload 序列化为单行字符串。
 *
 * 输出格式：
 * 无详情：2026-05-22T10:30:00.000Z [INFO] [Pancake:main.ts:createWindow] 开始创建窗口
 * 有详情：2026-05-22T10:30:00.000Z [ERROR] [Pancake:api.ts:fetch] 请求失败 {"status":500} | Network Error
 *
 * 注意：时间戳优先使用 payload.timestamp，否则自动生成（确保主进程和渲染进程
 * 都使用同一时间基准，避免 IPC 延迟导致时间错乱）。
 */
export const serializeLogPayload = (payload: LogPayload) => {
  const timestamp = payload.timestamp || new Date().toISOString();
  const prefix = formatLogPrefix(
    payload.fileName,
    payload.functionName,
    payload.message,
  );
  const details = (payload.details || []).map(stringifyLogDetail).join(" | ");

  return details
    ? `${timestamp} [${payload.level.toUpperCase()}] ${prefix} ${details}`
    : `${timestamp} [${payload.level.toUpperCase()}] ${prefix}`;
};

// ---- 传输器管理 ----

/**
 * 注册日志传输器。
 * @param transport — 接收 LogPayload 的回调函数
 * @returns 取消注册的函数（调用后该传输器不再接收日志）
 */
export const registerLogTransport = (transport: LogTransport) => {
  transports.add(transport);
  return () => transports.delete(transport);
};

// ---- 控制台输出（默认传输器） ----

/**
 * 将日志输出到控制台。
 * 这是内置的默认传输器，不需要手动注册。
 * 开发环境通过 DevTools 可见，生产环境（打包后）通常不可见，
 * 所以主进程还额外注册了文件传输器。
 */
const writeToConsole = (payload: LogPayload) => {
  const prefix = formatLogPrefix(
    payload.fileName,
    payload.functionName,
    payload.message,
  );
  const details = payload.details || [];

  if (payload.level === "error") {
    console.error(prefix, ...details);
    return;
  }

  if (payload.level === "warn") {
    console.warn(prefix, ...details);
    return;
  }

  if (payload.level === "debug") {
    console.debug(prefix, ...details);
    return;
  }

  console.log(prefix, ...details);
};

// ---- 日志写入核心 ----

/**
 * 写入一条日志。
 *
 * 这是整个日志系统的核心函数，所有日志最终都通过此函数分发。
 * 处理流程：
 * 1. 补全时间戳（如果调用方没提供）
 * 2. 输出到控制台（总是执行）
 * 3. 分发给所有注册的传输器（文件、IPC 等）
 *
 * 注意：传输器的异步返回值被 void 忽略。
 * 如果传输器内部抛出同步异常，会被 try/catch 捕获并输出到控制台。
 * 如果传输器返回的 Promise reject，会被全局 unhandledRejection 捕获。
 */
export const writeLog = (payload: LogPayload) => {
  const normalizedPayload: LogPayload = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  // 1. 控制台输出（总是执行）
  writeToConsole(normalizedPayload);

  // 2. 分发给所有传输器
  for (const transport of transports) {
    try {
      // void 忽略返回值（传输器可能是同步也可能是异步）
      void transport(normalizedPayload);
    } catch (error) {
      console.error(
        formatLogPrefix("logger.ts", "writeLog", "日志传输失败"),
        error,
      );
    }
  }
};

// ---- Logger 工厂 ----

/**
 * 创建带上下文的日志记录器。
 *
 * 使用方式：
 *   const log = createLogger("App.vue", "handleLogin");
 *   log.info("用户登录成功", { userId: 123 });
 *   log.error("登录失败", new Error("token expired"));
 *
 * 返回的对象包含 debug/info/warn/error 四个方法，每个方法自动携带
 * fileName 和 functionName 上下文，调用方不需要重复传递这些信息。
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
    debug: (message: string, ...details: unknown[]) =>
      emit("debug", message, details),
    info: (message: string, ...details: unknown[]) =>
      emit("info", message, details),
    warn: (message: string, ...details: unknown[]) =>
      emit("warn", message, details),
    error: (message: string, ...details: unknown[]) =>
      emit("error", message, details),
  };
};

// ============================================================================
// Electron 渲染进程集成
// ============================================================================

/**
 * 注册 Electron 渲染进程的日志桥接传输器。
 *
 * 原理：
 * 渲染进程的 console.log 在打包后用户看不到（没有 DevTools），
 * 所以需要将前端日志通过 IPC 发送到主进程，由主进程写入统一的日志文件。
 *
 * 此函数注册一个传输器，该传输器调用 window.electronAPI.writeLog(payload)
 * 将日志发送到主进程。主进程的 write-log handler 收到后再调用 createLogger
 * 写入文件（避免无限循环：主进程写文件时不会再走 IPC）。
 *
 * 使用 globalThis 标记确保只注册一次（Vite HMR 时模块重新加载也不会重复）。
 *
 * @returns 取消注册的函数
 */
export const registerElectronRendererTransport = () => {
  // 通过 globalThis 标记防止 HMR 热更新时重复注册
  if (runtimeFlags.__pancakeElectronRendererTransportRegistered) {
    return () => undefined;
  }

  const runtime = globalThis as {
    electronAPI?: {
      writeLog?: (payload: LogPayload) => Promise<boolean>;
    };
  };

  runtimeFlags.__pancakeElectronRendererTransportRegistered = true;

  return registerLogTransport((payload) => {
    // 安全检查：确保 electronAPI 已由 preload.ts 暴露
    if (typeof runtime.electronAPI?.writeLog !== "function") return;
    void runtime.electronAPI.writeLog(payload);
  });
};

/**
 * 注册渲染进程的全局错误捕获。
 *
 * 监听 window 上的 error 和 unhandledrejection 事件，将未捕获的错误
 * 自动记录到日志系统。这样即使开发者忘记 try/catch，错误也不会静默丢失。
 *
 * 同样使用 globalThis 标记确保只注册一次。
 */
export const registerGlobalRendererLogHandlers = () => {
  if (runtimeFlags.__pancakeGlobalRendererLogHandlersRegistered) {
    return;
  }

  const runtime = globalThis as {
    addEventListener?: (type: string, listener: (event: any) => void) => void;
  };

  if (typeof runtime.addEventListener !== "function") return;

  runtimeFlags.__pancakeGlobalRendererLogHandlersRegistered = true;

  const errorLogger = createLogger("main.tsx", "window.onerror");
  const rejectionLogger = createLogger(
    "main.tsx",
    "window.unhandledrejection",
  );

  // 捕获同步异常和资源加载错误
  runtime.addEventListener("error", (event) => {
    errorLogger.error("捕获到未处理异常", event?.error || event?.message, {
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
    });
  });

  // 捕获未处理的 Promise rejection
  runtime.addEventListener("unhandledrejection", (event) => {
    rejectionLogger.error("捕获到未处理 Promise 拒绝", event?.reason);
  });
};
