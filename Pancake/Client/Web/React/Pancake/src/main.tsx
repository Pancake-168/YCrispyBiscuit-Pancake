import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@/language";
import "@/styles/index.css";
import {
  createLogger,
  registerElectronRendererTransport,
  registerGlobalRendererLogHandlers,
} from "@/utils/logger";

const bootstrapLogger = createLogger("main.tsx", "bootstrap");

registerElectronRendererTransport();
registerGlobalRendererLogHandlers();
bootstrapLogger.info("应用启动初始化完成");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
