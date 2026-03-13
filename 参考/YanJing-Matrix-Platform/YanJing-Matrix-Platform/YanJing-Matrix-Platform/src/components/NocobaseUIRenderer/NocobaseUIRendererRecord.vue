<template>
    <div class="nocobase-ui-renderer__record">
        <NocobaseUIRendererNode v-for="node in nodes" :key="node.id" :node="node" />
    </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import type { NocobaseUIRenderContext, NocobaseUISchemaNode } from '@/types/NocobaseUIRenderer'
import NocobaseUIRendererNode from '@/components/NocobaseUIRenderer/NocobaseUIRendererNode.vue'
import { createNocobaseUIRenderContext, NocobaseUIRenderContextKey } from '@/utils/NocobaseUIRenderContext'
import { createNocobaseUIFormStore, NocobaseUIFormStoreKey } from '@/utils/NocobaseUIFormStore'

const props = defineProps<{
    nodes: NocobaseUISchemaNode[]
    context?: NocobaseUIRenderContext
    record?: Record<string, unknown>
}>()

const renderContext = createNocobaseUIRenderContext({
    ...(props.context || {}),
    record: props.record,
})

provide(NocobaseUIRenderContextKey, renderContext)
provide(NocobaseUIFormStoreKey, createNocobaseUIFormStore(renderContext.record))
</script>

<style scoped>
.nocobase-ui-renderer__record {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
}
</style>
