import { ref } from 'vue'
import { API_URLS } from '@/apiUrls'
/**
 * Bot 流式通信的 WebSocket 管理服务
 * 
 * 功能:
 * 1. 按 bot 账号建立并管理 WebSocket 连接（支持多 bot 并发）
 * 2. 收到 finish 时仅标记流式结束，不主动断开连接
 * 3. 在切房/卸载/显式断开时清理连接
 */

interface FinishMessage {
  state: 'finish' | 'completed' | 'error' | 'failed' | 'cancelled' | 'stopped' | 'timeout'
  event_id?: string
  room_id: string
}

type UnknownRecord = Record<string, unknown>
type IncomingWsMessage = UnknownRecord & {
  state?: string
  room_id?: string
  event_id?: string
  agent?: string
  content_type?: string
  content?: unknown
}

type WsConnection = {
  ws: WebSocket | null
  isConnected: boolean
  roomIds: Set<string>
  reconnectTimer: number | null
  reconnectAttempts: number
}

export class UserbotWebSocketService {
  private connections = new Map<string, WsConnection>()
  private isConnected = ref(false)
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private messageHandlers: Array<(data: unknown) => void> = []
  private closeHandlers: Array<() => void> = []

  // 流式任务状态
  private streamingState = {
    isStreaming: false,
    currentRoomId: null as string | null,
    currentEventId: null as string | null
  }

  constructor() {
    console.log('[System:UserbotWebSocket:constructor] WebSocket服务已初始化')
  }

  /**
   * 连接到指定bot的WebSocket
   * @param roomId - 房间ID
    * @param botAccount - bot 的 username（简称，不含 @ / homeserver）
   */
  connect(roomId: string, botAccount: string): void {
    const existing = this.connections.get(botAccount)
    if (existing && existing.ws && (existing.ws.readyState === WebSocket.OPEN || existing.ws.readyState === WebSocket.CONNECTING)) {
      existing.roomIds.add(roomId)
      this.recalcIsConnected()
      return
    }

    const conn: WsConnection = existing ?? {
      ws: null,
      isConnected: false,
      roomIds: new Set<string>(),
      reconnectTimer: null,
      reconnectAttempts: 0,
    }
    conn.roomIds.add(roomId)
    this.connections.set(botAccount, conn)

    const wsUrl = API_URLS.GetWsConnection(encodeURIComponent(botAccount))
    console.log(`[System:UserbotWebSocket:connect] 连接到: ${wsUrl}`)

    try {
      conn.ws = new WebSocket(wsUrl)
      this.setupWebSocketHandlers(botAccount, conn)
    } catch (error) {
      console.error('[System:UserbotWebSocket:connect] 创建WebSocket连接失败:', error)
      this.handleReconnect(botAccount)
    }
  }

  /**
   * 设置WebSocket事件处理器
   */
  private setupWebSocketHandlers(botAccount: string, conn: WsConnection): void {
    if (!conn.ws) return
    const currentWs = conn.ws

    currentWs.onopen = () => {
      const latest = this.connections.get(botAccount)
      if (!latest || latest.ws !== currentWs) {
        console.log('[System:UserbotWebSocket:setupWebSocketHandlers] 忽略旧连接的open事件')
        return
      }

      console.log('[System:UserbotWebSocket:setupWebSocketHandlers] WebSocket连接成功')
      conn.isConnected = true
      conn.reconnectAttempts = 0
      this.recalcIsConnected()

      if (conn.reconnectTimer) {
        clearTimeout(conn.reconnectTimer)
        conn.reconnectTimer = null
      }
    }

    currentWs.onmessage = (event) => {
      const latest = this.connections.get(botAccount)
      if (!latest || latest.ws !== currentWs) return

      try {
        const data = JSON.parse(event.data) as IncomingWsMessage
        console.log('[System:UserbotWebSocket:setupWebSocketHandlers]  收到消息:', data)
        const enriched = {
          ...data,
          __botAccount: botAccount,
        }

        // 通知所有消息处理器
        this.messageHandlers.forEach(handler => {
          try {
            handler(enriched)
          } catch (error) {
            console.warn('[System:UserbotWebSocket:setupWebSocketHandlers] 消息处理器执行出错:', error)
          }
        })

        // 检查是否是结束消息 - 但不断开连接
        if (this.isFinishMessage(data)) {
          console.log(`[System:UserbotWebSocket:setupWebSocketHandlers] 收到finish消息,流式任务结束 (room: ${data.room_id})`)

          // 验证房间ID是否匹配
          if (conn.roomIds.has(data.room_id)) {
            console.log('[System:UserbotWebSocket:setupWebSocketHandlers] 房间ID匹配,标记流式任务结束,但保持连接')
            this.streamingState.isStreaming = false
            this.streamingState.currentEventId = null
          } else {
            console.warn('[System:UserbotWebSocket:setupWebSocketHandlers] 房间ID不匹配,忽略结束消息', {
              state: data.state,
              expected: Array.from(conn.roomIds.values()),
              received: data.room_id
            })
          }
        }

        // 检测流式开始
        if (data.state === 'appending' && typeof data.room_id === 'string' && conn.roomIds.has(data.room_id)) {
          if (!this.streamingState.isStreaming) {
            console.log('[System:UserbotWebSocket:setupWebSocketHandlers] 流式任务开始')
            this.streamingState.isStreaming = true
            this.streamingState.currentRoomId = data.room_id
          }
        }
      } catch (error) {
        console.warn('[System:UserbotWebSocket:setupWebSocketHandlers] 解析消息失败:', error, event.data)
      }
    }

    currentWs.onclose = (event) => {
      const latest = this.connections.get(botAccount)
      if (!latest || latest.ws !== currentWs) {
        console.log('[System:UserbotWebSocket:setupWebSocketHandlers] 忽略旧连接的关闭事件')
        return
      }

      console.log('[System:UserbotWebSocket:setupWebSocketHandlers] 🔌 连接关闭:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      })
      conn.isConnected = false
      conn.ws = null
      this.recalcIsConnected()

      // 通知所有关闭处理器
      this.closeHandlers.forEach(handler => {
        try {
          handler()
        } catch (error) {
          console.warn('[System:UserbotWebSocket:setupWebSocketHandlers] 关闭处理器执行出错:', error)
        }
      })

      // 如果不是手动关闭(wasClean=false),尝试重连
      if (!event.wasClean && conn.roomIds.size > 0) {
        console.log('[System:UserbotWebSocket:setupWebSocketHandlers] 连接异常关闭,尝试重连')
        this.handleReconnect(botAccount)
      }
    }

    currentWs.onerror = (error) => {
      const latest = this.connections.get(botAccount)
      if (!latest || latest.ws !== currentWs) return
      console.warn('[System:UserbotWebSocket:setupWebSocketHandlers]  WebSocket错误:', error)
      conn.isConnected = false
      this.recalcIsConnected()
    }
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(botAccount: string): void {
    const conn = this.connections.get(botAccount)
    if (!conn) return

    if (conn.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[System:UserbotWebSocket:handleReconnect] 达到最大重连次数,停止重连')
      return
    }

    if (conn.reconnectTimer) {
      return // 已经在重连中
    }

    conn.reconnectAttempts++
    const delay = this.reconnectDelay * conn.reconnectAttempts

    console.log(`[System:UserbotWebSocket:handleReconnect] 将在 ${delay}ms 后进行第 ${conn.reconnectAttempts} 次重连`)

    conn.reconnectTimer = setTimeout(() => {
      conn.reconnectTimer = null
      const roomId = Array.from(conn.roomIds.values())[0]
      if (!roomId) return
      console.log('[System:UserbotWebSocket:handleReconnect] 执行重连')
      this.connect(roomId, botAccount)
    }, delay)
  }

  /**
   * 检查是否是结束消息
   * 只检测 state === 'finish' 的正常结束状态
   * 不再包含 error/cancelled 等异常状态（这些应该保持连接以便重试）
   */
  private isFinishMessage(data: unknown): data is FinishMessage {
    if (typeof data !== 'object' || data === null) {
      return false
    }

    const record = data as UnknownRecord

    // 检查必需字段
    if (typeof record.room_id !== 'string') {
      return false
    }

    // 只检测正常的 finish 状态
    return record.state === 'finish'
  }

  /**
   * 发送消息
   */
  send(data: unknown, targetBotAccount?: string): void {
    const payload = (typeof data === 'object' && data !== null) ? (data as UnknownRecord) : undefined
    const candidateBot = (() => {
      if (targetBotAccount) return targetBotAccount
      if (typeof payload?.agent === 'string' && payload.agent) return payload.agent
      return ''
    })()

    const resolveConnection = (): WsConnection | undefined => {
      if (candidateBot) {
        const conn = this.connections.get(candidateBot)
        if (conn?.ws && conn.ws.readyState === WebSocket.OPEN) return conn
      }
      const opened = Array.from(this.connections.values()).find((conn) => conn.ws && conn.ws.readyState === WebSocket.OPEN)
      return opened
    }

    const connection = resolveConnection()
    if (!connection?.ws || connection.ws.readyState !== WebSocket.OPEN) {
      console.warn('[System:UserbotWebSocket:send] WebSocket未连接,无法发送消息')
      return
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      connection.ws.send(message)
      console.log('[System:UserbotWebSocket:send]  发送消息:', data)
    } catch (error) {
      console.error('[System:UserbotWebSocket:send] 发送消息失败:', error)
    }
  }

  /**
   * 断开连接
   */
  disconnect(botAccount?: string): void {
    console.log('[System:UserbotWebSocket:disconnect] 断开WebSocket连接')

    const closeConnection = (account: string, conn: WsConnection) => {
      if (conn.reconnectTimer) {
        clearTimeout(conn.reconnectTimer)
        conn.reconnectTimer = null
      }
      if (conn.ws) {
        try {
          conn.ws.close(1000, '主动断开连接')
        } catch (error) {
          console.warn('[System:UserbotWebSocket:disconnect] 关闭连接时出错:', error)
        }
        conn.ws = null
      }
      conn.isConnected = false
      conn.reconnectAttempts = 0
      conn.roomIds.clear()
      this.connections.delete(account)
    }

    if (botAccount) {
      const conn = this.connections.get(botAccount)
      if (conn) closeConnection(botAccount, conn)
    } else {
      for (const [account, conn] of this.connections.entries()) {
        closeConnection(account, conn)
      }
    }

    this.recalcIsConnected()
  }

  private recalcIsConnected() {
    this.isConnected.value = Array.from(this.connections.values()).some((conn) => !!conn.ws && conn.ws.readyState === WebSocket.OPEN)
  }

  /**
   * 添加消息处理器
   */
  onMessage(handler: (data: unknown) => void): void {
    if (this.messageHandlers.includes(handler)) {
      return
    }
    this.messageHandlers.push(handler)
  }

  /**
   * 移除消息处理器
   */
  offMessage(handler: (data: unknown) => void): void {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  /**
   * 添加关闭处理器
   */
  onClose(handler: () => void): void {
    if (this.closeHandlers.includes(handler)) {
      return
    }
    this.closeHandlers.push(handler)
  }

  /**
   * 移除关闭处理器
   */
  offClose(handler: () => void): void {
    const index = this.closeHandlers.indexOf(handler)
    if (index > -1) {
      this.closeHandlers.splice(index, 1)
    }
  }

  /**
   * 获取连接状态
   */
  getIsConnected(): boolean {
    return this.isConnected.value
  }

  /**
   * 获取当前房间ID
   */
  getCurrentRoomId(): string | null {
    const first = this.connections.values().next().value as WsConnection | undefined
    if (!first) return null
    return Array.from(first.roomIds.values())[0] || null
  }

  /**
   * 获取当前bot账号
   */
  getCurrentBotAccount(): string | null {
    const first = this.connections.keys().next().value as string | undefined
    return first || null
  }

  /**
   * 获取当前流式状态
   */
  getStreamingState() {
    return {
      isStreaming: this.streamingState.isStreaming,
      currentRoomId: this.streamingState.currentRoomId,
      currentEventId: this.streamingState.currentEventId
    }
  }
}

// 导出单例
export const userbotWebSocketService = new UserbotWebSocketService()
