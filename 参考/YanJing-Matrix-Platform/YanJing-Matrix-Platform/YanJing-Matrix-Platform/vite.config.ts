import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import removeConsole from 'vite-plugin-remove-console'
import { resolve } from 'node:path'

// https://vite.dev/config/
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
  const matrixProxyTarget = env.matrixProxyTarget || ''
  // 后端业务基础地址：优先使用 VITE_API_BASE（前端同源配置），兼容旧的 BASE_URL
  const API_BASE = env.VITE_API_BASE || ''
  const NOCOBASE_URL = env.NOCOBASE_URL || ''

  return {
    base: '/',
    // 仅暴露业务需要的环境变量到 import.meta.env（避免 envPrefix='' 导致意外泄露）
    envPrefix: ['VITE_', 'Login_', 'MATRIX_', 'NOCOBASE_', 'allowedHosts', 'matrixProxyTarget'],
    plugins: [vue(),
    // 仅在构建时移除 console，开发时保留用于调试
    ...(command === 'build' ? [removeConsole()] : []),
    // 支持Matrix加密WASM库
    {
      name: 'matrix-wasm',
      configureServer(server) {
        server.middlewares.use('/matrix-sdk-crypto-wasm.wasm', (_req, res, next) => {
          res.setHeader('Content-Type', 'application/wasm')
          next()
        })
      }
    },
    // NocoBase 流量拦截与修正插件
    {
      name: 'nocobase-traffic-fix',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url || ''
          const referer = req.headers.referer || ''

          // 判断是否为 NocoBase 的相关请求
          // 1. 来源是 NocoBase iframe
          // 2. 或者 URL 包含 NocoBase 特有的冒号动作 (如 app:getLang)
          // 3. 排除 Vite 内部模块 (包含 __x00__ 或以 /@ 开头)
          // 注意：不能简单用 includes('node_modules')，因为 NocoBase 的 webpack chunk 文件名可能包含这个字符串
          const isViteInternal = url.includes('__x00__') || url.startsWith('/@') || url.startsWith('/node_modules/')

          // 增强判定逻辑：
          // 1. URL 包含标记参数 ?noco=1 (这是我们新加的标记)
          // 2. Referer 包含 noco=1 (说明是 iframe 内部发出的请求)
          // 3. 之前的兼容逻辑：Referer 包含 /nocobase-proxy 或 URL 包含冒号
          const isNocobaseRequest = !isViteInternal && (
            url.includes('noco=1') ||
            (referer && referer.includes('noco=1')) ||
            referer.includes('/nocobase-proxy') ||
            url.includes(':') ||
            url.includes('umi.js') ||
            url.endsWith('.async.js') ||
            url.includes('vendors-node_modules')
          )

          // 如果是 NocoBase 请求，且没有加上代理前缀
          if (isNocobaseRequest && !url.startsWith('/nocobase-proxy')) {
            // 强制添加 /nocobase-proxy 前缀
            // 这样它就会被下方的 /nocobase-proxy 代理规则捕获并转发
            req.url = '/nocobase-proxy' + url
            // console.log('Redirecting to NocoBase Proxy:', url, '->', req.url)
          }
          next()
        })
      }
    }
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
        '/_matrix': {
          target: matrixProxyTarget,
          changeOrigin: true,
          secure: false
        },
        '/nocobase-proxy': {
          target: NOCOBASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nocobase-proxy/, ''),
          secure: false,
          ws: true
        },
        '/api': {
          target: API_BASE,
          changeOrigin: true,
          secure: false
        },
        // 尝试捕获 NocoBase 可能使用的其他 WebSocket 路径
        '/ws': {
          target: NOCOBASE_URL,
          changeOrigin: true,
          ws: true,
          secure: false,
          // 安全策略：只有来自 NocoBase 的请求才走这个代理
          bypass: (req) => {
            const referer = req.headers.referer || ''
            if (!referer.includes('/nocobase-proxy')) {
              return req.url // 不转发，直接返回（交给 Vite 处理或报 404）
            }
          }
        },
        '/socket.io': {
          target: NOCOBASE_URL,
          changeOrigin: true,
          ws: true,
          secure: false,
          // 安全策略：只有来自 NocoBase 的请求才走这个代理
          bypass: (req) => {
            const referer = req.headers.referer || ''
            if (!referer.includes('/nocobase-proxy')) {
              return req.url
            }
          }
        }

      }

    },
    
     build: {
      outDir: '/var/www/html/YanJingAI', // 自定义输出目录
    }
      
  }
})
