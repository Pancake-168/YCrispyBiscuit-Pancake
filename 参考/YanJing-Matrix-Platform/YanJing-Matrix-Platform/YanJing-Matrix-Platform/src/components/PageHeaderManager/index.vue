<template>
    <div class="page-header">
        <div class="left">
            <div class="icon icon-sm function-toggle-icon" @click="handleFunctionListToggle">
                <img src="@/assets/Project/components/PageHeader/列表.svg" alt="Logo" />
            </div>
            <div v-if="systemStore.currentFunction === 'NocoBase'" class="icon drawer-left-icon"
                @click=" sidebarStore.toggleSidebar('sidebar1', 'left')">
                <img src="@/assets/Project/components/PageHeader/抽屉左.svg" alt="Logo" />
            </div>
            <div v-if="systemStore.currentFunction === 'Settings'" class="icon drawer-left-icon"
                @click=" sidebarStore.toggleSidebar('sidebar6', 'left')">
                <img src="@/assets/Project/components/PageHeader/抽屉左.svg" alt="Logo" />
            </div>


        </div>
        <div class="center">
            <div class="center_left">
            </div>


        </div>
        <div class="right">
            <div v-if="appStore.theme === 'dark'" class="icon" @click="appStore.setTheme('light')">
                <img src="@/assets/Project/components/PageHeader/太阳.svg" alt="Logo" />
            </div>
            <div v-if="appStore.theme === 'light'" class="icon icon-sm" @click="appStore.setTheme('dark')">
                <img src="@/assets/Project/components/PageHeader/月亮.svg" alt="Logo" />
            </div>
            <div v-if="systemStore.currentFunction === 'NocoBase'" class="icon drawer-right-icon"
                @click=" sidebarStore.toggleSidebar('sidebar1', 'right')">
                <img src="@/assets/Project/components/PageHeader/抽屉右.svg" alt="Logo" />
            </div>


        </div>
    </div>
</template>


<script setup lang="ts">
import { useAppManagerStore } from '@/stores/appManager'
import { useSidebarManagerStore } from '@/stores/sidebarManager'
import { useSystemManagerStore } from "@/stores/SystemManager";

const appStore = useAppManagerStore()
const sidebarStore = useSidebarManagerStore()
const systemStore = useSystemManagerStore()

function handleFunctionListToggle() {
    if (appStore.functionListMode === 'fixed') {
        appStore.setFunctionListCollapsed(!appStore.functionListCollapsed)
        return
    }
    sidebarStore.togglePageList()
}



</script>

<style scoped>
.page-header {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0;
    align-items: center;
    min-width: 0;
}

.left {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    padding-left: 1rem;
    gap: 1rem;
    flex-shrink: 0;
}

.icon {
    width: 24px;
    height: 24px;
    color: var(--text-color);
    opacity: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
    cursor: pointer;
}

.icon.icon-sm {
    width: 24px;
    height: 24px;
}

.icon.icon-sm img {
    width: 20px;
    height: 20px;
}

.icon:hover {
    opacity: 1;
}

.icon:active {
    transform: translateY(1px);
}

.icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: var(--icon-filter);
}


.center {
    display: flex;
    justify-content: flex-start;
    margin: 0;
    flex-direction: row;
    gap: 0;
    min-width: 0;
    overflow: hidden;
}

.center_left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 0;
    margin-right: 0;
    min-width: 0;
    width: auto;
    max-width: min(100%, 180px);
    flex: 0 1 180px;
}

.right {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    padding-right: 1rem;
    gap: 1rem;
    flex-shrink: 0;
}

@media (max-width: 768px) {

    .function-toggle-icon,
    .drawer-left-icon,
    .drawer-right-icon {
        display: none;
    }
}
</style>