<template>
  <div class="dialog-mask yj-dialog-mask" @click.self="close">
    <div class="dialog yj-dialog-content">
      <div class="dialog-header">
        <div class="dialog-title">{{ title }}</div>
      </div>

      <div class="dialog-body">
        <div class="dialog-meta">
          <div class="meta-row">
            <span class="meta-label">对话 ID</span>
            <span class="meta-value">{{ roomId }}</span>
            <button class="meta-copy" type="button" @click="copy(roomId)">复制</button>
          </div>
          <div class="meta-row">
            <span class="meta-label">事件 ID</span>
            <span class="meta-value">{{ eventId }}</span>
            <button class="meta-copy" type="button" @click="copy(eventId)">复制</button>
          </div>
        </div>

        <div v-if="loading" class="dialog-loading">加载中...</div>
        <div v-else class="dialog-code-block">
          <div class="code-toolbar">
            <span class="code-label">JSON</span>
            <button class="meta-copy" type="button" @click="copy(source)">复制</button>
          </div>
          <pre class="dialog-code">{{ source }}</pre>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn" @click="close">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  source: string
  confirmText: string
  loading?: boolean
  roomId: string
  eventId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

/**
 * 关闭弹窗。
 * 输入：无。
 * 输出：void。
 * 逻辑：触发 close 事件交由外层销毁。
 */
function close() {
  emit('close')
}

/**
 * 复制指定文本到剪贴板。
 * 输入：value（string）。
 * 输出：Promise<void>。
 * 逻辑：调用 Clipboard API，失败时静默处理。
 */
async function copy(value: string) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    } catch {
      // ignore
    }
  }
}
</script>

<style scoped>

.dialog-mask {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--bg-color) 88%, transparent);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.dialog {
  width: min(780px, 92vw);
  max-height: 86vh;
  background: var(--panel-bg, #161a22);
  border: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 20px 48px color-mix(in srgb, var(--bg-color) 72%, transparent);
  display: flex;
  flex-direction: column;
}

.dialog-header {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.dialog-title {
  color: var(--text-color);
  font-size: var(--font-md);
  font-weight: 600;
}

.dialog-body {
  padding: var(--space-md) var(--space-lg);
  overflow: auto;
  flex: 1;
}

.dialog-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: var(--space-md);
}

.meta-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--glass-bg) 75%, transparent);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.meta-label {
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.meta-value {
  color: var(--text-color);
  font-size: var(--font-xs);
  word-break: break-all;
}

.meta-copy {
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: color-mix(in srgb, var(--glass-bg) 70%, transparent);
  color: var(--text-color);
  cursor: pointer;
}

.meta-copy:hover,
.meta-copy:focus-visible {
  border-color: color-mix(in srgb, var(--primary-color) 28%, transparent);
  background: color-mix(in srgb, var(--primary-color) 16%, var(--glass-bg));
  outline: none;
}

.dialog-loading {
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.dialog-code-block {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
  background: var(--panel-bg, #161a22);
  overflow: hidden;
}

.code-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--panel-bg, #161a22);
}

.code-label {
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.dialog-code {
  color: var(--text-color);
  font-size: var(--font-xs);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  padding: var(--space-md);
  margin: 0;
  background: var(--panel-bg, #161a22);
}

.dialog-footer {
  padding: 0 var(--space-lg) var(--space-lg) var(--space-lg);
  display: flex;
  justify-content: flex-end;
}
</style>
