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
            <span class="resource-list__hint">{{ (f.url || f.mxcUrl) ? (f.kind === 'file' ? '打开' : f.kind === 'audio' ? '播放' : '查看') : '不可用' }}</span>
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
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { matrixClient } from '@/services/Matrix/client'
import { useRoomFiles, type RoomFileItem } from '@/composables/useRoomFiles'
import { buildMediaCandidates, fetchWithAuthToBlob, resolveMediaBaseUrl } from '@/utils/media'
import { useSystemStore } from '@/stores/System'
import { openFilePreviewDialog } from '@/components/FilePreviewDialog/open'
import { openMediaPreviewOverlay } from '@/components/MediaPreviewOverlay/open'

const systemStore = useSystemStore()

// 获取当前房间 ID
const roomId = computed<string | null>(() => systemStore.currentSystemRoomId || null)

// 响应式主题变量
const roomTopic = ref('')

// 获取并更新主题的私有函数
const updateTopic = () => {
  const rid = roomId.value
  if (!rid) {
    roomTopic.value = ''
    return
  }
  const client = matrixClient.getAuthedClient()
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
const onStateEvent = (event: any) => {
  if (event.getType() === 'm.room.topic' && event.getRoomId() === roomId.value) {
    updateTopic()
  }
}

onMounted(() => {
  const client = matrixClient.getAuthedClient()
  if (!client) return
    ; (client as any).on?.('RoomState.events', onStateEvent)
})

onBeforeUnmount(() => {
  const client = matrixClient.getAuthedClient()
  if (!client) return
    ; (client as any).removeListener?.('RoomState.events', onStateEvent)
})

const roomIdRef = computed(() => roomId.value)

const kindLabel = {
  image: '图片',
  video: '视频',
  audio: '音频',
  file: '文件',
} as const

async function openFile(f: RoomFileItem) {
  if (!f?.url && !f?.mxcUrl) return
  if (f.kind === 'image' || f.kind === 'video') {
    openMediaPreviewOverlay({
      kind: f.kind,
      fileName: f.name,
      fileSize: f.size,
      mimeType: f.mimetype,
      url: f.url,
      mxcUrl: f.mxcUrl,
    })
    return
  }
  if (f.kind === 'file' || f.kind === 'audio') {
    openFilePreviewDialog({
      fileName: f.name,
      fileSize: f.size,
      mimetype: f.mimetype,
      url: f.url,
      mxcUrl: f.mxcUrl,
    })
    return
  }
  try {
    const baseUrl = resolveMediaBaseUrl({ url: f.url, mxcUrl: f.mxcUrl })
    if (!baseUrl) throw new Error('无法获取下载地址')

    const candidates = buildMediaCandidates(baseUrl)
    let blob: Blob | null = null
    for (const candidate of candidates) {
      try {
        blob = await fetchWithAuthToBlob(candidate, f.mimetype)
        break
      } catch {
        // try next candidate
      }
    }

    if (!blob) throw new Error('文件下载失败')

    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = objectUrl
    a.download = f.name || 'download'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(objectUrl)
    document.body.removeChild(a)
  } catch (e: any) {
    console.error('[SystemList3] 文件下载失败:', e)
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

</script>

<style scoped>
.system-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  height: 100%;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  background: var(--panel-bg);
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
  background: color-mix(in srgb, var(--text-muted) 30%, transparent);
  pointer-events: none;
}

.panel {
  background: var(--glass-bg);
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--radius-md);

}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md) 0;
}

.panel__title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--text-color);
}

.panel__body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  padding: var(--space-sm) var(--space-md) var(--space-md);
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
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.back-button {
  width: 24px;
  height: 24px;
  border-radius: 999px;

  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  font-size: var(--font-xs);
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.back-button:hover {
  background: var(--hover-bg);
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-color);
}

.meta {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.mission-summary {
  margin: 0;
  font-size: var(--font-xs);
  line-height: 1.6;
  color: var(--text-muted);
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
  gap: var(--space-sm);
  /* 由父容器（panel__body）控制高度，列表自身填满剩余空间并滚动 */
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.resource-list__item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) calc(var(--space-sm) + 2px);
  border-radius: var(--radius-sm);
  border: var(--glass-border);
  cursor: pointer;
  transition: background-color 0.2s ease;
  background: var(--glass-bg);
}

.resource-list__item:hover,
.resource-list__item:focus-visible {
  background: var(--hover-bg);
}

.resource-list__type {
  font-size: var(--font-xs);
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 16%, transparent);
  border-radius: 999px;
  padding: 2px var(--space-sm);
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
  gap: var(--space-xs);
  min-width: 0;
}

.resource-list__name {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-list__description {
  font-size: var(--font-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-list__hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.resource-empty {
  margin: 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
  text-align: center;
}

@media (max-width: 768px) {
  .system-list {
    padding-left: 0;
  }
}

@media (max-width: 768px) {
  .panel__header {
    padding: var(--space-sm) calc(var(--space-sm) + 2px) 0;
  }

  .panel__body {
    padding: var(--space-sm) calc(var(--space-sm) + 2px) calc(var(--space-sm) + 2px);
  }

  .resource-list__item {
    grid-template-columns: auto 1fr;
    gap: var(--space-sm);
  }

  .resource-list__hint {
    display: none;
  }
}
</style>
