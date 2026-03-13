<template>
  <div v-if="modelValue" class="vs-overlay" role="dialog" aria-modal="true" @click="closeSelf">
    <div class="vs-container" @click.stop>
      <!-- 上半部分：标题 + 元信息（roomId / eventId 独立一列，提供复制） -->
      <div class="vs-top">
        <div class="vs-title-row">
          <h3 class="vs-title">查看源码</h3>
          <button class="vs-close" type="button" aria-label="关闭" @click="closeSelf">✕</button>
        </div>
        <div class="vs-meta">
          <div class="vs-meta-row">
            <span class="vs-meta-label">Room ID</span>
            <span class="vs-meta-value" :title="roomIdToShow">{{ roomIdToShow }}</span>
            <button class="vs-copy" type="button" @click="copyText(roomIdToShow)">复制</button>
          </div>
          <div class="vs-meta-row">
            <span class="vs-meta-label">Event ID</span>
            <span class="vs-meta-value" :title="eventId">{{ eventId }}</span>
            <button class="vs-copy" type="button" @click="copyText(eventId)">复制</button>
          </div>
          <div class="vs-meta-actions">
            <button class="vs-copy-json" type="button" @click="copyText(originalText)">复制 JSON</button>
          </div>
        </div>
      </div>

      <!-- 下半部分：正文（原始 JSON）或错误/加载 -->
      <div class="vs-bottom">
        <div v-if="loading" class="vs-loading">加载中…</div>
        <div v-else-if="error" class="vs-error">{{ error }}</div>
        <pre v-else class="vs-code"><code>{{ originalText }}</code></pre>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getViewSourceData, toDisplayStrings } from '@/services/Operations/MsgViewSource'

interface Props {
  modelValue: boolean
  roomId?: string
  eventId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const error = ref<string | null>(null)
const originalText = ref('')
const resolvedRoomId = ref<string>('')

const roomIdToShow = computed(() => props.roomId || resolvedRoomId.value || '')

function closeSelf() {
  emit('update:modelValue', false)
}

async function load() {
  loading.value = true
  error.value = null
  originalText.value = ''
  resolvedRoomId.value = ''
  try {
    const data = await getViewSourceData({ roomId: props.roomId, eventId: props.eventId })
    if (!data) {
      error.value = '未找到事件或事件尚不可用'
    } else {
      const texts = toDisplayStrings(data)
      originalText.value = texts.originalText
      resolvedRoomId.value = data.roomId || ''
    }
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) load()
  },
  { immediate: false }
)

async function copyText(text?: string) {
  if (!text) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const x = document.createElement('textarea')
      x.value = text
      document.body.appendChild(x)
      x.select()
      document.execCommand('copy')
      document.body.removeChild(x)
    }
  } catch {
    // 静默失败
  }
}
</script>

<style scoped>
/* 遮罩层 */
.vs-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-color-mask, rgba(0, 0, 0, 0.45));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal, 1050);
}

/* 容器 */
.vs-container {
  width: min(780px, 96vw);
  max-height: 86vh;
  background: var(--bg-color-third);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}

/* 上半部分：标题 + 元信息，两层内边距尽量轻量 */
.vs-top {
  padding: 12px 14px 8px 14px;
  border-bottom: 1px solid var(--border-color);
}
.vs-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.vs-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}
.vs-close {
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 6px;
}
.vs-meta {
  margin-top: 6px;
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 6px;
}
.vs-meta-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: 8px;
}
.vs-meta-label {
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
}
.vs-meta-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
  font-size: var(--font-size-sm);
}
.vs-copy,
.vs-copy-json {
  border: 1px solid var(--border-color);
  background: var(--bg-color-fourth);
  color: var(--text-color);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}
.vs-copy:hover,
.vs-copy-json:hover {
  background: var(--bg-color-hover);
}
.vs-meta-actions {
  margin-top: 2px;
  text-align: right;
}

/* 下半部分：内容区（仅一层容器） */
.vs-bottom {
  padding: 10px 12px 12px;
  overflow: hidden;
}
.vs-loading {
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
}
.vs-error {
  color: var(--color-error, #f04747);
  font-size: var(--font-size-sm);
  border: 1px solid var(--border-color);
  background: var(--color-error-light, rgba(240,71,71,0.1));
  border-radius: 6px;
  padding: 8px 10px;
}
.vs-code {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--code-bg);
  color: var(--text-color);
  padding: 10px;
  max-height: 60vh;
  overflow: auto;
  margin: 0;
}
.vs-code code {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

/* 移动端：基本全屏感、边距更小 */
@media (max-width: 600px) {
  .vs-container {
    width: 96vw;
    max-height: 90vh;
    border-radius: 6px;
  }
  .vs-top { padding: 10px 10px 6px; }
  .vs-bottom { padding: 8px 10px 10px; }
  .vs-code { max-height: 66vh; padding: 8px; }
}
</style>
