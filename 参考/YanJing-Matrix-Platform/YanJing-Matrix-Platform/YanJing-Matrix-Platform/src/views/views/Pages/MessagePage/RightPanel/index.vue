<template>
    <div class="RightPanel">
        <div class="RightHead" role="tablist" aria-label="Right panel tabs">
            <button v-for="t in tabs" :key="t.key" class="tab-card" :class="{ 'tab-card--active': activeTab === t.key }"
                type="button" role="tab" :aria-selected="activeTab === t.key" @click="activeTab = t.key">
                <div class="icon" aria-hidden="true">
                    <div v-if="t.key === 'secretary'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="lucide lucide-sparkles mr-2 h-4 w-4 opacity-50" aria-hidden="true">
                            <path
                                d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z">
                            </path>
                            <path d="M20 2v4"></path>
                            <path d="M22 4h-4"></path>
                            <circle cx="4" cy="20" r="2"></circle>
                        </svg>
                    </div>
                    <div v-if="t.key === 'files'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="lucide lucide-files mr-2 h-4 w-4 opacity-50" aria-hidden="true">
                            <path d="M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"></path>
                            <path d="M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z">
                            </path>
                            <path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1"></path>
                        </svg>
                    </div>
                    <div v-if="t.key === 'search'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="lucide lucide-search mr-2 h-4 w-4 opacity-50" aria-hidden="true">
                            <path d="m21 21-4.34-4.34"></path>
                            <circle cx="11" cy="11" r="8"></circle>
                        </svg>
                    </div>
                </div>


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
import { ref, computed, watch } from 'vue'
import SecretaryPanel from './secretary/index.vue'
import FilesPanel from './files/index.vue'
import SearchPanel from './search/index.vue'
import { useSystemStore } from '@/stores/System'

type TabKey = 'secretary' | 'files' | 'search'

const systemStore = useSystemStore()

// 动态获取当前房间的类型 ('bot' 或 'user')
const roomType = computed(() => systemStore.getRoomTypeById(systemStore.currentSystemRoomId))

// 动态渲染 tabs：当房间为 bot 时，去掉“秘书”入口
const tabs = computed(() => {
    const baseTabs: Array<{ key: TabKey; label: string }> = [
        { key: 'files', label: '文件' },
        { key: 'search', label: '搜索' },
    ]
    if (roomType.value !== 'bot') {
        baseTabs.unshift({ key: 'secretary', label: '秘书' })
    }
    return baseTabs
})

const activeTab = ref<TabKey>('secretary')

// 监听房间类型，若切入 bot 房间且当前还在“秘书”组件，则强制默认跳转到“文件”组件
watch(roomType, (newType) => {
    if (newType === 'bot') {
        if (activeTab.value === 'secretary') {
            activeTab.value = 'files'
        }
    }
}, { immediate: true })
</script>

<style scoped>
.RightPanel {
    padding: var(--space-md);
    padding-right: var(--space-xl);
    padding-top: 0;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    box-sizing: border-box;
}

.RightHead {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
    width: 100%;
}

.tab-card {
    flex: 1 1 0;
    min-width: 44px;
    max-width: 100%;
    padding: 6px 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-radius: var(--radius-md);
    border: var(--glass-border);
    background: var(--glass-bg);
    color: var(--text-color);
    font-size: var(--font-sm);
    cursor: pointer;
    user-select: none;
    text-align: center;
    line-height: 1;
    transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.icon {
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
}

.icon :deep(svg) {
    width: 14px;
    height: 14px;
}


.tab-card:hover {
    opacity: 0.92;
}

.tab-card--active {
    background: color-mix(in srgb, var(--primary-color) 18%, var(--glass-bg));
    border-color: color-mix(in srgb, var(--primary-color) 45%, transparent);
    font-weight: 600;
    opacity: 1;
}

.RightBody {
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: auto;
}

.body-card1 {
    height: 100%;
    border-radius: var(--radius-md);
    border: var(--glass-border);
    background: var(--panel-bg);
    padding: var(--space-xs);
    box-sizing: border-box;
}

@media (max-width: 768px) {
    .RightPanel {
        padding: var(--space-sm);
    }
}
</style>