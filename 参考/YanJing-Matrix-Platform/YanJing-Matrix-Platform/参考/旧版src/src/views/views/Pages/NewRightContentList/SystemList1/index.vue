<template>
	<div class="system-list">




		<section class="panel panel--missions">
			<header class="panel__header">
				<div class="panel__title">
					<span class="title">系统</span>

				</div>
			</header>
			<div class="panel__body">
				<MissionList @open-documents="$emit('open-documents')" />
			</div>
		</section>




		<section class="panel panel--rooms">
			<header class="panel__header">
				<div class="panel__title">
					<span class="title">我的房间</span>
					<span v-if="roomCount" class="meta">{{ roomCount }}</span>
				</div>
				<!--button class="refresh-btn" type="button" :disabled="roomsLoading" @click="refreshRooms()">
					{{ roomsLoading ? '刷新中…' : '刷新' }}
				</button-->
				<div class="panel__title">
					
					<button @click="handleCreateRoom" class="create-btn" >
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="icon">
							<path
								d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12C22 13.1 21.1 14 20 14H14V20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20V14H4C2.9 14 2 13.1 2 12C2 10.9 2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z" />
						</svg>
					</button>



				</div>
			</header>
			<div class="panel__body">
				<RoomList :rooms="filteredRooms" :loading="roomsLoading" :current-room-id="currentRoomId"
					@select-room="handleSelectRoom" />
			</div>
		</section>





		<section class="panel panel--members">
			<header class="panel__header">
				<div class="panel__title">
					<span class="title">好友联系人</span>
					<span v-if="contactCount" class="meta">{{ contactCount }}</span>
				</div>
			</header>
			<div class="panel__body">
				<MemberList :contacts="contacts" :loading="membersLoading" />
			</div>
		</section>




	</div>
</template>

<script setup lang="ts">
import { inject, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { getAssistantRoomIdFromProfile } from '@/utils/assistantRoom'
import MemberList from './MemberList'
import MissionList from './MissionList'
import RoomList from './RoomList'
import { roomServiceV2 } from '../../../../../services/matrix/rooms'
import { matrixClientV2 } from '../../../../../services/matrix/client'
import { matrixEventManager } from '../../../../../services/matrix/eventManager'
import { MatrixEventType, type MatrixRoom } from '../../../../../types'
import { openNewCreateRoomDialog, setNewCreateRoomDialogCreatedHandler } from '@/components/RoomManagement/NewCreateSimpleRoomDialog/OpenNewCreateSimpleRoomDialog'
import { resolveUserDisplayName } from '@/utils/displayName'

interface ContactItem {
	userId: string
	displayName: string
	avatarUrl?: string
	lastActive?: number
}

const chatContext = inject('chatContext') as any

const rooms = ref<MatrixRoom[]>([])
const contacts = ref<ContactItem[]>([])
const roomsLoading = ref(false)
const membersLoading = ref(false)

const currentRoomId = computed(() => chatContext?.currentRoomId?.value ?? '')
const filteredRooms = computed(() => {
	const assistantRoomId = getAssistantRoomIdFromProfile()
	if (!assistantRoomId) {
		return rooms.value
	}
	return rooms.value.filter(room => room.roomId !== assistantRoomId)
})
const roomCount = computed(() => filteredRooms.value.length)
const contactCount = computed(() => contacts.value.length)

let refreshTimer: ReturnType<typeof setTimeout> | null = null
const subscriptions: string[] = []

const normalizeRooms = (roomList: MatrixRoom[]): MatrixRoom[] => {
	if (!Array.isArray(roomList)) {
		return []
	}

	return roomList
		.filter(room => room && room.type !== '空间')
		.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0))
}

const buildContactsFromRooms = (roomList: MatrixRoom[]) => {
	membersLoading.value = true

	try {
		const client = matrixClientV2.getAuthedClient()
		if (!client) {
			contacts.value = []
			return
		}

		const currentUserId = client.getUserId?.() || ''
		const contactMap = new Map<string, ContactItem>()

		roomList.forEach(room => {
			const matrixRoom = client.getRoom?.(room.roomId)
			if (!matrixRoom || typeof matrixRoom.getJoinedMembers !== 'function') {
				return
			}

			const joinedMembers = matrixRoom.getJoinedMembers()
			joinedMembers.forEach((member: any) => {
				if (!member) return
				if (member.userId === currentUserId) return
				if (member.membership !== 'join') return

				const displayName: string = resolveUserDisplayName({
					matrixId: member.userId,
					matrixDisplayName: member.name || null,
				})
				const lastActive = typeof member.getLastActiveTs === 'function'
					? member.getLastActiveTs()
					: member.events?.member?.getTs?.() || undefined

				const existing = contactMap.get(member.userId)
				if (!existing || (lastActive || 0) > (existing.lastActive || 0)) {
					contactMap.set(member.userId, {
						userId: member.userId,
						displayName,
						lastActive: lastActive || undefined
					})
				}
			})
		})

		contacts.value = Array.from(contactMap.values()).sort((a, b) => {
			const aTime = a.lastActive || 0
			const bTime = b.lastActive || 0
			if (aTime !== bTime) {
				return bTime - aTime
			}
			return a.displayName.localeCompare(b.displayName)
		})
	} catch (error) {
		console.warn('[SystemList] 构建联系人列表失败:', error)
		contacts.value = []
	} finally {
		membersLoading.value = false
	}
}

const refreshRooms = (withLoading = true) => {
	if (withLoading) {
		roomsLoading.value = true
	}

	try {
		const fetchedRooms = roomServiceV2.获取房间列表()
		const normalized = normalizeRooms(fetchedRooms)
		rooms.value = normalized
		buildContactsFromRooms(normalized)
	} catch (error) {
		console.error('[SystemList] 刷新房间失败:', error)
		rooms.value = []
	} finally {
		roomsLoading.value = false
	}
}

const scheduleRefresh = () => {
	if (refreshTimer) {
		clearTimeout(refreshTimer)
	}

	refreshTimer = setTimeout(() => {
		refreshRooms(false)
	}, 250)
}

const registerSubscriptions = () => {
	const events = [
		MatrixEventType.ROOM_SUMMARY_UPDATED,
		MatrixEventType.ROOM_JOINED,
		MatrixEventType.ROOM_LEFT,
		MatrixEventType.ROOM_UPDATED
	]

	events.forEach(eventType => {
		const id = matrixEventManager.subscribe(eventType, () => scheduleRefresh())
		subscriptions.push(id)
	})
}

const cleanupSubscriptions = () => {
	subscriptions.forEach(id => matrixEventManager.unsubscribe(id))
	subscriptions.length = 0
	if (refreshTimer) {
		clearTimeout(refreshTimer)
		refreshTimer = null
	}
}

const handleSelectRoom = (roomId: string) => {
	if (!roomId) return
	const selectRoom = chatContext?.setCurrentRoom
	if (typeof selectRoom === 'function') {
		selectRoom(roomId)
	}
}

// 新建房间：打开全局创建房间弹窗，并在创建成功后自动切换到该房间
const handleCreateRoom = () => {
	if (typeof chatContext?.setCurrentRoom === 'function') {
		setNewCreateRoomDialogCreatedHandler((roomId: string) => {
			try {
				chatContext.setCurrentRoom(roomId)
			} catch (e) {
				console.warn('[SystemList] 切换到新房间失败:', e)
			}
		})
	}
	openNewCreateRoomDialog()
}

onMounted(() => {
	refreshRooms()
	registerSubscriptions()
})

onBeforeUnmount(() => {
	cleanupSubscriptions()
})
</script>

<style scoped>
.system-list {
	display: grid;
	grid-template-rows: 0.9fr 1.5fr 1fr;
	grid-template-columns: 1fr;
	gap: 8px;
	height: 100%;
	width: 100%;
	max-width: 100%;
	min-height: 0;
	position: relative;
	margin-left: -6px;
	padding-left: 6px;

	background: var(--bg-color-third);
}

.system-list::before {
	content: '';
	position: absolute;
	top: 0;
	bottom: 0;
	left: -6px;
	width: 1px;
	background: var(--border-color);
	pointer-events: none;
}


.panel {
	background: var(--bg-color-third);

	display: flex;
	flex-direction: column;
	min-height: 0;
	min-width: 0;
	overflow: hidden;

	gap: 6px;
}

.panel__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}


.panel__title {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: var(--font-size-xs);
	font-weight: 500;
	color: var(--text-color);
	letter-spacing: 0.01em;
	margin-right: 10px;
}

.panel__title .meta {
	background: var(--bg-color-third);
	color: var(--text-color);
	font-size: calc(var(--font-size-base) * 1.1);
	padding: 0 6px;

	border-radius: 999px;
	line-height: 18px;
}

.panel__title .meta--hint {
	opacity: 0.6;
}

.panel__body {
	flex: 1;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
}

.refresh-btn {

	border-radius: 4px;
	background: var(--bg-color-third);
	color: var(--text-color);
	padding: 2px 6px;
	font-size: calc(var(--font-size-base) * 1.1);
	cursor: pointer;
	transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
	background: var(--bg-color-third);
	color: var(--text-color);

}

.refresh-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}







.create-btn {
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.create-btn:hover,
.create-btn.active {
  background: var(--border-color);
  color: var(--text-color);
}










@media (max-width: 1024px) {
	.system-list {
		grid-template-rows: repeat(3, minmax(160px, 1fr));
	}
}

@media (max-width: 768px) {
	.system-list {
		padding: 0;
		gap: 6px;
	}

	.panel {
		padding: 6px;
	}
}
</style>
