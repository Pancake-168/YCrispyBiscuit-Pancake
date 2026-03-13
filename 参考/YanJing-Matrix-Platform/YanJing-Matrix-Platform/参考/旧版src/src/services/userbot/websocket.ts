import { ref } from 'vue'
import { API_URLS } from '@/apiUrls'
/**
 * AI助手专属房间的WebSocket管理服务
 * 
 * 功能:
 * 1. 当进入bot专属房间时自动连接
 * 2. 当收到finish消息时断开连接
 * 3. 只要不退出bot专属房间就保持连接
 */

interface FinishMessage {
  state: 'finish' | 'completed' | 'error' | 'failed' | 'cancelled' | 'stopped' | 'timeout'
  event_id: string
  room_id: string
}

export class UserbotWebSocketService {
  private ws: WebSocket | null = null
  private isConnected = ref(false)
  private currentRoomId: string | null = null
  private currentBotAccount: string | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private messageHandlers: Array<(data: any) => void> = []
  private closeHandlers: Array<() => void> = []

  // 流式任务状态
  private streamingState = {
    isStreaming: false,
    currentRoomId: null as string | null,
    currentEventId: null as string | null
  }

  constructor() {
    console.log('[UserbotWebSocket] WebSocket服务已初始化')
  }

  /**
   * 连接到指定bot的WebSocket
   * @param roomId - 房间ID
    * @param botAccount - bot 的 username（简称，不含 @ / homeserver）
   */
  connect(roomId: string, botAccount: string): void {
    // 如果已经连接到相同的bot,不需要重复连接
    if (this.isConnected.value && this.currentBotAccount === botAccount) {
      console.log('[UserbotWebSocket] 已连接到相同的bot,仅更新房间ID')
      // 虽然不重连，但需要更新房间ID，以便finish消息验证
      const oldRoomId = this.currentRoomId
      this.currentRoomId = roomId
      console.log(`[UserbotWebSocket] 房间ID已更新: ${oldRoomId} -> ${roomId}`)
      return
    }

    // 如果正在连接相同的bot（ws存在但未连接成功），也不需要重复连接
    if (this.ws && this.currentBotAccount === botAccount) {
      console.log('[UserbotWebSocket] 正在连接相同的bot,忽略重复请求')
      // 同样更新房间ID
      this.currentRoomId = roomId
      return
    }

    // 如果正在连接其他bot,先断开
    if (this.ws) {
      console.log('[UserbotWebSocket] 断开之前的连接')
      this.disconnect()
    }

    this.currentRoomId = roomId
    this.currentBotAccount = botAccount

    const wsUrl = API_URLS.GetWsConnection(encodeURIComponent(botAccount))
    console.log(`[UserbotWebSocket] 连接到: ${wsUrl}`)

    try {
      this.ws = new WebSocket(wsUrl)
      this.setupWebSocketHandlers()
    } catch (error) {
      console.error('[UserbotWebSocket] 创建WebSocket连接失败:', error)
      this.handleReconnect()
    }
  }

  /**
   * 设置WebSocket事件处理器
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return

    // 捕获当前的WebSocket实例，用于在回调中判断是否是旧连接
    const currentWs = this.ws

    currentWs.onopen = () => {
      // 如果当前实例已经不是这个ws了，说明已经有了新连接，忽略旧连接的事件
      if (this.ws !== currentWs) {
        console.log('[UserbotWebSocket] 忽略旧连接的open事件')
        return
      }

      console.log('[UserbotWebSocket]  WebSocket连接成功')
      this.isConnected.value = true
      this.reconnectAttempts = 0

      // 清除重连定时器
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
    }

    currentWs.onmessage = (event) => {
      // 忽略旧连接的消息
      if (this.ws !== currentWs) return

      try {
        const data = JSON.parse(event.data)
        console.log('[UserbotWebSocket]  收到消息:', data)

        // 通知所有消息处理器
        this.messageHandlers.forEach(handler => {
          try {
            handler(data)
          } catch (error) {
            console.error('[UserbotWebSocket] 消息处理器执行出错:', error)
          }
        })

        // 检查是否是结束消息 - 但不断开连接
        if (this.isFinishMessage(data)) {
          console.log(`[UserbotWebSocket] 收到finish消息,流式任务结束 (room: ${data.room_id})`)

          // 验证房间ID是否匹配
          if (data.room_id === this.currentRoomId) {
            console.log('[UserbotWebSocket] 房间ID匹配,标记流式任务结束,但保持连接')
            this.streamingState.isStreaming = false
            this.streamingState.currentEventId = null
            // 注意: 不再调用 disconnect(),保持连接用于下次对话
          } else {
            console.warn('[UserbotWebSocket] 房间ID不匹配,忽略结束消息', {
              state: data.state,
              expected: this.currentRoomId,
              received: data.room_id
            })
          }
        }

        // 检测流式开始
        if (data.state === 'appending' && data.room_id === this.currentRoomId) {
          if (!this.streamingState.isStreaming) {
            console.log('[UserbotWebSocket] 流式任务开始')
            this.streamingState.isStreaming = true
            this.streamingState.currentRoomId = data.room_id
          }
        }
      } catch (error) {
        console.error('[UserbotWebSocket] 解析消息失败:', error, event.data)
      }
    }

    currentWs.onclose = (event) => {
      // 如果当前实例已经不是这个ws了，说明这是旧连接的关闭事件，忽略它
      if (this.ws !== currentWs) {
        console.log('[UserbotWebSocket] 忽略旧连接的关闭事件')
        return
      }

      console.log('[UserbotWebSocket] 🔌 连接关闭:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      })
      this.isConnected.value = false

      // 通知所有关闭处理器
      this.closeHandlers.forEach(handler => {
        try {
          handler()
        } catch (error) {
          console.error('[UserbotWebSocket] 关闭处理器执行出错:', error)
        }
      })

      // 如果不是手动关闭(wasClean=false),尝试重连
      if (!event.wasClean && this.currentRoomId && this.currentBotAccount) {
        console.log('[UserbotWebSocket] 连接异常关闭,尝试重连')
        this.handleReconnect()
      }
    }

    currentWs.onerror = (error) => {
      if (this.ws !== currentWs) return
      console.error('[UserbotWebSocket]  WebSocket错误:', error)
      this.isConnected.value = false
    }
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[UserbotWebSocket] 达到最大重连次数,停止重连')
      return
    }

    if (this.reconnectTimer) {
      return // 已经在重连中
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    console.log(`[UserbotWebSocket] 将在 ${delay}ms 后进行第 ${this.reconnectAttempts} 次重连`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.currentRoomId && this.currentBotAccount) {
        console.log('[UserbotWebSocket] 执行重连')
        this.connect(this.currentRoomId, this.currentBotAccount)
      }
    }, delay)
  }

  /**
   * 检查是否是结束消息
   * 只检测 state === 'finish' 的正常结束状态
   * 不再包含 error/cancelled 等异常状态（这些应该保持连接以便重试）
   */
  private isFinishMessage(data: any): data is FinishMessage {
    if (typeof data !== 'object' || data === null) {
      return false
    }

    // 检查必需字段
    if (typeof data.room_id !== 'string') {
      return false
    }

    // 只检测正常的 finish 状态
    return data.state === 'finish'
  }

  /**
   * 发送消息
   */
  send(data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[UserbotWebSocket] WebSocket未连接,无法发送消息')
      return
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data).toString()
      this.ws.send(message)
      console.log('[UserbotWebSocket]  发送消息:', data)
    } catch (error) {
      console.error('[UserbotWebSocket] 发送消息失败:', error)
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('[UserbotWebSocket] 断开WebSocket连接')

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    // 关闭WebSocket连接
    if (this.ws) {
      try {
        this.ws.close(1000, '主动断开连接')
      } catch (error) {
        console.error('[UserbotWebSocket] 关闭连接时出错:', error)
      }
      this.ws = null
    }

    // 重置状态
    this.isConnected.value = false
    this.currentRoomId = null
    this.currentBotAccount = null
    this.reconnectAttempts = 0
  }

  /**
   * 添加消息处理器
   */
  onMessage(handler: (data: any) => void): void {
    this.messageHandlers.push(handler)
  }

  /**
   * 移除消息处理器
   */
  offMessage(handler: (data: any) => void): void {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  /**
   * 添加关闭处理器
   */
  onClose(handler: () => void): void {
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
    return this.currentRoomId
  }

  /**
   * 获取当前bot账号
   */
  getCurrentBotAccount(): string | null {
    return this.currentBotAccount
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
