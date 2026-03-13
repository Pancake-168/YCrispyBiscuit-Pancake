import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getSetting } from '@/utils/storage'
import { SystemStorageManager } from '@/utils/SystemStorage'
import { matrixClient } from '@/services/Matrix/client'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'YanJingAI',
    component: () => import('@/views/YanJingAI'),
  },
  {
    path: '/opc',
    name: 'YanJingAIOpc',
    component: () => import('@/views/YanJingAI'),
  },
  {
    path: '/cua',
    name: 'YanJingAICua',
    component: () => import('@/views/YanJingAI'),
  },
  {
    path: '/custom',
    name: 'YanJingAICustom',
    component: () => import('@/views/YanJingAI'),
  },

  {
    path: '/setup',
    name: 'Setup',
    component: () => import('@/views/WelcomeSetup.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/views/LoginPage'),
    meta: { skipAutoLogin: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/views/MainPage'),
    meta: { requiresAuth: true }  // 添加需要认证的标记
  },
  {
    path: '/YanJingNocoBaseSystemManager',
    name: 'SystemManager',
    component: () => import('@/views/ManagerSystem/MainPage'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },

]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 核心逻辑：路由守卫
router.beforeEach(async (to) => {
  // 仅在 Electron 环境下执行强制安装检查
  if (window.electronAPI) {
    const isDev = await window.electronAPI.getIsDev();

    // 打包后的 Electron 客户端不展示官网首页，根路由直接进入登录页
    if (!isDev && to.path === '/') {
      return '/login';
    }

    if (isDev) return true;

    const isInstalled = await getSetting('is_installed');
    console.log('[System:Router:beforeEach] Check isInstalled:', isInstalled);

    if (!isInstalled && to.path !== '/setup') {
      // 如果未安装且目标不是安装页，强制跳转
      console.log('[System:Router:beforeEach] 未检测到安装标志，拦截并重定向到 /setup');
      return '/setup';
    }

    if (isInstalled && to.path === '/setup') {
      // 如果已安装但尝试进入安装页，重定向到首页
      return '/chat';
    }
  }




  // 认证检查,如果有matrixtoken，则直接进入mainpage
  const matrixAccessToken = await SystemStorageManager.getMatrixAccessToken();
  const hasToken = matrixAccessToken !== null && matrixAccessToken !== '';

  // 认证检查，如果有LoginToken且自动登录完成标记，则认为自动登录已完成
  const loginToken = await SystemStorageManager.getLoginToken();
  const hasLoginToken = loginToken !== null && loginToken !== '';

  let AutoLoginCompleted = await SystemStorageManager.getAutoLoginCompleted() === true;

  console.log('[System:Router:beforeEach] 检查是否有MatrixAccessToken:', hasToken, '自动登录AutoLoginCompleted:', AutoLoginCompleted);


  if (to.meta.requiresAuth) {
    if (!hasToken || !hasLoginToken) {
      console.log('[System:Router:beforeEach] 目标页面需要认证，但未检测到有效的MatrixAccessToken或LoginToken，重定向到登录页');
      return {
        path: '/login',
        query: { redirect: to.fullPath }
      };
    }

    const hasClient = !!matrixClient.getAuthedClient()
    const skipAutoLogin = to.meta.skipAutoLogin === true

    // 无客户端或自动登录未完成时，尝试在守卫内自动登录
    if ((!AutoLoginCompleted || !hasClient) && !skipAutoLogin) {
      const user = await matrixClient.autoLogin()
      if (user) {
        await SystemStorageManager.setAutoLoginCompleted(true)
        AutoLoginCompleted = true
      } else {
        await SystemStorageManager.setAutoLoginCompleted(false)
        return {
          path: '/login',
          query: { redirect: to.fullPath, autoLogin: 'true' }
        }
      }
    }

    //有token但自动登录未完成
    if (!AutoLoginCompleted && !skipAutoLogin) {
      console.log('[System:Router:beforeEach] 目标页面需要认证，但自动登录流程未完成，重定向到登录页');
      return {
        path: '/login',
        //添加autoLogin标记，登录页自动登录
        query: { redirect: to.fullPath, autoLogin: 'true' }
      }
    }

    //如果访问登录页且有token且自动登录完成，并且没有显示的autoLogin请求，则重定向到主页面
    if (to.path === '/login' && hasToken && hasLoginToken && AutoLoginCompleted && to.query.autoLogin !== 'true') {
      console.log('[System:Router:beforeEach] 已检测到有效的MatrixAccessToken且自动登录标记为true，重定向到主页面');
      return {
        path: '/chat'
      }
    }
  }



  return true;
});

export default router

