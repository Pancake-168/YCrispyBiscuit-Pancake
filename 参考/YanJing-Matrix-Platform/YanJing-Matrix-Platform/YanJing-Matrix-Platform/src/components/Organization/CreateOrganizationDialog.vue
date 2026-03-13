<template>
    <Teleport to="body">
        <Transition name="dialog-fade">
            <div v-if="modelValue" class="create-organization-dialog-overlay yj-dialog-mask" @click="handleOverlayClick">
                <div class="create-organization-dialog-content yj-dialog-content" @click.stop>
                    <!-- 弹窗头部 -->
                    <div class="dialog-header">
                        <h3 class="dialog-title">新建或加入企业/团队</h3>
                        <button type="button" class="dialog-close-btn" @click="handleClose" aria-label="关闭弹窗">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5"
                                    stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                    </div>

                    <!-- 弹窗主体 -->
                    <div class="dialog-body">
                        <form @submit.prevent="handleSubmit" class="organization-form">
                            <!-- 操作类型选择 -->
                            <div class="form-group">
                                <label class="form-label">
                                    操作类型 <span class="required">*</span>
                                </label>
                                <div class="radio-group">
                                    <label class="radio-option">
                                        <input type="radio" value="create" v-model="formData.operationType"
                                            :disabled="isSubmitting" />
                                        <span class="radio-label">新建组织</span>
                                    </label>
                                    <label class="radio-option">
                                        <input type="radio" value="join" v-model="formData.operationType"
                                            :disabled="isSubmitting" />
                                        <span class="radio-label">加入组织</span>
                                    </label>
                                </div>
                            </div>

                            <!-- 新建组织表单 -->
                            <template v-if="formData.operationType === 'create'">
                                <!-- 显示名称 -->
                                <div class="form-group">
                                    <label for="displayName" class="form-label">
                                        组织名称 <span class="required">*</span>
                                    </label>
                                    <input id="displayName" v-model="formData.displayName" type="text"
                                        class="form-input" placeholder="请输入组织名称" required :disabled="isSubmitting" />
                                </div>



                            </template>


                        </form>
                    </div>

                    <!-- 弹窗底部 -->
                    <div class="dialog-footer">
                        <button type="button" class="btn btn-secondary" @click="handleClose" :disabled="isSubmitting">
                            取消
                        </button>
                        <button type="button" class="btn btn-primary" @click="handleSubmit"
                            :disabled="isSubmitting || !isFormValid">
                            <span v-if="isSubmitting" class="loading-spinner"></span>
                            {{ isSubmitting ? (formData.operationType === 'create' ? '创建中...' : '加入中...') :
                                (formData.operationType === 'create' ? '创建' : '加入') }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { CreateOrganizationApplicationMarket } from '@/services/Project/Organization/Application'
import { openMessageDialog } from '@/components/MessageDialog/open';
// Props
const props = defineProps<{
    modelValue: boolean
}>()

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'submit-success': [data: unknown]
    'submit-error': [error: unknown]
}>()

// 响应式数据
const isSubmitting = ref(false)
const formData = ref({
    operationType: 'create', // 默认选择新建
    displayName: '',
    organizationId: ''
})

// 计算属性
const isFormValid = computed(() => {
    if (formData.value.operationType === 'create') {
        return formData.value.displayName.trim()
    } else if (formData.value.operationType === 'join') {
        return formData.value.organizationId.trim()
    }
    return false
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
        operationType: 'create',
        displayName: '',
        organizationId: ''
    }
}

const handleSubmit = async () => {
    if (isSubmitting.value || !isFormValid.value) return

    isSubmitting.value = true

    try {
        if (formData.value.operationType === 'create') {
            console.log('[System:CreateOrganizationDialog:handleSubmit] 开始创建组织应用:', formData.value)

            const result = await CreateOrganizationApplicationMarket(formData.value.displayName.trim())

            if (result && result.ok) {
                console.log('[System:CreateOrganizationDialog:handleSubmit] 组织应用创建成功:', result.data)
                emit('submit-success', result.data)
                resetForm()
                handleClose()
            } else {
                const errorData = result?.data || { message: '未知错误' }
                console.warn('[System:CreateOrganizationDialog:handleSubmit] 组织应用创建失败:', errorData)
                emit('submit-error', errorData)
                openMessageDialog(`创建失败: ${errorData?.message || '未知错误'}`)
            }
        } else if (formData.value.operationType === 'join') {
            console.log('[System:CreateOrganizationDialog:handleSubmit] 开始加入组织:', formData.value.organizationId)



            // 暂时显示开发中提示
            openMessageDialog('加入组织功能正在开发中，请稍后使用')
   
            isSubmitting.value = false
            return
        }
    } catch (error) {
        console.warn('[System:CreateOrganizationDialog:handleSubmit] 操作异常:', error)
        emit('submit-error', error)
        openMessageDialog(`操作过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
        isSubmitting.value = false
    }
}

// 监听弹窗显示状态
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        // 弹窗打开时重置表单并聚焦第一个输入框
        nextTick(() => {
            resetForm()
            const firstInput = document.getElementById(
                formData.value.operationType === 'create' ? 'displayName' : 'organizationId'
            ) as HTMLInputElement
            firstInput?.focus()
        })
    }
})
</script>

<style scoped lang="scss">
.create-organization-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: color-mix(in srgb, var(--bg-color) 88%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 16px;
}

.create-organization-dialog-content {
    background: var(--panel-bg);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: var(--glass-shadow);
    display: flex;
    flex-direction: column;
}

// 弹窗头部
.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);

    .dialog-title {
        margin: 0;
        font-size: var(--font-md);
        font-weight: 600;
        color: var(--text-color);
    }

    .dialog-close-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            background: var(--panel-bg);
            color: var(--text-color);
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

    .organization-form {
        .form-group {
            margin-bottom: 20px;

            &:last-child {
                margin-bottom: 0;
            }
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            font-size: var(--font-sm);
            font-weight: 500;
            color: var(--text-color);

            .required {
                color: var(--danger-color);
            }
        }

        .form-input,
        .form-textarea {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
            border-radius: var(--radius-md);
            background: var(--panel-bg);
            color: var(--text-color);
            font-size: var(--font-sm);
            transition: all 0.2s ease;
            box-sizing: border-box;

            &:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 16%, transparent);
            }

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                background: var(--input-bg);
            }

            &::placeholder {
                color: var(--text-muted);
            }
        }

        .form-textarea {
            resize: vertical;
            min-height: 80px;
            font-family: inherit;
        }

        .radio-group {
            display: flex;
            gap: 24px;
            margin-top: 8px;

            .radio-option {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;

                input[type="radio"] {
                    margin: 0;
                    width: 16px;
                    height: 16px;
                    accent-color: var(--primary-color);
                }

                .radio-label {
                    font-size: var(--font-sm);
                    color: var(--text-color);
                    user-select: none;
                }

                &:hover .radio-label {
                    color: var(--primary-color);
                }
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
    border-top: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    background: var(--panel-bg);

    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: var(--font-sm);
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
            background: var(--panel-bg);
            color: var(--text-color);

            &:hover:not(:disabled) {
                background: var(--hover-bg);
            }
        }

        &.btn-primary {
            background: var(--primary-color);
            color: var(--btn-text);

            &:hover:not(:disabled) {
                background: var(--primary-hover);
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

.dialog-fade-enter-active .create-organization-dialog-content,
.dialog-fade-leave-active .create-organization-dialog-content {
    transition: transform 0.3s ease;
}

.dialog-fade-enter-from .create-organization-dialog-content,
.dialog-fade-leave-to .create-organization-dialog-content {
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
@media (max-width: 768px) {
    .create-organization-dialog-overlay {
        padding: 8px;
    }

    .create-organization-dialog-content {
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
