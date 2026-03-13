
import { nocoBaseService } from '@/services/NocoBase/client'
import { APIClient } from '@nocobase/sdk'

type ProbeItem = { key: string; url: string; params?: Record<string, any> }

const DEFAULT_PROBES: ProbeItem[] = [
	{ key: 'me', url: 'users:me' },
	{ key: 'applications', url: 'applications:list', params: { page: 1, pageSize: 200 } },
	{ key: 'collections', url: 'collections:list', params: { page: 1, pageSize: 500 } },
	{ key: 'roles', url: 'roles:list', params: { page: 1, pageSize: 200 } },
	{ key: 'users', url: 'users:list', params: { page: 1, pageSize: 200 } },
	{ key: 'uiRoutes', url: 'uiRoutes:getAccessible' },
	{ key: 'uiSchemas', url: 'uiSchemas:list', params: { page: 1, pageSize: 200 } },
	{ key: 'workflows', url: 'workflows:list', params: { page: 1, pageSize: 200 } },
]

const resolveFirstSchemaUid = (data: any): string | undefined => {
	const schemas = Array.isArray(data?.uiSchemas) ? data.uiSchemas : []
	const first = schemas.find((item: any) => item?.uid || item?.['x-uid'] || item?.id || item?.name)
	return first?.uid || first?.['x-uid'] || first?.id || first?.name
}

const attachUISchemaTree = async (
	client: APIClient,
	dataContainer: Record<string, any>,
	params?: Record<string, any>,
	requestConfig?: Record<string, any>,
) => {
	const schemaUid = resolveFirstSchemaUid(dataContainer)
	if (!schemaUid) {
		return
	}
	try {
		const response = await client.request({
			url: `uiSchemas:getJsonSchema/${encodeURIComponent(schemaUid)}`,
			params: {
				includeAsyncNode: true,
				...(params || {}),
			},
			...(requestConfig || {}),
		})
		dataContainer.uiSchemasTree = response?.data?.data ?? response?.data ?? response
	} catch (error: any) {
		if (!dataContainer.uiSchemasTree) {
			dataContainer.uiSchemasTree = null
		}
		dataContainer.uiSchemasTreeError = {
			message: error?.message || String(error),
			status: error?.response?.status,
			url: `uiSchemas:getJsonSchema/${schemaUid}`,
		}
	}
}

async function runProbes(
	client: APIClient,
	probes: ProbeItem[],
	extraRequestConfig?: Record<string, any>,
) {
	const result: Record<string, any> = {
		data: {},
		errors: {},
	}

	for (const probe of probes) {
		try {
			const response = await client.request({
				url: probe.url,
				params: probe.params,
				...(extraRequestConfig || {}),
			})
			result.data[probe.key] = response?.data?.data ?? response?.data ?? response
		} catch (error: any) {
			result.errors[probe.key] = {
				message: error?.message || String(error),
				status: error?.response?.status,
				url: probe.url,
			}
		}
	}

	return result
}

function getOriginFromBaseURL(baseURL: string): string {
	const normalized = baseURL.trim().replace(/\/+$/, '')
	const parsed = normalized.startsWith('http://') || normalized.startsWith('https://')
		? new URL(normalized)
		: new URL(normalized, window.location.origin)
	return parsed.origin
}

function ensureApiBase(baseURL: string): string {
	const normalized = baseURL.trim().replace(/\/+$/, '')
	if (normalized.endsWith('/api')) return normalized
	return `${normalized}/api`
}

/**
 * 获取所有当前已登录账户能拿到的所有nocobase信息
 * 
 * 最表层，只有一个token的情况下能拿到什么数据库信息？
 * 有什么拿什么！
 */
export async function getAllAvailableNocoBaseInfo() {
	const client = nocoBaseService.getAuthedClient()
	if (!client) {
		console.warn('[System:NocoBase:data:getAllAvailableNocoBaseInfo] 未找到已认证客户端，请先登录')
		return null
	}

	return runProbes(client, DEFAULT_PROBES)
}

/**
 * 获取指定子应用的全部信息（能拿多少拿多少）
 * 说明：
 * - mode=appPath:   通过 /apps/{appName}/api 切换子应用上下文
 * - mode=appHeader: 通过根 /api + x-app 头切换子应用上下文
 */
export async function getAllAvailableNocoBaseInfoByApplication(appName: string) {
	const targetApp = appName?.trim()
	if (!targetApp) {
		console.warn('[System:NocoBase:data:getAllAvailableNocoBaseInfoByApplication] appName 不能为空')
		return null
	}

	const token = nocoBaseService.getAuthedToken()
	const authedBaseURL = nocoBaseService.getAuthedBaseURL()
	if (!token || !authedBaseURL) {
		console.warn('[System:NocoBase:data:getAllAvailableNocoBaseInfoByApplication] 未找到登录态，请先登录')
		return null
	}

	const normalizedBase = authedBaseURL.trim().replace(/\/+$/, '')
	let rootApiBase = ''
	let appPathApiBase = ''
	if (normalizedBase.startsWith('/')) {
		rootApiBase = ensureApiBase(normalizedBase)
		const proxyPrefix = rootApiBase.replace(/\/api$/, '')
		appPathApiBase = `${proxyPrefix}/apps/${encodeURIComponent(targetApp)}/api`
	} else {
		const origin = getOriginFromBaseURL(normalizedBase)
		rootApiBase = ensureApiBase(origin)
		appPathApiBase = `${origin}/apps/${encodeURIComponent(targetApp)}/api`
	}

	const byAppHeaderClient = new APIClient({ baseURL: rootApiBase })
	byAppHeaderClient.auth.setToken(token)

	const byAppPath = { data: null, errors: { skipped: { message: 'appPath skipped' } } }
	const byAppHeader = await runProbes(byAppHeaderClient, DEFAULT_PROBES, {
		headers: {
			'x-app': targetApp,
		},
	})

	const byAppParam = await runProbes(byAppHeaderClient, DEFAULT_PROBES.map((probe) => ({
		...probe,
		params: {
			...(probe.params || {}),
			__appName: targetApp,
		},
	})))

	if (byAppHeader?.data) {
		await attachUISchemaTree(
			byAppHeaderClient,
			byAppHeader.data,
			undefined,
			{ headers: { 'x-app': targetApp } },
		)
	}
	if (byAppParam?.data) {
		await attachUISchemaTree(
			byAppHeaderClient,
			byAppParam.data,
			{ __appName: targetApp },
		)
	}

	const headerOkCount = Object.keys(byAppHeader.data || {}).length
	const paramOkCount = Object.keys(byAppParam.data || {}).length
	const preferredMode = headerOkCount >= paramOkCount
			? 'appHeader'
			: 'appParam'

	return {
		appName: targetApp,
		meta: {
			preferredMode,
			rootApiBase,
			appPathApiBase,
		},
		attempts: {
			appPath: byAppPath,
			appHeader: byAppHeader,
			appParam: byAppParam,
		},
	}
}

/**
 * 获取指定子应用下指定 collection 的数据（默认 list）
 * 说明：
 * - action 目前固定为 `${collectionName}:list`
 * - 同时尝试 appPath 与 appHeader，两种结果都返回
 */
export async function getCollectionDataByApplication(
	appName: string,
	collectionName: string,
	params?: Record<string, any>,
) {
	const targetApp = appName?.trim()
	const targetCollection = collectionName?.trim()
	if (!targetApp || !targetCollection) {
		console.warn('[System:NocoBase:data:getCollectionDataByApplication] appName/collectionName 不能为空')
		return null
	}

	const token = nocoBaseService.getAuthedToken()
	const authedBaseURL = nocoBaseService.getAuthedBaseURL()
	if (!token || !authedBaseURL) {
		console.warn('[System:NocoBase:data:getCollectionDataByApplication] 未找到登录态，请先登录')
		return null
	}

	const normalizedBase = authedBaseURL.trim().replace(/\/+$/, '')
	let rootApiBase = ''
	let appPathApiBase = ''
	if (normalizedBase.startsWith('/')) {
		rootApiBase = ensureApiBase(normalizedBase)
		const proxyPrefix = rootApiBase.replace(/\/api$/, '')
		appPathApiBase = `${proxyPrefix}/apps/${encodeURIComponent(targetApp)}/api`
	} else {
		const origin = getOriginFromBaseURL(normalizedBase)
		rootApiBase = ensureApiBase(origin)
		appPathApiBase = `${origin}/apps/${encodeURIComponent(targetApp)}/api`
	}
	const actionUrl = `${targetCollection}:list`

	const finalParams = {
		page: 1,
		pageSize: 20,
		...(params || {}),
	}

	const byAppHeaderClient = new APIClient({ baseURL: rootApiBase })
	byAppHeaderClient.auth.setToken(token)

	const attempts: Record<string, any> = {
		appPath: { data: null, error: { message: 'appPath skipped' } },
		appHeader: { data: null, error: null },
		appParam: { data: null, error: null },
	}

	try {
		const response = await byAppHeaderClient.request({
			url: actionUrl,
			params: finalParams,
			headers: {
				'x-app': targetApp,
			},
		})
		attempts.appHeader.data = response?.data?.data ?? response?.data ?? response
	} catch (error: any) {
		attempts.appHeader.error = {
			message: error?.message || String(error),
			status: error?.response?.status,
			url: actionUrl,
		}
	}

	try {
		const response = await byAppHeaderClient.request({
			url: actionUrl,
			params: {
				...finalParams,
				__appName: targetApp,
			},
		})
		attempts.appParam.data = response?.data?.data ?? response?.data ?? response
	} catch (error: any) {
		attempts.appParam.error = {
			message: error?.message || String(error),
			status: error?.response?.status,
			url: actionUrl,
		}
	}

	const preferredMode = attempts.appHeader.data
		? 'appHeader'
		: attempts.appParam.data
			? 'appParam'
			: 'none'

	return {
		appName: targetApp,
		collectionName: targetCollection,
		action: actionUrl,
		meta: {
			preferredMode,
			rootApiBase,
			appPathApiBase,
		},
		attempts,
	}
}

/**
 * 获取指定子应用下指定 uiSchema 的 JsonSchema（树形结构）
 * 说明：
 * - action 固定为 `uiSchemas:getJsonSchema/${schemaUid}`
 * - 同时尝试 appPath 与 appHeader，两种结果都返回
 */
export async function getUISchemaJsonByApplication(
	appName: string,
	schemaUid: string,
	params?: Record<string, any>,
) {
	const targetApp = appName?.trim()
	const targetSchemaUid = schemaUid?.trim()
	if (!targetApp || !targetSchemaUid) {
		console.warn('[System:NocoBase:data:getUISchemaJsonByApplication] appName/schemaUid 不能为空')
		return null
	}

	const token = nocoBaseService.getAuthedToken()
	const authedBaseURL = nocoBaseService.getAuthedBaseURL()
	if (!token || !authedBaseURL) {
		console.warn('[System:NocoBase:data:getUISchemaJsonByApplication] 未找到登录态，请先登录')
		return null
	}

	const normalizedBase = authedBaseURL.trim().replace(/\/+$/, '')
	let rootApiBase = ''
	let appPathApiBase = ''
	if (normalizedBase.startsWith('/')) {
		rootApiBase = ensureApiBase(normalizedBase)
		const proxyPrefix = rootApiBase.replace(/\/api$/, '')
		appPathApiBase = `${proxyPrefix}/apps/${encodeURIComponent(targetApp)}/api`
	} else {
		const origin = getOriginFromBaseURL(normalizedBase)
		rootApiBase = ensureApiBase(origin)
		appPathApiBase = `${origin}/apps/${encodeURIComponent(targetApp)}/api`
	}

	const actionUrl = `uiSchemas:getJsonSchema/${encodeURIComponent(targetSchemaUid)}`
	const finalParams = {
		includeAsyncNode: true,
		...(params || {}),
	}

	const byAppHeaderClient = new APIClient({ baseURL: rootApiBase })
	byAppHeaderClient.auth.setToken(token)

	const attempts: Record<string, any> = {
		appPath: { data: null, error: { message: 'appPath skipped' } },
		appHeader: { data: null, error: null },
		appParam: { data: null, error: null },
	}

	try {
		const response = await byAppHeaderClient.request({
			url: actionUrl,
			params: finalParams,
			headers: {
				'x-app': targetApp,
			},
		})
		attempts.appHeader.data = response?.data?.data ?? response?.data ?? response
	} catch (error: any) {
		attempts.appHeader.error = {
			message: error?.message || String(error),
			status: error?.response?.status,
			url: actionUrl,
		}
	}

	try {
		const response = await byAppHeaderClient.request({
			url: actionUrl,
			params: {
				...finalParams,
				__appName: targetApp,
			},
		})
		attempts.appParam.data = response?.data?.data ?? response?.data ?? response
	} catch (error: any) {
		attempts.appParam.error = {
			message: error?.message || String(error),
			status: error?.response?.status,
			url: actionUrl,
		}
	}

	const preferredMode = attempts.appHeader.data
		? 'appHeader'
		: attempts.appParam.data
			? 'appParam'
			: 'none'

	return {
		appName: targetApp,
		schemaUid: targetSchemaUid,
		action: actionUrl,
		meta: {
			preferredMode,
			rootApiBase,
			appPathApiBase,
		},
		attempts,
	}
}