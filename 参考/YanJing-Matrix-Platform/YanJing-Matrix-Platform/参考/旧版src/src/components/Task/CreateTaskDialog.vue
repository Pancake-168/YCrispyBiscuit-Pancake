<template>
    <Teleport to="body">
        <Transition name="dialog-fade">
            <div v-if="modelValue" class="create-task-dialog-overlay" @click="handleOverlayClick">
                <div class="create-task-dialog-content" @click.stop>
                    <!-- 弹窗头部 -->
                    <div class="dialog-header">
                        <h3 class="dialog-title">新建任务</h3>
                        <button type="button" class="dialog-close-btn" @click="handleClose" aria-label="关闭弹窗">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5"
                                    stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                    </div>

                    <!-- 弹窗主体 -->
                    <div class="dialog-body">
                        <form @submit.prevent="handleSubmit" class="task-form">
                            <!-- 任务名称 -->
                            <div class="form-group">
                                <label for="taskName" class="form-label">
                                    任务名称
                                </label>
                                <input 
                                    id="taskName" 
                                    v-model="formData.taskName" 
                                    type="text"
                                    class="form-input" 
                                    placeholder="请输入任务名称"
                                    :disabled="isSubmitting"
                                    @keyup.enter="handleSubmit"
                                />
                            </div>
                        </form>
                    </div>

                    <!-- 弹窗底部 -->
                    <div class="dialog-footer">
                        <button type="button" class="btn btn-secondary" @click="handleClose" :disabled="isSubmitting">
                            取消
                        </button>
                        <button type="button" class="btn btn-primary" @click="handleSubmit"
                            :disabled="isSubmitting">
                            <span v-if="isSubmitting" class="loading-spinner"></span>
                            {{ isSubmitting ? '创建中...' : '创建' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { CreateNewTask } from '../../services/Project/Task/task'
import { openMessageDialog } from '@/components/MessageDialog/open';
// Props
const props = defineProps<{
    modelValue: boolean
}>()

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'submit-success': [data: any]
    'submit-error': [error: any]
}>()

// 响应式数据
const isSubmitting = ref(false)
const formData = ref({
    taskName: ''
})



// 方法
const handleClose = () => {
    if (isSubmitting.value) return
    emit('update:modelValue', false)
}

const handleOverlayClick = (event: Event) => {
    if (event.target === event.currentTarget) {
        handleClose()
    }
}

const resetForm = () => {
    formData.value = {
        taskName: ''
    }
}

const handleSubmit = async () => {
    if (isSubmitting.value) return

    isSubmitting.value = true

    try {
        console.log(' 开始创建任务:', formData.value.taskName)

        const result = await CreateNewTask(formData.value.taskName.trim())

        console.log(' 任务创建成功:', result)
        emit('submit-success', result)
        resetForm()
        handleClose()
    } catch (error) {
        console.error(' 创建任务失败:', error)
        emit('submit-error', error)
        openMessageDialog(`创建任务失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
        isSubmitting.value = false
    }
}

// 监听弹窗显示状态
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        // 弹窗打开时重置表单并聚焦输入框
        nextTick(() => {
            resetForm()
            const taskNameInput = document.getElementById('taskName') as HTMLInputElement
            taskNameInput?.focus()
        })
    }
})
</script>

<style scoped lang="scss">
.create-task-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 16px;
}

.create-task-dialog-content {
    background: var(--bg-color-tertiary, #ffffff);
    border-radius: 12px;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
}

// 弹窗头部
.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color, #e5e7eb);

    .dialog-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color, #1f2937);
    }

    .dialog-close-btn {
        background: none;
        border: none;
        color: var(--text-color-secondary, #6b7280);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            background: var(--bg-color-secondary, #f3f4f6);
            color: var(--text-color, #1f2937);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
}

// 弹窗主体
.dialog-body {
    padding: 24px;
    flex: 1;
    overflow-y: auto;

    .task-form {
        .form-group {
            margin-bottom: 20px;

            &:last-child {
                margin-bottom: 0;
            }
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-color, #1f2937);

            .required {
                color: #ef4444;
            }
        }

        .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid var(--border-color, #d1d5db);
            border-radius: 8px;
            background: var(--bg-color-secondary, #ffffff);
            color: var(--text-color, #1f2937);
            font-size: 14px;
            transition: all 0.2s ease;
            box-sizing: border-box;

            &:focus {
                outline: none;
                border-color: var(--color-primary, #3b82f6);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                background: var(--bg-color-disabled, #f9fafb);
            }

            &::placeholder {
                color: var(--text-color-secondary, #9ca3af);
            }
        }
    }
}

// 弹窗底部
.dialog-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid var(--border-color, #e5e7eb);
    background: var(--bg-color-tertiary, #ffffff);

    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        &.btn-secondary {
            background: var(--bg-color-secondary, #f3f4f6);
            color: var(--text-color, #374151);

            &:hover:not(:disabled) {
                background: var(--bg-color-hover, #e5e7eb);
            }
        }

        &.btn-primary {
            background: var(--color-primary, #3b82f6);
            color: white;

            &:hover:not(:disabled) {
                background: var(--color-primary-hover, #2563eb);
            }
        }
    }

    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
}

// 过渡动画
.dialog-fade-enter-active,
.dialog-fade-leave-active {
    transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
    opacity: 0;
}

.dialog-fade-enter-active .create-task-dialog-content,
.dialog-fade-leave-active .create-task-dialog-content {
    transition: transform 0.3s ease;
}

.dialog-fade-enter-from .create-task-dialog-content,
.dialog-fade-leave-to .create-task-dialog-content {
    transform: scale(0.9) translateY(-20px);
}

// 旋转动画
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

// 响应式设计
@media (max-width: 640px) {
    .create-task-dialog-overlay {
        padding: 8px;
    }

    .create-task-dialog-content {
        max-width: 100%;
        max-height: 95vh;
    }

    .dialog-header,
    .dialog-body,
    .dialog-footer {
        padding-left: 16px;
        padding-right: 16px;
    }

    .dialog-header {
        padding-top: 16px;
        padding-bottom: 16px;
    }

    .dialog-footer {
        padding-top: 16px;
        padding-bottom: 16px;
        flex-direction: column-reverse;

        .btn {
            width: 100%;
            justify-content: center;
        }
    }
}
</style>
