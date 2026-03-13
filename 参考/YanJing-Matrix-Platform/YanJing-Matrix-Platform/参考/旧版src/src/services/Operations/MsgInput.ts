/**
 * 输入框相关的通用计算/解析方法
 * 将多个输入组件（NewRightContent/RightContent/ChatForUserBot）的公共逻辑聚合于此。
 * 仅包含“纯计算/归一化”函数，不直接做发送或 UI 相关工作。
 */

export interface MentionPayload {
	plainText: string
	htmlText: string
	hasMentions: boolean
}

/**
 * 将用户输入中的 @ 提及占位（@[显示名](userId)）解析为
 * - 纯文本：@显示名
 * - HTML：  <a href="https://matrix.to/#/userId">@显示名</a>
 */
export function buildMentionPayload(message: string): MentionPayload {
	const mentionRegex = /@\[(.*?)\]\((.*?)\)/g
	let plainText = message
	let htmlText = message

	let match: RegExpExecArray | null
	while ((match = mentionRegex.exec(message)) !== null) {
		const [fullMatch, displayName, userId] = match
		const plainReplacement = `@${displayName}`
		const htmlReplacement = `<a href="https://matrix.to/#/${userId}">@${displayName}</a>`
		plainText = plainText.replace(fullMatch, plainReplacement)
		htmlText = htmlText.replace(fullMatch, htmlReplacement)
	}

	return {
		plainText,
		htmlText,
		hasMentions: mentionRegex.test(message),
	}
}

/**
 * 规范化单个文件：
 * - 粘贴图片通常没有名字：补一个 `pasted-<ts>.png`
 * - 若无 MIME，按图片/二进制兜底
 */
export function normalizeFile(file: File, now: number = Date.now()): File {
	const isImage = (file.type || '').startsWith('image/')
	const name = (file as any).name || (isImage ? `pasted-${now}.png` : `pasted-${now}`)
	const type = file.type || (isImage ? 'image/png' : 'application/octet-stream')
	// 如果已有文件名与类型，无需重新包装
	if ((file as any).name === name && file.type === type) return file
	return new File([file], name, { type })
}

/**
 * 从剪贴板事件中提取文件，并进行规范化命名/类型处理
 */
export function collectClipboardFiles(e: ClipboardEvent): File[] {
	const items = e.clipboardData?.items
	if (!items || items.length === 0) return []
	const files: File[] = []
	const now = Date.now()
	for (const it of Array.from(items)) {
		if (it.kind === 'file') {
			const f = it.getAsFile()
			if (f) files.push(normalizeFile(f, now))
		}
	}
	return files
}

/**
 * 从拖拽事件中提取文件，并进行规范化命名/类型处理（主要用于粘贴兜底；拖拽通常已有名称）
 */
export function collectDragFiles(e: DragEvent): File[] {
	const list = e.dataTransfer?.files
	if (!list || list.length === 0) return []
	const files: File[] = []
	const now = Date.now()
	for (const f of Array.from(list)) {
		files.push(normalizeFile(f, now))
	}
	return files
}

