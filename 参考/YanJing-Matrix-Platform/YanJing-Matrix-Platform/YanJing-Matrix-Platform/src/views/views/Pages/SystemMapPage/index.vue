<template>
    <div class="PageContainer">
        <transition name="sidebar-slide-left">
            <div class="LeftContent" v-show="sidebarStore.sidebars.sidebar4.left">
            </div>
        </transition>
        <div class="MiddleContent">
            <SystemMap />
        </div>
        <transition name="sidebar-slide-right">
            <div class="RightContent" v-show="sidebarStore.sidebars.sidebar4.right">

            </div>
        </transition>
    </div>
</template>


<script setup lang="ts">

import { useSidebarStore } from '@/stores/sidebar'
import SystemMap from './SystemMap'

const sidebarStore = useSidebarStore()




</script>

<style scoped>
.PageContainer {
    width: 100%;
    height: 100%;
    display: flex;
    min-height: 0;
    flex-direction: row;
    gap: 0.2rem;
}

.LeftContent,
.MiddleContent,
.RightContent {
    height: 100%;
    width: 100%;
    background: var(--glass-bg);
    border: var(--glass-border);

    overflow: hidden;
}


.LeftContent {
    max-width: 18%;
    display: flex;
    flex-direction: column;
}

.LeftContentHeader {
    width: 100%;
    min-width: 200px;
    max-width: 250px;
    padding: var(--space-sm);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.LeftContentHeader :deep(.header-search) {
    width: 100%;
    display: flex;
    align-items: center;
}

.RightContent {
    max-width: 25%;
}

.sidebar-slide-left-enter-active,
.sidebar-slide-left-leave-active {
    transition: transform 0.25s ease, opacity 0.25s ease;
}

.sidebar-slide-left-enter-from,
.sidebar-slide-left-leave-to {
    transform: translateX(-12px);
    opacity: 0;
}

.sidebar-slide-right-enter-active,
.sidebar-slide-right-leave-active {
    transition: transform 0.25s ease, opacity 0.25s ease;
}

.sidebar-slide-right-enter-from,
.sidebar-slide-right-leave-to {
    transform: translateX(12px);
    opacity: 0;
}
</style>