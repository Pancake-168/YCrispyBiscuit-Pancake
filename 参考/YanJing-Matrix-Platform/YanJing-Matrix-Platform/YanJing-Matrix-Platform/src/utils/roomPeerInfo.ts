import type { RoomMember } from 'matrix-js-sdk'
import type { GetIMUserInfoApiResponse } from '@/types/WeChat'
import { GetIMUserInfo } from '@/services/Project/SSO/UserInfo'
import { matrixClient } from '@/services/Matrix/client'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { useIDmapStore } from '@/stores/IDmap'

export type ResolvedRoomPeerInfo = {
  matrixUserId: string
  username?: string
  nickname?: string
  type?: 'user' | 'bot'
  source: 'idmap' | 'im-user-info' | 'matrix-member'
}

const roomPeerInfoCache = new Map<string, ResolvedRoomPeerInfo[]>()
const roomPeerInfoInFlight = new Map<string, Promise<ResolvedRoomPeerInfo[]>>()

export const extractMatrixLocalpart = (value: string): string => {
  let normalized = value.trim()
  if (!normalized) return ''
  if (normalized.startsWith('@')) {
    normalized = normalized.slice(1)
  }
  const separatorIndex = normalized.indexOf(':')
  return separatorIndex >= 0 ? normalized.slice(0, separatorIndex) : normalized
}

const mapImUserInfo = (data: GetIMUserInfoApiResponse, fallbackMatrixUserId: string): ResolvedRoomPeerInfo => {
  return {
    matrixUserId: data.im?.trim() || fallbackMatrixUserId,
    username: data.username?.trim() || undefined,
    nickname: data.nickname?.trim() || undefined,
    type: data.atype === 'bot' ? 'bot' : 'user',
    source: 'im-user-info',
  }
}

const mapRoomMember = async (member: RoomMember): Promise<ResolvedRoomPeerInfo | null> => {
  const matrixUserId = member.userId?.trim() || ''
  if (!matrixUserId) return null

  const idmapStore = useIDmapStore()
  const localMapped = idmapStore.getByMatrixId(matrixUserId)
  if (localMapped) {
    return {
      matrixUserId: localMapped.matrixId?.trim() || matrixUserId,
      username: localMapped.username?.trim() || undefined,
      nickname: localMapped.nickname?.trim() || undefined,
      type: localMapped.type,
      source: 'idmap',
    }
  }

  const localpart = extractMatrixLocalpart(matrixUserId)
  if (!localpart) {
    return {
      matrixUserId,
      source: 'matrix-member',
    }
  }

  const result = await GetIMUserInfo(localpart)
  if (!result.ok || !result.data) {
    return {
      matrixUserId,
      source: 'matrix-member',
    }
  }

  return mapImUserInfo(result.data, matrixUserId)
}

export async function resolveRoomPeerInfos(roomId: string, force: boolean = false): Promise<ResolvedRoomPeerInfo[]> {
  if (!roomId) return []

  if (!force) {
    const cached = roomPeerInfoCache.get(roomId)
    if (cached) {
      return cached
    }

    const inFlight = roomPeerInfoInFlight.get(roomId)
    if (inFlight) {
      return await inFlight
    }
  }

  const task = (async () => {
    const client = matrixClient.getAuthedClient()
    const selfUserId = client?.getUserId?.() || ''
    const members = MatrixClientRoom.getRoomMembersById(roomId)
      .filter((member) => member.userId && member.userId !== selfUserId)

    const resolved: ResolvedRoomPeerInfo[] = []
    for (const member of members) {
      const info = await mapRoomMember(member)
      if (info) {
        resolved.push(info)
      }
    }

    roomPeerInfoCache.set(roomId, resolved)
    return resolved
  })()

  roomPeerInfoInFlight.set(roomId, task)

  try {
    return await task
  } finally {
    roomPeerInfoInFlight.delete(roomId)
  }
}

export function clearRoomPeerInfo(roomId: string): void {
  if (!roomId) return
  roomPeerInfoCache.delete(roomId)
  roomPeerInfoInFlight.delete(roomId)
}

export function clearAllRoomPeerInfo(): void {
  roomPeerInfoCache.clear()
  roomPeerInfoInFlight.clear()
}