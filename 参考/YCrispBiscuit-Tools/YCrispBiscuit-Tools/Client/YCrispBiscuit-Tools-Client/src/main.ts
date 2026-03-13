// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/global.scss'
import './styles/variables.scss'
import App from './App.vue'
import router from './router' // 导入路由
import { createDiscreteApi } from 'naive-ui'
import '@vue-flow/core/dist/style.css'


// 创建 Pinia 实例
const pinia = createPinia()
const { message } = createDiscreteApi(['message'])
const app = createApp(App)



// 使用 Pinia
app.use(pinia)


app.use(router) // 使用路由


app.provide('message', message)


app.mount('#app')