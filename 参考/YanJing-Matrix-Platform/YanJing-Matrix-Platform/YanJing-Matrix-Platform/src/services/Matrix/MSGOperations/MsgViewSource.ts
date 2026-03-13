import { matrixClient } from '@/services/Matrix/client'
import type { MatrixEvent } from 'matrix-js-sdk'

/**
 * 提取事件原始结构（优先有效事件）。
 * 输入：event（MatrixEvent）。
 * 输出：unknown。
 * 逻辑：优先 getEffectiveEvent，其次取 event 字段，最后取 content。
 */
function pickRawEvent(event: MatrixEvent): unknown {
  const maybeEffective = (event as unknown as { getEffectiveEvent?: () => unknown }).getEffectiveEvent?.()
  if (maybeEffective) return maybeEffective
  const raw = (event as unknown as { event?: unknown }).event
  if (raw) return raw
  return event.getContent?.() ?? null
}

/**
 * 获取消息/事件的原始 JSON 文本。
 * 输入：roomId、eventId。
 * 输出：Promise<string>。
 * 逻辑：优先从房间内查找事件，必要时从时间线补全，再格式化为 JSON。
 */
export async function getEventSource(roomId: string, eventId: string): Promise<string> {
  const client = matrixClient.getAuthedClient()
  if (!client) throw new Error('Matrix 客户端未初始化')

  const room = client.getRoom(roomId)
  if (!room) throw new Error('对话房间不存在')

  let matrixEvent: MatrixEvent | null = (room as unknown as { findEventById?: (id: string) => MatrixEvent | null })
    .findEventById?.(eventId) ?? null

  if (!matrixEvent) {
    const liveEvents = room.getLiveTimeline?.()?.getEvents?.() || []
    matrixEvent = liveEvents.find((ev: MatrixEvent) => ev?.getId?.() === eventId) ?? null
  }

  if (!matrixEvent && client.getEventTimeline && room.getUnfilteredTimelineSet) {
    try {
      const timeline = await client.getEventTimeline(room.getUnfilteredTimelineSet(), eventId)
      const events = timeline?.getEvents?.() || []
      matrixEvent = events.find((ev: MatrixEvent) => ev?.getId?.() === eventId) ?? null
    } catch {
      // ignore
    }
  }

  if (!matrixEvent) throw new Error('未找到消息事件')

  const raw = pickRawEvent(matrixEvent)
  return JSON.stringify(raw, null, 2)
}
