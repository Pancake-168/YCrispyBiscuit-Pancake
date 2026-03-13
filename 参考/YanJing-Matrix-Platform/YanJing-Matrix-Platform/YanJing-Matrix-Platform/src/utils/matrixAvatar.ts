import { matrixClient } from '@/services/Matrix/client'
import { buildMediaCandidates, fetchWithAuthToBlobUrl, resolveMediaBaseUrl } from '@/utils/media'

export type MatrixAvatarHelper = {
  normalizeUserId: (value: string) => string
  resolveAvatarUrl: (userId: string) => Promise<string | undefined>
  resolveAvatarByMxc: (mxcUrl?: string) => Promise<string | undefined>
  getFallbackText: (...sources: Array<string | undefined>) => string
  dispose: () => void
}

export const createMatrixAvatarHelper = (serverUrl: string): MatrixAvatarHelper => {
  const avatarCache = new Map<string, string | undefined>()

  const normalizeUserId = (value: string) => {
    let userId = value.trim()
    if (!userId.startsWith('@')) userId = `@${userId}`
    if (!userId.includes(':')) userId = `${userId}:${serverUrl}`
    return userId
  }

  const resolveAvatarUrl = async (userId: string): Promise<string | undefined> => {
    if (!userId) return undefined
    const normalizedUserId = normalizeUserId(userId)
    if (avatarCache.has(normalizedUserId)) return avatarCache.get(normalizedUserId)

    const client = matrixClient.getAuthedClient()
    if (!client) {
      avatarCache.set(normalizedUserId, undefined)
      return undefined
    }

    try {
      const user = client.getUser(normalizedUserId)
      let avatarMxc = user?.avatarUrl || undefined
      if (!avatarMxc) {
        const profile = await client.getProfileInfo(normalizedUserId)
        avatarMxc = profile?.avatar_url || undefined
      }
      if (!avatarMxc) {
        avatarCache.set(normalizedUserId, undefined)
        return undefined
      }

      const baseUrl = resolveMediaBaseUrl({ mxcUrl: avatarMxc })
      const blobUrl = await resolveAvatarByBaseUrl(baseUrl)
      if (blobUrl) {
        avatarCache.set(normalizedUserId, blobUrl)
        return blobUrl
      }

      avatarCache.set(normalizedUserId, undefined)
      return undefined
    } catch {
      avatarCache.set(normalizedUserId, undefined)
      return undefined
    }
  }

  const resolveAvatarByBaseUrl = async (baseUrl?: string): Promise<string | undefined> => {
    const candidates = buildMediaCandidates(baseUrl)
    for (const candidate of candidates) {
      try {
        return await fetchWithAuthToBlobUrl(candidate)
      } catch {
        // try next candidate
      }
    }
    return undefined
  }

  const resolveAvatarByMxc = async (mxcUrl?: string): Promise<string | undefined> => {
    if (!mxcUrl) return undefined
    const key = `mxc:${mxcUrl}`
    if (avatarCache.has(key)) return avatarCache.get(key)

    const baseUrl = resolveMediaBaseUrl({ mxcUrl })
    const blobUrl = await resolveAvatarByBaseUrl(baseUrl)
    avatarCache.set(key, blobUrl)
    return blobUrl
  }

  const getFallbackText = (...sources: Array<string | undefined>) => {
    const source = (sources.find((item) => item && item.trim()) || '?').trim()
    return source.charAt(0).toUpperCase()
  }

  const dispose = () => {
    avatarCache.forEach((url) => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
    })
    avatarCache.clear()
  }

  return {
    normalizeUserId,
    resolveAvatarUrl,
    resolveAvatarByMxc,
    getFallbackText,
    dispose,
  }
}
