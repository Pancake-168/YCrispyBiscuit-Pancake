/**
 * 消息操作条 - 媒体下载（与现有组件逻辑对齐）
 *
 * 目标：
 * - 不修改现有 Vue 组件，集中下载实现到 TS 模块；
 * - 对齐 MessageFile/index.vue 与 MessageItem/index.vue 的做法：
 *   - mxc -> http（用已认证客户端转换）；
 *   - 带 Authorization 头的 fetch，尝试多种候选 URL；
 *   - 加密媒体用 wasm 解密后下载；未加密直接 blob 下载。
 */

import { Attachment, EncryptedAttachment } from '@matrix-org/matrix-sdk-crypto-wasm'
import { matrixClientV2 } from '@/services/matrix/client'

export interface MediaDownloadParams {
	url?: string // 未加密直链
	mxcUrl?: string // mxc://server/id
	encryptionInfo?: any // Matrix E2EE file 对象
	filename?: string
	mimetype?: string
}

/** 将 MXC URL 转换为 http(s) 下载地址（与项目其余处一致） */
function mxcToHttp(mxcUrl?: string): string | undefined {
	if (!mxcUrl) return undefined
	const client = matrixClientV2.getAuthedClient()
	if (!client) return undefined
	try {
		return client.mxcUrlToHttp(mxcUrl, null, null, null, true) || undefined
	} catch {
		return undefined
	}
}

/**
 * 生成候选 URL 列表（复用 MessageFile 内逻辑的等价实现）：
 * - 替换 server_name 为 baseUrl 主机；
 * - 对 download/thumbnail 增加 allow_redirect / allow_remote；
 * - 兼容 client 路径变体。
 */
function buildCandidates(url?: string): string[] {
	const list: string[] = []
	if (!url) return list
	list.push(url)
	try {
		const client = matrixClientV2.getAuthedClient()
		const baseHost = (() => { try { return new URL(client?.baseUrl || '').hostname } catch { return undefined } })()
		const addParams = (u: string, params: Record<string, string>): string => {
			try { const x = new URL(u); Object.entries(params).forEach(([k, v]) => x.searchParams.set(k, v)); return x.toString() } catch { return u }
		}
		const addPathVariant = (u: string): string | undefined => {
			try {
				const x = new URL(u)
				if (x.pathname.includes('/_matrix/media/v3/download/')) { x.pathname = x.pathname.replace('/_matrix/media/v3/download/', '/_matrix/client/v1/media/download/'); x.searchParams.set('allow_redirect', 'true'); return x.toString() }
				if (x.pathname.includes('/_matrix/media/v3/thumbnail/')) { x.pathname = x.pathname.replace('/_matrix/media/v3/thumbnail/', '/_matrix/client/v1/media/thumbnail/'); x.searchParams.set('allow_remote', 'true'); return x.toString() }
				return undefined
			} catch { return undefined }
		}
		if (url.includes('/_matrix/media/')) {
			if (baseHost) {
				try {
					const u = new URL(url)
					if (u.pathname.includes('/download/')) { u.pathname = u.pathname.replace(/(\/download\/)([^/]+)(\/)/, `$1${baseHost}$3`); list.push(u.toString()) }
					if (u.pathname.includes('/thumbnail/')) { u.pathname = u.pathname.replace(/(\/thumbnail\/)([^/]+)(\/)/, `$1${baseHost}$3`); list.push(u.toString()) }
				} catch {/* ignore */ }
			}
			if (url.includes('/download/')) list.push(addParams(url, { allow_redirect: 'true' }))
			if (url.includes('/thumbnail/')) list.push(addParams(url, { allow_remote: 'true' }))
			const pv = addPathVariant(url); if (pv) list.push(pv)
		}
	} catch {/* ignore */ }
	return Array.from(new Set(list))
}

/** 统一触发浏览器下载 */
function triggerDownload(blob: Blob, filename: string) {
	const url = window.URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.style.display = 'none'
	a.href = url
	a.download = filename || 'download'
	document.body.appendChild(a)
	a.click()
	window.URL.revokeObjectURL(url)
	document.body.removeChild(a)
}

/** 带 Authorization 的 fetch（如有 token）并跟随重定向 */
async function fetchWithAuth(u: string): Promise<Response> {
	const client = matrixClientV2.getAuthedClient()
	const token = client?.getAccessToken?.()
	return fetch(u, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, redirect: 'follow' })
}

/**
 * 下载媒体（供操作条调用）
 * - 有 encryptionInfo => 按加密媒体流程；
 * - 否则按未加密流程；
 * - url 优先，其次 mxc->http。
 */
export async function downloadMedia(params: MediaDownloadParams): Promise<void> {
	const { url, mxcUrl, encryptionInfo, filename, mimetype } = params

	if (encryptionInfo) {
		const httpUrl = mxcToHttp(mxcUrl)
		if (!httpUrl) throw new Error('无法解密：缺少有效的 mxcUrl 或未登录客户端')

		// 逐个候选地址尝试
		const candidates = buildCandidates(httpUrl)
		let encryptedData: ArrayBuffer | null = null
		let lastErr: any = null
		for (const u of candidates) {
			try {
				const resp = await fetchWithAuth(u)
				if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
				encryptedData = await resp.arrayBuffer()
				lastErr = null
				break
			} catch (e) {
				lastErr = e
			}
		}
		if (!encryptedData) throw lastErr || new Error('文件下载失败：资源不存在')

		const encryptedAttachment = new EncryptedAttachment(new Uint8Array(encryptedData), JSON.stringify(encryptionInfo))
		const decrypted = Attachment.decrypt(encryptedAttachment) as Uint8Array
		const arrayBuffer = decrypted.buffer as ArrayBuffer
		const finalType = (encryptionInfo as any)?.mimetype || mimetype || 'application/octet-stream'
		const blob = new Blob([arrayBuffer], { type: finalType })
		triggerDownload(blob, filename || 'decrypted-file')
		return
	}

	// 未加密：优先使用 url；否则使用 mxc->http
	const base = url || mxcToHttp(mxcUrl)
	if (!base) throw new Error('无法下载：缺少 url 或 mxcUrl')
	const candidates = buildCandidates(base)
	let blob: Blob | null = null
	let lastErr: any = null
	for (const u of candidates) {
		try {
			const resp = await fetchWithAuth(u)
			if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
			blob = await resp.blob()
			lastErr = null
			break
		} catch (e) {
			lastErr = e
		}
	}
	if (!blob) throw lastErr || new Error('下载失败：资源不存在')
	// 如指定 mimetype 且与实际不符，可覆盖
	const finalBlob = mimetype && blob.type !== mimetype ? new Blob([await blob.arrayBuffer()], { type: mimetype }) : blob
	triggerDownload(finalBlob, filename || 'download')
}

/** 便捷 API：直接从 messageInfo 下载 */
export async function downloadFromMessageInfo(messageInfo?: {
	url?: string
	mxcUrl?: string
	encryptionInfo?: any
	filename?: string
	mimetype?: string
}): Promise<void> {
	if (!messageInfo) throw new Error('缺少 messageInfo')
	return downloadMedia({
		url: messageInfo.url,
		mxcUrl: messageInfo.mxcUrl,
		encryptionInfo: messageInfo.encryptionInfo,
		filename: messageInfo.filename,
		mimetype: messageInfo.mimetype,
	})
}

export default { downloadMedia, downloadFromMessageInfo }

