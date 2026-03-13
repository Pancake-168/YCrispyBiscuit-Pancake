<template>
    <div class="PageContainer" :class="{ 'is-mobile': isMobile }" @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove" @touchend.passive="onTouchEnd">
        <div class="PanelsTrack" :style="trackStyle">
            <transition name="sidebar-slide-left">
                <div class="LeftContent panel LegacyPanel" v-show="showLeft">
                    <NocoBaseLeftContent
                        :info="info"
                        @select-base="handleSelectBase"
                        @select-app="handleSelectApp"
                    />
                </div>
            </transition>
            <div class="MiddleContent panel LegacyPanel">
                <NocoBaseMiddleContent
                    :info="info"
                    :selected-base-key="selectedBaseKey"
                    :selected-app="selectedApp"
                    @refresh="refresh"
                />

            </div>
            <transition name="sidebar-slide-right">
                <div class="RightContent panel" v-show="showRight">
                    <NocoBaseLoginPanel @login-success="refresh" />
                </div>
            </transition>
        </div>
    </div>
</template>


<script setup lang="ts">

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSidebarManagerStore } from '@/stores/sidebarManager'
import { MOBILE_MAX_WIDTH } from '@/constants/breakpoints'

import { nocoBaseService } from '@/services/NocoBase/client'
import { getAllAvailableNocoBaseInfo } from '@/services/NocoBase/data/info'
import NocoBaseLoginPanel from '@/views/ManagerSystem/Pages/NocoBasePage/Login/index'
import NocoBaseLeftContent from '@/views/ManagerSystem/Pages/NocoBasePage/LeftContent/index'
import NocoBaseMiddleContent from '@/views/ManagerSystem/Pages/NocoBasePage/MiddleContent/index'


















/**
 * 业务
 */
const info = ref<any>(null)
const selectedBaseKey = ref<string | null>(null)
const selectedApp = ref<any | null>(null)

async function refresh(){
    info.value = await getAllAvailableNocoBaseInfo()
}

const handleSelectBase = (key: string) => {
    selectedBaseKey.value = key
    selectedApp.value = null
}

const handleSelectApp = (app: any) => {
    selectedApp.value = app
    selectedBaseKey.value = null
}






































const sidebarStore = useSidebarManagerStore()



const isMobile = ref(false)
const mobilePanel = ref<'left' | 'middle' | 'right'>('left')

const showLeft = computed(() => (isMobile.value ? true : sidebarStore.sidebars.sidebar1.left))
const showRight = computed(() => (isMobile.value ? true : sidebarStore.sidebars.sidebar1.right))

const panelOrder: Array<'left' | 'middle' | 'right'> = ['left', 'middle', 'right']
const mobilePanelIndex = computed(() => panelOrder.indexOf(mobilePanel.value))
const trackStyle = computed(() => {
    if (!isMobile.value) return undefined
    return {
        transform: `translateX(-${mobilePanelIndex.value * 100}%)`,
    }
})

const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= MOBILE_MAX_WIDTH
    if (!isMobile.value) {
        mobilePanel.value = 'left'
    }
}

const setMobilePanel = (panel: 'left' | 'middle' | 'right') => {
    mobilePanel.value = panel
}

watch(mobilePanel, (panel) => {
    sidebarStore.setMessageMobilePanel(panel)
}, { immediate: true })

let touchStartX = 0
let touchStartY = 0
let touchCurrentX = 0
let touchCurrentY = 0

const onTouchStart = (event: TouchEvent) => {
    if (!isMobile.value) return
    const touch = event.touches?.[0]
    if (!touch) return
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchCurrentX = touch.clientX
    touchCurrentY = touch.clientY
}

const onTouchMove = (event: TouchEvent) => {
    if (!isMobile.value) return
    const touch = event.touches?.[0]
    if (!touch) return
    touchCurrentX = touch.clientX
    touchCurrentY = touch.clientY
}

const onTouchEnd = () => {
    if (!isMobile.value) return
    const deltaX = touchCurrentX - touchStartX
    const deltaY = touchCurrentY - touchStartY
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX < 50 || absX <= absY) return

    const currentIndex = mobilePanelIndex.value
    if (deltaX < 0) {
        const nextIndex = Math.min(panelOrder.length - 1, currentIndex + 1)
        setMobilePanel(panelOrder[nextIndex]!)
    } else {
        const prevIndex = Math.max(0, currentIndex - 1)
        setMobilePanel(panelOrder[prevIndex]!)
    }
}




watch([isMobile, mobilePanel], ([mobile, panel]) => {
    if (mobile && panel === 'left') {
        setMobilePanel('middle')
    }
}, { immediate: true })



onMounted(() => {
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    if (isMobile.value) {
        setMobilePanel('left')
    }
    if (nocoBaseService.getAuthedToken()) {
        refresh()
    }
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateIsMobile)
    sidebarStore.setMessageMobilePanel('left')
})






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

.PanelsTrack {
    width: 100%;
    height: 100%;
    display: flex;
    min-height: 0;
    flex-direction: row;
    gap: 0.2rem;
}

.panel {
    min-height: 0;
    min-width: 0;
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
    flex: 0 0 280px;
    max-width: 280px;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.MiddleContent {
    flex: 1 1 auto;
    min-width: 0;
    overflow: auto;
    padding: var(--space-md);
    box-sizing: border-box;
}

.RightContent {
    flex: 0 0 25%;
    max-width: 25%;
    min-width: 0;
    padding: var(--space-md);
    box-sizing: border-box;
}

.LegacyPanel {
    border-radius: var(--radius-md);
    backdrop-filter: var(--glass-blur);
    display: flex;
    flex-direction: column;
}



.btn {
    min-height: 34px;
    padding: 0 var(--space-md);
    border-radius: var(--radius-sm);
    border: var(--glass-border);
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn.btn-primary {
    background: var(--active-bg);
    color: var(--text-color);
}

.btn.btn-ghost {
    background: transparent;
    color: var(--text-color);
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .PageContainer.is-mobile {
        overflow: hidden;
    }

    .PanelsTrack {
        width: 100%;
        gap: 0;
        transition: transform 0.25s ease;
        will-change: transform;
    }

    .panel {
        flex: 0 0 100%;
        width: 100%;
        max-width: 100% !important;
        min-width: 0;
        box-sizing: border-box;
        overflow: hidden;
    }

    .RightContent {
        padding: var(--space-sm);
    }
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