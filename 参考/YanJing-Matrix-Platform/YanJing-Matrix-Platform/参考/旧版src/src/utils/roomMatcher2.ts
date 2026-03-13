import { matrixClientV2 as matrixClient } from '@/services/matrix/client'
import { addPrefixSuffix, removePrefixSuffix } from './stringUtils'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'

/**
 * 房间匹配器 - 根据用户ID列表精确匹配房间
 * 支持多账户兼容性，仅进行完全精确匹配
 */
export class RoomMatcher {
  private static instance: RoomMatcher
  private cache = new Map<string, string>() // userIds -> roomId

  static getInstance(): RoomMatcher {
    if (!RoomMatcher.instance) {
      RoomMatcher.instance = new RoomMatcher()
    }
    return RoomMatcher.instance
  }


  

  

  /**
   * 根据用户ID列表查找匹配的房间
   * @param targetUserIds 目标用户ID列表
   * @returns 匹配的房间ID，如果未找到则返回 "未匹配到!"
   */
  async findMatchingRoom(targetUserIds: string[], isbot: boolean = false): Promise<string> {
    if (!targetUserIds || targetUserIds.length === 0) {
      return "未匹配到!"
    }




    // 规范化传入的 ID 为 canonical 形式（例如 @user:domain）
    const originalTargetCanonical = targetUserIds.map(id => this.toCanonical(id))








    // 生成缓存键（包含 isbot 标记）
    const cacheKey = this.generateCacheKey(originalTargetCanonical, isbot)

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      // 使用正确的 Matrix SDK API 获取所有房间
      const client = matrixClient.getAuthedClient()

      if (!client) {
        console.warn('Matrix客户端未初始化或未登录')
        return "未匹配到!"
      }

      const rooms = client.getRooms()

      for (const room of rooms) {
        // 过滤掉空间（Space），只处理普通房间

//console.log('[RoomMatcher] 房间ID:', room.roomId, '成员对象:', room.getMembers());
        if (this.isSpace(room)) {
          continue
        }

        // 过滤掉一对一私聊
        if (this.isDirectMessage(room)) {
          continue
        }

        const roomMembers = await this.getRoomMembers(room)

        // 将房间成员规范化
        const roomMembersCanonical = roomMembers.map(id => this.toCanonical(id))
//console.log('[RoomMatcher] 房间ID:', room.roomId, 'join/invite成员ID:', roomMembersCanonical);

        // 仅处理 2 人目标列表（本文件只用于两人匹配）
        if (originalTargetCanonical.length === 2) {
          if (isbot) {
            // 严格匹配：房间成员数必须为2，且集合完全一致
            if (roomMembersCanonical.length === 2 && this.isExactMatch(roomMembersCanonical, originalTargetCanonical)) {
              const roomId = room.roomId
              this.cache.set(cacheKey, roomId)
              return roomId
            }
          } else {
            // 非严格匹配：只要房间成员包含这两个人即可（允许多人房间）
            const memberSet = new Set(roomMembersCanonical)
            if (memberSet.has(originalTargetCanonical[0]) && memberSet.has(originalTargetCanonical[1])) {
              const roomId = room.roomId
              this.cache.set(cacheKey, roomId)
              return roomId
            }
          }

          continue
        }

        // 兜底：非两人目标，仍按严格匹配处理
        if (this.isExactMatch(roomMembersCanonical, originalTargetCanonical) && roomMembersCanonical.length === originalTargetCanonical.length) {
          const roomId = room.roomId
          this.cache.set(cacheKey, roomId)
          return roomId
        }
      }

      // 未找到匹配的房间
      this.cache.set(cacheKey, "未匹配到!")
      return "未匹配到!"

    } catch (error) {
      console.error('查找房间时出错:', error)
      return "未匹配到!"
    }
  }

  /**
   * 批量查找多个用户组合的房间
   * @param userIdGroups 多个用户ID组合
   * @returns 匹配结果映射
   */
  async findMultipleRooms(userIdGroups: string[][]): Promise<Map<string, string>> {
    const results = new Map<string, string>()

    // 并行处理所有查询
    const promises = userIdGroups.map(async (userIds) => {
      const cacheKey = this.generateCacheKey(userIds)
      const roomId = await this.findMatchingRoom(userIds)
      return { key: cacheKey, roomId }
    })

    const resolvedResults = await Promise.all(promises)

    resolvedResults.forEach(({ key, roomId }) => {
      results.set(key, roomId)
    })

    return results
  }

  /**
   * 获取房间成员列表
   * @param room 房间对象
   * @returns 成员用户ID列表（包括已加入和被邀请的成员）
   */
  private async getRoomMembers(room: any): Promise<string[]> {
    try {
      // 获取所有成员（包括已加入和被邀请的）
      const allMembers = room.getMembers()
      const memberIds: string[] = []

      for (const member of allMembers) {
        // 包括已加入（join）和被邀请（invite）的成员
        if (member.membership === 'join' || member.membership === 'invite') {
          memberIds.push(member.userId)
        }
      }

      return memberIds
    } catch (error) {
      console.error('获取房间成员失败:', error)
      return []
    }
  }

  /**
   * 检查是否完全匹配
   * @param roomMemberIds 房间成员ID列表
   * @param targetUserIds 目标用户ID列表
   * @returns 是否完全匹配
   */
  private isExactMatch(roomMemberIds: string[], targetUserIds: string[]): boolean {
    if (roomMemberIds.length !== targetUserIds.length) {
      return false
    }

    const roomSet = new Set(roomMemberIds)
    const targetSet = new Set(targetUserIds)

    // 检查集合是否相等
    if (roomSet.size !== targetSet.size) {
      return false
    }

    for (const userId of targetSet) {
      if (!roomSet.has(userId)) {
        return false
      }
    }

    return true
  }

  /**
   * 检查房间是否为空间（Space）
   * @param room 房间对象
   * @returns 是否为空间
   */
  private isSpace(room: any): boolean {
    try {
      // 检查房间类型是否为 m.space
      const roomType = room.getType()
      return roomType === 'm.space'
    } catch (error) {
      // 如果获取房间类型失败，假设不是空间
      return false
    }
  }

  /**
   * 检查房间是否为一对一私聊
   * @param room 房间对象
   * @returns 是否为一对一私聊
   */
  private isDirectMessage(room: any): boolean {
    try {
      // 方法1: 检查房间是否被标记为DM
      if (room.getDMInviter && room.getDMInviter()) {
        return true
      }

      // 方法2: 检查heroes数组 - 一对一私聊通常有heroes且长度为1
      if (room.heroes && Array.isArray(room.heroes) && room.heroes.length === 1) {
        return true
      }

      // 方法3: 检查成员数量是否为2
      const joinedMembers = room.getJoinedMembers()
      if (joinedMembers.length === 2) {
        // 检查房间是否有明确的房间名称设置（不是自动生成的）
        const hasExplicitName = room.currentState?.getStateEvents('m.room.name', '')?.getContent()?.name
        if (!hasExplicitName) {
          return true
        }
      }

      // 方法4: 检查房间创建事件中的is_direct标志
      const createEvent = room.getCreator()
      if (createEvent) {
        const content = createEvent.getContent()
        if (content && content.is_direct === true) {
          return true
        }
      }

      return false
    } catch (error) {
      // 如果检查失败，假设不是DM
      return false
    }
  }

  /**
   * 生成缓存键
   * @param userIds 用户ID列表
   * @returns 缓存键
   */
  private generateCacheKey(userIds: string[], isbot: boolean = false): string {
    return `${isbot ? 'bot' : 'nobot'}::${[...userIds].sort().join('|')}`
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 清除特定用户组合的缓存
   * @param userIds 用户ID列表
   */
  clearCacheFor(userIds: string[], isbot: boolean = false): void {
    const cacheKey = this.generateCacheKey(userIds, isbot)
    this.cache.delete(cacheKey)
  }



  private toCanonical(id: string): string {
    if (!id) return id
    const raw = removePrefixSuffix(id, '@', MATRIX_SERVER_URL_TAIL)
    return addPrefixSuffix(raw, '@', MATRIX_SERVER_URL_TAIL)
  }


}



// 导出单例实例
export const roomMatcher2 = RoomMatcher.getInstance()

// 导出便捷方法
export const findRoomByUserIds2 = (userIds: string[], isbot: boolean = false): Promise<string> => {
  return roomMatcher2.findMatchingRoom(userIds, isbot)
}
