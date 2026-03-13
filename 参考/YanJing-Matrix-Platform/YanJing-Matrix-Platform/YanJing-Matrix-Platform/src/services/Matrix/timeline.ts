import type { MatrixClient, MatrixEvent, Room } from 'matrix-js-sdk'
import { ClientEvent, RoomEvent } from 'matrix-js-sdk'
import type { MessageEvent } from 'matrix-events-sdk'
import { matrixEventManager } from '@/services/Matrix/eventManager'
import { MatrixEventType } from '@/types/eventManager'
import type { MessageEventPayload } from '@/types/eventManager'
import type { MatrixSystemEventKind, MatrixTimelineItem } from '@/types/timeline'
import { useMatrixTimelineStore } from '@/stores/matrixTimeline'

// 单次历史拉取上限（避免一次性拉取过多）
const MAX_HISTORY_LIMIT = 20

class MatrixTimelineService {
  private client: MatrixClient | null = null
  private disposers: Array<() => void> = []

  bindClient(client: MatrixClient): void {
    if (this.client === client) return
    this.unbindClient()
    this.client = client
    this.attachListeners()
  }

  unbindClient(): void {
    for (const dispose of this.disposers) dispose()
    this.disposers = []
    this.client = null
  }

  /** 拉取历史消息（最多 20 条） */
  async loadHistory(roomId: string, limit = MAX_HISTORY_LIMIT): Promise<MatrixTimelineItem[]> {
    const client = this.client
    const store = useMatrixTimelineStore()
    if (!client) return []

    const room = client.getRoom(roomId)
    if (!room) return []

    const safeLimit = Math.min(Math.max(1, limit), MAX_HISTORY_LIMIT)
    store.setLoading(roomId, true)

    try {
      await client.scrollback(room, safeLimit)
      const items = this.buildItemsFromRoom(room)
      const existingIds = new Set(store.getRoomItems(roomId).map((it) => it.eventId))
      const freshItems = items.filter((it) => !existingIds.has(it.eventId))
      store.prependRoomItems(roomId, freshItems)
      store.recalcUnreadCount(roomId)
      return freshItems
    } finally {
      store.setLoading(roomId, false)
    }
  }

  /**
   * 重新计算某房间每条消息的未读状态
   * 规则：调用 room.hasUserReadEvent(userId, eventId)
   */
  refreshUnreadForRoom(roomId: string): void {
    const client = this.client
    if (!client) return
    const room = client.getRoom(roomId)
    if (!room) return

    const store = useMatrixTimelineStore()
    const userId = client.getUserId() ?? ''
    const list = store.getRoomItems(roomId).map((item) => {
      if (!item.eventId || !userId) return item
      if (item.senderId && item.senderId === userId) {
        return { ...item, isUnread: false }
      }
      const isUnread = !room.hasUserReadEvent(userId, item.eventId)
      return { ...item, isUnread }
    })
    store.setRoomItems(roomId, list)
    store.recalcUnreadCount(roomId)
  }

  /** 标记房间已读（只更新本地未读显示） */
  markRoomRead(roomId: string): void {
    const store = useMatrixTimelineStore()
    const list = store.getRoomItems(roomId).map((item) => ({ ...item, isUnread: false }))
    store.setRoomItems(roomId, list)
    store.setRoomUnreadCount(roomId, 0)
  }

  private attachListeners(): void {
    const client = this.client
    if (!client) return

    const onClient = <E extends Parameters<MatrixClient['on']>[0]>(event: E, handler: (...args: never[]) => void) => {
      client.on(event, handler as never)
      this.disposers.push(() => client.off(event, handler as never))
    }

    const onMessageEvent = (
      event:
        | typeof MatrixEventType.MESSAGE_RECEIVED
        | typeof MatrixEventType.MESSAGE_UPDATED
        | typeof MatrixEventType.MESSAGE_DELETED
        | typeof MatrixEventType.MESSAGE_SENT,
      handler: (payload: MessageEventPayload) => void,
    ) => {
      const dispose = matrixEventManager.on(event, handler)
      this.disposers.push(dispose)
    }

    onMessageEvent(MatrixEventType.MESSAGE_RECEIVED, this.handleMessageReceived)
    onMessageEvent(MatrixEventType.MESSAGE_UPDATED, this.handleMessageUpdated)
    onMessageEvent(MatrixEventType.MESSAGE_DELETED, this.handleMessageDeleted)
    onMessageEvent(MatrixEventType.MESSAGE_SENT, this.handleMessageStatus)

    // 用于生成“系统提示”类消息（如创建/加入/离开）
    onClient(RoomEvent.Timeline, this.handleTimelineSystemEvent)
    onClient(ClientEvent.Sync, this.handleSync)
  }

  /**
   * 初次同步完成后，将当前 live timeline 填充到 store
   * 注意：这里只是“首次同步构建”，历史分页通过 loadHistory 完成
   */
  private handleSync = (state: string) => {
    if (state !== 'PREPARED') return
    const client = this.client
    if (!client) return
    const rooms = client.getRooms()
    const store = useMatrixTimelineStore()

    for (const room of rooms) {
      const items = this.buildItemsFromRoom(room)
      store.setRoomItems(room.roomId, items)
      store.recalcUnreadCount(room.roomId)
      const lastMessage = [...items].reverse().find((it) => it.type === 'message')
      if (lastMessage) {
        store.setRoomPreview(room.roomId, lastMessage.content)
      }
    }
  }

  /** 新消息写入时间线，并更新预览与未读 */
  private handleMessageReceived = (payload: MessageEventPayload) => {
    const item = this.buildMessageItem(payload)
    if (!item) return
    const store = useMatrixTimelineStore()
    store.upsertRoomItem(item.roomId, item)
    store.setRoomPreview(item.roomId, item.content)
    store.recalcUnreadCount(item.roomId)
  }

  /** 编辑消息（替换原事件） */
  private handleMessageUpdated = (payload: MessageEventPayload) => {
    const store = useMatrixTimelineStore()
    const item = this.buildMessageItem(payload)
    if (!item) return

    const replacedId = this.getReplacedEventId(payload.event)
    if (replacedId) {
      store.upsertRoomItem(item.roomId, { ...item, eventId: replacedId })
    } else {
      store.upsertRoomItem(item.roomId, item)
    }
    store.setRoomPreview(item.roomId, item.content)
  }

  /** 红撤消息 */
  private handleMessageDeleted = (payload: MessageEventPayload) => {
    const store = useMatrixTimelineStore()
    const redacts = (payload.event as unknown as { getRedacts?: () => string | null }).getRedacts?.()
    const targetId = redacts || payload.event.getId?.() || ''
    if (!targetId) return
    const roomId = payload.room.roomId
    const beforeCount = store.getRoomItems(roomId).length
    store.removeRoomItem(roomId, targetId)
    const afterCount = store.getRoomItems(roomId).length
    if (afterCount === beforeCount) {
      const rebuilt = this.buildItemsFromRoom(payload.room)
      store.setRoomItems(roomId, rebuilt)
    }
    store.recalcUnreadCount(roomId)
    this.refreshRoomPreview(roomId)
  }

  /** 本地发送状态更新（发送中/失败/成功） */
  private handleMessageStatus = (payload: MessageEventPayload) => {
    const item = this.buildMessageItem(payload)
    if (!item) return
    const store = useMatrixTimelineStore()
    store.upsertRoomItem(item.roomId, item)
  }

  /** 房间时间线中的系统事件提示（创建/加入/邀请/离开等） */
  private handleTimelineSystemEvent = (event: MatrixEvent, room: Room, toStartOfTimeline: boolean) => {
    if (toStartOfTimeline) return

    const systemItem = this.buildSystemItem(event, room)
    if (!systemItem) return

    const store = useMatrixTimelineStore()
    store.upsertRoomItem(room.roomId, systemItem)
  }

  /** 从 room 的 live timeline 生成时间线条目 */
  private buildItemsFromRoom(room: Room): MatrixTimelineItem[] {
    const events = room.getLiveTimeline().getEvents()
    const items: MatrixTimelineItem[] = []

    for (const event of events) {
      const systemItem = this.buildSystemItem(event, room)
      if (systemItem) {
        items.push(systemItem)
        continue
      }

      const messageItem = this.buildMessageItem({ event, room })
      if (messageItem) items.push(messageItem)
    }

    items.sort((a, b) => a.timestamp - b.timestamp)
    return items
  }

  /**
   * 根据最新的消息类条目更新房间预览。
   * 仅使用 type === 'message' 的内容，避免系统事件污染预览。
   */
  private refreshRoomPreview(roomId: string): void {
    const store = useMatrixTimelineStore()
    const items = store.getRoomItems(roomId)
    const lastMessage = [...items].reverse().find((it) => it.type === 'message')
    store.setRoomPreview(roomId, lastMessage?.content || '暂无消息')
  }

  /** 生成消息条目（普通消息） */
  private buildMessageItem(payload: Pick<MessageEventPayload, 'event' | 'room' | 'message' | 'status'>): MatrixTimelineItem | null {
    const { event, room } = payload
    const eventType = event.getType?.()
    if (eventType !== 'm.room.message') return null
    if (event.isRedacted?.()) return null

    const eventId = event.getId?.() || ''
    if (!eventId) return null

    const senderId = event.getSender?.() ?? undefined
    const senderName = senderId ? room.getMember?.(senderId)?.name : undefined
    const timestamp = event.getTs?.() ?? Date.now()
    const content = this.getMessageBody(event, payload.message)
    const isUnread = this.getUnreadFlag(room, eventId, senderId)

    return {
      roomId: room.roomId,
      eventId,
      type: 'message',
      senderId,
      senderName,
      timestamp,
      content,
      rawType: eventType,
      status: payload.status ?? null,
      isUnread,
    }
  }

  /** 生成系统提示条目（创建/加入/邀请/离开等） */
  private buildSystemItem(event: MatrixEvent, room: Room): MatrixTimelineItem | null {
    const eventType = event.getType?.()
    const eventId = event.getId?.() || ''
    if (!eventId) return null

    if (eventType === 'm.room.create') {
      const senderId = event.getSender?.() ?? undefined
      const senderName = senderId ? room.getMember?.(senderId)?.name : senderId
      return this.createSystemItem(room, event, 'room.create', `${senderName ?? '某人'} 创建了对话`)
    }

    if (eventType === 'm.room.member') {
      const content = event.getContent?.() as { membership?: string } | undefined
      const membership = content?.membership ?? ''
      const unsigned = (event as unknown as { getUnsigned?: () => { prev_content?: { membership?: string } } | undefined }).getUnsigned?.()
      const prevMembership =
        unsigned?.prev_content?.membership
        || (content as { prev_content?: { membership?: string } } | undefined)?.prev_content?.membership
      const targetId = event.getStateKey?.() || ''
      const targetName = targetId ? room.getMember?.(targetId)?.name : targetId
      const senderId = event.getSender?.() ?? undefined
      const senderName = senderId ? room.getMember?.(senderId)?.name : senderId

      if (membership === 'join' && prevMembership !== 'join') {
        return this.createSystemItem(room, event, 'member.join', `${targetName ?? '某人'} 加入了对话`)
      }

      if (membership === 'leave') {
        const text = targetId && senderId && targetId !== senderId
          ? `${senderName ?? '某人'} 将 ${targetName ?? targetId} 移出了对话`
          : `${targetName ?? '某人'} 离开了对话`
        return this.createSystemItem(room, event, 'member.leave', text)
      }

      if (membership === 'invite') {
        return this.createSystemItem(room, event, 'member.invite', `${senderName ?? '某人'} 邀请了 ${targetName ?? targetId}`)
      }

      if (membership === 'ban') {
        return this.createSystemItem(room, event, 'member.ban', `${senderName ?? '某人'} 将 ${targetName ?? targetId} 拉黑`)
      }
    }

    return null
  }

  private createSystemItem(room: Room, event: MatrixEvent, kind: MatrixSystemEventKind, content: string): MatrixTimelineItem {
    const senderId = event.getSender?.() ?? undefined
    const senderName = senderId ? room.getMember?.(senderId)?.name : senderId
    return {
      roomId: room.roomId,
      eventId: event.getId?.() || `${room.roomId}_${event.getTs?.() ?? Date.now()}`,
      type: 'system',
      systemKind: kind,
      senderId,
      senderName,
      timestamp: event.getTs?.() ?? Date.now(),
      content,
      rawType: event.getType?.(),
      isUnread: this.getUnreadFlag(room, event.getId?.() || '', senderId),
    }
  }

  /**
   * 提取消息文本
   * 优先使用 matrix-events-sdk 的解析结果，其次兜底读取 raw content
   */
  private getMessageBody(event: MatrixEvent, parsed?: MessageEvent): string {
    if (parsed?.text) return parsed.text
    const content = event.getContent?.() as { body?: string; 'm.new_content'?: { body?: string } } | undefined
    if (content?.['m.new_content']?.body) return content['m.new_content'].body
    if (content?.body) return content.body
    return '[无法显示的消息]'
  }

  /** 基于 Matrix 读回执判断是否未读 */
  private getUnreadFlag(room: Room, eventId: string, senderId?: string): boolean {
    const client = this.client
    const userId = client?.getUserId?.() ?? ''
    if (!userId || !eventId) return false
    if (senderId && senderId === userId) return false
    return !room.hasUserReadEvent(userId, eventId)
  }

  private getReplacedEventId(event: MatrixEvent): string | null {
    const relation = (event as unknown as { getRelation?: () => { event_id?: string } | null }).getRelation?.()
    if (relation?.event_id) return relation.event_id
    const content = event.getContent?.() as { 'm.relates_to'?: { event_id?: string } } | undefined
    return content?.['m.relates_to']?.event_id ?? null
  }
}

export const matrixTimelineService = new MatrixTimelineService()
