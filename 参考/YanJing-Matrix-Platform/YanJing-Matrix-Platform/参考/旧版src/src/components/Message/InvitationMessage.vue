<template>
  <div class="invitation-message" :class="invitationStatus">
    <!-- 邀请消息显示 -->
    <div class="invitation-content">
      <div class="invitation-header">
        <div class="invitation-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
          </svg>
        </div>
        <span class="invitation-title">邀请</span>
      </div>
      
      <div class="invitation-details">
        <div class="room-info">
          <h4>{{ roomName || roomId }}</h4>
          <p v-if="roomTopic" class="room-topic">{{ roomTopic }}</p>
          <div class="room-meta">
            <span class="member-count">{{ memberCount }} 名成员</span>
            <span v-if="isEncrypted" class="encryption-status">🔒 加密</span>
          </div>
        </div>
        
        <div class="inviter-info">
          <span class="inviter-label">邀请人:</span>
          <span class="inviter-name">{{ getInviterDisplayName() }}</span>
        </div>
        
        <div v-if="inviteReason" class="invite-reason">
          <p>{{ inviteReason }}</p>
        </div>
      </div>
      
      <!-- 邀请状态分支渲染 -->
      <div class="invitation-actions">
        <!-- 待处理状态 -->
        <template v-if="status === 'pending'">
          <div class="action-buttons">
            <button 
              @click="handleAccept" 
              :disabled="processing"
              class="accept-btn"
            >
              {{ processing && actionType === 'accept' ? '加入中...' : '接受邀请' }}
            </button>
            <button 
              @click="handleDecline" 
              :disabled="processing"
              class="decline-btn"
            >
              {{ processing && actionType === 'decline' ? '拒绝中...' : '拒绝' }}
            </button>
          </div>
          <div class="action-hint">
            <small>您可以接受邀请加入，或者拒绝此邀请</small>
          </div>
        </template>
        
        <!-- 已接受状态 -->
        <template v-else-if="status === 'accepted'">
          <div class="status-message accepted">
            <div class="status-icon">✓</div>
            <div class="status-text">
              <span class="status-title">已加入</span>
              <small>您已成功加入</small>
            </div>
            <button @click="openRoom" class="open-room-btn">
              进入
            </button>
          </div>
        </template>
        
        <!-- 已拒绝状态 -->
        <template v-else-if="status === 'declined'">
          <div class="status-message declined">
            <div class="status-icon">✗</div>
            <div class="status-text">
              <span class="status-title">已拒绝邀请</span>
              <small>您已拒绝加入此</small>
            </div>
            <button @click="reconsider" class="reconsider-btn">
              重新考虑
            </button>
          </div>
        </template>
        
        <!-- 邀请已撤销状态 -->
        <template v-else-if="status === 'cancelled'">
          <div class="status-message cancelled">
            <div class="status-icon">⚠</div>
            <div class="status-text">
              <span class="status-title">邀请已撤销</span>
              <small>邀请人已撤销此邀请</small>
            </div>
          </div>
        </template>
        
        <!-- 邀请过期状态 -->
        <template v-else-if="status === 'expired'">
          <div class="status-message expired">
            <div class="status-icon">⏰</div>
            <div class="status-text">
              <span class="status-title">邀请已过期</span>
              <small>此邀请已超过有效期</small>
            </div>
            <button @click="requestNewInvite" class="request-new-btn">
              请求新邀请
            </button>
          </div>
        </template>
        
        <!-- 处理失败状态 -->
        <template v-else-if="status === 'error'">
          <div class="status-message error">
            <div class="status-icon">!</div>
            <div class="status-text">
              <span class="status-title">处理失败</span>
              <small>{{ errorMessage }}</small>
            </div>
            <button @click="retry" class="retry-btn">
              重试
            </button>
          </div>
        </template>
      </div>
    </div>
    
    <!-- 时间戳 -->
    <div class="invitation-timestamp">
      {{ formatTimestamp(timestamp) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { inviteManagementServiceV2 } from '../../services/members/invite.service'
import { resolveUserDisplayName } from '@/utils/displayName'

interface Props {
  roomId: string
  inviterId: string
  inviterDisplayName?: string
  roomName?: string
  roomTopic?: string
  memberCount?: number
  isEncrypted?: boolean
  inviteReason?: string
  timestamp: number
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired' | 'error'
  errorMessage?: string
}

const props = defineProps<Props>()

const getInviterDisplayName = () =>
  resolveUserDisplayName({
    matrixId: props.inviterId || null,
    matrixDisplayName: props.inviterDisplayName || null,
  })

const emit = defineEmits<{
  statusChanged: [status: string, roomId: string]
  openRoom: [roomId: string]
  requestInvite: [roomId: string, inviterId: string]
}>()

// 响应式数据
const processing = ref(false)
const actionType = ref<'accept' | 'decline' | ''>('')

// 计算属性
const invitationStatus = computed(() => {
  return `invitation-${props.status}`
})

// 方法
const handleAccept = async () => {
  if (processing.value) return
  
  processing.value = true
  actionType.value = 'accept'
  
  try {
    await inviteManagementServiceV2.接受邀请(props.roomId)
    emit('statusChanged', 'accepted', props.roomId)
  } catch (error: any) {
    console.error('[V2] 接受邀请失败:', error)
    emit('statusChanged', 'error', props.roomId)
  } finally {
    processing.value = false
    actionType.value = ''
  }
}

const handleDecline = async () => {
  if (processing.value) return
  
  processing.value = true
  actionType.value = 'decline'
  
  try {
    await inviteManagementServiceV2.拒绝邀请(props.roomId)
    emit('statusChanged', 'declined', props.roomId)
  } catch (error: any) {
    console.error('[V2] 拒绝邀请失败:', error)
    emit('statusChanged', 'error', props.roomId)
  } finally {
    processing.value = false
    actionType.value = ''
  }
}

const openRoom = () => {
  emit('openRoom', props.roomId)
}

const reconsider = () => {
  emit('statusChanged', 'pending', props.roomId)
}

const requestNewInvite = () => {
  emit('requestInvite', props.roomId, props.inviterId)
}

const retry = () => {
  emit('statusChanged', 'pending', props.roomId)
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) { // 7天内
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 生命周期
onMounted(() => {
  // 如果是待处理状态，检查邀请是否仍然有效
  if (props.status === 'pending') {
    checkInviteStatus()
  }
})

const checkInviteStatus = async () => {
  try {
    const invites = await inviteManagementServiceV2.获取待处理邀请()
    const invite = invites.find((inv: any) => inv.roomId === props.roomId)
    
    if (!invite) {
      // 邀请不存在，可能已过期或被撤销
      emit('statusChanged', 'expired', props.roomId)
    }
  } catch (error) {
    console.warn('[V2] 检查邀请状态失败:', error)
  }
}
</script>

<style scoped>
.invitation-message {
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
  max-width: 400px;
  transition: all 0.3s ease;
}

.invitation-message:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.invitation-pending {
  border-left: 4px solid #3b82f6;
}

.invitation-accepted {
  border-left: 4px solid #22c55e;
}

.invitation-declined {
  border-left: 4px solid #ef4444;
}

.invitation-cancelled {
  border-left: 4px solid #f59e0b;
  opacity: 0.8;
}

.invitation-expired {
  border-left: 4px solid #6b7280;
  opacity: 0.7;
}

.invitation-error {
  border-left: 4px solid #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.invitation-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invitation-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invitation-icon {
  color: var(--color-primary);
  display: flex;
  align-items: center;
}

.invitation-title {
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
}

.invitation-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-info h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.room-topic {
  margin: 4px 0 0 0;
  color: var(--text-color-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.room-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.member-count,
.encryption-status {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.encryption-status {
  color: #22c55e;
}

.inviter-info {
  display: flex;
  gap: 4px;
  font-size: 13px;
}

.inviter-label {
  color: var(--text-color-secondary);
}

.inviter-name {
  color: var(--text-color);
  font-weight: 500;
}

.invite-reason {
  padding: 8px 12px;
  background: var(--bg-color-tertiary);
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
}

.invite-reason p {
  margin: 0;
  font-size: 13px;
  color: var(--text-color);
  font-style: italic;
}

.invitation-actions {
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.action-buttons button {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.accept-btn {
  background: #22c55e;
  color: white;
}

.accept-btn:hover:not(:disabled) {
  background: #16a34a;
}

.decline-btn {
  background: var(--bg-color-tertiary);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.decline-btn:hover:not(:disabled) {
  background: var(--border-color);
}

.action-buttons button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-hint {
  text-align: center;
}

.action-hint small {
  color: var(--text-color-secondary);
  font-size: 11px;
}

.status-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
}

.status-message.accepted {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-message.declined {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-message.cancelled {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-message.expired {
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.status-message.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.accepted .status-icon {
  background: #22c55e;
}

.declined .status-icon {
  background: #ef4444;
}

.cancelled .status-icon {
  background: #f59e0b;
}

.expired .status-icon {
  background: #6b7280;
}

.error .status-icon {
  background: #ef4444;
}

.status-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-title {
  font-weight: 500;
  color: var(--text-color);
  font-size: 13px;
}

.status-text small {
  color: var(--text-color-secondary);
  font-size: 11px;
}

.open-room-btn,
.reconsider-btn,
.request-new-btn,
.retry-btn {
  padding: 6px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.open-room-btn:hover,
.reconsider-btn:hover,
.request-new-btn:hover,
.retry-btn:hover {
  background: var(--color-primary-hover);
}

.invitation-timestamp {
  margin-top: 8px;
  text-align: right;
  font-size: 11px;
  color: var(--text-color-secondary);
}
</style>
