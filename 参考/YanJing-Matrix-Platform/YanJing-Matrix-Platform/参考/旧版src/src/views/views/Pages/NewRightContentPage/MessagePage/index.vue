<template>
    <div class="message-page" :class="{ 'message-page--mobile': isMobile }" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
        <div class="message-page__track" :style="trackStyle">
            <aside class="message-page__left">
                <LeftList :rooms="rooms" :current-room-id="currentRoomId || ''" :loading="roomsLoading"
                    @select-room="onSelectRoom"
                    @talk-request-from-organization-list="onTalkRequestFromOrganizationList" />
            </aside>
            <section class="message-page_center">
                <div v-if="currentRoomId" class="content-area">
                    <NewChat />
                </div>
                <div v-else class="welcome-content">
                    <div class="welcome-message">
                        <h2> {{ currentOrganizationName }} </h2>
                        <p>选择一个会话，或加入新的会话</p>
                    </div>
                </div>
            </section>
            <aside class="message-page__right">
                <!-- 预留右侧面板位置 -->
                <RightPanel />
            </aside>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, provide, watch, onMounted, onUnmounted } from 'vue'
import { useUserbotWebSocket } from '@/services/userbot/useUserbotWebSocket'
import NewChat from './NewChat'
import LeftList from './LeftList'
import RightPanel from './RightPanel'
import { useOrganizationStoreV2 } from '@/stores/organizationV2'


const chatContext = inject('chatContext') as any
const organizationStore = useOrganizationStoreV2()
const currentOrganizationName = computed(() => organizationStore.currentOrganization?.name || '未加入任何组织')

const emit = defineEmits<{
    (e: 'talk-request-from-organization-list', userid: string, createdRoomId?: string): void
}>()

type ChatInputController = {
    setText: (text: string) => void
}

const chatInputController = ref<ChatInputController | null>(null)

provide('registerChatInputController', (controller: ChatInputController | null) => {
    chatInputController.value = controller
})

provide('setChatInputText', (text: string) => {
    if (!chatInputController.value) {
        console.warn('[MessagePage] chat input controller not registered yet')
        return
    }
    chatInputController.value.setText(text)
})

const rooms = computed(() => (chatContext?.rooms?.value || []) as any[])
const roomsLoading = computed(() => false)

type MobilePanel = 'left' | 'center' | 'right'
const isMobile = ref(typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches)
const mobilePanel = ref<MobilePanel>('left')
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchDeltaX = ref(0)
const touchDeltaY = ref(0)

const panelOrder: MobilePanel[] = ['left', 'center', 'right']
const mobilePanelIndex = computed(() => panelOrder.indexOf(mobilePanel.value))
const trackStyle = computed(() => {
    if (!isMobile.value) return undefined
    return {
        transform: `translateX(-${mobilePanelIndex.value * 100}%)`
    }
})

const setMobilePanel = (panel: MobilePanel) => {
    const ctxMobile = chatContext?.isMobile?.value
    if (typeof ctxMobile === 'boolean') {
        isMobile.value = ctxMobile
    }
    mobilePanel.value = panel
}

provide('setMobilePanel', setMobilePanel)

const goPrevPanel = () => {
    const idx = mobilePanelIndex.value
    const nextIndex = (idx - 1 + panelOrder.length) % panelOrder.length
    setMobilePanel(panelOrder[nextIndex])
}

const goNextPanel = () => {
    const idx = mobilePanelIndex.value
    const nextIndex = (idx + 1) % panelOrder.length
    setMobilePanel(panelOrder[nextIndex])
}

const onSelectRoom = (roomId: string) => {
    // 关键：必须走 MainPage 的完整逻辑。
    // chatContext.setCurrentRoom 在 MainPage 内部会调用 handleSelectRoom（完整切房间流程）。
    const result = chatContext?.setCurrentRoom?.(roomId)
    if (roomId) {
        setMobilePanel('center')
    }
    return result
}

const onTalkRequestFromOrganizationList = (userid: string, createdRoomId?: string) => {
    emit('talk-request-from-organization-list', userid, createdRoomId)
}

// --- WebSocket & Streaming Logic Start ---
// 流式消息状态管理
interface StreamMessage {
    roomId: string
    content: string
    thinkContent: string
    contentType: 'think' | 'reporter'
    eventId?: string
    finished?: boolean
    timestamp: number
}

const streamMessages = ref<Map<string, StreamMessage>>(new Map())

// 初始化WebSocket连接
const handleWebSocketMessage = (data: any) => {
    console.log('[MessagePage] 收到WebSocket消息:', data)

    const { state, content_type, content, room_id, event_id } = data

    if (state === 'appending') {
        // 累积流式内容
        const key = room_id
        const existing = streamMessages.value.get(key)

        if (content_type === 'think') {
            // 思考过程
            console.log('[MessagePage] 接收思考内容:', content)
            streamMessages.value.set(key, {
                roomId: room_id,
                content: existing?.content || '',
                thinkContent: (existing?.thinkContent || '') + content,
                contentType: 'think',
                eventId: existing?.eventId,
                finished: false,
                timestamp: Date.now()
            })
        } else if (content_type === 'reporter' || content_type === 'text') {
            // 正式回答
            console.log('[MessagePage] 接收回答内容:', content)
            streamMessages.value.set(key, {
                roomId: room_id,
                content: (existing?.content || '') + content,
                thinkContent: existing?.thinkContent || '',
                contentType: 'reporter',
                eventId: existing?.eventId,
                finished: false,
                timestamp: Date.now()
            })
        }
    } else if (state === 'finish') {
        // 流式结束,等待 Matrix 正式消息
        console.log('[MessagePage] 流式任务完成,等待Matrix消息到达')
        // 记录结束标记，用于后续依据 event_id 清理占位
        if (room_id) {
            const existing = streamMessages.value.get(room_id)
            streamMessages.value.set(room_id, {
                roomId: room_id,
                content: existing?.content || '',
                thinkContent: existing?.thinkContent || '',
                contentType: (existing?.contentType as any) || 'reporter',
                eventId: event_id || existing?.eventId,
                finished: true,
                timestamp: Date.now(),
            })
        }
    }
}

// 使用 chatContext 中的 currentRoomId
const currentRoomId = computed(() => chatContext?.currentRoomId?.value)

// 与旧版 NewRightContent 保持一致：发送前手动触发连接（由 useUserbotWebSocket 内部识别房间内的 bot）
const { onClose, connect } = useUserbotWebSocket(
    currentRoomId,
    handleWebSocketMessage,
    { manualConnect: true }
)
// 拦截并包装 sendMessage，在发送消息前触发 WebSocket 连接
const originalChatContext = inject('chatContext') as any
const wrappedChatContext = {
    ...originalChatContext,
    sendMessage: async (...args: any[]) => {
        console.log('[MessagePage] 拦截 sendMessage，触发 bot WebSocket 连接...')
        connect()
        if (originalChatContext?.sendMessage) {
            return await originalChatContext.sendMessage(...args)
        }
    }
}

// 提供包装后的 chatContext 给子组件
provide('chatContext', wrappedChatContext)

// 监听房间切换,清理旧房间的流式消息
watch(() => currentRoomId.value, (newRoomId, oldRoomId) => {
    if (oldRoomId && oldRoomId !== newRoomId) {
        console.log('[MessagePage] 房间切换,清理旧房间流式消息:', oldRoomId)
        streamMessages.value.delete(oldRoomId)
    }

    if (newRoomId && isMobile.value) {
        setMobilePanel('center')
    }
})

// 提供流式消息和当前房间ID给子组件
provide('streamMessages', streamMessages)
provide('currentRoomId', currentRoomId)

// WebSocket 关闭时清理所有流式缓存
onClose(() => {
    console.log('[MessagePage] WebSocket连接已关闭，清理流式消息缓存')
    streamMessages.value.clear()
})

console.log('[MessagePage] WebSocket服务已初始化')
// --- WebSocket & Streaming Logic End ---

onUnmounted(() => {
})

const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768
    if (isMobile.value) {
        mobilePanel.value = mobilePanel.value || 'left'
    }
}

watch(
    () => chatContext?.isMobile?.value,
    (value) => {
        if (typeof value === 'boolean') {
            isMobile.value = value
        }
    },
    { immediate: true }
)

const handleTouchStart = (event: TouchEvent) => {
    if (!isMobile.value) return
    const touch = event.touches[0]
    touchStartX.value = touch.clientX
    touchStartY.value = touch.clientY
    touchDeltaX.value = 0
    touchDeltaY.value = 0
}

const handleTouchMove = (event: TouchEvent) => {
    if (!isMobile.value) return
    const touch = event.touches[0]
    touchDeltaX.value = touch.clientX - touchStartX.value
    touchDeltaY.value = touch.clientY - touchStartY.value

    const absX = Math.abs(touchDeltaX.value)
    const absY = Math.abs(touchDeltaY.value)
    if (absX > 10 && absX > absY * 0.8) {
        event.preventDefault()
    }
}

const handleTouchEnd = () => {
    if (!isMobile.value) return
    const deltaX = touchDeltaX.value
    const deltaY = touchDeltaY.value
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // 右滑返回列表：进一步降低触发门槛，避免偶发无法返回
    if (mobilePanel.value === 'center' && deltaX > 25 && absX > absY * 0.6) {
        goPrevPanel()
        return
    }

    if (absX > 40 && absX > absY * 1.0) {
        if (deltaX < 0) {
            goNextPanel()
        } else {
            goPrevPanel()
        }
    }
}

defineExpose({
    setMobilePanel,
    goPrevPanel,
    goNextPanel
})

onMounted(() => {
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile)
})
</script>

<style scoped>
.message-page {
    flex: 1;
    background: var(--bg-color-third);
    display: flex;
    flex-direction: row;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    max-width: none;
}

.message-page__track {
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 0;
}

.message-page__left {
    width: 100%;
    min-width: 180px;
    max-width: 250px;
    border-right: 1px solid var(--border-color);
    background: var(--bg-color-third);
    overflow: hidden;
}

.message-page_center {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.message-page__right {
    width: 100%;
    min-width: 250px;
    max-width: 300px;
border-left: 1px solid var(--border-color);
    background: var(--bg-color-third);
    overflow: hidden;
}

@media (max-width: 1024px) {
    .message-page__left {
        width: 240px;
        min-width: 200px;
    }
}

.message-page--mobile {
    flex-direction: row;
    overflow: hidden;
}

.message-page--mobile .message-page__track {
    width: 300%;
    transition: transform 0.25s ease;
}

.message-page--mobile .message-page__left,
.message-page--mobile .message-page_center,
.message-page--mobile .message-page__right {
    flex: 0 0 100%;
    width: 100%;
    max-width: none;
    min-width: 0;
    height: 100%;
    border: none;
}

.message-page--mobile .message-page__left {
    border-right: none;
}

.content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}

.welcome-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.welcome-message {
    text-align: center;
    max-width: 400px;
}

.welcome-message h2 {
    margin: 0 0 16px 0;
    color: var(--text-color);
    font-size: calc(var(--font-size-xxl) * 1.2);
    font-weight: 600;
}

.welcome-message p {
    margin: 0;
    color: var(--text-color-secondary);
    font-size: var(--font-size-lg);
    line-height: 1.5;
}
</style>
