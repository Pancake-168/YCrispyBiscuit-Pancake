import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getSetting } from '@/utils/storage'
//import { SystemStorageManager } from '@/utils/SystemStorage'


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/setup',
    name: 'Setup',
    component: () => import('../views/WelcomeSetup.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
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
    if (isDev) return true;

    const isInstalled = await getSetting('is_installed');
    console.log('[Router Guard] Check isInstalled:', isInstalled);

    if (!isInstalled && to.path !== '/setup') {
      // 如果未安装且目标不是安装页，强制跳转
      console.log('[Router] 未检测到安装标志，拦截并重定向到 /setup');
      return '/setup';
    }

    if (isInstalled && to.path === '/setup') {
      // 如果已安装但尝试进入安装页，重定向到首页
      return '/';
    }
  }

  return true;
});

export default router

