<template>
  <div class="dialog-overlay yj-dialog-mask" @click="closeDialog">
    <div class="dialog yj-dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>创建职位</h3>
        <button class="close-btn" @click="closeDialog">×</button>
      </div>

      <div class="dialog-body">
        <div class="form-section">
          <label>职位名称</label>
          <input v-model="postName" placeholder="职位名称" @keyup.enter="createPost" :disabled="creating" />
          <div v-if="nameError" class="error-text">{{ nameError }}</div>
        </div>

        <div class="form-section">
          <label>职位描述</label>
          <textarea v-model="postDescription" placeholder="职位描述（可选）" :disabled="creating" rows="3" />
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="closeDialog" class="cancel-btn" :disabled="creating">取消</button>
        <button @click="createPost" :disabled="!postName.trim() || creating" class="create-btn">
          {{ creating ? '创建中...' : '创建职位' }}
        </button>
      </div>

      <!-- 创建结果 -->
      <div v-if="result" class="result-section">
        <div v-if="result.success" class="success-message">
          <p class="success"> 职位创建成功！</p>
          <p class="result-detail">职位"{{ result.postName }}"已创建</p>
        </div>
        <div v-else class="error-message">
          <p class="error"> 职位创建失败</p>
          <p class="result-detail">{{ result.error }}</p>
        </div>
        <button @click="resetDialog" class="reset-btn">{{ result.success ? '继续创建' : '重试' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { CreateOrganizationPostV2 } from '@/services/Project/Organization/Post'

interface Props {
  parentDepartmentId?: number
  appid: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  created: [postName: string]
}>()

// 响应式数据
const postName = ref('')
const postDescription = ref('')
const creating = ref(false)
const nameError = ref('')
const result = ref<{
  success: boolean
  postName?: string
  error?: string
} | null>(null)

// 方法
const closeDialog = () => {
  emit('close')
}

const validateName = () => {
  const name = postName.value.trim()
  if (!name) {
    nameError.value = '职位名称不能为空'
    return false
  }
  nameError.value = ''
  return true
}

const createPost = async () => {
  if (!validateName() || creating.value) return

  console.log('[System:CreatePostDialog:createPost] 开始创建职位', {
    parentId: props.parentDepartmentId || 0,
    name: postName.value.trim(),
    description: postDescription.value.trim()
  })

  creating.value = true

  try {
    const res = await CreateOrganizationPostV2(
      props.appid,
      postName.value.trim(),
      postDescription.value.trim(),
      props.parentDepartmentId || 0
    )

    if (!res.ok) {
      const msg = (res.data && (res.data.message || res.data.error)) || '创建职位失败'
      throw new Error(msg)
    }

    result.value = {
      success: true,
      postName: postName.value.trim()
    }

    console.log('[System:CreatePostDialog:createPost]  职位创建成功')
    emit('created', postName.value.trim())

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '创建职位时发生未知错误'
    result.value = {
      success: false,
      error: errorMessage
    }
    console.error('[System:CreatePostDialog:createPost]  职位创建失败:', error)
  } finally {
    creating.value = false
  }
}

const resetDialog = () => {
  postName.value = ''
  postDescription.value = ''
  nameError.value = ''
  result.value = null
  creating.value = false
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

/* 响应式设计 */
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
