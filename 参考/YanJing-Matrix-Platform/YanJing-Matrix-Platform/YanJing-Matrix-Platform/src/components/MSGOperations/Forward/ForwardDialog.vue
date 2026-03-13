<template>
  <div class="dialog-mask yj-dialog-mask" @click.self="close(false)">
    <div class="dialog yj-dialog-content">
      <div class="dialog-header">
        <div class="dialog-title">转发到</div>
        <label class="mode-toggle">
          <input type="checkbox" v-model="singleMode" />
          <span>单选模式</span>
        </label>
      </div>

      <div class="dialog-body">
        <div class="room-list">
          <label v-for="room in rooms" :key="room.id" class="room-item">
            <input
              v-if="singleMode"
              type="radio"
              name="forward-room"
              :value="room.id"
              v-model="singleSelected"
            />
            <input
              v-else
              type="checkbox"
              :value="room.id"
              v-model="multiSelected"
            />
            <span class="room-name">{{ room.name }}</span>
          </label>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn" @click="close(false)">取消</button>
        <button class="btn btn-primary" :disabled="selectedIds.length === 0" @click="close(true)">转发</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type RoomOption = { id: string; name: string }

defineProps<{
  rooms: RoomOption[]
}>()

const emit = defineEmits<{
  (e: 'close', confirmed: boolean, roomIds: string[]): void
}>()

const singleMode = ref(false)
const singleSelected = ref<string>('')
const multiSelected = ref<string[]>([])

watch(singleMode, (mode) => {
  if (mode) {
    multiSelected.value = []
  } else {
    singleSelected.value = ''
  }
})

const selectedIds = computed(() => {
  return singleMode.value ? (singleSelected.value ? [singleSelected.value] : []) : multiSelected.value
})

function close(confirmed: boolean) {
  emit('close', confirmed, selectedIds.value)
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dialog-title {
  color: var(--text-color);
  font-size: var(--font-md);
  font-weight: 600;
}

.mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.dialog-body {
  padding: var(--space-md) var(--space-lg);
  overflow: auto;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--glass-bg) 80%, transparent);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-color);
}

.room-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-footer {
  padding: 0 var(--space-lg) var(--space-lg) var(--space-lg);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>