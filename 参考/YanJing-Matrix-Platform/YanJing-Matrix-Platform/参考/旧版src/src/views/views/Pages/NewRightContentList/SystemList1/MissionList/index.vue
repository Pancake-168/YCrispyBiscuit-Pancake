<template>
	<div class="mission-list">
		<ul class="mission-list__items">
			<li v-for="mission in missions" :key="mission.id" class="mission-list__item"
				@click="handleMissionClick(mission)" role="button" tabindex="0"
				@keydown.enter.prevent="handleMissionClick(mission)"
				@keydown.space.prevent="handleMissionClick(mission)">
				<div class="indicator" :class="mission.indicator"></div>
				<div class="content">
					<span class="title">
						{{ mission.title }}
						<span v-if="mission.id === 'ai-assistant' && assistantBadge" class="mission-badge">
							{{ assistantBadge }}
						</span>
					</span>
					<span class="subtitle">{{ mission.subtitle }}</span>
				</div>
				<span class="action-hint">待配置</span>
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { storeToRefs } from 'pinia'
import { getAssistantRoomIdFromProfile } from '@/utils/assistantRoom'
import { useAssistantSidebarStore } from '../../../../../../stores/assistantSidebar'

interface MissionItem {
	id: string
	title: string
	subtitle: string
	indicator: string
}

const missions: MissionItem[] = [
	{
		id: 'ai-assistant',
		title: 'AI助手',
		subtitle: '智能协作入口',
		indicator: 'indicator--ai'
	},
	{
		id: 'documents',
		title: '文档',
		subtitle: '知识库与项目资料',
		indicator: 'indicator--docs'
	}

]

const chatContext = inject('chatContext') as any
const assistantSidebarStore = useAssistantSidebarStore()
const { assistantBadge } = storeToRefs(assistantSidebarStore)

const emit = defineEmits<{
	(e: 'open-documents'): void
}>()

const handleMissionClick = (mission: MissionItem) => {
	if (mission.id === 'ai-assistant') {
		const roomId = getAssistantRoomIdFromProfile()
		if (roomId && chatContext?.setCurrentRoom) {
			chatContext.setCurrentRoom(roomId)
		} else {
			console.warn('[MissionList] 未找到个人助手房间，稍后将自动创建。')
		}
		return
	}

	if (mission.id === 'documents') {
		emit('open-documents')
		return
	}
	// 其他任务占位
}
</script>

<style scoped>
.mission-list {
	height: 100%;
	width: 100%;
	min-width: 0;
	overflow: hidden;
}

.mission-list__items {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
	height: 100%;
	overflow-y: auto;
}

.mission-list__item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 6px 8px;
	border-radius: 8px;
	background: transparent;
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.mission-list__item:hover,
.mission-list__item:focus-visible {
	background: var(--bg-color-secondary);
}

.mission-list__item:active {
	background: rgba(255, 255, 255, 0.06);
}

.indicator {
	width: 6px;
	height: 6px;
	border-radius: 999px;
	background: var(--text-color);
	opacity: 0.35;
	transition: opacity 0.2s ease;
}

.mission-list__item:hover .indicator,
.mission-list__item:focus-visible .indicator {
	opacity: 0.65;
}

.indicator--docs {
	background: #6f9ceb;
}

.indicator--schedule {
	background: #78c27d;
}

.indicator--ai {
	background: #d07dd1;
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
	color: var(--text-color);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.mission-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-left: 6px;
	padding: 0 6px;
	height: 18px;
	border-radius: 999px;
	font-size: calc(var(--font-size-base) * 1.1);
	font-weight: 600;
	color: #fff;
	background: var(--color-warning, #ff9f43);
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
	letter-spacing: 0.12em;
	text-transform: uppercase;
}

@media (max-width: 768px) {
	.mission-list__item {
		padding: 6px;
	}

	.subtitle,
	.action-hint {
		display: none;
	}
}
</style>
