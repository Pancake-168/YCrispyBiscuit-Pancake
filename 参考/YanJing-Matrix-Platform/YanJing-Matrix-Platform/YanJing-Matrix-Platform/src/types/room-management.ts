export type RoomMembership = 'join' | 'invite' | 'leave' | 'ban' | 'knock'

export interface RoomMemberInfo {
  userId: string
  username?: string
  displayName?: string
  avatarUrl?: string
  membership: RoomMembership
  powerLevel: number
  isCurrentUser: boolean
}

export interface RoomPermissions {
  canInvite: boolean
  canKick: boolean
  canBan: boolean
  canSendMessages: boolean
  canSendStateEvents: boolean
  canRedact: boolean
  canModifyRoom: boolean
  canModifyPowerLevels: boolean
  isAdmin: boolean
  isOwner: boolean
}

export interface UserSearchResult {
  username: string
  atype: string
  im: string
  nickname: string
}

export interface CreateNormalRoomOptions {
  name?: string
  topic?: string
  avatarMxcUrl?: string
  defaultSpaceRoomId?: string
  defaultSpaceVia?: string[]
  inviteUserIds?: string[]
  isFederated?: boolean
}

export interface CreateNormalRoomResult {
  roomId: string
}
