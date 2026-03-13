<template>
  <div class="messages-container" ref="messagesContainer" @scroll="handleScroll">
  <template v-for="group in groupMessages(preprocessByBundle(props.messages))" :key="group.sender + group.items[0]?.timestamp">
      <div v-if="group.isSystemEvent" class="system-event">
        <span class="system-event__label">{{ formatSystemEventLabel(group.items[0]) }}</span>
      </div>
      <div v-else class="message-group">
        <MessageItem
          v-for="(msg, idx) in group.items"
          :key="msg.eventId"
          :event-id="msg.eventId"
          :room-id="msg.roomId"
          :sender="msg.sender"
          :content="msg.content"
          :timestamp="msg.timestamp"
          :encrypted="msg.encrypted"
          :current-user-id="props.currentUserId"
          :message-type="msg.messageType"
          :message-info="getMessageInfo(msg)"
          :formatted-body="msg.formattedBody"
          :format="msg.format"
          :is-first-in-group="idx === 0"
          :is-continued-in-group="idx > 0"
          :display-name="msg.displayName"
          @mention-user="handleMentionUser"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed, inject } from 'vue'
import { useReadReceipts } from '@/composables/useReadReceipts'
import MessageItem from '@/components/Message/MessageItem/index.vue'
import type { MatrixMessage } from '@/types'
import { matrixEventManager } from '@/services/matrix/eventManager'
import { messageServiceV2 } from '@/services/matrix/messages'

interface Props {
  messages: MatrixMessage[]
  currentUserId: string
}

const props = withDefaults(defineProps<Props>(), {
  messages: () => []
})

const emit = defineEmits<{
  'mention-user': [userId: string, displayName: string]
}>()

// 消息容器引用
const messagesContainer = ref<HTMLElement | null>(null)

// 自动滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value!.scrollTop = messagesContainer.value!.scrollHeight
    })
  }
}

// 顶部加载更多（上划）
const isLoadingMore = ref(false)
// 容器内容太少时，自动连续向上拉取几批，直到可以滚动或耗尽历史
const autoFillUntilScrollable = async (maxBatches: number = 10) => {
  let loops = 0
  while (loops < maxBatches) {
    await nextTick()
    const el = messagesContainer.value
    const roomId = getActiveRoomId()
    if (!el || !roomId) break

    const canScroll = (el.scrollHeight - el.clientHeight) > 120
    const tl = matrixEventManager.getRoomTimeline(roomId)
    if (canScroll || (tl && tl.hasMoreHistory === false)) break

    if (isLoadingMore.value) {
      await new Promise(res => setTimeout(res, 50))
      continue
    }

    isLoadingMore.value = true
    const prevHeight = el.scrollHeight
    const prevTop = el.scrollTop
    try {
      await matrixEventManager.loadMoreHistory(roomId, 30)
      const fresh = await messageServiceV2.获取房间历史消息(roomId)
      mergeRoomMessages(roomId, fresh)
      await nextTick()
      if (messagesContainer.value) {
        const delta = messagesContainer.value.scrollHeight - prevHeight
        messagesContainer.value.scrollTop = prevTop + delta
      }
    } catch (e) {
      console.warn('[MessageArea/RightContent] 自动补齐历史失败:', e)
      break
    } finally {
      isLoadingMore.value = false
      loops++
    }
  }
}

const TOP_THRESHOLD = 80
const getActiveRoomId = () => props.messages[0]?.roomId || ''

const mergeRoomMessages = (roomId: string, fresh: MatrixMessage[]) => {
  try {
    const ctx: any = inject('chatContext') || null
    if (!ctx?.messages) return
    const all: MatrixMessage[] = ctx.messages.value || []
  nextTick(() => {
    void autoFillUntilScrollable()
  })
    const others = all.filter((m) => m.roomId !== roomId)

// 监听房间变化（基于 messages 推断）后尝试补齐
const activeRoomIdRef = computed(() => getActiveRoomId())
watch(activeRoomIdRef, async () => {
  await nextTick()
  void autoFillUntilScrollable()
})
    const map = new Map<string, MatrixMessage>()
    for (const m of fresh) map.set(m.eventId, m)
    for (const m of all) if (m.roomId === roomId && !map.has(m.eventId)) map.set(m.eventId, m)
    const merged = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp)
    ctx.messages.value = [...others, ...merged]
  } catch (e) {
    console.warn('[MessageArea/RightContent] 合并历史消息失败:', e)
  }
}

const loadMoreIfNeeded = async () => {
  const el = messagesContainer.value
  if (!el || isLoadingMore.value) return
  const roomId = getActiveRoomId()
  if (!roomId) return
  if (el.scrollTop > TOP_THRESHOLD) return
  const tl = matrixEventManager.getRoomTimeline(roomId)
  if (tl && (tl.isLoadingHistory || tl.hasMoreHistory === false)) return

  isLoadingMore.value = true
  const prevHeight = el.scrollHeight
  const prevTop = el.scrollTop
  try {
    await matrixEventManager.loadMoreHistory(roomId, 30)
    const fresh = await messageServiceV2.获取房间历史消息(roomId)
    mergeRoomMessages(roomId, fresh)
    await nextTick()
    if (messagesContainer.value) {
      const delta = messagesContainer.value.scrollHeight - prevHeight
      messagesContainer.value.scrollTop = prevTop + delta
    }
  } catch (e) {
    console.warn('[MessageArea/RightContent] 加载更多历史失败:', e)
  } finally {
    isLoadingMore.value = false
  }
}

// 滚动事件：顶部触发加载
const handleScroll = () => {
  if (!messagesContainer.value) return
  loadMoreIfNeeded()
}

// 处理@提及用户事件
const handleMentionUser = (userId: string, displayName: string) => {
  emit('mention-user', userId, displayName)
}

// 先按 bundle_id 聚合并展平：同一 bundle 作为一个时间点插入，组内按 bundleIndex 升序
function preprocessByBundle(messages: MatrixMessage[]): MatrixMessage[] {
  const bundles = new Map<string, { messages: MatrixMessage[]; ts: number }>()
  const singles: { msg: MatrixMessage; ts: number }[] = []

  for (const m of messages) {
    const ts = m.timestamp || 0
    if (m.bundleId) {
      const b = bundles.get(m.bundleId) || { messages: [], ts }
      b.messages.push(m)
      b.ts = Math.min(b.ts, ts)
      bundles.set(m.bundleId, b)
    } else {
      singles.push({ msg: m, ts })
    }
  }

  const items: Array<{ type: 'bundle'; ts: number; messages: MatrixMessage[] } | { type: 'single'; ts: number; message: MatrixMessage }> = []
  for (const [, b] of bundles) {
    items.push({ type: 'bundle', ts: b.ts, messages: b.messages.sort((a, b) => (a.bundleIndex || 0) - (b.bundleIndex || 0)) })
  }
  for (const s of singles) items.push({ type: 'single', ts: s.ts, message: s.msg })

  items.sort((a, b) => a.ts - b.ts)

  const flattened: MatrixMessage[] = []
  for (const it of items) {
    if (it.type === 'single') flattened.push(it.message)
    else flattened.push(...it.messages)
  }
  return flattened
}

// 根据消息类型解析消息信息
const getMessageInfo = (message: MatrixMessage) => {
  if (message.isSystemEvent) {
    return undefined
  }
  
  // 如果消息已经有额外的信息，直接返回
  if (message.messageInfo) {
    console.log('✅ 使用现有的messageInfo:', message.messageInfo)
    return message.messageInfo
  }

  // 根据消息类型解析内容
  const messageInfo: any = {}

  if (message.messageType === 'm.image') {
    // 解析图片消息
    const imageMatch = message.content.match(/!\[(.*?)\]\((.*?)\)/)
    if (imageMatch) {
      messageInfo.alt = imageMatch[1] || '图片'
      messageInfo.url = imageMatch[2]
    } else {
      // 尝试直接作为URL
      const urlPattern = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp|svg)/i
      const urlMatch = message.content.match(urlPattern)
      if (urlMatch) {
        messageInfo.url = urlMatch[0]
        messageInfo.alt = '图片'
      }
    }
  } else if (['m.file', 'm.audio', 'm.video'].includes(message.messageType || '')) {
    // 解析文件消息
    const linkMatch = message.content.match(/\[(.*?)\]\((.*?)\)/)
    if (linkMatch) {
      messageInfo.filename = linkMatch[1]
      messageInfo.url = linkMatch[2]
    } else {
      // 尝试从内容中提取URL和文件名
      const urlPattern = /https?:\/\/[^\s]+/
      const urlMatch = message.content.match(urlPattern)
      if (urlMatch) {
        messageInfo.url = urlMatch[0]
        // 从URL中提取文件名
        try {
          const url = new URL(urlMatch[0])
          const pathParts = url.pathname.split('/')
          messageInfo.filename = pathParts[pathParts.length - 1] || '未知文件'
        } catch {
          messageInfo.filename = '未知文件'
        }
      } else {
        messageInfo.filename = message.content || '未知文件'
      }
    }
    
    // 可以在这里添加更多的文件信息解析逻辑
    // 比如从文件名推断mimetype等
  }


  return messageInfo
}

// 消息分组逻辑：同一用户连续消息合并（5分钟内）
type MessageGroup = {
  sender: string
  items: MatrixMessage[]
  isSystemEvent?: boolean
}

function groupMessages(messages: MatrixMessage[], interval = 5 * 60 * 1000): MessageGroup[] {
  const groups: MessageGroup[] = []
  let lastSender = ''
  let lastTime = 0
  let currentGroup: MessageGroup | null = null

  for (const msg of messages) {
    if (msg.isSystemEvent) {
      groups.push({ sender: `system:${msg.eventId}`, items: [msg], isSystemEvent: true })
      continue
    }

    if (
      currentGroup &&
      !currentGroup.isSystemEvent &&
      msg.sender === lastSender &&
      Math.abs(msg.timestamp - lastTime) < interval
    ) {
      currentGroup.items.push(msg)
    } else {
      currentGroup = { sender: msg.sender, items: [msg] }
      groups.push(currentGroup)
    }

    lastSender = msg.sender
    lastTime = msg.timestamp
  }

  return groups
}

const formatTime = (timestamp?: number) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatSystemEventLabel = (message?: MatrixMessage) => {
  if (!message) return ''
  const base = message.content || ''
  const time = formatTime(message.timestamp)
  return time ? `${base} · ${time}` : base
}

const messagesRef = computed(() => props.messages)
const roomIdRef = computed(() => undefined)
// set up read receipts (roomId unknown here — handled by parent in newrightcontent views)
useReadReceipts(messagesContainer, messagesRef, roomIdRef, { sendReadReceiptOnLoad: true, manageReadMarkers: true, manageReadReceipts: true })

// 监听消息变化，自动滚动到底部
watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })

// 组件挂载时滚动到底部
onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px; /* 从16px缩小到8px */
  background-color: var(--bg-color-secondary);
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track-bg);
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-bg);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover-bg);
}

.system-event {
  position: relative;
  margin: 12px 0;
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 12px;
}

.system-event::before,
.system-event::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
}

.system-event::before {
  left: 0;
}

.system-event::after {
  right: 0;
}

.system-event__label {
  padding: 0 12px;
  background: var(--bg-color-secondary);
  color: inherit;
}
</style>
