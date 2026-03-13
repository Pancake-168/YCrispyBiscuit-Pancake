import { defineStore } from 'pinia'
import { ref } from 'vue'
import { MATRIX_SERVER_URL } from '@/apiUrls'
import { GetRoomOtherUser } from '@/services/Project/IM/Room'
import { GetIMUserInfo } from '@/services/Project/SSO/UserInfo'
import { useIDmapStore } from '@/stores/IDmap'
import { SystemStorageManager } from '@/utils/SystemStorage'
import { useWechatStore } from '@/stores/WeChat'
import { resolveMediaBaseUrl } from '@/utils/media'
import { createMatrixAvatarHelper } from '@/utils/matrixAvatar'
import { matrixClient } from '@/services/Matrix/client'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { clearAllRoomPeerInfo, resolveRoomPeerInfos } from '@/utils/roomPeerInfo'
import { isGroupDisplayRoom } from '@/utils/roomGroupDisplay'

export type RoomDisplayProfile = {
    roomId: string
    displayName: string
    avatarUrl?: string
    updatedAt: number
}

const matrixAvatarHelper = createMatrixAvatarHelper(MATRIX_SERVER_URL)

export const useRoomDisplayStore = defineStore('roomDisplay', () => {
    const roomDisplayProfiles = ref<Record<string, RoomDisplayProfile>>({})
    const roomDisplayCacheLoaded = ref(false)
    const roomDisplayCacheOwner = ref('')

    const roomDisplayInFlight = new Set<string>()
    const roomDisplayFetchedOnce = new Set<string>()
    let roomDisplayLoadPromise: Promise<void> | null = null

    async function resolveCacheOwner(): Promise<string> {
        const wechatStore = useWechatStore()
        return wechatStore.userProfile?.username || await SystemStorageManager.getUsername() || ''
    }

    async function ensureRoomDisplayCacheLoaded(forceReload: boolean = false): Promise<void> {
        const owner = await resolveCacheOwner()

        if (!owner) {
            roomDisplayProfiles.value = {}
            roomDisplayCacheLoaded.value = true
            roomDisplayCacheOwner.value = ''
            roomDisplayInFlight.clear()
            roomDisplayFetchedOnce.clear()
            return
        }

        const shouldReload = forceReload
            || !roomDisplayCacheLoaded.value
            || roomDisplayCacheOwner.value !== owner

        if (!shouldReload) {
            return
        }

        if (roomDisplayLoadPromise) {
            return await roomDisplayLoadPromise
        }

        roomDisplayLoadPromise = (async () => {
            const cached = await SystemStorageManager.getRoomDisplayCache<Record<string, RoomDisplayProfile>>(owner)
            roomDisplayProfiles.value = cached ?? {}
            roomDisplayCacheLoaded.value = true
            roomDisplayCacheOwner.value = owner
            roomDisplayInFlight.clear()
            roomDisplayFetchedOnce.clear()
        })()

        try {
            await roomDisplayLoadPromise
        } finally {
            roomDisplayLoadPromise = null
        }
    }

    async function persistRoomDisplayCache(): Promise<void> {
        const owner = roomDisplayCacheOwner.value || await resolveCacheOwner()
        if (!owner) return

        await SystemStorageManager.setRoomDisplayCache(owner, roomDisplayProfiles.value)
    }

    function getRoomDisplayProfile(roomId: string): RoomDisplayProfile | undefined {
        return roomDisplayProfiles.value[roomId]
    }

    function getRoomDisplayName(roomId: string, fallbacks: Array<string | undefined> = []): string {
        const preferred = roomDisplayProfiles.value[roomId]?.displayName?.trim()
        if (preferred) return preferred

        const fallback = fallbacks.find((item) => item && item.trim())
        return fallback?.trim() || ''
    }

    function getRoomDisplayAvatarUrl(roomId: string): string | undefined {
        return roomDisplayProfiles.value[roomId]?.avatarUrl
    }

    function getRoomDisplayInitial(roomId: string, fallbacks: Array<string | undefined> = []): string {
        const source = getRoomDisplayName(roomId, fallbacks)
        return source ? source.charAt(0).toUpperCase() : '?'
    }

    function resolveMatrixRoomName(roomId: string): string {
        const room = matrixClient.getAuthedClient()?.getRoom(roomId)
        const roomName = room ? MatrixClientRoom.getRoomName(room).trim() : ''
        return roomName || ''
    }

    async function resolveDisplayAvatarUrl(options: {
        apiAvatarUrl?: string | null
        matrixUserId?: string | null
    }): Promise<string | undefined> {
        const rawApiAvatarUrl = options.apiAvatarUrl?.trim() || ''
        if (rawApiAvatarUrl) {
            if (rawApiAvatarUrl.startsWith('mxc://')) {
                const resolvedByMxc = await matrixAvatarHelper.resolveAvatarByMxc(rawApiAvatarUrl)
                if (resolvedByMxc) {
                    return resolvedByMxc
                }

                return resolveMediaBaseUrl({ mxcUrl: rawApiAvatarUrl })
            }

            return rawApiAvatarUrl
        }

        const matrixUserId = options.matrixUserId?.trim() || ''
        if (!matrixUserId) {
            return undefined
        }

        return await matrixAvatarHelper.resolveAvatarUrl(matrixUserId)
    }

    async function resolveMemberFallbackInfo(roomId: string): Promise<{
        username?: string
        nickname?: string
        matrixUserId?: string
    } | null> {
        const peers = await resolveRoomPeerInfos(roomId)
        if (!peers.length) {
            return null
        }

        const preferred = peers.find((item) => item.username || item.nickname || item.matrixUserId) || peers[0]
        return preferred
            ? {
                username: preferred.username?.trim() || undefined,
                nickname: preferred.nickname?.trim() || undefined,
                matrixUserId: preferred.matrixUserId?.trim() || undefined,
            }
            : null
    }

    async function refreshRoomDisplayProfile(roomId: string): Promise<void> {
        if (!roomId || roomDisplayInFlight.has(roomId)) {
            return
        }

        roomDisplayInFlight.add(roomId)

        try {
            await ensureRoomDisplayCacheLoaded()

            if (await isGroupDisplayRoom(roomId)) {
                const matrixRoomName = resolveMatrixRoomName(roomId)
                if (matrixRoomName) {
                    roomDisplayProfiles.value = {
                        ...roomDisplayProfiles.value,
                        [roomId]: {
                            roomId,
                            displayName: matrixRoomName,
                            avatarUrl: undefined,
                            updatedAt: Date.now(),
                        },
                    }

                    await persistRoomDisplayCache()
                }

                return
            }

            const result = await GetRoomOtherUser(roomId)
            const idmapStore = useIDmapStore()
            const fallbackInfo = await resolveMemberFallbackInfo(roomId)

            const username = result.data?.username?.trim()
                || fallbackInfo?.username?.trim()
                || ''
            const idmapUser = username ? idmapStore.getByUsername(username) : undefined
            const shouldFetchByUsername = !idmapUser && username && username !== fallbackInfo?.username?.trim()
            const imUserInfo = shouldFetchByUsername
                ? await GetIMUserInfo(username)
                : null

            const nickname = idmapUser?.nickname?.trim()
                || fallbackInfo?.nickname?.trim()
                || imUserInfo?.data?.nickname?.trim()
                || result.data?.nickname?.trim()
                || ''

            const displayName = nickname
                || username
                || result.data?.display_name?.trim()
                || ''

            const matrixUserId = result.data?.user_id?.trim()
                || idmapUser?.matrixId?.trim()
                || imUserInfo?.data?.im?.trim()
                || fallbackInfo?.matrixUserId?.trim()
                || ''

            const avatarUrl = await resolveDisplayAvatarUrl({
                apiAvatarUrl: result.data?.avatar_url,
                matrixUserId,
            })

            if (!displayName && !avatarUrl) {
                return
            }

            roomDisplayProfiles.value = {
                ...roomDisplayProfiles.value,
                [roomId]: {
                    roomId,
                    displayName,
                    avatarUrl,
                    updatedAt: Date.now(),
                },
            }

            await persistRoomDisplayCache()
        } finally {
            roomDisplayInFlight.delete(roomId)
        }
    }

    async function prefetchRoomDisplayProfiles(roomIds: string[], force: boolean = false): Promise<void> {
        await ensureRoomDisplayCacheLoaded()

        const tasks: Array<Promise<void>> = []

        for (const roomId of roomIds) {
            if (!roomId) continue

            if (!force && roomDisplayFetchedOnce.has(roomId)) {
                continue
            }

            roomDisplayFetchedOnce.add(roomId)
            tasks.push(refreshRoomDisplayProfile(roomId))
        }

        if (tasks.length > 0) {
            await Promise.all(tasks)
        }
    }

    function clearRoomDisplayState(): void {
        roomDisplayProfiles.value = {}
        roomDisplayCacheLoaded.value = false
        roomDisplayCacheOwner.value = ''
        roomDisplayInFlight.clear()
        roomDisplayFetchedOnce.clear()
        clearAllRoomPeerInfo()
    }

    return {
        roomDisplayProfiles,
        ensureRoomDisplayCacheLoaded,
        getRoomDisplayProfile,
        getRoomDisplayName,
        getRoomDisplayAvatarUrl,
        getRoomDisplayInitial,
        refreshRoomDisplayProfile,
        prefetchRoomDisplayProfiles,
        clearRoomDisplayState,
    }
})