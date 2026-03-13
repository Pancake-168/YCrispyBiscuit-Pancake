import type { EventStatus } from 'matrix-js-sdk'

export type MatrixMessageType =
  | 'm.text'    // 纯文本消息
  | 'm.image'   // 图片消息  
  | 'm.file'    // 文件消息
  | 'm.audio'   // 音频消息
  | 'm.video'   // 视频消息
  | 'm.system'  // 系统事件消息



export interface MatrixMessageItem {
  id: string
  roomId: string
  senderId: string
  senderName?: string
  timestamp: number
  timeText: string
  content: string
  formattedBody?: string
  format?: string
  type: MatrixMessageType
  status?: EventStatus | 'sent' | null
  replyToEventId?: string
  forwardBundle?: ForwardBundle
  url?: string
  rawMxcUrl?: string
  fileName?: string
  fileSize?: string
  mimetype?: string
}

export interface ForwardBundleItem {
  type: MatrixMessageType
  senderName?: string
  senderId?: string
  content: string
  fileName?: string
  url?: string
  replyToEventId?: string
  forwardBundle?: ForwardBundle
}

export interface ForwardBundle {
  sourceRoomId: string
  sourceEventIds: string[]
  items: ForwardBundleItem[]
}

export interface MessageSearchOptions {
  roomId?: string
  includeSystem?: boolean
  caseSensitive?: boolean
  limit?: number
}

export interface MessageSearchResult {
  roomId: string
  roomName: string
  messageId: string
  senderId: string
  senderName: string
  type: MatrixMessageType
  timestamp: number
  timeText: string
  content: string
  snippet: string
}
