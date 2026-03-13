<template>
    <input
        class="nocobase-ui-input"
        type="password"
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
    emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<style scoped>
.nocobase-ui-input {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    border: var(--glass-border);
    background: var(--input-bg);
    color: var(--text-color);
    font-size: var(--font-base);
}
</style>
