import { matrixClientV2 } from './client'
import type { UserSearchResult, RoomSearchResult, SpaceSearchResult, SearchOptions, ObjectType, SearchResult } from '../../types/room-management.types'
import { ObjectType as ObjectTypeEnum } from '../../types/room-management.types'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import { resolveUserDisplayName } from '@/utils/displayName'

/**
 * 搜索用户 - 使用Matrix SDK API获取精确结果
 * 增强：支持自动补全后缀和精准兜底查找
 */
export const 搜索用户 = async (searchTerm: string, options?: SearchOptions): Promise<SearchResult<UserSearchResult>[]> => {
  try {
    const results: SearchResult<UserSearchResult>[] = []
    
    console.log('[搜索用户] 开始搜索:', searchTerm, options)
    
    // 获取已认证的客户端实例
    const client = matrixClientV2.getAuthedClient()
    
    if (!client) {
      console.warn('[搜索用户] 客户端未认证')
      return results
    }
    
    // 1. 标准目录搜索
    try {
      console.log('[搜索用户] 调用 searchUserDirectory API')
      const searchResponse = await client.searchUserDirectory({
        term: searchTerm,
        limit: options?.limit || 50
      })
      
      console.log('[搜索用户] API响应:', searchResponse)
      
      if (searchResponse?.results && Array.isArray(searchResponse.results)) {
        console.log('[搜索用户] 找到结果数量:', searchResponse.results.length)
        
        searchResponse.results.forEach((user: any, index: number) => {
          if (user.user_id) {
            const userResult = {
              index,
              item: {
                userId: user.user_id,
                displayName: user.display_name || user.user_id,
                avatarUrl: user.avatar_url || undefined,
                serverName: user.user_id.split(':')[1] || '',
                isKnown: false,
                score: 1.0
              }
            }
            results.push(userResult)
            console.log('[搜索用户] 添加用户结果:', userResult)
          }
        })
      } else {
        console.log('[搜索用户] 没有找到结果或结果格式不正确')
      }
    } catch (error) {
      console.warn('[搜索用户] 用户目录搜索失败:', error)
    }

    // 2. 智能补全与兜底查找 (仿照 TheBestSearch 逻辑)
    // 如果输入看起来像 ID，尝试直接获取 Profile
    const term = searchTerm.trim()
    const atLike = term.startsWith('@')
    const defTail = (MATRIX_SERVER_URL_TAIL || '').replace(/^:+/, '')
    
    // 情况A: 完整ID (@user:server.com)
    const looksLikeFullMxid = atLike && term.includes(':') && term.length > 3
    // 情况B: 本地ID (@user)，且未包含冒号
    const looksLikeLocalMxid = atLike && !term.includes(':') && term.length > 1

    if (looksLikeFullMxid || looksLikeLocalMxid) {
      // 如果是本地ID，自动补全后缀
      const mxid = looksLikeLocalMxid && defTail ? `${term}:${defTail}` : term
      
      // 检查该用户是否已存在于目录搜索结果中
      const exists = results.some(r => r.item.userId === mxid)
      
      if (!exists) {
        try {
          console.log('[搜索用户] 尝试智能补全查找:', mxid)
          const profile = await client.getProfileInfo(mxid)
          
          if (profile) {
            const syntheticResult: SearchResult<UserSearchResult> = {
              index: -1, // 特殊索引标识
              item: {
                userId: mxid,
                displayName: profile.displayname || mxid,
                avatarUrl: profile.avatar_url || undefined,
                serverName: mxid.split(':')[1] || '',
                isKnown: false,
                score: 2.0 // 给予较高权重，排在前面
              }
            }
            // 将精准匹配的结果插入到最前面
            results.unshift(syntheticResult)
            console.log('[搜索用户]  智能补全找到用户:', syntheticResult)
          }
        } catch (e) {
          // 忽略查找失败（用户可能确实不存在）
          console.log('[搜索用户] 智能补全查找未找到或失败:', mxid)
        }
      }
    }
    
    console.log('[搜索用户] 最终返回结果数量:', results.length)
    return results
  } catch (error) {
    console.error('[搜索用户] 搜索用户失败:', error)
    return []
  }
}

/**
 * 搜索公开房间 - 使用Matrix SDK API获取精确结果
 */
export const 搜索公开房间 = async (searchTerm: string, options?: SearchOptions): Promise<SearchResult<RoomSearchResult>[]> => {
  try {
    const results: SearchResult<RoomSearchResult>[] = []
    
    // 获取已认证的客户端实例
    const client = matrixClientV2.getAuthedClient()
    
    if (client) {
      try {
        // 使用 Matrix SDK publicRooms API 搜索公开房间
        const publicRoomsResponse = await client.publicRooms({
          filter: {
            generic_search_term: searchTerm
          },
          limit: options?.limit || 50,
          server: options?.servers?.[0] || undefined
        })
        
        if (publicRoomsResponse?.chunk && Array.isArray(publicRoomsResponse.chunk)) {
          publicRoomsResponse.chunk.forEach((room: any, index: number) => {
            if (room.room_id) {
              results.push({
                index,
                item: {
                  roomId: room.room_id,
                  name: room.name || room.canonical_alias || room.room_id,
                  topic: room.topic || undefined,
                  alias: room.canonical_alias || undefined,
                  memberCount: room.num_joined_members || 0,
                  isEncrypted: false,
                  avatarUrl: room.avatar_url || undefined,
                  serverName: room.room_id.split(':')[1] || '',
                  joinRule: 'public',
                  canJoin: true,
                  score: 1.0
                }
              })
            }
          })
        }
      } catch (error) {
        console.warn('公开房间搜索失败:', error)
      }
    }
    
    return results
  } catch (error) {
    console.error('搜索公开房间失败:', error)
    return []
  }
}

/**
 * 搜索公开空间 - 使用Matrix SDK API获取精确结果
 */
export const 搜索公开空间 = async (searchTerm: string, options?: SearchOptions): Promise<SearchResult<SpaceSearchResult>[]> => {
  try {
    const results: SearchResult<SpaceSearchResult>[] = []
    
    // 获取已认证的客户端实例
    const client = matrixClientV2.getAuthedClient()
    
    if (client) {
      try {
        // 使用 Matrix SDK publicRooms API 搜索公开空间
        const publicRoomsResponse = await client.publicRooms({
          filter: {
            generic_search_term: searchTerm
          },
          limit: options?.limit || 50,
          server: options?.servers?.[0] || undefined
        })
        
        if (publicRoomsResponse?.chunk && Array.isArray(publicRoomsResponse.chunk)) {
          // 过滤出空间类型的房间
          const spaces = publicRoomsResponse.chunk.filter((room: any) => 
            room.room_type === 'm.space' || 
            (room.name && room.name.toLowerCase().includes('space'))
          )
          
          spaces.forEach((space: any, index: number) => {
            if (space.room_id) {
              results.push({
                index,
                item: {
                  spaceId: space.room_id,
                  name: space.name || space.canonical_alias || space.room_id,
                  topic: space.topic || undefined,
                  memberCount: space.num_joined_members || 0,
                  childRoomCount: 0,
                  avatarUrl: space.avatar_url || undefined,
                  serverName: space.room_id.split(':')[1] || '',
                  joinRule: 'public',
                  canJoin: true,
                  score: 1.0
                }
              })
            }
          })
        }
      } catch (error) {
        console.warn('公开空间搜索失败:', error)
      }
    }
    
    return results
  } catch (error) {
    console.error('搜索公开空间失败:', error)
    return []
  }
}

/**
 * 搜索指定空间内的用户 - 获取空间成员列表（包括直接和间接成员）
 */
export const 搜索指定空间内的用户 = async (spaceId: string, options?: SearchOptions): Promise<SearchResult<UserSearchResult>[]> => {
  try {
    const results: SearchResult<UserSearchResult>[] = []
    const userMap = new Map<string, any>() // 用于去重
    
    console.log('[搜索指定空间内的用户] 开始搜索空间:', spaceId, options)
    
    // 获取已认证的客户端实例
    const client = matrixClientV2.getAuthedClient()
    
    if (!client) {
      console.warn('[搜索指定空间内的用户] 客户端未认证')
      return results
    }
    
    try {
      // 获取空间房间对象
      const space = client.getRoom(spaceId)
      
      if (!space) {
        console.warn('[搜索指定空间内的用户] 空间不存在或无法访问:', spaceId)
        return results
      }
      
      // 1. 获取空间直接成员
      const spaceMembers = space.getMembers()
      console.log('[搜索指定空间内的用户] 空间直接成员数量:', spaceMembers?.length || 0)
      
      if (spaceMembers && spaceMembers.length > 0) {
        spaceMembers.forEach((member: any) => {
          if (member.userId) {
            userMap.set(member.userId, {
              ...member,
              membershipType: 'direct', // 直接空间成员
              spaceMembership: member.membership
            })
          }
        })
      }
      
      // 2. 获取空间下所有房间的成员（间接成员）
      const spaceChildren = space.getChildren?.() || []
      console.log('[搜索指定空间内的用户] 空间下房间数量:', spaceChildren.length)
      
      for (const child of spaceChildren) {
        if (child.roomId) {
          const childRoom = client.getRoom(child.roomId)
          if (childRoom) {
            const roomMembers = childRoom.getMembers()
            if (roomMembers) {
              roomMembers.forEach((member: any) => {
                if (member.userId && member.membership === 'join') {
                  // 如果用户不在空间直接成员中，则为间接成员
                  if (!userMap.has(member.userId)) {
                    userMap.set(member.userId, {
                      ...member,
                      membershipType: 'indirect', // 间接空间成员
                      spaceMembership: undefined,
                      roomMembership: member.membership
                    })
                  }
                }
              })
            }
          }
        }
      }
      
      console.log('[搜索指定空间内的用户] 总用户数（去重后）:', userMap.size)
      
      // 转换为数组并进行搜索过滤
      let allUsers = Array.from(userMap.values())
      
      // 如果提供了搜索选项，进行过滤
      if (options?.query) {
        const searchTerm = options.query.toLowerCase()
        allUsers = allUsers.filter((member: any) => {
          const userId = member.userId || ''
          const displayName = resolveUserDisplayName({
            matrixId: member.userId || null,
            matrixDisplayName: member.name || member.displayName || null,
          })
          return userId.toLowerCase().includes(searchTerm) || 
                 displayName.toLowerCase().includes(searchTerm)
        })
      }
      
      // 应用限制
      const limit = options?.limit || 50
      const limitedMembers = allUsers.slice(0, limit)
      
      // 转换为搜索结果格式
      limitedMembers.forEach((member: any, index: number) => {
        if (member.userId) {
          const userResult = {
            index,
            item: {
              userId: member.userId,
              displayName: resolveUserDisplayName({
                matrixId: member.userId,
                matrixDisplayName: member.name || member.displayName || null,
              }),
              avatarUrl: member.getAvatarUrl ? member.getAvatarUrl(client.baseUrl, 64, 64, 'scale', false) : member.avatarUrl || undefined,
              serverName: member.userId.split(':')[1] || '',
              isKnown: true,
              score: 1.0,
              membership: member.spaceMembership || member.roomMembership || 'join'
            },
            status: member.membershipType === 'direct' 
              ? (member.spaceMembership || 'join')
              : 'indirect' // 间接成员用特殊状态标识
          }
          results.push(userResult)
          console.log('[搜索指定空间内的用户] 添加用户结果:', userResult)
        }
      })
      
    } catch (error) {
      console.warn('[搜索指定空间内的用户] 获取空间成员失败:', error)
    }
    
    console.log('[搜索指定空间内的用户] 最终返回结果数量:', results.length)
    return results
  } catch (error) {
    console.error('[搜索指定空间内的用户] 搜索失败:', error)
    return []
  }
}

/**
 * 搜索指定房间内的用户 - 获取房间成员列表
 */
export const 搜索指定房间内的用户 = async (roomId: string, options?: SearchOptions): Promise<SearchResult<UserSearchResult>[]> => {
  try {
    const results: SearchResult<UserSearchResult>[] = []
    
    console.log('[搜索指定房间内的用户] 开始搜索房间:', roomId, options)
    
    // 获取已认证的客户端实例
    const client = matrixClientV2.getAuthedClient()
    
    if (!client) {
      console.warn('[搜索指定房间内的用户] 客户端未认证')
      return results
    }
    
    try {
      // 获取房间对象
      const room = client.getRoom(roomId)
      
      if (!room) {
        console.warn('[搜索指定房间内的用户] 房间不存在或无法访问:', roomId)
        return results
      }
      
      // 获取房间成员列表
      const members = room.getMembers()
      
      if (!members || members.length === 0) {
        console.log('[搜索指定房间内的用户] 房间内没有成员')
        return results
      }
      
      console.log('[搜索指定房间内的用户] 找到成员数量:', members.length)
      
      // 如果提供了搜索选项，进行过滤
      let filteredMembers = members
      if (options?.query) {
        const searchTerm = options.query.toLowerCase()
        filteredMembers = members.filter((member: any) => {
          const userId = member.userId || ''
          const displayName = resolveUserDisplayName({
            matrixId: member.userId || null,
            matrixDisplayName: member.name || member.displayName || null,
          })
          return userId.toLowerCase().includes(searchTerm) || 
                 displayName.toLowerCase().includes(searchTerm)
        })
      }
      
      // 应用限制
      const limit = options?.limit || 50
      const limitedMembers = filteredMembers.slice(0, limit)
      
      // 转换为搜索结果格式
      limitedMembers.forEach((member: any, index: number) => {
        if (member.userId) {
          const userResult = {
            index,
            item: {
              userId: member.userId,
              displayName: resolveUserDisplayName({
                matrixId: member.userId,
                matrixDisplayName: member.name || member.displayName || null,
              }),
              avatarUrl: member.getAvatarUrl ? member.getAvatarUrl(client.baseUrl, 64, 64, 'scale', false) : member.avatarUrl || undefined,
              serverName: member.userId.split(':')[1] || '',
              isKnown: true, // 房间成员都是已知用户
              score: 1.0,
              membership: member.membership // 添加成员状态
            },
            status: member.membership // 第三个字段：状态
          }
          results.push(userResult)
          console.log('[搜索指定房间内的用户] 添加用户结果:', userResult)
        }
      })
      
    } catch (error) {
      console.warn('[搜索指定房间内的用户] 获取房间成员失败:', error)
    }
    
    console.log('[搜索指定房间内的用户] 最终返回结果数量:', results.length)
    return results
  } catch (error) {
    console.error('[搜索指定房间内的用户] 搜索失败:', error)
    return []
  }
}

/**
 * 确定对象类型 - 基于Matrix对象属性进行精确判断
 */
export const 确定对象类型 = (obj: any): ObjectType => {
  // 检查是否为用户
  if (obj.user_id || obj.userId) {
    return ObjectTypeEnum.USER
  }
  
  // 检查是否为空间
  if (obj.room_type === 'm.space' || obj.spaceId) {
    return ObjectTypeEnum.SPACE
  }
  
  // 检查是否为房间
  if (obj.room_id || obj.roomId) {
    return ObjectTypeEnum.ROOM
  }
  
  // 默认返回未知
  return ObjectTypeEnum.UNKNOWN
}
