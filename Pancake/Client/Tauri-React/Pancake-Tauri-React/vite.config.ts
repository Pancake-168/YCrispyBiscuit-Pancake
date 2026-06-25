import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import removeConsole from 'vite-plugin-remove-console';

const host = process.env.TAURI_DEV_HOST;

// Tauri 构建时保留 console（桌面端 DevTools 可见），纯 Web 构建时移除
const isTauriBuild = process.env.__TAURI_BUILD === 'true';

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), ...(!isTauriBuild ? [removeConsole()] : [])],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}));
