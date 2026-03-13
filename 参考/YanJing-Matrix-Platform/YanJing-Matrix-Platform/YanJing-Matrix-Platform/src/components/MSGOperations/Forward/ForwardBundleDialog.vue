<template>
  <div class="dialog-mask yj-dialog-mask" @click.self="close">
    <div class="dialog yj-dialog-content">
      <div class="dialog-header">
        <div class="dialog-title">转发消息合集</div>
      </div>

      <div class="dialog-body">
        <div class="bundle-list">
          <MessageItem v-for="item in renderItems" :key="item.id" :message="item" :is-self="false"
            :is-first-in-group="true" :is-continued-in-group="false" :hide-operations="true" />
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn" @click="close">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MatrixMessageItem, MatrixMessageType } from '@/types/message'
import MessageItem from '@/components/Room/MessageItem'

const props = defineProps<{
  bundle: {
    sourceRoomId: string
    sourceEventIds: string[]
    items: Array<{
      type: MatrixMessageType
      senderName?: string
      senderId?: string
      content: string
      fileName?: string
      url?: string
      replyToEventId?: string
      forwardBundle?: MatrixMessageItem['forwardBundle']
    }>
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const renderItems = computed<MatrixMessageItem[]>(() => {
  const now = Date.now()
  return props.bundle.items.map((item, idx) => ({
    id: `forward-bundle-${idx}`,
    roomId: props.bundle.sourceRoomId,
    senderId: item.senderId || 'unknown',
    senderName: item.senderName,
    timestamp: now + idx,
    timeText: '',
    content: item.content || '',
    type: item.type,
    fileName: item.fileName,
    url: item.url,
    replyToEventId: item.replyToEventId,
    forwardBundle: item.forwardBundle,
  }))
})

function close() {
  emit('close')
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
  width: min(560px, 92vw);
  max-height: 80vh;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bundle-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bundle-list :deep(.bubble),
.bundle-list :deep(.forward-bundle),
.bundle-list :deep(.reply-preview) {
  max-width: 100%;
}

.bundle-list :deep(.forward-bundle) {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.bundle-list :deep(.bubble) {
  width: auto;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.bundle-list :deep(.forward-line) {
  max-width: 100%;
}

.dialog-footer {
  padding: 0 var(--space-lg) var(--space-lg) var(--space-lg);
  display: flex;
  justify-content: flex-end;
}
</style>