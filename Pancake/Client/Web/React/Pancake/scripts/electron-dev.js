// scripts/electron-dev.js
import { spawn } from "child_process";
import { loadEnv } from "vite";
import waitOn from "wait-on";
import path from "path"; // Add path import

// Correctly resolving __dirname in ESM
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "");
const PORT = parseInt(env.VITE_PORT); // 严格从环境变量读取，禁止在脚本中定义默认端口

// Setup terminal colors
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

console.log(cyan(`Starting Vite on port ${PORT}...`));

const isWin = process.platform === "win32";
const comspec = process.env.ComSpec || (isWin ? "cmd.exe" : "");

const spawnCommand = (command, extraEnv = {}) => {
  if (isWin) {
    return spawn(comspec, ["/d", "/s", "/c", command], {
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    });
  }
  // Non-Windows fallback: execute via sh -lc
  return spawn("sh", ["-lc", command], {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
};

// Start Vite
const vite = spawnCommand("npm run dev", { VITE_PORT: String(PORT) });

// Wait for port
waitOn({
  resources: [`tcp:${PORT}`],
  timeout: 30000,
})
  .then(() => {
    console.log(green("Vite is ready. Starting Electron..."));

    // Compile Main Process
    const tsc = spawnCommand("tsc -p electron/tsconfig.json");

    tsc.on("close", async (code) => {
      if (code === 0) {
        // Create package.json type: commonjs to avoid ESM error
        const { writeFileSync } = await import("fs");
        writeFileSync(
          "dist-electron/package.json",
          JSON.stringify({ type: "commonjs" }),
        );

        // Start Electron
        const electron = spawnCommand("electron .", { ...env });
        electron.on("close", () => {
          vite.kill();
          process.exit();
        });
      }
    });
  })
  .catch((err) => {
    console.error(err);
    vite.kill();
    process.exit(1);
  });
