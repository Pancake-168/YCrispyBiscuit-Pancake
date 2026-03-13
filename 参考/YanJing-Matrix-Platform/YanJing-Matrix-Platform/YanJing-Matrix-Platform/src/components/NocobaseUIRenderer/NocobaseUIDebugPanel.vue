<template>
    <div class="nocobase-ui-debug">
        <div class="nocobase-ui-debug__title">NocoBase UI 调试</div>
        <div class="nocobase-ui-debug__row">节点数：{{ snapshot.nodeCount }}</div>
        <div v-if="snapshot.warnings.length" class="nocobase-ui-debug__row">
            警告：
            <ul>
                <li v-for="(warn, index) in snapshot.warnings" :key="index">{{ warn }}</li>
            </ul>
        </div>
        <div v-if="snapshot.unknownComponents.length" class="nocobase-ui-debug__row">
            未识别组件：{{ snapshot.unknownComponents.join(', ') }}
        </div>
        <button class="btn btn-ghost" @click="copySnapshot">复制调试信息</button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NocobaseUISchemaTree } from '@/types/NocobaseUIRenderer'
import { buildNocobaseUIDebugSnapshot } from '@/utils/NocobaseUIDebug'

const props = defineProps<{ tree: NocobaseUISchemaTree }>()

const snapshot = computed(() => buildNocobaseUIDebugSnapshot(props.tree))

const copySnapshot = async () => {
    await navigator.clipboard.writeText(JSON.stringify(snapshot.value, null, 2))
}
</script>

<style scoped>
.nocobase-ui-debug {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    border: var(--glass-border);
    background: var(--glass-bg);
    color: var(--text-color);
}

.nocobase-ui-debug__title {
    font-weight: 600;
}
</style>
