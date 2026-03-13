<template>
    <button
        class="nocobase-ui-action btn"
        :class="variantClass"
        :disabled="disabled"
        :type="buttonType"
        @click="handleClick"
    >
        <span v-if="icon" class="nocobase-ui-action__icon">{{ icon }}</span>
        <slot>{{ label }}</slot>
    </button>
</template>

<script setup lang="ts">
const props = defineProps<{
    label?: string
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'danger' | 'ghost'
    confirm?: string
    icon?: string
    htmlType?: 'button' | 'submit' | 'reset'
}>()

const emit = defineEmits<{ (event: 'click'): void }>()
const buttonType = props.htmlType ?? props.type ?? 'button'
const variantClass = props.variant
    ? `btn-${props.variant}`
    : props.type && ['primary', 'danger', 'ghost'].includes(props.type)
        ? `btn-${props.type}`
        : ''

const handleClick = () => {
    if (props.confirm && !window.confirm(props.confirm)) {
        return
    }
    emit('click')
}
</script>

<style scoped>
.nocobase-ui-action {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    border: var(--glass-border);
    background: var(--glass-bg);
    color: var(--text-color);
    cursor: pointer;
}

.nocobase-ui-action__icon {
    margin-right: var(--space-sm);
}

.nocobase-ui-action:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}
</style>
