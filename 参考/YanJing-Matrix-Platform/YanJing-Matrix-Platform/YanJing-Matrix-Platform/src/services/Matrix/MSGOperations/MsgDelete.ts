import { matrixClient } from '@/services/Matrix/client'
import { EventType, type MatrixEvent, type Room } from 'matrix-js-sdk'

type DeleteEligibilityResult = {
  allowed: boolean
  reason?: string
  isAdmin: boolean
}

const DELETE_TIME_LIMIT_MS = 2 * 60 * 1000

/**
 * 获取房间内指定事件。
 * 输入：room、eventId。
 * 输出：MatrixEvent | null。
 * 逻辑：优先 findEventById，其次查 live timeline。
 */
function findEventInRoom(room: Room, eventId: string): MatrixEvent | null {
  const byId = (room as unknown as { findEventById?: (id: string) => MatrixEvent | null })
    .findEventById?.(eventId)
  if (byId) return byId
  const liveEvents = room.getLiveTimeline?.()?.getEvents?.() || []
  return liveEvents.find((ev: MatrixEvent) => ev?.getId?.() === eventId) ?? null
}

/**
 * 判断用户是否为房主/管理员（具备 redaction 权限）。
 * 输入：room、userId。
 * 输出：boolean。
 * 逻辑：读取 power_levels，比较用户等级与 redact 等级阈值。
 */
function isRoomAdmin(room: Room, userId: string): boolean {
  const powerEvent = room.currentState?.getStateEvents?.(EventType.RoomPowerLevels, '')
  const content = (powerEvent?.getContent?.() || {}) as {
    users?: Record<string, number>
    users_default?: number
    redact?: number
  }

  const userLevel = content.users?.[userId] ?? content.users_default ?? 0
  const redactLevel = content.redact ?? 50
  return userLevel >= redactLevel
}

/**
 * 判断消息是否在可撤回时限内。
 * 输入：event（MatrixEvent | null）。
 * 输出：boolean。
 * 逻辑：对比消息时间戳与当前时间。
 */
export function isDeleteWithinTime(event: MatrixEvent | null): boolean {
  if (!event) return false
  const ts = event.getTs?.() ?? 0
  if (!ts) return false
  return Date.now() - ts <= DELETE_TIME_LIMIT_MS
}

/**
 * 获取事件发送者。
 * 输入：event（MatrixEvent | null）。
 * 输出：string。
 * 逻辑：读取 sender 字段，不存在则返回空字符串。
 */
export function getEventSenderId(event: MatrixEvent | null): string {
  return event?.getSender?.() || ''
}

/**
 * 删除资格校验。
 * 输入：roomId、eventId。
 * 输出：Promise<DeleteEligibilityResult>。
 * 逻辑：管理员不限时；普通用户仅能在 2 分钟内删除自己的消息。
 */
export async function checkDeleteEligibility(roomId: string, eventId: string): Promise<DeleteEligibilityResult> {
  const client = matrixClient.getAuthedClient()
  if (!client) return { allowed: false, reason: 'Matrix 客户端未初始化', isAdmin: false }

  const room = client.getRoom(roomId)
  if (!room) return { allowed: false, reason: '房间不存在', isAdmin: false }

  const userId = client.getUserId?.() || ''
  if (!userId) return { allowed: false, reason: '用户未登录', isAdmin: false }

  const admin = isRoomAdmin(room, userId)
  if (admin) return { allowed: true, isAdmin: true }

  const event = findEventInRoom(room, eventId)
  if (!event) return { allowed: false, reason: '未找到消息事件', isAdmin: false }

  const senderId = getEventSenderId(event)
  if (senderId !== userId) {
    return { allowed: false, reason: '仅可删除自己发送的消息', isAdmin: false }
  }

  const withinWindow = isDeleteWithinTime(event)
  if (!withinWindow) {
    return { allowed: false, reason: '仅允许 2 分钟内删除消息', isAdmin: false }
  }

  return { allowed: true, isAdmin: false }
}

/**
 * 删除（撤回）消息。
 * 输入：roomId、eventId、reason（可选）。
 * 输出：Promise<void>。
 * 逻辑：先校验权限与时间，再调用 Matrix redactEvent。
 */
export async function deleteMessage(roomId: string, eventId: string, reason?: string): Promise<void> {
  const client = matrixClient.getAuthedClient()
  if (!client) throw new Error('Matrix 客户端未初始化')

  const eligibility = await checkDeleteEligibility(roomId, eventId)
  if (!eligibility.allowed) {
    throw new Error(eligibility.reason || '无删除权限')
  }

  if (reason) {
    await client.redactEvent(roomId, eventId, undefined, { reason })
  } else {
    await client.redactEvent(roomId, eventId)
  }
}

/**
 * 判断是否显示“删除”按钮。
 * 输入：roomId、eventId。
 * 输出：boolean。
 * 逻辑：管理员始终显示；非管理员仅在本人且未过期显示。
 */
export function shouldShowDelete(roomId: string, eventId: string): boolean {
  const client = matrixClient.getAuthedClient()
  if (!client) return false

  const room = client.getRoom(roomId)
  if (!room) return false

  const userId = client.getUserId?.() || ''
  if (!userId) return false

  if (isRoomAdmin(room, userId)) return true

  const event = findEventInRoom(room, eventId)
  if (!event) return false
  if (getEventSenderId(event) !== userId) return false
  return isDeleteWithinTime(event)
}