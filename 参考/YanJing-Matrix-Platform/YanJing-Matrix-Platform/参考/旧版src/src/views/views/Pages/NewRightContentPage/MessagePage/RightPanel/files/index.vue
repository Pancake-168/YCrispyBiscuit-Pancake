<template>
  <div class="system-list">
    <section class="panel panel--mission-summary" v-if="roomId">
      <!--header class="panel__header">
        <div class="panel__title">
          <div class="title-group">
            <span class="title"></span>

          </div>
        </div>
      </header-->
      <div class="panel__body">
        <p class="mission-summary" v-if="roomTopic">{{ roomTopic }}</p>
        <p class="mission-summary mission-summary--placeholder" v-else>暂无主题</p>
      </div>
    </section>

    <section class="panel panel--mission-empty" v-else>
      <div class="panel__body panel__body--empty">
        <p>当前未选择聊天，请先选择一个聊天。</p>
      </div>
    </section>

    <section class="panel panel--resources" v-if="roomId">
      <header class="panel__header">
        <div class="panel__title">
          <span class="title">资源文件</span>
          <span class="meta">{{ files.length }} 项</span>
        </div>
      </header>
      <div class="panel__body">
        <ul v-if="files.length" class="resource-list">
          <li v-for="f in files" :key="f.id" class="resource-list__item" role="button" tabindex="0" @click="openFile(f)"
            :title="f.name">
            <span class="resource-list__type" :data-type="f.kind">{{ kindLabel[f.kind] }}</span>
            <div class="resource-list__content">
              <span class="resource-list__name">{{ f.name }}</span>
              <span class="resource-list__description">
                {{ f.senderName || '' }} · {{ formatTime(f.timestamp) }}
                <template v-if="f.size"> · {{ formatSize(f.size) }}</template>
                <template v-if="f.kind === 'image' && f.width && f.height"> · {{ f.width }}×{{ f.height }}</template>
                <template v-if="f.kind === 'video' && f.duration"> · {{ formatDuration(f.duration) }}</template>
                <template v-if="f.kind === 'audio' && f.duration"> · {{ formatDuration(f.duration) }}</template>
                <template v-if="f.encrypted"> · 加密</template>
              </span>
            </div>
            <span class="resource-list__hint">{{ (f.url || f.mxcUrl) ? '下载' : '不可用' }}</span>
          </li>
          <li v-if="hasMore" class="resource-list__item" @click="loadMore()" role="button" tabindex="0">
            <span class="resource-list__type" data-type="tool">更多</span>
            <div class="resource-list__content">
              <span class="resource-list__name">加载更多</span>
              <span class="resource-list__description">向上翻取更多历史文件</span>
            </div>
            <span class="resource-list__hint">{{ loading ? '加载中…' : '点击' }}</span>
          </li>
        </ul>
        <p v-else class="resource-empty">该房间暂无文件/媒体消息。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { matrixClientV2 } from '@/services/matrix/client'
import { useRoomFiles } from '@/composables/useRoomFiles'
import { downloadFromMessageInfo } from '@/services/Operations/MsgDownload'

// 从上层注入 chatContext，复用现有房间上下文
const chatContext = inject('chatContext') as any

const emit = defineEmits<{
  (e: 'back'): void
}>()

// 获取当前房间 ID
const roomId = computed<string | null>(() => chatContext?.currentRoomId?.value || null)

// 响应式主题变量
const roomTopic = ref('')

// 获取并更新主题的私有函数
const updateTopic = () => {
  const rid = roomId.value
  if (!rid) {
    roomTopic.value = ''
    return
  }
  const client = matrixClientV2.getAuthedClient()
  if (!client) return

  try {
    const room = client.getRoom(rid)
    if (!room) {
      roomTopic.value = ''
      return
    }

    const topicEvent = room.currentState?.getStateEvents('m.room.topic', '')
    roomTopic.value = topicEvent?.getContent()?.topic || ''
  } catch (error) {
    console.error('[SystemList3] 获取房间主题失败:', error)
    roomTopic.value = ''
  }
}

// 监听房间 ID 变化
watch(roomId, () => {
  updateTopic()
}, { immediate: true })

// 挂载实时监听器
onMounted(() => {
  const client = matrixClientV2.getAuthedClient()
  if (!client) return

  const onStateEvent = (event: any) => {
    // 仅当事件类型为主题且属于当前房间时更新
    if (event.getType() === 'm.room.topic' && event.getRoomId() === roomId.value) {
      updateTopic()
    }
  }

  client.on('RoomState.events', onStateEvent)

  onBeforeUnmount(() => {
    client.removeListener('RoomState.events', onStateEvent)
  })
})

const roomIdRef = computed(() => roomId.value)

const kindLabel = {
  image: '图片',
  video: '视频',
  audio: '音频',
  file: '文件',
} as const

async function openFile(f: any) {
  // 直接触发下载（支持 url 或 mxcUrl；无须额外按钮）
  if (!f?.url && !f?.mxcUrl) return
  try {
    await downloadFromMessageInfo({
      url: f.url,
      mxcUrl: f.mxcUrl,
      encryptionInfo: f.encryptionInfo,
      filename: f.name,
      mimetype: f.mimetype,
    })
  } catch (e: any) {
    console.error('[SystemList3] 文件下载失败:', e)
    // 保底：如存在直链仍尝试打开窗口
    if (f?.url) {
      try { window.open(f.url, '_blank') } catch {/* ignore */ }
    }
  }
}

function formatSize(bytes?: number) {
  if (!bytes && bytes !== 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let v = bytes, i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDuration(ms?: number) {
  if (!ms && ms !== 0) return ''
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function formatTime(ts: number) {
  try {
    const d = new Date(ts)
    const y = d.getFullYear()
    const mon = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${mon}-${day} ${hh}:${mm}`
  } catch { return '' }
}

const { files, loading, hasMore, loadMore } = useRoomFiles(roomIdRef)

const handleBack = () => {
  emit('back')
}
</script>

<style scoped>
.system-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  background: var(--bg-color-third);
}

/* 不要挤压上方“房间主题/简介”区域，让其保持自身高度 */
.system-list .panel--mission-summary,
.system-list .panel--mission-empty {
  flex: 0 0 auto;
  /* 不收缩，不拉伸，高度由内容决定 */
}

/* 资源面板占据剩余空间，内部滚动 */
.system-list .panel--resources {
  flex: 1 1 auto;
  min-height: 0;
  /* 允许内部滚动 */
}

.system-list::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -6px;
  width: 1px;
  background: var(--border-color);
  pointer-events: none;
}

.panel {
  background: var(--bg-color-third);
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  border-radius: 12px;

}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 0;
}

.panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-color);
}

.panel__body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  padding: 12px 16px 16px;
  overflow: hidden;
}

/* 仅资源面板的内容区域需要容纳可滚动列表 */
.panel--resources .panel__body {
  display: flex;
  flex-direction: column;
}

.panel__body--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  opacity: 0.6;
  font-size: var(--font-size-sm);
}

.back-button {
  width: 24px;
  height: 24px;
  border-radius: 999px;
 
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  font-size: calc(var(--font-size-sm) + 1px);
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.back-button:hover {
  background: var(--bg-color-secondary);
  border-color: var(--border-color);
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: calc(var(--font-size-sm) + 1px);
  font-weight: 600;
  color: var(--text-color);
}

.meta {
  font-size: calc(var(--font-size-base) * 1.1);
  color: var(--text-color);
  opacity: 0.55;
}

.mission-summary {
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text-color);
}

.mission-summary--placeholder {
  opacity: 0.6;
  font-style: italic;
}

.resource-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 由父容器（panel__body）控制高度，列表自身填满剩余空间并滚动 */
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.resource-list__item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background: rgba(255, 255, 255, 0.02);
}

.resource-list__item:hover,
.resource-list__item:focus-visible {
  background: var(--bg-color-secondary);
}

.resource-list__type {
  font-size: var(--font-size-base);
  color: var(--color-primary, #5a6ff0);
  background: var(--color-primary-10, rgba(86, 120, 235, 0.12));
  border-radius: 999px;
  padding: 2px 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.resource-list__type[data-type='media'] {
  color: #d091ff;
  background: rgba(208, 145, 255, 0.12);
}

.resource-list__type[data-type='dataset'] {
  color: #42c4a3;
  background: rgba(66, 196, 163, 0.12);
}

.resource-list__type[data-type='tool'] {
  color: #f0a400;
  background: rgba(240, 164, 0, 0.12);
}

.resource-list__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.resource-list__name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-list__description {
  font-size: var(--font-size-xs);
  color: var(--text-color);
  opacity: 0.65;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-list__hint {
  font-size: calc(var(--font-size-base) * 1.1);
  color: var(--text-color);
  opacity: 0.5;
}

.resource-empty {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--text-color);
  opacity: 0.6;
  text-align: center;
}

@media (max-width: 1024px) {
  .system-list {
    padding-left: 0;
  }
}

@media (max-width: 768px) {
  .panel__header {
    padding: 10px 12px 0;
  }

  .panel__body {
    padding: 10px 12px 12px;
  }

  .resource-list__item {
    grid-template-columns: auto 1fr;
    gap: 8px;
  }

  .resource-list__hint {
    display: none;
  }
}
</style>
