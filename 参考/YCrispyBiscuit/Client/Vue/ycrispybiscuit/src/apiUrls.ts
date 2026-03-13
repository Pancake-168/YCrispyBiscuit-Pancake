

// 后端业务基础地址
// 注意：Vite 内置的 import.meta.env.BASE_URL 表示“站点 base path”（例如 './'），不是后端地址。
// 本项目用 VITE_API_BASE 作为后端 host。
// 规则：
// - 开发环境：使用相对路径（例如 /api/...）让 Vite dev server 代理转发，避免 CORS。
// - 生产环境 Web：默认使用相对路径（配合 Nginx 反向代理 /api）。
// - 生产环境 Electron：打包后使用 app:// 加载静态文件，没有 Vite 代理，默认直连后端。
// 可选覆盖：VITE_API_MODE=direct|proxy
const isElectronRuntime = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
const apiMode = (import.meta.env.VITE_API_MODE as unknown as string | undefined) || ''
const useRelativeApi = import.meta.env.DEV || apiMode === 'proxy' || (!isElectronRuntime && apiMode !== 'direct')
export const BASE_URL = useRelativeApi ? '' : (import.meta.env.VITE_API_BASE as unknown as string)






export const API_URLS = {


  // Example: GetApplicationFromTag('my-tag') => 'http://backend/api/v2/my-tag/application'
  GetApplicationFromTag: (tag: string) => `${BASE_URL}/api/v2/${tag}/application`,

}








