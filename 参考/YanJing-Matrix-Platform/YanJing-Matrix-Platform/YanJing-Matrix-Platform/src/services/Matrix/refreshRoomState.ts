import { useAppStore } from '@/stores/app'
import { useSystemStore } from '@/stores/System'
import { useRoomMapStore } from '@/stores/RoomMap'
import { useRoomDisplayStore } from '@/stores/RoomDisplay'
import { useRoomClassificationStore } from '@/stores/RoomClassification'
import { matrixClient } from '@/services/Matrix/client'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { matrixMessageService } from '@/services/Matrix/message'

export type RefreshRoomStateOptions = {
  showLoading?: boolean
  loadingText?: string
  preferredRoomId?: string
  refreshCurrentMessages?: boolean
}

const pickFirstJoinedRoomId = (roomIds: string[]): string | undefined => {
  const client = matrixClient.getAuthedClient()
  if (!client) return roomIds[0]

  const joined = roomIds.find((roomId) => {
    const room = client.getRoom(roomId)
    const membership = room?.getMyMembership?.() || ''
    return membership === 'join'
  })

  return joined || roomIds[0]
}

/**
 * 统一刷新“消息页房间域状态”。
 * - 刷新 SystemRooms
 * - 修正 currentSystemRoomId（优先 preferredRoomId）
 * - 可选刷新当前房间消息
 * - 可选显示主页面全局遮罩
 */
export async function refreshRoomState(options?: RefreshRoomStateOptions): Promise<{ currentRoomId: string; roomCount: number }> {
  const appStore = useAppStore()
  const systemStore = useSystemStore()
  const roomMapStore = useRoomMapStore()
  const roomDisplayStore = useRoomDisplayStore()
  const roomClassificationStore = useRoomClassificationStore()

  const showLoading = options?.showLoading ?? true
  if (showLoading) {
    appStore.setLoading(true, options?.loadingText || '正在刷新数据...')
  }

  try {
    const rooms = MatrixClientRoom.getNormalRooms()
    await roomClassificationStore.refreshRoomClassifications(rooms, { force: true })
    const taggedRooms = roomClassificationStore.buildTaggedRoomEntries(rooms)
    systemStore.setTaggedSystemRooms(taggedRooms)
    roomMapStore.rebuildFromSystemRooms()

    const preferredRoomId = options?.preferredRoomId
    const preferredTaggedRoom = preferredRoomId
      ? taggedRooms.find((item) => MatrixClientRoom.getRoomId(item.room) === preferredRoomId)
      : undefined
    const preferredFunction = preferredTaggedRoom?.type === 'bot' ? 'Mission' : preferredTaggedRoom?.type === 'user' ? 'Message' : null

    if (preferredFunction && systemStore.currentFunction !== preferredFunction) {
      await systemStore.setCurrentFunction(preferredFunction)
    }

    const expectedType = systemStore.currentFunction === 'Mission' ? 'bot' : 'user'
    const roomIds = taggedRooms
      .filter((item) => item.type === expectedType)
      .map((item) => MatrixClientRoom.getRoomId(item.room))
      .filter(Boolean)

    if (showLoading) {
      await roomDisplayStore.prefetchRoomDisplayProfiles(roomIds)
      if (preferredRoomId && roomIds.includes(preferredRoomId)) {
        await roomDisplayStore.prefetchRoomDisplayProfiles([preferredRoomId], true)
      }
    } else {
      void roomDisplayStore.prefetchRoomDisplayProfiles(roomIds)
      if (preferredRoomId && roomIds.includes(preferredRoomId)) {
        void roomDisplayStore.prefetchRoomDisplayProfiles([preferredRoomId], true)
      }
    }
    const currentId = systemStore.currentSystemRoomId

    let nextRoomId = ''

    if (preferredRoomId && roomIds.includes(preferredRoomId)) {
      nextRoomId = preferredRoomId
    } else if (currentId && roomIds.includes(currentId)) {
      nextRoomId = currentId
    } else {
      nextRoomId = pickFirstJoinedRoomId(roomIds) || ''
    }

    if (nextRoomId !== currentId) {
      systemStore.setCurrentSystemRoomId(nextRoomId)
    }

    if (options?.refreshCurrentMessages !== false && nextRoomId) {
      matrixMessageService.getRoomMessages(nextRoomId)
    }

    return {
      currentRoomId: nextRoomId,
      roomCount: roomIds.length,
    }
  } finally {
    if (showLoading) {
      appStore.setLoading(false)
    }
  }
}
