<template>
    <div class="PageContainer" :class="{ 'is-mobile': isMobile }" @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove" @touchend.passive="onTouchEnd">
        <!--button class="create-room-test-btn" @click="handleOpenCreateRoomDialog">测试创建房间</button-->
        <div class="PanelsTrack" :style="trackStyle">
            <transition name="sidebar-slide-left">
                <div class="LeftContent panel" v-show="showLeft">
                    <div class="LeftContentHeader">
                        <GlobalSearchTrigger />
                        <button @click="openUserList" class="create-btn">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="icon">
                                <path
                                    d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12C22 13.1 21.1 14 20 14H14V20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20V14H4C2.9 14 2 13.1 2 12C2 10.9 2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z" />
                            </svg>
                        </button>
                        <button @click="handleOpenCreateRoomDialog" class="create-btn" type="button" title="创建群聊">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" class="icon" aria-hidden="true">
                                <path d="M8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11Z" />
                                <path d="M16 11C17.6569 11 19 9.65685 19 8C19 6.34315 17.6569 5 16 5C14.3431 5 13 6.34315 13 8C13 9.65685 14.3431 11 16 11Z" />
                                <path d="M3 18C3 15.7909 5.23858 14 8 14C10.7614 14 13 15.7909 13 18" />
                                <path d="M11 18C11.2105 16.8044 12.3936 16 14 16H18" />
                                <path d="M18 13V19" />
                                <path d="M15 16H21" />
                            </svg>
                        </button>
                    </div>
                    <RoomList />
                     <!--EntityList /-->

                </div>
            </transition>
            <div class="MiddleContent panel">

                <Room />

            </div>
            <transition name="sidebar-slide-right">
                <div class="RightContent panel" v-show="showRight">
                    <div class="message-internal-browser-stack" v-show="systemStore.internalBrowserVisible">
                        <InternalBrowser
                            v-for="url in systemStore.internalBrowserUrls"
                            :key="url"
                            v-show="systemStore.internalBrowserUrl === url"
                            class="message-internal-browser"
                            :url="url"
                            @close="systemStore.closeInternalBrowser()"
                        />
                    </div>
                    <RightPanel v-show="!systemStore.internalBrowserVisible" />
                </div>
            </transition>
        </div>
    </div>
</template>


<script setup lang="ts">

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSidebarStore } from '@/stores/sidebar'
import { openCreateRoomDialog } from '@/components/RoomManagement'
import { refreshRoomState } from '@/services/Matrix/refreshRoomState'
import { useSystemStore } from '@/stores/System'
import { useWebSocketStreamStore } from '@/stores/WebSocketStream'
import { useUserbotWebSocket } from '@/services/Project/UserBot/useUserbotWebSocket'
import Room from '@/components/Room'
//import EntityList from '@/components/EntityList'
import GlobalSearchTrigger from '@/components/GlobalSearch/GlobalSearchTrigger.vue'
import RoomList from '@/components/RoomList'
import RightPanel from './RightPanel'
import InternalBrowser from '@/components/InternalBrowser/index.vue'
import { MOBILE_MAX_WIDTH } from '@/constants/breakpoints'
import {openUserListDialog} from '@/components/UserListDialog/open'

const sidebarStore = useSidebarStore()
const systemStore = useSystemStore()
const webSocketStreamStore = useWebSocketStreamStore()
const isMessagePageActive = computed(() => systemStore.currentFunction === 'Message')
const currentRoomId = computed(() => systemStore.currentSystemRoomId || null)
const isMobile = ref(false)
const mobilePanel = ref<'left' | 'middle' | 'right'>('left')

type OpenInternalBrowserDetail = {
    url?: string
}

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

const handleOpenInternalBrowser = (event: Event) => {
    const customEvent = event as CustomEvent<OpenInternalBrowserDetail>
    const url = customEvent.detail?.url
    if (!url) return

    systemStore.openInternalBrowser(url)
    sidebarStore.setSidebar('sidebar1', 'right', true)
    if (isMobile.value) {
        setMobilePanel('right')
    }
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

type WsPayload = Record<string, unknown>

const handleWebSocketMessage = (data: unknown) => {
    const payload: WsPayload = (typeof data === 'object' && data !== null) ? (data as WsPayload) : {}
    const state = typeof payload.state === 'string' ? payload.state : ''
    const content_type = typeof payload.content_type === 'string' ? payload.content_type : ''
    const content = payload.content
    const room_id = typeof payload.room_id === 'string' ? payload.room_id : ''
    const event_id = typeof payload.event_id === 'string' ? payload.event_id : undefined
    if (!room_id || typeof room_id !== 'string') return
    const botUsername = (() => {
        const fromMeta = typeof payload.__botAccount === 'string' ? payload.__botAccount : ''
        if (fromMeta) return fromMeta
        const contentRecord = (typeof content === 'object' && content !== null) ? (content as WsPayload) : undefined
        const fromContentAgent = typeof contentRecord?.agent === 'string' ? contentRecord.agent : ''
        if (fromContentAgent) return fromContentAgent
        const fromAgent = typeof payload.agent === 'string' ? payload.agent : ''
        if (fromAgent) return fromAgent
        return 'unknown-bot'
    })()

    if (state === 'appending') {
        const existing = webSocketStreamStore.getStream(room_id, botUsername)
        const chunk = typeof content === 'string'
            ? content
            : (() => {
                const contentRecord = (typeof content === 'object' && content !== null) ? (content as WsPayload) : undefined
                return typeof contentRecord?.content === 'string' ? contentRecord.content : ''
            })()

        if (content_type === 'think') {
            webSocketStreamStore.upsertStream(room_id, botUsername, {
                content: existing?.content || '',
                thinkContent: (existing?.thinkContent || '') + chunk,
                contentType: 'think',
                eventId: existing?.eventId,
                finished: false,
                timestamp: Date.now(),
            })
            return
        }

        if (content_type === 'reporter' || content_type === 'text') {
            webSocketStreamStore.upsertStream(room_id, botUsername, {
                content: (existing?.content || '') + chunk,
                thinkContent: existing?.thinkContent || '',
                contentType: 'reporter',
                eventId: existing?.eventId,
                finished: false,
                timestamp: Date.now(),
            })
            return
        }
    }

    if (state === 'finish') {
        const existing = webSocketStreamStore.getStream(room_id, botUsername)
        webSocketStreamStore.upsertStream(room_id, botUsername, {
            content: existing?.content || '',
            thinkContent: existing?.thinkContent || '',
            contentType: existing?.contentType || 'reporter',
            eventId: event_id || existing?.eventId,
            finished: true,
            timestamp: Date.now(),
        })
    }
}

const { onClose } = useUserbotWebSocket(currentRoomId, handleWebSocketMessage, {
    manualConnect: true,
    enabled: isMessagePageActive,
})

watch(currentRoomId, (newRoomId, oldRoomId) => {
    if (oldRoomId && oldRoomId !== newRoomId) {
        webSocketStreamStore.clearRoomFinishedStreams(oldRoomId)
    }

    if (isMobile.value && newRoomId && newRoomId !== oldRoomId && mobilePanel.value === 'left') {
        setMobilePanel('middle')
    }
})

onClose(() => {
    webSocketStreamStore.clearFinishedStreams()
})

onMounted(() => {
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    window.addEventListener('app:openInternalBrowser', handleOpenInternalBrowser as EventListener)
    if (isMobile.value) {
        setMobilePanel('left')
    }
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateIsMobile)
    window.removeEventListener('app:openInternalBrowser', handleOpenInternalBrowser as EventListener)
    sidebarStore.setMessageMobilePanel('left')
})

const handleOpenCreateRoomDialog = () => {
    openCreateRoomDialog({
        defaultSpaceRoomId: 'default',
        onCreated: (roomId) => {
            void refreshRoomState({
                showLoading: true,
                loadingText: '正在刷新房间列表...',
                preferredRoomId: roomId,
            })
        },
    })
}



function openUserList() {
    openUserListDialog()
}



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
    width: 32px;
    height: 32px;
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
    flex: 0 0 25%;
    max-width: 25%;
    min-width: 0;
}

.message-internal-browser {
    width: 100%;
    height: 100%;
}

.message-internal-browser-stack {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
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