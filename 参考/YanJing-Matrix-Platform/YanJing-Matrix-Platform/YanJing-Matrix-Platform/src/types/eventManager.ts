export * from './eventManager'
import type { ExtensibleEvent, MessageEvent } from 'matrix-events-sdk'
import type {
  MatrixEvent,
  Room,
  RoomMember,
  SyncState,
  SyncStateData,
  EventStatus
} from 'matrix-js-sdk'

/**
 * 应用层统一事件类型（对上层业务稳定暴露）
 * 说明：这些事件由 MatrixEventManager 统一派发，而非直接依赖 SDK 的事件名
 */
export const MatrixEventType = {
  // 消息事件
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',

  // 房间事件
  ROOM_JOINED: 'room:joined',
  ROOM_LEFT: 'room:left',
  ROOM_INVITED: 'room:invited',
  ROOM_UPDATED: 'room:updated',
  ROOM_SUMMARY_UPDATED: 'room:summary-updated',

  // 已读状态事件
  READ_RECEIPT: 'read:receipt',
  TYPING: 'typing',

  // 同步事件
  SYNC_STARTED: 'sync:started',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_ERROR: 'sync:error',

  // 连接事件
  CONNECTED: 'client:connected',
  DISCONNECTED: 'client:disconnected',
  RECONNECTING: 'client:reconnecting'
} as const

export type MatrixEventType = typeof MatrixEventType[keyof typeof MatrixEventType]

/**
 * 消息相关事件负载
 * event: 原始 MatrixEvent
 * room: 事件所属房间
 * parsed: 经过 matrix-events-sdk 解析后的 ExtensibleEvent（若可解析）
 * message: parsed 为 MessageEvent 时的强类型结果
 * isNew: 是否为新到事件（/sync 实时事件）
 * status/oldStatus: 本地回声状态变化时使用
 */
export interface MessageEventPayload {
  event: MatrixEvent
  room: Room
  parsed?: ExtensibleEvent
  message?: MessageEvent
  isNew?: boolean
  status?: EventStatus | null
  oldStatus?: EventStatus | null
}

/** 房间成员关系变更负载 */
export interface RoomMembershipPayload {
  room: Room
  membership: string
  prevMembership?: string
}

/** 正在输入状态负载 */
export interface TypingPayload {
  event: MatrixEvent
  room: Room
  member: RoomMember
  typing: boolean
}

/** 已读回执负载 */
export interface ReadReceiptPayload {
  event: MatrixEvent
  room: Room
}

/** 同步状态负载 */
export interface SyncPayload {
  state: SyncState
  prevState: SyncState | null
  data?: SyncStateData
}

/** 房间摘要负载（如果上层自行触发） */
export interface RoomSummaryPayload {
  summary: unknown
}

/**
 * 统一事件类型 -> 事件负载 的映射表
 * 用于让 on/once/off 获得完整类型提示
 */
export type MatrixEventPayloadMap = {
  [MatrixEventType.MESSAGE_RECEIVED]: MessageEventPayload
  [MatrixEventType.MESSAGE_SENT]: MessageEventPayload
  [MatrixEventType.MESSAGE_UPDATED]: MessageEventPayload
  [MatrixEventType.MESSAGE_DELETED]: MessageEventPayload

  [MatrixEventType.ROOM_JOINED]: RoomMembershipPayload
  [MatrixEventType.ROOM_LEFT]: RoomMembershipPayload
  [MatrixEventType.ROOM_INVITED]: RoomMembershipPayload
  [MatrixEventType.ROOM_UPDATED]: { room: Room; event?: MatrixEvent }
  [MatrixEventType.ROOM_SUMMARY_UPDATED]: RoomSummaryPayload

  [MatrixEventType.READ_RECEIPT]: ReadReceiptPayload
  [MatrixEventType.TYPING]: TypingPayload

  [MatrixEventType.SYNC_STARTED]: SyncPayload
  [MatrixEventType.SYNC_COMPLETED]: SyncPayload
  [MatrixEventType.SYNC_ERROR]: SyncPayload & { error?: Error }

  [MatrixEventType.CONNECTED]: { state: SyncState }
  [MatrixEventType.DISCONNECTED]: { state: SyncState }
  [MatrixEventType.RECONNECTING]: { state: SyncState }
}
