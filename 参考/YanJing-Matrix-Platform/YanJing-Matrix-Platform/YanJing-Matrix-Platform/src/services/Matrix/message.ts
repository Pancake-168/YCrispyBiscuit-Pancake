import type { MatrixEvent, MatrixClient, Room, EventStatus } from 'matrix-js-sdk'
import type { RoomMessageEventContent } from 'matrix-js-sdk/lib/@types/events'
import { EventType } from 'matrix-js-sdk'
import { matrixClient } from '@/services/Matrix/client'
import { useSystemStore } from '@/stores/System'
import type { MatrixMessageItem, MatrixMessageType } from '@/types/message'
import { formatTime } from '@/utils/Time'

type UploadResult = {
	mxcUrl: string
	contentType: string
	fileName: string
	size: number
}

type MatrixEventContent = Record<string, unknown> & {
	msgtype?: string
	body?: string
	format?: string
	formatted_body?: string
	'm.new_content'?: {
		msgtype?: string
		body?: string
		format?: string
		formatted_body?: string
	}
	url?: string
	file?: { url?: string }
	info?: { size?: number; mimetype?: string }
}

type SendEventResponse = { event_id?: string }

type SendTextOptions = {
	replyToEventId?: string
}

type SendCompositeOptions = {
	textFirst?: boolean
	replyToEventId?: string
	mentions?: Array<{ userId: string; displayName?: string }>
}

class MatrixMessageService {
	/**
	 * 发送 m.room.message 事件。
	 * 输入：MatrixClient、roomId、content。
	 * 输出：Promise<SendEventResponse>。
	 * 逻辑：调用 SDK sendEvent 发送消息。
	 */
	private async sendRoomMessage(client: MatrixClient, roomId: string, content: Record<string, unknown>): Promise<SendEventResponse> {
		return client.sendEvent(roomId, EventType.RoomMessage, content as unknown as RoomMessageEventContent)
	}
	/**
	 * 解析 media HTTP URL 还原 mxc URL。
	 * 输入：url（http/https）。
	 * 输出：mxc:// 或 undefined。
	 * 逻辑：匹配 Matrix 媒体下载路径并提取 server/mediaId。
	 */
	private extractMxcFromMediaUrl(url: string): string | undefined {
		try {
			const u = new URL(url)
			const path = u.pathname
			const patterns = [
				/_matrix\/media\/v3\/(download|thumbnail)\/([^/]+)\/(.+)/,
				/_matrix\/client\/v1\/media\/(download|thumbnail)\/([^/]+)\/(.+)/,
				/_matrix\/media\/r0\/(download|thumbnail)\/([^/]+)\/(.+)/,
				/_matrix\/client\/r0\/media\/(download|thumbnail)\/([^/]+)\/(.+)/
			]
			for (const pattern of patterns) {
				const match = path.match(pattern)
				if (match && match[2] && match[3]) {
					return `mxc://${match[2]}/${match[3]}`
				}
			}
		} catch {
			return undefined
		}
		return undefined
	}
	/**
	 * 获取房间消息并写入 store。
	 * 输入：roomId。
	 * 输出：MatrixMessageItem[]。
	 * 逻辑：读取 room timeline，转换为可渲染消息。
	 */
	getRoomMessages(roomId: string): MatrixMessageItem[] {
		const client = matrixClient.getAuthedClient()
		const store = useSystemStore()
		if (!client) {
			console.warn('[System:MatrixMessage:getRoomMessages] 尚未登录或客户端未初始化')
			store.setRoomMessages(roomId, [])
			return []
		}

		const room = client.getRoom(roomId)
		if (!room) {
			console.warn('[System:MatrixMessage:getRoomMessages] 房间不存在:', roomId)
			store.setRoomMessages(roomId, [])
			return []
		}

		const items = this.buildRoomMessages(room, client)
		store.setRoomMessages(roomId, items)
		return items
	}

	/**
	 * 发送纯文本消息（带 HTML 兼容字段）。
	 * 输入：roomId、text、extraContent、options。
	 * 输出：Promise<void>。
	 * 逻辑：构造 m.text 内容并调用 sendRoomMessage。
	 */
	async sendText(
		roomId: string,
		text: string,
		extraContent?: Record<string, unknown>,
		options?: SendTextOptions
	): Promise<void> {
		const client = matrixClient.getAuthedClient()
		if (!client) {
			console.warn('[System:MatrixMessage:sendText] 尚未登录或客户端未初始化')
			return
		}

		if (!this.checkCanSend(client, roomId)) {
			console.warn('[System:MatrixMessage:sendText] 当前不在房间内，无法发送消息')
			return
		}

		let content: Record<string, unknown> = {
			msgtype: 'm.text',
			body: text,
			format: 'org.matrix.custom.html',
			formatted_body: this.buildRichHtml(text)
		}

		if (options?.replyToEventId) {
			this.addReplyRelationToContent(content, options.replyToEventId)
		}

		if (extraContent) {
			content = { ...content, ...extraContent }
		}

		await this.sendRoomMessage(client, roomId, content)
	}

	/**
	 * 编辑文本消息（m.replace）。
	 * 输入：roomId、text、eventId。
	 * 输出：Promise<void>。
	 * 逻辑：发送 m.room.message，并携带 m.new_content 与 m.relates_to。
	 */
	async editText(roomId: string, text: string, eventId: string): Promise<void> {
		const client = matrixClient.getAuthedClient()
		if (!client) {
			console.warn('[System:MatrixMessage:editText] 尚未登录或客户端未初始化')
			return
		}

		if (!this.checkCanSend(client, roomId)) {
			console.warn('[System:MatrixMessage:editText] 当前不在房间内，无法编辑消息')
			return
		}

		const newContent = {
			msgtype: 'm.text',
			body: text,
			format: 'org.matrix.custom.html',
			formatted_body: this.buildRichHtml(text),
		}

		const content: Record<string, unknown> = {
			...newContent,
			'm.new_content': newContent,
			'm.relates_to': {
				rel_type: 'm.replace',
				event_id: eventId,
			}
		}

		await this.sendRoomMessage(client, roomId, content)
	}


	/**
	 * 发送含 @ 提及的文本消息。
	 * 输入：roomId、text、mentions、extraContent、options。
	 * 输出：Promise<void>。
	 * 逻辑：设置 m.mentions 与 formatted_body。
	 */
	async sendTextWithMentions(
		roomId: string,
		text: string,
		mentions: Array<{ userId: string; displayName?: string }>,
		extraContent?: Record<string, unknown>,
		options?: SendTextOptions
	): Promise<void> {
		const client = matrixClient.getAuthedClient()
		if (!client) {
			console.warn('[System:MatrixMessage:sendTextWithMentions] 尚未登录或客户端未初始化')
			return
		}

		if (!this.checkCanSend(client, roomId)) {
			console.warn('[System:MatrixMessage:sendTextWithMentions] 当前不在房间内，无法发送消息')
			return
		}

		const mentionedIds = mentions.map((m) => m.userId).filter(Boolean)
		const formattedBody = this.buildMentionHtml(text, mentions)

		let content: Record<string, unknown> = {
			msgtype: 'm.text',
			body: text,
			format: 'org.matrix.custom.html',
			formatted_body: formattedBody,
			'm.mentions': { user_ids: mentionedIds }
		}

		if (options?.replyToEventId) {
			this.addReplyRelationToContent(content, options.replyToEventId)
		}

		if (extraContent) {
			content = { ...content, ...extraContent }
		}

		await this.sendRoomMessage(client, roomId, content)
	}

	/**
	 * 上传单个文件并返回上传信息。
	 * 输入：File。
	 * 输出：Promise<UploadResult | null>。
	 * 逻辑：调用 SDK uploadContent。
	 */
	async uploadFile(file: File): Promise<UploadResult | null> {
		const client = matrixClient.getAuthedClient()
		if (!client) {
			console.warn('[System:MatrixMessage:uploadFile] 尚未登录或客户端未初始化')
			return null
		}

		const result = await client.uploadContent(file, {
			type: file.type,
			name: file.name
		})

		return {
			mxcUrl: result.content_uri,
			contentType: file.type || 'application/octet-stream',
			fileName: file.name,
			size: file.size
		}
	}

	/**
	 * 批量上传文件（顺序上传）。
	 * 输入：File[]。
	 * 输出：Promise<UploadResult[]>。
	 * 逻辑：按顺序上传，确保结果与文件顺序一致。
	 */
	async uploadFiles(files: File[]): Promise<UploadResult[]> {
		const results: UploadResult[] = []
		for (const file of files) {
			const uploaded = await this.uploadFile(file)
			if (uploaded) results.push(uploaded)
		}
		return results
	}

	/**
	 * 发送文件消息（图片/音频/视频/普通文件）。
	 * 输入：roomId、file、extraContent、options。
	 * 输出：Promise<void>。
	 * 逻辑：先上传，再按 msgtype 发送 m.room.message。
	 */
	async sendFile(
		roomId: string,
		file: File,
		extraContent?: Record<string, unknown>,
		options?: SendTextOptions
	): Promise<void> {
		const upload = await this.uploadFile(file)
		if (!upload) return

		const msgtype = this.getMsgType(file.type)
		let content: Record<string, unknown> = {
			msgtype,
			body: upload.fileName,
			url: upload.mxcUrl,
			info: {
				mimetype: upload.contentType,
				size: upload.size
			}
		}

		if (extraContent) {
			content = { ...content, ...extraContent }
		}

		if (options?.replyToEventId) {
			this.addReplyRelationToContent(content, options.replyToEventId)
		}

		const client = matrixClient.getAuthedClient()
		if (!client) return
		if (!this.checkCanSend(client, roomId)) {
			console.warn('[System:MatrixMessage:sendFile] 当前不在房间内，无法发送消息')
			return
		}
		await this.sendRoomMessage(client, roomId, content)
	}

	/**
	 * 批量发送文件（顺序发送）。
	 * 输入：roomId、files。
	 * 输出：Promise<void>。
	 * 逻辑：依次调用 sendFile；Matrix 不支持原子批量。
	 */
	async sendFiles(roomId: string, files: File[]): Promise<void> {
		for (const file of files) {
			await this.sendFile(roomId, file)
		}
	}


	/**
	 * 发送复合消息（多文件 + 可选文本）。
	 * 输入：roomId、text、files、options。
	 * 输出：Promise<{bundleId,eventIds}>。
	 * 逻辑：预上传、生成 bundle 元数据并顺序发送。
	 */
	async sendCompositeMessage(
		roomId: string,
		text: string | null,
		files: File[],
		options?: SendCompositeOptions
	): Promise<{ bundleId: string; eventIds: string[] }> {
		const client = matrixClient.getAuthedClient()
		if (!client) {
			console.warn('[System:MatrixMessage:sendCompositeMessage] 尚未登录或客户端未初始化')
			return { bundleId: '', eventIds: [] }
		}

		if (!this.checkCanSend(client, roomId)) {
			console.warn('[System:MatrixMessage:sendCompositeMessage] 当前不在房间内，无法发送消息')
			return { bundleId: '', eventIds: [] }
		}

		const bundleId = `com.yanjing.bundle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
		const eventIds: string[] = []
		const textFirst = options?.textFirst ?? false
		const totalCount = files.length + (text ? 1 : 0)
		const baseExtra = {
			'com.yanjing.bundle_id': bundleId,
			'com.yanjing.bundle_total': totalCount
		}

		// 预上传文件，避免发送阶段阻塞
		const uploads = await this.uploadFiles(files)
		const fileContents = uploads.map((upload, idx) => ({
			msgtype: this.getMsgType(upload.contentType),
			body: upload.fileName,
			url: upload.mxcUrl,
			info: {
				mimetype: upload.contentType,
				size: upload.size
			},
			...baseExtra,
			'com.yanjing.bundle_index': textFirst ? idx + 2 : idx + 1
		}))

		const textIndex = textFirst ? 1 : fileContents.length + 1
		const textContent = text
			? {
				msgtype: 'm.text',
				body: text,
				format: 'org.matrix.custom.html',
				formatted_body: options?.mentions?.length
					? this.buildMentionHtml(text, options.mentions)
					: this.buildRichHtml(text),
				...(options?.mentions?.length ? { 'm.mentions': { user_ids: options.mentions.map((m) => m.userId) } } : {}),
				...baseExtra,
				'com.yanjing.bundle_index': textIndex
			}
			: null

		// 发送顺序：文本可前可后，其余文件按原顺序发送
		if (textFirst && textContent) {
			if (options?.replyToEventId) {
				this.addReplyRelationToContent(textContent, options.replyToEventId)
			}
			const res = await this.sendRoomMessage(client, roomId, textContent)
			if (res?.event_id) eventIds.push(res.event_id)
		}

		for (const content of fileContents) {
			if (options?.replyToEventId) {
				this.addReplyRelationToContent(content, options.replyToEventId)
			}
			const res = await this.sendRoomMessage(client, roomId, content)
			if (res?.event_id) eventIds.push(res.event_id)
		}

		if (!textFirst && textContent) {
			if (options?.replyToEventId) {
				this.addReplyRelationToContent(textContent, options.replyToEventId)
			}
			const res = await this.sendRoomMessage(client, roomId, textContent)
			if (res?.event_id) eventIds.push(res.event_id)
		}

		return { bundleId, eventIds }
	}


	/**
	 * 将 mxc:// 转为可访问 URL。
	 * 输入：mxcUrl。
	 * 输出：http(s) URL 或 null。
	 * 逻辑：使用 SDK 的 mxcUrlToHttp。
	 */
	getDownloadUrl(mxcUrl: string): string | null {
		const client = matrixClient.getAuthedClient()
		if (!client) {
			console.warn('[System:MatrixMessage:getDownloadUrl] 尚未登录或客户端未初始化')
			return null
		}
		return client.mxcUrlToHttp(mxcUrl, undefined, undefined, undefined, false, true, true) ?? null
	}

	/**
	 * 构建房间消息列表。
	 * 输入：room、client。
	 * 输出：MatrixMessageItem[]。
	 * 逻辑：遍历 timeline 事件并转换后排序。
	 */
	private buildRoomMessages(room: Room, client: MatrixClient): MatrixMessageItem[] {
		const events = room.getLiveTimeline().getEvents()
		const items: MatrixMessageItem[] = []

		for (const event of events) {
			const systemItem = this.buildSystemMessageItem(event, room)
			if (systemItem) {
				items.push(systemItem)
				continue
			}
			const item = this.buildMessageItem(event, room, client)
			if (item) items.push(item)
		}

		return items.sort((a, b) => a.timestamp - b.timestamp)
	}

	/**
	 * 构建系统消息（创建/成员变更/主题变更/名称变更）。
	 * 输入：event、room。
	 * 输出：MatrixMessageItem | null。
	 */
	private buildSystemMessageItem(event: MatrixEvent, room: Room): MatrixMessageItem | null {
		if (event.isRedacted?.()) return null

		const eventType = event.getType?.() ?? ''
		const eventId = event.getId?.()
		if (!eventId) return null

		const senderId = event.getSender?.() ?? ''
		const senderName = this.getMemberDisplayName(room, senderId)
		const timestamp = event.getTs?.() ?? Date.now()
		const timeText = formatTime(timestamp)

		/*
		if (eventType === 'm.room.create') {
			return {
				id: eventId,
				roomId: room.roomId,
				senderId,
				senderName,
				timestamp,
				timeText,
				content: `${senderName || '某人'} 创建了房间`,
				type: 'm.system',
				status: null,
			}
		}
*/
		if (eventType === 'm.room.member') {
			const content = event.getContent?.() as { membership?: string } | undefined
			const membership = content?.membership ?? ''
			const unsigned = (event as unknown as { getUnsigned?: () => { prev_content?: { membership?: string } } | undefined }).getUnsigned?.()
			const prevMembership =
				unsigned?.prev_content?.membership
				|| (content as { prev_content?: { membership?: string } } | undefined)?.prev_content?.membership
			const targetId = event.getStateKey?.() || ''
			const targetName = this.getMemberDisplayName(room, targetId)

			
			if (membership === 'join' && prevMembership !== 'join') {
				return {
					id: eventId,
					roomId: room.roomId,
					senderId,
					senderName,
					timestamp,
					timeText,
					content: `${targetName || '某人'} 加入了对话`,
					type: 'm.system',
					status: null,
				}
			}
			


			if (membership === 'leave') {
				const text = targetId && senderId && targetId !== senderId
					? `${senderName || '某人'} 将 ${targetName || targetId} 移出了对话`
					: `${targetName || '某人'} 离开了对话`
				return {
					id: eventId,
					roomId: room.roomId,
					senderId,
					senderName,
					timestamp,
					timeText,
					content: text,
					type: 'm.system',
					status: null,
				}
			}

			/*
			if (membership === 'invite') {
				return {
					id: eventId,
					roomId: room.roomId,
					senderId,
					senderName,
					timestamp,
					timeText,
					content: `${senderName || '某人'} 邀请了 ${targetName || targetId}`,
					type: 'm.system',
					status: null,
				}
			}
			*/

			if (membership === 'ban') {
				return {
					id: eventId,
					roomId: room.roomId,
					senderId,
					senderName,
					timestamp,
					timeText,
					content: `${senderName || '某人'} 将 ${targetName || targetId} 拉黑`,
					type: 'm.system',
					status: null,
				}
			}
		}

		if (eventType === 'm.room.name') {
			const content = event.getContent?.() as { name?: string } | undefined
			const roomName = (content?.name || '').trim()
			if (!roomName) return null
			return {
				id: eventId,
				roomId: room.roomId,
				senderId,
				senderName,
				timestamp,
				timeText,
				content: `名称：${roomName}`,
				type: 'm.system',
				status: null,
			}
		}

		if (eventType === 'm.room.topic') {
			const content = event.getContent?.() as { topic?: string } | undefined
			const topic = (content?.topic || '').trim()
			if (!topic) return null
			return {
				id: eventId,
				roomId: room.roomId,
				senderId,
				senderName,
				timestamp,
				timeText,
				content: `主题：${topic}`,
				type: 'm.system',
				status: null,
			}
		}

		return null
	}

	private getMemberDisplayName(room: Room, userId?: string): string {
		if (!userId) return ''
		return room.getMember?.(userId)?.name || userId
	}

	/**
	 * 构建单条可渲染消息。
	 * 输入：event、room、client。
	 * 输出：MatrixMessageItem | null。
	 * 逻辑：只处理 m.room.message，并解析附件 URL 与格式字段。
	 */
	private buildMessageItem(event: MatrixEvent, room: Room, client: MatrixClient): MatrixMessageItem | null {
		const eventType = event.getType?.()
		if (eventType !== 'm.room.message') return null
		if (event.isRedacted?.()) return null

		const content = event.getContent?.() as MatrixEventContent
		const relation = (content as { 'm.relates_to'?: { rel_type?: string } })?.['m.relates_to']
		if (content['m.new_content'] || relation?.rel_type === 'm.replace') return null
		const effectiveContent = (content['m.new_content'] && typeof content['m.new_content'] === 'object')
			? (content['m.new_content'] as MatrixEventContent)
			: content
		const msgtype = typeof effectiveContent.msgtype === 'string' ? effectiveContent.msgtype : 'm.text'
		const body = typeof effectiveContent.body === 'string' ? effectiveContent.body : ''
		const formattedBody = typeof effectiveContent.formatted_body === 'string' ? effectiveContent.formatted_body : undefined
		const format = typeof effectiveContent.format === 'string' ? effectiveContent.format : undefined
		const replyToEventId = (content as { 'm.relates_to'?: { 'm.in_reply_to'?: { event_id?: string } } })
			?.['m.relates_to']?.['m.in_reply_to']?.event_id
		const forwardBundle = (content as { 'com.yanjing.forward_bundle'?: unknown })['com.yanjing.forward_bundle']
		const forwardBundleValue = forwardBundle && typeof forwardBundle === 'object'
			? (forwardBundle as {
				sourceRoomId?: string
				sourceEventIds?: string[]
				items?: Array<{
					type?: string
					senderName?: string
					senderId?: string
					content?: string
					fileName?: string
					url?: string
					replyToEventId?: string
					forwardBundle?: unknown
				}>
			})
			: undefined
		const rawUrl = typeof content.url === 'string'
			? content.url
			: content.file?.url

		const senderId = event.getSender?.() ?? ''
		const senderName = senderId ? room.getMember?.(senderId)?.name : undefined
		const timestamp = event.getTs?.() ?? Date.now()
		const timeText = formatTime(timestamp)
		const status: EventStatus | 'sent' | null = (event as unknown as { getStatus?: () => EventStatus | null }).getStatus?.() ?? 'sent'

		const type = this.mapMsgType(msgtype)
		const fileName = typeof content.body === 'string' ? content.body : undefined
		const size = typeof content.info?.size === 'number' ? content.info.size : undefined
		const mimetype = typeof content.info?.mimetype === 'string' ? content.info.mimetype : undefined

		let httpUrl: string | undefined
		let rawMxcUrl: string | undefined
		if (rawUrl) {
			if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
				httpUrl = rawUrl
			} else if (rawUrl.startsWith('mxc://')) {
				rawMxcUrl = rawUrl
				try {
					httpUrl = client.mxcUrlToHttp(rawUrl, undefined, undefined, undefined, false, true, true) ?? undefined
				} catch {
					httpUrl = undefined
				}
			} else {
				httpUrl = rawUrl
			}
		}

		if (!rawMxcUrl && httpUrl) {
			rawMxcUrl = this.extractMxcFromMediaUrl(httpUrl)
			if (rawMxcUrl) {
				try {
					httpUrl = client.mxcUrlToHttp(rawMxcUrl, undefined, undefined, undefined, false, true, true) ?? httpUrl
				} catch {
					// keep original httpUrl
				}
			}
		}

		const mapForwardBundle = (value?: {
			sourceRoomId?: string
			sourceEventIds?: string[]
			items?: Array<{
				type?: string
				senderName?: string
				senderId?: string
				content?: string
				fileName?: string
				url?: string
				replyToEventId?: string
				forwardBundle?: unknown
			}>
		}): MatrixMessageItem['forwardBundle'] | undefined => {
			if (!value) return undefined
			return {
				sourceRoomId: value.sourceRoomId || '',
				sourceEventIds: value.sourceEventIds || [],
				items: (value.items || []).map((item) => {
					const nestedForwardBundle = item.forwardBundle && typeof item.forwardBundle === 'object'
						? (item.forwardBundle as {
							sourceRoomId?: string
							sourceEventIds?: string[]
							items?: Array<{
								type?: string
								senderName?: string
								senderId?: string
								content?: string
								fileName?: string
								url?: string
								replyToEventId?: string
								forwardBundle?: unknown
							}>
						})
						: undefined

					return {
						type: this.mapMsgType(item.type || 'm.text'),
						senderName: item.senderName,
						senderId: item.senderId,
						content: item.content || '',
						fileName: item.fileName,
						url: item.url,
						replyToEventId: item.replyToEventId,
						forwardBundle: mapForwardBundle(nestedForwardBundle),
					}
				})
			}
		}

		return {
			id: event.getId?.() || `${room.roomId}_${timestamp}`,
			roomId: room.roomId,
			senderId,
			senderName,
			timestamp,
			timeText,
			content: body,
			formattedBody,
			format,
			type,
			status,
			replyToEventId,
			forwardBundle: mapForwardBundle(forwardBundleValue),
			url: httpUrl,
			rawMxcUrl: rawMxcUrl,
			fileName: fileName,
			fileSize: size ? String(size) : undefined,
			mimetype,
		}
	}

	/**
	 * 根据 MIME 推断 Matrix msgtype。
	 * 输入：mime。
	 * 输出：msgtype 字符串。
	 * 逻辑：image/audio/video 各自映射，否则 m.file。
	 */
	private getMsgType(mime: string): string {
		if (mime.startsWith('image/')) return 'm.image'
		if (mime.startsWith('audio/')) return 'm.audio'
		if (mime.startsWith('video/')) return 'm.video'
		return 'm.file'
	}


	/**
	 * 将 Matrix msgtype 映射为内部类型。
	 * 输入：msgtype。
	 * 输出：MatrixMessageType。
	 * 逻辑：未知类型回退为 m.text。
	 */
	private mapMsgType(msgtype: string): MatrixMessageType {
		if (msgtype === 'm.image') return 'm.image'
		if (msgtype === 'm.audio') return 'm.audio'
		if (msgtype === 'm.video') return 'm.video'
		if (msgtype === 'm.file') return 'm.file'
		return 'm.text'
	}

	/**
	 * 转义文本为安全 HTML。
	 * 输入：text。
	 * 输出：转义后的字符串。
	 */
	private escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
	}


	/**
	 * 将纯文本转换为安全 HTML。
	 * 输入：text。
	 * 输出：HTML 字符串。
	 * 逻辑：转义后把换行替换为 <br />。
	 */
	private buildRichHtml(text: string): string {
		return this.escapeHtml(text).replace(/\n/g, '<br />')
	}


	/**
	 * 给消息内容添加回复关系。
	 * 输入：content、replyToEventId。
	 * 输出：void（就地修改 content）。
	 */
	private addReplyRelationToContent(content: Record<string, unknown>, replyToEventId: string): void {
		content['m.relates_to'] = {
			'm.in_reply_to': {
				event_id: replyToEventId
			}
		}
	}


	/**
	 * 检查用户是否在房间内可发言。
	 * 输入：client、roomId。
	 * 输出：boolean。
	 * 逻辑：要求 membership === 'join'。
	 */
	private checkCanSend(client: MatrixClient, roomId: string): boolean {
		const room = client.getRoom(roomId)
		if (!room) return false
		const membership = room.getMyMembership?.()
		return membership === 'join'
	}

	/**
	 * 构建提及 HTML（@ 显示名转 matrix.to 链接）。
	 * 输入：text、mentions。
	 * 输出：HTML 字符串。
	 * 逻辑：把 @displayName/@userId 替换为链接并保留换行。
	 */
	private buildMentionHtml(text: string, mentions: Array<{ userId: string; displayName?: string }>): string {
		let html = this.escapeHtml(text)
		for (const m of mentions) {
			const label = m.displayName || m.userId
			const safeLabel = this.escapeHtml(`@${label}`)
			const link = `<a href="https://matrix.to/#/${m.userId}">${safeLabel}</a>`
			// 简单替换：把 @displayName 或 @userId 替换成链接
			html = html.replace(new RegExp(`@${this.escapeRegExp(label)}`, 'g'), link)
			html = html.replace(new RegExp(`@${this.escapeRegExp(m.userId)}`, 'g'), link)
		}
		return html.replace(/\n/g, '<br />')
	}

	/**
	 * 转义正则特殊字符。
	 * 输入：text。
	 * 输出：安全的正则字符串。
	 */
	private escapeRegExp(text: string): string {
		return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}
}

export const matrixMessageService = new MatrixMessageService()
