<template>

    <div class="PanelHeader secondary">
        <div class="PanelTitle">子应用列表</div>
        <div class="PanelSub">Applications</div>
    </div>
    <div class="ListContainer">
        <div v-if="!applications.length" class="EmptyState">暂无子应用</div>
        <button v-for="app in applications" :key="itemKey(app)" class="ListItem" type="button" @click="selectApp(app)">
            <div class="ItemTitle">{{ app.displayName || app.name }}</div>
            <div class="ItemMeta">
                <span class="ItemName">{{ app.name }}</span>
            </div>
        </button>
    </div>
    <div class="PanelHeader">
        <div class="PanelTitle">本层数据</div>
        <div class="PanelSub">Base</div>
    </div>
    <div class="ListContainer">
        <div v-if="!baseGroups.length" class="EmptyState">暂无数据</div>
        <button v-for="group in baseGroups" :key="group.key" class="ListItem" type="button"
            @click="selectBase(group.key)">
            <div class="ItemTitle">{{ group.key }}</div>
        </button>
    </div>


</template>

<script setup lang="ts">
import { computed } from 'vue'

type InfoPayload = { data?: Record<string, unknown> }

const props = defineProps<{ info: InfoPayload | null }>()
const emit = defineEmits<{
    (event: 'select-base', key: string): void
    (event: 'select-app', app: any): void
}>()

const baseData = computed(() => (props.info?.data as Record<string, unknown>) || {})
const applications = computed(() => {
    const list = baseData.value?.applications
    return Array.isArray(list) ? list : []
})
const baseGroups = computed(() => {
    const entries = Object.entries(baseData.value || {})
    return entries
        .filter(([key, value]) =>
            key !== 'applications' &&
            key !== 'uiSchemas' &&
            key !== 'uiSchemasTree' &&
            key !== 'uiRoutes' &&
            Array.isArray(value),
        )
        .map(([key]) => ({ key }))
})

const itemKey = (item: any) => item?.id ?? item?.key ?? item?.name ?? item?.username ?? item?.title ?? Math.random()

const selectBase = (key: string) => {
    emit('select-base', key)
}

const selectApp = (app: any) => {
    emit('select-app', app)
}
</script>

<style scoped>
.PanelHeader {
    padding: 1rem 1rem 0.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex-shrink: 0;
}

.PanelHeader.secondary {
    border-top: 1px solid var(--glass-border);

}

.PanelTitle {
    font-size: var(--font-base);
    font-weight: 600;
    color: var(--text-color);
}

.PanelSub {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.ListContainer {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem 1rem 0.75rem;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}

.ListItem {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.6rem 0.75rem;
    color: var(--text-color);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    background: transparent;
}

.ListItem:hover {
    border-color: var(--primary-color);
    background: var(--hover-bg);
}

.ItemTitle {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-color);
}

.ItemMeta {
    display: flex;
    justify-content: space-between;
    font-size: 0.625rem;
    color: var(--text-muted);
}

.EmptyState {
    padding: 1rem;
    text-align: center;
    color: var(--text-muted);
    font-size: var(--font-sm);
}
</style>
