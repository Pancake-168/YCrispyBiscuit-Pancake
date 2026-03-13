// router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'views',
    // 懒加载视图组件（保持构建体积小）
    component: () => import('@/views')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 如果以后需要路由守卫，可以在此处恢复并导入相关类型/store
// router.beforeEach((to) => { /* ... */ })

export default router