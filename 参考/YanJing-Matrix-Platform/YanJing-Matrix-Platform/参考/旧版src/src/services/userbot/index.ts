/**
 * Userbot WebSocket 服务模块
 * 
 * 提供 AI 助手专属房间的 WebSocket 连接管理
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
