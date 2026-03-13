import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { MatrixRoom } from '@/types/room'
import type { MatrixMessageItem } from '@/types/message'
import type { Room } from 'matrix-js-sdk'
import { AfterSwitchRoom } from '@/services/Project/BeforeAndAfter2'
import { initOrganization } from '@/services/ProjectStart'
import { MatrixClientRoom } from '@/services/Matrix/room'




export const SYSTEM_FUNCTIONS = [
    { id: 'Message', name: '消息' },
    { id: 'Mission', name: '任务' },
    { id: 'AIAdmin', name: 'AI管理员' },
    { id: 'Organization', name: '组织' },
    { id: 'SystemMap', name: '系统蓝图' },
    { id: 'Market', name: 'AI市场' },
    { id: 'AISupport', name: '客服小研' },
    { id: 'Registration', name: '注册认证' },
    { id: 'Recharge', name: '充值与兑换' },
    { id: 'Settings', name: '设置' },
] as const

export type SystemFunctionId = typeof SYSTEM_FUNCTIONS[number]['id']

/**
 * 全局系统房间与消息管理
 */


export const useSystemStore = defineStore('system', () => {

    // 房间列表，结构调整为带类型声明的包装对象数组：[{ type: 'bot' | 'user', room: Room }]
    const SystemRooms = ref<Array<{ type: 'bot' | 'user'; room: MatrixRoom | Room }>>([])

    // 当前选中的房间ID
    const currentMessageRoomId = ref<string>('')
    const currentMissionRoomId = ref<string>('')
    const currentSystemRoomId = computed<string>(() => {
        return currentFunction.value === 'Mission'
            ? currentMissionRoomId.value
            : currentMessageRoomId.value
    })

    /**
     * 这是一个二维数据表，或者叫键值对
     * key：房间
     * value：房间内消息
     */
    const SystemMessages = ref<Record<string, MatrixMessageItem[]>>({})

    /**
     * 回复草稿（仅用于 UI 显示与发送时关联）。
     */
    const replyDraft = ref<null | {
        roomId: string
        eventId: string
        senderName: string
        content: string
    }>(null)

    /**
     * 编辑草稿（用于编辑消息）。
     */
    const editDraft = ref<null | {
        roomId: string
        eventId: string
        content: string
    }>(null)

    /**
     * 转发选择态。
     */
    const forwardSelecting = ref(false)
    const forwardSelectedIds = ref<string[]>([])
    const forwardRoomId = ref<string>('')

    /**
     * 消息页右侧内嵌浏览器状态。
     */
    const internalBrowserVisible = ref(false)
    const internalBrowserUrl = ref('')
    const internalBrowserUrls = ref<string[]>([])










    /**
     * 这是一个全局页面状态切换组件
     */
    const currentFunction = ref<SystemFunctionId>('Message')

    function getAvailableRoomIdsByType(type: 'user' | 'bot'): string[] {
        return [...SystemRooms.value]
            .filter((item) => item.type === type)
            .sort((a, b) => MatrixClientRoom.compareRoomsForList(a.room, b.room))
            .map((item) => ('roomId' in item.room ? item.room.roomId : ''))
            .filter(Boolean)
    }

    function getFallbackRoomIdForFunction(func: SystemFunctionId): string {
        if (func === 'Mission') {
            return getAvailableRoomIdsByType('bot')[0] || ''
        }
        if (func === 'Message') {
            return getAvailableRoomIdsByType('user')[0] || ''
        }
        return ''
    }

    async function setCurrentFunction(func: SystemFunctionId) {
        console.log('[System:useSystemStore:setCurrentFunction]', func)
        const previousRoomId = currentSystemRoomId.value
        currentFunction.value = func
        
        if (func === 'Organization') {
            await initOrganization()
        }

        if (func === 'Message' || func === 'Mission') {
            const nextRoomId = currentSystemRoomId.value || getFallbackRoomIdForFunction(func)
            if (func === 'Mission') {
                currentMissionRoomId.value = nextRoomId
            } else {
                currentMessageRoomId.value = nextRoomId
            }
            if (nextRoomId && nextRoomId !== previousRoomId) {
                AfterSwitchRoom(nextRoomId)
            }
        }

    }










    function setTaggedSystemRooms(rooms: Array<{ type: 'bot' | 'user'; room: MatrixRoom | Room }>) {
        SystemRooms.value = rooms
    }

    function setSystemRooms(rooms: Array<MatrixRoom | Room>) {
        SystemRooms.value = rooms.map((room) => ({
            type: 'user',
            room,
        }))
    }

    /**
     * 根据房间ID，反向获取该房间的类型（bot 或 user）
     * 输入：roomId
     * 输出：'bot' | 'user' | null (未匹配到时返回 null)
     */
    function getRoomTypeById(roomId: string): 'bot' | 'user' | null {
        const found = SystemRooms.value.find(item => {
            const currentRoomId = ('roomId' in item.room) ? item.room.roomId : null;
            return currentRoomId === roomId;
        })
        return found ? found.type : null;
    }

    function setCurrentSystemRoomId(roomId: string) {
        if (currentFunction.value === 'Mission') {
            currentMissionRoomId.value = roomId
        } else {
            currentMessageRoomId.value = roomId
        }

        AfterSwitchRoom(roomId)
    }

    function clearCurrentRoomIds() {
        currentMessageRoomId.value = ''
        currentMissionRoomId.value = ''
    }






































    
    function setRoomMessages(roomId: string, messages: MatrixMessageItem[]) {
        SystemMessages.value[roomId] = messages
    }

    function appendRoomMessages(roomId: string, messages: MatrixMessageItem[]) {
        const existing = SystemMessages.value[roomId] ?? []
        SystemMessages.value[roomId] = [...existing, ...messages]
    }

    /**
     * 设置回复草稿。
     * 输入：roomId、eventId、senderName、content。
     * 输出：void。
     * 逻辑：覆盖当前草稿。
     */
    function setReplyDraft(payload: { roomId: string; eventId: string; senderName: string; content: string }) {
        replyDraft.value = payload
    }

    /**
     * 清空回复草稿。
     * 输入：无。
     * 输出：void。
     */
    function clearReplyDraft() {
        replyDraft.value = null
    }

    /**
     * 设置编辑草稿。
     * 输入：roomId、eventId、content。
     * 输出：void。
     * 逻辑：覆盖当前草稿。
     */
    function setEditDraft(payload: { roomId: string; eventId: string; content: string }) {
        editDraft.value = payload
    }

    /**
     * 清空编辑草稿。
     * 输入：无。
     * 输出：void。
     */
    function clearEditDraft() {
        editDraft.value = null
    }

    /**
     * 开启转发选择模式，并默认选中一条消息。
     * 输入：roomId、eventId。
     * 输出：void。
     */
    function startForwardSelection(roomId: string, eventId: string) {
        forwardSelecting.value = true
        forwardRoomId.value = roomId
        forwardSelectedIds.value = [eventId]
    }

    /**
     * 切换某条消息的转发选择状态。
     * 输入：eventId。
     * 输出：void。
     */
    function toggleForwardSelection(eventId: string) {
        const set = new Set(forwardSelectedIds.value)
        if (set.has(eventId)) {
            set.delete(eventId)
        } else {
            set.add(eventId)
        }
        forwardSelectedIds.value = [...set]
    }

    /**
     * 清空转发选择状态。
     * 输入：无。
     * 输出：void。
     */
    function clearForwardSelection() {
        forwardSelecting.value = false
        forwardSelectedIds.value = []
        forwardRoomId.value = ''
    }

    /**
     * 打开右侧内嵌浏览器。
     * 输入：url。
     * 输出：void。
     */
    function openInternalBrowser(url: string) {
        if (!internalBrowserUrls.value.includes(url)) {
            internalBrowserUrls.value = [...internalBrowserUrls.value, url]
        }
        internalBrowserUrl.value = url
        internalBrowserVisible.value = true
    }

    /**
     * 关闭右侧内嵌浏览器。
     * 输入：无。
     * 输出：void。
     */
    function closeInternalBrowser() {
        internalBrowserVisible.value = false
    }


    return {
        SystemRooms,
        currentMessageRoomId,
        currentMissionRoomId,
        currentSystemRoomId,
        SystemMessages,
        replyDraft,
        editDraft,
        forwardSelecting,
        forwardSelectedIds,
        forwardRoomId,
        internalBrowserVisible,
        internalBrowserUrl,
        internalBrowserUrls,
        setSystemRooms,
        setTaggedSystemRooms,
        getRoomTypeById,
        setCurrentSystemRoomId,
        clearCurrentRoomIds,
        setRoomMessages,
        appendRoomMessages,
        setReplyDraft,
        clearReplyDraft,
        setEditDraft,
        clearEditDraft,
        startForwardSelection,
        toggleForwardSelection,
        clearForwardSelection,
        openInternalBrowser,
        closeInternalBrowser,
        currentFunction,
        setCurrentFunction
    }

})