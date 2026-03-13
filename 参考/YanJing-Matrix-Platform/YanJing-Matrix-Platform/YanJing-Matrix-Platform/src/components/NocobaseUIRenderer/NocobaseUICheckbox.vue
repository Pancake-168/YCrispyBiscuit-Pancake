<template>
    <label class="nocobase-ui-checkbox">
        <input type="checkbox" :checked="modelValue" :disabled="disabled" @change="onChange" />
        <span><slot /></span>
    </label>
</template>

<script setup lang="ts">
defineProps<{
    modelValue?: boolean
    disabled?: boolean
}>()

const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>()

const onChange = (event: Event) => {
    emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<style scoped>
.nocobase-ui-checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    color: var(--text-color);
    font-size: var(--font-base);
}
</style>
