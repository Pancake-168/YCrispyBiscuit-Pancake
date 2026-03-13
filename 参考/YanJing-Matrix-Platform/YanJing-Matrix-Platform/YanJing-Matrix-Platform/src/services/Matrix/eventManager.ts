// Matrix 可扩展事件解析器（用于把原始事件转换为可渲染对象）
import { ExtensibleEvents, MessageEvent, M_MESSAGE } from 'matrix-events-sdk'
import type { ExtensibleEvent } from 'matrix-events-sdk'
// Matrix SDK 事件源与类型
import {
    ClientEvent,
    MatrixClient,
    MatrixEvent,
    RoomEvent,
    RoomMemberEvent,
    type EventStatus,
    type Room,
    type RoomMember,
    type SyncState,
    type SyncStateData
} from 'matrix-js-sdk'
import {
    MatrixEventType,
    type MatrixEventPayloadMap,
    type MatrixEventType as MatrixEventTypeKey,
    type MessageEventPayload,
    type ReadReceiptPayload,
    type RoomMembershipPayload,
    type RoomSummaryPayload,
    type SyncPayload,
    type TypingPayload
} from '@/types/eventManager'


/**
 * 消息相关事件负载
 * event: 原始 MatrixEvent
 * room: 事件所属房间
 * parsed: 经过 matrix-events-sdk 解析后的 ExtensibleEvent（若可解析）
 * message: parsed 为 MessageEvent 时的强类型结果
 * isNew: 是否为新到事件（/sync 实时事件）
 * status/oldStatus: 本地回声状态变化时使用
 */
export type {
    MessageEventPayload,
    RoomMembershipPayload,
    TypingPayload,
    ReadReceiptPayload,
    SyncPayload,
    RoomSummaryPayload,
    MatrixEventPayloadMap
}

/** 内部监听器函数签名 */
type Listener<T> = (payload: T) => void

/**
 * 轻量事件总线（只提供本文件所需的基础能力）
 * - 不依赖 Node.js EventEmitter，避免在渲染进程/类型上引入复杂度
 * - 仅支持 on/once/off/emit/removeAllListeners/listenerCount
 */
class SimpleEventEmitter<Events extends Record<string, unknown>> {
    private listeners = new Map<keyof Events, Set<Listener<Events[keyof Events]>>>()

    on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
        const set = this.listeners.get(event) ?? new Set()
        set.add(listener as Listener<Events[keyof Events]>)
        this.listeners.set(event, set)
        return () => this.off(event, listener)
    }

    once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
        const wrapped: Listener<Events[K]> = (payload) => {
            this.off(event, wrapped)
            listener(payload)
        }
        return this.on(event, wrapped)
    }

    off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
        const set = this.listeners.get(event)
        if (!set) return
        set.delete(listener as Listener<Events[keyof Events]>)
        if (set.size === 0) this.listeners.delete(event)
    }

    emit<K extends keyof Events>(event: K, payload: Events[K]): void {
        const set = this.listeners.get(event)
        if (!set) return
        for (const listener of [...set]) {
            listener(payload as Events[K])
        }
    }

    removeAllListeners(event?: keyof Events): void {
        if (!event) {
            this.listeners.clear()
            return
        }
        this.listeners.delete(event)
    }

    listenerCount(event: keyof Events): number {
        return this.listeners.get(event)?.size ?? 0
    }
}


/**
 * Matrix 事件管理器
 * - 绑定 MatrixClient 后，统一监听 SDK 事件
 * - 转换并派发应用层事件（MatrixEventType）
 * - 对消息事件进行可扩展事件解析
 */
export class MatrixEventManager {
    private client: MatrixClient | null = null
    private disposers: Array<() => void> = []
    private emitter = new SimpleEventEmitter<MatrixEventPayloadMap>()
    private parser: ExtensibleEvents
    private readMarkersSupported = true

    /**
     * @param options.parser 可选自定义 ExtensibleEvents 实例（用于注册自定义事件解析器）
     */
    constructor(options?: { parser?: ExtensibleEvents }) {
        this.parser = options?.parser ?? ExtensibleEvents.defaultInstance
    }

    /** 绑定 MatrixClient（会自动挂载监听器） */
    bindClient(client: MatrixClient): void {
        if (this.client === client) return
        this.unbindClient()
        this.client = client
        this.attachClientListeners()
    }

    /** 解绑 MatrixClient（会移除所有监听器） */
    unbindClient(): void {
        for (const dispose of this.disposers) dispose()
        this.disposers = []
        this.client = null
    }

    /** 订阅事件（返回取消订阅函数） */
    on<K extends MatrixEventTypeKey>(event: K, listener: Listener<MatrixEventPayloadMap[K]>): () => void {
        return this.emitter.on(event, listener)
    }

    /** 订阅一次性事件（触发后自动解绑） */
    once<K extends MatrixEventTypeKey>(event: K, listener: Listener<MatrixEventPayloadMap[K]>): () => void {
        return this.emitter.once(event, listener)
    }

    /** 取消订阅 */
    off<K extends MatrixEventTypeKey>(event: K, listener: Listener<MatrixEventPayloadMap[K]>): void {
        this.emitter.off(event, listener)
    }

    /** 清理某类事件或全部事件的监听器 */
    removeAllListeners(event?: MatrixEventTypeKey): void {
        this.emitter.removeAllListeners(event)
    }

    /** 获取某类事件的监听器数量 */
    listenerCount(event: MatrixEventTypeKey): number {
        return this.emitter.listenerCount(event)
    }

    /**
     * 标记房间已读（发送 Read Receipt + Read Marker）。
     * 输入：roomId、eventId（可选）。
     * 输出：Promise<void>。
     * 逻辑：定位目标事件，发送 read receipt，并设置 read marker。
     */
    async markAsRead(roomId: string, eventId?: string): Promise<void> {
        const client = this.client
        if (!client) return

        const room = client.getRoom(roomId)
        if (!room) return

        const targetEventId = eventId || room.getLastLiveEvent?.()?.getId?.()
        if (!targetEventId) return
        if (!targetEventId.startsWith('$')) return

        let matrixEvent: MatrixEvent | null = (room as unknown as { findEventById?: (id: string) => MatrixEvent | null })
            .findEventById?.(targetEventId) ?? null

        if (!matrixEvent) {
            const liveEvents = room.getLiveTimeline?.()?.getEvents?.() || []
            matrixEvent = liveEvents.find((ev: MatrixEvent) => ev?.getId?.() === targetEventId) ?? null
        }

        try {
            if (matrixEvent?.getId) {
                await client.sendReadReceipt(matrixEvent)
            }
        } catch {
            // ignore
        }

        try {
            if (this.readMarkersSupported && client.setRoomReadMarkers) {
                await client.setRoomReadMarkers(roomId, targetEventId, matrixEvent ?? undefined)
            }
        } catch (error: unknown) {
            const httpStatus = (error as { httpStatus?: number } | undefined)?.httpStatus
            if (httpStatus === 404) {
                this.readMarkersSupported = false
            }
            // ignore
        }

        try {
            if (matrixEvent?.getId && (client as unknown as { acknowledgeEvent?: (event: MatrixEvent, room: Room) => void }).acknowledgeEvent) {
                ;(client as unknown as { acknowledgeEvent: (event: MatrixEvent, room: Room) => void }).acknowledgeEvent(matrixEvent, room)
            }
        } catch {
            // ignore
        }
    }

    /**
     * 绑定 MatrixClient 的底层事件
     * 这里使用 SDK 的 EventEmitter 机制，并在解绑时统一移除
     */
    private attachClientListeners(): void {
        const client = this.client
        if (!client) return

        // 统一封装 on/off，保证自动解绑
        const onClient = <E extends Parameters<MatrixClient['on']>[0]>(event: E, handler: (...args: never[]) => void) => {
            client.on(event, handler as never)
            this.disposers.push(() => client.off(event, handler as never))
        }

        onClient(ClientEvent.Sync, this.handleSync)
        onClient(RoomEvent.Timeline, this.handleTimeline)
        onClient(RoomEvent.LocalEchoUpdated, this.handleLocalEchoUpdated)
        onClient(RoomEvent.Redaction, this.handleRedaction)
        onClient(RoomEvent.MyMembership, this.handleMyMembership)
        onClient(RoomMemberEvent.Typing, this.handleTyping)
        onClient(RoomEvent.Receipt, this.handleReceipt)
        onClient(RoomEvent.Name, this.handleRoomName)
    }

    /** 同步状态事件（对应 ClientEvent.Sync） */
    private handleSync = (state: SyncState, prevState: SyncState | null, data?: SyncStateData) => {
        if (state === 'SYNCING' && prevState !== 'SYNCING') {
            this.emitter.emit(MatrixEventType.SYNC_STARTED, { state, prevState, data })
        }

        if (state === 'PREPARED') {
            this.emitter.emit(MatrixEventType.SYNC_COMPLETED, { state, prevState, data })
            this.emitter.emit(MatrixEventType.CONNECTED, { state })
        }

        if (state === 'ERROR') {
            this.emitter.emit(MatrixEventType.SYNC_ERROR, { state, prevState, data, error: data?.error ?? undefined })
        }

        if (state === 'RECONNECTING') {
            this.emitter.emit(MatrixEventType.RECONNECTING, { state })
        }

        if (state === 'STOPPED') {
            this.emitter.emit(MatrixEventType.DISCONNECTED, { state })
        }
    }

    /** 房间时间线事件（对应 RoomEvent.Timeline） */
    private handleTimeline = (event: MatrixEvent, room: Room, toStartOfTimeline: boolean) => {
        if (toStartOfTimeline) return

        const parsed = this.tryParseExtensible(event)
        const message = this.isMessageEvent(parsed) ? (parsed as MessageEvent) : undefined

        const eventType = event.getType?.() ?? ''
        if (eventType === 'm.room.message') {
            if (this.isEditEvent(event)) {
                this.emitter.emit(MatrixEventType.MESSAGE_UPDATED, { event, room, parsed, message, isNew: true })
                return
            }

            if (this.isRedactionEvent(event)) {
                this.emitter.emit(MatrixEventType.MESSAGE_DELETED, { event, room, parsed, message, isNew: true })
                return
            }

            this.emitter.emit(MatrixEventType.MESSAGE_RECEIVED, { event, room, parsed, message, isNew: true })
            return
        }

        if (eventType === 'm.room.redaction') {
            this.emitter.emit(MatrixEventType.MESSAGE_DELETED, { event, room, parsed, message, isNew: true })
            return
        }

        if (
            eventType === 'm.room.topic'
            || eventType === 'm.room.name'
            || eventType === 'm.room.member'
            || eventType === 'm.room.create'
        ) {
            this.emitter.emit(MatrixEventType.ROOM_UPDATED, { room, event })
        }
    }

    /** 本地回声更新（发送中/发送失败/回执替换等） */
    private handleLocalEchoUpdated = (event: MatrixEvent, room: Room, _oldEventId?: string, oldStatus?: EventStatus | null) => {
        const parsed = this.tryParseExtensible(event)
        const message = this.isMessageEvent(parsed) ? (parsed as MessageEvent) : undefined
        const status = (event as unknown as { getStatus?: () => EventStatus | null }).getStatus?.() ?? null

        this.emitter.emit(MatrixEventType.MESSAGE_SENT, { event, room, parsed, message, status, oldStatus })
    }

    /** 红撤事件（删除消息） */
    private handleRedaction = (event: MatrixEvent, room: Room) => {
        this.emitter.emit(MatrixEventType.MESSAGE_DELETED, { event, room })
    }

    /** 自身在房间中的成员关系变化 */
    private handleMyMembership = (room: Room, membership: string, prevMembership?: string) => {
        const payload = { room, membership, prevMembership }
        if (membership === 'join') {
            this.emitter.emit(MatrixEventType.ROOM_JOINED, payload)
            return
        }

        if (membership === 'leave' || membership === 'ban') {
            this.emitter.emit(MatrixEventType.ROOM_LEFT, payload)
            return
        }

        if (membership === 'invite') {
            this.emitter.emit(MatrixEventType.ROOM_INVITED, payload)
            return
        }
    }

    /** 正在输入事件 */
    private handleTyping = (event: MatrixEvent, member: RoomMember) => {
        const room = member.roomId ? this.client?.getRoom(member.roomId) : null
        if (!room) return
        this.emitter.emit(MatrixEventType.TYPING, { event, room, member, typing: !!member.typing })
    }

    /** 已读回执事件 */
    private handleReceipt = (event: MatrixEvent, room: Room) => {
        this.emitter.emit(MatrixEventType.READ_RECEIPT, { event, room })
    }

    /** 房间元信息更新（这里仅处理房间名变化） */
    private handleRoomName = (room: Room) => {
        this.emitter.emit(MatrixEventType.ROOM_UPDATED, { room })
    }

    /** 尝试将原始 MatrixEvent 解析为 ExtensibleEvent */
    private tryParseExtensible(event: MatrixEvent): ExtensibleEvent | undefined {
        try {
            const type = event.getType?.() ?? ''
            const content = event.getContent?.() ?? {}
            return this.parser.parse({ type, content }) ?? undefined
        } catch (error) {
            console.warn('[System:MatrixEventManager:tryParseExtensible] 解析事件失败', event, error)
            return undefined
        }
    }

    /** 判断解析结果是否为消息类事件 */
    private isMessageEvent(parsed?: ExtensibleEvent): boolean {
        if (!parsed) return false
        if (parsed instanceof MessageEvent) return true
        return parsed.isEquivalentTo(M_MESSAGE)
    }

    /** 判断是否为编辑事件（m.replace 或包含 m.new_content） */
    private isEditEvent(event: MatrixEvent): boolean {
        const content = event.getContent?.() ?? {}
        if (typeof content === 'object' && content && 'm.new_content' in content) return true
        const relation = (event as unknown as { getRelation?: () => { rel_type?: string } | null }).getRelation?.()
        return relation?.rel_type === 'm.replace'
    }

    /** 判断事件是否已被红撤 */
    private isRedactionEvent(event: MatrixEvent): boolean {
        return !!event.isRedacted?.()
    }
}


export const matrixEventManager = new MatrixEventManager()
