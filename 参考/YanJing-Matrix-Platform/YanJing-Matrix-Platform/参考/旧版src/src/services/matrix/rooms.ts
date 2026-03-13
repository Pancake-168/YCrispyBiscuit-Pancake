// Matrix 房间相关服务 V2 - 按照Matrix标准重写
// 负责处理所有与房间相关的操作：获取房间列表、加入房间、离开房间等
import type { MatrixRoom, RoomSummary } from '../../types'
import { matrixClientV2 } from './client'
import { matrixEventManager } from './eventManager'
// import helpers removed because DM-specific heuristics were removed
import { resolveUserDisplayName } from '@/utils/displayName'

/**
 * 房间服务类 V2 - 标准实现
 * 按照Matrix标准实现房间管理功能
 */
class 房间服务类_V2 {

  /**
   * 获取用户已加入的所有房间列表 - 标准实现
   */
  获取房间列表(): MatrixRoom[] {
    const client = matrixClientV2.getAuthedClient()

    if (!client) {
      console.warn('[V2] Matrix客户端未初始化，无法获取房间列表')
      return []
    }

    try {
    //  console.log('[V2] 开始获取房间列表...')

      // 从Matrix SDK获取房间数据
      const rooms = client.getRooms()
     // console.log(`______________________________________________________________________________________________________________________________房间数据：`, rooms)
      const summaries = matrixEventManager.getRoomSummaries()
      const summaryMap = new Map<string, RoomSummary>(summaries.map(summary => [summary.roomId, summary]))

      const spaces = rooms.filter((r: any) => this.isSpaceRoomCanonical(r));
      let idx = 1;
      rooms.forEach((room: any) => {
        let type = '';
        const roomId = room.roomId;

        if (this.isSpaceRoomCanonical(room)) {
          type = '空间';
        } else {
          // 不再区分一对一私聊，直接归为普通房间
          type = '普通房间'
        }

        // 查找空间归属
        if (type === '普通房间' || type === '一对一私聊') {
          for (const space of spaces) {
            const childEvents = space.currentState?.getStateEvents?.('m.space.child') || [];
            if (childEvents.some((ev: any) => ev.getStateKey() === roomId)) {
              type = '空间下的房间';
              break;
            }
          }
        }

        if (type === '空间下的房间') {
          //    console.log(`${idx}. 房间名: ${name}, 类型: ${type}, 所属空间: ${belongSpace}, 成员数: ${memberCount}, 房间ID: ${roomId}`);
        } else {
          //    console.log(`${idx}. 房间名: ${name}, 类型: ${type}, 成员数: ${memberCount}, 房间ID: ${roomId}`);
        }
        idx++;
      });



      // console.log("获取到的所有rooms:", rooms)
      // 过滤并转换为标准格式
      const standardRooms = rooms
        .filter((room: any) => {
          // 包含已加入和被邀请的房间，排除已离开的房间
          const membership = room.getMyMembership()
          return membership === 'join' || membership === 'invite'
        })
        .map((room: any) => {
          const summary = summaryMap.get(room.roomId)
          return this.转换为标准房间格式(room, summary)
        })

      // 按最后活动时间排序
      standardRooms.sort((a: MatrixRoom, b: MatrixRoom) => b.lastActivity - a.lastActivity)

//      console.log(`[V2]  成功获取 ${standardRooms.length} 个房间`)
      return standardRooms

    } catch (error) {
      console.error('[V2] 获取房间列表失败:', error)
      return []
    }
  }

  /**
   * 获取所有房间（包括邀请等状态）
   */
  获取所有状态房间(): MatrixRoom[] {
    const client = matrixClientV2.getAuthedClient()

    if (!client) {
      console.warn('[V2] Matrix客户端未初始化')
      return []
    }

    try {
      const rooms = client.getRooms()

      const allRooms = rooms.map((room: any) => {
        return this.转换为标准房间格式(room)
      })

      // 排序：邀请 > 已加入 > 其他，然后按活动时间
      allRooms.sort((a: MatrixRoom, b: MatrixRoom) => {
        // 优先级排序
        const getPriority = (membership: string) => {
          switch (membership) {
            case 'invite': return 3
            case 'join': return 2
            default: return 1
          }
        }

        const priorityDiff = getPriority(b.membership || 'leave') - getPriority(a.membership || 'leave')
        if (priorityDiff !== 0) return priorityDiff

        // 相同优先级按活动时间排序
        return b.lastActivity - a.lastActivity
      })

      console.log(`[V2]  获取所有状态房间 ${allRooms.length} 个`)
      return allRooms

    } catch (error) {
      console.error('[V2] 获取所有状态房间失败:', error)
      return []
    }
  }

  /**
   * 加入指定的房间 - 标准实现
   */
  async 加入房间(房间ID或别名: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 尝试加入房间: ${房间ID或别名}`)

      // 使用标准API加入房间
      const result = await client.joinRoom(房间ID或别名)

      console.log(`[V2]  成功加入房间: ${result.roomId || 房间ID或别名}`)

    } catch (error: any) {
      console.error('[V2] 加入房间失败:', error)
      throw this.处理房间操作错误(error, '加入')
    }
  }

  /**
   * 离开指定房间 - 标准实现
   */
  async 离开房间(房间ID: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 尝试离开房间: ${房间ID}`)

      await client.leave(房间ID)

      console.log(`[V2]  成功离开房间: ${房间ID}`)

    } catch (error: any) {
      console.error('[V2] 离开房间失败:', error)
      throw this.处理房间操作错误(error, '离开')
    }
  }

  /**
   * 创建新房间 - 标准实现
   */
  async 创建房间(房间选项: {
    name?: string;
    topic?: string;
    visibility?: 'public' | 'private';
    preset?: 'private_chat' | 'public_chat' | 'trusted_private_chat';
    invite?: string[];
    is_direct?: boolean;
    power_level_content_override?: any;
    initial_state?: any[];
    room_alias_name?: string;
  }): Promise<string> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log('[V2] 开始创建房间...', 房间选项)

      // 使用标准API创建房间
      const result = await client.createRoom(房间选项)

      console.log(`[V2]  成功创建房间: ${result.room_id}`)
      return result.room_id

    } catch (error: any) {
      console.error('[V2] 创建房间失败:', error)
      throw this.处理房间操作错误(error, '创建')
    }
  }

  /**
   * 邀请用户到房间
   */
  async 邀请用户(房间ID: string, 用户ID: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 邀请用户 ${用户ID} 到房间 ${房间ID}`)

      await client.invite(房间ID, 用户ID)

      console.log(`[V2]  成功邀请用户 ${用户ID}`)

    } catch (error: any) {
      console.error('[V2] 邀请用户失败:', error)
      throw this.处理房间操作错误(error, '邀请用户')
    }
  }

  /**
   * 踢出用户
   */
  async 踢出用户(房间ID: string, 用户ID: string, 原因?: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 踢出用户 ${用户ID} 从房间 ${房间ID}`)

      await client.kick(房间ID, 用户ID, 原因)

      console.log(`[V2]  成功踢出用户 ${用户ID}`)

    } catch (error: any) {
      console.error('[V2] 踢出用户失败:', error)
      throw this.处理房间操作错误(error, '踢出用户')
    }
  }

  /**
   * 封禁用户
   */
  async 封禁用户(房间ID: string, 用户ID: string, 原因?: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 封禁用户 ${用户ID} 从房间 ${房间ID}`)

      await client.ban(房间ID, 用户ID, 原因)

      console.log(`[V2]  成功封禁用户 ${用户ID}`)

    } catch (error: any) {
      console.error('[V2] 封禁用户失败:', error)
      throw this.处理房间操作错误(error, '封禁用户')
    }
  }

  /**
   * 解除封禁
   */
  async 解除封禁(房间ID: string, 用户ID: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 解除用户 ${用户ID} 在房间 ${房间ID} 的封禁`)

      await client.unban(房间ID, 用户ID)

      console.log(`[V2]  成功解除用户 ${用户ID} 的封禁`)

    } catch (error: any) {
      console.error('[V2] 解除封禁失败:', error)
      throw this.处理房间操作错误(error, '解除封禁')
    }
  }

  /**
   * 获取指定房间的详细信息
   */
  获取房间详情(房间ID: string) {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      console.warn('[V2] Matrix客户端未初始化，无法获取房间详情')
      return null
    }

    const room = client.getRoom(房间ID)
    if (!room) {
      console.warn(`[V2] 找不到房间: ${房间ID}`)
      return null
    }


    return room
  }

  /**
   * 获取房间成员列表
   */
  获取房间成员(房间ID: string): any[] {
    const room = this.获取房间详情(房间ID)
    if (!room) {
      return []
    }

    try {
      const members = room.getMembers()
      /*
      console.log(`[V2] 房间 ${房间ID} 有 ${members.length} 个成员`)
      */

      return members
    } catch (error) {
      console.error('[V2] 获取房间成员失败:', error)
      return []
    }
  }

  /**
   * 检查用户权限
   */
  检查用户权限(房间ID: string, 用户ID?: string): {
    canSendMessages: boolean;
    canInvite: boolean;
    canKick: boolean;
    canBan: boolean;
    canChangeSettings: boolean;
    powerLevel: number;
  } {
    const room = this.获取房间详情(房间ID)
    const client = matrixClientV2.getAuthedClient()

    if (!room || !client) {
      return {
        canSendMessages: false,
        canInvite: false,
        canKick: false,
        canBan: false,
        canChangeSettings: false,
        powerLevel: 0
      }
    }

    const targetUserId = 用户ID || client.getUserId()
    if (!targetUserId) {
      return {
        canSendMessages: false,
        canInvite: false,
        canKick: false,
        canBan: false,
        canChangeSettings: false,
        powerLevel: 0
      }
    }

    try {
      const member = room.getMember(targetUserId)
      const powerLevel = member?.powerLevel || 0
      const powerLevels = room.currentState.getStateEvents('m.room.power_levels', '')?.getContent() || {}

      return {
        canSendMessages: powerLevel >= (powerLevels.events_default || 0),
        canInvite: powerLevel >= (powerLevels.invite || 0),
        canKick: powerLevel >= (powerLevels.kick || 50),
        canBan: powerLevel >= (powerLevels.ban || 50),
        canChangeSettings: powerLevel >= (powerLevels.state_default || 50),
        powerLevel
      }
    } catch (error) {
      console.error('[V2] 检查用户权限失败:', error)
      return {
        canSendMessages: false,
        canInvite: false,
        canKick: false,
        canBan: false,
        canChangeSettings: false,
        powerLevel: 0
      }
    }
  }

  /**
   * 设置房间名称
   */
  async 设置房间名称(房间ID: string, 名称: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 设置房间 ${房间ID} 名称为: ${名称}`)

      await client.setRoomName(房间ID, 名称)

      console.log(`[V2]  成功设置房间名称`)

    } catch (error: any) {
      console.error('[V2] 设置房间名称失败:', error)
      throw this.处理房间操作错误(error, '设置房间名称')
    }
  }

  /**
   * 设置房间主题
   */
  async 设置房间主题(房间ID: string, 主题: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 设置房间 ${房间ID} 主题为: ${主题}`)

      await client.setRoomTopic(房间ID, 主题)

      console.log(`[V2]  成功设置房间主题`)

    } catch (error: any) {
      console.error('[V2] 设置房间主题失败:', error)
      throw this.处理房间操作错误(error, '设置房间主题')
    }
  }

  /**
   * 获取客户端实例（只读）
   */
  获取客户端实例() {
    return matrixClientV2.getAuthedClient()
  }

  /**
   * 转换为标准房间格式
   */
  private 转换为标准房间格式(room: any, summary?: RoomSummary): MatrixRoom {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('客户端未初始化')
    }

    // 检查房间加密状态
    const isEncrypted = this.检查房间加密状态(room)

    // 获取房间主题
    const topic = this.获取房间主题(room)

    // 获取未读计数
    const unreadCount = summary?.unreadCount ?? this.获取未读计数(room)

    // 获取成员数量
    // 注意：memberCount 不再作为外部参数传递，直接在判断函数内部使用 room.getJoinedMembers()

    // 确定房间类型
    let type: '空间' | '普通房间' | '空间下的房间' = '普通房间'
    let belongSpace = ''
    let belongSpaceName = ''

    if (this.isSpaceRoomCanonical(room)) {
      type = '空间'
    } else {
      // 不再区分一对一私聊，全部归为普通房间
      type = '普通房间'
    }

    // 查找空间归属（只对普通房间进行检查）
    if (type === '普通房间') {
      const allRooms = client.getRooms()
      const spaces = allRooms.filter((r: any) => r.isSpaceRoom?.())

      for (const space of spaces) {
        const childEvents = space.currentState?.getStateEvents?.('m.space.child') || []
        if (childEvents.some((ev: any) => ev.getStateKey() === room.roomId)) {
          belongSpace = space.roomId
          belongSpaceName = space.name || space.roomId
          break
        }
      }
    }

    return {
      roomId: room.roomId,
      name: summary?.name || room.name || this.生成默认房间名称(room),
      lastActivity: summary?.lastActivity || room.getLastActiveTimestamp() || 0,
      encrypted: isEncrypted,
      topic: topic,
      membership: room.getMyMembership() || 'leave',
      unreadCount: unreadCount,
      lastMessage: summary?.lastMessage,
      lastEvent: summary?.lastEvent,
      type: type,
      belongSpace: belongSpace,
      belongSpaceName: belongSpaceName,
      // 现在不单独区分私聊，allowedSpaces 保持 undefined
      allowedSpaces: undefined
    }
  }


  /**
   * 检查房间加密状态
   */
  private 检查房间加密状态(room: any): boolean {
    try {
      const encryptionEvent = room.currentState?.getStateEvents('m.room.encryption', '')
      if (encryptionEvent && encryptionEvent.getContent()) {
        const algorithm = encryptionEvent.getContent().algorithm
        if (algorithm && algorithm.includes('megolm')) {
          return true
        }
      }
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * 获取房间主题
   */
  private 获取房间主题(room: any): string {
    try {
      const topicEvent = room.currentState?.getStateEvents('m.room.topic', '')
      return topicEvent?.getContent()?.topic || ''
    } catch (error) {
      return ''
    }
  }

  /**
   * 获取用户在房间中的成员状态 - 标准实现
   * @param 房间ID - 房间标识符
   * @returns 成员状态 ('join' | 'invite' | 'leave' | 'ban' | null)
   */
  获取用户房间状态(房间ID: string): string | null {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      console.warn('[V2] Matrix客户端未初始化，无法获取房间状态')
      return null
    }

    try {
      const room = client.getRoom(房间ID)
      if (!room) {
        console.warn(`[V2] 找不到房间: ${房间ID}`)
        return null
      }

      const membership = room.getMyMembership()
      console.log(`[V2] 用户在房间 ${房间ID} 的状态: ${membership}`)
      return membership
    } catch (error) {
      console.error(`[V2] 获取房间状态失败:`, error)
      return null
    }
  }

  /**
   * 检查用户是否可以在房间中发送消息 - 标准实现
   * @param 房间ID - 房间标识符
   * @returns 是否可以发送消息
   */
  检查发送消息权限(房间ID: string): boolean {
    const status = this.获取用户房间状态(房间ID)
    return status === 'join'
  }

  /**
   * 获取未读计数
   */
  private 获取未读计数(room: any): number {
    try {
      // 这里可以实现未读计数逻辑
      // Matrix SDK 提供了 getUnreadNotificationCount 方法
      if (room.getUnreadNotificationCount) {
        return room.getUnreadNotificationCount() || 0
      }
      return 0
    } catch (error) {
      return 0
    }
  }

  /**
   * 生成默认房间名称
   */
  private 生成默认房间名称(room: any): string {
    try {
      // 尝试从成员生成名称
      const members = room.getJoinedMembers()
      if (members && members.length > 0) {
        const memberNames = members
          .slice(0, 3)
          .map((member: any) =>
            resolveUserDisplayName({ matrixId: member.userId, matrixDisplayName: member.name || null })
          )
          .join(', ')

        if (members.length > 3) {
          return `${memberNames} 等 ${members.length} 人`
        } else {
          return memberNames
        }
      }

      // 回退到房间ID
      return room.roomId
    } catch (error) {
      return room.roomId || '未知房间'
    }
  }

  // 已移除私聊专用逻辑，私聊归入普通房间

  // 已移除成员 bot 启发式判断（与私聊分类已统一为普通房间）

  /**
   * 规范化判断房间是否为 Space（优先使用 SDK 的 isSpaceRoom 或 m.space.child 状态）
   */
  isSpaceRoomCanonical(room: any): boolean {
    try {
      if (!room) return false
      // SDK 提供的快捷判断（若可用则优先）
      if (typeof room.isSpaceRoom === 'function' && room.isSpaceRoom()) return true

      // 常见：currentState.getStateEvents 返回数组
      const childEvents = room.currentState?.getStateEvents?.('m.space.child') || []
      if (Array.isArray(childEvents) && childEvents.length > 0) return true

      // 有些 SDK 版本将事件以 Map 存在于 currentState.events
      const eventsMap = room.currentState?.events?.get?.('m.space.child')
      if (eventsMap && eventsMap.size > 0) return true

      return false
    } catch (e) {
      return false
    }
  }

  /**
   * 处理房间操作错误
   */
  private 处理房间操作错误(error: any, 操作: string): Error {
    const errorMessage = error.message || error.toString()

    if (errorMessage.includes('M_FORBIDDEN')) {
      return new Error(`无权限${操作}房间，可能是私有房间或需要更高权限`)
    } else if (errorMessage.includes('M_NOT_FOUND')) {
      return new Error(`找不到目标房间或用户`)
    } else if (errorMessage.includes('M_ROOM_IN_USE')) {
      return new Error(`房间已存在或操作冲突`)
    } else if (errorMessage.includes('M_LIMIT_EXCEEDED')) {
      return new Error(`操作过于频繁，请稍后再试`)
    } else {
      return new Error(`${操作}房间失败: ${errorMessage}`)
    }
  }
}

// 导出房间服务V2实例
export const roomServiceV2 = new 房间服务类_V2()
export const 房间服务V2 = roomServiceV2
