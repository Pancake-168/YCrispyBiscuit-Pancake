import { onMounted, onUnmounted, watch } from 'vue'
import { userbotWebSocketService } from './websocket'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { useIDmapStore } from '@/stores/IDmap'
import { GetIMUserInfo } from '@/services/Project/SSO/UserInfo'

type RoomMemberLite = {
  userId?: string
  membership?: string
  events?: {
    member?: {
      event?: {
        origin_server_ts?: number
      }
    }
  }
}

type BotCandidate = {
  username: string
  joinTs: number
}

const botLookupInFlight = new Map<string, Promise<{ username: string; type: string } | null>>()

const extractMatrixLocalpart = (value: string): string => {
  let normalized = value.trim()
  if (!normalized) return ''
  if (normalized.startsWith('@')) {
    normalized = normalized.slice(1)
  }
  const separatorIndex = normalized.indexOf(':')
  return separatorIndex >= 0 ? normalized.slice(0, separatorIndex) : normalized
}

const getMappedBotCandidate = (matrixId: string, joinTs: number): BotCandidate | null => {
  const idmapStore = useIDmapStore()
  const mapped = idmapStore.getByMatrixId(matrixId)
  if (mapped?.type !== 'bot' || !mapped.username) return null

  return {
    username: mapped.username,
    joinTs,
  }
}

const resolveBotCandidateByMatrixId = async (matrixId: string, joinTs: number): Promise<BotCandidate | null> => {
  const mappedCandidate = getMappedBotCandidate(matrixId, joinTs)
  if (mappedCandidate) return mappedCandidate

  const localpart = extractMatrixLocalpart(matrixId)
  if (!localpart) return null

  const cacheKey = matrixId.trim() || localpart
  const existingTask = botLookupInFlight.get(cacheKey)
  if (existingTask) {
    const existingResult = await existingTask
    if (!existingResult || existingResult.type !== 'bot' || !existingResult.username) return null
    return {
      username: existingResult.username,
      joinTs,
    }
  }

  const task = (async () => {
    const result = await GetIMUserInfo(localpart)
    if (!result.ok || !result.data?.username) {
      return null
    }

    return {
      username: result.data.username,
      type: result.data.atype || '',
    }
  })()

  botLookupInFlight.set(cacheKey, task)

  try {
    const resolved = await task
    if (!resolved || resolved.type !== 'bot' || !resolved.username) return null
    return {
      username: resolved.username,
      joinTs,
    }
  } finally {
    botLookupInFlight.delete(cacheKey)
  }
}

const sortAndUniqueBotCandidates = (botCandidates: BotCandidate[]): string[] => {
  if (botCandidates.length === 0) return []

  botCandidates.sort((a, b) => {
    if (a.joinTs !== b.joinTs) return a.joinTs - b.joinTs
    return a.username.localeCompare(b.username)
  })

  return Array.from(new Set(botCandidates.map((item) => item.username)))
}

export const getBotUsernamesFromRoomMembers = (roomId: string): string[] => {
  try {
    const members = MatrixClientRoom.getRoomMembersById(roomId)
    if (!Array.isArray(members) || members.length === 0) return []

    const typedMembers = members as RoomMemberLite[]

    const activeMembers = typedMembers.filter(
      (m) => !m?.membership || m.membership === 'join' || m.membership === 'invite'
    )

    const botCandidates: Array<{ username: string; joinTs: number }> = []

    for (const m of activeMembers) {
      const matrixId = m?.userId
      if (typeof matrixId !== 'string' || matrixId.trim().length === 0) continue

      const joinTs = Number(m?.events?.member?.event?.origin_server_ts ?? 0)
      const normalizedJoinTs = Number.isFinite(joinTs) ? joinTs : 0
      const mappedCandidate = getMappedBotCandidate(matrixId, normalizedJoinTs)
      if (!mappedCandidate) continue

      botCandidates.push(mappedCandidate)
    }

    return sortAndUniqueBotCandidates(botCandidates)
  } catch (error) {
    console.warn('[System:useUserbotWebSocket:getBotUsernamesFromRoomMembers] 通过成员+IDmap识别bot失败:', error)
    return []
  }
}

export const getBotUsernamesFromRoomMembersAsync = async (roomId: string): Promise<string[]> => {
  try {
    const members = MatrixClientRoom.getRoomMembersById(roomId)
    if (!Array.isArray(members) || members.length === 0) return []

    const typedMembers = members as RoomMemberLite[]
    const activeMembers = typedMembers.filter(
      (m) => !m?.membership || m.membership === 'join' || m.membership === 'invite'
    )

    const botCandidates: BotCandidate[] = []
    const pendingCandidates: Array<Promise<BotCandidate | null>> = []

    for (const m of activeMembers) {
      const matrixId = m?.userId
      if (typeof matrixId !== 'string' || matrixId.trim().length === 0) continue

      const joinTs = Number(m?.events?.member?.event?.origin_server_ts ?? 0)
      const normalizedJoinTs = Number.isFinite(joinTs) ? joinTs : 0
      const mappedCandidate = getMappedBotCandidate(matrixId, normalizedJoinTs)
      if (mappedCandidate) {
        botCandidates.push(mappedCandidate)
        continue
      }

      pendingCandidates.push(resolveBotCandidateByMatrixId(matrixId, normalizedJoinTs))
    }

    if (pendingCandidates.length > 0) {
      const resolvedCandidates = await Promise.all(pendingCandidates)
      for (const candidate of resolvedCandidates) {
        if (candidate) {
          botCandidates.push(candidate)
        }
      }
    }

    return sortAndUniqueBotCandidates(botCandidates)
  } catch (error) {
    console.warn('[System:useUserbotWebSocket:getBotUsernamesFromRoomMembersAsync] 通过成员+GetIMUserInfo识别bot失败:', error)
    return getBotUsernamesFromRoomMembers(roomId)
  }
}

export const getBotUsernameFromRoomMembers = (roomId: string): string | null => {
  const botUsernames = getBotUsernamesFromRoomMembers(roomId)
  return botUsernames[0] || null
}

export const getBotUsernameFromRoomMembersAsync = async (roomId: string): Promise<string | null> => {
  const botUsernames = await getBotUsernamesFromRoomMembersAsync(roomId)
  return botUsernames[0] || null
}

export const connectUserbotForRoom = async (roomId: string) => {
  if (!roomId) return
  const botUsernames = await getBotUsernamesFromRoomMembersAsync(roomId)
  if (botUsernames.length === 0) return
  for (const botUsername of botUsernames) {
    console.log('[System:useUserbotWebSocket:connectUserbotForRoom] 手动触发连接（bot username）:', botUsername)
    userbotWebSocketService.connect(roomId, botUsername)
  }
}

/**
 * 使用Userbot WebSocket的Composable
 * 
 * 功能:
 * 1. 根据当前房间成员（IDMap）识别 bot 账号
 * 2. 在自动模式下随房间切换建立/清理 bot WebSocket 连接
 * 3. 在手动模式下由调用方在发送前触发连接
 * 
 * @param currentRoomId - 当前房间ID的ref
 * @param onMessage - 可选的消息处理回调
 * @param options - 配置选项
 */
export function useUserbotWebSocket(
  currentRoomId: { value: string | null | undefined },
  onMessage?: (data: unknown) => void,
  options: { manualConnect?: boolean; enabled?: { value: boolean } } = {}
) {
  /**
   * 手动连接WebSocket
   * 用于 manualConnect: true 的场景
   */
  const connect = () => {
    const roomId = currentRoomId.value
    if (!roomId) return
    void connectUserbotForRoom(roomId)
  }

  /**
   * 处理房间切换
   */
  const handleRoomChange = async (roomId: string | null | undefined) => {
    console.log('[System:useUserbotWebSocket:handleRoomChange] 房间切换:', roomId)

    // 手动连接模式：不在切房间时自动连
    if (options.manualConnect) {
      console.log('[System:useUserbotWebSocket:handleRoomChange] 手动模式，跳过自动连接')
      return
    }

    if (!roomId) {
      if (userbotWebSocketService.getIsConnected()) {
        userbotWebSocketService.disconnect()
      }
      return
    }

    const botUsernames = await getBotUsernamesFromRoomMembersAsync(roomId)
    if (botUsernames.length === 0) {
      if (userbotWebSocketService.getIsConnected()) {
        console.log('[System:useUserbotWebSocket:handleRoomChange] 当前房间未识别到bot，断开WebSocket连接')
        userbotWebSocketService.disconnect()
      }
      return
    }

    userbotWebSocketService.disconnect()
    for (const botUsername of botUsernames) {
      console.log('[System:useUserbotWebSocket:handleRoomChange] 自动连接到bot WebSocket（bot username）:', botUsername)
      userbotWebSocketService.connect(roomId, botUsername)
    }
  }

  const isMessageHandlerRegistered = { value: false }
  const setMessageHandlerRegistration = (shouldRegister: boolean) => {
    if (!onMessage) return
    if (shouldRegister) {
      if (isMessageHandlerRegistered.value) return
      userbotWebSocketService.onMessage(onMessage)
      isMessageHandlerRegistered.value = true
      return
    }
    if (!isMessageHandlerRegistered.value) return
    userbotWebSocketService.offMessage(onMessage)
    isMessageHandlerRegistered.value = false
  }

  if (onMessage) {
    onMounted(() => {
      const enabled = options.enabled ? options.enabled.value : true
      setMessageHandlerRegistration(enabled)
    })

    if (options.enabled) {
      watch(
        () => options.enabled?.value,
        (enabled) => {
          setMessageHandlerRegistration(!!enabled)
        }
      )
    }

    onUnmounted(() => {
      setMessageHandlerRegistration(false)
    })
  }

  // 监听房间变化
  watch(
    () => currentRoomId.value,
    (newRoomId) => {
      void handleRoomChange(newRoomId)
    },
    { immediate: true }
  )

  // 组件卸载时断开连接
  onUnmounted(() => {
    console.log('[System:useUserbotWebSocket:onUnmounted] 组件卸载,断开WebSocket连接')
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
