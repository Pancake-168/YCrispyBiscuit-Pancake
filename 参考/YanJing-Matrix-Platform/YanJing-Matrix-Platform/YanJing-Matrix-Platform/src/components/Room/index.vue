<template>
    <div class="room">
    <RoomHeader />
    <InviteStatus v-if="showInviteStatus" :room-id="currentRoomId" @changed="handleInviteStateChanged" />
    <template v-else>
      <MessageArea />
      <InputArea />
    </template>
    </div>

</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSystemStore } from '@/stores/System'
import { matrixClient } from '@/services/Matrix/client'
import { matrixEventManager } from '@/services/Matrix/eventManager'
import { MatrixEventType } from '@/types/eventManager'
import RoomHeader from './RoomHeader/index.vue'
import MessageArea from './MessageArea/index.vue'
import InputArea from './InputArea/index.vue'
import InviteStatus from './InviteStatus'

const systemStore = useSystemStore()
const membershipRefreshTick = ref(0)
const roomDisposers: Array<() => void> = []

const currentRoomId = computed(() => systemStore.currentSystemRoomId)

const bumpMembershipRefresh = () => {
  membershipRefreshTick.value += 1
}

const handleInviteStateChanged = () => {
  bumpMembershipRefresh()
}

const showInviteStatus = computed(() => {
  const tick = membershipRefreshTick.value
  const roomId = currentRoomId.value
  if (tick < 0) return false
  if (!roomId) return false
  const client = matrixClient.getAuthedClient()
  const room = client?.getRoom(roomId)
  const membership = room?.getMyMembership?.() || ''
  return membership === 'invite'
})

onMounted(() => {
  const subscribeMembershipEvent = (type: typeof MatrixEventType.ROOM_JOINED | typeof MatrixEventType.ROOM_LEFT | typeof MatrixEventType.ROOM_INVITED) => {
    return matrixEventManager.on(type, (payload) => {
      const roomId = payload.room?.roomId
      if (!roomId || roomId !== currentRoomId.value) return
      bumpMembershipRefresh()
    })
  }

  roomDisposers.push(
    subscribeMembershipEvent(MatrixEventType.ROOM_JOINED),
    subscribeMembershipEvent(MatrixEventType.ROOM_LEFT),
    subscribeMembershipEvent(MatrixEventType.ROOM_INVITED),
    matrixEventManager.on(MatrixEventType.ROOM_UPDATED, (payload) => {
      const roomId = payload.room?.roomId
      if (!roomId || roomId !== currentRoomId.value) return
      bumpMembershipRefresh()
    }),
    matrixEventManager.on(MatrixEventType.SYNC_COMPLETED, () => {
      bumpMembershipRefresh()
    })
  )
})

onUnmounted(() => {
  roomDisposers.forEach((dispose) => dispose())
  roomDisposers.length = 0
})
</script>


<style scoped>
.room {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
</style>

