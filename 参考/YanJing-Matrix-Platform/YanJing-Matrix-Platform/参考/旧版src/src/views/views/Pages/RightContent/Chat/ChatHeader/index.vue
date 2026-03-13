<template>
  <div class="chat-header">
    <h4>{{ roomName }}</h4>
    <button class="chat-gear-btn" type="button" aria-label="房间管理" @click="openSingleRoomManager(currentRoomId)">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.39 1.26 1 1.51.61.25 1.31.11 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.44.51-.58 1.21-.33 1.82.25.61.85 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.26.39-1.51 1z" />
        </svg>
    </button>
    
    <div v-if="chatContext?.isInNewroomsMobileChat?.value" style="margin-left: auto;">
      <button class="back-list-btn" type="button" @click="chatContext?.exitNewroomsMobile?.()" aria-label="返回列表">←</button>
    </div>

    <div class="chat-functions" v-if="agentID && applicationId">
      <div class="dropdown-container">
        <svg t="1755052046285" class="icon dropdown-trigger" viewBox="0 0 1024 1024" version="1.1"
          xmlns="http://www.w3.org/2000/svg" p-id="16217" width="20" height="20" @click="toggleDropdown">
          <path d="M191.94 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z" fill="#565656" p-id="16218"></path>
          <path d="M514.34 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z" fill="#565656" p-id="16219"></path>
          <path d="M832.06 512.06m-75 0a75 75 0 1 0 150 0 75 75 0 1 0-150 0Z" fill="#565656" p-id="16220"></path>
        </svg>

        
        <div v-if="showDropdown" class="dropdown-menu">
          <!--button class="dropdown-item" @click="handleAgentDIY">
            蓝图
          </button-->
          <button class="dropdown-item" @click="handleDatabase">
            数据库
          </button>
          <button class="dropdown-item" @click="handleDocuments">
            文档
          </button>
        </div>
      </div>
    </div>
    

  </div>
</template>

<script setup lang="ts">
console.log('🚀 ChatHeader组件被加载了！')
import { ref, onMounted, onUnmounted, inject, watch, computed } from 'vue'
import { openSingleRoomManager } from '@/components/RoomManagement/NewSingleRoomManager/openSingleRoomManager'

// 注入聊天上下文
const chatContext = inject('chatContext') as any

console.log('🔍 ChatHeader inject - 获取到的chatContext:', {
  chatContext,
  hasChatContext: !!chatContext,
  chatContextKeys: chatContext ? Object.keys(chatContext) : null,
  currentAgentInfo: chatContext?.currentAgentInfo,
  isCurrentAgentInfoRef: chatContext?.currentAgentInfo?.value !== undefined,
  currentAgentInfoValue: chatContext?.currentAgentInfo?.value
})

// 从chatContext获取数据
const currentRoomId = computed(() => chatContext?.currentRoomId?.value || '')
const roomName = computed(() => chatContext?.roomName?.value || '')

// 从chatContext注入获取agentID和applicationId
const agentID = computed(() => chatContext?.currentAgentInfo?.value?.agentID || '')
const applicationId = computed(() => chatContext?.currentAgentInfo?.value?.applicationId || '')

// 实时输出注入的参数变化
watch([agentID, applicationId], ([newAgentID, newApplicationId]) => {
  console.log('🔄 ChatHeader 注入参数变化:', {
    agentID: newAgentID,
    applicationId: newApplicationId,
    currentAgentInfo: chatContext?.currentAgentInfo,
    currentAgentInfoValue: chatContext?.currentAgentInfo?.value
  })
}, { immediate: true })

// 调试数据
console.log('ChatHeader setup - 从inject获取的数据:', {
  currentRoomId: currentRoomId.value,
  roomName: roomName.value,
  agentID: agentID.value,
  applicationId: applicationId.value,
  chatContext: chatContext,
  currentAgentInfo: chatContext?.currentAgentInfo,
  currentAgentInfoValue: chatContext?.currentAgentInfo?.value,
  hasChatContext: !!chatContext,
  chatContextKeys: chatContext ? Object.keys(chatContext) : null
})

// 监听数据变化
watch([currentRoomId, roomName, agentID, applicationId], ([newRoomId, newRoomName, newAgentID, newApplicationId]) => {
  console.log('ChatHeader - 数据变化:', {
    roomId: newRoomId,
    roomName: newRoomName,
    agentID: newAgentID,
    applicationId: newApplicationId
  })
})

// 下拉菜单状态
const showDropdown = ref(false)

// 注入聊天上下文（可能包含WorkspaceManager引用）

// 切换下拉菜单
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

// 处理数据库按钮点击
function handleDatabase() {
  console.log('点击数据库按钮，参数:', { agentID: agentID.value, applicationId: applicationId.value })

  // 发送事件给父组件，请求打开Nocobase面板
  if (chatContext?.openAgentPanel) {
    chatContext.openAgentPanel('database', {
      agentID: agentID.value,
      applicationId: applicationId.value
    })
  }

  showDropdown.value = false
}

// 处理文档按钮点击
function handleDocuments() {
  console.log('点击文档按钮，参数:', { agentID: agentID.value, applicationId: applicationId.value })

  // 发送事件给父组件，请求打开MarkdownForChat面板
  if (chatContext?.openAgentPanel) {
    chatContext.openAgentPanel('markdown', {
      agentID: agentID.value,
      applicationId: applicationId.value
    })
  }

  showDropdown.value = false
}

// 点击外部关闭下拉菜单
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-container')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.chat-header {
  background-color: var(--bg-color-secondary);
  padding: 16px;
  border-bottom: none;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-radius: 0 0 20px 20px;
}

.chat-header h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.chat-gear-btn {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:32px;
  height:32px;
  border:none;
  background:transparent;
  color: var(--text-color);
  cursor:pointer;
  margin-left:8px;
  padding:0;
  transition:opacity .2s ease, color .2s ease;
}
.chat-gear-btn:hover { opacity:.75; }

.chat-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-id {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.chat-functions {
  display: flex;
  align-items: center;
}

.dropdown-container {
  position: relative;
}

.dropdown-trigger {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.dropdown-trigger:hover {
  opacity: 0.7;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
  padding: 4px 0;
  margin-top: 4px;
}

.dropdown-item {
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: var(--color-primary);
  color: white;
}

.dropdown-item:active {
  background-color: var(--color-primary-hover, #4752c4);
}

.back-list-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-color-third);
  color: var(--text-color);
  font-size: 18px;
  cursor: pointer;
}

.back-list-btn:hover { background: var(--bg-color-hover); }
</style>
