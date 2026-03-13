import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import removeConsole from 'vite-plugin-remove-console'
import { resolve } from 'node:path'


export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const parseAllowedHosts = (raw: string | undefined): string[] => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as unknown
      return Array.isArray(parsed) ? (parsed as string[]) : []
    } catch {
      // 兼容用户误写成 a,b,c 的形式
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }

  const allowedHosts = parseAllowedHosts(env.allowedHosts)

  // 后端业务基础地址：优先使用 VITE_API_BASE
  const API_BASE = env.VITE_API_BASE || ''


  return {
    base: '/',
    envPrefix: ['VITE_', 'Login_', 'allowedHosts'],
    plugins: [vue(),
    ...(command === 'build' ? [removeConsole()] : []),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      allowedHosts,

      // 端口策略（按项目约束）：
      // - Web 端：不设置端口，让 Vite 默认从 5173 自动递增
      // - Electron 端：必须使用 env 里的 VITE_PORT，并锁定 strictPort
      // 说明：ELECTRON_DEV_TOOLS 在 electron 启动脚本里一定会被设置（true/false），
      // 因此用“是否存在该变量”来判断当前是否为 Electron 启动。
      ...(process.env.ELECTRON_DEV_TOOLS !== undefined
        ? (() => {
          const raw = env.VITE_PORT
          const port = Number(raw)
          if (!raw || Number.isNaN(port)) {
            throw new Error('[vite] Electron 启动时必须在 .env.* 中配置 VITE_PORT=5175')
          }
          return { port, strictPort: true }
        })()
        : {}),
      proxy: {
        '/api': {
          target: API_BASE,
          changeOrigin: true,
          secure: false
        },
      }
    },
  }
})
