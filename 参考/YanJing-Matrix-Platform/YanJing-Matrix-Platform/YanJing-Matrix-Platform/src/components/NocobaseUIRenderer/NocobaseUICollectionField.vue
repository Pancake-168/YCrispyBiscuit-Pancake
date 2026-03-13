<template>
    <div class="nocobase-ui-collection-field">
        <label v-if="label" class="nocobase-ui-collection-field__label">{{ label }}</label>
        <div class="nocobase-ui-collection-field__content">
            <slot>
                <component
                    v-if="editorComponent"
                    :is="editorComponent"
                    v-bind="editorProps"
                />
                <span v-else class="nocobase-ui-collection-field__value">{{ displayValue }}</span>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { getNocobaseUIComponent } from '@/utils/NocobaseUIRendererRegistry'
import { NocobaseUIRenderContextKey } from '@/utils/NocobaseUIRenderContext'
import type { NocobaseUIRenderContext } from '@/types/NocobaseUIRenderer'
import { NocobaseUIFormStoreKey } from '@/utils/NocobaseUIFormStore'

const props = defineProps<{
    label?: string
    value?: unknown
    fieldKey?: string
    inputComponent?: string
}>()

const displayValue = props.value === undefined || props.value === null ? '' : String(props.value)

const renderContext = inject<NocobaseUIRenderContext>(NocobaseUIRenderContextKey, { mode: 'read' })
const formStore = inject(NocobaseUIFormStoreKey)

const editorComponent = computed(() => {
    if (renderContext.mode === 'read') {
        return undefined
    }
    const componentName = props.inputComponent || 'Input'
    return getNocobaseUIComponent(componentName)
})

const editorProps = computed(() => {
    if (!formStore || !props.fieldKey) {
        return {}
    }
    const modelValue = formStore.getValue(props.fieldKey) ?? ''
    return {
        modelValue,
        'onUpdate:modelValue': (value: unknown) => formStore.setValue(props.fieldKey as string, value),
    }
})
</script>

<style scoped>
.nocobase-ui-collection-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.nocobase-ui-collection-field__label {
    font-size: var(--font-base);
    color: var(--text-muted);
}

.nocobase-ui-collection-field__value {
    font-size: var(--font-md);
    color: var(--text-color);
}
</style>
