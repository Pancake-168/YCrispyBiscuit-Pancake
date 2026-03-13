// 邀请管理服务 V2 - 按照Matrix标准重写
// 负责处理房间邀请的发送、接收、接受和拒绝
import type { 
  RoomInviteInfo, 
  RoomManagementError,
  RoomMemberInfo 
} from '../../types/room-management.types'
import { matrixClientV2 } from '../matrix/client'
import { resolveUserDisplayName } from '@/utils/displayName'

/**
 * 邀请管理服务类 V2 - 标准实现
 * 按照Matrix标准实现邀请管理功能
 */
class 邀请管理服务类_V2 {
  
  /**
   * 邀请用户加入房间 - 标准实现
   * @param roomId 房间ID
   * @param userId 要邀请的用户ID
   * @param reason 邀请原因（可选）
   */
  async 邀请用户(roomId: string, userId: string, reason?: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw this.创建错误对象('PERMISSION_DENIED', '[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 邀请用户 ${userId} 加入房间 ${roomId}`)

      // 检查房间是否存在
      const room = client.getRoom(roomId)
      if (!room) {
        throw this.创建错误对象('ROOM_NOT_FOUND', `找不到房间: ${roomId}`)
      }

      // 检查用户是否已经在房间中
      const member = room.getMember(userId)
      if (member) {
        const membership = member.membership
        if (membership === 'join') {
          throw this.创建错误对象('ALREADY_JOINED', `用户 ${userId} 已经在房间中`)
        }
        if (membership === 'invite') {
          throw this.创建错误对象('ALREADY_INVITED', `用户 ${userId} 已被邀请`)
        }
        if (membership === 'ban') {
          throw this.创建错误对象('PERMISSION_DENIED', `用户 ${userId} 已被封禁，无法邀请`)
        }
      }

      // 检查当前用户是否有邀请权限
      if (!this.检查邀请权限(room, client.getUserId()!)) {
        throw this.创建错误对象('PERMISSION_DENIED', '您没有邀请用户的权限')
      }

      // 发送邀请
      await client.invite(roomId, userId, reason)

      console.log(`[V2]  成功邀请用户 ${userId} 加入房间 ${roomId}`)

    } catch (error: any) {
      console.error('[V2] 邀请用户失败:', error)
      throw this.处理邀请错误(error)
    }
  }

 


  

  /**
   * 接受房间邀请 - 标准实现
   * @param roomId 房间ID
   */
  async 接受邀请(roomId: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw this.创建错误对象('PERMISSION_DENIED', '[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 接受房间邀请: ${roomId}`)

      // 检查是否有待处理的邀请
      const room = client.getRoom(roomId)
      if (!room || room.getMyMembership() !== 'invite') {
        throw this.创建错误对象('INVITE_NOT_FOUND', '没有找到待处理的邀请')
      }

      // 加入房间
      await client.joinRoom(roomId)

      console.log(`[V2]  成功接受邀请并加入房间: ${roomId}`)

    } catch (error: any) {
      console.error('[V2] 接受邀请失败:', error)
      throw this.处理邀请错误(error)
    }
  }

  /**
   * 拒绝房间邀请 - 标准实现
   * @param roomId 房间ID
   */
  async 拒绝邀请(roomId: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw this.创建错误对象('PERMISSION_DENIED', '[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 拒绝房间邀请: ${roomId}`)

      // 检查是否有待处理的邀请
      const room = client.getRoom(roomId)
      if (!room || room.getMyMembership() !== 'invite') {
        throw this.创建错误对象('INVITE_NOT_FOUND', '没有找到待处理的邀请')
      }

      // 离开房间（拒绝邀请）
      await client.leave(roomId)

      console.log(`[V2]  成功拒绝房间邀请: ${roomId}`)

    } catch (error: any) {
      console.error('[V2] 拒绝邀请失败:', error)
      throw this.处理邀请错误(error)
    }
  }

  /**
   * 取消已发送的邀请 - 标准实现
   * @param roomId 房间ID
   * @param userId 被邀请的用户ID
   */
  async 取消邀请(roomId: string, userId: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw this.创建错误对象('PERMISSION_DENIED', '[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 取消邀请: 房间 ${roomId}, 用户 ${userId}`)

      const room = client.getRoom(roomId)
      if (!room) {
        throw this.创建错误对象('ROOM_NOT_FOUND', `找不到房间: ${roomId}`)
      }

      const member = room.getMember(userId)
      if (!member || member.membership !== 'invite') {
        throw this.创建错误对象('INVITE_NOT_FOUND', `用户 ${userId} 没有待处理的邀请`)
      }

      // 检查权限
      if (!this.检查邀请权限(room, client.getUserId()!)) {
        throw this.创建错误对象('PERMISSION_DENIED', '您没有取消邀请的权限')
      }

      // 踢出用户（取消邀请）
      await client.kick(roomId, userId, '取消邀请')

      console.log(`[V2]  成功取消邀请: 房间 ${roomId}, 用户 ${userId}`)

    } catch (error: any) {
      console.error('[V2] 取消邀请失败:', error)
      throw this.处理邀请错误(error)
    }
  }

  /**
   * 获取当前用户的所有待处理邀请 - 标准实现
   * @returns 邀请列表
   */
  获取待处理邀请(): RoomInviteInfo[] {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      console.warn('[V2] Matrix客户端未初始化，无法获取邀请列表')
      return []
    }

    try {
      const rooms = client.getRooms()
      const invites: RoomInviteInfo[] = []

      for (const room of rooms) {
        if (room.getMyMembership() === 'invite') {
          const inviter = this.获取房间邀请者(room)
          
          invites.push({
            inviteId: `${room.roomId}_${Date.now()}`, // 生成临时ID
            roomId: room.roomId,
            roomName: room.name || room.roomId,
            inviter: inviter?.userId || '',
              inviterDisplayName: resolveUserDisplayName({ matrixId: inviter?.userId || null, matrixDisplayName: inviter?.displayName || null }),
            invitee: client.getUserId()!,
            invitedAt: this.获取邀请时间戳(room),
            status: 'pending',
            isEncrypted: this.检查房间加密(room),
            roomTopic: this.获取房间主题(room)
          })
        }
      }

      console.log(`[V2] 找到 ${invites.length} 个待处理的邀请`)
      return invites.sort((a, b) => b.invitedAt - a.invitedAt)
    } catch (error) {
      console.error('[V2] 获取待处理邀请失败:', error)
      return []
    }
  }

  /**
   * 获取房间的所有待处理邀请 - 标准实现
   * @param roomId 房间ID
   * @returns 邀请列表
   */
  获取房间待处理邀请(roomId: string): RoomInviteInfo[] {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      console.warn('[V2] Matrix客户端未初始化，无法获取房间邀请')
      return []
    }

    const room = client.getRoom(roomId)
    if (!room) {
      console.warn(`[V2] 找不到房间: ${roomId}`)
      return []
    }

    try {
      const members = room.getMembers()
      const invites: RoomInviteInfo[] = []

      for (const member of members) {
        if (member.membership === 'invite') {
          const inviter = this.获取成员邀请者(room, member.userId)
          
          invites.push({
            inviteId: `${roomId}_${member.userId}_${Date.now()}`,
            roomId: room.roomId,
            roomName: room.name || room.roomId,
            inviter: inviter?.userId || '',
              inviterDisplayName: resolveUserDisplayName({ matrixId: inviter?.userId || null, matrixDisplayName: inviter?.displayName || null }),
            invitee: member.userId,
            invitedAt: this.获取成员邀请时间戳(room, member.userId),
            status: 'pending',
            isEncrypted: this.检查房间加密(room),
            roomTopic: this.获取房间主题(room)
          })
        }
      }

      return invites.sort((a, b) => b.invitedAt - a.invitedAt)
    } catch (error) {
      console.error('[V2] 获取房间待处理邀请失败:', error)
      return []
    }
  }

  /**
   * 检查用户是否可以被邀请到房间 - 标准实现
   * @param roomId 房间ID
   * @param userId 用户ID
   * @returns 是否可以邀请
   */
  检查用户可邀请(roomId: string, userId: string): boolean {
    const client = matrixClientV2.getAuthedClient()
    if (!client) return false

    const room = client.getRoom(roomId)
    if (!room) return false

    try {
      // 检查当前用户权限
      if (!this.检查邀请权限(room, client.getUserId()!)) {
        return false
      }

      // 检查目标用户状态
      const member = room.getMember(userId)
      if (member) {
        const membership = member.membership
        return membership !== 'join' && membership !== 'invite' && membership !== 'ban'
      }

      return true
    } catch (error) {
      console.error('[V2] 检查用户可邀请状态失败:', error)
      return false
    }
  }

  /**
   * 获取当前用户发出的所有邀请 - 标准实现
   * @returns 发出的邀请列表
   */
  获取发出的邀请(): RoomInviteInfo[] {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      console.warn('[V2] Matrix客户端未初始化，无法获取发出的邀请')
      return []
    }

    try {
      const myUserId = client.getUserId()!
      const rooms = client.getRooms()
      const sentInvites: RoomInviteInfo[] = []

      for (const room of rooms) {
        // 只检查我已加入的房间
        if (room.getMyMembership() === 'join') {
          const members = room.getMembers()
          
          for (const member of members) {
            // 找到待处理的邀请
            if (member.membership === 'invite') {
              const inviter = this.获取成员邀请者(room, member.userId)
              
              // 检查是否是我发出的邀请
              if (inviter && inviter.userId === myUserId) {
                sentInvites.push({
                  inviteId: `sent_${room.roomId}_${member.userId}`,
                  roomId: room.roomId,
                  roomName: room.name || room.roomId,
                  inviter: myUserId,
                  inviterDisplayName: resolveUserDisplayName({ matrixId: myUserId, matrixDisplayName: client.getUser(myUserId)?.displayName || null }),
                  invitee: member.userId,
                  inviteeDisplayName: resolveUserDisplayName({ matrixId: member.userId, matrixDisplayName: member.name || null }),
                  invitedAt: this.获取成员邀请时间戳(room, member.userId),
                  status: 'pending',
                  isEncrypted: this.检查房间加密(room),
                  roomTopic: this.获取房间主题(room)
                })
              }
            }
          }
        }
      }

      console.log(`[V2] 找到 ${sentInvites.length} 个我发出的邀请`)
      return sentInvites.sort((a, b) => b.invitedAt - a.invitedAt)
    } catch (error) {
      console.error('[V2] 获取发出的邀请失败:', error)
      return []
    }
  }

  /**
   * 获取房间邀请统计 - 标准实现
   * @param roomId 房间ID
   * @returns 邀请统计信息
   */
  获取邀请统计(roomId: string): {
    pendingCount: number
    totalInvited: number
    acceptedCount: number
  } {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      return { pendingCount: 0, totalInvited: 0, acceptedCount: 0 }
    }

    const room = client.getRoom(roomId)
    if (!room) {
      return { pendingCount: 0, totalInvited: 0, acceptedCount: 0 }
    }

    try {
      const members = room.getMembers()
      let pendingCount = 0
      let joinedCount = 0

      for (const member of members) {
        if (member.membership === 'invite') {
          pendingCount++
        } else if (member.membership === 'join') {
          joinedCount++
        }
      }

      return {
        pendingCount,
        totalInvited: pendingCount + joinedCount,
        acceptedCount: joinedCount
      }
    } catch (error) {
      console.error('[V2] 获取邀请统计失败:', error)
      return { pendingCount: 0, totalInvited: 0, acceptedCount: 0 }
    }
  }

  // 私有方法

  /**
   * 检查邀请权限
   */
  private 检查邀请权限(room: any, userId: string): boolean {
    try {
      // 使用Matrix SDK的canInvite方法
      if (room.canInvite && typeof room.canInvite === 'function') {
        return room.canInvite(userId)
      }

      // 手动检查权限
      const powerLevelsEvent = room.currentState?.getStateEvents('m.room.power_levels', '')
      if (!powerLevelsEvent) return false

      const powerLevels = powerLevelsEvent.getContent()
      const userPowerLevel = powerLevels.users?.[userId] || powerLevels.users_default || 0
      const requiredPowerLevel = powerLevels.invite || 0

      return userPowerLevel >= requiredPowerLevel
    } catch (error) {
      console.warn('[V2] 检查邀请权限失败:', error)
      return false
    }
  }

  /**
   * 检查房间加密状态
   */
  private 检查房间加密(room: any): boolean {
    try {
      if (room.hasEncryptionStateEvent && typeof room.hasEncryptionStateEvent === 'function') {
        return room.hasEncryptionStateEvent()
      }

      const encryptionEvent = room.currentState?.getStateEvents('m.room.encryption', '')
      return encryptionEvent && encryptionEvent.getContent()
    } catch (error) {
      return false
    }
  }

  /**
   * 获取房间主题
   */
  private 获取房间主题(room: any): string | undefined {
    try {
      const topicEvent = room.currentState?.getStateEvents('m.room.topic', '')
      return topicEvent?.getContent()?.topic
    } catch (error) {
      return undefined
    }
  }

  /**
   * 获取房间邀请者
   */
  private 获取房间邀请者(room: any): RoomMemberInfo | null {
    try {
      const client = matrixClientV2.getAuthedClient()
      if (!client) return null

      const myUserId = client.getUserId()
      const memberEvent = room.currentState?.getStateEvents('m.room.member', myUserId)
      
      if (memberEvent && memberEvent.getSender()) {
        const inviterUserId = memberEvent.getSender()
        const inviterMember = room.getMember(inviterUserId)
        
        return {
          userId: inviterUserId,
          displayName: resolveUserDisplayName({ matrixId: inviterUserId, matrixDisplayName: inviterMember?.name || null }),
          membership: 'join',
          powerLevel: 0,
          isCurrentUser: false
        }
      }
      
      return null
    } catch (error) {
      console.warn('[V2] 获取邀请者信息失败:', error)
      return null
    }
  }

  /**
   * 获取成员邀请者
   */
  private 获取成员邀请者(room: any, userId: string): RoomMemberInfo | null {
    try {
      const memberEvent = room.currentState?.getStateEvents('m.room.member', userId)
      
      if (memberEvent && memberEvent.getSender()) {
        const inviterUserId = memberEvent.getSender()
        const inviterMember = room.getMember(inviterUserId)
        
        return {
          userId: inviterUserId,
          displayName: resolveUserDisplayName({ matrixId: inviterUserId, matrixDisplayName: inviterMember?.name || null }),
          membership: 'join',
          powerLevel: 0,
          isCurrentUser: false
        }
      }
      
      return null
    } catch (error) {
      console.warn('[V2] 获取成员邀请者信息失败:', error)
      return null
    }
  }

  /**
   * 获取邀请时间戳
   */
  private 获取邀请时间戳(room: any): number {
    try {
      const client = matrixClientV2.getAuthedClient()
      if (!client) return Date.now()

      const myUserId = client.getUserId()
      const memberEvent = room.currentState?.getStateEvents('m.room.member', myUserId)
      
      return memberEvent?.getTs() || Date.now()
    } catch (error) {
      return Date.now()
    }
  }

  /**
   * 获取成员邀请时间戳
   */
  private 获取成员邀请时间戳(room: any, userId: string): number {
    try {
      const memberEvent = room.currentState?.getStateEvents('m.room.member', userId)
      return memberEvent?.getTs() || Date.now()
    } catch (error) {
      return Date.now()
    }
  }

  /**
   * 处理邀请错误
   */
  private 处理邀请错误(error: any): RoomManagementError {
    if (error.errcode) {
      switch (error.errcode) {
        case 'M_FORBIDDEN':
          return this.创建错误对象('PERMISSION_DENIED', '没有权限执行此操作')
        case 'M_NOT_FOUND':
          return this.创建错误对象('USER_NOT_FOUND', '找不到指定的用户或房间')
        case 'M_USER_DEACTIVATED':
          return this.创建错误对象('USER_NOT_FOUND', '用户账户已被停用')
        case 'M_LIMIT_EXCEEDED':
          return this.创建错误对象('PERMISSION_DENIED', '操作过于频繁，请稍后再试')
        default:
          return this.创建错误对象('UNKNOWN_ERROR', `操作失败: ${error.message}`)
      }
    }
    
    if (error.code) {
      return error // 已经是我们的错误格式
    }
    
    return this.创建错误对象('UNKNOWN_ERROR', error.message || '执行邀请操作时发生未知错误')
  }

  /**
   * 创建错误对象
   */
  private 创建错误对象(code: string, message: string, details?: any): RoomManagementError {
    return {
      code,
      message,
      details
    }
  }
}

// 导出邀请管理服务V2实例
export const inviteManagementServiceV2 = new 邀请管理服务类_V2()
export const 邀请管理服务V2 = inviteManagementServiceV2
