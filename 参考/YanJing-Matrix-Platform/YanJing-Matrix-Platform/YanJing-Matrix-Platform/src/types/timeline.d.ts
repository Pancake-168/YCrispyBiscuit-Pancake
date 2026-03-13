import type { EventStatus } from 'matrix-js-sdk'

export type MatrixTimelineItemType = 'message' | 'system'

export type MatrixSystemEventKind =
  | 'room.create'
  | 'member.join'
  | 'member.leave'
  | 'member.invite'
  | 'member.ban'
  | 'member.kick'

export interface MatrixTimelineItem {
  roomId: string
  eventId: string
  type: MatrixTimelineItemType
  systemKind?: MatrixSystemEventKind
  senderId?: string
  senderName?: string
  timestamp: number
  content: string
  rawType?: string
  status?: EventStatus | null
  isUnread?: boolean
}
