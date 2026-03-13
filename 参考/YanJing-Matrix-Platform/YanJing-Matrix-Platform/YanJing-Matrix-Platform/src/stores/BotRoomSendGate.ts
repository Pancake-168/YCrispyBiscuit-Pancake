import { defineStore } from 'pinia'
import { ref } from 'vue'

type BotRoomSendGateState = {
  waitingSince: number
}

export const useBotRoomSendGateStore = defineStore('botRoomSendGate', () => {
  const waitingByRoomId = ref<Record<string, BotRoomSendGateState>>({})

  const isWaiting = (roomId: string): boolean => {
    return !!waitingByRoomId.value[roomId]
  }

  const markWaiting = (roomId: string, waitingSince: number = Date.now()) => {
    if (!roomId) return
    waitingByRoomId.value = {
      ...waitingByRoomId.value,
      [roomId]: {
        waitingSince,
      },
    }
  }

  const clearWaiting = (roomId: string) => {
    if (!roomId || !waitingByRoomId.value[roomId]) return
    const next = { ...waitingByRoomId.value }
    delete next[roomId]
    waitingByRoomId.value = next
  }

  const clearAllState = () => {
    waitingByRoomId.value = {}
  }

  return {
    waitingByRoomId,
    isWaiting,
    markWaiting,
    clearWaiting,
    clearAllState,
  }
})