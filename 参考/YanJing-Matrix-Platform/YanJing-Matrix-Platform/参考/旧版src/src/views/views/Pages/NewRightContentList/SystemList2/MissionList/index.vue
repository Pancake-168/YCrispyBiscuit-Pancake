<template>
	<div class="assistant-mission-list">
		<ul class="assistant-mission-list__items">
			<li
				v-for="mission in assistantMissions"
				:key="mission.id"
				class="assistant-mission-list__item"
				role="button"
				tabindex="0"
			>
				<div class="indicator" :class="mission.indicator"></div>
				<div class="content">
					<span class="title">{{ mission.title }}</span>
					<span class="subtitle">{{ mission.subtitle }}</span>
				</div>
				<span class="action-hint">待对接</span>
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
interface AssistantMissionItem {
	id: string
	title: string
	subtitle: string
	indicator: string
}

const assistantMissions: AssistantMissionItem[] = [
	{
		id: '任务记录1',
		title: '任务记录1',
		subtitle: 'XXXXXXX',
		indicator: 'XXXXXXXXXXXXXX'
	},
	{
		id: '任务记录2',
		title: '任务记录2',
		subtitle: 'XXXXXXX',
		indicator: 'XXXXXXXXXXXXXX'
	},
	{
		id: '任务记录3',
		title: '任务记录3',
		subtitle: 'XXXXXXX',
		indicator: 'XXXXXXXXXXXXXX'
	},
]
</script>

<style scoped>
.assistant-mission-list {
	height: 100%;
	width: 100%;
	min-width: 0;
	overflow: hidden;
}

.assistant-mission-list__items {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
	height: 100%;
	overflow-y: auto;
}

.assistant-mission-list__item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 6px 8px;
	border-radius: 8px;
	background: transparent;
	transition: background-color 0.2s ease;
}

.assistant-mission-list__item:hover,
.assistant-mission-list__item:focus-visible {
	background: var(--bg-color-secondary);
}

.indicator {
	width: 6px;
	height: 6px;
	border-radius: 999px;
	background: var(--text-color);
	opacity: 0.35;
	transition: opacity 0.2s ease;
}

.assistant-mission-list__item:hover .indicator,
.assistant-mission-list__item:focus-visible .indicator {
	opacity: 0.65;
}

.indicator--ai {
	background: #d07dd1;
}

.indicator--docs {
	background: #6f9ceb;
}

.indicator--schedule {
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
	color: var(--text-color);
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
	letter-spacing: 0.12em;
	text-transform: uppercase;
}

@media (max-width: 768px) {
	.assistant-mission-list__item {
		padding: 6px;
	}

	.subtitle,
	.action-hint {
		display: none;
	}
}
</style>
