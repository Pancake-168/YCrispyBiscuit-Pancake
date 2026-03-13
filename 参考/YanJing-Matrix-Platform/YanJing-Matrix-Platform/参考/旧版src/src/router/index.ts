// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
 {
    path: '/',
    name: 'YanJingAI',
    component: () => import('../views/YanJingAI2')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/views/LoginPage')  // 直接导入LoginPage
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/views/MainPage'),  // 直接导入MainPage
    meta: { requiresAuth: true }  // 添加需要认证的标记
  },
 
  {
    path: '/:applicationId/Agent_DIY/:account',
    name: 'Agent_DIY',
    component: () => import('../views/views/Pages/RightContent/Agent_DIY/index.vue') // 路径必须指向 .vue 文件
  },
  {
    path: '/YanJingAI2',
    name: 'YanJingAI2',
    component: () => import('../views/YanJingAI2')
  },
  {
    path: '/opc',
    name: 'YanJingAI2OPC',
    component: () => import('../views/YanJingAI2')
  },
  {
    path: '/cua',
    name: 'YanJingAI2CUA',
    component: () => import('../views/YanJingAI2')
  },
  {
    path: '/custom',
    name: 'YanJingAI2Custom',
    component: () => import('../views/YanJingAI2')
  },
 

  




]
const router = createRouter({
  history: createWebHistory('/'), // 匹配 vite.config.ts 中的 base 路径
  routes
})


router.beforeEach((to) => {
  const fromOrganization = to.query.FromOrganization
  if (typeof fromOrganization === 'string' && fromOrganization.trim() !== '') {
    localStorage.setItem('FromOrganization', fromOrganization)
  } else if (Array.isArray(fromOrganization) && fromOrganization.length > 0) {
    localStorage.setItem('FromOrganization', fromOrganization[0])
  }

  const token = localStorage.getItem('matrix_access_token')
  const hasToken = token !== null && token !== ''
  const autoLoginCompleted = sessionStorage.getItem('auto_login_completed') === 'true'
  
  console.log(`[Router] Navigating to: ${to.fullPath}, hasToken: ${hasToken}, autoLoginCompleted: ${autoLoginCompleted}`)

  // 如果访问需要认证的页面
  if (to.meta.requiresAuth) {
    // 没有 token，重定向到登录页
    if (!hasToken) {
      console.log('[Router] No token found, redirecting to /login')
      return {
        path: '/login',
        query: { redirect: to.fullPath }
      }
    }
    
    // 有 token 但自动登录未完成，重定向到登录页进行自动登录
    // 增加判断：如果已经在登录页且带有 autoLogin 标记，则不再重定向，防止死循环
    if (!autoLoginCompleted && to.path !== '/login') {
      console.log('[Router] Token exists but auto-login not completed, redirecting to /login for auto-login')
      return {
        path: '/login',
        query: { redirect: to.fullPath, autoLogin: 'true' }
      }
    }
  }
  
  // 如果访问登录页但已经完成自动登录，且没有显式的 autoLogin 请求，重定向到聊天页
  if (to.path === '/login' && hasToken && autoLoginCompleted && !to.query.autoLogin) {
    console.log('[Router] Already logged in and auto-login completed, redirecting to /chat')
    return '/chat'
  }
})





// 移除路由守卫，因为所有路由都不需要认证
// router.beforeEach((to: RouteLocationNormalized) => {
//   const authStore = useAuthStore()

//   if (to.meta.requiresAuth && !authStore.isAuthenticated) {
//     return {
//       path: '/',
//       query: { redirect: to.fullPath !== '/' ? to.fullPath : undefined }
//     }
//   }
// })

export default router