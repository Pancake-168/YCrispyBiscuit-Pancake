<template>
    <select class="nocobase-ui-select" :value="modelValue" :disabled="disabled" @change="onChange">
        <option v-for="option in options" :key="String(option.value)" :value="option.value">
            {{ option.label }}
        </option>
    </select>
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue?: string | number | null
    disabled?: boolean
    options?: Array<{ label: string; value: string | number }>
}>()

const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

const onChange = (event: Event) => {
    emit('update:modelValue', (event.target as HTMLSelectElement).value)
}

const options = props.options ?? []
</script>

<style scoped>
.nocobase-ui-select {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    border: var(--glass-border);
    background: var(--input-bg);
    color: var(--text-color);
    font-size: var(--font-base);
}
</style>
