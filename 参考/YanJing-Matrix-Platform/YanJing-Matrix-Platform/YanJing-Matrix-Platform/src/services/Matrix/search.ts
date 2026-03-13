import { matrixClient } from '@/services/Matrix/client'
import { matrixMessageService } from '@/services/Matrix/message'
import { GetIMUserInfo } from '@/services/Project/SSO/UserInfo'
import { useSystemStore } from '@/stores/System'
import type { MessageSearchOptions, MessageSearchResult, MatrixMessageItem } from '@/types/message'
import type { UserSearchResult } from '@/types/room-management'

interface UserSearchOptions {
    limit?: number
    excludeRoomId?: string
}

function isValidMatrixUserId(userId: string): boolean {
    return /^@[a-zA-Z0-9._=-]+:[a-zA-Z0-9.-]+$/.test(userId)
}

export function searchMessages(query: string, options?: MessageSearchOptions): MessageSearchResult[] {
    const client = matrixClient.getAuthedClient()
    const keyword = query.trim()

    if (!client || !keyword) {
        console.log('[System:search:searchMessages]Client不可用或查询为空，无法搜索消息')
        return []
    }

    const store = useSystemStore()
    const caseSensitive = options?.caseSensitive === true
    const includeSystem = options?.includeSystem === true
    const limit = Math.max(1, options?.limit ?? 100)

    const targetRoomIds = options?.roomId
        ? [options.roomId]
        : Array.from(new Set([
            ...Object.keys(store.SystemMessages || {}),
            ...client.getRooms().map((room) => room.roomId)
        ]))

    const results: MessageSearchResult[] = []
    for (const roomId of targetRoomIds) {
        let roomMessages = store.SystemMessages?.[roomId]
        if (!roomMessages || roomMessages.length === 0) {
            roomMessages = matrixMessageService.getRoomMessages(roomId)
        }

        if (!roomMessages || roomMessages.length === 0) continue

        const roomName = client.getRoom(roomId)?.name || roomId
        for (const item of roomMessages) {
            if (!includeSystem && item.type === 'm.system') continue
            if (!matchMessageItem(item, keyword, caseSensitive)) continue

            const plainFormatted = (item.formattedBody || '').replace(/<[^>]*>/g, ' ')
            const senderName = item.senderName || item.senderId || '未知用户'
            const snippetSource = item.content || plainFormatted || item.fileName || senderName

            results.push({
                roomId: item.roomId,
                roomName,
                messageId: item.id,
                senderId: item.senderId,
                senderName,
                type: item.type,
                timestamp: item.timestamp,
                timeText: item.timeText,
                content: item.content || '',
                snippet: buildSearchSnippet(snippetSource || '', keyword, caseSensitive)
            })
        }
    }

    results.sort((a, b) => b.timestamp - a.timestamp)
    return results.slice(0, limit)
}

export function searchMessagesInRoom(
    roomId: string,
    query: string,
    options?: Omit<MessageSearchOptions, 'roomId'>
): MessageSearchResult[] {
    return searchMessages(query, {
        ...options,
        roomId
    })
}

export async function searchUsers(query: string, options?: UserSearchOptions): Promise<UserSearchResult[]> {
    const trimmed = query.trim()

    if (!trimmed) {
        console.log("[System:search:searchUsers]查询为空，无法搜索用户")
        return []
    }

    try {
        const { ok, data } = await GetIMUserInfo(trimmed)
        if (!ok || !data?.im) return []

        const matrixUserId = data.im.trim()
        if (!isValidMatrixUserId(matrixUserId)) {
            console.warn('[System:search:searchUsers]返回的 IM 字段不是合法 Matrix ID:', data.im)
            return []
        }

        const result: UserSearchResult = {
            username: data.username?.trim?.() || '',
            atype: data.atype?.trim?.() || '',
            im: matrixUserId,
            nickname: data.nickname?.trim?.() || '',
        }

        if (typeof options?.limit === 'number' && options.limit <= 0) {
            return []
        }

        return [result]
    } catch (error) {
        console.log('[System:search:searchUsers]查询失败:', error)
        return []
    }
}

function matchMessageItem(item: MatrixMessageItem, keyword: string, caseSensitive: boolean): boolean {
    const plainFormatted = (item.formattedBody || '').replace(/<[^>]*>/g, ' ')
    const senderName = item.senderName || item.senderId || '未知用户'
    const fieldsToMatch = [
        item.content || '',
        plainFormatted,
        item.fileName || '',
        senderName,
        item.senderId || ''
    ]

    return fieldsToMatch.some((field) => {
        if (!field) return false
        if (caseSensitive) return field.includes(keyword)
        return field.toLowerCase().includes(keyword.toLowerCase())
    })
}

function buildSearchSnippet(text: string, keyword: string, caseSensitive: boolean): string {
    const cleanText = text.replace(/\s+/g, ' ').trim()
    if (!cleanText) return ''

    const source = caseSensitive ? cleanText : cleanText.toLowerCase()
    const target = caseSensitive ? keyword : keyword.toLowerCase()
    const index = source.indexOf(target)
    if (index < 0) return cleanText.slice(0, 120)

    const start = Math.max(0, index - 30)
    const end = Math.min(cleanText.length, index + keyword.length + 30)
    const prefix = start > 0 ? '…' : ''
    const suffix = end < cleanText.length ? '…' : ''
    return `${prefix}${cleanText.slice(start, end)}${suffix}`
}
