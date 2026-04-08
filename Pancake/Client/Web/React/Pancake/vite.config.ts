import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import removeConsole from "vite-plugin-remove-console";

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const parseAllowedHosts = (raw: string | undefined): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  };

  const allowedHosts = parseAllowedHosts(env.allowedHosts);

  return {
    base: "/",
    envPrefix: ["VITE_", "allowedHosts"],
    plugins: [react(), ...(command === "build" ? [removeConsole()] : [])],

    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    server: {
      allowedHosts,
      ...(process.env.ELECTRON_DEV_TOOLS !== undefined
        ? (() => {
            const raw = env.VITE_PORT;
            const port = Number(raw);
            if (!raw || Number.isNaN(port)) {
              throw new Error(
                "[vite] Electron 启动时必须在 .env.* 中配置 VITE_PORT",
              );
            }
            return { port, strictPort: true };
          })()
        : {}),
    },
  };
});
