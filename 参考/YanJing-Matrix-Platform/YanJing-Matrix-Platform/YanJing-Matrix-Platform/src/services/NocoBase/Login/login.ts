import { APIClient } from '@nocobase/sdk'
import { nocoBaseService } from '@/services/NocoBase/client'

function normalizeUrl(url: string): string {
	const trimmed = url.trim()
	if (!trimmed) return ''
	if (trimmed.startsWith('/')) {
		return trimmed
	}
	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		return trimmed
	}
	return `https://${trimmed}`
}

/**
 * nocobase客户端账号密码登录
 */
export async function loginByAccount(url: string, username: string, password: string) {
	const finalUrl = normalizeUrl(url)
	if (!finalUrl || !username.trim() || !password.trim()) {
		console.warn('[System:NocoBase:loginByAccount] 参数不完整')
		return null
	}

	const tempClient = new APIClient({
		baseURL: finalUrl,
	})

	const response = await tempClient.auth.signIn({
		account: username.trim(),
		password: password.trim(),
	})

	const token = response?.data?.data?.token || tempClient.auth.getToken()
	if (!token) {
		console.warn('[System:NocoBase:loginByAccount] 未获取到 token')
		return null
	}

	return nocoBaseService.createClient(String(token), finalUrl)

}


/**
 * nocobase客户端token登录
 */
export async function loginByToken(url: string, token: string) {
	const finalUrl = normalizeUrl(url)
	if (!finalUrl || !token.trim()) {
		console.warn('[System:NocoBase:loginByToken] 参数不完整')
		return null
	}

	return nocoBaseService.createClient(token.trim(), finalUrl)

}


