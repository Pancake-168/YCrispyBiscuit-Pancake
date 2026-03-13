import { GetRoomOtherUser } from '@/services/Project/IM/Room'
import { MatrixClientRoom } from '@/services/Matrix/room'

const hasRoomOtherUserData = (data: Record<string, unknown> | null | undefined): boolean => {
    if (!data) return false

    return [
        data.username,
        data.user_id,
        data.display_name,
        data.nickname,
        data.avatar_url,
    ].some((value) => typeof value === 'string' && value.trim())
}

export async function isGroupDisplayRoom(roomId: string): Promise<boolean> {
    if (!roomId) return false

    const memberCount = MatrixClientRoom.getRoomMembersById(roomId).length
    if (memberCount > 4) {
        return true
    }

    if (memberCount !== 4) {
        return false
    }

    const result = await GetRoomOtherUser(roomId)
    return !hasRoomOtherUserData((result.data as Record<string, unknown> | null | undefined) ?? null)
}
