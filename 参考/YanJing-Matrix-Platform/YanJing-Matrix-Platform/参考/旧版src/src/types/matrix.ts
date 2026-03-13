// Matrix 相关类型定义
// 这个文件定义了整个Matrix聊天应用中使用的所有数据结构

/**
 * Matrix登录配置接口
 * 包含用户登录Matrix服务器所需的所有信息
 */
export interface MatrixLoginConfig {
  /** Matrix服务器地址，例如: https://matrix.org */
  homeserver: string

  /** 用户名（不包含@符号和服务器名），例如: myusername */
  username: string

  /** 用户密码 */
  password: string
}


/**
 * Matrix注册配置接口
 * 包含用户注册Matrix账户所需的所有信息
 */
export interface MatrixRegisterConfig {
  /** Matrix服务器地址，例如: https://matrix.org */
  homeserver: string

  /** 用户名（不包含@符号和服务器名），例如: myusername */
  username: string

  /** 用户密码 */
  password: string

  /** 确认密码 */
  confirmPassword: string


  deviceName?: string;

  /** 用于交互式注册流程的认证数据 (如 reCAPTCHA 响应) */
  auth?: any;

  /** 用于维持同一次交互式注册流程的会话ID */
  session?: string;
}

/**
 * Matrix用户信息接口
 * 代表一个Matrix用户的基本信息
 */
export interface MatrixUser {
  /** 完整的Matrix用户ID，格式: @username:server.com */
  userId: string

  /** 用户显示名称（可选），如果没有设置则为空 */
  displayName?: string

  /** 用户头像URL（可选），指向用户头像图片的链接 */
  avatarUrl?: string
}

/**
 * Matrix房间信息接口
 * 代表一个Matrix房间的完整信息
 */
export interface MatrixRoom {
  /** 房间唯一标识符，格式: !roomId:server.com */
  roomId: string

  /** 房间显示名称，如果房间没有设置名称则显示房间ID */
  name: string

  /** 房间主题/描述（可选），房间的简短描述信息 */
  topic?: string

  /** 最后活动时间戳，用于排序房间列表（最近活动的房间排在前面） */
  lastActivity: number

  /** 是否启用端到端加密，true表示这是一个加密房间 */
  encrypted: boolean

  /** 未读消息数量（可选），显示房间中的未读消息数 */
  unreadCount?: number

  /** 房间头像URL（可选），指向房间头像图片的链接 */
  avatarUrl?: string

  /** 当前用户的成员状态 */
  membership?: 'join' | 'invite' | 'leave' | 'ban' | 'knock' | string

  /** 最近的一条消息（可选），用于房间列表展示摘要 */
  lastMessage?: MatrixMessage

  /** 最近事件摘要（可选），包含消息或系统事件 */
  lastEvent?: RoomEventSummary





  type?: '空间' | '普通房间' | '空间下的房间' | '一对一私聊'
  belongSpace?: string // 归属空间ID
  belongSpaceName?: string // 归属空间名称
  allowedSpaces?: string[] // 允许加入的空间ID（针对一对一私聊）

}

/**
 * Matrix消息接口
 * 代表一条Matrix消息的完整信息
 */
export interface MatrixMessage {
  /** 消息事件唯一标识符，Matrix中每个事件都有唯一ID */
  eventId: string

  /** 消息发送者的Matrix用户ID，格式: @username:server.com */
  sender: string


  displayName?: string


  /** 消息内容，对于文本消息就是消息文本 */
  content: string

  /** 消息所属的房间ID */
  roomId: string

  /** 消息发送时间戳，Unix时间戳格式 */
  timestamp: number

  /** 是否为加密消息，true表示这条消息是端到端加密的 */
  encrypted: boolean

  /** 消息类型（可选），区分文本、图片、文件等不同类型的消息 */
  messageType?: 'm.text' | 'm.image' | 'm.file' | 'm.audio' | 'm.video' | 'm.system'

  /** 消息额外信息（可选），用于存储文件信息、图片信息等 */
  messageInfo?: {
    /** 文件/图片URL */
    url?: string
    /** 文件名 */
    filename?: string
    /** 文件大小（字节） */
    size?: number
    /** MIME类型 */
    mimetype?: string
    /** 图片替代文本 */
    alt?: string
    /** 缩略图URL */
    thumbnail_url?: string
    /** 宽度 */
    width?: number
    /** 高度 */
    height?: number
    /** 其他自定义属性 */
    [key: string]: any
  }


  formattedBody?: string // 新增
  format?: string        // 新增
  /** 组合消息（bundle）标记 */
  bundleId?: string
  bundleIndex?: number
  bundleTotal?: number
  /** 是否为系统事件 */
  isSystemEvent?: boolean
  /** 原始事件类型，例如 m.room.member */
  eventType?: string
  /** 关联的系统事件摘要 */
  systemEvent?: RoomEventSummary
  /** 是否为流式消息（WebSocket实时推送的临时消息） */
  isStreaming?: boolean
}

/**
 * 房间最近事件摘要
 */
export interface RoomEventSummary {
  /** 事件 ID */
  eventId: string
  /** 事件类型（如 m.room.message） */
  type: string
  /** 事件发送者 ID */
  sender: string
  /** 事件发送者显示名称 */
  senderName?: string
  /** 事件发生时间戳 */
  timestamp: number
  /** 展示用的事件描述（纯文本） */
  description: string
  /** 是否为系统事件（非普通消息） */
  isSystemEvent: boolean
  /** 额外数据（如新名称、新主题等） */
  metadata?: Record<string, any>
}






/**
 * Matrix事件系统相关类型定义
 */

// ===== 事件系统类型定义 =====

/**
 * 事件监听器回调函数类型
 */
export type EventCallback<T = any> = (data: T) => void

/**
 * 事件监听器接口
 */
export interface EventListener {
  /** 监听器ID */
  id: string
  /** 事件类型 */
  eventType: string
  /** 回调函数 */
  callback: EventCallback
  /** 是否只监听一次 */
  once?: boolean
  /** 优先级（数字越大优先级越高） */
  priority?: number
}

/**
 * 消息事件数据接口
 */
export interface MessageEventData {
  /** 事件ID */
  eventId: string
  /** 房间ID */
  roomId: string
  /** 发送者ID */
  sender: string
  /** 消息内容 */
  content: MatrixMessage
  /** 时间戳 */
  timestamp: number
  /** 是否为新消息 */
  isNew?: boolean
}

/**
 * 房间事件数据接口
 */
export interface RoomEventData {
  /** 房间ID */
  roomId: string
  /** 事件类型 */
  eventType: 'join' | 'leave' | 'invite' | 'update' | 'delete'
  /** 相关用户ID */
  userId?: string
  /** 房间信息 */
  room?: MatrixRoom
}

/**
 * 已读状态事件数据接口
 */
export interface ReadReceiptEventData {
  /** 房间ID */
  roomId: string
  /** 用户ID */
  userId: string
  /** 事件ID */
  eventId: string
  /** 时间戳 */
  timestamp: number
}

/**
 * 同步状态事件数据接口
 */
export interface SyncEventData {
  /** 同步状态 */
  state: 'PREPARED' | 'SYNCING' | 'STOPPED' | 'ERROR'
  /** 上次同步时间 */
  prevSyncTime?: number
  /** 下次同步时间 */
  nextSyncTime?: number
  /** 错误信息（如果有） */
  error?: string
}

/**
 * 房间时间线接口
 */
export interface RoomTimeline {
  /** 房间ID */
  roomId: string
  /** 消息列表 */
  messages: MatrixMessage[]
  /** 是否还有更多历史消息 */
  hasMoreHistory: boolean
  /** 是否正在加载历史消息 */
  isLoadingHistory: boolean
  /** 最后读取的事件ID */
  lastReadEventId?: string
  /** 未读消息数量 */
  unreadCount: number
}

/**
 * 房间摘要信息（用于房间列表显示）
 */
export interface RoomSummary {
  /** 房间ID */
  roomId: string
  /** 房间名称 */
  name: string
  /** 最后一条消息 */
  lastMessage?: MatrixMessage
  /** 最近事件摘要 */
  lastEvent?: RoomEventSummary
  /** 未读消息数量 */
  unreadCount: number
  /** 最后活动时间 */
  lastActivity: number
  /** 房间头像 */
  avatarUrl?: string
  /** 是否有未读消息 */
  hasUnread: boolean
}




/**
 * 事件类型常量
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
  ROOM_DELETED: 'room:deleted',
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

/**
 * 事件类型
 */
export type MatrixEventType = typeof MatrixEventType[keyof typeof MatrixEventType]

export interface RoomSummaryEventData {
  roomId: string
  summary: RoomSummary
}



/**
 * Matrix消息类型枚举
 * Matrix协议中定义的标准消息类型
 */
export type Matrix消息类型 =
  | 'm.text'    // 纯文本消息
  | 'm.image'   // 图片消息  
  | 'm.file'    // 文件消息
  | 'm.audio'   // 音频消息
  | 'm.video'   // 视频消息
  | 'm.system'  // 系统事件消息



