<template>
  <div class="dialog-mask yj-dialog-mask" @click.self="emit('close')">
    <div class="dialog create-bot-dialog yj-dialog-content" @click.stop>
      <div class="dialog-header">
        <div class="dialog-title">创建 Bot</div>
        <button class="btn btn-ghost close-btn" @click="emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div class="section">
          <label class="label">子应用</label>
          <select class="input" v-model="selectedApp">
            <option value="">请选择子应用</option>
            <option v-for="app in applications" :key="appKey(app)" :value="appName(app)">
              {{ appLabel(app) }}
            </option>
          </select>
        </div>

        <div class="section">
          <label class="label">Token</label>
          <input class="input" v-model="token" placeholder="请输入 Token" />
        </div>

        <div class="section">
          <label class="label">Bot 昵称</label>
          <input class="input" v-model="nickname" placeholder="请输入昵称" />
        </div>

        <div v-if="errorText" class="error-text">{{ errorText }}</div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-ghost" @click="emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSubmit">确认创建</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  applications: Array<any>
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { appName: string; nickname: string; token: string }): void
  (e: 'close'): void
}>()

const selectedApp = ref('')
const token = ref('')
const nickname = ref('')
const errorText = ref('')

const appName = (app: any) => app?.name ?? ''
const appLabel = (app: any) => app?.displayName || app?.name || '未命名应用'
const appKey = (app: any) => app?.id ?? app?.name ?? Math.random()

watch(
  () => props.applications,
  (apps) => {
    if (!selectedApp.value && apps?.length) {
      selectedApp.value = appName(apps[0])
    }
  },
  { immediate: true },
)

const handleSubmit = () => {
  errorText.value = ''
  if (!selectedApp.value) {
    errorText.value = '请选择子应用'
    return
  }
  if (!token.value.trim()) {
    errorText.value = '请输入 Token'
    return
  }
  if (!nickname.value.trim()) {
    errorText.value = '请输入昵称'
    return
  }
  emit('submit', {
    appName: selectedApp.value,
    nickname: nickname.value.trim(),
    token: token.value.trim(),
  })
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
  z-index: 1010;
}

.dialog {
  width: min(520px, 92vw);
  max-height: 80vh;
  background: var(--panel-bg);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  border-radius: var(--radius-md);
  box-shadow: 0 20px 48px color-mix(in srgb, var(--bg-color) 72%, transparent);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header,
.dialog-footer {
  padding: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.dialog-title {
  font-size: var(--font-base);
  font-weight: 600;
}

.dialog-body {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.label {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.error-text {
  color: #ff7b7b;
  font-size: var(--font-sm);
}
</style>
