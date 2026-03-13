<template>
  <div class="dialog-mask yj-dialog-mask" role="dialog" aria-modal="true" aria-label="全局搜索" @click.self="close">
    <div class="dialog yj-dialog-content">
      <div class="dialog-header">
        <div class="dialog-title">全局搜索</div>
       
      </div>

      <div class="search-wrap">
        <span class="search-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.6667 11.6666L14.6667 14.6666" stroke="#8C8C8C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M13.3333 7.33337C13.3333 4.01967 10.647 1.33337 7.33333 1.33337C4.01962 1.33337 1.33333 4.01967 1.33333 7.33337C1.33333 10.6471 4.01962 13.3334 7.33333 13.3334C10.647 13.3334 13.3333 10.6471 13.3333 7.33337Z" stroke="#8C8C8C" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
        </span>
        <input
          ref="inputRef"
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="搜索人员或消息"
        />
      </div>

      <div class="dialog-body">
        <div v-if="!keyword.trim()" class="hint">输入关键词开始搜索</div>
        <div v-else-if="loading" class="hint">搜索中...</div>
        <template v-else>
          <div class="result-filter-row">
            <button
              class="result-filter-card"
              :class="{ active: activeSection === 'users' }"
              type="button"
              @click="switchSection('users')"
            >
              <span class="filter-title">人员</span>
              <span class="filter-count">{{ userResults.length }}</span>
            </button>
            <button
              class="result-filter-card"
              :class="{ active: activeSection === 'messages' }"
              type="button"
              @click="switchSection('messages')"
            >
              <span class="filter-title">消息</span>
              <span class="filter-count">{{ messageResults.length }}</span>
            </button>
          </div>

          <section v-show="activeSection === 'users'" class="result-section">
            <div class="section-title">人员 ({{ userResults.length }})</div>
            <div v-if="!userResults.length" class="empty">未找到人员</div>
            <button
              v-for="user in userResults"
              :key="user.im"
              class="result-item user-item"
              type="button"
              @click="selectUser(user)"
            >
              <UserSearchResultCore
                :avatar-url="user.avatarUrl"
                :fallback-text="getAvatarFallback(user)"
                :lines="getDisplayValues(user)"
                @avatar-error="handleAvatarError(user)"
              />
            </button>
          </section>

          <section v-show="activeSection === 'messages'" class="result-section">
            <div class="section-title">消息 ({{ messageResults.length }})</div>
            <div v-if="!messageResults.length" class="empty">未找到消息</div>
            <button
              v-for="message in messageResults"
              :key="message.messageId"
              class="result-item"
              type="button"
              @click="selectMessage(message)"
            >
              <div class="result-main">{{ message.snippet || message.content || '消息' }}</div>
              <div class="result-sub">{{ message.roomName }} · {{ message.senderName }}</div>
            </button>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MATRIX_SERVER_URL } from '@/apiUrls'
import { talkWithTargetAccount } from '@/composables/useTalkWithTargetAccount3'
import { refreshRoomState } from '@/services/Matrix/refreshRoomState'
import { searchMessages, searchUsers } from '@/services/Matrix/search'
import { useSystemStore } from '@/stores/System'
import type { MessageSearchResult } from '@/types/message'
import type { UserSearchResult } from '@/types/room-management'
import { createMatrixAvatarHelper } from '@/utils/matrixAvatar'
import UserSearchResultCore from '@/components/UserSearch/UserSearchResultCore.vue'

type UserSearchView = UserSearchResult & {
  avatarUrl?: string
}

const emit = defineEmits<{
  (e: 'close'): void
}>()

const keyword = ref('')
const loading = ref(false)
const userResults = ref<UserSearchView[]>([])
const messageResults = ref<MessageSearchResult[]>([])
const activeSection = ref<'users' | 'messages'>('users')
const inputRef = ref<HTMLInputElement | null>(null)
const systemStore = useSystemStore()
const avatarHelper = createMatrixAvatarHelper(MATRIX_SERVER_URL)
let runId = 0
const creatingTalk = ref(false)

const getAvatarFallback = (user: UserSearchView): string => {
  return avatarHelper.getFallbackText(user.nickname, user.username, user.im)
}

const getDisplayValues = (user: UserSearchView): string[] => {
  return [user.nickname || '-', user.username || '-', user.atype || '-']
}

const handleAvatarError = (user: UserSearchView) => {
  user.avatarUrl = undefined
}

let timer: ReturnType<typeof setTimeout> | null = null
watch(keyword, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    void runSearch()
  }, 180)
})

onMounted(() => {
  nextTick(() => inputRef.value?.focus())
})

onBeforeUnmount(() => {
  avatarHelper.dispose()
})

async function runSearch() {
  const query = keyword.value.trim()
  const current = ++runId
  if (!query) {
    userResults.value = []
    messageResults.value = []
    return
  }

  loading.value = true
  try {
    const [users, messages] = await Promise.all([
      searchUsers(query, { limit: 50 }),
      Promise.resolve(searchMessages(query, { limit: 200, includeSystem: false }))
    ])
    if (current !== runId) return
    const usersWithAvatar = await Promise.all(
      users.map(async (user) => ({
        ...user,
        avatarUrl: await avatarHelper.resolveAvatarUrl(user.im),
      }))
    )
    if (current !== runId) return
    userResults.value = usersWithAvatar
    messageResults.value = messages
  } finally {
    if (current === runId) {
      loading.value = false
    }
  }
}

function close() {
  emit('close')
}

async function selectUser(user: UserSearchView) {
  if (creatingTalk.value) return
  const username = user.username?.trim()
  if (!username) {
    close()
    return
  }

  creatingTalk.value = true
  try {
    const roomId = await talkWithTargetAccount(username)
    if (roomId) {
      await refreshRoomState({
        showLoading: true,
        loadingText: '正在进入对话...',
        preferredRoomId: roomId,
      })
    }
    close()
  } finally {
    creatingTalk.value = false
  }
}

function selectMessage(message: MessageSearchResult) {
  if (message.roomId) {
    systemStore.setCurrentSystemRoomId(message.roomId)
  }
  close()
}

function switchSection(section: 'users' | 'messages') {
  activeSection.value = section
}
</script>

<style scoped>
.dialog-mask {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--bg-color) 88%, transparent);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.dialog {
  width: min(760px, 92vw);
  height: 56vh;
  background: var(--panel-bg, #161a22);
  border: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
  border-radius: var(--radius-md);
  box-shadow: 0 20px 48px color-mix(in srgb, var(--bg-color) 72%, transparent);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.dialog-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--text-color);
}

.meta-copy {
  height: 28px;
  padding: 0 var(--space-sm);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: color-mix(in srgb, var(--glass-bg) 70%, transparent);
  color: var(--text-color);
  cursor: pointer;
}

.meta-copy:hover,
.meta-copy:focus-visible {
  border-color: color-mix(in srgb, var(--primary-color) 28%, transparent);
  background: color-mix(in srgb, var(--primary-color) 16%, var(--glass-bg));
  outline: none;
}

.search-wrap {
  position: relative;
  margin: var(--space-md) var(--space-lg) var(--space-sm) var(--space-lg);
}

.search-icon {
  position: absolute;
  left: var(--space-sm);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 var(--space-md) 0 calc(var(--space-lg) + var(--space-xs));
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: color-mix(in srgb, var(--glass-bg) 80%, transparent);
  color: var(--text-color);
  font-size: var(--font-sm);
}

.search-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--primary-color) 28%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 14%, transparent);
}

.dialog-body {
  flex: 1;
  overflow: auto;
  padding: var(--space-sm) var(--space-lg) var(--space-lg) var(--space-lg);
}

.result-filter-row {
  display: inline-flex;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.result-filter-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 116px;
  height: 40px;
  padding: 0 var(--space-md);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: color-mix(in srgb, var(--glass-bg) 75%, transparent);
  color: var(--text-muted);
  cursor: pointer;
}

.result-filter-card:hover,
.result-filter-card:focus-visible {
  border-color: color-mix(in srgb, var(--primary-color) 25%, transparent);
  outline: none;
}

.result-filter-card.active {
  border-color: color-mix(in srgb, var(--primary-color) 35%, transparent);
  background: color-mix(in srgb, var(--primary-color) 16%, var(--glass-bg));
  color: var(--text-color);
}

.filter-title {
  font-size: var(--font-xs);
}

.filter-count {
  font-size: var(--font-xs);
}

.result-section + .result-section {
  margin-top: var(--space-md);
}

.section-title {
  margin-bottom: var(--space-sm);
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.result-item {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-xs);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--glass-bg) 80%, transparent);
  color: var(--text-color);
  text-align: left;
  cursor: pointer;
}

.result-item:hover,
.result-item:focus-visible {
  border-color: color-mix(in srgb, var(--primary-color) 25%, transparent);
  background: color-mix(in srgb, var(--primary-color) 12%, var(--glass-bg));
  outline: none;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.result-main {
  font-size: var(--font-sm);
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-sub {
  margin-top: var(--space-xs);
  font-size: var(--font-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hint,
.empty {
  padding: var(--space-sm) 0;
  color: var(--text-muted);
  font-size: var(--font-xs);
}
</style>
