<template>
    <input
        class="nocobase-ui-input"
        :type="type"
        :value="modelValue ?? ''"
        :disabled="disabled"
        @input="onInput"
    />
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue?: string | number | null
    disabled?: boolean
    type?: string
}>()

const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

const onInput = (event: Event) => {
    emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const type = props.type ?? 'text'
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
