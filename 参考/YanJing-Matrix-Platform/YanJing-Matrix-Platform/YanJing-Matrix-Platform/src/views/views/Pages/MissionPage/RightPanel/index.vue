<template>
    <div class="RightPanel">
        <div class="RightHead" role="tablist" aria-label="Right panel tabs">
            <button v-for="t in tabs" :key="t.key" class="tab-card" :class="{
                'tab-card--active': activeTab === t.key,
                'tab-card--make-skill': t.key === 'makeSkill',
                'tab-card--release': t.key === 'release'
            }"
                type="button" role="tab" :aria-selected="activeTab === t.key" @click="activeTab = t.key">
                <div class="icon" aria-hidden="true">
                    <div v-if="t.key === 'MissionText'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="lucide lucide-file-text opacity-50" aria-hidden="true">
                            <path
                                d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z">
                            </path>
                            <path d="M14 2v5a1 1 0 0 0 1 1h5"></path>
                            <path d="M10 9H8"></path>
                            <path d="M16 13H8"></path>
                            <path d="M16 17H8"></path>
                        </svg>
                    </div>
                    <div v-if="t.key === 'preview'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="lucide lucide-monitor opacity-50" aria-hidden="true">
                            <rect width="20" height="14" x="2" y="3" rx="2"></rect>
                            <line x1="8" x2="16" y1="21" y2="21"></line>
                            <line x1="12" x2="12" y1="17" y2="21"></line>
                        </svg>
                    </div>
                    <div v-if="t.key === 'test'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="lucide lucide-flask-conical opacity-50" aria-hidden="true">
                            <path
                                d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2">
                            </path>
                            <path d="M6.453 15h11.094"></path>
                            <path d="M8.5 2h7"></path>
                        </svg>
                    </div>
                    <div v-if="t.key === 'settings'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="lucide lucide-settings opacity-50" aria-hidden="true">
                            <path
                                d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915">
                            </path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </div>
                    <div v-if="t.key === 'makeSkill'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="lucide lucide-puzzle" aria-hidden="true">
                            <path
                                d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z">
                            </path>
                        </svg>
                    </div>
                    <div v-if="t.key === 'release'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            class="lucide lucide-rocket" aria-hidden="true">
                            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
                            <path
                                d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09">
                            </path>
                            <path
                                d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z">
                            </path>
                            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"></path>
                        </svg>
                    </div>
                </div>

                    {{ t.label }}
            </button>
        </div>

        <div class="RightBody" role="tabpanel">
            <div class="body-card1" v-show="activeTab === 'MissionText'">
                <SecretaryPanel />
            </div>
            <div class="body-card1" v-show="activeTab === 'preview'">
                <FilesPanel />
            </div>
            <div class="body-card1" v-show="activeTab === 'test'">
                <SearchPanel />
            </div>
            <div class="body-card1" v-show="activeTab === 'settings'">
                <SearchPanel />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
/*
import SecretaryPanel from './secretary/index.vue'
import FilesPanel from './files/index.vue'
import SearchPanel from './search/index.vue'
*/
type TabKey = 'MissionText' | 'preview' | 'test' | 'settings' | 'makeSkill' | 'release'

const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'MissionText', label: '任务书' },
    { key: 'preview', label: '预览' },
    { key: 'test', label: '测试' },
    { key: 'settings', label: '设置' },
    { key: 'makeSkill', label: '制作Skill' },
    { key: 'release', label: '发布' },
]

const activeTab = ref<TabKey>('MissionText')
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
    flex: 0 0 auto;
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

.tab-card--make-skill {
    margin-left: auto;
    flex: 0 0 auto;
}

.tab-card--release {
    flex: 0 0 auto;
    background: var(--text-color);
    color: var(--panel-bg);
    border-color: color-mix(in srgb, var(--text-color) 35%, transparent);
}

.tab-card--release.tab-card--active {
    background: color-mix(in srgb, var(--text-color) 88%, var(--primary-color));
    border-color: color-mix(in srgb, var(--text-color) 70%, var(--primary-color));
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