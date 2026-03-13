// Matrix 事件系统管理器
// 负责处理Matrix客户端的事件订阅、消息管理、时间线等功能
// 独立于客户端的核心登录认证功能，提供完整的实时通信能力

import type {
  EventCallback,
  EventListener,
  MessageEventData,
  RoomEventData,
  ReadReceiptEventData,
  SyncEventData,
  RoomTimeline,
  RoomSummary,
  MatrixMessage,
  RoomSummaryEventData,
  RoomEventSummary
} from '../../types'
import { MatrixEventType } from '../../types'
import { resolveUserDisplayName } from '@/utils/displayName'

/**
 * Matrix事件系统管理器
 * 提供完整的事件订阅、消息管理、时间线功能
 */
export class MatrixEventManager {
  // 事件监听器存储
  private eventListeners: Map<string, EventListener[]> = new Map()

  // 房间时间线存储
  private roomTimelines: Map<string, RoomTimeline> = new Map()

  // 房间摘要存储
  private roomSummaries: Map<string, RoomSummary> = new Map()

  // 监听器ID计数器
  private listenerIdCounter = 0

  // Matrix客户端实例引用
  private matrixClient: any = null

  // 标记是否已经完成初始同步后的房间数据广播
  private hasBroadcastInitialSummaries = false

  /**
   * 设置Matrix客户端实例
   */
  setMatrixClient(client: any): void {
    this.matrixClient = client
    this.hasBroadcastInitialSummaries = false
  }

  /**
   * 获取指定房间中的 MatrixEvent
   * 优先从房间缓存与实时时间线中查找，找不到时回退到 getEventTimeline 进行定位。
   *
   * 注意：返回值为 matrix-js-sdk 的 MatrixEvent 实例，可能为 null。
   */
  async getMatrixEvent(roomId: string, eventId: string): Promise<any | null> {
    if (!this.matrixClient || !roomId || !eventId) return null

    try {
      const room = this.matrixClient.getRoom?.(roomId)
      if (!room) return null

      // 1) 直接通过房间索引查找
      let matrixEvent: any = room.findEventById?.(eventId) || null

      // 2) 尝试从实时时间线中查找
      if (!matrixEvent) {
        const liveEvents = room.getLiveTimeline?.()?.getEvents?.() || []
        matrixEvent = liveEvents.find((ev: any) => ev?.getId?.() === eventId) || null
      }

      // 3) 通过 getEventTimeline 精确定位（可能触发网络/存储查找）
      if (!matrixEvent && this.matrixClient.getEventTimeline && room.getUnfilteredTimelineSet) {
        try {
          const timeline = await this.matrixClient.getEventTimeline(
            room.getUnfilteredTimelineSet(),
            eventId
          )
          matrixEvent = timeline?.getEvents?.()?.find((ev: any) => ev?.getId?.() === eventId) || null
        } catch (timelineError) {
         // console.warn('[EventManager] getMatrixEvent: 获取事件时间线失败:', timelineError)
        }
      }

      return matrixEvent || null
    } catch (error) {
     // console.warn('[EventManager] getMatrixEvent 调用失败:', error)
      return null
    }
  }

  // ===== 事件订阅管理 =====

  /**
   * 订阅事件
   */
  subscribe(eventType: string, callback: EventCallback, options: {
    once?: boolean
    priority?: number
  } = {}): string {
    const listenerId = `listener_${++this.listenerIdCounter}`
    const listener: EventListener = {
      id: listenerId,
      eventType,
      callback,
      once: options.once || false,
      priority: options.priority || 0
    }

    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }

    const listeners = this.eventListeners.get(eventType)!
    listeners.push(listener)

    // 按优先级排序（优先级高的在前）
    listeners.sort((a, b) => (b.priority || 0) - (a.priority || 0))

   // console.log(`[EventManager] 已订阅事件: ${eventType}, ID: ${listenerId}`)
    return listenerId
  }

  /**
   * 取消订阅事件
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, listeners] of this.eventListeners.entries()) {
      const index = listeners.findIndex(listener => listener.id === subscriptionId)
      if (index !== -1) {
        listeners.splice(index, 1)
     //   console.log(`[EventManager] 已取消订阅事件: ${eventType}, ID: ${subscriptionId}`)
        return true
      }
    }
    return false
  }

  /**
   * 触发事件
   */
  emit(eventType: string, data?: any): void {
    const listeners = this.eventListeners.get(eventType)
    if (!listeners || listeners.length === 0) {
      return
    }

    // 创建副本以避免在迭代过程中修改数组
    const listenersToExecute = [...listeners]

    for (const listener of listenersToExecute) {
      try {
        listener.callback(data)

        // 如果是一次性监听器，执行后移除
        if (listener.once) {
          this.unsubscribe(listener.id)
        }
      } catch (error) {
       // console.error(`[EventManager] 事件监听器执行出错 (${eventType}):`, error)
      }
    }
  }

  /**
   * 获取事件监听器
   */
  getListeners(eventType?: string): EventListener[] {
    if (eventType) {
      return this.eventListeners.get(eventType) || []
    }

    const allListeners: EventListener[] = []
    for (const listeners of this.eventListeners.values()) {
      allListeners.push(...listeners)
    }
    return allListeners
  }

  /**
   * 清除所有事件监听器
   */
  clearEventListeners(): void {
    this.eventListeners.clear()
 //   console.log('[EventManager] 已清除所有事件监听器')
  }

  // ===== 消息管理 =====

  /**
   * 获取房间时间线
   */
  getRoomTimeline(roomId: string): RoomTimeline | null {
    return this.roomTimelines.get(roomId) || null
  }

  /**
   * 发送消息
   */
  async sendMessage(roomId: string, content: string, msgtype: string = 'm.text'): Promise<string> {
    if (!this.matrixClient) {
      throw new Error('Matrix客户端未设置')
    }

    try {
      const result = await this.matrixClient.sendMessage(roomId, {
        msgtype,
        body: content
      })

      // 触发消息发送事件
      this.emit(MatrixEventType.MESSAGE_SENT, {
        eventId: result.event_id,
        roomId,
        sender: this.matrixClient.getUserId(),
        content: {
          eventId: result.event_id,
          sender: this.matrixClient.getUserId(),
          content,
          roomId,
          timestamp: Date.now(),
          encrypted: false,
          messageType: msgtype
        },
        timestamp: Date.now()
      } as MessageEventData)

    //  console.log(`[EventManager] 消息已发送到房间 ${roomId}:`, result.event_id)
      return result.event_id
    } catch (error: any) {
    //  console.error('[EventManager] 发送消息失败:', error)
      throw new Error(error.message || '发送消息失败')
    }
  }

  /**
   * 标记已读
   */
  async markAsRead(roomId: string, eventId?: string): Promise<void> {
    if (!this.matrixClient) {
      return
    }

    try {
      const room = this.matrixClient.getRoom(roomId)
      if (!room) {
        return
      }

      const targetEventId = eventId || room.getLastLiveEvent()?.getId()
      if (!targetEventId) {
        return
      }

      let matrixEvent: any = room.findEventById?.(targetEventId) || null

      if (!matrixEvent) {
        const liveEvents = room.getLiveTimeline?.()?.getEvents?.() || []
        matrixEvent = liveEvents.find((ev: any) => ev?.getId?.() === targetEventId) || null
      }

      if (!matrixEvent && this.matrixClient.getEventTimeline && room.getUnfilteredTimelineSet) {
        try {
          const timeline = await this.matrixClient.getEventTimeline(
            room.getUnfilteredTimelineSet(),
            targetEventId
          )
          matrixEvent = timeline?.getEvents?.()?.find((ev: any) => ev?.getId?.() === targetEventId) || null
        } catch (timelineError) {
     //     console.warn('[EventManager] 获取事件时间线失败:', timelineError)
        }
      }

      if (matrixEvent?.getId) {
        await this.matrixClient.sendReadReceipt(matrixEvent)
      }

      try {
        if (matrixEvent?.getId) {
          await this.matrixClient.setRoomReadMarkers?.(roomId, targetEventId, matrixEvent)
        } else {
          await this.matrixClient.setRoomReadMarkers?.(roomId, targetEventId)
        }
      } catch (markerError) {
    //    console.warn('[EventManager] 设置房间已读标记失败:', markerError)
      }

      try {
        if (matrixEvent?.getId && this.matrixClient.acknowledgeEvent) {
          this.matrixClient.acknowledgeEvent(matrixEvent, room)
        }
      } catch (ackError) {
   //     console.warn('[EventManager] acknowledgeEvent 调用失败:', ackError)
      }

      try {
        room.setUnreadNotificationCount?.('total', 0)
        room.setUnreadNotificationCount?.('highlight', 0)
        room.setAreAllThreadsRead?.(true)
      } catch (localCountError) {
        // 忽略本地计数清理失败
      }

      // 更新本地时间线
      const timeline = this.roomTimelines.get(roomId)
      if (timeline) {
        timeline.lastReadEventId = targetEventId
        timeline.unreadCount = 0
      }

      // 更新房间摘要
      const summary = this.roomSummaries.get(roomId)
      if (summary) {
        summary.hasUnread = false
        summary.unreadCount = 0

        this.emit(MatrixEventType.ROOM_SUMMARY_UPDATED, {
          roomId,
          summary: { ...summary }
        } as RoomSummaryEventData)
      }

      // 触发已读事件
      this.emit(MatrixEventType.READ_RECEIPT, {
        roomId,
        userId: this.matrixClient.getUserId(),
        eventId: targetEventId,
        timestamp: Date.now()
      } as ReadReceiptEventData)

   //   console.log(`[EventManager] 已标记房间 ${roomId} 为已读`)
    } catch (error) {
   //   console.warn('[EventManager] 标记已读失败:', error)
    }
  }

  /**
   * 加载更多历史消息
   */
  async loadMoreHistory(roomId: string, limit: number = 20): Promise<boolean> {
    if (!this.matrixClient) {
      return false
    }

    const timeline = this.roomTimelines.get(roomId)
    if (!timeline || !timeline.hasMoreHistory || timeline.isLoadingHistory) {
      return false
    }

    timeline.isLoadingHistory = true

    try {
      const room = this.matrixClient.getRoom(roomId)
      if (!room) {
        return false
      }

      const result = await this.matrixClient.scrollback(room, limit)
      // 兼容不同 SDK 版本的返回：有的返回 boolean，有的返回 { more: boolean }
      let hasMore: boolean
      if (typeof result === 'boolean') {
        hasMore = result
      } else if (result && typeof result === 'object' && 'more' in result) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hasMore = !!(result as any).more
      } else {
        // 回退：无法判断时，保持“可能还有更多”，直到下一次 scrollback 明确返回
        hasMore = true
      }

      // 更新时间线状态
      timeline.hasMoreHistory = hasMore
      timeline.isLoadingHistory = false

    //  console.log(`[EventManager] 已加载房间 ${roomId} 的历史消息, 还有更多: ${hasMore}`)
      return hasMore
    } catch (error) {
     // console.warn('[EventManager] 加载历史消息失败:', error)
      if (timeline) {
        timeline.isLoadingHistory = false
      }
      return false
    }
  }

  /**
   * 获取房间摘要列表
   */
  getRoomSummaries(): RoomSummary[] {
    return Array.from(this.roomSummaries.values())
      .sort((a, b) => b.lastActivity - a.lastActivity)
  }

  // ===== 事件监听器设置 =====

  /**
   * 设置Matrix事件监听器
   */
  setupEventListeners(): void {
    if (!this.matrixClient) {
      return
    }

    const client = this.matrixClient

    // 监听房间成员事件
    client.on('RoomMember.membership', (_event: any, member: any) => {
      if (!member) return

      const roomEventData: RoomEventData = {
        roomId: member.roomId,
        eventType: member.membership as any,
        userId: member.userId,
        room: {
          roomId: member.roomId,
          name: client.getRoom(member.roomId)?.name || member.roomId,
          lastActivity: Date.now(),
          encrypted: false
        }
      }

      this.emit(MatrixEventType.ROOM_JOINED, roomEventData)
    })

    // 监听房间时间线事件（消息 & 系统事件）
    client.on('Room.timeline', (event: any, room: any) => {
      if (!event || !room) return

      const eventSummary = this.buildEventSummary(event, room)
  if (!eventSummary) return

      let messageData: MatrixMessage | undefined

      if (eventSummary.isSystemEvent) {
        // 只渲染“创建房间、加入房间、邀请”等人员/房间变动相关的系统事件
        const type = eventSummary.type
        const membership = eventSummary.metadata?.membership

        const isMemberChange = type === 'm.room.member' && (
          membership === 'join' ||
          membership === 'invite' ||
          membership === 'leave' ||
          membership === 'ban' ||
          membership === 'knock'
        )
        const isRoomCreate = type === 'm.room.create'
        const isRoomNameChange = type === 'm.room.name'
        const isRoomTopicChange = type === 'm.room.topic'

        if (isMemberChange || isRoomCreate || isRoomNameChange || isRoomTopicChange) {
          // console.log(`[EventManager] 识别到需要渲染的系统事件: ${type}`, eventSummary.description)
          messageData = this.createSystemMessageFromSummary(eventSummary, room)
        } else {
          // 其它系统事件（如改名、改主题、改头像等）仅更新摘要，不在时间线中渲染系统消息
       //   console.log(`[EventManager] 其它系统事件，仅更新摘要: ${type}`)
          this.updateRoomSummary(room.roomId, { event: eventSummary })
          return
        }
      } else {
        const rawContent = event.getContent?.() || {}
        const matrixDisplayName = eventSummary.senderName || room?.getMember?.(eventSummary.sender)?.name || null
        const displayName = resolveUserDisplayName({ matrixId: eventSummary.sender, matrixDisplayName })

        messageData = {
          eventId: eventSummary.eventId,
          sender: eventSummary.sender,
          displayName,
          content: rawContent.body || eventSummary.description || '',
          roomId: room.roomId,
          timestamp: eventSummary.timestamp,
          encrypted: eventSummary.type === 'm.room.encrypted',
          messageType: rawContent.msgtype || eventSummary.type || 'm.text',
          formattedBody: rawContent.formatted_body || '',
          format: rawContent.format || '',
          isSystemEvent: false,
          eventType: eventSummary.type
        }
      }

      if (messageData) {
        if (!messageData.isSystemEvent) {
          const content = event.getContent?.() || {}
          const messageInfo = this.buildMessageInfo(content)
          if (messageInfo) {
            messageData = {
              ...messageData,
              messageInfo
            }
          }
        }
        const eventData: MessageEventData = {
          eventId: eventSummary.eventId,
          roomId: room.roomId,
          sender: eventSummary.sender,
          content: messageData,
          timestamp: eventSummary.timestamp,
          isNew: true
        }

        // 更新时间线
        this.updateRoomTimeline(room.roomId, {
          message: messageData,
          event: eventSummary
        })

        // 触发消息接收事件
      //  console.log(`[EventManager] 广播消息接收事件: ${eventSummary.eventId} (类型: ${messageData.isSystemEvent ? '系统' : '普通'})`)
        this.emit(MatrixEventType.MESSAGE_RECEIVED, eventData)
      }

      // 更新房间摘要（消息或系统事件）
      this.updateRoomSummary(room.roomId, {
        event: eventSummary,
        message: messageData
      })
    })

    // 监听撤回事件：删除被撤回的消息并广播 MESSAGE_DELETED
    client.on('Room.redaction', (redactionEvent: any, room: any) => {
      let targetId: string | undefined
      try {
        if (!redactionEvent || !room) return
        targetId =
          (typeof redactionEvent.getAssociatedId === 'function' && redactionEvent.getAssociatedId()) ||
          redactionEvent?.event?.redacts ||
          redactionEvent?.getContent?.()?.redacts

        if (!targetId) return

        // 从时间线移除该消息
        const timeline = this.roomTimelines.get(room.roomId)
        if (timeline) {
          const beforeLen = timeline.messages.length
          timeline.messages = timeline.messages.filter((m) => m.eventId !== targetId)

          // 如果被删除的是摘要里的最后一条消息，尝试回退到上一条
          const summary = this.roomSummaries.get(room.roomId)
          if (summary && summary.lastMessage && summary.lastMessage.eventId === targetId) {
            const lastMsg = timeline.messages[timeline.messages.length - 1]
            summary.lastMessage = lastMsg
            summary.lastActivity = summary.lastEvent?.timestamp || lastMsg?.timestamp || summary.lastActivity
            this.emit(MatrixEventType.ROOM_SUMMARY_UPDATED, {
              roomId: room.roomId,
              summary: { ...summary },
            } as RoomSummaryEventData)
          }

          if (beforeLen !== timeline.messages.length) {
            // 广播删除事件
            this.emit(MatrixEventType.MESSAGE_DELETED, {
              roomId: room.roomId,
              eventId: targetId,
              timestamp: Date.now(),
            })
          }
        } else {
          // 即使本地没有时间线，也广播删除事件，让上层自行处理
          this.emit(MatrixEventType.MESSAGE_DELETED, {
            roomId: room.roomId,
            eventId: targetId,
            timestamp: Date.now(),
          })
        }
      } catch (e) {
      //  console.warn('[EventManager] 处理撤回事件失败:', e)
        return
      }

      // —— 合成系统提示（方案A）：不影响未读数与房间摘要的最后一条普通消息 ——
      try {
        // 防重复：某些情况下 SDK 可能多次触发 Room.redaction（不同 timeline set），做幂等保护
        const existingTimeline = this.roomTimelines.get(room.roomId)
        if (existingTimeline) {
          const alreadyHas = existingTimeline.messages.some(m => m.eventType === 'm.room.redaction' && m.systemEvent?.metadata?.redacts === targetId)
          if (alreadyHas) {
            // 已有对应撤回系统消息，直接返回避免重复插入与二次广播
            return
          }
        }
        const senderId = typeof redactionEvent.getSender === 'function' ? redactionEvent.getSender() : redactionEvent?.event?.sender
        const senderName = room?.getMember?.(senderId)?.name || senderId
        const reason = redactionEvent?.getContent?.()?.reason
        const ts = typeof redactionEvent.getTs === 'function' ? redactionEvent.getTs() : Date.now()
        const sysEventId = typeof redactionEvent.getId === 'function' ? redactionEvent.getId() : `${room.roomId}-redaction-${ts}`

        const summary: RoomEventSummary = {
          eventId: sysEventId,
          type: 'm.room.redaction',
          sender: senderId,
          senderName: senderName,
          timestamp: ts,
          description: reason ? `${senderName} 撤回了一条消息（原因：${reason}）` : `${senderName} 撤回了一条消息`,
          isSystemEvent: true,
          metadata: { redacts: targetId, roomId: room.roomId, reason }
        }

        const systemMessage = this.createSystemMessageFromSummary(summary, room)

        // 推入本地时间线（系统消息不会增加未读计数）
        this.updateRoomTimeline(room.roomId, { message: systemMessage, event: summary })

        // 广播到消息通道供 UI 显示
        this.emit(MatrixEventType.MESSAGE_RECEIVED, {
          eventId: systemMessage.eventId,
          roomId: room.roomId,
          sender: systemMessage.sender,
          content: systemMessage,
          timestamp: systemMessage.timestamp,
          isNew: true,
        } as MessageEventData)

        // 只更新事件摘要（不传 message，避免房间摘要的 lastMessage 被系统提示覆盖）
        this.updateRoomSummary(room.roomId, { event: summary })
      } catch (sysErr) {
      //  console.warn('[EventManager] 生成撤回系统提示失败:', sysErr)
      }
    })

    // 监听已读回执
    client.on('Room.receipt', (event: any, room: any) => {
      if (!event || !room) return

      const receiptData: ReadReceiptEventData = {
        roomId: room.roomId,
        userId: event.getSender(),
        eventId: event.getId(),
        timestamp: Date.now()
      }

      this.emit(MatrixEventType.READ_RECEIPT, receiptData)
    })

    // 监听同步状态
  client.on('sync', (state: string, _prevState: string) => {
      const syncData: SyncEventData = {
        state: state as any,
        prevSyncTime: Date.now()
      }

      switch (state) {
        case 'PREPARED':
          if (!this.hasBroadcastInitialSummaries) {
            this.initializeRoomData()
          }
          this.emit(MatrixEventType.CONNECTED, syncData)
          break
        case 'SYNCING':
          this.emit(MatrixEventType.SYNC_STARTED, syncData)
          break
        case 'STOPPED':
          this.hasBroadcastInitialSummaries = false
          this.emit(MatrixEventType.DISCONNECTED, syncData)
          break
        case 'ERROR':
          this.hasBroadcastInitialSummaries = false
          this.emit(MatrixEventType.SYNC_ERROR, syncData)
          break
      }
    })

    console.log('[EventManager] Matrix事件监听器已设置')
  }

  // ===== 辅助方法 =====

  /**
   * 更新房间时间线
   */
  private updateRoomTimeline(roomId: string, eventPayload: { message?: MatrixMessage; event: RoomEventSummary }): void {
    let timeline = this.roomTimelines.get(roomId)
    if (!timeline) {
      timeline = {
        roomId,
        messages: [],
        hasMoreHistory: true,
        isLoadingHistory: false,
        unreadCount: 0
      }
      this.roomTimelines.set(roomId, timeline)
    }

    if (eventPayload.message) {
      const message = eventPayload.message
      timeline.messages.push(message)

      const isOwnMessage = message.sender === this.matrixClient?.getUserId()
      const shouldIncreaseUnread = !message.isSystemEvent && !isOwnMessage
      if (shouldIncreaseUnread) {
        timeline.unreadCount++
      }

      if (timeline.messages.length > 100) {
        timeline.messages = timeline.messages.slice(-100)
      }
    }
  }

  /**
   * 更新房间摘要
   */
  private updateRoomSummary(roomId: string, payload: { event: RoomEventSummary; message?: MatrixMessage }): void {
    const { event, message } = payload
    const isOwnMessage = message ? message.sender === this.matrixClient?.getUserId() : false

    let summary = this.roomSummaries.get(roomId)
    if (!summary) {
      const room = this.matrixClient?.getRoom(roomId)
      summary = {
        roomId,
        name: room?.name || event.metadata?.roomName || roomId,
        lastMessage: message,
        lastEvent: event,
        unreadCount: message && !isOwnMessage ? 1 : 0,
        lastActivity: event.timestamp,
        avatarUrl: room?.getAvatarUrl?.() || event.metadata?.avatarUrl,
        hasUnread: !!(message && !isOwnMessage)
      }
      this.roomSummaries.set(roomId, summary)
    } else {
      if (message) {
        summary.lastMessage = message
        if (isOwnMessage) {
          summary.unreadCount = 0
          summary.hasUnread = false
        } else {
          summary.unreadCount = (summary.unreadCount || 0) + 1
          summary.hasUnread = summary.unreadCount > 0
        }
      }

      summary.lastEvent = event
      if (event.timestamp) {
        summary.lastActivity = event.timestamp
      }

      if (event.metadata?.roomName) {
        summary.name = event.metadata.roomName
      }

      if (event.metadata?.avatarUrl) {
        summary.avatarUrl = event.metadata.avatarUrl
      }
    }

    this.emit(MatrixEventType.ROOM_SUMMARY_UPDATED, {
      roomId,
      summary: { ...summary }
    } as RoomSummaryEventData)
  }

  /**
   * 初始化房间数据
   */
  initializeRoomData(): void {
    if (!this.matrixClient) {
      return
    }

  const rooms = this.matrixClient.getRooms()

  // 重建数据前清空缓存，避免旧的未读状态残留
  this.roomTimelines.clear()
  this.roomSummaries.clear()
    for (const room of rooms) {
      // 初始化时间线
      const timeline: RoomTimeline = {
        roomId: room.roomId,
        messages: [],
        hasMoreHistory: true,
        isLoadingHistory: false,
        unreadCount: room.getUnreadNotificationCount?.() || 0
      }

      const liveEvents = room.getLiveTimeline?.()?.getEvents?.() || []
      let lastMessage: MatrixMessage | undefined
      let lastEventSummary: RoomEventSummary | undefined

      for (const event of liveEvents.slice(-50)) {
        const summary = this.buildEventSummary(event, room)
        if (summary) {
          lastEventSummary = summary

          if (!summary.isSystemEvent) {
            const rawContent = event.getContent?.() || {}
            const displayName = summary.senderName || room?.getMember?.(summary.sender)?.name || summary.sender

            const message: MatrixMessage = {
              eventId: summary.eventId,
              sender: summary.sender,
              displayName,
              content: rawContent.body || summary.description || '',
              roomId: room.roomId,
              timestamp: summary.timestamp,
              encrypted: summary.type === 'm.room.encrypted',
              messageType: rawContent.msgtype || summary.type || 'm.text',
              formattedBody: rawContent.formatted_body || '',
              format: rawContent.format || ''
            }

            // 方案B：在初始化播种阶段就补齐 messageInfo，避免后续合并丢失下载所需的 url/mxcUrl
            try {
              const messageInfo = this.buildMessageInfo(rawContent)
              if (messageInfo) {
                ;(message as any).messageInfo = messageInfo
              }
            } catch (e) {
        //      console.warn('[EventManager] initializeRoomData: 构建 messageInfo 失败:', e)
            }

            timeline.messages.push(message)
            lastMessage = message

            if (timeline.messages.length > 100) {
              timeline.messages = timeline.messages.slice(-100)
            }
          }
        }
      }

      this.roomTimelines.set(room.roomId, timeline)

      const summary: RoomSummary = {
        roomId: room.roomId,
        name: lastEventSummary?.metadata?.roomName || room.name || room.roomId,
        lastMessage,
        lastEvent: lastEventSummary,
        unreadCount: timeline.unreadCount,
        lastActivity: lastEventSummary?.timestamp || lastMessage?.timestamp || room.getLastActiveTimestamp?.() || 0,
        avatarUrl: lastEventSummary?.metadata?.avatarUrl || room.getAvatarUrl?.(),
        hasUnread: timeline.unreadCount > 0
      }

      this.roomSummaries.set(room.roomId, summary)

      this.emit(MatrixEventType.ROOM_SUMMARY_UPDATED, {
        roomId: room.roomId,
        summary: { ...summary }
      } as RoomSummaryEventData)
    }

    this.hasBroadcastInitialSummaries = true
 //   console.log(`[EventManager] 已初始化 ${rooms.length} 个房间的数据`)
  }

  /**
   * 销毁事件管理器
   */
  destroy(): void {
    this.clearEventListeners()
    this.roomTimelines.clear()
    this.roomSummaries.clear()
    this.matrixClient = null
    this.hasBroadcastInitialSummaries = false
 //   console.log('[EventManager] 事件管理器已销毁')
  }

  /**
   * 对外暴露的事件摘要创建方法，便于其他服务复用同一套描述逻辑
   */
  public createEventSummary(event: any, room?: any): RoomEventSummary | null {
    const fallbackRoomId = room?.roomId
    const roomId = event?.getRoomId?.() || fallbackRoomId
    const resolvedRoom = room || (roomId ? this.matrixClient?.getRoom?.(roomId) : undefined)
    return this.buildEventSummary(event, resolvedRoom)
  }

  /**
   * 将系统事件摘要转换为系统消息对象，供时间线与UI展示
   */
  private createSystemMessageFromSummary(summary: RoomEventSummary, room: any): MatrixMessage {
    const matrixDisplayName = summary.senderName || room?.getMember?.(summary.sender)?.name || null
    const displayName = resolveUserDisplayName({ matrixId: summary.sender, matrixDisplayName })

    return {
      eventId: summary.eventId,
      sender: summary.sender,
      displayName,
      content: summary.description,
      roomId: room?.roomId || summary.metadata?.roomId || '',
      timestamp: summary.timestamp,
      encrypted: false,
      messageType: 'm.system',
      formattedBody: '',
      format: '',
      isSystemEvent: true,
      eventType: summary.type,
      systemEvent: summary
    }
  }

  private buildEventSummary(event: any, room: any): RoomEventSummary | null {
    if (!event || !room) return null

    const type = event.getType?.() || ''
    const sender = event.getSender?.() || event.getStateKey?.() || ''
    const timestamp = event.getTs?.() || Date.now()
    const senderName = room?.getMember?.(sender)?.name || sender

    const baseSummary = {
      eventId: event.getId?.() || `${type}_${timestamp}`,
      type,
      sender,
      senderName,
      timestamp,
      description: '',
      isSystemEvent: type !== 'm.room.message',
      metadata: {} as Record<string, any>
    }

    // 撤回事件：不生成系统消息；交由 Room.redaction 专门处理
    if (type === 'm.room.redaction') {
      return null
    }

    // 消息事件
    if (type === 'm.room.message') {
      if (typeof event.isRedacted === 'function' && event.isRedacted()) {
        // 已撤回的消息不进入时间线
        return null
      }
      const content = event.getContent?.() || {}
      return {
        ...baseSummary,
        description: content.body || '[未含正文的消息]',
        isSystemEvent: false
      }
    }

    const content = event.getContent?.() || {}
    const stateKey = event.getStateKey?.() || ''
    const rawEvent = event.event || {}
    const actorUserId = event.getSender?.() || rawEvent.sender || sender

    // 系统消息中用户展示：尽量只显示昵称，去掉括号内完整 MXID，精简文案
    const withUserLabel = (userId: string, displayName?: string | null) => {
      return resolveUserDisplayName({ matrixId: userId, matrixDisplayName: displayName || null })
    }

    // 只为必要的房间/成员变动生成可见的系统摘要，其余类型仅用于内部状态，不渲染为气泡
    switch (type) {
      case 'm.room.member': {
        const membership = content.membership
        const prevMembership = event.getPrevContent?.()?.membership

        const targetUserId = stateKey || actorUserId
        const targetMember = room?.getMember?.(targetUserId)
        const targetDisplayName = targetMember?.name || content.displayname || null
        const actorMember = room?.getMember?.(actorUserId)
        const actorDisplayName = actorMember?.name || null

  const targetLabel = withUserLabel(targetUserId, targetDisplayName)
  const actorLabel = withUserLabel(actorUserId, actorDisplayName)

        let description = ''
        switch (membership) {
          case 'join':
            description = `${targetLabel} 加入`
            break
          case 'leave':
            if (actorUserId !== targetUserId && actorUserId) {
              description = `${targetLabel} 被 ${actorLabel} 移出了`
            } else if (prevMembership === 'ban') {
              description = `${targetLabel} 的封禁被解除，随后离开了`
            } else {
              description = `${targetLabel} 离开了`
            }
            break
          case 'ban':
            description = `${targetLabel} 被 ${actorLabel} 封禁`
            break
          case 'invite':
            description = `${actorLabel} 邀请 ${targetLabel} 加入`
            break
          case 'knock':
            description = `${targetLabel} 请求加入`
            break
          default:
            description = `${targetLabel} 的成员状态更新为 ${membership || '未知'}`
        }

        return {
          ...baseSummary,
          sender: actorUserId,
          senderName: withUserLabel(actorUserId, actorDisplayName),
          description,
          metadata: {
            membership,
            targetUserId,
            actorUserId,
            prevMembership,
            rawContent: content,
            rawEvent
          }
        }
      }
      case 'm.room.name': {
        const newName = content.name || '(未命名)'
        const actorMember = room?.getMember?.(actorUserId)
        const actorLabel = withUserLabel(actorUserId, actorMember?.name || null)
        return {
          ...baseSummary,
          description: `${actorLabel} 将名称更改为 "${newName}"`,
          metadata: {
            roomName: newName,
            rawContent: content,
            rawEvent
          }
        }
      }
      case 'm.room.topic': {
        const newTopic = content.topic || ''
        const actorMember = room?.getMember?.(actorUserId)
        const actorLabel = withUserLabel(actorUserId, actorMember?.name || null)
        return {
          ...baseSummary,
          description: `${actorLabel} 将主题更改为 "${newTopic}"`,
          metadata: {
            topic: newTopic,
            rawContent: content,
            rawEvent
          }
        }
      }
      case 'm.room.avatar': {
        // 只更新头像相关元数据，不生成系统提示内容
        return {
          ...baseSummary,
          description: '',
          metadata: {
            avatarEvent: content,
            rawContent: content,
            rawEvent
          }
        }
      }
      case 'm.room.create': {
        const creator = rawEvent?.sender || actorUserId
        const creatorMember = room?.getMember?.(creator)
        const creatorLabel = withUserLabel(creator, creatorMember?.name || content.creator)
        const roomVersion = content.room_version ? `（版本：${content.room_version}）` : ''
        return {
          ...baseSummary,
          description: `${creatorLabel} 创建聊天`,
          metadata: {
            creator,
            roomVersion: content.room_version,
            rawContent: content,
            rawEvent
          }
        }
      }
      default: {
        // 其它系统事件只用于内部逻辑，不生成用户可见的描述
        return {
          ...baseSummary,
          description: '',
          metadata: {
            rawContent: content,
            rawEvent
          }
        }
      }
    }
  }

  private buildMessageInfo(content: any): MatrixMessage['messageInfo'] {
    if (!this.matrixClient) return undefined

    const msgtype = content?.msgtype
    const baseInfo = content?.info || {}
    const info: any = {}

    const mxcUrl = content?.file?.url || content?.url
    if (!mxcUrl) {
      return undefined
    }

    if (content?.body) {
      info.filename = content.body
    }

    if (baseInfo.size) {
      info.size = baseInfo.size
    }

    if (baseInfo.mimetype) {
      info.mimetype = baseInfo.mimetype
    }

    if (baseInfo.w && baseInfo.h) {
      info.width = baseInfo.w
      info.height = baseInfo.h
    }

    if (baseInfo.duration) {
      info.duration = baseInfo.duration
    }

    if (msgtype === 'm.image' && content.info?.w && content.info?.h) {
      info.width = content.info.w
      info.height = content.info.h
    }

    try {
      const httpUrl = this.matrixClient.mxcUrlToHttp(mxcUrl, null, null, null, true)
      if (httpUrl) {
        // 统一改为纯净 URL（不再附加 access_token 查询参数，后续组件使用 Authorization 头）
        info.url = httpUrl
      }
    } catch (error) {
   //   console.warn('[EventManager] 将MXC URL转换为HTTP URL失败:', error)
    }

    info.mxcUrl = mxcUrl

    if (content.file && content.file.key) {
      info.encryptionInfo = content.file
    }

    return Object.keys(info).length > 0 ? info : undefined
  }

  // 已移除：不再需要附加 access_token
}

// 创建全局事件管理器实例
export const matrixEventManager = new MatrixEventManager()
