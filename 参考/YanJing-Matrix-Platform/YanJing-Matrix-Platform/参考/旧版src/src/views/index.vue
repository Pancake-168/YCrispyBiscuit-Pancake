<template>
  <div class="matrix-chat-diy">
    <!-- 应用的主路由入口：根据登录状态决定显示什么页面 -->
    <LoginPage 
      v-if="!isLoggedIn" 
      @login-success="handleLoginSuccess" 
    />
    
        <MainPage 
      v-else 
      :user-id="currentUser?.userId || ''"
      @logout="handleLogout" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref ,onMounted} from 'vue'
import LoginPage from './views/LoginPage'
import MainPage from './views/MainPage'
import type { MatrixUser } from '../types'





// ===== 应用级状态管理 =====
/** 用户是否已登录 */
const isLoggedIn = ref(false)

/** 当前登录用户信息 */
const currentUser = ref<MatrixUser | null>(null)








// ===== 事件处理函数 =====

/**
 * 处理登录成功事件
 * 当用户在登录页面成功登录后，切换到聊天页面
 * @param userInfo - 登录成功的用户信息
 */
const handleLoginSuccess = (userInfo: MatrixUser) => {
  console.log('用户登录成功:', userInfo.userId)
  
  // 先设置用户信息，再设置登录状态，避免props更新导致的循环
  currentUser.value = userInfo
  isLoggedIn.value = true
  
  console.log('已切换到聊天页面')
}

/**
 * 处理用户登出事件
 * 当用户在聊天页面点击登出后，切换回登录页面
 */
const handleLogout = () => {
  console.log('用户请求登出')
  
  // 清理应用状态
  isLoggedIn.value = false
  currentUser.value = null
  
  console.log('已切换到登录页面')
}

// ===== 应用初始化 =====
console.log('研境AI聊天应用已启动')
</script>

<style scoped>
.matrix-chat-diy {
  width: 100%;
  height: 100vh; /* 占满整个视口高度 */
  overflow: hidden; /* 防止出现滚动条 */
}
</style>


