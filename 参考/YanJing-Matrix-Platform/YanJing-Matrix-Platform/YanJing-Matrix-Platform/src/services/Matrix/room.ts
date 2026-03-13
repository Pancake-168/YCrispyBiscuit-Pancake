import type { MatrixRoom } from '@/types/room'
import { EventType } from 'matrix-js-sdk'
import type { Room, RoomMember } from 'matrix-js-sdk'
import { matrixClient } from '@/services/Matrix/client'
import { useMatrixTimelineStore } from '@/stores/matrixTimeline'
import { useSystemStore } from '@/stores/System'
import { formatTime } from '@/utils/Time'


class MatrixClientRoomClass {

    private resolveSdkRoom(room: MatrixRoom | Room): Room | null {
        const client = matrixClient.getAuthedClient()
        const roomId = (room as Room).roomId ?? (room as MatrixRoom).roomId

        if (typeof (room as Room).getMyMembership === 'function') {
            return room as Room
        }

        if (!client) {
            return null
        }

        return client.getRoom(roomId)
    }




    /**
     * 获取客户端的不加判断的原始的房间列表
     */
    getOriginalRooms(): MatrixRoom[] {
        const client = matrixClient.getAuthedClient()

        if (!client) {
            console.warn('[System:MatrixClientRoom:getOriginalRooms] 尚未登录或客户端未初始化')
            return []
        }
        const rooms = client.getRooms()
        console.log('[System:MatrixClientRoom:getOriginalRooms] 获取到原始房间列表', rooms)
        return rooms
    }



    /**
     * 判断是否为空间space
     */
    isSpaceRoom(room: MatrixRoom | Room): boolean {
        const client = matrixClient.getAuthedClient()

        if (!client) {
            console.warn('[System:MatrixClientRoom:isSpaceRoom] 尚未登录或客户端未初始化')
            return false
        }

        const roomId = (room as Room).roomId ?? (room as MatrixRoom).roomId
        const targetRoom = typeof (room as Room).isSpaceRoom === 'function'
            ? (room as Room)
            : client.getRoom(roomId)

        if (!targetRoom || typeof targetRoom.isSpaceRoom !== 'function') {
            return false
        }

        return targetRoom.isSpaceRoom()
    }




    /**
     * 判断是否为一对一私聊
     */
    isDirectRoom(room: MatrixRoom | Room): boolean {
        const client = matrixClient.getAuthedClient()

        if (!client) {
            console.warn('[System:MatrixClientRoom:isDirectRoom] 尚未登录或客户端未初始化')
            return false
        }

        const roomId = (room as Room).roomId ?? (room as MatrixRoom).roomId

        // 1) 优先使用 m.direct 账号数据（Matrix 官方推荐的判断方式）
        const directEvent = client.getAccountData(EventType.Direct)
        const directContent = (directEvent?.getContent?.() || {}) as Record<string, string[] | undefined>
        const isDirectByAccountData = Object.values(directContent).some((roomIds) =>
            Array.isArray(roomIds) ? roomIds.includes(roomId) : false
        )

        if (isDirectByAccountData) {
            /*
            const directRoomIds = Object.values(directContent)
                .filter((roomIds): roomIds is string[] => Array.isArray(roomIds))
                .flat()
            console.log('[System:MatrixClientRoom:isDirectRoom] 房间被标记为 m.direct:', {
                roomId,
                directRoomIds,
            })
                */
        }
        else{
            /*
            console.log('[System:MatrixClientRoom:isDirectRoom] 房间未被标记为 m.direct:', {
                roomId,
            })
                */
        }

        return isDirectByAccountData
    }



    /**
     * 调用房间服务类获取普通房间，此房间指的是非空间、非一对一私聊的房间，包括但不限于所有空间下的房间和默认空间下的房间。
     * 只要当前用户仍在房间内，且房间本身不是空间/直聊，就视为普通业务房间。
     * 注意：其他成员的 leave/ban 历史态不能再作为整房间剔除条件，否则群主踢人后房间会被错误地从自己的列表中移除。
     */
    getNormalRooms(): MatrixRoom[] {
        const client = matrixClient.getAuthedClient()
        const allRooms = this.getOriginalRooms()
        const normalRooms = allRooms.filter((room) => {
            const roomId = (room as Room).roomId ?? (room as MatrixRoom).roomId
            const targetRoom = client?.getRoom(roomId) ?? (room as Room)
            const membership = targetRoom?.getMyMembership?.() || ''
            const isActive = membership === 'join' || membership === 'invite'
            
            // 基础校验：不是空间，不是一对一，且自己还在房间内
            if (!(isActive && !this.isSpaceRoom(room) && !this.isDirectRoom(room))) {
                return false
            }

            return true
        })
        return normalRooms
    }



    /**
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     * 分割线，以下为处理单个房间的函数
     * 
     * 全都是一些小函数，比如获取房间名称、头像之类的
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     */


    /**
     * 获取房间内所有成员
     */
    getAllRoomMembers(room: MatrixRoom | Room): RoomMember[] {
        const client = matrixClient.getAuthedClient()
        if (!client) {
            console.warn('[System:MatrixClientRoom:getAllRoomMembers] 尚未登录或客户端未初始化')
            return []
        }

        const roomId = (room as Room).roomId ?? (room as MatrixRoom).roomId
        const targetRoom = typeof (room as Room).getMembers === 'function'
            ? (room as Room)
            : client.getRoom(roomId)

        if (!targetRoom) return []
        return targetRoom.getMembers() || []
    }

    /**
     * 获取房间内成员，要求只判定包含join和invite状态的成员。
     * 强校验：如果房间内有处于 leave/ban 等污染状态的成员，直接返回空数组，表示该房间作废。
     */
    getRoomMembers(room: MatrixRoom | Room): RoomMember[] {
        const client = matrixClient.getAuthedClient()
        if (!client) {
            console.warn('[System:MatrixClientRoom:getRoomMembers] 尚未登录或客户端未初始化')
            return []
        }

        const roomId = (room as Room).roomId ?? (room as MatrixRoom).roomId
        const targetRoom = typeof (room as Room).getMembers === 'function'
            ? (room as Room)
            : client.getRoom(roomId)

        if (!targetRoom) return []

        const members = targetRoom.getMembers() || []
        
       

        return members
    }
    /**
     * 通过房间id获取房间内成员，要求只判定包含join和invite状态的成员。
     * 强校验：如果房间内有处于 leave/ban 等污染状态的成员，直接返回空数组，表示该房间作废。
     */
    getRoomMembersById(roomId: string): RoomMember[] {
        const client = matrixClient.getAuthedClient()
        if (!client) {
            console.warn('[System:MatrixClientRoom:getRoomMembersById] 尚未登录或客户端未初始化')
            return []
        }

        const targetRoom = client.getRoom(roomId)
        if (!targetRoom) return []

        const members = targetRoom.getMembers() || []
        
        

        return members
    }

  



    // 获取房间Id（兼容 MatrixRoom 与 SDK Room） 
    getRoomId(room: MatrixRoom | Room): string {
        return (room as Room).roomId ?? (room as MatrixRoom).roomId
    }

    // 获取房间名称（空则返回默认文案） 
    getRoomName(room: MatrixRoom | Room): string {
        const name = (room as Room).name ?? (room as MatrixRoom).name
        return name || '未命名'
    }

    // 获取房间头像URL（优先使用 SDK Room） 
    getAvatarUrl(room: MatrixRoom | Room): string | undefined {
        const client = matrixClient.getAuthedClient()
        const roomAny = room as Room
        if (client && typeof roomAny.getAvatarUrl === 'function') {
            const baseUrl = client.getHomeserverUrl()
            return roomAny.getAvatarUrl(baseUrl, 64, 64, 'crop') ?? undefined
        }
        return (room as MatrixRoom).avatarUrl ?? undefined
    }

    // 获取房间头像首字母
    getAvatarText(room: MatrixRoom | Room): string {
        const name = this.getRoomName(room)
        return name.slice(0, 1).toUpperCase()
    }

    // 获取自己在房间中的 membership
    getMyMembership(room: MatrixRoom | Room): string {
        return this.resolveSdkRoom(room)?.getMyMembership?.() || ''
    }

    // 是否为待处理邀请房间
    isInviteRoom(room: MatrixRoom | Room): boolean {
        return this.getMyMembership(room) === 'invite'
    }

    // 获取当前用户收到邀请的时间戳
    getInviteReceivedTs(room: MatrixRoom | Room): number | null {
        if (!this.isInviteRoom(room)) return null

        const client = matrixClient.getAuthedClient()
        const targetRoom = this.resolveSdkRoom(room)
        const selfUserId = client?.getUserId?.() || ''
        if (!targetRoom || !selfUserId) return null

        const selfMember = typeof targetRoom.getMember === 'function'
            ? targetRoom.getMember(selfUserId)
            : null
        const ownInviteTs = selfMember?.membership === 'invite'
            ? selfMember.events?.member?.getTs?.()
            : undefined
        if (typeof ownInviteTs === 'number' && ownInviteTs > 0) {
            return ownInviteTs
        }

        const inviteEvents = targetRoom.getLiveTimeline?.()?.getEvents?.() ?? []
        for (let index = inviteEvents.length - 1; index >= 0; index -= 1) {
            const event = inviteEvents[index]
            if (!event) continue
            if (event.getType?.() !== 'm.room.member') continue
            if (event.getStateKey?.() !== selfUserId) continue
            const membership = event.getContent?.()?.membership
            if (membership !== 'invite') continue
            const ts = event.getTs?.()
            if (typeof ts === 'number' && ts > 0) {
                return ts
            }
        }

        return null
    }

    // 获取房间消息预览文案
    getPreview(room: MatrixRoom | Room): string {
        const systemStore = useSystemStore()
        const timelineStore = useMatrixTimelineStore()
        const roomId = this.getRoomId(room)
        const systemList = systemStore.SystemMessages?.[roomId] ?? []
        const lastSystemMessage = systemList[systemList.length - 1]
        if (lastSystemMessage?.content) return lastSystemMessage.content

        const items = timelineStore.getRoomItems(roomId)
        const lastMessage = [...items].reverse().find((item) => item.type === 'message')
        if (!lastMessage?.content && this.isInviteRoom(room)) return '待处理邀请'
        return lastMessage?.content || timelineStore.previewByRoomId[roomId] || '暂无消息'
    }

    // 获取房间未读数量
    getUnreadCount(room: MatrixRoom | Room): number {
        const timelineStore = useMatrixTimelineStore()
        const roomId = this.getRoomId(room)
        return timelineStore.unreadCountByRoomId[roomId] ?? 0
    }

    // 获取列表角标数量：优先未读数，无未读时 invite 视作 1 条待处理
    getAttentionCount(room: MatrixRoom | Room): number {
        const unreadCount = this.getUnreadCount(room)
        if (unreadCount > 0) return unreadCount
        return this.isInviteRoom(room) ? 1 : 0
    }

    // 获取列表角标文案
    getAttentionLabel(room: MatrixRoom | Room): string {
        const unreadCount = this.getUnreadCount(room)
        if (unreadCount > 0) return String(unreadCount)
        return this.isInviteRoom(room) ? '邀' : ''
    }

    // 获取房间最近活跃时间戳
    getLastActiveTs(room: MatrixRoom | Room): number | null {
        const timelineStore = useMatrixTimelineStore()
        const roomId = this.getRoomId(room)
        const items = timelineStore.getRoomItems(roomId)
        if (items.length > 0) {
            const last = items[items.length - 1]
            if (last) return last.timestamp
        }
        return (room as MatrixRoom).lastActiveTs ?? null
    }

    // 获取列表排序时间戳：invite 房间优先使用邀请时间，避免无时间线时沉底
    getListSortTs(room: MatrixRoom | Room): number {
        const inviteTs = this.getInviteReceivedTs(room) ?? 0
        const activeTs = this.getLastActiveTs(room) ?? 0
        return Math.max(inviteTs, activeTs)
    }

    // 侧边列表排序规则：待处理邀请优先，其次按时间倒序
    compareRoomsForList(a: MatrixRoom | Room, b: MatrixRoom | Room): number {
        const inviteDelta = Number(this.isInviteRoom(b)) - Number(this.isInviteRoom(a))
        if (inviteDelta !== 0) return inviteDelta

        const tsA = this.getListSortTs(a)
        const tsB = this.getListSortTs(b)
        return tsB - tsA
    }

    // 获取房间时间显示（无时间则返回空字符串）
    getDisplayTime(room: MatrixRoom | Room): string {
        const ts = this.getListSortTs(room)
        if (!ts) return ''
        return formatTime(ts)
    }


}

export const MatrixClientRoom = new MatrixClientRoomClass()

