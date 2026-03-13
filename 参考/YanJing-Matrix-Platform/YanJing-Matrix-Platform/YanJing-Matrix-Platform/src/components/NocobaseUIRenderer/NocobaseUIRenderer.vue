<template>
    <div class="nocobase-ui-renderer">
        <template v-if="recordsToRender.length">
            <NocobaseUIRendererRecord
                v-for="(record, index) in recordsToRender"
                :key="String(record?.id ?? index)"
                :nodes="nodes"
                :context="context"
                :record="record"
            />
        </template>
        <NocobaseUIRendererRecord
            v-else
            :nodes="nodes"
            :context="context"
            :record="context?.record"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NocobaseUIRenderContext, NocobaseUISchemaNode } from '@/types/NocobaseUIRenderer'
import NocobaseUIRendererRecord from '@/components/NocobaseUIRenderer/NocobaseUIRendererRecord.vue'

const props = defineProps<{ nodes: NocobaseUISchemaNode[]; context?: NocobaseUIRenderContext }>()

const recordsToRender = computed(() => props.context?.records ?? [])
</script>

<style scoped>
.nocobase-ui-renderer {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}
</style>
