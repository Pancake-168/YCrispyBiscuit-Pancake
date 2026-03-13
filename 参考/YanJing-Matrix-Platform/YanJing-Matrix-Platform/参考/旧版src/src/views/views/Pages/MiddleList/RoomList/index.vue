<template>
  <div class="room-list">
    <!-- 左右布局容器 -->
    <div class="room-list-layout">
      <!-- 左侧空间列表 -->
      <div class="space-sidebar">

        <!-- 空间管理设置 -->
        <div class="space-item settings-item" @click="handleSpaceManagement" title="空间管理">
          <div class="space-avatar settings-avatar">
            <svg class="icon" viewBox="0 0 1024 1024" p-id="9302" width="20" height="20" fill="currentColor">
              <path
                d="M482.88 112l-17.28 90.688-20.64 4.512a309.696 309.696 0 0 0-99.776 41.088l-18.688 11.84-73.28-55.04-44.64 44.64 51.904 76.416-11.392 17.76a310.016 310.016 0 0 0-41.568 99.584l-4.8 21.6-90.72 12.896v63.104l90.688 17.312 4.512 20.64a309.984 309.984 0 0 0 41.088 99.776l11.84 18.688-55.04 73.28 44.64 44.64 76.416-51.904 17.76 11.392a310.016 310.016 0 0 0 99.584 41.568l21.6 4.8 12.896 90.72h63.104l17.312-90.688 20.64-4.512a309.984 309.984 0 0 0 99.776-41.088l18.688-11.84 73.28 55.04 44.64-44.64-51.904-76.416 11.392-17.76a310.016 310.016 0 0 0 41.568-99.584l4.8-21.6 90.72-12.896V482.88l-90.688-17.312-4.512-20.64a309.984 309.984 0 0 0-41.088-99.776l-11.84-18.688 55.04-73.28-44.64-44.64-76.416 51.904-17.76-11.392a310.144 310.144 0 0 0-99.584-41.568l-21.6-4.8-12.896-90.72H482.88zM410.56 149.856l19.424-101.856h171.584l14.624 102.624c28 8.064 54.848 19.328 80.128 33.568l85.792-58.304 121.344 121.344-62.272 82.88c14.08 25.408 25.152 52.352 32.96 80.416l101.888 19.424v171.584l-102.624 14.624a373.92 373.92 0 0 1-33.568 80.128l58.304 85.792-121.344 121.344-82.88-62.272c-25.408 14.08-52.352 25.152-80.416 32.96l-19.424 101.888h-171.584l-14.624-102.624a373.92 373.92 0 0 1-80.128-33.568L241.92 898.112l-121.344-121.344 62.272-82.88a373.824 373.824 0 0 1-32.96-80.416L48 594.048v-171.584l102.624-14.624c8.064-27.968 19.328-54.848 33.568-80.128L125.888 241.92l121.344-121.344 82.88 62.272a373.856 373.856 0 0 1 80.416-32.96z"
                p-id="9303"></path>
              <path d="M512 704a192 192 0 1 1 0-384 192 192 0 0 1 0 384z m0-64a128 128 0 1 0 0-256 128 128 0 0 0 0 256z"
                p-id="9304"></path>
            </svg>
          </div>
        </div>


        <!-- 默认空间 -->
        <div class="space-item" :class="{ active: currentSpaceId === defaultSpaceId }"
          @click="selectSpace(defaultSpaceId)" :title="'默认空间'">
          <div class="space-avatar default-space">
            <span>默</span>
          </div>
          <span v-if="hasSpaceUnread(defaultSpaceId)" class="space-unread-dot"></span>
        </div>

        <!-- 其他空间 -->
        <div v-for="space in spaces" :key="space.roomId" class="space-item"
          :class="{ active: currentSpaceId === space.roomId }" @click="selectSpace(space.roomId)" :title="space.name">
          <div class="space-avatar">
            <span>{{ getSpaceInitials(space.name) }}</span>
          </div>
          <span v-if="hasSpaceUnread(space.roomId)" class="space-unread-dot"></span>
        </div>

        <!-- 空间分隔线 -->
        <!--div v-if="spaces.length > 0" class="space-divider"></div-->

        
      </div>

      <!-- 右侧房间列表 -->
      <div class="rooms-section">
        <!-- 房间列表头部 -->
        <div class="room-list-header">
          <div class="header-left">
            <h4>{{ getCurrentSpaceName() }}</h4>
            <!-- 创建按钮 -->
            <div class="create-dropdown" ref="createDropdownRef">
              <button @click="toggleCreateMenu" class="create-btn" :class="{ active: showCreateMenu }">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="icon">
                  <path
                    d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12C22 13.1 21.1 14 20 14H14V20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20V14H4C2.9 14 2 13.1 2 12C2 10.9 2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z" />
                </svg>
              </button>
              <!-- 下拉菜单 -->
              <div v-if="showCreateMenu" class="create-menu" @click.stop>
                <!--div class="menu-item" @click="handleCreateDirectMessage">
                  <div class="menu-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="icon">
                      <path
                        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
                    </svg>
                  </div>
                  <span>创建一对一私聊</span>
                </div-->
                <div class="menu-item" @click="handleCreateRoom">
                  <div class="menu-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="icon">
                      <path
                        d="M16 4C18.2 4 20 5.8 20 8V16C20 18.2 18.2 20 16 20H8C5.8 20 4 18.2 4 16V8C4 5.8 5.8 4 8 4H16ZM16 2H8C4.7 2 2 4.7 2 8V16C2 19.3 4.7 22 8 22H16C19.3 22 22 19.3 22 16V8C22 4.7 19.3 2 16 2Z" />
                    </svg>
                  </div>
                  <span>创建房间</span>
                </div>
              </div>
            </div>
          </div>



          <div class="header-actions">
            <button @click="refreshRooms" class="refresh-btn" :disabled="loading">
              {{ loading ? '刷新中...' : '刷新' }}
            </button>
            <div @click="handleGlobalManager" class="room-manager">
              <svg class="icon" viewBox="0 0 1024 1024" version="1.1" width="20" height="20" fill="currentColor">
                <path d="M191.94 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z" p-id="16218"></path>
                <path d="M514.34 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z" p-id="16219"></path>
                <path d="M832.06 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z" p-id="16220"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- 房间容器 -->
        <div class="rooms-container">
          <!-- 一对一私聊区域 -->
          <!--div v-if="filteredDirectMessages.length > 0" class="dm-section">
            <div class="section-header">
              <h5>私聊</h5>
             
            </div>
            <div v-for="dm in filteredDirectMessages" :key="dm.roomId" class="room-item dm-item"
              :class="{ active: currentRoomId === dm.roomId }" @click="selectRoom(dm.roomId)">
              <div class="room-info">
                <strong class="room-name">{{ dm.name }}</strong>
               
                <p v-if="dm.topic" class="room-topic">{{ dm.topic }}</p>
              </div>
              <div class="room-meta">
                <span v-if="dm.encrypted" class="encrypted-badge">🔒 加密</span>
                <span class="last-activity">{{ formatTime(dm.lastActivity) }}</span>
              </div>
              <div class="room-manager">
                <div @click.stop="() => handleManageRoom(dm)">
                  <svg t="1755052046285" class="icon" viewBox="0 0 1024 1024" version="1.1"
                   fill="currentColor" p-id="16217" width="20" height="20">
                    <path d="M191.94 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z"  p-id="16218">
                    </path>
                    <path d="M514.34 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z"  p-id="16219">
                    </path>
                    <path d="M832.06 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z"  p-id="16220">
                    </path>
                  </svg>
                </div>
              </div>
            </div>
          </div-->

          <!-- 房间区域 -->
          <div v-if="filteredRooms.length > 0" class="rooms-section-inner">
            <div class="section-header">
              <!--span class="section-count">{{ filteredRooms.length }}</span-->
            </div>
            <div v-for="room in filteredRooms" :key="room.roomId" class="room-item"
              :class="{ active: currentRoomId === room.roomId, unread: currentRoomId !== room.roomId && (room.unreadCount || 0) > 0 }"
              @click="selectRoom(room.roomId)">
              <div class="room-avatar">
                <!-- 你可以用 room.avatarUrl，如果没有就用首字母 -->
                
                <span>{{ getSpaceInitials(room.name) }}</span>
              </div>
              <div class="room-info">
                <div class="room-info__header">
                  <strong class="room-name">{{ room.name }}</strong>
                  <span class="last-activity" :title="formatFullTime(room.lastActivity)">
                    {{ formatTime(room.lastActivity) }}
                  </span>
                </div>
                <p v-if="hasEventSummary(room)" class="room-meta-line" :title="formatLastEventMeta(room)">
                  <span class="meta-content">{{ formatLastEventSummary(room) }}</span>
                </p>
              </div>
              <div class="room-badges">
                <span v-if="room.unreadCount && room.unreadCount > 0" class="unread-badge">
                  {{ formatUnreadCount(room.unreadCount) }}
                </span>
              </div>
              <!--div class="room-meta">
                <span v-if="room.encrypted" class="encrypted-badge">🔒 加密</span>
               
              </div-->
              <div class="room-manager">
                <div @click.stop="() => handleManageRoom(room)">
                  <svg t="1755052046285" class="icon" viewBox="0 0 1024 1024" version="1.1" fill="currentColor"
                    p-id="16217" width="20" height="20">
                    <path d="M191.94 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z" p-id="16218">
                    </path>
                    <path d="M514.34 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z" p-id="16219">
                    </path>
                    <path d="M832.06 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z" p-id="16220">
                    </path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态提示 -->
          <div v-if="filteredRooms.length === 0" class="empty-state">
            <p>此空间暂无房间</p>
          </div>
        </div>

        <!-- 加入房间 -->
        <!--div class="join-room-section">
          <input v-model="newRoomId" placeholder="输入房间ID或别名 (如: #room:matrix.org)" @keyup.enter="joinRoom" />
          <button @click="joinRoom" :disabled="!newRoomId.trim() || joining">
            {{ joining ? '加入中...' : '加入房间' }}
          </button>
        </div-->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'



const defaultSpaceId = 'default'
const currentSpaceId = ref(defaultSpaceId)



// 计算所有空间
const spaces = computed(() =>
  props.rooms
    .filter(r => r.type === '空间')
    .slice()
    .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0))
)

const spaceUnreadMap = computed<Record<string, boolean>>(() => {
  const map: Record<string, boolean> = {}

  props.rooms.forEach(room => {
    const unreadCount = Number(room?.unreadCount || 0)
    if (unreadCount <= 0) {
      return
    }

    if (room.type === '空间') {
      map[room.roomId] = true
      return
    }

    const targetSpaceId = room.belongSpace || defaultSpaceId
    map[targetSpaceId] = true
  })

  return map
})

// 备注: 私聊已在运行时合并为普通房间，因此不再单独维护 filteredDirectMessages

// 计算房间列表（不包含一对一私聊和空间本身）
const sortByLastActivityDesc = (roomList: any[]) =>
  roomList.slice().sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0))

const filteredRooms = computed(() => {
  if (currentSpaceId.value === defaultSpaceId) {
    // 默认空间：只显示不属于任何空间的普通房间
    return sortByLastActivityDesc(
      props.rooms.filter(room => room.type === '普通房间' && !room.belongSpace)
    )
  }

  // 其他空间：显示属于该空间的房间
  return sortByLastActivityDesc(
    props.rooms.filter(room => room.type === '普通房间' && room.belongSpace === currentSpaceId.value)
  )
})




// Props
interface Props {
  currentRoomId?: string
  rooms: any[] // 接收外部传入的房间列表
}
const props = withDefaults(defineProps<Props>(), {
  currentRoomId: '',
  rooms: () => []
})

// Emits
const emit = defineEmits<{
  selectRoom: [roomId: string]
  joinRoom: [roomId: string]
  refreshRooms: []
  'open-room-manager': [room: any]
  'open-global-manager': []
  'open-space-manager': []
  'space-changed': [spaceId: string]
  'create-room': [spaceId: string]
}>()

// 状态
const loading = ref(false)

// 创建功能相关状态
const showCreateMenu = ref(false)
const createDropdownRef = ref<HTMLElement>()

// 选择空间
const selectSpace = (spaceId: string) => {
  currentSpaceId.value = spaceId
  console.log(`切换到空间: ${spaceId}`)
  emit('space-changed', spaceId)
}

// 获取空间首字母缩写
const getSpaceInitials = (name: string) => {
  if (!name) return '?'

  name = name.trim()
  // 如果是中文，取第一个字符
  if (/[\u4e00-\u9fa5]/.test(name)) {
    return name.charAt(0)
  }
  // 如果是英文，取第一个字母
  return name.charAt(0).toUpperCase()
}

// 获取当前空间名称
const getCurrentSpaceName = () => {
  if (currentSpaceId.value === defaultSpaceId) {
    return '默认空间'
  }
  const space = spaces.value.find(s => s.roomId === currentSpaceId.value)
  return space ? space.name : '未知空间'
}

// 选择房间
const selectRoom = (roomId: string) => {
  console.log(`选择房间: ${roomId}`)
  emit('selectRoom', roomId)
}

// 刷新房间列表
const refreshRooms = () => {
  loading.value = true
  emit('refreshRooms')
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

// 点击房间管理按钮
const handleManageRoom = (room: any) => {
  emit('open-room-manager', room)
}

// 点击全局管理按钮
const handleGlobalManager = () => {
  emit('open-global-manager')
}

// 点击空间管理按钮
const handleSpaceManagement = () => {
  console.log('打开空间管理')
  emit('open-space-manager')
}

const hasSpaceUnread = (spaceId: string) => Boolean(spaceUnreadMap.value[spaceId])

// 创建功能相关方法
const toggleCreateMenu = () => {
  showCreateMenu.value = !showCreateMenu.value
}



const handleCreateRoom = () => {
  showCreateMenu.value = false
  emit('create-room', currentSpaceId.value)
}



// 格式化时间
const formatTime = (timestamp: number) => {
  if (!timestamp) return '—'
  const diff = Date.now() - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`

  const days = Math.floor(diff / day)
  if (days <= 7) return `${days} 天前`

  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatFullTime = (timestamp: number) => {
  if (!timestamp) return '暂无时间记录'
  return new Date(timestamp).toLocaleString()
}

const hasEventSummary = (room: any) => {
  const event = room.lastEvent
  if (event && typeof event.description === 'string' && event.description.trim()) {
    return true
  }

  const message = room.lastMessage
  if (!message) return false

  const content = message.formattedBody || message.content
  return typeof content === 'string' && content.trim().length > 0
}

const formatLastEventMeta = (room: any) => {
  const event = room.lastEvent
  const message = room.lastMessage

  if (!event && !message) return ''

  const messageSender = message?.displayName || message?.sender
  const actorFromMetadata = event?.metadata?.actorName || event?.metadata?.targetUserId
  const eventSender = event?.senderName || event?.sender

  const displayName = event?.isSystemEvent
    ? actorFromMetadata || eventSender || messageSender
    : messageSender || eventSender

  const timestamp = event?.timestamp || message?.timestamp || room.lastActivity
  const metaParts = [displayName, timestamp ? formatFullTime(timestamp) : ''].filter(Boolean)
  return metaParts.join(' · ')
}

const formatLastEventSummary = (room: any) => {
  const event = room.lastEvent
  const message = room.lastMessage

  if (!event) {
    if (message) {
      const content = message.formattedBody || message.content || ''
      return content.trim()
    }

    return ''
  }

  if (event.isSystemEvent) {
    return (event.description || '').trim()
  }

  if (message) {
    const content = message.formattedBody || message.content || ''
    const trimmed = content.trim()
    return trimmed || (event.description || '').trim()
  }

  return (event.description || '').trim()
}

const formatUnreadCount = (count: number) => {
  if (!count) return ''
  return count > 99 ? '99+' : String(count)
}

// 移除onMounted中的自动刷新，让MainPage统一管理
// onMounted(() => {
//   refreshRooms()
// })

// 组件挂载时发出初始空间变化事件
onMounted(() => {
  emit('space-changed', currentSpaceId.value)
})
</script>

<style scoped>
/* Discord风格房间列表 - 左右布局 */
.room-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-third);
  min-width: 0;
  /* 防止溢出 */
  overflow: hidden;
  /* 防止内容溢出 */
}

.room-list-layout {
  display: flex;
  height: 100%;
  min-width: 0;
  /* 防止flex容器溢出 */
}

/* 左侧空间列表 */
.space-sidebar {
  margin-top: 12px;
  width: 40px;
  min-width: 40px;
  background-color: var(--bg-color-third);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 0;
  gap: 2px;

  height: 100%;
  overflow-y: auto;
}

.space-item {
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.space-item .space-unread-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ff4d4f;
  border: 2px solid var(--bg-color-third);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.space-item.active .space-unread-dot {
  border-color: var(--bg-color-secondary);
}

.space-item.active::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 40px;
  background-color: var(--color-primary);
  border-radius: 0 2px 2px 0;
}

/* 为空间项添加悬停时的左侧指示器 */
.space-item:hover:not(.active)::after {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background-color: var(--text-color-third);
  border-radius: 0 2px 2px 0;
  opacity: 0.6;
}

/* 空间分隔线 */
.space-divider {
  width: 32px;
  height: 1px;
  background-color: var(--border-color);
  margin: 8px 0;
}

/* 空间管理设置按钮 */
.settings-item {
background-color: var(--bg-color-third);
}

.settings-avatar {
  background-color: var(--bg-color-third) !important;
  color: var(--text-color-secondary) !important;
}

.settings-item:hover .settings-avatar {
  background-color: var(--color-secondary) !important;
  color: var(--text-color) !important;
  border-radius: 12px !important;
}

.settings-item.active .settings-avatar {
  background-color: var(--color-primary) !important;
  color: white !important;
  border-radius: 12px !important;
}

.space-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--bg-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  font-weight: 600;
  font-size: var(--font-size-base);
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.space-item:hover .space-avatar {
  border-radius: 12px;
  background-color: var(--bg-color-fourth);
  color: var(--text-color);
}

.space-item.active .space-avatar {
  border-radius: 12px;
  background-color: var(--bg-color-secondary);
  color: var(--text-color);
}

.space-avatar.default-space {
  background-color: var(--bg-color-secondary);
  color: var(--text-color);
}

.space-item:hover .space-avatar.default-space {
  background-color: var(--border-color);
  color: var(--text-color);
}

/* 右侧房间区域 */
.rooms-section {

  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-third);
  min-width: 0;
  /* 防止flex子项溢出 */
  overflow: hidden;
  overflow-y: auto;
}

.room-list-header {
  width: 95%;
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background-color: var(--bg-color-secondary);
  border-radius: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;

}

.room-list-header h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* 创建按钮和下拉菜单样式 */
.create-dropdown {
  position: relative;
}

.create-btn {
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.create-btn:hover,
.create-btn.active {
  background: var(--border-color);
  color: var(--text-color);
}

.create-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-color-third);

  border-radius: 6px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  min-width: 160px;
  padding: 4px 0;
  margin-top: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  color: var(--text-color);
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.menu-item:hover {
  background: var(--bg-color-hover);
}

.menu-icon {
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn {
  padding: 4px 8px;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background-color: var(--border-color);
  color: var(--text-color);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rooms-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* 移动端适配：只在上下加padding，左右不加 */
@media (max-width: 768px) {
  .rooms-container {
    padding: 8px 1px 8px 1px;
    margin-left: -10px;
  }
}

/* 区域分割样式 */
.dm-section,
.rooms-section-inner {
  width: 98%;
  margin-bottom: 16px;
}

.dm-section:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
}

.section-header h5 {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.section-count {
  background-color: var(--border-color);
  color: var(--text-color-secondary);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

/* 一对一私聊特殊样式 */
.dm-item::before {
  content: '@';
  color: var(--color-success, #00d26a);
  font-weight: 600;
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
  /* 防止图标被压缩 */
  width: 16px;
  /* 固定宽度 */
}

.dm-item.active::before {
  color: var(--text-color);
}

/* 空状态样式 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--text-color-secondary);
  font-style: italic;
}

.empty-state p {
  margin: 0;
}

.room-item {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  /* 防止flex子项溢出 */
}

.room-item.unread:not(.active) .room-name {
  font-weight: 600;
  color: var(--text-color);
}

.room-badges {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 32px;
}

.unread-badge {
  background-color: var(--color-primary);
  color: #fff;
  border-radius: 999px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  min-width: 24px;
  text-align: center;
}

.room-item:hover {
  background-color: var(--border-color);
}

.room-item.active {
  background-color: var(--bg-color-secondary);
}

.room-item.active .room-name {
  color: var(--text-color) !important;
}



.room-item.active::before {
  color: var(--text-color);
}



.room-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  color: var(--text-color);
  margin-right: 8px;
  overflow: hidden;
}
.room-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}




.room-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.room-info__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 20px;
}

.room-name {
  display: block;
  color: var(--text-color-secondary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-item:hover .room-name:not(.active) {
  color: var(--text-color);
}

.room-meta-line {
  font-size: 12px;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  height: 18px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
  color: var(--text-color);
  background: var(--border-color);
  flex-shrink: 0;
}

.meta-tag--system {
  color: var(--color-primary-contrast, #fff);
  background: var(--color-primary);
}

.room-meta-line--muted {
  color: var(--text-color-tertiary);
}

.meta-content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-id {
  font-size: 11px;
  color: var(--text-color-secondary);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-topic {
  font-size: 11px;
  color: var(--text-color-secondary);
  margin: 2px 0 0 0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.room-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
  /* 防止被压缩 */
  min-width: 80px;
  /* 保证最小宽度 */
  max-width: 100px;
  /* 限制最大宽度 */
}

.encrypted-badge {
  font-size: 10px;
  color: var(--color-warning);
  background-color: var(--color-warning-bg, rgba(250, 166, 26, 0.1));
  padding: 2px 4px;
  border-radius: 8px;
  border: 1px solid var(--color-warning-border, rgba(250, 166, 26, 0.2));
}

.last-activity {
  font-size: 12px;
  color: var(--text-color-secondary);
  white-space: nowrap;
}

/* 房间管理按钮样式 */
.room-manager {
  flex-shrink: 0;
  /* 防止被压缩 */
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.room-item:hover .room-manager {
  opacity: 1;
}

.room-manager:hover {
  background-color: var(--border-color);
  border-radius: 2px;
}

.room-manager .icon {
  flex-shrink: 0;
}

.join-room-section {
  padding: 16px 12px;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-color-secondary);
}

.join-room-section input {
  width: 100%;
  padding: 8px 12px;
  background-color: var(--border-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 14px;
  margin-bottom: 8px;
  box-sizing: border-box;
}

.join-room-section input:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--bg-color-secondary);
}

.join-room-section input::placeholder {
  color: var(--text-color-secondary);
}

.join-room-section button {
  width: 100%;
  padding: 8px 12px;
  background-color: var(--color-primary);
  color: var(--text-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.join-room-section button:hover:not(:disabled) {
  background-color: var(--color-primary-hover, #4752c4);
}

.join-room-section button:disabled {
  background-color: var(--color-secondary, #4f545c);
  cursor: not-allowed;
}

/* 滚动条样式 */
.rooms-container::-webkit-scrollbar {
  width: 6px;
}

.rooms-container::-webkit-scrollbar-track {
  background: transparent;
}

.rooms-container::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-bg, #202225);
  border-radius: 3px;
}

.rooms-container::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover-bg, #40444b);
}


.room-manager {
  color: var(--text-color-secondary);
  opacity: 1 !important;
}
</style>
