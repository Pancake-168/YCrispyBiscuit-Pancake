<template>
	<div class="member-list">
		<div v-if="loading" class="member-list__placeholder">联系人加载中…</div>
		<div v-else-if="!contacts.length" class="member-list__placeholder">暂无联系人</div>
		<ul v-else class="member-list__items">
				<li v-for="contact in contacts" :key="contact.userId" class="member-list__item" :title="getContactDisplayName(contact)" @click="handleContactClick(contact)">
				<div class="avatar">
						<span>{{ getInitials(getContactDisplayName(contact)) }}</span>
				</div>
				<div class="info">
						<span class="name">{{ getContactDisplayName(contact) }}</span>
					<span v-if="contact.lastActive" class="meta">{{ formatTime(contact.lastActive) }}</span>
				</div>
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'
import { showUserProfileCard } from '@/components/UserProfileCard/showUserProfileCard'
import { resolveUserDisplayName } from '@/utils/displayName'

interface ContactItem {
	userId: string
	displayName?: string
	avatarUrl?: string
	lastActive?: number
}

const props = withDefaults(defineProps<{
	contacts: ContactItem[]
	loading?: boolean
}>(), {
	contacts: () => [],
	loading: false
})

const { contacts, loading } = toRefs(props)

const getContactDisplayName = (contact: ContactItem) =>
	resolveUserDisplayName({ matrixId: contact.userId, matrixDisplayName: contact.displayName || null })

const handleContactClick = (contact: ContactItem) => {
	if (contact.userId) {
		showUserProfileCard(contact.userId)
	}
}

const getInitials = (name: string) => {
	if (!name) return '?'
	const trimmed = name.trim()
	if (!trimmed) return '?'

	if (/^[\u4e00-\u9fa5]/.test(trimmed)) {
		return trimmed.charAt(0)
	}

	const parts = trimmed.split(/[\s_\-]+/).filter(Boolean)
	const initials = parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('')
	return initials || trimmed.charAt(0).toUpperCase()
}

const formatTime = (timestamp: number) => {
	if (!timestamp) return '刚刚'
	const diff = Date.now() - timestamp
	const minute = 60 * 1000
	const hour = 60 * minute
	const day = 24 * hour

	if (diff < minute) return '刚刚在线'
	if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
	if (diff < day) return `${Math.floor(diff / hour)} 小时前`

	const date = new Date(timestamp)
	return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped>
.member-list {
	height: 100%;
	width: 100%;
	min-width: 0;
	overflow: hidden;
}

.member-list__placeholder {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var( --text-color);
	opacity: 0.6;
	font-size: var(--font-size-xs);
	text-align: center;
	padding: 10px;
}

.member-list__items {
	list-style: none;
	margin: 0;
	padding: 0;
	overflow-y: auto;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.member-list__item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 6px 8px;
	border-radius: 8px;
	background: transparent;
	transition: background-color 0.2s ease;
	position: relative;
	cursor: pointer;
}

.member-list__item:hover,
.member-list__item:focus-visible {
	background: var(--bg-color-secondary);
}

.avatar {
	width: 32px;
	height: 32px;
	border-radius: 32px;
	background: var(--bg-color-secondary);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--text-color);
	font-weight: 600;
	font-size: var(--font-size-xs);
}

.info {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.name {
	font-size: var(--font-size-xs);
	font-weight: 500;
	color: var(--text-color);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.meta {
	font-size: var(--font-size-base);
	color: var( --text-color);
	opacity: 0.6;
}
</style>
