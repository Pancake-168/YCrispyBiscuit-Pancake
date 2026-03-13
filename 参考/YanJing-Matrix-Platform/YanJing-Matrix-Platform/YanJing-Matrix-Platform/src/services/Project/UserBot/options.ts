/**
 * Userbot WebSocket（shayu）“选项（options）”能力 - 提取与发送 payload 构建
 *
 * 说明：给的示例发送内容形如：
 * {
 *   id: string,
 *   options: string[],
 *   agent: string,
 *   room: string,
 *   user: string
 * }
 *
 * 注意：入站消息里可能没有 user，这里把 user 的构建留成钩子（resolveUser）。
 */

export interface UserbotWsOptionsRaw {
  id: string
  options: string[]
  agent: string
  room: string
  /** 入站可能没有 user；发送前需要补全 */
  user?: string
  /** 原始对象，便于调试或二次构建 */
  raw: unknown
}

export interface UserbotWsOptionSendPayload {
  id: string
  options: string[]
  agent: string
  room: string
  user: string
}

export type ResolveUserForOptionSend = (ctx: {
  agent: string
  room: string
  option: string
  source: UserbotWsOptionsRaw
}) => string | null | Promise<string | null>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readString = (obj: Record<string, unknown>, key: string): string | null => {
  const value = obj[key]
  return typeof value === 'string' ? value : null
}

const readStringArray = (obj: Record<string, unknown>, key: string): string[] | null => {
  const value = obj[key]
  if (!Array.isArray(value)) return null
  if (value.every((v) => typeof v === 'string')) return value as string[]
  return null
}

/**
 * 从任意 WS 入站对象中提取 options 信息。
 * 兼容两种形态：
 * 1) 包装形态：{ state:'appending', content_type:'activity', content:{ id, agent, room, options? } }
 * 2) 裸 activity：{ id, agent, room, options? }
 */
export function extractUserbotOptions(raw: unknown): UserbotWsOptionsRaw | null {
  if (!isRecord(raw)) return null

  // 形态 1：appending + activity + content 对象
  if (raw.state === 'appending' && raw.content_type === 'activity') {
    const content = raw.content
    if (!isRecord(content)) return null

    const id = readString(content, 'id')
    const agent = readString(content, 'agent')
    const room = readString(content, 'room')
    const options = readStringArray(content, 'options')

    if (!id || !agent || !room || !options || options.length === 0) return null

    const user = readString(content, 'user') ?? undefined
    return { id, agent, room, options, user, raw }
  }

  // 形态 2：裸 activity
  const id = readString(raw, 'id')
  const agent = readString(raw, 'agent')
  const room = readString(raw, 'room')
  const options = readStringArray(raw, 'options')
  if (!id || !agent || !room || !options || options.length === 0) return null

  const user = readString(raw, 'user') ?? undefined
  return { id, agent, room, options, user, raw }
}

/**
 * 默认的 user 构建钩子（占位）。
 * 你说你要自己写构建逻辑，所以这里直接返回 null。
 */
export const resolveUserForOptionSendTODO: ResolveUserForOptionSend = async () => {
  return null
}

/**
 * 基于提取出来的 options 源信息 + 用户点击的 option，构建最终发送 payload。
 * 如果 resolveUser 无法给出 user，会抛错（组件可据此展示错误状态）。
 */
export async function buildUserbotOptionSendPayload(params: {
  source: UserbotWsOptionsRaw
  option: string
  resolveUser: ResolveUserForOptionSend
}): Promise<UserbotWsOptionSendPayload> {
  const { source, option, resolveUser } = params

  const user = await resolveUser({
    agent: source.agent,
    room: source.room,
    option,
    source,
  })

  if (!user || typeof user !== 'string') {
    throw new Error('resolveUser 未返回有效 user')
  }

 
  return {
    id: source.id,
    options: [option],
    agent: source.agent,
    room: source.room,
    user,
  }
}
