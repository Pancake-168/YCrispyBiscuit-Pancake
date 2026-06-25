import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  registerTauriTransport,
  registerGlobalErrorHandlers,
} from "@/utils/logger";

// 初始化日志传输器（Tauri 桌面端写文件，浏览器端仅控制台）
registerTauriTransport();
registerGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
