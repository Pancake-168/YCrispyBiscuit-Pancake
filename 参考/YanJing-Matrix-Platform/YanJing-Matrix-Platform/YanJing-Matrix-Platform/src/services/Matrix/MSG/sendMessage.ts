export type MentionPayload = {
	plainText: string
	htmlText: string
	hasMentions: boolean
	mentions: Array<{ userId: string; displayName: string }>
}

/** 
 * 解析输入文本中的 @ 提及占位。
 * 输入：message（字符串）。
 * 输出：MentionPayload（plainText/htmlText/mentions）。
 * 逻辑：用正则解析 @[]()，同时生成纯文本与 HTML 链接版本。
 */
export function buildMentionPayload(message: string): MentionPayload {
	const mentionRegex = /@\[(.*?)\]\((.*?)\)/g
	const hasMentions = /@\[(.*?)\]\((.*?)\)/.test(message)

	let plainText = message
	let htmlText = message
	const mentions: Array<{ userId: string; displayName: string }> = []

	let match: RegExpExecArray | null
	while ((match = mentionRegex.exec(message)) !== null) {
		const fullMatch = match[0] ?? ''
		const displayName = match[1] ?? ''
		const userId = match[2] ?? ''
		if (!userId) continue
		const plainReplacement = `@${displayName}`
		const htmlReplacement = `<a href="https://matrix.to/#/${userId}">@${displayName}</a>`
		plainText = plainText.replace(fullMatch, plainReplacement)
		htmlText = htmlText.replace(fullMatch, htmlReplacement)

		if (!mentions.some((m) => m.userId === userId)) {
			mentions.push({ userId, displayName })
		}
	}

	return {
		plainText,
		htmlText,
		hasMentions,
		mentions,
	}
}


/**
 * 规范化文件对象，确保名称与 MIME 存在。
 * 输入：File、now（可选时间戳）。
 * 输出：File。
 * 逻辑：补齐 name/type，必要时重新构造 File。
 */
export function normalizeFile(file: File, now: number = Date.now()): File {
	const type = file.type || 'application/octet-stream'
	const name = file.name || `file_${now}`
	if (file.type && file.name) return file
	try {
		return new File([file], name, { type })
	} catch {
		return file
	}
}


/**
 * 从剪贴板事件提取文件。
 * 输入：ClipboardEvent。
 * 输出：File[]。
 * 逻辑：过滤 kind=file 的项并规范化。
 */
export function collectClipboardFiles(event: ClipboardEvent): File[] {
	const items = event.clipboardData?.items
	if (!items || items.length === 0) return []
	const files: File[] = []
	const now = Date.now()
	for (const it of Array.from(items)) {
		if (it.kind === 'file') {
			const file = it.getAsFile()
			if (file) files.push(normalizeFile(file, now))
		}
	}
	return files
}


/**
 * 从拖拽事件提取文件。
 * 输入：DragEvent。
 * 输出：File[]。
 * 逻辑：读取 dataTransfer.files 并规范化。
 */
export function collectDragFiles(event: DragEvent): File[] {
	const list = event.dataTransfer?.files
	if (!list || list.length === 0) return []
	const files: File[] = []
	const now = Date.now()
	for (const f of Array.from(list)) {
		files.push(normalizeFile(f, now))
	}
	return files
}

/**
 * 获取文件类型的一级分类（用于展示）。
 * 输入：File。
 * 输出：类型字符串（大写）。
 * 逻辑：读取 MIME 主类型，空则返回 FILE。
 */
export function fileKind(file: File): string {
	const kind = file.type.split('/')[0]
	return (kind || 'file').toUpperCase()
}
