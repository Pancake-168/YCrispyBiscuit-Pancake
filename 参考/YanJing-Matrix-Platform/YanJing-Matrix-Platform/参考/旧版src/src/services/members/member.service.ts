// 成员管理服务 V2 - 按照Matrix标准重写
// 负责处理房间成员的管理、权限控制和操作
import type {
    RoomMemberInfo,
    RoomManagementError,
    RoomManagementAction,
    RoomPermissions
} from '../../types/room-management.types'
import { matrixClientV2 } from '../matrix/client'
import { resolveUserDisplayName } from '@/utils/displayName'

/**
 * 成员管理服务类 V2 - 标准实现
 * 按照Matrix标准实现成员管理功能
 */
class 成员管理服务类_V2 {

    /**
     * 获取房间成员列表 - 标准实现
     * @param roomId 房间ID
     * @param includeLeft 是否包含已离开的成员
     * @returns 成员列表
     */
    获取房间成员列表(roomId: string, includeLeft: boolean = false): RoomMemberInfo[] {
        const client = matrixClientV2.getAuthedClient()
        if (!client) {
            console.warn('[V2] Matrix客户端未初始化，无法获取成员列表')
            return []
        }

        const room = client.getRoom(roomId)
        if (!room) {
            console.warn(`[V2] 找不到房间: ${roomId}`)
            return []
        }

        const currentUserId = client.getUserId()

        try {
          //  console.log(`[V2] 开始获取房间 ${roomId} 成员列表`)
            
            // 强制更新房间成员状态，确保数据最新
            this.统计房间成员状态(room)

            // 获取所有成员（标准方式）
            const allMembers = room.getMembers()
            const memberList: RoomMemberInfo[] = []

            console.log(`[V2] 房间原始成员数量: ${allMembers.length}`)

            for (const member of allMembers) {
                // 根据参数决定是否包含已离开的成员
                if (!includeLeft && (member.membership === 'leave' || member.membership === 'ban')) {
                    continue
                }

                const powerLevel = this.获取用户权限等级(room, member.userId)

                // 安全获取头像URL，避免 "Failed to construct 'URL': Invalid URL" 错误
                let avatarUrl: string | undefined;
                try {
                    avatarUrl = member.getAvatarUrl ? member.getAvatarUrl(client.getHomeserverUrl(), 96, 96, 'crop', false, false) : undefined;
                } catch (e) {
                    avatarUrl = undefined;
                }

                memberList.push({
                    userId: member.userId,
                    displayName: resolveUserDisplayName({ matrixId: member.userId, matrixDisplayName: member.name || null }),
                    avatarUrl,
                    membership: member.membership as any,
                    powerLevel,
                    isCurrentUser: member.userId === currentUserId,
                    joinedAt: this.获取成员加入时间戳(room, member.userId),
                    lastActiveAt: this.获取成员最后活动时间戳(room, member.userId),
                    isOnline: this.获取成员在线状态(member.userId)
                })
            }

            // 按权限等级和加入时间排序
            const sortedMembers = memberList.sort((a: RoomMemberInfo, b: RoomMemberInfo) => {
                if (a.powerLevel !== b.powerLevel) {
                    return b.powerLevel - a.powerLevel // 权限高的在前
                }
                return (a.joinedAt || 0) - (b.joinedAt || 0) // 早加入的在前
            })

            //console.log(`[V2]  成功获取房间成员 ${sortedMembers.length} 个`)
            return sortedMembers

        } catch (error) {
            console.error('[V2] 获取房间成员列表失败:', error)
            return []
        }
    }

    /**
     * 获取特定成员信息
     * @param roomId 房间ID
     * @param userId 用户ID
     * @returns 成员信息
     */
    获取成员信息(roomId: string, userId: string): RoomMemberInfo | null {
        const client = matrixClientV2.getAuthedClient()
        if (!client) return null

        const room = client.getRoom(roomId)
        if (!room) return null

        const member = room.getMember(userId)
        if (!member) return null

        try {
            const powerLevel = this.获取用户权限等级(room, userId)
            const currentUserId = client.getUserId()

            // 安全获取头像URL
            let avatarUrl: string | undefined;
            try {
                avatarUrl = member.getAvatarUrl ? member.getAvatarUrl(client.getHomeserverUrl(), 96, 96, 'crop', false, false) : undefined;
            } catch (e) {
                avatarUrl = undefined;
            }

            return {
                userId: member.userId,
                displayName: resolveUserDisplayName({ matrixId: member.userId, matrixDisplayName: member.name || null }),
                avatarUrl,
                membership: member.membership as any,
                powerLevel,
                isCurrentUser: member.userId === currentUserId,
                joinedAt: this.获取成员加入时间戳(room, userId),
                lastActiveAt: this.获取成员最后活动时间戳(room, userId),
                isOnline: this.获取成员在线状态(userId)
            }
        } catch (error) {
            console.error('[V2] 获取成员信息失败:', error)
            return null
        }
    }

    /**
     * 踢出房间成员 - 标准实现
     * @param roomId 房间ID
     * @param userId 要踢出的用户ID
     * @param reason 踢出原因
     */
    async 踢出成员(roomId: string, userId: string, reason?: string): Promise<void> {
        await this.执行成员操作({
            type: 'kick',
            roomId,
            userId,
            reason
        })
    }

    /**
     * 封禁房间成员 - 标准实现
     * @param roomId 房间ID
     * @param userId 要封禁的用户ID
     * @param reason 封禁原因
     */
    async 封禁成员(roomId: string, userId: string, reason?: string): Promise<void> {
        await this.执行成员操作({
            type: 'ban',
            roomId,
            userId,
            reason
        })
    }

    /**
     * 解除成员封禁 - 标准实现
     * @param roomId 房间ID
     * @param userId 要解封的用户ID
     * @param reason 解封原因
     */
    async 解除封禁(roomId: string, userId: string, reason?: string): Promise<void> {
        await this.执行成员操作({
            type: 'unban',
            roomId,
            userId,
            reason
        })
    }

    /**
     * 提升成员权限 - 标准实现
     * @param roomId 房间ID
     * @param userId 用户ID
     * @param newPowerLevel 新的权限等级
     * @param reason 提升原因
     */
    async 提升成员权限(roomId: string, userId: string, newPowerLevel: number, reason?: string): Promise<void> {
        await this.执行成员操作({
            type: 'promote',
            roomId,
            userId,
            newPowerLevel,
            reason
        })
    }

    /**
     * 降低成员权限 - 标准实现
     * @param roomId 房间ID
     * @param userId 用户ID
     * @param newPowerLevel 新的权限等级
     * @param reason 降级原因
     */
    async 降低成员权限(roomId: string, userId: string, newPowerLevel: number, reason?: string): Promise<void> {
        await this.执行成员操作({
            type: 'demote',
            roomId,
            userId,
            newPowerLevel,
            reason
        })
    }

    /**
     * 批量管理成员 - 标准实现
     * @param actions 成员操作列表
     * @returns 操作结果
     */
    async 批量管理成员(actions: RoomManagementAction[]): Promise<{
        succeeded: RoomManagementAction[]
        failed: Array<{ action: RoomManagementAction; error: string }>
    }> {
        const succeeded: RoomManagementAction[] = []
        const failed: Array<{ action: RoomManagementAction; error: string }> = []

        console.log(`[V2] 开始批量管理 ${actions.length} 个成员操作`)

        for (const action of actions) {
            try {
                await this.执行成员操作(action)
                succeeded.push(action)
            } catch (error: any) {
                failed.push({
                    action,
                    error: error.message || '操作失败'
                })
            }
        }

        console.log(`[V2]  批量操作完成: 成功 ${succeeded.length} 个，失败 ${failed.length} 个`)
        return { succeeded, failed }
    }

    /**
     * 获取当前用户在房间中的权限 - 标准实现
     * @param roomId 房间ID
     * @returns 权限信息
     */
    获取当前用户权限(roomId: string): RoomPermissions {
        const client = matrixClientV2.getAuthedClient()
        if (!client) {
            return this.获取空权限对象()
        }

        const room = client.getRoom(roomId)
        if (!room) {
            return this.获取空权限对象()
        }

        const userId = client.getUserId()!
        return this.获取成员权限(roomId, userId)
    }

    /**
     * 获取成员的权限信息 - 标准实现
     * @param roomId 房间ID
     * @param userId 用户ID
     * @returns 权限信息
     */
    获取成员权限(roomId: string, userId: string): RoomPermissions {
        const client = matrixClientV2.getAuthedClient()
        if (!client) {
            return this.获取空权限对象()
        }

        const room = client.getRoom(roomId)
        if (!room) {
            return this.获取空权限对象()
        }

        try {
            const powerLevel = this.获取用户权限等级(room, userId)
            const powerLevels = room.currentState?.getStateEvents('m.room.power_levels', '')?.getContent()

            if (!powerLevels) {
                return this.获取空权限对象()
            }

            return {
                canInvite: powerLevel >= (powerLevels.invite || 0),
                canKick: powerLevel >= (powerLevels.kick || 50),
                canBan: powerLevel >= (powerLevels.ban || 50),
                canSendMessages: powerLevel >= (powerLevels.events_default || 0),
                canSendStateEvents: powerLevel >= (powerLevels.state_default || 50),
                canRedact: powerLevel >= (powerLevels.redact || 50),
                canModifyRoom: powerLevel >= (powerLevels.state_default || 50),
                canModifyPowerLevels: powerLevel >= (powerLevels.events?.['m.room.power_levels'] || 100),
                isAdmin: powerLevel >= 50,
                isOwner: powerLevel >= 100
            }
        } catch (error) {
            console.error('[V2] 获取成员权限失败:', error)
            return this.获取空权限对象()
        }
    }

    /**
     * 检查是否可以对目标成员执行操作 - 标准实现
     * @param roomId 房间ID
     * @param targetUserId 目标用户ID
     * @param action 要执行的操作
     * @returns 是否可以执行
     */
    检查成员操作权限(roomId: string, targetUserId: string, action: string): boolean {
        const client = matrixClientV2.getAuthedClient()
        if (!client) return false

        const room = client.getRoom(roomId)
        if (!room) return false

        try {
            const currentUserId = client.getUserId()!
            const currentUserPowerLevel = this.获取用户权限等级(room, currentUserId)
            const targetUserPowerLevel = this.获取用户权限等级(room, targetUserId)

            // 不能对自己执行某些操作
            if (currentUserId === targetUserId && ['kick', 'ban'].includes(action)) {
                return false
            }

            // 对于unban操作，只要有权限就可以执行，不受权限等级限制
            if (action === 'unban') {
                return this.获取当前用户权限(roomId).canBan
            }

            // 不能对权限等级更高或相等的用户执行操作（除了自己降级自己）
            if (targetUserPowerLevel >= currentUserPowerLevel &&
                !(currentUserId === targetUserId && action === 'demote')) {
                return false
            }

            const permissions = this.获取当前用户权限(roomId)

            switch (action) {
                case 'kick':
                    return permissions.canKick
                case 'ban':
                case 'unban':
                    return permissions.canBan
                case 'promote':
                case 'demote':
                    return permissions.canModifyPowerLevels
                case 'invite':
                    return permissions.canInvite
                default:
                    return false
            }
        } catch (error) {
            console.error('[V2] 检查成员操作权限失败:', error)
            return false
        }
    }

    /**
     * 强制刷新房间成员数据 - 标准实现
     * 用于解决数据不同步问题
     */
    async 强制刷新房间成员(roomId: string): Promise<void> {
        const client = matrixClientV2.getAuthedClient()
        if (!client) return

        try {
            console.log(`[V2] 强制刷新房间 ${roomId} 成员数据`)

            // 强制重新获取房间对象并加载成员
            const room = client.getRoom(roomId)
            if (room) {
                // 强制刷新成员列表
                if (room.loadMembersIfNeeded) {
                    await room.loadMembersIfNeeded()
                }
                console.log(`[V2] 房间成员重新加载完成，当前成员数: ${room.getMembers().length}`)
            }

            // 强制同步房间状态
            if (client.syncLeftRooms) {
                await client.syncLeftRooms()
            }

            console.log(`[V2]  房间 ${roomId} 成员数据刷新完成`)
        } catch (error) {
            console.warn(`[V2] 刷新房间 ${roomId} 成员数据失败:`, error)
        }
    }

    /**
     * 诊断房间成员同步问题 - 标准实现
     * 专门用于调试成员数据不一致的问题
     */
    async 诊断成员同步问题(roomId: string): Promise<void> {
        const client = matrixClientV2.getAuthedClient()
        if (!client) return

        console.log(`[V2]  开始诊断房间 ${roomId} 的成员同步问题`)

        try {
            // 获取本地客户端的成员列表
            const room = client.getRoom(roomId)
            if (room) {
                const localMembers = room.getMembers()
                console.log(`[V2]  本地客户端成员 (${localMembers.length}):`)
                
                localMembers.forEach((member: any) => {
                    const powerLevel = this.获取用户权限等级(room, member.userId)
                    console.log(`[V2]   ${member.userId} - 状态: ${member.membership} - 权限: ${powerLevel}`)
                })

                // 统计不同状态的成员
                this.统计房间成员状态(room)

                // 检查是否有权限异常的成员
                const powerLevelIssues = localMembers.filter((member: any) => {
                    const powerLevel = this.获取用户权限等级(room, member.userId)
                    return powerLevel === undefined || powerLevel === null
                })

                if (powerLevelIssues.length > 0) {
                    console.warn(`[V2]  发现 ${powerLevelIssues.length} 个成员权限获取异常:`)
                    powerLevelIssues.forEach((member: any) => {
                        console.warn(`[V2]   ${member.userId} - 权限获取失败`)
                    })
                }
            } else {
                console.warn(`[V2]  无法获取房间 ${roomId} 的本地对象`)
            }
        } catch (error) {
            console.error(`[V2] 诊断房间 ${roomId} 成员同步问题失败:`, error)
        }
    }

    /**
     * 获取成员统计信息 - 标准实现
     */
    获取成员统计(roomId: string): {
        totalMembers: number
        joinedMembers: number
        invitedMembers: number
        leftMembers: number
        bannedMembers: number
        adminMembers: number
        ownerMembers: number
    } {
        const client = matrixClientV2.getAuthedClient()
        if (!client) {
            return this.获取空统计对象()
        }

        const room = client.getRoom(roomId)
        if (!room) {
            return this.获取空统计对象()
        }

        try {
            const members = room.getMembers()
            let joinedMembers = 0
            let invitedMembers = 0
            let leftMembers = 0
            let bannedMembers = 0
            let adminMembers = 0
            let ownerMembers = 0

            for (const member of members) {
                const powerLevel = this.获取用户权限等级(room, member.userId)

                switch (member.membership) {
                    case 'join':
                        joinedMembers++
                        if (powerLevel >= 100) ownerMembers++
                        else if (powerLevel >= 50) adminMembers++
                        break
                    case 'invite':
                        invitedMembers++
                        break
                    case 'leave':
                        leftMembers++
                        break
                    case 'ban':
                        bannedMembers++
                        break
                }
            }

            return {
                totalMembers: members.length,
                joinedMembers,
                invitedMembers,
                leftMembers,
                bannedMembers,
                adminMembers,
                ownerMembers
            }
        } catch (error) {
            console.error('[V2] 获取成员统计失败:', error)
            return this.获取空统计对象()
        }
    }

    // 私有方法

    /**
     * 获取用户在房间中的权限等级 - 标准实现
     * @param room 房间对象
     * @param userId 用户ID
     * @returns 权限等级
     */
    private 获取用户权限等级(room: any, userId: string): number {
        try {
            const powerLevelsEvent = room.currentState?.getStateEvents('m.room.power_levels', '')
            if (!powerLevelsEvent) {
                return 0 // 默认权限等级
            }

            const powerLevels = powerLevelsEvent.getContent()
            if (!powerLevels) {
                return 0
            }

            // 检查用户是否有特定的权限等级设置
            if (powerLevels.users && powerLevels.users[userId] !== undefined) {
                return powerLevels.users[userId]
            }

            // 返回默认用户权限等级
            return powerLevels.users_default || 0
        } catch (error) {
            console.warn(`[V2] 获取用户权限等级失败: ${userId}`, error)
            return 0
        }
    }

    /**
     * 执行成员操作 - 标准实现
     */
    private async 执行成员操作(action: RoomManagementAction): Promise<void> {
        const client = matrixClientV2.getAuthedClient()
        if (!client) {
            throw this.创建错误对象('PERMISSION_DENIED', '[V2] Matrix客户端未初始化，请先登录')
        }

        const { type, roomId, userId, reason, newPowerLevel } = action

        try {
            console.log(`[V2] 执行成员操作: ${type}, 房间: ${roomId}, 用户: ${userId}`)

            // 验证操作权限
            if (!this.检查成员操作权限(roomId, userId, type)) {
                throw this.创建错误对象('PERMISSION_DENIED', `没有权限执行操作: ${type}`)
            }

            switch (type) {
                case 'kick':
                    await client.kick(roomId, userId, reason)
                    break

                case 'ban':
                    await client.ban(roomId, userId, reason)
                    break

                case 'unban':
                    console.log(`[V2] 执行解封操作: 房间=${roomId}, 用户=${userId}`)
                    await client.unban(roomId, userId)
                    console.log(`[V2] 解封操作完成`)
                    break

                case 'promote':
                case 'demote':
                    if (newPowerLevel === undefined) {
                        throw this.创建错误对象('PERMISSION_DENIED', '权限等级参数缺失')
                    }
                    await client.setPowerLevel(roomId, userId, newPowerLevel)
                    break

                default:
                    throw this.创建错误对象('UNKNOWN_ERROR', `不支持的操作类型: ${type}`)
            }

            console.log(`[V2]  成员操作执行成功: ${type}`)

        } catch (error: any) {
            console.error(`[V2] 成员操作失败:`, error)
            throw this.处理成员错误(error)
        }
    }

    /**
     * 统计房间成员状态
     */
    private 统计房间成员状态(room: any): void {
        try {
            const joinedMembers = room.getMembersWithMembership('join')
            const invitedMembers = room.getMembersWithMembership('invite')
            const leftMembers = room.getMembersWithMembership('leave')
            const bannedMembers = room.getMembersWithMembership('ban')

            console.log(`[V2] 房间 ${room.roomId} 分类成员统计:`)
            console.log(`[V2] - 已加入: ${joinedMembers.length}`)
            console.log(`[V2] - 邀请中: ${invitedMembers.length}`)
            console.log(`[V2] - 已离开: ${leftMembers.length}`)
            console.log(`[V2] - 已封禁: ${bannedMembers.length}`)
        } catch (error) {
            console.warn('[V2] 统计房间成员状态失败:', error)
        }
    }

    /**
     * 获取成员加入时间戳
     */
    private 获取成员加入时间戳(room: any, userId: string): number | undefined {
        try {
            const memberEvent = room.currentState?.getStateEvents('m.room.member', userId)
            if (memberEvent && memberEvent.getContent()?.membership === 'join') {
                return memberEvent.getTs()
            }
            return undefined
        } catch (_error) {
            return undefined
        }
    }

    /**
     * 获取成员最后活动时间戳
     */
    private 获取成员最后活动时间戳(room: any, userId: string): number | undefined {
        try {
            // 这里可以实现获取用户最后活动时间的逻辑
            // 现在返回加入时间作为占位
            return this.获取成员加入时间戳(room, userId)
        } catch (_error) {
            return undefined
        }
    }

    /**
     * 获取成员在线状态
     */
    private 获取成员在线状态(_userId: string): boolean {
        try {
            // 这里可以实现获取用户在线状态的逻辑
            // Matrix协议中用户状态比较复杂，暂时返回false
            return false
        } catch (_error) {
            return false
        }
    }

    /**
     * 获取空权限对象
     */
    private 获取空权限对象(): RoomPermissions {
        return {
            canInvite: false,
            canKick: false,
            canBan: false,
            canSendMessages: false,
            canSendStateEvents: false,
            canRedact: false,
            canModifyRoom: false,
            canModifyPowerLevels: false,
            isAdmin: false,
            isOwner: false
        }
    }

    /**
     * 获取空统计对象
     */
    private 获取空统计对象() {
        return {
            totalMembers: 0,
            joinedMembers: 0,
            invitedMembers: 0,
            leftMembers: 0,
            bannedMembers: 0,
            adminMembers: 0,
            ownerMembers: 0
        }
    }

    /**
     * 处理成员错误
     */
    private 处理成员错误(error: any): RoomManagementError {
        if (error.errcode) {
            switch (error.errcode) {
                case 'M_FORBIDDEN':
                    return this.创建错误对象('PERMISSION_DENIED', '没有权限执行此操作')
                case 'M_NOT_FOUND':
                    return this.创建错误对象('USER_NOT_FOUND', '找不到指定的用户或房间')
                case 'M_BAD_STATE':
                    return this.创建错误对象('PERMISSION_DENIED', '用户状态不允许执行此操作')
                default:
                    return this.创建错误对象('UNKNOWN_ERROR', `操作失败: ${error.message}`)
            }
        }

        if (error.code) {
            return error // 已经是我们的错误格式
        }

        return this.创建错误对象('UNKNOWN_ERROR', error.message || '执行成员操作时发生未知错误')
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

// 导出成员管理服务V2实例
export const memberManagementServiceV2 = new 成员管理服务类_V2()
export const 成员管理服务V2 = memberManagementServiceV2
