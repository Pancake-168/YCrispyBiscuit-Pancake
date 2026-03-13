<template>
    <textarea
        class="nocobase-ui-textarea"
        :value="modelValue ?? ''"
        :disabled="disabled"
        @input="onInput"
    />
</template>

<script setup lang="ts">
defineProps<{
    modelValue?: string | null
    disabled?: boolean
}>()

const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

const onInput = (event: Event) => {
    emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<style scoped>
.nocobase-ui-textarea {
    width: 100%;
    min-height: 80px;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    border: var(--glass-border);
    background: var(--input-bg);
    color: var(--text-color);
    font-size: var(--font-base);
}
</style>
