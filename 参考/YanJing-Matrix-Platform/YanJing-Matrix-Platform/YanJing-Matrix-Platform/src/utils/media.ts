import { matrixClient } from '@/services/Matrix/client'

type CandidateParams = Record<string, string>

type ResolveBaseOptions = {
    url?: string
    mxcUrl?: string
}

const getAuthedClient = () => matrixClient.getAuthedClient()
const failedMediaUrls = new Set<string>()
const inFlightMediaRequests = new Map<string, Promise<Blob>>()

const addParams = (u: string, params: CandidateParams): string => {
    try {
        const x = new URL(u)
        Object.entries(params).forEach(([k, v]) => x.searchParams.set(k, v))
        return x.toString()
    } catch {
        return u
    }
}

export const mxcToHttp = (
    mxcUrl?: string,
    width?: number | null,
    height?: number | null,
    method?: string | null
): string | undefined => {
    if (!mxcUrl) return undefined
    const client = getAuthedClient()
    if (!client) return undefined
    try {
        return client.mxcUrlToHttp(
            mxcUrl,
            width ?? undefined,
            height ?? undefined,
            method ?? undefined,
            false,
            true,
            true
        ) || undefined
    } catch {
        return undefined
    }
}

export const resolveMediaBaseUrl = (options: ResolveBaseOptions): string | undefined => {
    if (options.url) return options.url
    return mxcToHttp(options.mxcUrl)
}

export const buildMediaCandidates = (url?: string): string[] => {
    if (!url) return []
    const list = new Set<string>()
    const cleaned = addParams(url, {})

    const addCandidate = (value?: string) => {
        if (!value) return
        list.add(value)
    }

    const rewriteMatrixMediaPath = (source: string, targetPrefix: string): string | undefined => {
        try {
            const parsed = new URL(source)
            const pathname = parsed.pathname

            if (pathname.includes('/_matrix/client/v1/media/download/')) {
                parsed.pathname = pathname.replace('/_matrix/client/v1/media/download/', `${targetPrefix}/download/`)
            } else if (pathname.includes('/_matrix/client/r0/media/download/')) {
                parsed.pathname = pathname.replace('/_matrix/client/r0/media/download/', `${targetPrefix}/download/`)
            } else if (pathname.includes('/_matrix/media/v3/download/')) {
                parsed.pathname = pathname.replace('/_matrix/media/v3/download/', `${targetPrefix}/download/`)
            } else if (pathname.includes('/_matrix/media/r0/download/')) {
                parsed.pathname = pathname.replace('/_matrix/media/r0/download/', `${targetPrefix}/download/`)
            } else if (pathname.includes('/_matrix/client/v1/media/thumbnail/')) {
                parsed.pathname = pathname.replace('/_matrix/client/v1/media/thumbnail/', `${targetPrefix}/thumbnail/`)
            } else if (pathname.includes('/_matrix/client/r0/media/thumbnail/')) {
                parsed.pathname = pathname.replace('/_matrix/client/r0/media/thumbnail/', `${targetPrefix}/thumbnail/`)
            } else if (pathname.includes('/_matrix/media/v3/thumbnail/')) {
                parsed.pathname = pathname.replace('/_matrix/media/v3/thumbnail/', `${targetPrefix}/thumbnail/`)
            } else if (pathname.includes('/_matrix/media/r0/thumbnail/')) {
                parsed.pathname = pathname.replace('/_matrix/media/r0/thumbnail/', `${targetPrefix}/thumbnail/`)
            } else {
                return undefined
            }

            parsed.searchParams.delete('access_token')
            parsed.searchParams.set('allow_redirect', 'true')
            return parsed.toString()
        } catch {
            return undefined
        }
    }

    const authenticatedVariant = rewriteMatrixMediaPath(cleaned, '/_matrix/client/v1/media')
    const legacyVariant = rewriteMatrixMediaPath(cleaned, '/_matrix/media/v3')

    if (cleaned.includes('/_matrix/media/') || cleaned.includes('/_matrix/client/')) {
        addCandidate(authenticatedVariant)
        addCandidate(cleaned)
        addCandidate(legacyVariant)
    } else {
        addCandidate(cleaned)
    }

    return Array.from(list)
}

export const fetchWithAuthToBlob = async (url: string, mime?: string): Promise<Blob> => {
    const normalizedUrl = addParams(url, {})
    if (failedMediaUrls.has(normalizedUrl)) {
        throw new Error(`404 cached for ${normalizedUrl}`)
    }

    const cachedTask = inFlightMediaRequests.get(normalizedUrl)
    if (cachedTask) {
        return cachedTask
    }

    const client = getAuthedClient()
    if (!client) throw new Error('研境AI客户端未认证')
    const token = client.getAccessToken?.()
    const task = (async () => {
        const resp = await fetch(normalizedUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            redirect: 'follow'
        })
        if (!resp.ok) {
            if (resp.status === 404 || resp.status === 410) {
                failedMediaUrls.add(normalizedUrl)
            }
            throw new Error(`${resp.status} ${resp.statusText}`)
        }
        const buf = await resp.arrayBuffer()
        if (mime) return new Blob([buf], { type: mime })
        const type = resp.headers.get('content-type') || undefined
        return type ? new Blob([buf], { type }) : new Blob([buf])
    })()

    inFlightMediaRequests.set(normalizedUrl, task)
    try {
        return await task
    } finally {
        inFlightMediaRequests.delete(normalizedUrl)
    }
}

export const fetchWithAuthToBlobUrl = async (url: string, mime?: string): Promise<string> => {
    const blob = await fetchWithAuthToBlob(url, mime)
    return URL.createObjectURL(blob)
}
