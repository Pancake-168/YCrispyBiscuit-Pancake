<template>
  <div class="message-area" ref="messageAreaRef" @scroll="handleScroll">
    <div v-for="(group, index) in groupedMessages" :key="`${group.senderId}-${index}`" class="message-group"
      :class="{ self: group.isSelf }">
      <div class="group-content">
        <MessageItem v-for="(item, itemIndex) in group.items" :key="item.id" :message="item" :is-self="group.isSelf"
          :is-first-in-group="itemIndex === 0" :is-continued-in-group="itemIndex > 0"
          :class="{ 'streaming-message': item.isStreaming }" />
      </div>
    </div>
    <div v-if="forwardSelecting" class="forward-bar">
      <div class="forward-info">已选 {{ forwardSelectedIds.length }} 条消息</div>
      <div class="forward-actions">
        <button class="btn" type="button" @click="cancelForward">取消</button>
        <button class="btn btn-primary" type="button" :disabled="forwardSelectedIds.length === 0" @click="confirmForward">转发</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, nextTick, onMounted, onUnmounted } from 'vue'
import type { EventStatus } from 'matrix-js-sdk'
import type { MatrixMessageItem } from '@/types/message'
import { useBotRoomSendGateStore } from '@/stores/BotRoomSendGate'
import { useSystemStore } from '@/stores/System'
import { matrixClient } from '@/services/Matrix/client'
import { matrixMessageService } from '@/services/Matrix/message'
import { matrixTimelineService } from '@/services/Matrix/timeline'
import { useMatrixTimelineStore } from '@/stores/matrixTimeline'
import { matrixEventManager } from '@/services/Matrix/eventManager'
import { MatrixEventType } from '@/types/eventManager'
import MessageItem from '../MessageItem'
import { openForwardDialog } from '@/components/MSGOperations/Forward/open'
import { forwardMessageBundle } from '@/services/Matrix/MSGOperations/MsgForward'
import { useWebSocketStreamStore } from '@/stores/WebSocketStream'
import { useIDmapStore } from '@/stores/IDmap'

type MessageAreaMessage = MatrixMessageItem & { isStreaming?: boolean }

const systemStore = useSystemStore()
const botRoomSendGateStore = useBotRoomSendGateStore()
const timelineStore = useMatrixTimelineStore()
const webSocketStreamStore = useWebSocketStreamStore()
const idmapStore = useIDmapStore()
const messageAreaRef = ref<HTMLElement | null>(null)
const isPrependingHistory = ref(false)
const readObserver = ref<IntersectionObserver | null>(null)
const observedEventIds = new Set<string>()
const sentReceiptByRoom = new Map<string, Set<string>>()
const currentRoomId = computed(() => systemStore.currentSystemRoomId)
const forwardSelecting = computed(() => systemStore.forwardSelecting)
const forwardSelectedIds = computed(() => systemStore.forwardSelectedIds)
const messages = computed<MessageAreaMessage[]>(() => {
  const roomId = currentRoomId.value
  if (!roomId) return []
  return systemStore.SystemMessages?.[roomId] ?? []
})

const formatStreamContent = (content: string, thinkContent: string): string => {
  if (thinkContent) return `<think>${thinkContent}</think>\n${content}`
  return content
}

const displayMessages = computed<MessageAreaMessage[]>(() => {
  const roomId = currentRoomId.value
  const realMessages = [...messages.value]
  if (!roomId) return realMessages

  const roomStreams = webSocketStreamStore
    .getRoomStreams(roomId)
    .filter((stream) => !!stream.content || !!stream.thinkContent)

  for (const stream of roomStreams) {
    const mapped = idmapStore.getByUsername(stream.botUsername)
    const streamSenderId = mapped?.matrixId || `@streaming-bot:${stream.botUsername}`
    realMessages.push({
      id: `streaming-${stream.key}`,
      roomId,
      senderId: streamSenderId,
      senderName: stream.botUsername || 'AI助手',
      timestamp: stream.timestamp,
      timeText: '',
      content: formatStreamContent(stream.content, stream.thinkContent),
      type: 'm.text',
      isStreaming: true,
    })
  }

  return realMessages
})
const currentUserId = computed(() => matrixClient.getAuthedClient()?.getUserId?.() ?? '')
const forwardSourceRoomId = computed(() => systemStore.forwardRoomId)
const localStatusByEventId = new Map<string, EventStatus | 'sent' | null>()

/**
 * 拉取并刷新当前房间消息。
 * 输入：roomId（可选）。
 * 输出：无。
 * 逻辑：调用消息服务写入 store。
 */
const loadRoomMessages = (roomId?: string) => {
  if (!roomId) return
  matrixMessageService.getRoomMessages(roomId)
  applyLocalStatuses(roomId)
}

let refreshPending = false
/**
 * 合并同一轮事件导致的多次刷新。
 * 输入：roomId（可选）。
 * 输出：无。
 * 逻辑：使用微任务合并多次刷新请求。
 */
const queueRefresh = (roomId?: string) => {
  if (!roomId || refreshPending) return
  refreshPending = true
  queueMicrotask(() => {
    refreshPending = false
    loadRoomMessages(roomId)
  })
}

const applyLocalStatuses = (roomId: string) => {
  const list = systemStore.SystemMessages?.[roomId] ?? []
  if (list.length === 0) return
  let touched = false
  const next = list.map((item) => {
    const status = localStatusByEventId.get(item.id)
    if (status === undefined) return item
    if (item.status === status) return item
    touched = true
    return { ...item, status }
  })
  if (touched) systemStore.setRoomMessages(roomId, next)
}

watch(currentRoomId, (roomId) => {
  loadRoomMessages(roomId)
}, { immediate: true })

/**
 * 房间切换时清空未读并上报已读。
 * 输入：roomId（string）。
 * 输出：void。
 * 逻辑：取最后一条事件作为已读回执目标，同时清空本地未读。
 */
const markRoomAllRead = (roomId: string) => {
  const items = timelineStore.getRoomItems(roomId)
  if (items.length === 0) return
  const lastItem = items[items.length - 1]
  const lastEventId = lastItem?.eventId
  if (lastEventId) {
    matrixEventManager.markAsRead(roomId, lastEventId)
  }
  matrixTimelineService.markRoomRead(roomId)
}

/**
 * 滚动到消息区底部。
 * 输入：无。
 * 输出：Promise<void>。
 * 逻辑：等待 DOM 更新后设置 scrollTop。
 */
const scrollToBottom = async () => {
  await nextTick()
  const container = messageAreaRef.value
  if (!container) return
  container.scrollTop = container.scrollHeight
}

/**
 * 标记可见消息为已读并发送回执（逐条）。
 * 输入：visibleIds（string[]）。
 * 输出：void。
 * 逻辑：逐条更新本地 isUnread，并对未发送过的事件发送 read receipt。
 */
const markVisibleMessagesRead = (visibleIds: string[]) => {
  const roomId = currentRoomId.value
  if (!roomId || visibleIds.length === 0) return

  const realIds = visibleIds.filter((id) => id.startsWith('$'))
  if (realIds.length === 0) return

  for (const id of realIds) {
    timelineStore.markItemRead(roomId, id)
  }

  let sentSet = sentReceiptByRoom.get(roomId)
  if (!sentSet) {
    sentSet = new Set<string>()
    sentReceiptByRoom.set(roomId, sentSet)
  }

  for (const id of realIds) {
    if (sentSet.has(id)) continue
    sentSet.add(id)
    matrixEventManager.markAsRead(roomId, id)
  }
}

/**
 * 初始化 IntersectionObserver。
 * 输入：无。
 * 输出：void。
 * 逻辑：监听消息节点可见度，达到阈值即触发已读计算。
 */
const ensureObserver = () => {
  const container = messageAreaRef.value
  if (!container) return
  if (readObserver.value) return
  readObserver.value = new IntersectionObserver(
    (entries) => {
      const visibleIds: string[] = []
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const ratio = entry.intersectionRatio
        if (ratio < 0.6) continue
        const el = entry.target as HTMLElement
        const id = el.dataset.eventId
        if (id) visibleIds.push(id)
      }
      markVisibleMessagesRead(visibleIds)
    },
    { root: container, threshold: [0.6] }
  )
}

/**
 * 观察当前 DOM 中所有消息节点。
 * 输入：无。
 * 输出：void。
 * 逻辑：为未观测过的节点注册 IntersectionObserver。
 */
const observeMessageNodes = () => {
  const container = messageAreaRef.value
  const observer = readObserver.value
  if (!container || !observer) return
  const nodes = Array.from(container.querySelectorAll('[data-event-id]')) as HTMLElement[]
  for (const node of nodes) {
    const id = node.dataset.eventId
    if (!id || observedEventIds.has(id)) continue
    observedEventIds.add(id)
    observer.observe(node)
  }
}

const messageRefreshDisposers: Array<() => void> = []

/**
 * 组件挂载时订阅消息事件，触发刷新。
 * 输入：无。
 * 输出：无。
 * 逻辑：监听收到/发送/更新/删除事件。
 */
onMounted(() => {
  type MessageEventTypeKey =
    | typeof MatrixEventType.MESSAGE_RECEIVED
    | typeof MatrixEventType.MESSAGE_SENT
    | typeof MatrixEventType.MESSAGE_UPDATED
    | typeof MatrixEventType.MESSAGE_DELETED

  const subscribe = (type: MessageEventTypeKey) =>
    matrixEventManager.on(type, (payload) => {
      const roomId = payload.room?.roomId
      if (!roomId) return
      if (type === MatrixEventType.MESSAGE_RECEIVED && systemStore.getRoomTypeById(roomId) === 'bot') {
        const senderId = payload.event?.getSender?.() ?? payload.room?.getLastLiveEvent?.()?.getSender?.() ?? ''
        if (senderId && senderId !== currentUserId.value && idmapStore.getByMatrixId(senderId)?.type === 'bot') {
          botRoomSendGateStore.clearWaiting(roomId)
        }
      }
      if (roomId !== currentRoomId.value) return
      if (type === MatrixEventType.MESSAGE_SENT) {
        const eventId = payload.event?.getId?.()
        const status: EventStatus | 'sent' | null = payload.status ?? 'sent'
        if (eventId) {
          if (!status) {
            localStatusByEventId.delete(eventId)
          } else {
            localStatusByEventId.set(eventId, status)
          }
        }
      }
      queueRefresh(roomId)
    })

  messageRefreshDisposers.push(
    subscribe(MatrixEventType.MESSAGE_RECEIVED),
    subscribe(MatrixEventType.MESSAGE_SENT),
    subscribe(MatrixEventType.MESSAGE_UPDATED),
    subscribe(MatrixEventType.MESSAGE_DELETED)
  )

  messageRefreshDisposers.push(
    matrixEventManager.on(MatrixEventType.ROOM_UPDATED, (payload) => {
      const roomId = payload.room?.roomId
      if (!roomId || roomId !== currentRoomId.value) return
      queueRefresh(roomId)
    })
  )

  ensureObserver()
  nextTick(() => observeMessageNodes())
})

/**
 * 组件卸载时取消事件订阅。
 * 输入：无。
 * 输出：无。
 */
onUnmounted(() => {
  messageRefreshDisposers.forEach((dispose) => dispose())
  messageRefreshDisposers.length = 0
  readObserver.value?.disconnect()
  readObserver.value = null
  observedEventIds.clear()
  sentReceiptByRoom.clear()
})

const isLoadingHistory = computed(() => {
  const roomId = currentRoomId.value
  if (!roomId) return false
  return timelineStore.loadingByRoomId[roomId] ?? false
})

/**
 * 向上滚动触发加载更多历史消息。
 * 输入：无。
 * 输出：Promise<void>。
 * 逻辑：记录滚动高度，加载后保持视口位置。
 */
const loadMoreHistory = async () => {
  const roomId = currentRoomId.value
  if (!roomId || isLoadingHistory.value) return
  isPrependingHistory.value = true
  const container = messageAreaRef.value
  const prevScrollHeight = container?.scrollHeight ?? 0
  const prevScrollTop = container?.scrollTop ?? 0
  const prevTimelineMessageCount = timelineStore.getRoomItems(roomId).filter((item) => item.type === 'message').length
  const prevMessageCount = messages.value.length

  await matrixTimelineService.loadHistory(roomId)
  matrixMessageService.getRoomMessages(roomId)
  await nextTick()
  const nextTimelineMessageCount = timelineStore.getRoomItems(roomId).filter((item) => item.type === 'message').length
  const nextMessageCount = messages.value.length
  if (nextTimelineMessageCount > prevTimelineMessageCount && nextMessageCount <= prevMessageCount) {
    console.warn('[System:MessageArea:loadMoreHistory] timeline has more message history, but message list did not grow', {
      roomId,
      prevTimelineMessageCount,
      nextTimelineMessageCount,
      prevMessageCount,
      nextMessageCount,
    })
  }

  if (container) {
    const newScrollHeight = container.scrollHeight
    const delta = newScrollHeight - prevScrollHeight
    container.scrollTop = prevScrollTop + delta
  }
  isPrependingHistory.value = false
}

/**
 * 处理滚动事件。
 * 输入：无。
 * 输出：无。
 * 逻辑：接近顶部时加载历史。
 */
const handleScroll = () => {
  const container = messageAreaRef.value
  if (!container) return
  if (container.scrollTop <= 10) {
    loadMoreHistory()
  }
  observeMessageNodes()
}

const cancelForward = () => {
  systemStore.clearForwardSelection()
}

const confirmForward = async () => {
  const sourceRoomId = forwardSourceRoomId.value
  if (!sourceRoomId) return
  const selectedIds = forwardSelectedIds.value
  if (!selectedIds.length) return

  const rooms = (systemStore.SystemRooms || []).map((item) => ({
    id: (item.room as { roomId?: string }).roomId || '',
    name: (item.room as { name?: string }).name || '未命名',
  })).filter((room) => room.id && room.id !== sourceRoomId)

  const targetRoomIds = await openForwardDialog(rooms)
  if (!targetRoomIds.length) return

  const list = systemStore.SystemMessages?.[sourceRoomId] ?? []
  const selectedMessages = list.filter((item) => selectedIds.includes(item.id))
  await forwardMessageBundle(targetRoomIds, sourceRoomId, selectedMessages)
  systemStore.clearForwardSelection()
}

const GROUP_WINDOW_MS = 5 * 60 * 1000

/**
 * 按发送者和时间窗口分组消息。
 * 输入：无（使用 messages）。
 * 输出：分组后的消息数组。
 * 逻辑：同一发送者、时间间隔内的消息合并为一组。
 */
const groupedMessages = computed(() => {
  const list = [...displayMessages.value].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
  const groups: Array<{
    senderId: string
    senderName: string
    isSelf: boolean
    avatarText: string
    items: MessageAreaMessage[]
  }> = []

  let current: typeof groups[number] | null = null

  for (const msg of list) {
    if (msg.type === 'm.system') {
      current = null
      groups.push({
        senderId: `__system_${msg.id}`,
        senderName: 'system',
        isSelf: false,
        avatarText: '',
        items: [msg]
      })
      continue
    }

    const senderId = msg.senderId
    const senderName = msg.senderName || senderId
    const isSelf = !!currentUserId.value && senderId === currentUserId.value
    const ts = msg.timestamp ?? 0

    if (!current) {
      current = {
        senderId,
        senderName,
        isSelf,
        avatarText: senderName.slice(0, 1).toUpperCase(),
        items: [msg]
      }
      groups.push(current)
      continue
    }

    const last = current.items[current.items.length - 1]
    const lastTs = last?.timestamp ?? 0
    const sameSender = current.senderId === senderId
    const withinWindow = Math.abs(ts - lastTs) <= GROUP_WINDOW_MS

    if (sameSender && withinWindow) {
      current.items.push(msg)
    } else {
      current = {
        senderId,
        senderName,
        isSelf,
        avatarText: senderName.slice(0, 1).toUpperCase(),
        items: [msg]
      }
      groups.push(current)
    }
  }

  return groups
})

/**
 * 监听消息数量变化，追加新消息时自动滚动到底部。
 * 输入：messages 长度变化。
 * 输出：Promise<void>。
 * 逻辑：排除加载历史的场景。
 */
watch(
  () => messages.value.length,
  async (next, prev) => {
    if (!currentRoomId.value) return
    if (isPrependingHistory.value) return
    if (next > prev) {
      await scrollToBottom()
      observeMessageNodes()

      const roomId = currentRoomId.value
      if (!roomId) return
      const roomStreams = webSocketStreamStore.getRoomStreams(roomId)
      if (roomStreams.length === 0) return

      const list = messages.value
      const lastMsg = list[list.length - 1]
      if (!lastMsg) return

      const latestStreamTs = Math.max(...roomStreams.map((item) => item.timestamp || 0), 0)
      const STREAM_CLEANUP_SKEW_MS = 30_000
      const isNewEnough = latestStreamTs ? (lastMsg.timestamp >= latestStreamTs - STREAM_CLEANUP_SKEW_MS) : true
      if (!isNewEnough) return

      const mapped = idmapStore.getByMatrixId(lastMsg.senderId)
      const isBotMessage = mapped?.type === 'bot'
        || (roomStreams.length > 0 && lastMsg.senderId !== currentUserId.value)

      if (isBotMessage) {
        if (mapped?.username) {
          webSocketStreamStore.clearStream(roomId, mapped.username)
          return
        }

        const doneStreams = roomStreams.filter((item) => item.finished)
        if (doneStreams.length > 0) {
          doneStreams.forEach((item) => {
            webSocketStreamStore.clearStream(roomId, item.botUsername)
          })
        } else {
          webSocketStreamStore.clearRoomStreams(roomId)
        }
      }
    }
  }
)

watch(
  () => {
    const roomId = currentRoomId.value
    if (!roomId) return ''
    return webSocketStreamStore
      .getRoomStreams(roomId)
      .map((item) => `${item.key}:${item.timestamp}`)
      .join('|')
  },
  async () => {
    if (!currentRoomId.value) return
    await scrollToBottom()
  }
)

watch(currentRoomId, async (nextRoomId, prevRoomId) => {
  if (prevRoomId && prevRoomId !== nextRoomId) {
    markRoomAllRead(prevRoomId)
  }
  observedEventIds.clear()
  readObserver.value?.disconnect()
  readObserver.value = null
  sentReceiptByRoom.clear()
  await nextTick()
  ensureObserver()
  observeMessageNodes()
})
</script>

<style scoped>
.message-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-sm);
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: transparent;
}

.forward-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--glass-bg) 80%, transparent);
  border: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  bottom: 6px;
  z-index: 5;
  backdrop-filter: var(--glass-blur);
}

.forward-info {
  color: var(--text-color);
  font-size: var(--font-xs);
}

.forward-actions {
  display: inline-flex;
  gap: 6px;
}

.message-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
  width: 100%;
  min-width: 0;
}

.message-group.self {
  align-items: flex-end;
}

.group-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
  align-items: stretch;
}

.message-group.self .group-content {
  align-items: flex-end;
}

.message-area :deep(.streaming-message) {
  opacity: 0.95;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.95;
  }

  50% {
    opacity: 1;
  }
}
</style>
