<template>
  <div class="dialog-mask" @click.self="close">
    <div class="dialog">
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
const props = defineProps<{
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.dialog {
  width: min(520px, 92vw);
  background: var(--bg-color-third);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: 0 10px 30px var(--shadow-color, #00000033);
}

.dialog-header {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-color-light);
}

.dialog-title {
  color: var(--text-color);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.dialog-body {
  padding: 16px 18px;
}

.dialog-message {
  color: var(--text-color);
  font-size: var(--font-size-base);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.dialog-footer {
  padding: 0 18px 18px 18px;
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 8px 14px;
  border-radius: var(--border-radius-md);
  border: none;
  background: var(--bg-color-fifth);
  color: var(--text-color);
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn:hover {
  background: var(--bg-color-hover);
}
</style>
