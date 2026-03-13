<template>
	<div class="system-list">
		<section class="panel panel--missions">
			<header class="panel__header">
				<div class="panel__title">
					<span class="title">历史任务</span>
					<span class="meta" v-if="missions.length">共 {{ missions.length }} 个</span>
				</div>


				<div v-if="chatContext?.isMobile?.value" style="margin-left: auto;">
					<button class="back-list-btn" type="button" @click="assistantSidebarStore.switchToPanel('systemList1')"
						aria-label="切换面板">←</button>
				</div>


				<button class="add-task-btn" @click="showCreateDialog = true" title="新建任务">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
						stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
				</button>
			</header>
			<div class="panel__body">
				<ul v-if="missions.length" class="assistant-mission-list">
					<li v-for="mission in reversedMissions" :key="mission.room_id" class="assistant-mission-list__item"
						:class="{ 'assistant-mission-list__item--active': mission.room_id === selectedMissionId }"
						role="button" tabindex="0" @click="handleMissionClick(mission.room_id)"
						@contextmenu.prevent="handleContextMenu($event, mission)">
						<div class="indicator indicator--analysis"></div>
						<div class="content">
							<span class="title">{{ getRoomName(mission.room_id) }}</span>
							<span class="subtitle">{{ mission.stateData?.task?.topic || '' }}</span>
						</div>
						<span class="action-hint">{{ mission.updated_at || '未更新' }}</span>
					</li>
				</ul>
				<p v-else class="assistant-mission-empty">暂无任务记录</p>
			</div>
		</section>

		<!-- 新建任务弹窗 -->
		<CreateTaskDialog v-model="showCreateDialog" @submit-success="handleTaskCreated"
			@submit-error="handleTaskError" />

		<!-- 任务功能列表菜单 -->
		<TaskFunctionsList v-model:show="showTaskMenu" :position="menuPosition" :task-data="selectedTask"
			@redo-success="handleRedoSuccess" @redo-error="handleRedoError" />
	</div>
</template>

<script setup lang="ts">
import { inject, onMounted, watch, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAssistantSidebarStore } from '../../../../../stores/assistantSidebar'
import CreateTaskDialog from '../../../../../components/Task/CreateTaskDialog.vue'
import TaskFunctionsList from '../../../../../components/Task/TaskFunctionsList.vue'
import { userInfoManager } from '@/utils/userInfo'
import { addPrefixSuffix, removePrefixSuffix } from '../../../../../utils/stringUtils'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import { useTaskStore } from '../../../../../stores/task'
import { getTaskList } from '@/services/Project/ProjectStart/Project_Start'
import { openMessageDialog } from '@/components/MessageDialog/open';
const chatContext = inject('chatContext') as any
const assistantSidebarStore = useAssistantSidebarStore()
const { missions } = storeToRefs(assistantSidebarStore)

// 获取房间名称
const getRoomName = (roomId: string) => {
	const room = chatContext.rooms?.value?.find((r: any) => r.roomId === roomId)
	return room?.name || '未命名任务'
}

// 使用本地存储的当前房间ID
const selectedMissionId = computed(() => {
	const roomId = chatContext.currentRoomId?.value || null
	console.log('[SystemList2] selectedMissionId computed:', roomId)
	return roomId
})


// 新建任务弹窗状态
const showCreateDialog = ref(false)

// 右键菜单状态
const showTaskMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })
const selectedTask = ref<any>(null)

// 倒序显示任务列表（最新的在最上面）
const reversedMissions = computed(() => {
	return [...missions.value].reverse()
})

onMounted(() => {
	console.log('[SystemList2] 组件已挂载')
	console.log('[SystemList2] missions 数据:', missions.value)
	console.log('[SystemList2] chatContext:', chatContext)
})

watch(missions, (newVal) => {
	console.log('[SystemList2] missions 数据变化:', newVal)
}, { deep: true })

const handleMissionClick = (roomId: string) => {
	console.log('[SystemList2] 点击任务:', roomId)
	console.log('[SystemList2] 点击前状态:', {
		manualMode: assistantSidebarStore.manualMode,
		currentPanel: assistantSidebarStore.currentPanel,
		isAssistantRoomActive: assistantSidebarStore.isAssistantRoomActive
	})

	// 先设置面板状态，再切换房间（避免时序问题）
	assistantSidebarStore.openMission(roomId)

	console.log('[SystemList2] openMission后状态:', {
		manualMode: assistantSidebarStore.manualMode,
		currentPanel: assistantSidebarStore.currentPanel,
		selectedMissionId: assistantSidebarStore.selectedMissionId
	})

	// 切换到对应的任务房间
	if (roomId && chatContext?.setCurrentRoom) {
		chatContext.setCurrentRoom(roomId)
		console.log('[SystemList2] 调用 setCurrentRoom:', roomId)
	}
}

// 处理任务创建成功
const handleTaskCreated = async (data: any) => {
	console.log('[SystemList2] 任务创建成功,返回数据:', data)

	try {
		// 检查是否有 room_id
		if (!data?.room_id) {
			console.error('[SystemList2]  创建任务成功但未返回 room_id')
			return
		}

		// 1. 获取用户账号信息
		const from_account = addPrefixSuffix(
			userInfoManager.getLoginField("username"),
			"@",
			MATRIX_SERVER_URL_TAIL
		)
		const to_account = `${removePrefixSuffix(
			userInfoManager.getLoginField("username"),
			"@",
			MATRIX_SERVER_URL_TAIL
		)}userbot`

		// 2. 使用模板创建新任务对象
		const newTask: any = {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			from_account: from_account,
			room_id: data.room_id,
			application_id: "",
			to_account: to_account,
			stateData: {
				task: {
					title: data.task_name || "新任务",
					topic: ""
				},
				type: "deerflow"  // 修复：使用后端实际的类型值
			},
			session_id: data.session_id || "",
			other: {},
			agent_id: 0,
			id: Date.now(), // 使用时间戳作为临时 ID
			createdById: 1,
			updatedById: 1
		}

		console.log('[SystemList2]  创建的新任务对象:', newTask)

		// 3. 获取 TaskStore 实例
		const taskStore = useTaskStore()

		// 4. 获取当前任务列表并添加新任务
		const currentTaskList = [...taskStore.taskList]
		currentTaskList.push(newTask) // 添加到列表末尾（因为页面会倒序显示，末尾的会显示在最上面）

		// 5. 更新 Pinia store
		taskStore.setTaskList(currentTaskList)
		console.log('[SystemList2]  新任务已添加到 Pinia store')

		// 6. 更新 localStorage (通过 userInfoManager)
		const taskRoomIds = currentTaskList.map((task: any) => task.room_id).filter(Boolean)
		userInfoManager.addField('TASK_LIST', currentTaskList)
		userInfoManager.addField('TASK_ROOM_IDS', taskRoomIds)
		console.log('[SystemList2]  新任务已添加到 localStorage')
		console.log('[SystemList2]  当前任务列表数量:', currentTaskList.length)



		//6.5 重新调用一次 获取任务列表的接口，确保数据最新
		console.log('[SystemList2]  重新获取任务列表以确保数据最新...')
		await getTaskList()
		console.log('[SystemList2]  任务列表重新获取完成')






		// 7. 刷新房间列表 - 使用 chatContext 提供的 refreshRoomData 方法
		if (chatContext?.refreshRoomData) {
			console.log('[SystemList2]  开始刷新房间列表...')
			await chatContext.refreshRoomData()
			console.log('[SystemList2]  房间列表刷新成功')
		} else {
			console.warn('[SystemList2]  chatContext.refreshRoomData 方法不存在')
		}

		// 8. 延迟后跳转到新任务
		setTimeout(() => {
			console.log('[SystemList2]  跳转到新创建的任务房间:', data.room_id)
			handleMissionClick(data.room_id)
		}, 500) // 延迟500ms确保数据已刷新

	} catch (error) {
		console.error('[SystemList2]  处理任务创建结果失败:', error)
		// 即使处理失败,也尝试跳转到新任务
		if (data?.room_id) {
			handleMissionClick(data.room_id)
		}
	}
}

// 处理任务创建失败
const handleTaskError = (error: any) => {
	console.error('[SystemList2] 任务创建失败:', error)
}

// 处理右键菜单
const handleContextMenu = (event: MouseEvent, mission: any) => {
	console.log('[SystemList2] 右键点击任务:', mission)

	// 记录右键点击的任务数据
	selectedTask.value = mission

	// 设置菜单位置
	menuPosition.value = {
		x: event.clientX,
		y: event.clientY
	}

	// 显示菜单
	showTaskMenu.value = true
}

// 处理任务重做成功
const handleRedoSuccess = async (data: { room_id: string }) => {
	console.log('[SystemList2] 任务重做成功，返回数据:', data)

	try {
		// 检查是否有 room_id
		if (!data?.room_id) {
			console.error('[SystemList2]  重做任务成功但未返回 room_id')
			return
		}

		// 检查是否有原任务数据
		if (!selectedTask.value) {
			console.error('[SystemList2]  缺少原任务数据')
			return
		}

		console.log('[SystemList2]  原任务数据:', selectedTask.value)

		// 1. 获取用户账号信息
		const from_account = addPrefixSuffix(
			userInfoManager.getLoginField("username"),
			"@",
			MATRIX_SERVER_URL_TAIL
		)
		const to_account = `${removePrefixSuffix(
			userInfoManager.getLoginField("username"),
			"@",
			MATRIX_SERVER_URL_TAIL
		)}userbot`

		// 2. 从原任务复制数据，创建新任务对象
		const newTask: any = {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			from_account: from_account,
			room_id: data.room_id,  // 使用新的 room_id
			application_id: selectedTask.value.application_id || "",
			to_account: to_account,
			stateData: {
				task: {
					// 复制原任务的 title 和 topic
					title: selectedTask.value.stateData?.task?.title || "重做任务",
					topic: selectedTask.value.stateData?.task?.topic || ""
				},
				type: selectedTask.value.stateData?.type || "deerflow"
			},
			session_id: selectedTask.value.session_id,  // 后端说 session_id 相同
			other: selectedTask.value.other || {},
			agent_id: selectedTask.value.agent_id || 0,
			id: Date.now(), // 使用时间戳作为临时 ID
			createdById: selectedTask.value.createdById || 1,
			updatedById: selectedTask.value.updatedById || 1
		}

		console.log('[SystemList2]  创建的重做任务对象:', newTask)

		// 3. 获取 TaskStore 实例
		const taskStore = useTaskStore()

		// 4. 获取当前任务列表并添加新任务
		const currentTaskList = [...taskStore.taskList]
		currentTaskList.push(newTask) // 添加到列表末尾（因为页面会倒序显示，末尾的会显示在最上面）

		// 5. 更新 Pinia store
		taskStore.setTaskList(currentTaskList)
		console.log('[SystemList2]  新任务已添加到 Pinia store')

		// 6. 更新 localStorage (通过 userInfoManager)
		const taskRoomIds = currentTaskList.map((task: any) => task.room_id).filter(Boolean)
		userInfoManager.addField('TASK_LIST', currentTaskList)
		userInfoManager.addField('TASK_ROOM_IDS', taskRoomIds)
		console.log('[SystemList2]  新任务已添加到 localStorage')
		console.log('[SystemList2]  当前任务列表数量:', currentTaskList.length)

		// 6.5 重新调用一次 获取任务列表的接口，确保数据最新
		console.log('[SystemList2]  重新获取任务列表以确保数据最新...')
		await getTaskList()
		console.log('[SystemList2]  任务列表重新获取完成')

		// 7. 刷新房间列表 - 使用 chatContext 提供的 refreshRoomData 方法
		if (chatContext?.refreshRoomData) {
			console.log('[SystemList2]  开始刷新房间列表...')
			await chatContext.refreshRoomData()
			console.log('[SystemList2]  房间列表刷新成功')
		} else {
			console.warn('[SystemList2]  chatContext.refreshRoomData 方法不存在')
		}

		// 8. 延迟后跳转到新任务
		setTimeout(() => {
			console.log('[SystemList2]  跳转到重做后的任务房间:', data.room_id)
			handleMissionClick(data.room_id)
		}, 500) // 延迟500ms确保数据已刷新

	} catch (error) {
		console.error('[SystemList2]  重做任务后续处理失败:', error)
		openMessageDialog('任务重做成功，但更新列表失败，请手动刷新页面')
	}
}

// 处理任务重做失败
const handleRedoError = (error: any) => {
	console.error('[SystemList2] 任务重做失败:', error)
}
</script>

<style scoped>
.system-list {
	display: grid;

	gap: 12px;
	height: 100%;
	width: 100%;
	max-width: 100%;
	min-height: 0;
	position: relative;
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
	gap: 6px;
	font-size: var(--font-size-xs);
	font-weight: 500;
	color: var(--text-color);
	letter-spacing: 0.01em;
}

.panel__title .meta {
	background: var(--bg-color-third);
	color: var(--text-color);
	font-size: calc(var(--font-size-base) * 1.1);
	padding: 0 6px;
	border-radius: 999px;
	line-height: 18px;
}

.add-task-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border: none;
	background: var(--bg-color-secondary);
	color: var(--text-color);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;
	padding: 0;
	flex-shrink: 0;
}

.add-task-btn:hover {
	background: var(--color-primary, #3b82f6);
	color: white;
	transform: scale(1.05);
}

.add-task-btn:active {
	transform: scale(0.95);
}

.panel__body {
	flex: 1;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
}

.assistant-mission-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;
	height: 100%;
	overflow-y: auto;
}

.assistant-mission-list__item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px 10px;
	border-radius: 10px;
	transition: background-color 0.2s ease, color 0.2s ease;
	cursor: pointer;
}

.assistant-mission-list__item:hover,
.assistant-mission-list__item:focus-visible {
	background: var(--bg-color-secondary);
}

.assistant-mission-list__item--active {
	background: var(--color-primary-10, rgba(86, 120, 235, 0.12)) !important;
	color: var(--color-primary, #5a6ff0) !important;
	border-left: 3px solid var(--color-primary, #5a6ff0);
}

.assistant-mission-list__item--active .subtitle {
	color: currentColor;
	opacity: 0.85;
}

.indicator {
	width: 8px;
	height: 8px;
	border-radius: 999px;
	background: var(--text-color);
	opacity: 0.35;
	transition: opacity 0.2s ease;
}

.assistant-mission-list__item:hover .indicator,
.assistant-mission-list__item:focus-visible .indicator,
.assistant-mission-list__item--active .indicator {
	opacity: 0.75;
}

.indicator--analysis {
	background: #d07dd1;
}

.indicator--content {
	background: #6f9ceb;
}

.indicator--operation {
	background: #78c27d;
}

.content {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
	flex: 1;
}

.title {
	font-size: var(--font-size-xs);
	font-weight: 600;
	color: currentColor;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.subtitle {
	font-size: calc(var(--font-size-base) * 1.1);
	color: var(--text-color);
	opacity: 0.6;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.action-hint {
	font-size: var(--font-size-base);
	color: var(--text-color);
	opacity: 0.45;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.assistant-mission-empty {
	margin: 0;
	padding: 16px;
	font-size: var(--font-size-xs);
	color: var(--text-color);
	opacity: 0.6;
	text-align: center;
}

@media (max-width: 1024px) {
	.system-list {
		padding-left: 0;
	}
}

@media (max-width: 768px) {
	.assistant-mission-list__item {
		gap: 8px;
		padding: 6px 8px;
	}

	.action-hint {
		display: none;
	}

	.back-list-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 1px solid var(--border-color);
		background: var(--bg-color-secondary);
		color: var(--text-color);
		font-size: var(--font-size-lg);
		cursor: pointer;
		margin-right: 4px;
	}

	.back-list-btn:hover {
		background: var(--bg-color-hover);
	}
}
</style>
