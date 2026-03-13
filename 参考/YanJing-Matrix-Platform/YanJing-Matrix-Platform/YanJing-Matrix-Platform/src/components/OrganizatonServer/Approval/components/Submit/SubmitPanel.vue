<template>
    <section class="panel">
        <div class="panel-header-row">
            <h4>发起审批</h4>
        </div>

        <div class="form-grid">
            <label>审批类型</label>
            <select v-model="submitForm.typeCode" class="input">
                <option value="">请选择审批类型</option>
                <option v-for="item in approvalTypes" :key="item.code" :value="item.code">
                    {{ item.name }}（{{ item.code }}）
                </option>
            </select>

            <template v-for="field in submitTemplateFields" :key="field.id">
                <label>
                    {{ field.label || field.id }}
                    <span v-if="field.rules?.required" class="required-mark">*</span>
                </label>
                <div class="field-control">
                    <!-- 文本区域 -->
                    <textarea v-if="field.type === 'textarea'" v-model="submitFieldValues[field.id]" class="input"
                        rows="3" :placeholder="field.label || field.id" />
                    <!-- 数字输入 -->
                    <input v-else-if="field.type === 'number'" v-model="submitFieldValues[field.id]" class="input"
                        type="number" inputmode="decimal" :placeholder="field.label || field.id" />
                    <!-- 默认文本输入 -->
                    <input v-else v-model="submitFieldValues[field.id]" class="input" type="text"
                        :placeholder="field.label || field.id" />
                    <div class="field-error" v-if="submitFieldErrors[field.id]">{{ submitFieldErrors[field.id] }}</div>
                </div>
            </template>

            <div class="full-row tip" v-if="!submitTemplateFields.length">
                
            </div>
        </div>

        <div class="tip" v-if="activeTemplate?.template?.id">
            已加载模板 #{{ activeTemplate.template.id }}
        </div>

        <div class="submit-actions">
            <button class="action-btn primary" @click="handleSubmit" :disabled="loading.submit">
                {{ loading.submit ? '提交中...' : '发起审批' }}
            </button>
        </div>

        <div class="result" v-if="submitResult">
            {{ submitResult }}
        </div>
    </section>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue'
import { openMessageDialog } from '@/components/MessageDialog/open'
import { useApprovalStore } from '@/stores/approval'
import type { ApprovalUiConfigField } from '@/types/approval'
import { storeToRefs } from 'pinia'

// Props & Emit
// No props needed now

const approvalStore = useApprovalStore()
// loading is a reactive from store, use direct destructuring
const { approvalTypes, activeTemplate } = storeToRefs(approvalStore)
const { loading } = approvalStore

const submitResult = ref('')
const submitTemplateFields = ref<ApprovalUiConfigField[]>([])
const submitFieldValues = reactive<Record<string, string | number>>({})
const submitFieldErrors = reactive<Record<string, string>>({})

const submitForm = reactive({
    typeCode: '',
})

onMounted(() => {
    // 确保加载了审批类型字典
    if (!approvalStore.approvalTypes.length) {
        approvalStore.loadDictionaries()
    }
})

// 监听审批类型变化，自动加载对应模板
watch(() => submitForm.typeCode, (newVal) => {
    if (newVal) {
        loadTemplateForSubmit()
    } else {
        submitTemplateFields.value = []
        clearSubmitDynamicState()
    }
})

// Tools
function clearSubmitDynamicState() {
    Object.keys(submitFieldValues).forEach((key) => delete submitFieldValues[key])
    Object.keys(submitFieldErrors).forEach((key) => delete submitFieldErrors[key])
}

function initSubmitDynamicFields(fields: ApprovalUiConfigField[]) {
    submitTemplateFields.value = fields.filter((field) => !!field?.id)
    clearSubmitDynamicState()

    submitTemplateFields.value.forEach((field) => {
        if (field.type === 'number') {
            const min = field.rules?.min
            submitFieldValues[field.id] = typeof min === 'number' ? min : 0
            return
        }
        submitFieldValues[field.id] = ''
    })
}

async function loadTemplateForSubmit() {
    if (!submitForm.typeCode) {
        openMessageDialog('请先选择审批类型') // 简单提示，实际可使用 store.setError 或 toast
        return
    }

    const res = await approvalStore.loadActiveTemplate(submitForm.typeCode)
    if (!res.ok || !res.data) return

    const fields = res.data.template.ui_config?.fields || []
    initSubmitDynamicFields(fields)
}

function validateSubmitDynamicForm() {
    Object.keys(submitFieldErrors).forEach((key) => delete submitFieldErrors[key])
    let firstError = ''

    submitTemplateFields.value.forEach((field) => {
        const fieldName = field.label || field.id
        const rawValue = submitFieldValues[field.id]
        const required = !!field.rules?.required

        if (field.type === 'number') {
            const isEmpty = rawValue === '' || rawValue === null || rawValue === undefined
            if (required && isEmpty) {
                const msg = `字段【${fieldName}】不能为空`
                submitFieldErrors[field.id] = msg
                if (!firstError) firstError = msg
                return
            }
            if (!isEmpty) {
                const numValue = Number(rawValue)
                if (!Number.isFinite(numValue)) {
                    const msg = `字段【${fieldName}】必须是数字`
                    submitFieldErrors[field.id] = msg
                    if (!firstError) firstError = msg
                    return
                }
                if (typeof field.rules?.min === 'number' && numValue < field.rules.min) {
                    const msg = `字段【${fieldName}】不能小于 ${field.rules.min}`
                    submitFieldErrors[field.id] = msg
                    if (!firstError) firstError = msg
                    return
                }
                if (typeof field.rules?.max === 'number' && numValue > field.rules.max) {
                    const msg = `字段【${fieldName}】不能大于 ${field.rules.max}`
                    submitFieldErrors[field.id] = msg
                    if (!firstError) firstError = msg
                }
            }
            return
        }

        const textValue = String(rawValue ?? '').trim()
        if (required && !textValue) {
            const msg = `字段【${fieldName}】不能为空`
            submitFieldErrors[field.id] = msg
            if (!firstError) firstError = msg
            return
        }
        // Length checks for strings
        if (typeof field.rules?.min === 'number' && textValue.length < field.rules.min) {
            const msg = `字段【${fieldName}】长度不能小于 ${field.rules.min}`
            submitFieldErrors[field.id] = msg
            if (!firstError) firstError = msg
            return
        }
        if (typeof field.rules?.max === 'number' && textValue.length > field.rules.max) {
            const msg = `字段【${fieldName}】长度不能大于 ${field.rules.max}`
            submitFieldErrors[field.id] = msg
            if (!firstError) firstError = msg
        }
    })

    return { ok: !firstError, message: firstError }
}

function buildSubmitDataJson() {
    const data: Record<string, unknown> = {}
    submitTemplateFields.value.forEach((field) => {
        const rawValue = submitFieldValues[field.id]
        if (field.type === 'number') {
            const isEmpty = rawValue === '' || rawValue === null || rawValue === undefined
            data[field.id] = isEmpty ? null : Number(rawValue)
        } else {
            data[field.id] = String(rawValue ?? '').trim()
        }
    })
    return data
}

async function handleSubmit() {
    submitResult.value = ''
    try {
        if (!submitForm.typeCode) throw new Error('请先选择审批类型')

        let dataJson: Record<string, unknown> = {}
        if (submitTemplateFields.value.length) {
            const checkRes = validateSubmitDynamicForm()
            if (!checkRes.ok) throw new Error(checkRes.message || '表单校验失败')
            dataJson = buildSubmitDataJson()
        }

        const res = await approvalStore.submitApproval({
            typeCode: submitForm.typeCode,
            dataJson,
        })

        if (!res.ok || !res.data) return // Error handled in store (setError)

        // Success
        submitResult.value = `提交成功：实例 #${res.data.instance.id}，当前节点 #${res.data.currentNode.id}`

        // reset form values? or keep for continuous submit? 
        // keep for now as user might want to submit similar request
    } catch (e: any) {
        openMessageDialog(e.message) // fallback error alert
    }
}
</script>

<style scoped>
.panel {
    border: var(--glass-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    overflow-y: auto;
    min-height: 0;
    background: var(--glass-bg);
}

.panel-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
}

.panel-header-row h4 {
    margin: 0;
    font-size: var(--font-base);
}

.action-btn {
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    background: var(--input-bg);
    color: var(--text-color);
    border-radius: var(--radius-sm);
    padding: var(--space-xs) var(--space-md);
    cursor: pointer;
    font-size: var(--font-sm);
}

.action-btn:hover:not(:disabled) {
    background: var(--hover-bg);
}

.action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.action-btn.primary {
    background: var(--primary-color);
    color: var(--btn-text);
    border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
}

.action-btn.primary:hover:not(:disabled) {
    background: var(--primary-hover);
}

.form-grid {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: var(--space-sm) var(--space-md);
    align-items: start;
    padding: var(--space-md);
    border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--bg-color) 76%, var(--panel-bg));
}

.form-grid label {
    color: var(--text-muted);
    font-size: var(--font-sm);
    padding-top: 8px;
}

.input {
    width: 100%;
    background: var(--input-bg);
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    border-radius: var(--radius-sm);
    color: var(--text-color);
    padding: 10px 12px;
    font-size: var(--font-sm);
}

.input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 24%, transparent);
}

textarea.input {
    resize: vertical;
}

.required-mark {
    color: var(--danger-color);
    margin-left: 2px;
}

.field-control {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.field-error {
    color: var(--danger-color);
    font-size: var(--font-xs);
}

.full-row {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.tip {
    font-size: var(--font-sm);
    color: var(--text-muted);
}

.submit-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--space-xs);
}

.result {
    border: 1px solid color-mix(in srgb, var(--primary-color) 28%, transparent);
    background: color-mix(in srgb, var(--active-bg) 32%, var(--panel-bg));
    border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-sm);
}

/* Responsive adjustment */
@media (max-width: 900px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
}
</style>
