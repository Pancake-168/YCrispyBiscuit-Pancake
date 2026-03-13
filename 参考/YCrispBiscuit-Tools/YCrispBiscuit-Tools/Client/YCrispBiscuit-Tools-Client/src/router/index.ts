// router/index.ts
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import Home from '../views/Home.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false }
  },
  {
    path: '/Tools',
    name: 'Tools',
    component: () => import('../views/Tools.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/About',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/Documentations',
    name: 'Documentations',
    component: () => import('../views/Documentations.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/Documentations/index',
    name: 'DocumentationsIndex',
    component: () => import('../views/Documentations'),
    meta: { requiresAuth: false }
  },

  {
    path: '/Tools/ACGN_Personal_Preference_Table_Generator',
    name: 'ACGN_Personal_Preference_Table_Generator',
    component: () => import('../views/Tools/ACGN_Personal_Preference_Table_Generator'),
    meta: { requiresAuth: false }
  },
  {
    path: '/Tools/BackgroundForClient',
    name: 'BackgroundForClient',
    component: () => import('../views/Tools/BackgroundForClient'),
    meta: { requiresAuth: false }
  }

]
const router = createRouter({
  history: createWebHistory(), // ← 只需改这行
  routes
})

router.beforeEach((to: RouteLocationNormalized) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      path: '/',
      query: { redirect: to.fullPath !== '/' ? to.fullPath : undefined }
    }
  }
})

export default router