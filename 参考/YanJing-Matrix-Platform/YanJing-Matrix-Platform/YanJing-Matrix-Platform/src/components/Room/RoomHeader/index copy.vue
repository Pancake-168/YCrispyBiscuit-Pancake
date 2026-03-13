<template>
  <div class="room-header">
    <div class="room-title" :title="roomName">{{ roomName }}</div>
    <div class="room-actions" :disabled="!currentRoomId" @click="openManager">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.39 1.26 1 1.51.61.25 1.31.11 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.44.51-.58 1.21-.33 1.82.25.61.85 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.26.39-1.51 1z" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/System'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { matrixClient } from '@/services/Matrix/client'
import { openRoomManager } from '@/components/RoomManagement/openRoomManager'
import { refreshRoomState } from '@/services/Matrix/refreshRoomState'

const systemStore = useSystemStore()

const roomName = computed(() => {
  const currentId = systemStore.currentSystemRoomId
  if (!currentId) return '未选择'
  const found = systemStore.SystemRooms.find((item) => MatrixClientRoom.getRoomId(item.room) === currentId)
  if (found) {
    return MatrixClientRoom.getRoomName(found.room)
  }

  const room = matrixClient.getAuthedClient()?.getRoom(currentId)
  return room ? MatrixClientRoom.getRoomName(room) : '未选择'
})

const currentRoomId = computed(() => systemStore.currentSystemRoomId)

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
</style>
