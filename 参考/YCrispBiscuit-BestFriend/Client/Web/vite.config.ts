import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const apiBase = env.VITE_API_BASE 
  const target = apiBase.replace('/api', '')

  const isDev = mode === 'development'
  return {
    // dev: use Vite server absolute paths; prod: use relative base for file://
    base: isDev ? '/' : './',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
      },
    },
    build: {
      minify: 'terser',
    },
  }
})
