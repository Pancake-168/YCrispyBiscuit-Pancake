import { onMounted, onUnmounted, watch } from 'vue'
import { userbotWebSocketService } from './websocket'
import { roomServiceV2 } from '@/services/matrix/rooms'
import { useIDmapStore } from '@/stores/IDmap'

/**
 * 使用Userbot WebSocket的Composable
 * 
 * 功能:
 * 1. 自动检测当前是否在AI助手专属房间
 * 2. 在专属房间时自动连接WebSocket
 * 3. 离开专属房间时自动断开连接
 * 
 * @param currentRoomId - 当前房间ID的ref
 * @param onMessage - 可选的消息处理回调
 * @param options - 配置选项
 */
export function useUserbotWebSocket(
  currentRoomId: { value: string | null | undefined },
  onMessage?: (data: any) => void,
  options: { manualConnect?: boolean } = {}
) {

  /**
   * 新逻辑：不区分房间类型。
   * 读取房间成员（join/invite），用 IDmap 按成员 matrixId 查询；
   * 若某成员被标记为 bot，则返回该 bot 的 username（用于连接 WebSocket）。
   */
  const getBotUsernameFromRoomMembers = (roomId: string): string | null => {
    try {
      const idmapStore = useIDmapStore()
      const members = roomServiceV2.获取房间成员(roomId)
      if (!Array.isArray(members) || members.length === 0) return null

      const activeMembers = members.filter(
        (m: any) => !m?.membership || m.membership === 'join' || m.membership === 'invite'
      )

      const botCandidates: Array<{ username: string; joinTs: number }> = []

      for (const m of activeMembers) {
        const matrixId = m?.userId
        if (typeof matrixId !== 'string' || matrixId.trim().length === 0) continue

        const mapped = idmapStore.getByMatrixId(matrixId)
        if (mapped?.type !== 'bot' || !mapped.username) continue

        const memberEvent = m?.events?.member
        const joinTs =
          (typeof memberEvent?.getTs === 'function' ? Number(memberEvent.getTs()) : undefined) ??
          Number(memberEvent?.event?.origin_server_ts ?? 0)

        botCandidates.push({ username: mapped.username, joinTs: Number.isFinite(joinTs) ? joinTs : 0 })
      }

      if (botCandidates.length === 0) return null

      // 默认取“最先加入/被邀请”的 bot：时间戳越小越优先
      botCandidates.sort((a, b) => {
        if (a.joinTs !== b.joinTs) return a.joinTs - b.joinTs
        return a.username.localeCompare(b.username)
      })

      return botCandidates[0].username
    } catch (error) {
      console.error('[useUserbotWebSocket] 通过成员+IDmap识别bot失败:', error)
      return null
    }
  }

  /**
   * 手动连接WebSocket
   * 用于 manualConnect: true 的场景
   */
  const connect = () => {
    const roomId = currentRoomId.value
    if (!roomId) return
    const botUsername = getBotUsernameFromRoomMembers(roomId)
    if (botUsername) {
      console.log('[useUserbotWebSocket] 手动触发连接（bot username）:', botUsername)
      userbotWebSocketService.connect(roomId, botUsername)
    }
  }

  /**
   * 处理房间切换
   */
  const handleRoomChange = (roomId: string | null | undefined) => {
    console.log('[useUserbotWebSocket] 房间切换:', roomId)

    // 手动连接模式：不在切房间时自动连
    if (options.manualConnect) {
      console.log('[useUserbotWebSocket] 手动模式，跳过自动连接')
      return
    }

    if (!roomId) {
      if (userbotWebSocketService.getIsConnected()) {
        userbotWebSocketService.disconnect()
      }
      return
    }

    const botUsername = getBotUsernameFromRoomMembers(roomId)
    if (!botUsername) {
      if (userbotWebSocketService.getIsConnected()) {
        console.log('[useUserbotWebSocket] 当前房间未识别到bot，断开WebSocket连接')
        userbotWebSocketService.disconnect()
      }
      return
    }

    console.log('[useUserbotWebSocket] 自动连接到bot WebSocket（bot username）:', botUsername)
    userbotWebSocketService.connect(roomId, botUsername)
  }

  // 注册消息处理器
  if (onMessage) {
    onMounted(() => {
      userbotWebSocketService.onMessage(onMessage)
    })

    onUnmounted(() => {
      userbotWebSocketService.offMessage(onMessage)
    })
  }

  // 监听房间变化
  watch(
    () => currentRoomId.value,
    (newRoomId) => {
      handleRoomChange(newRoomId)
    },
    { immediate: true }
  )

  // 组件卸载时断开连接
  onUnmounted(() => {
    console.log('[useUserbotWebSocket] 组件卸载,断开WebSocket连接')
    userbotWebSocketService.disconnect()
  })

  return {
    isConnected: userbotWebSocketService.getIsConnected.bind(userbotWebSocketService),
    send: userbotWebSocketService.send.bind(userbotWebSocketService),
    disconnect: userbotWebSocketService.disconnect.bind(userbotWebSocketService),
    connect, // 导出 connect 方法
    onMessage: userbotWebSocketService.onMessage.bind(userbotWebSocketService),
    offMessage: userbotWebSocketService.offMessage.bind(userbotWebSocketService),
    onClose: userbotWebSocketService.onClose.bind(userbotWebSocketService),
    offClose: userbotWebSocketService.offClose.bind(userbotWebSocketService)
  }
}
