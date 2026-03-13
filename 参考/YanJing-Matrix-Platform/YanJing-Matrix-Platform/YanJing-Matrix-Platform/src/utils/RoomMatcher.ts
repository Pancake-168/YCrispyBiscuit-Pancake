import { addPrefixSuffix, removePrefixSuffix } from './stringUtils'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import { MatrixClientRoom } from "@/services/Matrix/room";




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
     * 依据用户id列表查找匹配的房间
     * @param targetUserIds 目标用户ID列表,isbot表示是否是bot房间
     * @returns 匹配的房间ID，如果未找到则返回 "未匹配到!"
     */
    async findMatchingRoom(targetUserIds: string[], isbot: boolean = false): Promise<string> {

        if (!targetUserIds || targetUserIds.length === 0) {
            return "传入的用户ID列表为空!无法匹配房间"
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


            const rooms = MatrixClientRoom.getNormalRooms()

            for (const room of rooms) {

                const roomMembers = await MatrixClientRoom.getRoomMembers(room)

                // 将房间成员规范化
                const roomMembersCanonical = roomMembers.map(member => this.toCanonical(member.userId))

                // [分支1：2人并且是与bot聊天] 
                // 逻辑：严格匹配（必须只有这2人，且名单一致）
                if (originalTargetCanonical.length === 2 && isbot) {
                    if (roomMembersCanonical.length === 2 && this.isExactMatch(roomMembersCanonical, originalTargetCanonical)) {
                        const roomId = room.roomId
                        this.cache.set(cacheKey, roomId)
                        return roomId
                    }
                } 
                // [分支2：4人并且是普通聊天] 
                // 逻辑：这4个人里，其实只有前2个人（A和B）是决定房间有无的关键。
                // 只要 A（下标0）和 B（下标1）在房间内即可。
                else if (originalTargetCanonical.length === 4 && !isbot) {
                    // 【修正】：不仅要判断传入的是4个人，更要确保我们要找的确实是一个“4人房”！
                    if (roomMembersCanonical.length === 4) {
                        const memberSet = new Set(roomMembersCanonical)
                        
                        const userA = originalTargetCanonical[0]
                        const userB = originalTargetCanonical[1]

                        if (userA && userB && memberSet.has(userA) && memberSet.has(userB)) {
                            const roomId = room.roomId
                            this.cache.set(cacheKey, roomId)
                            return roomId
                        }
                    }
                }

                // 其他任何情况统统跳过，不匹配该房间
                continue;





            }
            // 未找到匹配的房间
            this.cache.set(cacheKey, "未匹配到!")
            return "未匹配到!"
        } catch (error) {
            console.warn('[System:RoomMatcher:findMatchingRoom]', error)
            return "未匹配到!"
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
        if (!id) return ''
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
