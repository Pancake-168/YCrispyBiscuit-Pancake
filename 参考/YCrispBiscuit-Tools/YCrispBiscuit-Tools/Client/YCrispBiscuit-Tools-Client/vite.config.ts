import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    // 支持Matrix加密WASM库
    {
      name: 'matrix-wasm',
      configureServer(server) {
        server.middlewares.use('/matrix-sdk-crypto-wasm.wasm', (_req, res, next) => {
          res.setHeader('Content-Type', 'application/wasm')
          next()
        })
      }
    }
  ],
  base: './', // 使用相对路径，这样在Electron中可以正确工作
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  // 优化WASM加载
  optimizeDeps: {
    exclude: ['@matrix-org/matrix-sdk-crypto-wasm']
  }
})