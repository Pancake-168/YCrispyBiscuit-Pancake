<template>
  <div class="right-content-container">
    <!-- 根据当前功能显示不同内容 -->
    <div v-if="chatContext?.currentRoomId?.value" class="content-area">
      <!-- 聊天功能组件 - 不传递props，使用inject -->
      <Chat />
    </div>

    <!-- 未选择房间时的欢迎页面 -->
    <div v-else class="welcome-content">
      <div class="welcome-message">
        <h2>欢迎使用 研境AI 聊天</h2>
        <p>选择一个频道开始聊天，或者加入新的频道</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import Chat from './Chat/index.vue'

// 注入聊天上下文
const chatContext = inject('chatContext') as any

// 调试RightContent的chatContext
console.log('RightContent - chatContext:', {
  hasChatContext: !!chatContext,
  currentRoomId: chatContext?.currentRoomId?.value,
  shouldShowChat: !!chatContext?.currentRoomId?.value
})
</script>

<style scoped>
.right-content-container {
  flex: 1;
  background-color: var(--bg-color);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.welcome-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-message {
  text-align: center;
  max-width: 400px;
}

.welcome-message h2 {
  margin: 0 0 16px 0;
  color: var(--text-color);
  font-size: 24px;
  font-weight: 600;
}

.welcome-message p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 16px;
  line-height: 1.5;
}
</style>
