<template>
  <div class="notification-panel">
    <div class="notification-header">
      <h3>通知中心</h3>
      <div class="notification-actions">
        <button @click="markAllAsRead" :disabled="unreadCount === 0">
          全部已读
        </button>
        <button @click="clearAll" :disabled="notifications.length === 0">
          清空
        </button>
      </div>
    </div>

    <div class="notification-filters">
      <button 
        v-for="filter in filters" 
        :key="filter.value"
        :class="{ active: activeFilter === filter.value }"
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
        <span v-if="filter.count > 0" class="count-badge">{{ filter.count }}</span>
      </button>
    </div>

    <div class="notification-list" v-if="filteredNotifications.length > 0">
      <div 
        v-for="notification in filteredNotifications" 
        :key="notification.id"
        :class="['notification-item', { unread: !notification.read }]"
      >
        <div class="notification-icon">
          <span :class="getIconClass(notification.type)"></span>
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
          <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
        </div>
        <div class="notification-actions">
          <button 
            v-if="!notification.read" 
            @click="markAsRead(notification.id)"
            class="mark-read-btn"
          >
            标记已读
          </button>
          <button @click="removeNotification(notification.id)" class="remove-btn">
            ×
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🔔</div>
      <div class="empty-text">暂无通知</div>
    </div>

    <!-- 通知设置 -->
    <div class="notification-settings">
      <h4>通知设置</h4>
      <div class="setting-item">
        <label>
          <input 
            type="checkbox" 
            v-model="settings.desktopNotifications"
            @change="updateSettings"
          >
          桌面通知
        </label>
      </div>
      <div class="setting-item">
        <label>
          <input 
            type="checkbox" 
            v-model="settings.soundNotifications"
            @change="updateSettings"
          >
          声音提醒
        </label>
      </div>
      <div class="setting-item">
        <label>
          <input 
            type="checkbox" 
            v-model="settings.messageNotifications"
            @change="updateSettings"
          >
          消息通知
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'

interface Notification {
  id: string
  type: 'message' | 'system' | 'error' | 'warning'
  title: string
  message: string
  timestamp: number
  read: boolean
  roomId?: string
}

interface NotificationSettings {
  desktopNotifications: boolean
  soundNotifications: boolean
  messageNotifications: boolean
}

const chatContext = inject('chatContext') as any

const notifications = ref<Notification[]>([])
const activeFilter = ref<string>('all')
const settings = ref<NotificationSettings>({
  desktopNotifications: true,
  soundNotifications: true,
  messageNotifications: true
})

// 过滤器配置
const filters = computed(() => [
  {
    label: '全部',
    value: 'all',
    count: notifications.value.length
  },
  {
    label: '未读',
    value: 'unread',
    count: unreadCount.value
  },
  {
    label: '消息',
    value: 'message',
    count: notifications.value.filter(n => n.type === 'message').length
  },
  {
    label: '系统',
    value: 'system',
    count: notifications.value.filter(n => n.type === 'system').length
  }
])

// 未读通知数量
const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

// 过滤后的通知
const filteredNotifications = computed(() => {
  let filtered = notifications.value

  switch (activeFilter.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.read)
      break
    case 'message':
      filtered = filtered.filter(n => n.type === 'message')
      break
    case 'system':
      filtered = filtered.filter(n => n.type === 'system')
      break
  }

  return filtered.sort((a, b) => b.timestamp - a.timestamp)
})

// 获取图标类名
const getIconClass = (type: string) => {
  const iconMap = {
    message: '💬',
    system: '⚙️',
    error: '❌',
    warning: '⚠️'
  }
  return iconMap[type as keyof typeof iconMap] || '📢'
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 60 * 1000) {
    return '刚刚'
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 标记单个通知已读
const markAsRead = (id: string) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

// 标记全部已读
const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

// 删除通知
const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// 清空所有通知
const clearAll = () => {
  notifications.value = []
}

// 更新设置
const updateSettings = () => {
  // 这里可以保存到本地存储或发送到服务器
  localStorage.setItem('notificationSettings', JSON.stringify(settings.value))
}

// 添加新通知
const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    timestamp: Date.now(),
    read: false
  }
  
  notifications.value.unshift(newNotification)

  // 如果启用了桌面通知
  if (settings.value.desktopNotifications && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.svg'
      })
    }
  }

  // 如果启用了声音提醒
  if (settings.value.soundNotifications) {
    // 播放提示音
    const audio = new Audio('/notification-sound.mp3')
    audio.play().catch(() => {
      // 忽略播放失败
    })
  }
}

// 初始化
onMounted(() => {
  // 加载保存的设置
  const savedSettings = localStorage.getItem('notificationSettings')
  if (savedSettings) {
    settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
  }

  // 请求桌面通知权限
  if (settings.value.desktopNotifications && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  // 模拟一些初始通知
  notifications.value = [
    {
      id: '1',
      type: 'message',
      title: '新消息',
      message: '你收到了一条新消息',
      timestamp: Date.now() - 5 * 60 * 1000,
      read: false
    },
    {
      id: '2',
      type: 'system',
      title: '系统更新',
      message: '系统已更新到最新版本',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      read: true
    }
  ]

  // 监听 Matrix 事件
  if (chatContext?.matrixClient) {
    chatContext.matrixClient.on('Room.timeline', (event: any) => {
      if (event.getType() === 'm.room.message' && settings.value.messageNotifications) {
        const sender = event.getSender()
        if (sender !== chatContext.matrixClient.getUserId()) {
          addNotification({
            type: 'message',
            title: '新消息',
            message: `来自 ${sender} 的消息`,
            roomId: event.getRoomId()
          })
        }
      }
    })
  }
})

// 暴露方法给父组件
defineExpose({
  addNotification,
  markAllAsRead,
  clearAll
})
</script>

<style scoped>
.notification-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: var(--bg-color);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.notification-header h3 {
  margin: 0;
  color: var(--text-color);
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-actions button {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color-secondary);
  color: var(--text-color);
  cursor: pointer;
}

.notification-actions button:hover:not(:disabled) {
  background: var(--bg-color-hover);
}

.notification-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.notification-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.notification-filters button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  position: relative;
  color: var(--text-color-secondary);
  background: none;
}

.notification-filters button.active {
  background: var(--color-primary);
  color: var(--text-color);
}

.count-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--color-error);
  color: var(--text-color);
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  min-width: 18px;
  text-align: center;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  background: var(--bg-color-secondary);
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-color-secondary);
  border-radius: 8px;
  margin-bottom: 8px;
}

.notification-item.unread {
  border-left: 4px solid var(--color-primary);
  background: var(--color-primary-bg);
}

.notification-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: var(--text-color);
}

.notification-message {
  color: var(--text-color-secondary);
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: var(--text-color-tertiary);
}

.notification-item .notification-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mark-read-btn, .remove-btn {
  padding: 2px 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-color-secondary);
  color: var(--text-color);
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.remove-btn {
  color: var(--color-error);
  border-color: var(--color-error);
}

.mark-read-btn:hover, .remove-btn:hover {
  background: var(--bg-color-hover);
}



.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-color-tertiary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
}

.notification-settings {
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.notification-settings h4 {
  margin: 0 0 12px 0;
  color: var(--text-color);
}

.setting-item {
  margin-bottom: 8px;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-color-secondary);
}

.setting-item input[type="checkbox"] {
  margin: 0;
}
</style>
