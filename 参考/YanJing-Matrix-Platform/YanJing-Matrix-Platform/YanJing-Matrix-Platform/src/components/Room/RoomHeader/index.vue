<template>
  <div class="room-header">
    <div class="room-title" :title="roomName">{{ roomName }}</div>
    <div class="room-actions">
      <button
        v-if="canCreateSession"
        class="action-btn"
        :disabled="creatingSession || !currentRoomId"
        type="button"
        title="新建子任务"
        @click="createSession">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>
      <button class="action-btn" :disabled="!currentRoomId" type="button" title="房间管理" @click="openManager">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.39 1.26 1 1.51.61.25 1.31.11 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.44.51-.58 1.21-.33 1.82.25.61.85 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.26.39-1.51 1z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSystemStore } from '@/stores/System'
import { useOrganizationStore } from '@/stores/Organization'
import { useRoomDisplayStore } from '@/stores/RoomDisplay'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { getBotUsernameFromRoomMembersAsync } from '@/services/Project/UserBot/useUserbotWebSocket'
import { CreateAgentSession } from '@/services/Project/AgentSession/AgentSession'
import { openMessageDialog } from '@/components/MessageDialog/open'
import { openRoomManager } from '@/components/RoomManagement/openRoomManager'
import { refreshRoomState } from '@/services/Matrix/refreshRoomState'

const systemStore = useSystemStore()
const organizationStore = useOrganizationStore()
const roomDisplayStore = useRoomDisplayStore()
const creatingSession = ref(false)
const currentBotUsername = ref('')

const roomName = computed(() => {
  const currentId = systemStore.currentSystemRoomId
  if (!currentId) return '未选择'
  const found = systemStore.SystemRooms.find((item) => MatrixClientRoom.getRoomId(item.room) === currentId)
  return found
    ? roomDisplayStore.getRoomDisplayName(currentId, [MatrixClientRoom.getRoomName(found.room)])
    : '未选择'
})

const currentRoomId = computed(() => systemStore.currentSystemRoomId)

const resolveCurrentBotUsername = async () => {
  const roomId = currentRoomId.value
  if (!roomId || systemStore.currentFunction !== 'Mission') {
    currentBotUsername.value = ''
    return
  }

  const resolvedUsername = await getBotUsernameFromRoomMembersAsync(roomId)
  if (currentRoomId.value !== roomId || systemStore.currentFunction !== 'Mission') return
  currentBotUsername.value = resolvedUsername || ''
}

watch(
  [currentRoomId, () => systemStore.currentFunction],
  () => {
    void resolveCurrentBotUsername()
  },
  { immediate: true }
)

const canCreateSession = computed(() => {
  return systemStore.currentFunction === 'Mission' && !!currentBotUsername.value
})

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

const createSession = async () => {
  const botUsername = currentBotUsername.value
  if (!botUsername) {
    openMessageDialog('当前任务未识别到 bot，暂时无法创建子任务')
    return
  }

  if (creatingSession.value) return

  creatingSession.value = true
  try {
    const appid = organizationStore.currentOrganization?.app_id || 'root'
    const result = await CreateAgentSession(appid, botUsername)

    if (!result.ok || !result.data?.room) {
      throw new Error('后端未返回子任务')
    }

    const createdRoomId = result.data.room
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const refreshResult = await refreshRoomState({
        showLoading: true,
        loadingText: attempt === 0 ? '正在创建子任务...' : '正在同步子任务...',
        preferredRoomId: createdRoomId,
      })

      if (refreshResult.currentRoomId === createdRoomId) {
        openMessageDialog('子任务创建成功')
        return
      }

      await sleep(600)
    }

    openMessageDialog('子任务已创建，列表正在同步')
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    openMessageDialog(`创建子任务失败: ${message}`)
  } finally {
    creatingSession.value = false
  }
}

const openManager = () => {
  if (!currentRoomId.value) return
  openRoomManager(currentRoomId.value, {
    onRoomUpdated: (roomId) => {
      void refreshRoomState({
        showLoading: true,
        loadingText: '正在刷新列表...',
        preferredRoomId: roomId,
      })
    },
  })
}
</script>

<style scoped>
.room-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  padding-top: 1rem;
  padding-bottom: 1rem;

  background: var(--glass-bg);
  box-shadow: var(--glass-shadow);
  backdrop-filter: var(--glass-blur);
}

.room-title {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--text-color) 8%, transparent);
}
</style>
