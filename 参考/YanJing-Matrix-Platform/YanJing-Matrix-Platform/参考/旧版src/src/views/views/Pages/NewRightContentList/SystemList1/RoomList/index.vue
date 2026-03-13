<template>
	<div class="room-list">
		<div v-if="loading" class="room-list__placeholder">房间加载中…</div>
		<template v-else-if="sortedRooms.length">
				<ul class="room-list__items">
					<li
						v-for="room in sortedRooms"
						:key="room.roomId"
						class="room-list__item"
						:class="{
							active: room.roomId === currentRoomId,
							// 未读房间
							unread: room.unreadCount && room.unreadCount > 0 && room.roomId !== currentRoomId,
							// 邀请中的房间：视觉上也归类到未读一类
							invite: room.membership === 'invite'
						}"
						@click="emitSelect(room.roomId)"
					>
					<div class="avatar">
						<span>{{ getInitials(room.name) }}</span>
					</div>
					<div class="info">
						<div class="info__header">
							<span class="name" :title="room.name">{{ room.name }}</span>
							<span class="time" :title="formatFullTime(room.lastActivity)">{{
								formatTime(room.lastActivity) }}</span>
						</div>
						<p v-if="formatSummary(room)" class="summary" :title="formatSummary(room)">
							{{ formatSummary(room) }}
						</p>
					</div>
					<div class="meta">
						<span v-if="room.unreadCount && room.unreadCount > 0" class="badge">{{
							formatUnread(room.unreadCount) }}</span>
					</div>
				</li>
			</ul>
		</template>
		<div v-else class="room-list__placeholder">暂无房间，请先加入或创建一个房间</div>
	</div>
</template>

<script setup lang="ts">
import { computed, toRefs, watch } from 'vue'
import { getAssistantRoomIdFromProfile } from '@/utils/assistantRoom'
import { useTaskStore } from '@/stores/task'
import { useAssistantSidebarStore } from '@/stores/assistantSidebar'
import type { MatrixRoom } from '../../../../../../types'

const props = withDefaults(defineProps<{
	rooms: MatrixRoom[]
	currentRoomId?: string
	loading?: boolean
}>(), {
	rooms: () => [],
	currentRoomId: '',
	loading: false
})

const emit = defineEmits<{
	selectRoom: [roomId: string]
}>()

const { currentRoomId, loading } = toRefs(props)

// 使用 Pinia store 获取任务数据（业务逻辑）
const taskStore = useTaskStore()
const assistantSidebarStore = useAssistantSidebarStore()

const sortedRooms = computed(() => {
	// 获取需要排除的房间ID列表
	const assistantRoomId = getAssistantRoomIdFromProfile() // 唤醒房间（保持原有逻辑）
	const taskRoomIds = taskStore.taskRoomIds // 任务房间列表（从 Pinia 读取）
	const extraBotRoomIds = assistantSidebarStore.noTaskButUserBotRoomIds || []

	const excludeRoomIds = [assistantRoomId, ...taskRoomIds, ...extraBotRoomIds].filter(Boolean)

	console.log('[RoomList] 过滤房间 - 排除列表:', excludeRoomIds)
	console.log('[RoomList] 过滤前房间数:', props.rooms.length)

	// 过滤：确保 room 和 roomId 存在，且不在排除列表中
	const filtered = [...props.rooms].filter(room => {
		if (!room || !room.roomId) return false
		return !excludeRoomIds.includes(room.roomId)
	})

	// 排序规则：
	// 1. 邀请中房间（membership === 'invite'）优先
	// 2. 其余房间按 lastActivity 倒序
	const sorted = filtered.sort((a, b) => {
		const aInvite = a.membership === 'invite'
		const bInvite = b.membership === 'invite'

		// 邀请房间排在最前面
		if (aInvite && !bInvite) return -1
		if (!aInvite && bInvite) return 1

		// 都是邀请房间或都不是邀请房间时，按最后活动时间倒序
		const aTime = a.lastActivity || 0
		const bTime = b.lastActivity || 0
		return bTime - aTime
	})

	console.log('[RoomList] 过滤后房间数:', sorted.length)

	return sorted
})

// 监听 props.rooms 变化，如果数据更新时 taskRoomIds 为空，给出警告
watch(() => props.rooms, (newRooms) => {
	if (newRooms.length > 0) {
		const currentTaskRoomIds = taskStore.taskRoomIds
		if (!currentTaskRoomIds || currentTaskRoomIds.length === 0) {
			console.log('[RoomList]  注意: 房间列表已更新，但任务房间ID列表为空，可能尚未加载完成')
		}
	}
}, { immediate: false })

const emitSelect = (roomId: string) => {
	if (!roomId) return
	emit('selectRoom', roomId)
}

const getInitials = (name?: string) => {
	if (!name) return '#'
	const trimmed = name.trim()
	if (!trimmed) return '#'
	if (/^[\u4e00-\u9fa5]/.test(trimmed)) {
		return trimmed.charAt(0)
	}
	return trimmed.charAt(0).toUpperCase()
}

const formatTime = (timestamp?: number) => {
	if (!timestamp) return '—'
	const diff = Date.now() - timestamp
	const minute = 60 * 1000
	const hour = 60 * minute
	const day = 24 * hour

	if (diff < minute) return '刚刚'
	if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
	if (diff < day) return `${Math.floor(diff / hour)} 小时前`

	const date = new Date(timestamp)
	return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatFullTime = (timestamp?: number) => {
	if (!timestamp) return '暂无时间记录'
	return new Date(timestamp).toLocaleString()
}

const formatSummary = (room: MatrixRoom) => {
	const event = room.lastEvent
	const message = room.lastMessage

	if (event && event.description) {
		return event.description.trim()
	}

	if (message) {
		const content = message.formattedBody || message.content || ''
		return content.trim()
	}

	return ''
}

const formatUnread = (count: number) => {
	if (count > 99) return '99+'
	return String(count)
}
</script>

<style scoped>
.room-list {
	height: 100%;
	width: 100%;
	min-width: 0;
	overflow: hidden;
}


.room-list__items {
	list-style: none;
	margin: 0;
	padding: 0;
	overflow-y: auto;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding-right: 2px;
}



.room-list__item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 6px 8px;
	border-radius: 8px;
	background: transparent;
	cursor: pointer;
	position: relative;
	transition: background-color 0.2s ease;
}


.room-list__item:hover,
.room-list__item:focus-visible {
	background: var(--bg-color-secondary);
}

.room-list__item.active {
	background: var(--color-primary-10, rgba(86, 120, 235, 0.12)) !important;
	color: var(--color-primary, #5a6ff0) !important;
	border-left: 3px solid var(--color-primary, #5a6ff0);
}

.room-list__item.unread .name {
	font-weight: 600;
	color: var(--text-color);
}

.room-list__item.unread,
.room-list__item.invite {
	background: var(--color-warning-light, rgba(255, 159, 67, 0.12));
}

.room-list__item.unread::before,
.room-list__item.invite::before {
	content: '';
	position: absolute;
	left: 6px;
	top: 10px;
	bottom: 10px;
	width: 2px;
	border-radius: 999px;
	background: var(--color-warning, #ff9f43);
	box-shadow: 0 0 8px rgba(255, 159, 67, 0.35);
}

.avatar {
	width: 32px;
	height: 32px;
	background: var(--bg-color-secondary);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: var(--font-size-xs);
	font-weight: 600;
	color: var(--text-color);
	border-radius: 8px;
	transition: background-color 0.2s ease, color 0.2s ease;
}

.room-list__item.unread .avatar {
	background: rgba(255, 159, 67, 0.12);
	color: var(--color-warning, #ff9f43);
}

.info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.info__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 6px;
}


.name {
	font-size: var(--font-size-xs);
	font-weight: 500;
	color: var(--text-color);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.room-list__item.active .name {
	color: var(--text-color);
}

.time {
	font-size: var(--font-size-base);
	color: var(--text-color);
	opacity: 0.6;
	white-space: nowrap;
}

.summary {
	margin: 0;
	font-size: calc(var(--font-size-base) * 1.1);
	color: var(--text-color);
	opacity: 0.65;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}


.meta {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	min-width: 32px;
}

.badge {
	min-width: 18px;
	padding: 0 6px;
	height: 18px;
	border-radius: 999px;
	background: var(--color-warning, #ff9f43);
	color: #fff;
	font-size: calc(var(--font-size-base) * 1.1);
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.room-list__item.unread .badge {
	transform: translateX(0);
}

.room-list__placeholder {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 10px;
	text-align: center;
	color: var(--text-color);
	opacity: 0.6;
	font-size: var(--font-size-xs);
}
</style>
