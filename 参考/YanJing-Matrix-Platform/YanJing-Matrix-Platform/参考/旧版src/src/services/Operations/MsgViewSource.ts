// 查看消息源码（View Source）相关服务
// 职责：给定 roomId 和 eventId，返回用于 UI 展示的原始事件 JSON 与（若可用）解密后的 JSON

import { matrixEventManager } from '@/services/matrix/eventManager'

export interface ViewSourceResult {
    roomId: string
    eventId: string
    type?: string
    sender?: string
    timestamp?: number
    // 原始事件（wire/raw）
    original: any
    // 解密后的事件（若有），通常为 ev.getContent() 或等价结构
    decrypted?: any
    // 标记与信息
    isEncrypted?: boolean
    decryptionError?: string
}

/**
 * 安全 JSON 序列化（处理循环引用）
 */
export function safeStringify(obj: any, space: number = 2): string {
    const seen = new WeakSet()
    return JSON.stringify(
        obj,
        (_key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return '[Circular]'
                seen.add(value)
            }
            return value
        },
        space
    )
}

/**
 * 加载某条消息事件的“查看源码”数据
 * - 优先从本地房间缓存与实时时间线中定位 MatrixEvent
 * - 若为加密消息且已解密，则提供 decrypted 内容
 * - original 始终为底层 raw 事件（ev.event 或回退为 ev 本身）
 */
export async function getViewSourceData(params: {
    roomId?: string
    eventId: string
}): Promise<ViewSourceResult | null> {
    const { roomId, eventId } = params
    if (!eventId) return null

    let ev: any | null = null
    let resolvedRoomId = roomId

    if (roomId) {
        ev = await matrixEventManager.getMatrixEvent(roomId, eventId)
    } else {
        // 未提供 roomId 时，遍历已知房间尝试定位
        const summaries = matrixEventManager.getRoomSummaries?.() || []
        for (const s of summaries) {
            ev = await matrixEventManager.getMatrixEvent(s.roomId, eventId)
            if (ev) {
                resolvedRoomId = s.roomId
                break
            }
        }
    }
    if (!ev) return null

    // 原始事件 JSON（尽量用 ev.event，退化为 ev）
    const original = (ev && ev.event) ? ev.event : ev

    // 事件基本元信息
    const type: string | undefined = ev?.getType?.() || original?.type
    const sender: string | undefined = ev?.getSender?.() || original?.sender
    const timestamp: number | undefined = ev?.getTs?.() || original?.origin_server_ts

    // 加密与解密信息
    const isEncrypted: boolean = !!ev?.isEncrypted?.()
    let decrypted: any | undefined
    let decryptionError: string | undefined

    try {
        // 如果 SDK 已完成解密，getContent() 会返回解密后的内容
        const content = ev?.getContent?.()
        if (content && Object.keys(content).length > 0) {
            // 对于明文消息，content 即为原始；对于加密消息，content 为解密后
            decrypted = content
        }

        // 如果存在解密错误信息，做个标记（不同版本 SDK 字段名可能不同，这里尽量兼容常见写法）
        const err = ev?.getDecryptionError?.() || ev?.decryptionError
        if (err) {
            decryptionError = String(err?.message || err)
        }
    } catch (e: any) {
        decryptionError = String(e?.message || e)
    }

    return {
        roomId: resolvedRoomId || (original?.room_id ?? ''),
        eventId,
        type,
        sender,
        timestamp,
        original,
        decrypted,
        isEncrypted,
        decryptionError
    }
}

/**
 * 将 ViewSourceResult 转为适合展示的两段 JSON 字符串
 */
export function toDisplayStrings(result: ViewSourceResult): {
    originalText: string
    decryptedText?: string
} {
    const originalText = safeStringify(result.original, 2)
    const decryptedText = result.decrypted ? safeStringify(result.decrypted, 2) : undefined
    return { originalText, decryptedText }
}

