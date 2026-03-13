<template>
    <div class="PageContainer" :class="{ 'is-mobile': isMobile }" @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove" @touchend.passive="onTouchEnd">
        <div class="PanelsTrack" :style="trackStyle" ref="panelsTrackRef">
            <transition name="sidebar-slide-left">
                <div class="LeftContent panel" v-show="showLeft">
                </div>
            </transition>
            <div class="MiddleContent panel">
                <Organization />
            </div>
            <div v-if="showResizeBar" class="ResizeBar" @mousedown.prevent="onResizeBarMouseDown"></div>
            <transition name="sidebar-slide-right">
                <div class="RightContent panel" v-show="showRight" :style="rightPanelStyle" ref="rightPanelRef">
                    <BusinessOperationPanel @select="handleBusinessSelect" />
                </div>
            </transition>
        </div>
    </div>
</template>


<script setup lang="ts">

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useSidebarStore } from '@/stores/sidebar'
import Organization from './Organization'
import BusinessOperationPanel from '@/components/OrganizatonServer/BusinessOperationPanel/index.vue'
import { MOBILE_MAX_WIDTH } from '@/constants/breakpoints'
import { openApprovalManagementDialog } from '@/components/OrganizatonServer/Approval/open'

const sidebarStore = useSidebarStore()

const panelsTrackRef = ref<HTMLElement | null>(null)
const rightPanelRef = ref<HTMLElement | null>(null)

const isMobile = ref(false)
const mobilePanel = ref<'middle' | 'right'>('middle')
const rightPanelWidthPx = ref<number | null>(null)
const isResizingRightPanel = ref(false)

let resizeStartX = 0
let resizeStartWidth = 0

const showLeft = computed(() => (isMobile.value ? false : sidebarStore.sidebars.sidebar3.left))
const showRight = computed(() => (isMobile.value ? true : sidebarStore.sidebars.sidebar3.right))
const showResizeBar = computed(() => !isMobile.value && showRight.value)
const rightPanelStyle = computed(() => {
    if (isMobile.value || !showRight.value || rightPanelWidthPx.value === null) return undefined
    return {
        flex: `0 0 ${rightPanelWidthPx.value}px`,
        maxWidth: `${rightPanelWidthPx.value}px`,
    }
})

const panelOrder: Array<'middle' | 'right'> = ['middle', 'right']
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
        mobilePanel.value = 'middle'
    }
}

const setMobilePanel = (panel: 'middle' | 'right') => {
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

type BusinessSelectPayload = {
    categoryKey: string
    itemKey: string
    status: 'connected' | 'planning'
}

function handleBusinessSelect(payload: BusinessSelectPayload) {
    if (payload.itemKey === 'approval-workflow') {
        openApprovalManagementDialog({ defaultTab: 'todo' })
    }
}

function initRightPanelWidth() {
    if (isMobile.value) return
    const rightEl = rightPanelRef.value
    if (!rightEl) return
    const width = Math.round(rightEl.getBoundingClientRect().width)
    if (width > 0) {
        rightPanelWidthPx.value = width
    }
}

function onResizeBarMouseDown(event: MouseEvent) {
    if (!showResizeBar.value) return
    const rightEl = rightPanelRef.value
    if (!rightEl) return

    isResizingRightPanel.value = true
    resizeStartX = event.clientX
    resizeStartWidth = rightEl.getBoundingClientRect().width

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', onResizeBarMouseMove)
    window.addEventListener('mouseup', onResizeBarMouseUp)
}

function onResizeBarMouseMove(event: MouseEvent) {
    if (!isResizingRightPanel.value) return
    const trackEl = panelsTrackRef.value
    if (!trackEl) return

    const delta = resizeStartX - event.clientX
    const rawWidth = resizeStartWidth + delta
    const trackWidth = trackEl.getBoundingClientRect().width
    const minWidth = 280
    const maxWidth = Math.max(minWidth, Math.floor(trackWidth * 0.65))
    rightPanelWidthPx.value = Math.min(maxWidth, Math.max(minWidth, rawWidth))
}

function onResizeBarMouseUp() {
    if (!isResizingRightPanel.value) return
    isResizingRightPanel.value = false
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    window.removeEventListener('mousemove', onResizeBarMouseMove)
    window.removeEventListener('mouseup', onResizeBarMouseUp)
}









onMounted(() => {
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    window.addEventListener('resize', initRightPanelWidth)
    if (isMobile.value) {
        setMobilePanel('middle')
    }
    setTimeout(() => initRightPanelWidth(), 0)
})

onBeforeUnmount(() => {
    onResizeBarMouseUp()
    window.removeEventListener('resize', updateIsMobile)
    window.removeEventListener('resize', initRightPanelWidth)
    sidebarStore.setMessageMobilePanel('middle')
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
    flex: 0 0 16%;
    
    max-width: min(16%,300px);
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.MiddleContent {
    flex: 1 1 auto;
    min-width: 0;
}

.LeftContentHeader {
    width: 100%;
    min-width: 0;
    max-width: none;
    padding: var(--space-sm);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    flex-direction: row;
    gap:0.5rem;
}

.create-btn {
  width: 24px;
  height: 24px;
  background: transparent;
  border: 0.25rem;
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.icon{
    width: 100%;
    height: 100%;
}


.LeftContentHeader :deep(.header-search) {
    width: 100%;
    display: flex;
    align-items: center;
}

.RightContent {
    flex: 0 0 35%;
    max-width: 35%;
    min-width: 0;
}

.ResizeBar {
    flex: 0 0 4px;
    width: 4px;
    cursor: col-resize;
    position: relative;
    align-self: stretch;
}

.ResizeBar::before {
    content: '';
    position: absolute;
    top: 10px;
    bottom: 10px;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--text-color) 18%, transparent);
    border-radius: 999px;
}

.ResizeBar:hover::before {
    background: color-mix(in srgb, var(--primary-color) 45%, transparent);
}

@media (max-width: 768px) {
    .PageContainer.is-mobile {
        overflow: hidden;
        gap: 0;
    }

    .PanelsTrack {
        width: 100%;
        height: 100%;
        gap: 0;
        transition: transform 0.25s ease;
        will-change: transform;
    }

    .panel {
        flex: 0 0 100%;
        width: 100%;
        height: 100%;
        max-width: 100% !important;
        min-width: 0;
        box-sizing: border-box;
        overflow: hidden;
    }

    .ResizeBar {
        display: none;
    }

    .LeftContentHeader {
        min-width: 0;
        max-width: none;
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