import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/*
 * TAURI_DEV_HOST
 * 来源：Tauri CLI（tauri dev）在检测到移动端调试或远程设备时自动设置
 * 本地开发时通常为 undefined，因此下方 host 回退到 "0.0.0.0"
 * 文档：https://v2.tauri.app/develop/hosting/#devurl
 */
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async ({ mode }) => {
  /*
   * loadEnv()
   * 来源：Vite 内置函数
   * 作用：从项目根目录加载 .env.development（mode="development"）或
   *       .env.production（mode="production"）
   * 参数：
   *   mode     — Vite 运行模式，由 --mode 或 Tauri 传入
   *   __dirname — 搜索 .env 文件的目录（项目根目录）
   *   ""       — 不过滤，加载文件中 ALL 环境变量（不是只加载 VITE_ 前缀）
   * 读到的变量：
   *   VITE_PORT      → 1420              (来源 .env.development)
   *   VITE_API_BASE  → http://localhost:8080  (来源 .env.development)
   *   VITE_APP_NAME  → Pancake (dev)     (来源 .env.development，目前未使用)
   */
  const env = loadEnv(mode, __dirname, "");

  /*
   * envPort
   * 来源：.env.development → VITE_PORT=1420
   * 默认：如果 .env 中没设置，回退到 1420（和内联默认值一致）
   * 必须和 tauri.conf.json 中 build.devUrl 的端口一致，否则 Tauri WebView 打不开前端
   */
  const envPort = parseInt(env.VITE_PORT || "1420", 10);

  return {
    /*
     * plugins
     * 来源：@vitejs/plugin-vue 官方插件
     * 作用：让 Vite 能编译 Vue 单文件组件（.vue SFC）
     */
    plugins: [vue()],

    /*
     * clearScreen
     * 来源：手动设置
     * 作用：false = Vite 启动或 HMR 时不清理终端
     * 因为 Tauri 的 Rust 编译日志和后端 Python 日志也输出到同一个终端，
     * 清屏会把其他进程的输出也抹掉
     */
    clearScreen: false,

    // =========================================================================
    // server — Vite 开发服务器配置
    // =========================================================================
    server: {
      /*
       * port
       * 来源：.env.development → VITE_PORT=1420
       * 作用：Vite dev server 监听的端口
       * 必须和 tauri.conf.json 中 build.devUrl 的端口一致：
       *   devUrl: "http://localhost:1420"
       *   → Tauri WebView 访问 http://localhost:1420 加载前端
       */
      port: envPort,

      /*
       * strictPort
       * 来源：手动设置
       * 作用：true = 端口被占用时直接报错退出，不会自动尝试 1421、1422...
       * 必须开启，因为 tauri.conf.json 里的 devUrl 写死了 1420，
       * 如果 Vite 跑到别的端口，Tauri WebView 找不到前端，白屏
       */
      strictPort: true,

      /*
       * host
       * 来源：process.env.TAURI_DEV_HOST（Tauri CLI 设置，本地开发为 undefined）
       * 回退："0.0.0.0"
       * 作用：Vite 监听的网络接口
       *   0.0.0.0 — 监听所有网卡，局域网内其他设备可以访问（手机调试等）
       *   127.0.0.1 — 只监听本机回环，更安全但外部设备无法访问
       *   Tauri 设置的具体 IP — 用于移动端/远程调试场景
       */
      host: host || "0.0.0.0",

      /*
       * hmr — Hot Module Replacement（热模块替换）
       * 来源：仅当 TAURI_DEV_HOST 存在时启用（即移动端/远程调试场景）
       * 本地开发时 TAURI_DEV_HOST 为 undefined，hmr 走 Vite 默认配置（同端口 WebSocket）
       * 协议：ws (WebSocket)
       * 端口：1421 — 注意不是 1420！HMR 需要独立端口，避免和页面请求冲突
       * 如果不配置 host 而使用默认，HMR WebSocket 连接的 host 可能不对，导致热更新失效
       */
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: 1421,
          }
        : undefined,

      /*
       * watch.ignored
       * 来源：手动设置
       * 作用：告诉 Vite 的文件监视器忽略 src-tauri 目录
       * 原因：Tauri 的 Rust 编译器会在 src-tauri/target/ 下频繁写入编译产物，
       *       如果不忽略，Vite 会误以为源代码发生了变更，每编译一次就重启一次 dev server，
       *       形成 "编译 → Vite 重启 → HMR 断开 → 又触发编译" 的死循环
       */
      watch: {
        ignored: ["**/src-tauri/**"],
      },
    },
  };
});
