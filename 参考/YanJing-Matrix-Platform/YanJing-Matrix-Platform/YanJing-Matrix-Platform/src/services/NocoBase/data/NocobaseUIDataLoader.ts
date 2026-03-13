import { getCollectionDataByApplication } from '@/services/NocoBase/data/info'
import type { NocobaseUIRecordsList } from '@/types/NocobaseUIRenderer'

const recordsCache = new Map<string, NocobaseUIRecordsList>()

const resolvePreferredData = (attempts: Record<string, any>): NocobaseUIRecordsList => {
    const preferred =
        attempts?.appPath?.data ?? attempts?.appHeader?.data ?? attempts?.appParam?.data ?? []
    if (Array.isArray(preferred)) {
        return { data: preferred }
    }
    if (preferred && typeof preferred === 'object') {
        return preferred as NocobaseUIRecordsList
    }
    return { data: [] }
}

export const loadNocobaseUIRecords = async (
    appName: string,
    collectionName: string,
    params?: Record<string, any>,
): Promise<NocobaseUIRecordsList> => {
    const cacheKey = `${appName}:${collectionName}:${JSON.stringify(params || {})}`
    const cached = recordsCache.get(cacheKey)
    if (cached) {
        return cached
    }
    const response = await getCollectionDataByApplication(appName, collectionName, params)
    if (!response) {
        return { data: [] }
    }
    const resolved = resolvePreferredData(response.attempts)
    recordsCache.set(cacheKey, resolved)
    return resolved
}
