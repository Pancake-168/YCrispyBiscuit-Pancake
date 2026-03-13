/**
 * 嗯，这个文件用来统一放置一些必要触发函数，比如选择房间后需要进行的唤醒函数等
 */



/**
 * 就在这里写笔记了
 * 
 * 1. 创建房间或房间发生变动时，需调用
 *  refreshRoomState({
		showLoading: true,
		loadingText: '正在刷新房间列表...',
		preferredRoomId: newRoom.roomId,
	})








 */












import { matrixClient } from '@/services/Matrix/client'
import { userbotWebSocketService } from '@/services/Project/UserBot'
import { SystemStorageManager } from '@/utils/SystemStorage'
import router from '@/router'
import { useWechatStore } from '@/stores/WeChat'
import { useOrganizationStore } from '@/stores/Organization'
import { useSystemStore } from '@/stores/System'
import { useSidebarStore } from '@/stores/sidebar'
import { useIDmapStore } from '@/stores/IDmap'
import { useRoomMapStore } from '@/stores/RoomMap'
import { useRoomClassificationStore } from '@/stores/RoomClassification'
import { useUserBotStore } from '@/stores/UserBot'
import { useWebSocketStreamStore } from '@/stores/WebSocketStream'
import { useMatrixTimelineStore } from '@/stores/matrixTimeline'
import { useAppStore } from '@/stores/app'
import { useRoomDisplayStore } from '@/stores/RoomDisplay'
import { useBotRoomSendGateStore } from '@/stores/BotRoomSendGate'
import { EnsureBotInstanceV3 } from '@/services/Project/Ensure/Ensure'
import { Secretary } from '@/services/Project/Ensure/Ensure'
import { AcceptRoomInvite } from '@/services/Project/IM/Room'
import { getRoomMembersBe } from '@/services/Project/IM/Room'



export type LogoutCleanupOptions = {
	clearIndexedDB?: boolean
	redirectToLogin?: boolean
}

const resetBusinessStores = () => {
	const wechatStore = useWechatStore()
	const organizationStore = useOrganizationStore()
	const systemStore = useSystemStore()
	const sidebarStore = useSidebarStore()
	const idMapStore = useIDmapStore()
	const roomMapStore = useRoomMapStore()
	const roomClassificationStore = useRoomClassificationStore()
	const roomDisplayStore = useRoomDisplayStore()
	const botRoomSendGateStore = useBotRoomSendGateStore()
	const userBotStore = useUserBotStore()
	const streamStore = useWebSocketStreamStore()
	const timelineStore = useMatrixTimelineStore()
	const appStore = useAppStore()

	wechatStore.setSSOParams({
		state: '',
		sub: '',
		code: '',
		loginToken: undefined,
	})
	wechatStore.setMatrixSession(null)
	wechatStore.nocobaseSessions = {}
	wechatStore.setUserProfile(null)

	organizationStore.setOrganizationList([])
	organizationStore.currentOrganization = null
	organizationStore.orgTrees = new Map()
	organizationStore.flatMaps = new Map()
	organizationStore.applicationUsersByAppId = new Map()
	organizationStore.loadingSkeletons = new Set()
	organizationStore.expandedKeys = new Map()
	organizationStore.closeDropdown()

	systemStore.setSystemRooms([])
	systemStore.clearCurrentRoomIds()
	systemStore.SystemMessages = {}
	systemStore.clearReplyDraft()
	systemStore.clearEditDraft()
	systemStore.clearForwardSelection()
	systemStore.setCurrentFunction('Message')

	sidebarStore.resetSidebars()
	sidebarStore.closePageList()
	sidebarStore.setMessageMobilePanel('left')

	idMapStore.clear()
	roomMapStore.clear()
	roomClassificationStore.clearRoomClassificationState()
	roomDisplayStore.clearRoomDisplayState()
	botRoomSendGateStore.clearAllState()
	userBotStore.clearUserBot()
	streamStore.clearAllStreams()
	timelineStore.itemsByRoomId = {}
	timelineStore.unreadCountByRoomId = {}
	timelineStore.previewByRoomId = {}
	timelineStore.loadingByRoomId = {}

	appStore.setLoading(false)
}

/**
 * 0. 退出登录时清理函数
 */
export async function cleanupOnLogout(options?: LogoutCleanupOptions): Promise<void> {
	const clearIndexedDB = options?.clearIndexedDB ?? false
	const redirectToLogin = options?.redirectToLogin ?? false

	const wechatStore = useWechatStore()
	const usernameFromStore = wechatStore.userProfile?.username ?? null
	const usernameFromStorage = await SystemStorageManager.getUsername()
	const usernames = Array.from(new Set([usernameFromStore, usernameFromStorage].filter(Boolean) as string[]))

	userbotWebSocketService.disconnect()

	await matrixClient.UserLogout({ clearIndexedDB })

	await Promise.allSettled([
		SystemStorageManager.clearMatrixLoginConfig(),
		SystemStorageManager.clearLoginToken(),
		SystemStorageManager.clearMatrixAccessToken(),
		SystemStorageManager.clearMatrixLoginConfigRaw(),
		SystemStorageManager.clearAutoLoginCompleted(),
		SystemStorageManager.clearUserConfig(),
		SystemStorageManager.clearUsername(),
		...usernames.map((username) => SystemStorageManager.clearAllUserFields(username)),
	])

	resetBusinessStores()

	if (redirectToLogin && router.currentRoute.value.path !== '/login') {
		await router.replace('/login')
	}
}


/**
 * 1. 选择房间后，唤醒该房间内的所有bot
 */
export async function AfterSwitchRoom(roomId: string): Promise<void> {
	console.log(`[System:BeforeAndAfter:AfterSwitchRoom] 准备获取房间 ${roomId} 成员信息`)
	const roomMembersResult = await getRoomMembersBe(roomId)
	console.log(`[System:BeforeAndAfter:AfterSwitchRoom] 获取房间 ${roomId} 成员信息完成:`, roomMembersResult)
	const botAccounts = (roomMembersResult.ok && roomMembersResult.data
		? roomMembersResult.data
			.filter((member) => member.atype === 'bot' && !!member.username)
			.map((member) => member.username)
		: [])

	if (botAccounts.length > 0) {
		console.log(`[System:BeforeAndAfter:AfterSwitchRoom] 唤醒房间 ${roomId} 内的bot账号:`, botAccounts)
	} else {
		console.log(`[System:BeforeAndAfter:AfterSwitchRoom] 房间 ${roomId} 内没有需要唤醒的bot账号`)
	}
	
	for (const botUsername of botAccounts) {
		console.log(`[System:BeforeAndAfter:AfterSwitchRoom] 准备执行 EnsureBotInstanceV3，bot=${botUsername}`)
		await EnsureBotInstanceV3(botUsername)
		console.log(`[System:BeforeAndAfter:AfterSwitchRoom] EnsureBotInstanceV3 执行完成，bot=${botUsername}`)
	}

	




	




	try {
		console.log(`[System:BeforeAndAfter:AfterSwitchRoom] 准备执行 AcceptRoomInvite，房间 ${roomId}`)
		const acceptResult = await AcceptRoomInvite(roomId)
		console.log(`[System:BeforeAndAfter:AfterSwitchRoom] AcceptRoomInvite 执行完成，房间 ${roomId}:`, acceptResult)

		if (!acceptResult.ok) {
			console.warn(`[System:BeforeAndAfter:AfterSwitchRoom] AcceptRoomInvite 兜底失败，房间 ${roomId}:`, acceptResult)
		}
	} catch (error) {
		console.warn(`[System:BeforeAndAfter:AfterSwitchRoom] AcceptRoomInvite 执行异常，房间 ${roomId}:`, error)
	}


	const organizationStore = useOrganizationStore()

	try {
		console.log('[System:BeforeAndAfter:AfterSwitchRoom] 准备启动唤醒秘书')
		const result = await Secretary(organizationStore.currentOrganization?.app_id)
		console.log('[System:BeforeAndAfter:AfterSwitchRoom] 唤醒秘书执行完成:', result)
	} catch (error) {
		console.warn('[System:BeforeAndAfter:AfterSwitchRoom] 唤醒秘书执行异常:', error)
	}



}






