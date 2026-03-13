import { matrixClientV2 } from './client'
import type { SearchResult, UserSearchResult, RoomSearchResult, SpaceSearchResult } from '../../types/room-management.types'
import { resolveUserDisplayName } from '@/utils/displayName'

export interface PublicRoomsExtraOptions {
  server?: string
  includeAllNetworks?: boolean
  thirdPartyInstanceId?: string
  roomTypes?: string[] // e.g. ['m.space']
}

export async function searchUsersDirectory(term: string, options?: { limit?: number }): Promise<SearchResult<UserSearchResult>[]> {
  const client = matrixClientV2.getAuthedClient()
  if (!client || !term?.trim()) return []
  try {
    const res = await client.searchUserDirectory({ term, limit: options?.limit ?? 25 })
    return (res?.results ?? []).map((u: any, index: number) => ({
      index,
      item: {
        userId: u.user_id,
        displayName: resolveUserDisplayName({ matrixId: u.user_id, matrixDisplayName: u.display_name || null }),
        avatarUrl: u.avatar_url || undefined,
        serverName: (u.user_id?.split(':')[1]) || '',
        isKnown: false,
        score: 1,
      },
    }))
  } catch (e) {
    console.warn('[TheBestSearch] searchUsersDirectory error:', e)
    return []
  }
}

export async function searchPublicRooms(term: string, opts?: PublicRoomsExtraOptions & { limit?: number }): Promise<SearchResult<RoomSearchResult>[]> {
  const client = matrixClientV2.getAuthedClient()
  if (!client) return []
  try {
    const res = await client.publicRooms({
      server: opts?.server,
      limit: opts?.limit ?? 25,
      include_all_networks: !!opts?.includeAllNetworks,
      third_party_instance_id: opts?.thirdPartyInstanceId,
      filter: {
        generic_search_term: term,
        room_types: opts?.roomTypes,
      },
    })
    const chunk: any[] = (res?.chunk || []).filter((room: any) => room?.room_type !== 'm.space' && room?.roomType !== 'm.space')
    return chunk.map((room, index) => ({
      index,
      item: {
        roomId: room.room_id,
        name: room.name || room.canonical_alias || room.room_id,
        topic: room.topic || undefined,
        alias: room.canonical_alias || undefined,
        memberCount: room.num_joined_members || 0,
        isEncrypted: !!room.encryption,
        avatarUrl: room.avatar_url || undefined,
        serverName: (room.room_id?.split(':')[1]) || '',
        joinRule: (room.join_rule || 'public'),
        canJoin: true,
        score: 1,
      },
    }))
  } catch (e) {
    console.warn('[TheBestSearch] searchPublicRooms error:', e)
    return []
  }
}

/**
 * 公开房间目录（分页版）
 */
export async function searchPublicRoomsPaged(
  term: string,
  opts?: PublicRoomsExtraOptions & { limit?: number; since?: string }
): Promise<{ results: SearchResult<RoomSearchResult>[]; next?: string }> {
  const client = matrixClientV2.getAuthedClient()
  if (!client) return { results: [], next: undefined }
  try {
    // matrix-js-sdk: publicRooms supports 'since'
    const res = await (client as any).publicRooms({
      server: opts?.server,
      limit: opts?.limit ?? 25,
      since: opts?.since,
      include_all_networks: !!opts?.includeAllNetworks,
      third_party_instance_id: opts?.thirdPartyInstanceId,
      filter: {
        generic_search_term: term,
        room_types: opts?.roomTypes,
      },
    })
    const chunk: any[] = (res?.chunk || []).filter((room: any) => room?.room_type !== 'm.space' && room?.roomType !== 'm.space')
    const results = chunk.map((room, index) => ({
      index,
      item: {
        roomId: room.room_id,
        name: room.name || room.canonical_alias || room.room_id,
        topic: room.topic || undefined,
        alias: room.canonical_alias || undefined,
        memberCount: room.num_joined_members || 0,
        isEncrypted: !!room.encryption,
        avatarUrl: room.avatar_url || undefined,
        serverName: (room.room_id?.split(':')[1]) || '',
        joinRule: (room.join_rule || 'public'),
        canJoin: true,
        score: 1,
      },
    })) as SearchResult<RoomSearchResult>[]
    const next = res?.next_batch || res?.nextBatch || res?.next
    return { results, next }
  } catch (e) {
    console.warn('[TheBestSearch] searchPublicRoomsPaged error:', e)
    return { results: [], next: undefined }
  }
}

/**
 * 在本地“我已加入的房间”中做轻量匹配（支持私有房间）。
 * 匹配字段：名称、规范别名、其它别名、话题；可选：成员 displayName/@id。
 * 仅做本地过滤，不发额外网络请求。
 */
export async function searchMyJoinedRooms(
  term: string,
  opts?: { limit?: number; includeMemberMatch?: boolean; memberLimitPerRoom?: number }
): Promise<SearchResult<RoomSearchResult>[]> {
  const client = matrixClientV2.getAuthedClient()
  const limit = opts?.limit ?? 25
  const includeMemberMatch = opts?.includeMemberMatch ?? true
  const memberLimitPerRoom = Math.max(0, opts?.memberLimitPerRoom ?? 80)
  if (!client || !term?.trim()) return []
  const q = term.toLowerCase()
  const out: SearchResult<RoomSearchResult>[] = []
  try {
    // matrix-js-sdk: client.getRooms() -> Room[]
    const rooms: any[] = (client as any).getRooms?.() || []
    for (const room of rooms) {
      if (out.length >= limit) break
      try {
        const roomId: string = room?.roomId || room?.room_id
        if (!roomId) continue
        // 过滤 Space
        const type = room?.getType?.()
        const isSpace = (room?.isSpaceRoom?.() === true) || type === 'm.space'
        if (isSpace) continue
        const serverName = (roomId.split(':')[1]) || ''
        const name: string = room?.name || room?.getName?.() || ''
        const topic: string = room?.getTopic?.() || ''
        const canonicalAlias: string = room?.getCanonicalAlias?.() || ''
        const aliases: string[] = room?.getAliases?.() || []
        const hay = [name, topic, canonicalAlias, ...aliases].filter(Boolean).map((s) => String(s).toLowerCase())
        let matched = hay.some((s) => s.includes(q))
        if (!matched && includeMemberMatch && q.length >= 2) {
          const members: any[] = room?.getMembersWithMembership?.('join') || room?.getJoinedMembers?.() || []
          let checked = 0
          for (const m of members) {
            if (checked >= memberLimitPerRoom) break
            checked++
            const uid: string = m?.userId || m?.user_id || ''
            const dn: string = m?.name || m?.rawDisplayName || ''
            if ((uid && uid.toLowerCase().includes(q)) || (dn && String(dn).toLowerCase().includes(q))) {
              matched = true
              break
            }
          }
        }
        if (!matched) continue
        const memberCount: number = room?.getJoinedMemberCount?.() ?? room?.getMemberCount?.() ?? 0
        const isEncrypted: boolean = !!room?.currentState?.getStateEvents?.('m.room.encryption', '')
        const joinRule: string = room?.getJoinRule?.() || 'invite'
        out.push({
          index: out.length,
          item: {
            roomId,
            name: name || canonicalAlias || roomId,
            topic: topic || undefined,
            alias: canonicalAlias || undefined,
            memberCount,
            isEncrypted,
            avatarUrl: room?.getAvatarUrl?.((client as any).baseUrl, 36, 36, 'scale', false) || undefined,
            serverName,
            // @ts-ignore - joinRule 类型宽松到我们的定义
            joinRule,
            canJoin: false, // 已加入房间：不展示“可加入”
            score: 2, // 本地命中可稍微提高权重
          },
        })
      } catch {
        // 单房间异常忽略
      }
    }
  } catch (e) {
    console.warn('[TheBestSearch] searchMyJoinedRooms error:', e)
  }
  return out
}

export async function searchPublicSpaces(term: string, opts?: PublicRoomsExtraOptions & { limit?: number }): Promise<SearchResult<SpaceSearchResult>[]> {
  const rooms = await searchPublicRooms(term, { ...opts, roomTypes: ['m.space'] })
  return rooms.map((r) => ({
    index: r.index,
    item: {
      spaceId: r.item.roomId,
      name: r.item.name,
      topic: r.item.topic,
      memberCount: r.item.memberCount,
      childRoomCount: 0,
      avatarUrl: r.item.avatarUrl,
      serverName: r.item.serverName,
      joinRule: r.item.joinRule,
      canJoin: r.item.canJoin,
      score: r.item.score,
    },
  }))
}

export async function getThirdpartyProtocols(): Promise<any> {
  const client = matrixClientV2.getAuthedClient()
  if (!client) return {}
  try {
    // matrix-js-sdk supports this method
    // @ts-ignore
    const res = await client.getThirdpartyProtocols?.()
    return res || {}
  } catch (e) {
    console.warn('[TheBestSearch] getThirdpartyProtocols error:', e)
    return {}
  }
}

export async function getProfileInfo(userId: string): Promise<{ displayName?: string; avatarUrl?: string } | null> {
  const client = matrixClientV2.getAuthedClient()
  if (!client || !userId) return null
  try {
    const res = await client.getProfileInfo(userId)
    return { displayName: res?.displayname, avatarUrl: res?.avatar_url }
  } catch (e) {
    return null
  }
}

export interface MessageSearchResultItem {
  eventId: string
  roomId: string
  sender: string
  body: string
  originServerTs: number
  profile?: { displayName?: string; avatarUrl?: string }
  highlights?: string[]
}

export async function serverSideMessageSearch(query: string, limit = 20): Promise<MessageSearchResultItem[]> {
  const client = matrixClientV2.getAuthedClient()
  if (!client || !query?.trim()) return []
  try {
    // @ts-ignore - matrix-js-sdk: client.search({ body }) exists
    const res = await client.search({
      body: {
        search_categories: {
          room_events: {
            search_term: query,
            order_by: 'rank',
            event_context: { before_limit: 0, after_limit: 0, include_profile: true },
            include_state: false,
            limit,
            filter: { types: ['m.room.message'] },
            // scope: 'global', // server decides based on auth
          },
        },
      },
    })
    const results = res?.search_categories?.room_events
    const events: any[] = results?.results || []
    return events.map((r: any) => ({
      eventId: r.result?.event_id,
      roomId: r.result?.room_id,
      sender: r.result?.sender,
      body: r.result?.content?.body || '',
      originServerTs: r.result?.origin_server_ts || 0,
      profile: r.context?.profile_info?.[r.result?.sender] || undefined,
      highlights: results?.highlights || [],
    }))
  } catch (e) {
    console.warn('[TheBestSearch] serverSideMessageSearch error:', e)
    return []
  }
}

/**
 * 服务器端消息搜索（分页版）
 */
export async function serverSideMessageSearchPaged(
  query: string,
  limit = 20,
  nextBatch?: string
): Promise<{ results: MessageSearchResultItem[]; next?: string }> {
  const client = matrixClientV2.getAuthedClient()
  if (!client || !query?.trim()) return { results: [], next: undefined }
  try {
    const body: any = {
      search_categories: {
        room_events: {
          search_term: query,
          order_by: 'rank',
          event_context: { before_limit: 0, after_limit: 0, include_profile: true },
          include_state: false,
          limit,
          filter: { types: ['m.room.message'] },
        },
      },
    }
    if (nextBatch) body.search_categories.room_events.next_batch = nextBatch
    // @ts-ignore
    const res = await client.search({ body })
    const cat = res?.search_categories?.room_events
    const events: any[] = cat?.results || []
    const results = events.map((r: any) => ({
      eventId: r.result?.event_id,
      roomId: r.result?.room_id,
      sender: r.result?.sender,
      body: r.result?.content?.body || '',
      originServerTs: r.result?.origin_server_ts || 0,
      profile: cat?.context?.profile_info?.[r.result?.sender] || undefined,
      highlights: cat?.highlights || [],
    })) as MessageSearchResultItem[]
    const next = cat?.next_batch || cat?.nextBatch || undefined
    return { results, next }
  } catch (e) {
    console.warn('[TheBestSearch] serverSideMessageSearchPaged error:', e)
    return { results: [], next: undefined }
  }
}

/**
 * 本地房间（分页版）：通过 startIndex 分批扫描我已加入的房间数组
 */
export async function searchMyJoinedRoomsPaged(
  term: string,
  opts?: { limit?: number; includeMemberMatch?: boolean; memberLimitPerRoom?: number; startIndex?: number }
): Promise<{ results: SearchResult<RoomSearchResult>[]; nextIndex?: number }> {
  const client = matrixClientV2.getAuthedClient()
  const limit = opts?.limit ?? 25
  const includeMemberMatch = opts?.includeMemberMatch ?? true
  const memberLimitPerRoom = Math.max(0, opts?.memberLimitPerRoom ?? 80)
  const startIndex = Math.max(0, opts?.startIndex ?? 0)
  if (!client || !term?.trim()) return { results: [], nextIndex: startIndex }
  const q = term.toLowerCase()
  const out: SearchResult<RoomSearchResult>[] = []
  try {
    const rooms: any[] = (client as any).getRooms?.() || []
    for (let i = startIndex; i < rooms.length; i++) {
      const room = rooms[i]
      try {
        const roomId: string = room?.roomId || room?.room_id
        if (!roomId) continue
        // 过滤 Space
        const type = room?.getType?.()
        const isSpace = (room?.isSpaceRoom?.() === true) || type === 'm.space'
        if (isSpace) {
          if (out.length >= limit) return { results: out, nextIndex: i + 1 }
          continue
        }
        const serverName = (roomId.split(':')[1]) || ''
        const name: string = room?.name || room?.getName?.() || ''
        const topic: string = room?.getTopic?.() || ''
        const canonicalAlias: string = room?.getCanonicalAlias?.() || ''
        const aliases: string[] = room?.getAliases?.() || []
        const hay = [name, topic, canonicalAlias, ...aliases].filter(Boolean).map((s) => String(s).toLowerCase())
        let matched = hay.some((s) => s.includes(q))
        if (!matched && includeMemberMatch && q.length >= 2) {
          const members: any[] = room?.getMembersWithMembership?.('join') || room?.getJoinedMembers?.() || []
          let checked = 0
          for (const m of members) {
            if (checked >= memberLimitPerRoom) break
            checked++
            const uid: string = m?.userId || m?.user_id || ''
            const dn: string = m?.name || m?.rawDisplayName || ''
            if ((uid && uid.toLowerCase().includes(q)) || (dn && String(dn).toLowerCase().includes(q))) {
              matched = true
              break
            }
          }
        }
        if (!matched) continue
        const memberCount: number = room?.getJoinedMemberCount?.() ?? room?.getMemberCount?.() ?? 0
        const isEncrypted: boolean = !!room?.currentState?.getStateEvents?.('m.room.encryption', '')
        const joinRule: string = room?.getJoinRule?.() || 'invite'
        out.push({
          index: out.length,
          item: {
            roomId,
            name: name || canonicalAlias || roomId,
            topic: topic || undefined,
            alias: canonicalAlias || undefined,
            memberCount,
            isEncrypted,
            avatarUrl: room?.getAvatarUrl?.((client as any).baseUrl, 36, 36, 'scale', false) || undefined,
            serverName,
            // @ts-ignore
            joinRule,
            canJoin: false,
            score: 2,
          },
        })
        if (out.length >= limit) {
          return { results: out, nextIndex: i + 1 }
        }
      } catch {
        // ignore this room
      }
    }
    return { results: out, nextIndex: rooms.length }
  } catch (e) {
    console.warn('[TheBestSearch] searchMyJoinedRoomsPaged error:', e)
    return { results: out, nextIndex: startIndex }
  }
}
