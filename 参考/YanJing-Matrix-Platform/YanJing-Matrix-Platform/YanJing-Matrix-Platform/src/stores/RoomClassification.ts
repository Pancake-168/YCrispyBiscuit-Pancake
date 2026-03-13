import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MatrixRoom } from '@/types/room'
import type { Room } from 'matrix-js-sdk'
import { GetDMRoom, getRoomMembersBe, type DMRoomType } from '@/services/Project/IM/Room'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { SystemStorageManager } from '@/utils/SystemStorage'
import { useWechatStore } from '@/stores/WeChat'
import { clearAllRoomPeerInfo, clearRoomPeerInfo, resolveRoomPeerInfos } from '@/utils/roomPeerInfo'

export type ClassifiedRoomType = 'user' | 'bot'

export type RoomClassificationReason =
    | 'invite'
    | 'dm-uu'
    | 'dm-ub'
    | 'member-count'
    | 'members-api-user'
    | 'members-api-bot'
    | 'matrix-user'
    | 'matrix-bot'
    | 'fallback-user'

export type RoomClassificationProfile = {
    roomId: string
    type: ClassifiedRoomType
    reason: RoomClassificationReason
    signature: string
    updatedAt: number
}

export const useRoomClassificationStore = defineStore('roomClassification', () => {
    const roomClassifications = ref<Record<string, RoomClassificationProfile>>({})
    const roomClassificationCacheLoaded = ref(false)
    const roomClassificationCacheOwner = ref('')
    const roomClassificationInFlight = new Set<string>()
    let roomClassificationLoadPromise: Promise<void> | null = null

    async function resolveCacheOwner(): Promise<string> {
        const wechatStore = useWechatStore()
        return wechatStore.userProfile?.username || await SystemStorageManager.getUsername() || ''
    }

    async function ensureRoomClassificationCacheLoaded(forceReload: boolean = false): Promise<void> {
        const owner = await resolveCacheOwner()

        if (!owner) {
            roomClassifications.value = {}
            roomClassificationCacheLoaded.value = true
            roomClassificationCacheOwner.value = ''
            roomClassificationInFlight.clear()
            return
        }

        const shouldReload = forceReload
            || !roomClassificationCacheLoaded.value
            || roomClassificationCacheOwner.value !== owner

        if (!shouldReload) {
            return
        }

        if (roomClassificationLoadPromise) {
            await roomClassificationLoadPromise
            return
        }

        roomClassificationLoadPromise = (async () => {
            const cached = await SystemStorageManager.getRoomClassificationCache<Record<string, RoomClassificationProfile>>(owner)
            roomClassifications.value = cached ?? {}
            roomClassificationCacheLoaded.value = true
            roomClassificationCacheOwner.value = owner
            roomClassificationInFlight.clear()
        })()

        try {
            await roomClassificationLoadPromise
        } finally {
            roomClassificationLoadPromise = null
        }
    }

    async function persistRoomClassificationCache(): Promise<void> {
        const owner = roomClassificationCacheOwner.value || await resolveCacheOwner()
        if (!owner) return
        await SystemStorageManager.setRoomClassificationCache(owner, roomClassifications.value)
    }

    function getRoomType(roomId: string): ClassifiedRoomType | null {
        return roomClassifications.value[roomId]?.type ?? null
    }

    function getRoomClassificationProfile(roomId: string): RoomClassificationProfile | undefined {
        return roomClassifications.value[roomId]
    }

    function getRoomMemberSnapshot(room: MatrixRoom | Room): string {
        const members = MatrixClientRoom.getAllRoomMembers(room)
        const signatures = members
            .map((member) => `${member.userId}:${member.membership || ''}`)
            .sort()
        const ownMembership = MatrixClientRoom.getMyMembership(room)
        return `${ownMembership}|${signatures.join(',')}`
    }

    function getRoomSignature(room: MatrixRoom | Room, dmType?: DMRoomType): string {
        return `${getRoomMemberSnapshot(room)}|dm:${dmType || ''}`
    }

    function getSignatureMemberSnapshot(signature?: string): string {
        if (!signature) return ''
        const marker = '|dm:'
        const markerIndex = signature.indexOf(marker)
        return markerIndex >= 0 ? signature.slice(0, markerIndex) : signature
    }

    async function fetchDMRoomTypeMap(): Promise<Record<string, DMRoomType>> {
        const result = await GetDMRoom()
        if (!result.ok || !result.data?.data) {
            return {}
        }

        const nextMap: Record<string, DMRoomType> = {}
        for (const item of result.data.data) {
            if (!item.room_id) continue
            nextMap[item.room_id] = item.dm_type
        }
        return nextMap
    }

    async function classifyByRoomMembersApi(roomId: string): Promise<{ type: ClassifiedRoomType; reason: RoomClassificationReason } | null> {
        const currentUsername = (useWechatStore().userProfile?.username || await SystemStorageManager.getUsername() || '').trim()
        const result = await getRoomMembersBe(roomId)
        if (!result.ok || !result.data?.length) {
            return null
        }

        const others = result.data.filter((item) => item.username?.trim() && item.username !== currentUsername)
        if (!others.length) {
            return null
        }

        if (others.some((item) => item.atype === 'user')) {
            return { type: 'user', reason: 'members-api-user' }
        }

        if (others.every((item) => item.atype === 'bot')) {
            return { type: 'bot', reason: 'members-api-bot' }
        }

        return null
    }

    async function classifyByMatrixMembers(room: MatrixRoom | Room): Promise<{ type: ClassifiedRoomType; reason: RoomClassificationReason } | null> {
        const roomId = MatrixClientRoom.getRoomId(room)
        const resolvedTypes = (await resolveRoomPeerInfos(roomId))
            .map((item) => item.type)
            .filter((item): item is 'user' | 'bot' => item === 'user' || item === 'bot')

        if (!resolvedTypes.length) {
            return null
        }

        if (resolvedTypes.some((item) => item === 'user')) {
            return { type: 'user', reason: 'matrix-user' }
        }

        if (resolvedTypes.every((item) => item === 'bot')) {
            return { type: 'bot', reason: 'matrix-bot' }
        }

        return null
    }

    async function classifyRoom(room: MatrixRoom | Room, dmRoomTypeMap: Record<string, DMRoomType>): Promise<RoomClassificationProfile> {
        const roomId = MatrixClientRoom.getRoomId(room)
        const dmType = dmRoomTypeMap[roomId]
        const signature = getRoomSignature(room, dmType)

        if (MatrixClientRoom.isInviteRoom(room)) {
            return {
                roomId,
                type: 'user',
                reason: 'invite',
                signature,
                updatedAt: Date.now(),
            }
        }

        if (dmType === 'uu') {
            return {
                roomId,
                type: 'user',
                reason: 'dm-uu',
                signature,
                updatedAt: Date.now(),
            }
        }

        if (dmType === 'ub') {
            return {
                roomId,
                type: 'bot',
                reason: 'dm-ub',
                signature,
                updatedAt: Date.now(),
            }
        }

        const memberCount = MatrixClientRoom.getRoomMembers(room).length
        if (memberCount >= 3) {
            return {
                roomId,
                type: 'user',
                reason: 'member-count',
                signature,
                updatedAt: Date.now(),
            }
        }

        if (memberCount === 2) {
            const fromMembersApi = await classifyByRoomMembersApi(roomId)
            if (fromMembersApi) {
                return {
                    roomId,
                    type: fromMembersApi.type,
                    reason: fromMembersApi.reason,
                    signature,
                    updatedAt: Date.now(),
                }
            }

            const fromMatrix = await classifyByMatrixMembers(room)
            if (fromMatrix) {
                return {
                    roomId,
                    type: fromMatrix.type,
                    reason: fromMatrix.reason,
                    signature,
                    updatedAt: Date.now(),
                }
            }
        }

        return {
            roomId,
            type: 'user',
            reason: 'fallback-user',
            signature,
            updatedAt: Date.now(),
        }
    }

    async function refreshRoomClassifications(
        rooms: Array<MatrixRoom | Room>,
        options?: { force?: boolean; changedRoomId?: string }
    ): Promise<void> {
        await ensureRoomClassificationCacheLoaded()
        const changedRoomId = options?.changedRoomId || ''
        const nextProfiles = { ...roomClassifications.value }
        const nextRoomIds = new Set<string>()
        let changed = false

        const roomsToRefresh = rooms.filter((room) => {
            const roomId = MatrixClientRoom.getRoomId(room)
            if (!roomId) return false

            nextRoomIds.add(roomId)
            const cached = nextProfiles[roomId]
            const currentMemberSnapshot = getRoomMemberSnapshot(room)
            const cachedMemberSnapshot = getSignatureMemberSnapshot(cached?.signature)
            const shouldRefresh = options?.force
                || roomId === changedRoomId
                || !cached
                || cachedMemberSnapshot !== currentMemberSnapshot

            return shouldRefresh && !roomClassificationInFlight.has(roomId)
        })

        const dmRoomTypeMap = roomsToRefresh.length > 0
            ? await fetchDMRoomTypeMap()
            : {}

        const tasks = roomsToRefresh.map(async (room) => {
            const roomId = MatrixClientRoom.getRoomId(room)
            if (!roomId) return

            roomClassificationInFlight.add(roomId)
            clearRoomPeerInfo(roomId)
            try {
                const nextProfile = await classifyRoom(room, dmRoomTypeMap)
                const previous = nextProfiles[roomId]

                if (
                    !previous
                    || previous.type !== nextProfile.type
                    || previous.reason !== nextProfile.reason
                    || previous.signature !== nextProfile.signature
                ) {
                    nextProfiles[roomId] = nextProfile
                    changed = true
                }
            } finally {
                roomClassificationInFlight.delete(roomId)
            }
        })

        await Promise.all(tasks)

        for (const roomId of Object.keys(nextProfiles)) {
            if (!nextRoomIds.has(roomId)) {
                delete nextProfiles[roomId]
                changed = true
            }
        }

        if (changed) {
            roomClassifications.value = nextProfiles
            await persistRoomClassificationCache()
        }
    }

    function buildTaggedRoomEntries(rooms: Array<MatrixRoom | Room>): Array<{ type: ClassifiedRoomType; room: MatrixRoom | Room }> {
        return rooms.map((room) => {
            const roomId = MatrixClientRoom.getRoomId(room)
            return {
                type: roomClassifications.value[roomId]?.type ?? 'user',
                room,
            }
        })
    }

    function clearRoomClassificationState(): void {
        roomClassifications.value = {}
        roomClassificationCacheLoaded.value = false
        roomClassificationCacheOwner.value = ''
        roomClassificationInFlight.clear()
        clearAllRoomPeerInfo()
    }

    return {
        roomClassifications,
        ensureRoomClassificationCacheLoaded,
        getRoomType,
        getRoomClassificationProfile,
        refreshRoomClassifications,
        buildTaggedRoomEntries,
        clearRoomClassificationState,
    }
})