// src/utils/request.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // 允许跨域携带 Cookie
  timeout: 10000 // 添加超时设置
})

// 请求拦截器 (自动添加 Token)
service.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// 响应拦截器 (处理错误)
service.interceptors.response.use(
  response => response.data, // 自动解构data
  error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.clearAuth() // 统一使用store清理
    }
    return Promise.reject(error.response?.data || error) // 标准化错误格式
  }
)

export default service