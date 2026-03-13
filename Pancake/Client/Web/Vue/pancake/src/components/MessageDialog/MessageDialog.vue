<template>
  <div class="dialog-mask yj-dialog-mask" @click.self="close">
    <div class="dialog yj-dialog-content">
      <div class="dialog-header">
        <div class="dialog-title">{{ title }}</div>
      </div>

      <div class="dialog-body">
        <div class="dialog-message">{{ message }}</div>
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
  message: string
  confirmText: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

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
  width: min(520px, 92vw);
  background: var(--panel-bg);
  border: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 20px 48px color-mix(in srgb, var(--bg-color) 72%, transparent);
}

.dialog-header {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.dialog-title {
  color: var(--text-color);
  font-size: var(--font-md);
  font-weight: 600;
}

.dialog-body {
  padding: var(--space-md) var(--space-lg);
}

.dialog-message {
  color: var(--text-color);
  font-size: var(--font-sm);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.dialog-footer {
  padding: 0 var(--space-lg) var(--space-lg) var(--space-lg);
  display: flex;
  justify-content: flex-end;
}
</style>
