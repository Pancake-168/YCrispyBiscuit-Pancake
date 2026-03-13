import { matrixClient } from '@/services/Matrix/client'
import { EventType, MsgType } from 'matrix-js-sdk'
import type { RoomMessageEventContent } from 'matrix-js-sdk/lib/@types/events'
import type { MatrixMessageItem } from '@/types/message'

type ForwardBundleItem = {
  type: string
  senderName?: string
  senderId?: string
  content: string
  fileName?: string
  url?: string
  replyToEventId?: string
  forwardBundle?: MatrixMessageItem['forwardBundle']
}

/**
 * 发送转发消息合集。
 * 输入：targetRoomIds、sourceRoomId、messages。
 * 输出：Promise<void>。
 * 逻辑：构造 forward bundle 自定义字段并在目标房间发送 m.room.message。
 */
export async function forwardMessageBundle(
  targetRoomIds: string[],
  sourceRoomId: string,
  messages: MatrixMessageItem[],
): Promise<void> {
  const client = matrixClient.getAuthedClient()
  if (!client) throw new Error('Matrix 客户端未初始化')
  if (!targetRoomIds.length) return

  const items: ForwardBundleItem[] = messages.map((msg) => ({
    type: msg.type,
    senderName: msg.senderName,
    senderId: msg.senderId,
    content: msg.content,
    fileName: msg.fileName,
    url: msg.url,
    replyToEventId: msg.replyToEventId,
    forwardBundle: msg.forwardBundle,
  }))

  const content: RoomMessageEventContent & Record<string, unknown> = {
    msgtype: MsgType.Text,
    body: `转发消息（${items.length} 条）`,
    format: 'org.matrix.custom.html',
    formatted_body: `转发消息（${items.length} 条）`,
    'com.yanjing.forward_bundle': {
      sourceRoomId,
      sourceEventIds: messages.map((m) => m.id),
      items,
    },
  }

  for (const roomId of targetRoomIds) {
    await client.sendEvent(roomId, EventType.RoomMessage, content)
  }
}