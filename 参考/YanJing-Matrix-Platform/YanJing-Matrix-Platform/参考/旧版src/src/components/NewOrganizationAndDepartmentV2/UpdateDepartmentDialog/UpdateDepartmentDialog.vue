<template>
  <div class="dialog-overlay" @click="closeDialog">
    <div class="dialog" @click.stop>
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
import { UpdateDepartmentV2 } from '@/services/Project/OrganizationV2/department'

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
  } catch (error: any) {
    const errorMessage = error.message || '更新部门时发生未知错误'
    result.value = {
      success: false,
      error: errorMessage,
    }
    console.error('[UpdateDepartmentDialog]  部门更新失败:', error)
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
  background: var(--bg-color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
}

.dialog {
  background: var(--bg-color-third);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg) var(--space-lg);
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-duration-fast) var(--transition-timing);
}

.close-btn:hover {
  background: var(--bg-color-hover);
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
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
}

.form-section input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-color);
  font-size: var(--font-size-base);
  transition: all var(--transition-duration-fast) var(--transition-timing);
  box-sizing: border-box;
}

.form-section textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-color);
  font-size: var(--font-size-base);
  transition: all var(--transition-duration-fast) var(--transition-timing);
  box-sizing: border-box;
  resize: vertical;
  min-height: 84px;
}

.form-section input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--bg-color-secondary);
}

.form-section textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--bg-color-secondary);
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
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-top: var(--space-xs);
}

.dialog-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
}

.cancel-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-color-fifth);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-duration-fast) var(--transition-timing);
}

.cancel-btn:hover:not(:disabled) {
  background: var(--bg-color-fifth);
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.create-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-color-fifth);
  color: var(--text-color);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-duration-fast) var(--transition-timing);
}

.create-btn:hover:not(:disabled) {
  background: var(--bg-color-fifth);
}

.create-btn:active:not(:disabled) {
  background: var(--bg-color-fifth);
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-section {
  padding: var(--space-lg);
  border-top: 1px solid var(--border-color);
  background: var(--bg-color-tertiary);
}

.success-message .success {
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-xs);
}

.error-message .error {
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-xs);
}

.result-detail {
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-md);
}

.reset-btn {
  padding: var(--space-xs) var(--space-md);
  background: var(--color-primary);
  color: var(--text-color-inverse);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-duration-fast) var(--transition-timing);
}

.reset-btn:hover {
  background: var(--color-primary-hover);
}

@media (max-width: 480px) {
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
