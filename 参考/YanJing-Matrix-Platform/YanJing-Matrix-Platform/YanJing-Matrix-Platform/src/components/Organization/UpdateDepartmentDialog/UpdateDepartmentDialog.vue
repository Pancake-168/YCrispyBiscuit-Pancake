<template>
  <div class="dialog-overlay yj-dialog-mask" @click="closeDialog">
    <div class="dialog yj-dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>更新部门</h3>
        <button class="close-btn" @click="closeDialog">×</button>
      </div>

      <div class="dialog-body">
        <div class="form-section">
          <label>部门名称</label>
          <input v-model="departmentName" placeholder="部门名称" @keyup.enter="updateDepartment" :disabled="updating" />
          <div v-if="nameError" class="error-text">{{ nameError }}</div>
        </div>

        <div class="form-section">
          <label>部门描述</label>
          <textarea v-model="departmentDescription" placeholder="部门描述（可选）" :disabled="updating" rows="3" />
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="closeDialog" class="cancel-btn" :disabled="updating">取消</button>
        <button @click="updateDepartment" :disabled="!departmentName.trim() || updating" class="create-btn">
          {{ updating ? '更新中...' : '更新部门' }}
        </button>
      </div>

      <div v-if="result" class="result-section">
        <div v-if="result.success" class="success-message">
          <p class="success"> 部门更新成功！</p>
          <p class="result-detail">部门"{{ result.departmentName }}"已更新</p>
        </div>
        <div v-else class="error-message">
          <p class="error"> 部门更新失败</p>
          <p class="result-detail">{{ result.error }}</p>
        </div>
        <button @click="resetResult" class="reset-btn">{{ result.success ? '继续更新' : '重试' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UpdateDepartmentV2 } from '@/services/Project/Organization/department'

interface Props {
  appid: string
  departmentId: string
  initialName?: string
  initialDescription?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  updated: [payload: { name: string; description: string }]
}>()

const departmentName = ref(props.initialName || '')
const departmentDescription = ref(props.initialDescription || '')
const updating = ref(false)
const nameError = ref('')
const result = ref<
  | {
    success: boolean
    departmentName?: string
    error?: string
  }
  | null
>(null)

const closeDialog = () => {
  emit('close')
}

const validateName = () => {
  const name = departmentName.value.trim()
  if (!name) {
    nameError.value = '部门名称不能为空'
    return false
  }
  nameError.value = ''
  return true
}

const updateDepartment = async () => {
  if (!validateName() || updating.value) return

  updating.value = true
  try {
    const res = await UpdateDepartmentV2(
      props.appid,
      Number(props.departmentId),
      departmentName.value.trim(),
      departmentDescription.value.trim()
    )

    if (!res.ok) {
      const msg = (res.data && (res.data.message || res.data.error)) || '更新部门失败'
      throw new Error(msg)
    }

    result.value = {
      success: true,
      departmentName: departmentName.value.trim(),
    }

    emit('updated', {
      name: departmentName.value.trim(),
      description: departmentDescription.value.trim(),
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '更新部门时发生未知错误'
    result.value = {
      success: false,
      error: errorMessage,
    }
    console.warn('[System:UpdateDepartmentDialog:updateDepartment]  部门更新失败:', error)
  } finally {
    updating.value = false
  }
}

const resetResult = () => {
  result.value = null
  updating.value = false
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: color-mix(in srgb, var(--bg-color) 88%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
}

.dialog {
  background: var(--panel-bg);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  box-shadow: var(--glass-shadow);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg) var(--space-lg);
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
}

.dialog-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: var(--font-sm);
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--font-lg);
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-color);
}

.dialog-body {
  flex: 1;
  padding: var(--space-lg);
  overflow-y: auto;
}

.form-section {
  margin-bottom: var(--space-lg);
}

.form-section label {
  display: block;
  margin-bottom: var(--space-xs);
  color: var(--text-color);
  font-weight: 500;
  font-size: var(--font-sm);
}

.form-section input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--panel-bg);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  border-radius: var(--radius-sm);
  color: var(--text-color);
  font-size: var(--font-sm);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-section textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--panel-bg);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  border-radius: var(--radius-sm);
  color: var(--text-color);
  font-size: var(--font-sm);
  transition: all 0.2s ease;
  box-sizing: border-box;
  resize: vertical;
  min-height: 84px;
}

.form-section input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: var(--panel-bg);
}

.form-section textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  background: var(--panel-bg);
}

.form-section input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-section textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-text {
  color: var(--danger-color);
  font-size: var(--font-xs);
  margin-top: var(--space-xs);
}

.dialog-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  justify-content: flex-end;
}

.cancel-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--panel-bg);
  color: var(--text-color);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-sm);
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: var(--panel-bg);
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.create-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--panel-bg);
  color: var(--text-color);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-sm);
  font-weight: 500;
  transition: all 0.2s ease;
}

.create-btn:hover:not(:disabled) {
  background: var(--panel-bg);
}

.create-btn:active:not(:disabled) {
  background: var(--panel-bg);
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-section {
  padding: var(--space-lg);
  border-top: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--panel-bg);
}

.success-message .success {
  color: var(--info-color);
  font-weight: 500;
  margin-bottom: var(--space-xs);
}

.error-message .error {
  color: var(--danger-color);
  font-weight: 500;
  margin-bottom: var(--space-xs);
}

.result-detail {
  color: var(--text-muted);
  font-size: var(--font-xs);
  margin-bottom: var(--space-md);
}

.reset-btn {
  padding: var(--space-xs) var(--space-md);
  background: var(--primary-color);
  color: var(--btn-text);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-xs);
  font-weight: 500;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: var(--primary-hover);
}

@media (max-width: 768px) {
  .dialog {
    max-width: 100%;
    margin: var(--space-md);
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding: var(--space-md);
  }
}
</style>
