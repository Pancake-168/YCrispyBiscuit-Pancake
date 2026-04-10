export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogPayload = {
  level: LogLevel;
  fileName: string;
  functionName: string;
  message: string;
  details?: unknown[];
  timestamp?: string;
};

type LogTransport = (payload: LogPayload) => void | Promise<void>;

const transports = new Set<LogTransport>();
const runtimeFlags = globalThis as {
  __pancakeElectronRendererTransportRegistered?: boolean;
  __pancakeGlobalRendererLogHandlersRegistered?: boolean;
};

export const formatLogPrefix = (
  fileName: string,
  functionName: string,
  message: string,
) => `[Pancake:${fileName}:${functionName}]${message}`;

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

export const registerLogTransport = (transport: LogTransport) => {
  transports.add(transport);
  return () => transports.delete(transport);
};

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

export const writeLog = (payload: LogPayload) => {
  const normalizedPayload: LogPayload = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  writeToConsole(normalizedPayload);

  for (const transport of transports) {
    try {
      void transport(normalizedPayload);
    } catch (error) {
      console.error(
        formatLogPrefix("logger.ts", "writeLog", "日志传输失败"),
        error,
      );
    }
  }
};

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

export const registerElectronRendererTransport = () => {
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
    if (typeof runtime.electronAPI?.writeLog !== "function") return;
    void runtime.electronAPI.writeLog(payload);
  });
};

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

  runtime.addEventListener("error", (event) => {
    errorLogger.error("捕获到未处理异常", event?.error || event?.message, {
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
    });
  });

  runtime.addEventListener("unhandledrejection", (event) => {
    rejectionLogger.error("捕获到未处理 Promise 拒绝", event?.reason);
  });
};