<template>
    <div class="RightPanel">
        <div class="RightHead" role="tablist" aria-label="Right panel tabs">
            <button v-for="t in tabs" :key="t.key" class="tab-card" :class="{ 'tab-card--active': activeTab === t.key }"
                type="button" role="tab" :aria-selected="activeTab === t.key" @click="activeTab = t.key">
                {{ t.label }}
            </button>
        </div>

        <div class="RightBody" role="tabpanel">
            <div class="body-card1" v-show="activeTab === 'secretary'">
                <SecretaryPanel />
            </div>
            <div class="body-card1" v-show="activeTab === 'files'">
                <FilesPanel />
            </div>
            <div class="body-card1" v-show="activeTab === 'search'">
                <SearchPanel />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SecretaryPanel from './secretary/index.vue'
import FilesPanel from './files/index.vue'
import SearchPanel from './search/index.vue'

type TabKey = 'secretary' | 'files' | 'search'

const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'secretary', label: '秘书' },
    { key: 'files', label: '文件' },
    { key: 'search', label: '搜索' },
]

const activeTab = ref<TabKey>('secretary')
</script>

<style scoped>
.RightPanel {
    padding: 1rem;
    padding-right: 2rem;
    padding-top: 2rem   ;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.RightHead {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
}

.tab-card {
    flex: 1 1 0;
    min-width: 50px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    background: var(--bg-color-third);
    color: var(--text-color);
    cursor: pointer;
    user-select: none;
    text-align: center;
    line-height: 1;
    transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.tab-card:hover {
    opacity: 0.92;
}

.tab-card--active {
    background: var(--bg-color, var(--bg-color-third));
    border-color: var(--border-color);
    font-weight: 600;
    opacity: 1;
}

.RightBody {
    flex: 1;
    min-height: 0;
    overflow: auto;
}

.body-card1 {
    height: 100%;
    border-radius: 12px;
    background: var(--bg-color-third);
    padding: 6px;
    box-sizing: border-box;
}
</style>