// 房间管理相关类型定义
export interface RoomCreateOptions {
  /** 房间名称 */
  name?: string
  /** 房间主题 */
  topic?: string
  /** 房间别名（不包含#和服务器部分） */
  alias?: string
  /** 房间可见性 */
  visibility: 'public' | 'private'
  /** 是否启用端到端加密 */
  encryption?: boolean
  /** 邀请的用户列表 */
  invites?: string[]
  /** 房间头像URL */
  avatarUrl?: string
  /** 历史可见性 */
  historyVisibility?: 'invited' | 'joined' | 'shared' | 'world_readable'
  /** 加入规则 */
  joinRule?: 'public' | 'invite' | 'private' | 'knock' | 'restricted'
  /** 访客访问权限 */
  guestAccess?: 'can_join' | 'forbidden'
  /** 房间版本 */
  roomVersion?: string
  /** 初始权限级别设置 */
  powerLevels?: Partial<PowerLevelsContent>
  /** 所属空间ID */
  belongSpace?: string
}

export interface PowerLevelsContent {
  /** 默认用户权限等级 */
  users_default: number
  /** 发送事件所需的默认权限等级 */
  events_default: number
  /** 发送状态事件所需的默认权限等级 */
  state_default: number
  /** 邀请用户所需的权限等级 */
  invite: number
  /** 踢出用户所需的权限等级 */
  kick: number
  /** 封禁用户所需的权限等级 */
  ban: number
  /** 撤回事件所需的权限等级 */
  redact: number
  /** 特定用户的权限等级 */
  users: Record<string, number>
  /** 特定事件类型的权限要求 */
  events: Record<string, number>
  /** 通知设置 */
  notifications?: {
    room: number
  }
}

export interface RoomMemberInfo {
  /** 用户ID */
  userId: string
  /** 显示名称 */
  displayName?: string
  /** 头像URL */
  avatarUrl?: string
  /** 成员状态 */
  membership: 'join' | 'invite' | 'leave' | 'ban' | 'knock'
  /** 权限等级 */
  powerLevel: number
  /** 是否为当前用户 */
  isCurrentUser: boolean
  /** 加入时间 */
  joinedAt?: number
  /** 最后活动时间 */
  lastActiveAt?: number
  /** 是否在线 */
  isOnline?: boolean
}

export interface RoomInviteInfo {
  /** 邀请ID */
  inviteId: string
  /** 房间ID */
  roomId: string
  /** 房间名称 */
  roomName: string
  /** 邀请者用户ID */
  inviter: string
  /** 邀请者显示名称 */
  inviterDisplayName?: string
  /** 被邀请者用户ID */
  invitee: string
  /** 被邀请者显示名称 */
  inviteeDisplayName?: string
  /** 邀请时间 */
  invitedAt: number
  /** 邀请状态 */
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  /** 邀请原因/消息 */
  reason?: string
  /** 房间是否加密 */
  isEncrypted: boolean
  /** 房间主题 */
  roomTopic?: string
}

export interface RoomPermissions {
  /** 是否可以邀请用户 */
  canInvite: boolean
  /** 是否可以踢出用户 */
  canKick: boolean
  /** 是否可以封禁用户 */
  canBan: boolean
  /** 是否可以发送消息 */
  canSendMessages: boolean
  /** 是否可以发送状态事件 */
  canSendStateEvents: boolean
  /** 是否可以撤回消息 */
  canRedact: boolean
  /** 是否可以修改房间信息 */
  canModifyRoom: boolean
  /** 是否可以修改权限 */
  canModifyPowerLevels: boolean
  /** 是否为房间管理员 */
  isAdmin: boolean
  /** 是否为房间所有者 */
  isOwner: boolean
}

export interface RoomSettings {
  /** 房间ID */
  roomId: string
  /** 房间名称 */
  name: string
  /** 房间主题 */
  topic?: string
  /** 房间头像URL */
  avatarUrl?: string
  /** 房间别名列表 */
  aliases: string[]
  /** 规范别名 */
  canonicalAlias?: string
  /** 是否启用加密 */
  encryption: boolean
  /** 历史可见性 */
  historyVisibility: 'invited' | 'joined' | 'shared' | 'world_readable'
  /** 加入规则 */
  joinRule: 'public' | 'invite' | 'private' | 'knock' | 'restricted'
  /** 访客访问权限 */
  guestAccess: 'can_join' | 'forbidden'
  /** 房间版本 */
  roomVersion: string
  /** 创建时间 */
  createdAt: number
  /** 创建者 */
  creator: string
  /** 成员数量 */
  memberCount: number
  /** 权限设置 */
  powerLevels: PowerLevelsContent
}

export interface RoomManagementAction {
  /** 操作类型 */
  type: 'invite' | 'kick' | 'ban' | 'unban' | 'promote' | 'demote' | 'leave' | 'join'
  /** 目标用户ID */
  userId: string
  /** 房间ID */
  roomId: string
  /** 操作原因 */
  reason?: string
  /** 新的权限等级（用于promote/demote） */
  newPowerLevel?: number
}

export interface RoomSearchOptions {
  /** 搜索查询 */
  query?: string
  /** 房间类型过滤 */
  roomType?: 'all' | 'public' | 'private' | 'encrypted'
  /** 成员状态过滤 */
  membership?: 'join' | 'invite' | 'leave' | 'all'
  /** 排序方式 */
  sortBy?: 'name' | 'lastActivity' | 'memberCount' | 'createdAt'
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc'
  /** 分页大小 */
  limit?: number
  /** 分页偏移 */
  offset?: number
}

export interface RoomListResponse {
  /** 房间列表 */
  rooms: MatrixRoom[]
  /** 总数量 */
  total: number
  /** 是否有更多数据 */
  hasMore: boolean
  /** 下一页偏移 */
  nextOffset?: number
}

export interface RoomDiscoveryOptions {
  /** 服务器地址 */
  server?: string
  /** 搜索查询 */
  query?: string
  /** 最大结果数 */
  limit?: number
  /** 包含所有网络的房间 */
  includeAllNetworks?: boolean
  /** 第三方网络ID */
  thirdPartyInstanceId?: string
}

export interface DiscoveredRoom {
  /** 房间ID */
  roomId: string
  /** 房间别名 */
  alias?: string
  /** 房间名称 */
  name?: string
  /** 房间主题 */
  topic?: string
  /** 成员数量 */
  numJoinedMembers: number
  /** 是否为公开房间 */
  worldReadable: boolean
  /** 是否允许访客访问 */
  guestCanJoin: boolean
  /** 房间头像URL */
  avatarUrl?: string
  /** 加入规则 */
  joinRule?: string
}

// 事件相关类型
export interface RoomEventHandlers {
  onRoomCreated?: (room: MatrixRoom) => void
  onRoomJoined?: (roomId: string) => void
  onRoomLeft?: (roomId: string) => void
  onInviteReceived?: (invite: RoomInviteInfo) => void
  onInviteAccepted?: (roomId: string) => void
  onInviteDeclined?: (roomId: string) => void
  onMemberJoined?: (roomId: string, member: RoomMemberInfo) => void
  onMemberLeft?: (roomId: string, userId: string) => void
  onMemberBanned?: (roomId: string, userId: string) => void
  onPowerLevelChanged?: (roomId: string, userId: string, oldLevel: number, newLevel: number) => void
  onRoomUpdated?: (room: MatrixRoom) => void
}

// 搜索相关类型定义
export interface SearchResult<T = any> {
  /** 搜索结果序号 */
  index: number
  /** 搜索到的对象 */
  item: T
  /** 成员状态 (当搜索用户时使用) */
  status?: 'join' | 'invite' | 'leave' | 'ban' | 'knock' | 'indirect'
}

export interface UserSearchResult {
  /** 用户ID */
  userId: string
  /** 显示名称 */
  displayName?: string
  /** 头像URL */
  avatarUrl?: string
  /** 用户服务器域名 */
  serverName: string
  /** 是否已知用户（是否有过接触） */
  isKnown: boolean
  /** 搜索匹配度评分 */
  score?: number
  /** 成员状态 */
  membership?: 'join' | 'invite' | 'leave' | 'ban' | 'knock'
}

export interface RoomSearchResult {
  /** 房间ID */
  roomId: string
  /** 房间名称 */
  name: string
  /** 房间主题 */
  topic?: string
  /** 房间别名 */
  alias?: string
  /** 成员数量 */
  memberCount: number
  /** 是否加密 */
  isEncrypted: boolean
  /** 房间头像URL */
  avatarUrl?: string
  /** 服务器域名 */
  serverName: string
  /** 加入规则 */
  joinRule: 'public' | 'invite' | 'private' | 'knock' | 'restricted'
  /** 是否可以加入 */
  canJoin: boolean
  /** 搜索匹配度评分 */
  score?: number
}

export interface SpaceSearchResult {
  /** 空间ID */
  spaceId: string
  /** 空间名称 */
  name: string
  /** 空间主题 */
  topic?: string
  /** 成员数量 */
  memberCount: number
  /** 子房间数量 */
  childRoomCount: number
  /** 空间头像URL */
  avatarUrl?: string
  /** 服务器域名 */
  serverName: string
  /** 加入规则 */
  joinRule: 'public' | 'invite' | 'private' | 'knock' | 'restricted'
  /** 是否可以加入 */
  canJoin: boolean
  /** 搜索匹配度评分 */
  score?: number
}

export interface SearchOptions {
  /** 搜索查询字符串 */
  query: string
  /** 最大返回结果数 */
  limit?: number
  /** 是否包含本地已知的结果 */
  includeKnown?: boolean
  /** 是否包含远程服务器的结果 */
  includeRemote?: boolean
  /** 是否包含未加入的公开房间 */
  includeUnjoined?: boolean
  /** 是否包含所有服务器的结果（全网搜索） */
  includeAllServers?: boolean
  /** 指定搜索的服务器列表 */
  servers?: string[]
  /** 最小匹配分数 */
  minScore?: number
  /** 搜索超时时间（毫秒） */
  timeout?: number
}

// 用于判断对象类型的联合类型
export type SearchableItem = UserSearchResult | RoomSearchResult | SpaceSearchResult | MatrixUser | MatrixRoom

// 对象类型常量
export const ObjectType = {
  USER: 'user',
  ROOM: 'room', 
  SPACE: 'space',
  UNKNOWN: 'unknown'
} as const

export type ObjectType = typeof ObjectType[keyof typeof ObjectType]

// 错误类型
export interface RoomManagementError {
  code: string
  message: string
  details?: any
}

export type RoomManagementErrorCode = 
  | 'ROOM_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'USER_NOT_FOUND'
  | 'ALREADY_JOINED'
  | 'ALREADY_INVITED'
  | 'INVITE_NOT_FOUND'
  | 'INVALID_ROOM_ALIAS'
  | 'ROOM_CREATION_FAILED'
  | 'ENCRYPTION_NOT_SUPPORTED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

// 重新导出原有类型，保持向下兼容
import type { MatrixRoom, MatrixUser } from './matrix'
export type { MatrixRoom, MatrixUser }
