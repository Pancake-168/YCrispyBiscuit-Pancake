// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/global.scss'
import './styles/variables.scss'
import App from './App.vue'
import router from './router' // 导入路由
import { createDiscreteApi } from 'naive-ui'
import { useAppStore } from '@/stores/app'
import '@vue-flow/core/dist/style.css'
import i18n from '@/stores/language'


// Polyfill for Promise.withResolvers (ES2024 feature not supported in all environments)
if (typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function<T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}



// 应用启动时不再强制清除登录完成标识，由路由守卫根据实际 token 状态判断
console.log('[App] 应用启动')
// 每次刷新页面时清除自动登录完成标记，强制重新执行自动登录流程以初始化 Matrix 客户端
sessionStorage.removeItem('auto_login_completed')

// 创建 Pinia 实例
const pinia = createPinia()
const { message } = createDiscreteApi(['message'])
const app = createApp(App)


// 使用 Pinia
app.use(pinia)



app.use(router) // 使用路由
app.use(i18n)

app.provide('message', message)

// 默认设置为暗色主题（黑色）
const appStore = useAppStore();
if (appStore.isDark) {
    appStore.toggleTheme();
}
// 设置 html 的 data-theme 属性为 dark
if (document.documentElement.getAttribute('data-theme') !== 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

app.mount('#app')