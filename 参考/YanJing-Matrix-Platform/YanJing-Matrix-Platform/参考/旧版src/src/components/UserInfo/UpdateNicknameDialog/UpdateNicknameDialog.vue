<template>
  <div class="dialog-mask" @click.self="handleClose">
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="dialog-title">修改昵称</div>
      </div>

      <div class="dialog-body">
        <div class="field">
          <div class="field-label">昵称</div>
          <input v-model="nickname" class="field-input" type="text" placeholder="请输入昵称" />
        </div>

        <div v-if="errorText" class="error-text">{{ errorText }}</div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" :disabled="submitting" @click="handleClose">取消</button>
        <button class="btn btn-primary" :disabled="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { userdetail } from '@/services/SSO/UserInfo'

const props = defineProps<{
  initialNickname: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', nickname: string): void
}>()

const nickname = ref(props.initialNickname)
const submitting = ref(false)
const errorText = ref('')

function handleClose() {
  if (submitting.value) return
  emit('close')
}

async function handleSubmit() {
  const nextNickname = nickname.value.trim()

  if (!nextNickname) {
    errorText.value = '昵称不能为空'
    return
  }

  submitting.value = true
  errorText.value = ''

  try {
    const res = await userdetail(nextNickname)
    if (!res.ok) {
      errorText.value = '更新失败，请稍后重试'
      return
    }

    // userdetail 内部已同步 wechatStore.userProfile
    // 这里再 emit 一次，方便调用方按需刷新 UI
    emit('updated', nextNickname)
  } catch (e) {
    console.error('[UserInfo] 更新昵称异常:', e)
    errorText.value = '更新失败，请稍后重试'
  } finally {
    submitting.value = false
  }
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
  z-index: 9999;
}

.dialog-container {
  width: min(520px, 92vw);
  background: var(--bg-color-third);
  border-radius: 12px;
  box-shadow: 0 10px 30px var(--shadow-color, #00000033);
  overflow: hidden;
}

.dialog-header {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
}

.dialog-title {
  color: var(--text-color);
  font-size: 18px;
  font-weight: 700;
}

.dialog-body {
  padding: 16px 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  color: var(--text-color-secondary);
  font-size: 13px;
}

.field-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  background: var(--bg-color-tertiary);
  color: var(--text-color);
  outline: none;
}

.error-text {
  margin-top: 10px;
  color: var(--color-error);
  font-size: 13px;
}

.dialog-footer {
  padding: 14px 18px 18px 18px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-color-tertiary);
  color: var(--text-color);
}

.btn-primary {
  background: var(--color-primary, var(--color-success));
  color: var(--text-color);
}
</style>
