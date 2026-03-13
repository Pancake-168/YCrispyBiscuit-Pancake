/**
 * Userbot WebSocket（shayu）入站消息协议 - 类型定义
 *
 * 基于你实际抓到的 payload：
 * - appending: { state:'appending', room_id, content_type:'activity'|'think'|'reporter'|'text', content: string | object }
 * - finish:    { state:'finish', room_id, event_id }
 */

export type UserbotWsState =
  | 'appending'
  | 'finish'
  | 'completed'
  | 'error'
  | 'failed'
  | 'cancelled'
  | 'stopped'
  | 'timeout'

/** Matrix 事件 ID（通常以 $ 开头） */
export type MatrixEventId = `$${string}`

/**
 * event_id：你们目前观测到两类：
 * - Matrix event id：$xxxx
 * - 任务/流式 id：非 $ 开头的短串（例如 qWcbPZ8OSem / fOkJ7nF9KpS）
 *
 * 这里不强行区分具体格式（避免误判），但提供 MatrixEventId 供上层需要时做进一步收窄。
 */
export type UserbotWsEventId = string

/**
 * content_type：你目前见到过 activity / think / reporter / text。
 * 允许后端扩展其它字符串。
 */
export type UserbotWsContentType = 'activity' | 'think' | 'reporter' | 'text' | (string & {})

/**
 * 当 content_type=activity 时，服务端的 content 是一个对象，且对象里也有 content 字段（实际文本分片）。
 */
export interface UserbotWsActivityContent {
  id: string
  agent: string
  user: string
  room: string
  content: string
  options?: string[]
  [key: string]: unknown
}

/**
 * 偶发情况：服务端直接推 activity payload（不包 state/content_type/room_id）。
 * 你贴过的日志里表现为顶层只有 id/agent/user/room/options/content 等字段。
 */
export interface UserbotWsBareActivityMessage {
  id: string
  agent: string
  user: string
  room: string
  content?: string
  options?: string[]
  [key: string]: unknown
}

export type UserbotWsContent = string | UserbotWsActivityContent | Record<string, unknown>

/** appending（增量推送） */
export interface UserbotWsInboundAppending {
  state: 'appending'
  room_id: string
  content_type: UserbotWsContentType
  content: UserbotWsContent
  /** 有时可能会提前带上 event_id（你贴的例子是 finish 才有） */
  event_id?: UserbotWsEventId
  [key: string]: unknown
}

/** finish（结束推送） */
export interface UserbotWsInboundFinish {
  state: 'finish'
  room_id: string
  event_id: UserbotWsEventId
  [key: string]: unknown
}

/** 其它状态（目前前端只显式处理 appending/finish，但 websocket.ts 的 FinishMessage 里列了更多） */
export interface UserbotWsInboundOther {
  state: Exclude<UserbotWsState, 'appending' | 'finish'>
  room_id?: string
  event_id?: UserbotWsEventId
  content_type?: UserbotWsContentType
  content?: UserbotWsContent
  [key: string]: unknown
}

export type UserbotWsInboundMessage =
  | UserbotWsInboundAppending
  | UserbotWsInboundFinish
  | UserbotWsInboundOther
  | UserbotWsBareActivityMessage
