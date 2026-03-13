<template>
  <div class="chat-with-invitations">
    <!-- 聊天消息列表 -->
    <div class="message-list">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message-wrapper"
      >
        <!-- 普通消息 -->
        <div v-if="message.type === 'text'" class="text-message">
          <div class="message-sender">{{ message.sender }}</div>
          <div class="message-content">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
        
        <!-- 邀请消息分支渲染 -->
        <InvitationMessage
          v-else-if="message.type === 'invitation' && message.roomId && message.inviterId && message.status"
          :room-id="message.roomId"
          :inviter-id="message.inviterId"
          :inviter-display-name="message.inviterDisplayName"
          :room-name="message.roomName"
          :room-topic="message.roomTopic"
          :member-count="message.memberCount"
          :is-encrypted="message.isEncrypted"
          :invite-reason="message.inviteReason"
          :timestamp="message.timestamp"
          :status="message.status"
          :error-message="message.errorMessage"
          @status-changed="handleInviteStatusChange"
          @open-room="handleOpenRoom"
          @request-invite="handleRequestInvite"
        />
        
        <!-- 系统消息 -->
        <div v-else-if="message.type === 'system'" class="system-message">
          <div class="system-content">{{ message.content }}</div>
          <div class="system-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <input 
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="输入消息..."
        class="message-input"
      />
      <button @click="sendMessage" class="send-btn">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import InvitationMessage from './InvitationMessage.vue'

// 消息类型定义
interface ChatMessage {
  id: string
  type: 'text' | 'invitation' | 'system'
  sender?: string
  content?: string
  timestamp: number
  
  // 邀请消息特有字段
  roomId?: string
  inviterId?: string
  inviterDisplayName?: string
  roomName?: string
  roomTopic?: string
  memberCount?: number
  isEncrypted?: boolean
  inviteReason?: string
  status?: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired' | 'error'
  errorMessage?: string
}

// 响应式数据
const newMessage = ref('')
const messages = reactive<ChatMessage[]>([
  {
    id: '1',
    type: 'text',
    sender: 'Alice',
    content: '大家好！',
    timestamp: Date.now() - 3600000
  },
  {
    id: '2',
    type: 'invitation',
    roomId: '!example:matrix.org',
    inviterId: '@alice:matrix.org',
    inviterDisplayName: 'Alice',
    roomName: '项目讨论组',
    roomTopic: '讨论新项目的开发计划和进度',
    memberCount: 5,
    isEncrypted: true,
    inviteReason: '邀请您参与项目讨论，期待您的参与！',
    timestamp: Date.now() - 1800000,
    status: 'pending'
  },
  {
    id: '3',
    type: 'system',
    content: 'Bob 加入了聊天',
    timestamp: Date.now() - 900000
  },
  {
    id: '4',
    type: 'text',
    sender: 'Bob',
    content: '感谢邀请！',
    timestamp: Date.now() - 600000
  },
  {
    id: '5',
    type: 'invitation',
    roomId: '!another:matrix.org',
    inviterId: '@charlie:matrix.org',
    inviterDisplayName: 'Charlie',
    roomName: '技术分享',
    roomTopic: '分享最新的技术趋势和学习心得',
    memberCount: 12,
    isEncrypted: false,
    timestamp: Date.now() - 300000,
    status: 'accepted'
  }
])

// 方法
const sendMessage = () => {
  if (!newMessage.value.trim()) return
  
  const message: ChatMessage = {
    id: Date.now().toString(),
    type: 'text',
    sender: '我',
    content: newMessage.value.trim(),
    timestamp: Date.now()
  }
  
  messages.push(message)
  newMessage.value = ''
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 邀请消息事件处理
const handleInviteStatusChange = (status: string, roomId: string) => {
  console.log('邀请状态变更:', status, roomId)
  
  // 找到对应的邀请消息并更新状态
  const inviteMessage = messages.find(msg => 
    msg.type === 'invitation' && msg.roomId === roomId
  )
  
  if (inviteMessage) {
    inviteMessage.status = status as any
    
    // 添加系统消息通知状态变更
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: getStatusChangeMessage(status, inviteMessage.roomName || roomId),
      timestamp: Date.now()
    }
    
    messages.push(systemMessage)
  }
}

const handleOpenRoom = (roomId: string) => {
  console.log('打开房间:', roomId)
  
  // 这里应该跳转到房间页面或打开房间窗口
  const systemMessage: ChatMessage = {
    id: Date.now().toString(),
    type: 'system',
    content: `正在跳转: ${roomId}`,
    timestamp: Date.now()
  }
  
  messages.push(systemMessage)
}

const handleRequestInvite = (roomId: string, inviterId: string) => {
  console.log('请求新邀请:', roomId, inviterId)
  
  // 这里应该发送请求新邀请的消息
  const systemMessage: ChatMessage = {
    id: Date.now().toString(),
    type: 'system',
    content: `已向 ${inviterId} 请求新的邀请`,
    timestamp: Date.now()
  }
  
  messages.push(systemMessage)
}

const getStatusChangeMessage = (status: string, roomName: string) => {
  switch (status) {
    case 'accepted':
      return `您已接受邀请，成功加入 "${roomName}"`
    case 'declined':
      return `您已拒绝加入 "${roomName}" 的邀请`
    case 'error':
      return `处理 "${roomName}" 的邀请时出现错误`
    default:
      return ` "${roomName}" 的邀请状态已更新`
  }
}

// 模拟接收新的邀请消息
const simulateNewInvite = () => {
  const newInvite: ChatMessage = {
    id: Date.now().toString(),
    type: 'invitation',
    roomId: `!room${Date.now()}:matrix.org`,
    inviterId: '@david:matrix.org',
    inviterDisplayName: 'David',
    roomName: '新项目启动会',
    roomTopic: '讨论新项目的启动细节',
    memberCount: 3,
    isEncrypted: true,
    inviteReason: '邀请您参加新项目启动会议',
    timestamp: Date.now(),
    status: 'pending'
  }
  
  messages.push(newInvite)
}

// 暴露方法给父组件
defineExpose({
  simulateNewInvite
})
</script>

<style scoped>
.chat-with-invitations {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: var(--bg-color-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-wrapper {
  max-width: 100%;
}

.text-message {
  background: var(--bg-color-secondary);
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid var(--color-primary);
}

.message-sender {
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
  margin-bottom: 4px;
}

.message-content {
  color: var(--text-color);
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.message-time {
  font-size: 11px;
  color: var(--text-color-secondary);
  text-align: right;
}

.system-message {
  text-align: center;
  padding: 8px;
  background: var(--bg-color-tertiary);
  border-radius: 6px;
  margin: 4px 20px;
}

.system-content {
  font-size: 13px;
  color: var(--text-color-secondary);
  font-style: italic;
}

.system-time {
  font-size: 10px;
  color: var(--text-color-secondary);
  margin-top: 2px;
}

.input-area {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-color-secondary);
}

.message-input {
  flex: 1;
  padding: 10px 12px;
  background: var(--bg-color-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-color);
  font-size: 14px;
}

.message-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.send-btn {
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.send-btn:hover {
  background: var(--color-primary-hover);
}
</style>
