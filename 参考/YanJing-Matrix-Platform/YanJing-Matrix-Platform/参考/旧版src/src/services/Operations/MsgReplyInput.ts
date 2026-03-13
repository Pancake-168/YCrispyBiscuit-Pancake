import { reactive, readonly, computed } from 'vue'
import { matrixClientV2 } from '@/services/matrix/client'
import { buildReplyPreview, type ReplyPreviewModel } from './MsgReply'

export interface ReplyTargetPayload {
	roomId: string
	eventId: string
	/**
	 * 允许外部直接提供一个预先计算好的预览，以减少重复解析。
	 * 如果未提供，会在内部尝试调用 buildReplyPreview 解析。
	 */
	preview?: ReplyPreviewModel | null
}

interface ReplyInputStateInternal {
	roomId: string
	eventId: string
	isLoading: boolean
	error: string | null
	preview: ReplyPreviewModel | null
}

const state = reactive<ReplyInputStateInternal>({
	roomId: '',
	eventId: '',
	isLoading: false,
	error: null,
	preview: null,
})

const hasReply = computed(() => !!state.roomId && !!state.eventId)

async function setReplyTarget(payload: ReplyTargetPayload): Promise<void> {
	const { roomId, eventId, preview } = payload
	if (!roomId || !eventId) {
		clearReplyTarget()
		return
	}
	state.roomId = roomId
	state.eventId = eventId
	state.preview = preview ?? null
	state.error = null
	if (preview) return
	const client = matrixClientV2.getAuthedClient()
	if (!client) {
		state.error = '未登录，无法解析回复预览'
		return
	}
	state.isLoading = true
	try {
		state.preview = await buildReplyPreview(client, roomId, eventId)
	} catch (err) {
		state.error = err instanceof Error ? err.message : '解析回复预览失败'
	} finally {
		state.isLoading = false
	}
}

function clearReplyTarget() {
	state.roomId = ''
	state.eventId = ''
	state.preview = null
	state.error = null
	state.isLoading = false
}

function getReplyPayload(): ReplyTargetPayload | null {
	if (!hasReply.value) return null
	return {
		roomId: state.roomId,
		eventId: state.eventId,
		preview: state.preview as ReplyPreviewModel | null,
	}
}

export const replyInputManager = {
	state: readonly(state),
	hasReply,
	setReplyTarget,
	clearReplyTarget,
	getReplyPayload,
}

export type ReplyInputState = Readonly<typeof state>
