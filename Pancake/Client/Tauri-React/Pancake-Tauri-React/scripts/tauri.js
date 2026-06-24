import { config } from "dotenv";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const mode = process.argv[2]; // "dev" or "build"
const envFile = mode === "build" ? ".env.production" : ".env.development";

// 加载 .env 到 process.env
const result = config({ path: path.join(rootDir, envFile) });
if (result.error) {
  console.error(`Failed to load ${envFile}:`, result.error);
  process.exit(1);
}

// 替换 tauri.conf.json 中的 {{ env.XXX }} 占位符
const configPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
const original = fs.readFileSync(configPath, "utf8");
const resolved = original.replace(/\{\{\s*env\.(\w+)\s*\}\}/g, (_, key) => {
  const val = process.env[key];
  if (!val) {
    console.error(`env var ${key} not found in ${envFile}`);
    process.exit(1);
  }
  return val;
});

fs.writeFileSync(configPath, resolved);

const tauriCmd = mode === "build" ? "build" : "dev";
const child = spawn("npx", ["tauri", tauriCmd], {
  stdio: "inherit",
  shell: true,
  cwd: rootDir,
});

child.on("exit", (code) => {
  // 恢复原始模板文件
  fs.writeFileSync(configPath, original);
  process.exit(code || 0);
});
