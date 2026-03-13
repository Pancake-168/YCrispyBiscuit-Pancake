import { EventType } from 'matrix-js-sdk'
import type { MatrixClient, Room } from 'matrix-js-sdk'
import { matrixClient } from '@/services/Matrix/client'
import type {
    CreateNormalRoomOptions,
    CreateNormalRoomResult,
    RoomMemberInfo,
    RoomPermissions,
} from '@/types/room-management'

const EMPTY_PERMISSIONS: RoomPermissions = {
    canInvite: false,
    canKick: false,
    canBan: false,
    canSendMessages: false,
    canSendStateEvents: false,
    canRedact: false,
    canModifyRoom: false,
    canModifyPowerLevels: false,
    isAdmin: false,
    isOwner: false,
}

class RoomManagementService {
    private readonly createRoomInFlight = new Map<string, Promise<CreateNormalRoomResult>>()

    getRoomInfo(roomId: string): { roomId: string; name: string; topic: string } {
        const client = matrixClient.getAuthedClient()
        const room = client?.getRoom(roomId)

        if (!client || !room) {
            console.log("[System:roomManagement:getRoomInfo]Client或房间不可用，无法获取房间信息")
            return { roomId, name: roomId, topic: '' }
        }

        const name = room.name
        const topicState = room.currentState?.getStateEvents?.(EventType.RoomTopic, '')?.getContent?.() as
            | { topic?: string }
            | undefined
        const topic = topicState?.topic || (room as { topic?: string }).topic || ''

        return { roomId, name, topic }
    }

    async updateRoomInfo(roomId: string, payload: { name?: string; topic?: string }): Promise<void> {
        const client = matrixClient.getAuthedClient()
        if (!client) {
            console.log("[System:roomManagement:updateRoomInfo]Client不可用，无法更新房间信息")
            return
        }

        if (typeof payload.name === 'string') {
            await client.setRoomName(roomId, payload.name)
        }

        if (typeof payload.topic === 'string') {
            await client.setRoomTopic(roomId, payload.topic)
        }
    }

    getRoomMembers(roomId: string, includeLeft: boolean = false): RoomMemberInfo[] {
        const client = matrixClient.getAuthedClient()
        const room = client?.getRoom(roomId)
        if (!client || !room){
          console.log("[System:roomManagement:getRoomMembers]Client或房间不可用，无法获取成员列表")
            return []
        } 

        const currentUserId = client.getUserId() || ''
        const members = room.getMembers() || []

        const list: RoomMemberInfo[] = []
        for (const member of members) {
            if (!includeLeft && (member.membership === 'leave' || member.membership === 'ban')) continue

            const powerLevel = this.getUserPowerLevel(room, member.userId)
            let avatarUrl: string | undefined
            try {
                avatarUrl = member.getAvatarUrl
                    ? member.getAvatarUrl(client.getHomeserverUrl(), 48, 48, 'crop', false, false) || undefined
                    : undefined
            } catch {
                avatarUrl = undefined
            }

            list.push({
                userId: member.userId,
                displayName: member.name || member.userId,
                avatarUrl,
                membership: member.membership as RoomMemberInfo['membership'],
                powerLevel,
                isCurrentUser: member.userId === currentUserId,
            })
        }

        return list.sort((a, b) => {
            if (a.powerLevel !== b.powerLevel) return b.powerLevel - a.powerLevel
            return a.userId.localeCompare(b.userId)
        })
    }

    getCurrentUserPermissions(roomId: string): RoomPermissions {
        const client = matrixClient.getAuthedClient()
        if (!client){
            console.log("[System:roomManagement:getCurrentUserPermissions]Client不可用，无法获取当前用户权限")
            return { ...EMPTY_PERMISSIONS }
        }
        const userId = client.getUserId() || ''
        return this.getUserPermissions(roomId, userId)
    }

    getUserPermissions(roomId: string, userId: string): RoomPermissions {
        const client = matrixClient.getAuthedClient()
        const room = client?.getRoom(roomId)
        if (!client || !room) {
            console.log("[System:roomManagement:getUserPermissions]Client或房间不可用，无法获取用户权限")
            return { ...EMPTY_PERMISSIONS }
        }

        const powerLevels = this.getPowerLevelsContent(room)
        if (!powerLevels) return { ...EMPTY_PERMISSIONS }

        const powerLevel = this.getUserPowerLevel(room, userId)
        const inviteLevel = this.getNumberField(powerLevels, 'invite', 0)
        const kickLevel = this.getNumberField(powerLevels, 'kick', 50)
        const banLevel = this.getNumberField(powerLevels, 'ban', 50)
        const eventsDefaultLevel = this.getNumberField(powerLevels, 'events_default', 0)
        const stateDefaultLevel = this.getNumberField(powerLevels, 'state_default', 50)
        const redactLevel = this.getNumberField(powerLevels, 'redact', 50)

        const eventsField = powerLevels.events
        const eventsMap = (eventsField && typeof eventsField === 'object') ? eventsField as Record<string, unknown> : undefined
        const powerLevelsEventLevel = typeof eventsMap?.['m.room.power_levels'] === 'number'
            ? (eventsMap['m.room.power_levels'] as number)
            : 100

        return {
            canInvite: powerLevel >= inviteLevel,
            canKick: powerLevel >= kickLevel,
            canBan: powerLevel >= banLevel,
            canSendMessages: powerLevel >= eventsDefaultLevel,
            canSendStateEvents: powerLevel >= stateDefaultLevel,
            canRedact: powerLevel >= redactLevel,
            canModifyRoom: powerLevel >= stateDefaultLevel,
            canModifyPowerLevels: powerLevel >= powerLevelsEventLevel,
            isAdmin: powerLevel >= 50,
            isOwner: powerLevel >= 100,
        }
    }

    async inviteUser(roomId: string, userId: string, reason?: string): Promise<void> {
        const client = matrixClient.getAuthedClient()
        if (!client){
            console.log("[System:roomManagement:inviteUser]Client不可用，无法邀请用户")
            return
        }
        await client.invite(roomId, userId, reason)
    }

    async cancelInvite(roomId: string, userId: string): Promise<void> {
        const client = matrixClient.getAuthedClient()
        if (!client){
            console.log("[System:roomManagement:cancelInvite]Client不可用，无法取消邀请")
            return
        }
        await client.kick(roomId, userId, '取消邀请')
    }

    async kickMember(roomId: string, userId: string, reason?: string): Promise<void> {
        const client = matrixClient.getAuthedClient()
        if (!client){
            console.log("[System:roomManagement:kickMember]Client不可用，无法踢出成员")
            return
        }
        await client.kick(roomId, userId, reason)
    }

    async banMember(roomId: string, userId: string, reason?: string): Promise<void> {
        const client = matrixClient.getAuthedClient()
        if (!client){
            console.log("[System:roomManagement:banMember]Client不可用，无法封禁成员")
            return
        }
        await client.ban(roomId, userId, reason)
    }

    async unbanMember(roomId: string, userId: string): Promise<void> {
        const client = matrixClient.getAuthedClient()
        if (!client){
            console.log("[System:roomManagement:unbanMember]Client不可用，无法解封成员")
            return
        }
        await client.unban(roomId, userId)
    }

    async updatePowerLevel(roomId: string, userId: string, newLevel: number): Promise<void> {
        const client = matrixClient.getAuthedClient()
        if (!client){
            console.log("[System:roomManagement:updatePowerLevel]Client不可用，无法更新权限等级")
            return
        }
        await client.setPowerLevel(roomId, userId, newLevel)
    }

    async leaveRoom(roomId: string): Promise<void> {
        const client = matrixClient.getAuthedClient()
        if (!client){
            console.log("[System:roomManagement:leaveRoom]Client不可用，无法离开房间")
            return
        }

        try {
            await client.leave(roomId)
        } catch (error) {
            console.warn('[System:roomManagement:leaveRoom] leave 失败，继续尝试 forget:', roomId, error)
        }

        // 关键：主动 forget，避免等待 /sync 时序导致房间短时间仍出现在列表
        try {
            await client.forget(roomId, true)
        } catch (error) {
            console.warn('[System:roomManagement:leaveRoom] forget 失败（忽略）:', roomId, error)
        }
    }

    async acceptInvite(roomId: string): Promise<void> {
        const client = matrixClient.getAuthedClient()
        if (!client) {
            console.log("[System:roomManagement:acceptInvite]Client不可用，无法接受邀请")
            return
        }
        await client.joinRoom(roomId)
    }

    async rejectInvite(roomId: string): Promise<void> {
        const client = matrixClient.getAuthedClient()
        if (!client) {
            console.log("[System:roomManagement:rejectInvite]Client不可用，无法拒绝邀请")
            return
        }
        await client.leave(roomId)
        // 拒绝邀请后同样清理本地房间引用，避免列表残留
        try {
            await client.forget(roomId, true)
        } catch (error) {
            console.warn('[System:roomManagement:rejectInvite] forget 失败（忽略）:', roomId, error)
        }
    }

    private getPowerLevelsContent(room: Room): Record<string, unknown> | null {
        return room.currentState?.getStateEvents?.(EventType.RoomPowerLevels, '')?.getContent?.() || null
    }

    private getUserPowerLevel(room: Room, userId: string): number {
        const powerLevels = this.getPowerLevelsContent(room)
        if (!powerLevels) return 0
        const users = powerLevels.users
        if (users && typeof users === 'object') {
            const userLevels = users as Record<string, unknown>
            const level = userLevels[userId]
            if (typeof level === 'number') return level
        }
        return typeof powerLevels.users_default === 'number' ? powerLevels.users_default : 0
    }

    private getNumberField(content: Record<string, unknown>, key: string, fallback: number): number {
        const value = content[key]
        return typeof value === 'number' ? value : fallback
    }








    /**
     * 创建房间
     */
    async createNormalRoom(options: CreateNormalRoomOptions): Promise<CreateNormalRoomResult> {
        const inFlightKey = this.buildCreateRoomInFlightKey(options)
        const existing = this.createRoomInFlight.get(inFlightKey)
        if (existing) {
            return existing
        }

        const currentPromise = this.createNormalRoomInternal(options)
        this.createRoomInFlight.set(inFlightKey, currentPromise)

        try {
            return await currentPromise
        } finally {
            if (this.createRoomInFlight.get(inFlightKey) === currentPromise) {
                this.createRoomInFlight.delete(inFlightKey)
            }
        }
    }

    private buildCreateRoomInFlightKey(options: CreateNormalRoomOptions): string {
        const name = options.name?.trim() || '聊天'
        const topic = options.topic?.trim() || ''
        const defaultSpaceRoomId = options.defaultSpaceRoomId?.trim() || ''
        const invite = (options.inviteUserIds || []).map((id) => id.trim()).filter(Boolean).sort()
        const avatar = options.avatarMxcUrl?.trim() || ''
        const federated = options.isFederated ?? true
        return [name, topic, defaultSpaceRoomId, invite.join('|'), avatar, String(federated)].join('::')
    }

    private async createNormalRoomInternal(options: CreateNormalRoomOptions): Promise<CreateNormalRoomResult> {
        const client = matrixClient.getAuthedClient()
        if (!client) {
            console.log("[System:roomManagement:createNormalRoom]Client不可用，无法创建房间")
            throw new Error('Matrix 客户端不可用')
        }

        const name = options.name?.trim() || '聊天'
        const defaultSpaceRoomId = options.defaultSpaceRoomId?.trim()

        const invite = (options.inviteUserIds || []).map((id) => id.trim()).filter(Boolean)
        type CreateRoomRequest = Parameters<MatrixClient['createRoom']>[0]

        const request: CreateRoomRequest = {
            name,
            topic: options.topic?.trim() || undefined,

            // 1) 非公开
            visibility: 'private' as CreateRoomRequest['visibility'],

            // 2) 普通房间（不是 space）+ 非私聊
            preset: 'private_chat' as CreateRoomRequest['preset'],
            is_direct: false,

            // 3) 创建时可选邀请
            invite: invite.length ? invite : undefined,

            // 4) 非加密（标准写法）：不发送 m.room.encryption 状态事件
            initial_state: [
                ...(options.avatarMxcUrl
                    ? [{
                        type: 'm.room.avatar',
                        state_key: '',
                        content: { url: options.avatarMxcUrl },
                    }]
                    : []),
            ] as CreateRoomRequest['initial_state'],

            creation_content: {
                'm.federate': options.isFederated ?? true,
            } as CreateRoomRequest['creation_content'],
        }

        const createRes = await client.createRoom(request)
        const roomId = (createRes as { room_id?: string })?.room_id
        if (!roomId) {
            console.log("[System:roomManagement:createNormalRoom]创建房间成功但未返回 room_id")
            throw new Error('创建房间成功但未返回 room_id')
        }

        // 5) 默认空间归属策略
        // - 真实 spaceId：显式挂载
        // - 'default' / 空：不写空间状态，交由上层按“默认空间分组”展示
        if (defaultSpaceRoomId && defaultSpaceRoomId !== 'default') {
            await this.attachRoomToDefaultSpace({
                client,
                roomId,
                defaultSpaceRoomId,
                via: options.defaultSpaceVia,
            })
        }
        return { roomId }
    }

    private async attachRoomToDefaultSpace(params: {
        client: MatrixClient
        roomId: string
        defaultSpaceRoomId: string
        via?: string[]
    }): Promise<void> {
        const { client, roomId, defaultSpaceRoomId } = params
        const via = (params.via || []).filter(Boolean)
        const finalVia = via.length ? via : this.inferViaServers(client)

        await client.sendStateEvent(
            roomId,
            'm.space.parent' as Parameters<MatrixClient['sendStateEvent']>[1],
            { via: finalVia },
            defaultSpaceRoomId,
        )

        await client.sendStateEvent(
            defaultSpaceRoomId,
            'm.space.child' as Parameters<MatrixClient['sendStateEvent']>[1],
            { via: finalVia },
            roomId,
        )
    }

    private inferViaServers(client: MatrixClient): string[] {
        const userId = client.getUserId?.() || ''
        const server = userId.includes(':') ? userId.split(':')[1] : ''
        return server ? [server] : []
    }


























}

export const roomManagementService = new RoomManagementService()
