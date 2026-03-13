import { useIDmapStore } from '@/stores/IDmap'

export interface ResolveDisplayNameInput {
  matrixId?: string | null
  username?: string | null
  /** Matrix SDK 侧的 displayName（或 member.name / summary.senderName 等） */
  matrixDisplayName?: string | null
}

function normalizeString(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  return v.length > 0 ? v : undefined
}

function deriveLocalpartFromMxid(mxid?: string): string | undefined {
  const v = normalizeString(mxid)
  if (!v) return undefined
  if (!v.startsWith('@')) return undefined
  const local = v.split(':')[0]?.replace(/^@/, '')
  return normalizeString(local)
}

/**
 * 解析“应展示的用户名称”。
 * 优先：IDMap.nickname（可用 matrixId / username 查询）
 * 其次：Matrix 侧 displayName
 * 再次：从 mxid 推导 localpart（@user:server -> user）
 * 最后：username 或 matrixId 本身
 */
export function resolveUserDisplayName(input: ResolveDisplayNameInput): string {
  const matrixId = normalizeString(input.matrixId)
  const username = normalizeString(input.username)
  const matrixDisplayName = normalizeString(input.matrixDisplayName)

  try {
    const idmapStore = useIDmapStore()

    const byMatrix = matrixId ? idmapStore.getByMatrixId(matrixId) : undefined
    const byUsername = !byMatrix && username ? idmapStore.getByUsername(username) : undefined

    // 兼容：有些场景只有 mxid，但 username 未透传；可尝试用 mxid localpart 去命中 username
    const guessedUsername = !byMatrix && !byUsername && !username ? deriveLocalpartFromMxid(matrixId) : undefined
    const byGuessed = !byMatrix && !byUsername && guessedUsername ? idmapStore.getByUsername(guessedUsername) : undefined

    const nickname = normalizeString(byMatrix?.nickname) || normalizeString(byUsername?.nickname) || normalizeString(byGuessed?.nickname)
    if (nickname) return nickname
  } catch {
    // pinia 未初始化等情况：忽略，走 fallback
  }

  if (matrixDisplayName) return matrixDisplayName

  const localpart = deriveLocalpartFromMxid(matrixId)
  if (localpart) return localpart

  return username || matrixId || ''
}
