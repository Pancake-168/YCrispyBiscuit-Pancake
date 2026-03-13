import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface WebSocketStreamMessage {
  key: string
  roomId: string
  botUsername: string
  content: string
  thinkContent: string
  contentType: 'think' | 'reporter'
  eventId?: string
  finished?: boolean
  timestamp: number
}

const buildKey = (roomId: string, botUsername: string) => `${roomId}::${botUsername}`

export const useWebSocketStreamStore = defineStore('websocketStream', () => {
  const streamByKey = ref<Record<string, WebSocketStreamMessage>>({})

  const streamList = computed(() => Object.values(streamByKey.value))

  const getStream = (roomId: string, botUsername: string): WebSocketStreamMessage | undefined => {
    const key = buildKey(roomId, botUsername)
    return streamByKey.value[key]
  }

  const getRoomStreams = (roomId: string): WebSocketStreamMessage[] => {
    return streamList.value
      .filter((item) => item.roomId === roomId)
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
  }

  const upsertStream = (
    roomId: string,
    botUsername: string,
    patch: Partial<Omit<WebSocketStreamMessage, 'key' | 'roomId' | 'botUsername'>>
  ) => {
    const key = buildKey(roomId, botUsername)
    const existing = streamByKey.value[key]
    streamByKey.value = {
      ...streamByKey.value,
      [key]: {
        key,
        roomId,
        botUsername,
        content: patch.content ?? existing?.content ?? '',
        thinkContent: patch.thinkContent ?? existing?.thinkContent ?? '',
        contentType: patch.contentType ?? existing?.contentType ?? 'reporter',
        eventId: patch.eventId ?? existing?.eventId,
        finished: patch.finished ?? existing?.finished ?? false,
        timestamp: patch.timestamp ?? Date.now(),
      },
    }
  }

  const clearStream = (roomId: string, botUsername: string) => {
    const key = buildKey(roomId, botUsername)
    if (!streamByKey.value[key]) return
    const next = { ...streamByKey.value }
    delete next[key]
    streamByKey.value = next
  }

  const clearRoomStreams = (roomId: string) => {
    const next = { ...streamByKey.value }
    let touched = false
    for (const [key, value] of Object.entries(next)) {
      if (value.roomId !== roomId) continue
      delete next[key]
      touched = true
    }
    if (touched) streamByKey.value = next
  }

  const clearRoomFinishedStreams = (roomId: string) => {
    const next = { ...streamByKey.value }
    let touched = false
    for (const [key, value] of Object.entries(next)) {
      if (value.roomId !== roomId) continue
      if (!value.finished) continue
      delete next[key]
      touched = true
    }
    if (touched) streamByKey.value = next
  }

  const clearFinishedStreams = () => {
    const next = { ...streamByKey.value }
    let touched = false
    for (const [key, value] of Object.entries(next)) {
      if (!value.finished) continue
      delete next[key]
      touched = true
    }
    if (touched) streamByKey.value = next
  }

  const clearAllStreams = () => {
    streamByKey.value = {}
  }

  return {
    streamByKey,
    streamList,
    getStream,
    getRoomStreams,
    upsertStream,
    clearStream,
    clearRoomStreams,
    clearRoomFinishedStreams,
    clearFinishedStreams,
    clearAllStreams,
  }
})
