<template>
  <div class="chat-view">
    <RoomStatusIndicator 
      :room-id="currentRoomIdForStatus"
      :membership-status="membershipStatus"
      @status-changed="handleStatusChanged"
    >
      <!-- 正常聊天界面 -->
      <template v-if="membershipStatus === 'join'">
        <!-- 聊天头部 -->
        <ChatHeader />
        
        <!-- 调试传递给ChatHeader的数据 -->
        <!-- {{ console.log('传递给ChatHeader的数据:', { roomName: roomName?.value, roomId: currentRoomId?.value, agentID: props.agentID, applicationId: props.applicationId }) }} -->

        <!-- 消息区域 -->
                <!-- 消息区域 -->
  <MessageArea :messages="messages || []" :current-user-id="currentUserId|| ''" :room-id="currentRoomId?.value" @mention-user="handleMentionUser" />

        <!-- 输入区域 -->
        <InputArea 
          ref="inputAreaRef"
          :sending="currentSending"
          @send-message="handleSendMessage"
        />
      </template>
    </RoomStatusIndicator>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, watch, onMounted } from 'vue'
import ChatHeader from './ChatHeader/index.vue'
import MessageArea from './MessageArea/index.vue'
import InputArea from './InputArea/index.vue'
import RoomStatusIndicator from './RoomStatusIndicator/index.vue'
import { roomServiceV2 } from '../../../../../services/matrix/rooms'

// 接收props参数
interface Props {
  agentID?: string
  applicationId?: string
}

const props = defineProps<Props>()

// 注入聊天上下文
const chatContext = inject('chatContext') as any

if (!chatContext) {
  console.error('chatContext not found! Make sure the parent component provides it.')
}

// 从上下文中解构出需要的数据
const {
  currentRoomId,
  roomName,
  sending,
  messages,
  currentUserId,
  sendMessage
} = chatContext || {}

// 调试chatContext数据
console.log('Chat component - chatContext data:', {
  currentRoomId: currentRoomId?.value,
  roomName: roomName?.value,
  hasMessages: !!messages,
  messagesLength: messages?.value?.length || 0,
  currentUserId: currentUserId?.value,
  hasSendMessage: !!sendMessage,
  props: props
})

// 房间状态管理
const membershipStatus = ref<string | null>(null)
const currentRoomIdForStatus = ref<string | undefined>(undefined)
const inputAreaRef = ref<any>(null)

// 监听membershipStatus变化
watch(membershipStatus, (newStatus) => {
  console.log('Chat组件 - membershipStatus变化:', {
    newStatus,
    shouldShowChatHeader: newStatus === 'join'
  })
})

// 创建计算属性确保响应式更新
const currentSending = computed(() => sending?.value || false)

// 检查房间状态
const checkRoomStatus = () => {
  if (currentRoomId?.value) {
    const status = roomServiceV2.获取用户房间状态(currentRoomId.value)
    membershipStatus.value = status
    currentRoomIdForStatus.value = currentRoomId.value
  } else {
    membershipStatus.value = null
    currentRoomIdForStatus.value = undefined
  }
}

// 处理@提及用户事件
const handleMentionUser = (userId: string, displayName: string) => {
  console.log('Chat handleMentionUser:', { userId, displayName })
  // 调用InputArea的insertMention方法
  if (inputAreaRef.value && inputAreaRef.value.insertMention) {
    inputAreaRef.value.insertMention(displayName, userId)
  }
}

// 处理发送消息（接收来自InputArea的消息内容）
const handleSendMessage = async (
	messageData: { plainText: string; htmlText: string; hasMentions: boolean },
	replyToEventId?: string,
) => {
  console.log('Chat handleSendMessage called:', {
    messageData,
    membershipStatus: membershipStatus.value,
    hasSendMessage: !!sendMessage,
    currentRoomId: currentRoomId?.value,
    replyToEventId,
  })
  
  if (sendMessage && membershipStatus.value === 'join') {
    await sendMessage(messageData, replyToEventId)
  } else {
    console.warn('无法发送消息:', {
      membershipStatus: membershipStatus.value,
      hasSendMessage: !!sendMessage
    })
  }
}

// 处理状态变化
const handleStatusChanged = () => {
  checkRoomStatus()
  
  // 通知父组件刷新数据
  if (chatContext?.refreshRoomData) {
    chatContext.refreshRoomData()
  }
}

// 监听房间ID变化
watch(() => currentRoomId?.value, (newRoomId) => {
  console.log('Chat组件 - 房间ID变化:', {
    newRoomId,
    roomName: roomName?.value,
    currentUserId: currentUserId?.value,
    membershipStatus: membershipStatus.value
  })
  
  // 调试传递给ChatHeader的具体数据
  console.log('传递给ChatHeader的数据:', {
    'room-name': roomName?.value || '',
    'room-id': currentRoomId?.value || '',
    'agent-i-d': props.agentID || '',
    'application-id': props.applicationId || ''
  })
  
  checkRoomStatus()
}, { immediate: true })

// 组件挂载时检查状态
onMounted(() => {
  checkRoomStatus()
})
</script>

<style scoped>
.chat-view {
   background-color: var(--bg-color-fourth);
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  --chat-icon-color: var(--text-color-secondary, #565656);
  --chat-icon-color-hover: var(--color-primary, #5865f2);
  --chat-icon-bubble-bg: rgba(88, 101, 242, 0.12);
  --chat-send-icon-color: var(--color-primary, #5865f2);
  --chat-gradient-start: #d0bcff;
  --chat-gradient-end: #e3e3e3;
}

:global([data-theme='light']) .chat-view {
  --chat-icon-color: var(--text-color-secondary, #565656);
  --chat-icon-color-hover: var(--color-primary, #4c51ff);
  --chat-icon-bubble-bg: rgba(88, 101, 242, 0.12);
  --chat-send-icon-color: var(--color-primary, #5865f2);
  --chat-gradient-start: #d0bcff;
  --chat-gradient-end: #e3e3e3;
}

:global([data-theme='dark']) .chat-view {
  --chat-icon-color: var(--text-color, #f5f7ff);
  --chat-icon-color-hover: var(--color-primary, #9ca6ff);
  --chat-icon-bubble-bg: rgba(112, 123, 255, 0.2);
  --chat-send-icon-color: #f5f7ff;
  --chat-gradient-start: #9fa8ff;
  --chat-gradient-end: #d4d8ff;
}

/* 开发模式面板样式 */
.dev-panel {
  background: #f0f0f0;
  border: 2px dashed #ccc;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
}

.dev-panel h4 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: calc(var(--font-size-sm) + 1px);
}

.dev-controls {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.dev-controls button {
  padding: 5px 10px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 3px;
  cursor: pointer;
  font-size: var(--font-size-xs);
}

.dev-controls button:hover {
  background: #f5f5f5;
}

.dev-controls button.active {
  background: #007acc;
  color: white;
  border-color: #007acc;
}

.dev-controls button.close-dev {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
  margin-left: auto;
}

.dev-controls button.close-dev:hover {
  background: #c82333;
}

.dev-panel p {
  margin: 0;
  font-size: var(--font-size-xs);
  color: #666;
  font-family: monospace;
}

/* 开发模式切换按钮 */
.dev-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #007acc;
  color: white;
  font-size: var(--font-size-lg);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.dev-toggle:hover {
  background: #005a9e;
  transform: scale(1.1);
}
</style>
