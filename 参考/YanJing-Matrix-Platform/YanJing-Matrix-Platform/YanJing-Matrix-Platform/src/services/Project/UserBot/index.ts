/**
 * Userbot WebSocket 服务模块
 * 
 * 提供基于房间成员识别 bot 的 WebSocket 流式通信能力
 */

export { userbotWebSocketService, UserbotWebSocketService } from './websocket'
export { useUserbotWebSocket } from './useUserbotWebSocket'

export {
	extractUserbotOptions,
	buildUserbotOptionSendPayload,
	resolveUserForOptionSendTODO,
} from './options'

export type { UserbotWsOptionsRaw, UserbotWsOptionSendPayload, ResolveUserForOptionSend } from './options'

export type {
	MatrixEventId,
	UserbotWsEventId,
	UserbotWsState,
	UserbotWsContentType,
	UserbotWsActivityContent,
	UserbotWsBareActivityMessage,
	UserbotWsContent,
	UserbotWsInboundAppending,
	UserbotWsInboundFinish,
	UserbotWsInboundOther,
	UserbotWsInboundMessage,
} from './types'
