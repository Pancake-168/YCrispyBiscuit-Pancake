import type { MatrixClient, MatrixEvent, Room } from 'matrix-js-sdk/src/matrix'
import { matrixClientV2 } from '@/services/matrix/client'
import { matrixEventManager } from '@/services/matrix/eventManager'
import { MatrixEventType } from '@/types'
import { memberManagementServiceV2 } from '@/services/members/member.service'

export const SELF_DELETE_WINDOW_MS = 2 * 60 * 1000 // 2 minutes

export type DeleteMode = 'admin' | 'self'

/**
 * Helpers here are intentionally framework-agnostic:
 * - `checkDeleteEligibility` 用于渲染操作条时的按钮显隐/可用态。
 * - `deleteMessage` 在实际点击“撤回”后调用，内部做最终校验并向 homeserver 发送 redaction。
 * UI 组件只需要提供 roomId / eventId，并根据返回的 mode 决定提示文案。
 */

export interface DeleteEligibilityResult {
	canDelete: boolean
	mode?: DeleteMode
	reason?: string
	event?: MatrixEvent | null
}

export interface DeleteMessageOptions {
	reason?: string
}

async function ensureRoomAndEvent(
	client: MatrixClient,
	roomId: string,
	eventId: string,
): Promise<{ room: Room; event: MatrixEvent } | null> {
	const room = client.getRoom(roomId)
	if (!room) return null
	const event = await resolveEvent(client, room, eventId)
	if (!event) return null
	return { room, event }
}

async function resolveEvent(client: MatrixClient, room: Room, eventId: string): Promise<MatrixEvent | null> {
	const cached = room.findEventById(eventId)
	if (cached) return cached
	try {
		await client.getEventTimeline(room.getUnfilteredTimelineSet(), eventId)
	} catch (err) {
		console.warn('[MsgDelete] 无法加载事件时间线', err)
		return null
	}
	return room.findEventById(eventId) ?? null
}

export async function checkDeleteEligibility(
	roomId: string,
	eventId: string,
): Promise<DeleteEligibilityResult> {
	const client = matrixClientV2.getAuthedClient()
	if (!client) {
		return { canDelete: false, reason: '未登录，无法撤回消息' }
	}
	const currentUserId = client.getUserId()
	if (!currentUserId) {
		return { canDelete: false, reason: '未知的当前用户' }
	}
	const ctx = await ensureRoomAndEvent(client, roomId, eventId)
	if (!ctx) {
		return { canDelete: false, reason: '找不到房间或消息', event: null }
	}
	const { event } = ctx
	const eventSender = event.getSender()
	const ts = event.getTs?.() ?? 0
	const permissions = memberManagementServiceV2.获取成员权限(roomId, currentUserId)
	const isAdmin = permissions.isAdmin || permissions.isOwner
	if (isAdmin) {
		return { canDelete: true, mode: 'admin', event }
	}
	const isOwnMessage = eventSender === currentUserId
	if (!isOwnMessage) {
		return { canDelete: false, reason: '只能撤回自己发送的消息', event }
	}
	if (!ts) {
		return { canDelete: false, reason: '消息时间未知，无法校验撤回窗口', event }
	}
	const age = Date.now() - ts
	if (age > SELF_DELETE_WINDOW_MS) {
		return { canDelete: false, reason: '超过可撤回时间（2分钟）', event }
	}
	return { canDelete: true, mode: 'self', event }
}

export async function deleteMessage(
	roomId: string,
	eventId: string,
	options?: DeleteMessageOptions,
): Promise<DeleteMode> {
	const client = matrixClientV2.getAuthedClient()
	if (!client) {
		throw new Error('未登录，无法撤回消息')
	}
	const eligibility = await checkDeleteEligibility(roomId, eventId)
	if (!eligibility.canDelete) {
		throw new Error(eligibility.reason || '没有权限撤回该消息')
	}
	const reason = options?.reason ?? (eligibility.mode === 'admin' ? '管理员撤回' : '用户撤回')
	await client.redactEvent(roomId, eventId, undefined, { reason })
		// 本地立即广播删除事件，提升交互反馈（服务端回流也会广播一次，重复删除被过滤）
		try {
			matrixEventManager.emit(MatrixEventType.MESSAGE_DELETED, {
				roomId,
				eventId,
				timestamp: Date.now(),
			})
		} catch (e) {
			// 忽略本地广播失败
		}
	return eligibility.mode ?? 'self'
}

export function canSelfDeleteWithinWindow(event: MatrixEvent, now: number = Date.now()): boolean {
	const ts = event.getTs?.() ?? 0
	if (!ts) return false
	return now - ts <= SELF_DELETE_WINDOW_MS
}
