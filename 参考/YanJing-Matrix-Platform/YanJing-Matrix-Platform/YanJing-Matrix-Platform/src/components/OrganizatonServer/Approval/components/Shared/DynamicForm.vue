<template>
    <div class="dynamic-form">
        <template v-for="field in fields" :key="field.id">
            <div class="form-item">
                <label>
                    {{ field.label || field.id }}
                    <span v-if="field.rules?.required" class="required-mark">*</span>
                </label>

                <div class="field-control">
                    <!-- 如果只读模式 -->
                    <div v-if="readOnly" class="read-only-value">
                        {{ formatValue(modelValue[field.id]) }}
                    </div>

                    <!-- 否则渲染输入框 -->
                    <template v-else>
                        <textarea v-if="field.type === 'textarea'" :value="modelValue[field.id]"
                            @input="updateValue(field.id, ($event.target as HTMLTextAreaElement).value)" class="input"
                            rows="3" :placeholder="field.placeholder || field.label || field.id" />
                        <input v-else-if="field.type === 'number'" type="number" :value="modelValue[field.id]"
                            @input="updateValue(field.id, ($event.target as HTMLInputElement).value)" class="input"
                            inputmode="decimal" :placeholder="field.placeholder || field.label || field.id" />
                        <input v-else type="text" :value="modelValue[field.id]"
                            @input="updateValue(field.id, ($event.target as HTMLInputElement).value)" class="input"
                            :placeholder="field.placeholder || field.label || field.id" />
                        <div class="field-error" v-if="errors?.[field.id]">{{ errors[field.id] }}</div>
                    </template>
                </div>
            </div>
        </template>

        <div v-if="!fields.length" class="empty-tip">
            未配置表单字段
        </div>
    </div>
</template>
<script setup lang="ts">
import type { ApprovalUiConfigField } from '@/types/approval'

const props = defineProps<{
    fields: ApprovalUiConfigField[]
    modelValue: Record<string, any>
    errors?: Record<string, string>
    readOnly?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: Record<string, any>): void
    (e: 'change', fieldId: string, value: any): void
}>()

function updateValue(fieldId: string, val: string | number) {
    const newVal = { ...props.modelValue }

    // 简易处理，这里尽量保持原始输入值，在提交前再统一转换类型
    // 或者也可以在这里即时转换
    newVal[fieldId] = val
    emit('update:modelValue', newVal)
    emit('change', fieldId, val)
}

function formatValue(val: any) {
    if (val === null || val === undefined || val === '') return '-'
    return String(val)
}
</script>

<style scoped>
.dynamic-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.form-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

label {
    font-size: var(--font-sm);
    color: var(--text-muted);
}

.required-mark {
    color: var(--danger-color);
    margin-left: 2px;
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

.field-error {
    color: var(--danger-color);
    font-size: var(--font-xs);
}

.read-only-value {
    padding: 10px 12px;
    background: color-mix(in srgb, var(--bg-color) 72%, var(--panel-bg));
    border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
    border-radius: var(--radius-sm);
    font-size: var(--font-sm);
}

.empty-tip {
    font-size: var(--font-sm);
    color: var(--text-muted);
    text-align: center;
    padding: var(--space-sm);
    border: 1px dashed color-mix(in srgb, var(--text-color) 20%, transparent);
    border-radius: var(--radius-sm);
}
</style>
