<template>
  <div class="right-content-container" :class="{ 'right-content-container--focus': focusModeActive, 'right-content-container--left-collapsed': leftCollapsed }">
    <!-- 常规聊天窗口 -->
    <div
      v-if="chatContext?.currentRoomId?.value && !isAssistantRoom"
      class="content-area"
    >
      <Chat />
    </div>

    <!-- AI 助手专用窗口，保留独立结构便于后续定制 -->
    <div
      v-else-if="chatContext?.currentRoomId?.value && isAssistantRoom"
      class="content-area"
    >
      <ChatForUserBot />
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
import { computed, inject, ref, provide, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { getAssistantRoomIdFromProfile } from '@/utils/assistantRoom'
import { useTaskStore } from '@/stores/task'
import { useAssistantSidebarStore } from '@/stores/assistantSidebar'
import { useUserbotWebSocket } from '@/services/userbot/useUserbotWebSocket'
import Chat from './Chat'
import ChatForUserBot from './ChatForUserBot'

const chatContext = inject('chatContext') as any
const taskStore = useTaskStore()
const assistantSidebarStore = useAssistantSidebarStore()
const { focusModeActive } = storeToRefs(assistantSidebarStore)

// --- WebSocket & Streaming Logic Start ---
// 流式消息状态管理
interface StreamMessage {
  roomId: string
  content: string
  thinkContent: string
  contentType: 'think' | 'reporter'
  timestamp: number
}

const streamMessages = ref<Map<string, StreamMessage>>(new Map())

// 初始化WebSocket连接
const handleWebSocketMessage = (data: any) => {
  console.log('[NewRightContent] 收到WebSocket消息:', data)
  
  const { state, content_type, content, room_id } = data
  
  if (state === 'appending') {
    // 累积流式内容
    const key = room_id
    const existing = streamMessages.value.get(key)
    
    if (content_type === 'think') {
      // 思考过程
      console.log('[NewRightContent] 接收思考内容:', content)
      streamMessages.value.set(key, {
        roomId: room_id,
        content: existing?.content || '',
        thinkContent: (existing?.thinkContent || '') + content,
        contentType: 'think',
        timestamp: Date.now()
      })
    } else if (content_type === 'reporter' || content_type === 'text') {
      // 正式回答
      console.log('[NewRightContent] 接收回答内容:', content)
      streamMessages.value.set(key, {
        roomId: room_id,
        content: (existing?.content || '') + content,
        thinkContent: existing?.thinkContent || '',
        contentType: 'reporter',
        timestamp: Date.now()
      })
    }
  } else if (state === 'finish') {
    // 流式结束,等待 Matrix 正式消息
    console.log('[NewRightContent] 流式任务完成,等待Matrix消息到达')
    // 不删除 streamMessages,等 Matrix 消息到达后再清理
  }
}

// 使用 chatContext 中的 currentRoomId
const currentRoomId = computed(() => chatContext?.currentRoomId?.value)

const { isConnected, send, onClose, connect } = useUserbotWebSocket(
  currentRoomId, // Pass the computed ref for safety
  handleWebSocketMessage,
  { manualConnect: true } // 启用手动连接模式
)

// 拦截并包装 sendMessage，在发送消息前触发 WebSocket 连接
const originalChatContext = inject('chatContext') as any
const wrappedChatContext = {
  ...originalChatContext,
  sendMessage: async (...args: any[]) => {
    console.log('[NewRightContent] 拦截 sendMessage，触发 WebSocket 连接...')
    connect() // 手动触发连接
    if (originalChatContext?.sendMessage) {
      return await originalChatContext.sendMessage(...args)
    }
  }
}

// 提供包装后的 chatContext 给子组件
provide('chatContext', wrappedChatContext)

// 监听WebSocket关闭事件
onClose(() => {
  console.log('[NewRightContent] WebSocket连接已关闭')
  // 清理所有流式消息
  streamMessages.value.clear()
})

// 监听房间切换,清理旧房间的流式消息
watch(() => currentRoomId.value, (newRoomId, oldRoomId) => {
  if (oldRoomId && oldRoomId !== newRoomId) {
    console.log('[NewRightContent] 房间切换,清理旧房间流式消息:', oldRoomId)
    streamMessages.value.delete(oldRoomId)
  }
})

// 提供流式消息和当前房间ID给子组件
provide('streamMessages', streamMessages)
provide('currentRoomId', currentRoomId)

console.log('[NewRightContent] WebSocket服务已初始化')
// --- WebSocket & Streaming Logic End ---

// 右侧容器在左侧收起时也应该取消最大宽度限制（与专注模式一致）
const leftCollapsed = computed(() => {
  try {
    // 调用chatContext暴露的方法，可能返回boolean
    return chatContext?.getFunctionSidebarCollapsed?.() ?? false
  } catch (e) {
    return false
  }
})

const isAssistantRoom = computed(() => {
  const assistantRoomId = getAssistantRoomIdFromProfile()
  const currentId = chatContext?.currentRoomId?.value
  
  // AI 助手范围：唤醒房间 / 任务房间 / 补漏的bot房间
  const isAwakeningRoom = !!assistantRoomId && !!currentId && currentId === assistantRoomId
  const isTaskRoom = taskStore.taskRoomIds.includes(currentId)
  const isExtraBotRoom = (assistantSidebarStore.noTaskButUserBotRoomIds || []).includes(currentId)
  
  return isAwakeningRoom || isTaskRoom || isExtraBotRoom
})
</script>

<style scoped>
.right-content-container {
  flex: 1;
  background: var(--bg-color-third);
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  max-width: none;
}

/* 专注模式下不限制最大宽度 */
.right-content-container--focus {
  max-width: none;
}

/* 左侧收起时取消右侧最大宽度限制 */
.right-content-container--left-collapsed {
  max-width: none;
}

/* 移动端下也取消最大宽度限制（可根据项目需要调整断点） */
@media (max-width: 768px) {
  .right-content-container {
    max-width: none;
  }
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
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
  font-size: calc(var(--font-size-xxl) * 1.2);
  font-weight: 600;
}

.welcome-message p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: var(--font-size-lg);
  line-height: 1.5;
}
</style>
