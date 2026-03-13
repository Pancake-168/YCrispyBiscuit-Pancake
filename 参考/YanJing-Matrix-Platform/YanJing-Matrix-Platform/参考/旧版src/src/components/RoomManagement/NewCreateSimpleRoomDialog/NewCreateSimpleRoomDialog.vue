<template>
  <div class="create-room-overlay" @click="closeDialog">
    <div class="create-room-dialog" @click.stop>
      <div class="dialog-header">
        <h3>创建房间</h3>
        <button @click="closeDialog" class="close-btn">×</button>
      </div>

      <div class="dialog-body">


        <div class="form-section">
          <label>
            房间名称
            <span class="optional"></span>
          </label>
          <input v-model="roomForm.name" type="text" placeholder="输入房间名称(可选)" :class="{ error: errors.name }" />
          <!--span class="hint">留空时系统会根据成员信息自动命名</span-->
          <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
        </div>

        <!--div class="form-section">
          <label>房间主题</label>
          <textarea v-model="roomForm.topic" placeholder="描述这个房间的用途（可选）" rows="2"></textarea>
        </div-->

        <!-- 房间别名已移除：只保留房间名称、主题和邀请功能 -->

        <div class="form-section">
          <label>房间可见性</label>
          <div class="radio-group">
            <div class="radio-option">
              <input type="radio" id="private" v-model="roomForm.visibility" value="private" />
              <div class="radio-label">
                <strong>私有房间</strong>
                <small>只有被邀请的用户才能加入</small>
              </div>
            </div>
            <div class="radio-option">
              <input type="radio" id="public" v-model="roomForm.visibility" value="public" />
              <div class="radio-label">
                <strong>公开房间</strong>
                <small>任何人都可以加入</small>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <label>邀请用户</label>
          <div class="search-container">
            <input v-model="inviteSearchQuery" type="text" placeholder="搜索人员或输入用户ID…"
              :class="{ error: inviteErrors.targetUserId }" @input="handleInviteSearchInput"
              @focus="showInviteSearchResults = true" />
            <div v-if="inviteSearching" class="search-loading">正在搜索…</div>
          </div>

          <!-- 搜索结果列表：对齐 TheBestSearch 的人员列表风格 -->
          <div v-if="showInviteSearchResults && inviteSearchQuery.trim()" class="search-results tbs-section">
            <ul v-if="inviteSearchResults.length > 0" class="tbs-list" role="listbox">
              <li v-for="result in inviteSearchResults" :key="result.item.userId" class="tbs-item"
                role="option" @click="selectInviteUser(result.item)">
                <div class="tbs-avatar" v-if="!result.item.avatarUrl">
                  {{ getUserAvatarText(result.item.displayName || '', result.item.userId || '') }}
                </div>
                <img v-else :src="result.item.avatarUrl" alt="头像" class="tbs-avatar" />
                <div class="tbs-item-main">
                  <div class="tbs-title">{{ result.item.displayName || result.item.userId }}</div>
                  <div class="tbs-sub">{{ result.item.userId }}</div>
                </div>
              </li>
            </ul>

            <!-- 手动输入选项：保留，但风格与列表统一 -->
            <div v-if="inviteSearchQuery.trim() && isValidMatrixId(inviteSearchQuery)" class="manual-input-section">
              <div class="results-header">手动输入</div>
              <div class="tbs-item manual-input" role="option" @click="selectManualInviteInput">
                <div class="tbs-avatar tbs-fallback">✏️</div>
                <div class="tbs-item-main">
                  <div class="tbs-title">使用输入的用户ID</div>
                  <div class="tbs-sub">{{ inviteSearchQuery.trim() }}</div>
                </div>
              </div>
            </div>

            <!-- 空态提示：与 TheBestSearch 文风接近，保留 MXID 提示信息 -->
            <div v-if="inviteSearchResults.length === 0 && !inviteSearching" class="tbs-empty no-results-text">
              <template v-if="isValidMatrixId(inviteSearchQuery)">
                <div>未在目录中找到该用户，但可以直接邀请。</div>
              </template>
              <template v-else>
                <div>没有找到匹配人员，建议使用完整 MXID，例如：@username:chat.zy-jn.org.cn</div>
              </template>
            </div>
          </div>

          <!-- 已选择待邀请用户列表 -->
          <div v-if="inviteList.length > 0" class="invite-list">
            <div v-for="user in inviteList" :key="user.userId" class="invite-item">
              <div class="user-avatar">
                <!-- <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="头像" /> -->
                <div class="default-avatar">{{ getUserAvatarText(user.displayName, user.userId) }}</div>
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.displayName || user.userId }}</div>
                <div class="user-id">{{ user.userId }}</div>
              </div>
              <button class="remove-btn" @click="removeInviteUser(user.userId)">✕</button>
            </div>
          </div>

          <span v-if="inviteErrors.targetUserId" class="error-text">{{ inviteErrors.targetUserId }}</span>
          <span class="hint">搜索用户或输入完整的用户ID</span>
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="closeDialog" class="cancel-btn">取消</button>
        <button @click="createRoom" :disabled="!canCreate || creating" class="create-btn">
          {{ creating ? '创建中...' : '创建房间' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { roomCreateServiceV2 as roomCreateService } from '@/services/rooms/room-create.service'
import { searchUsersDirectory } from '@/services/matrix/theBestSearch'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import { matrixClientV2 } from '@/services/matrix/client.ts'
import type { RoomCreateOptions } from '@/types/room-management.types'
import type { UserSearchResult, SearchResult } from '@/types/room-management.types'







const emit = defineEmits<{
  close: []
  created: [roomId: string]
}>()

// 响应式数据
const creating = ref(false)


const roomForm = ref<RoomCreateOptions>({
  name: '',
  topic: '',
  visibility: 'private',
  encryption: false, // 默认不加密
  historyVisibility: 'invited',
  joinRule: 'invite',
  guestAccess: 'forbidden',
  invites: [],
 })

const errors = ref<Record<string, string>>({})

// 新增：邀请用户搜索相关状态
const inviteSearchQuery = ref('')
const inviteSearching = ref(false)
const inviteSearchResults = ref<SearchResult<UserSearchResult>[]>([])
const showInviteSearchResults = ref(false)
const inviteErrors = ref<Record<string, string>>({})
const inviteList = ref<any[]>([])
const inviteSearchTimeout = ref<number | null>(null)

// 默认服务器后缀（用于 MXID / 房间 ID 兜底补全）
const defaultServerTail = (MATRIX_SERVER_URL_TAIL || '').replace(/^:+/, '')

// 计算属性



const canCreate = computed(() => {
  const nameValue = roomForm.value.name ?? ''
  const hasName = nameValue.trim().length > 0
  const hasFallbackMembers = (roomForm.value.invites?.length || 0) > 0

  return (hasName || hasFallbackMembers)
})

// 方法
const closeDialog = () => {
  emit('close')
}

const validateForm = () => {
  errors.value = {}

  const nameValue = roomForm.value.name ?? ''
  const hasName = nameValue.trim().length > 0
  const hasFallbackMembers = (roomForm.value.invites?.length || 0) > 0

  if (!hasName && !hasFallbackMembers) {
    errors.value.name = '请填写房间名称，或至少邀请一位成员'
  }

  // 别名字段已移除，只有名称需要校验

  return Object.keys(errors.value).length === 0
}

// 别名验证已移除

// 优化：移除未使用的手动添加邀请函数，使用搜索/选择邀请

const handleInviteSearchInput = async () => {
  inviteErrors.value = {}
  showInviteSearchResults.value = !!inviteSearchQuery.value.trim()
  if (!inviteSearchQuery.value.trim()) {
    inviteSearchResults.value = []
    inviteSearching.value = false
    return
  }
  if (inviteSearchTimeout.value) {
    clearTimeout(inviteSearchTimeout.value)
  }
  inviteSearchTimeout.value = setTimeout(async () => {
    await performInviteSearch(inviteSearchQuery.value.trim())
  }, 300) as unknown as number
}

const performInviteSearch = async (query: string) => {
  if (!query) return
  inviteSearching.value = true
  try {
    // 1. 目录搜索（与 TheBestSearch 一致）
    const results = await searchUsersDirectory(query, { limit: 25 })
    let peopleResults = results || []

    // 2. 若输入看起来像 MXID，但目录没有结果，则按 MXID 兜底探测（与 TheBestSearch 对齐）
    const term = query.trim()
    const atLike = term.startsWith('@')
    const looksLikeFullMxid = atLike && term.includes(':') && term.length > 3
    const looksLikeLocalMxid = atLike && !term.includes(':') && term.length > 1

    if ((looksLikeFullMxid || looksLikeLocalMxid) && (!peopleResults || peopleResults.length === 0)) {
      try {
        const client = matrixClientV2.getAuthedClient?.()
        // @ts-ignore
        const mxid = looksLikeLocalMxid && defaultServerTail ? `${term}:${defaultServerTail}` : term
        const profile = await client?.getProfileInfo?.(mxid)
        if (profile) {
          const item: UserSearchResult = {
            userId: mxid,
            displayName: (profile as any).displayname || mxid,
            avatarUrl: (profile as any).avatar_url || '',
            serverName: mxid.split(':')[1] || '',
            isKnown: false,
            score: 1,
          }
          const synthetic: SearchResult<UserSearchResult> = { index: -1, item }
          peopleResults = [synthetic]
        }
      } catch (_) {
        // 兜底探测失败时静默忽略，保持空结果
      }
    }

    inviteSearchResults.value = peopleResults
    showInviteSearchResults.value = true
  } catch (error) {
    inviteSearchResults.value = []
  } finally {
    inviteSearching.value = false
  }
}

const selectInviteUser = (user: UserSearchResult) => {
  if (inviteList.value.find(u => u.userId === user.userId)) return
  inviteList.value.push(user)




  if (!roomForm.value.invites) roomForm.value.invites = []
  roomForm.value.invites.push(user.userId)



  showInviteSearchResults.value = false
  inviteSearchQuery.value = ''
  inviteSearchResults.value = []
}

const selectManualInviteInput = () => {
  const userId = inviteSearchQuery.value.trim()
  if (!isValidMatrixId(userId)) return
  if (inviteList.value.find(u => u.userId === userId)) return
  inviteList.value.push({
    userId,
    displayName: userId,
    serverName: userId.split(':')[1] || '',
    isKnown: false
  } as UserSearchResult)
  if (!roomForm.value.invites) roomForm.value.invites = []
  roomForm.value.invites.push(userId)
  showInviteSearchResults.value = false
  inviteSearchQuery.value = ''
  inviteSearchResults.value = []
}

const removeInviteUser = (userId: string) => {
  const idx = inviteList.value.findIndex(u => u.userId === userId)
  if (idx > -1) inviteList.value.splice(idx, 1)
  if (roomForm.value.invites) {
    const index = roomForm.value.invites.indexOf(userId)
    if (index > -1) roomForm.value.invites.splice(index, 1)
  }
}

const createRoom = async () => {
  if (!validateForm() || creating.value) return

  creating.value = true
  try {
    console.log('[CreateSimpleRoomDialog] 开始创建房间:', roomForm.value)

    // 设置加入规则
    if (roomForm.value.visibility === 'public') {
      roomForm.value.guestAccess = 'can_join'
      roomForm.value.joinRule = 'public'
    } else {
      roomForm.value.guestAccess = 'forbidden'
      roomForm.value.joinRule = 'invite'
    }

   

    // 使用创建不加密房间的方法
    const room = await roomCreateService.创建不加密的房间(roomForm.value)




    emit('created', room.roomId)
    emit('close')

    alert(`房间创建成功！\n房间名称: ${room.name}\n房间ID: ${room.roomId}`)

  } catch (error: any) {
    console.error('[CreateSimpleRoomDialog] 创建房间失败:', error)
    alert(`创建房间失败: ${error.message}`)
  } finally {
    creating.value = false
  }
}

// 生命周期
onMounted(() => {
 
})

watch(
  () => [roomForm.value.name, roomForm.value.invites?.length],
  () => {
    if (errors.value.name) {
      const nameValue = roomForm.value.name ?? ''
      const hasName = nameValue.trim().length > 0
      const hasFallbackMembers = (roomForm.value.invites?.length || 0) > 0
      if (hasName || hasFallbackMembers) {
        delete errors.value.name
      }
    }
  }
)

const isValidMatrixId = (input: string): boolean => {
  const trimmed = input.trim()
  const matrixIdRegex = /^@[a-zA-Z0-9._=-]+:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return matrixIdRegex.test(trimmed)
}

// 头像首字母/首汉字逻辑
const getUserAvatarText = (name: string, userId: string) => {
  if (!name && userId) {
    const match = userId.match(/^@(.+?)[^:]*(:.*)?$/)
    if (match && match[1]) return match[1].charAt(0).toUpperCase()
    return userId.charAt(0).toUpperCase()
  }
  if (!name) return '?'
  // 中文优先
  if (/[ -\u007f]/.test(name.charAt(0)) === false) {
    return name.charAt(0)
  }
  return name.charAt(0).toUpperCase()
}
</script>

<style scoped>
.create-room-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal);
  padding: var(--space-lg);
}

.create-room-dialog {
  background: var(--bg-color-third);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  transition: var(--transition-colors);
}

.close-btn:hover {
  background: var(--bg-color-hover);
  color: var(--text-color);
}

.dialog-body {
  flex: 1;
  padding: var(--space-xl);
  overflow-y: auto;
}

.space-info {
  margin-bottom: var(--space-lg);
}

.space-badge {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-color-secondary);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  color: var(--text-color);
}

.space-icon {
  font-size: var(--font-size-lg);
}

.space-text {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.form-section {
  margin-bottom: var(--space-xl);
}

.form-section label {
  display: block;
  margin-bottom: var(--space-sm);
  color: var(--text-color);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
}

.form-section label.required::after {
  content: ' *';
  color: var(--color-error);
}

.optional {
  margin-left: var(--space-xxs, 4px);
  color: var(--text-color-secondary);
  font-weight: 400;
  font-size: var(--font-size-sm);
}

.form-section input,
.form-section textarea,
.form-section select {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-color);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-duration-fast) var(--transition-timing);
  box-sizing: border-box;
}

.form-section input:focus,
.form-section textarea:focus,
.form-section select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-section input.error {
  border-color: var(--color-error);
}

.form-section textarea {
  resize: vertical;
  font-family: inherit;
  min-height: 60px;
}

.alias-input-group {
  display: flex;
  align-items: center;
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  transition: border-color var(--transition-duration-fast) var(--transition-timing);
}

.alias-input-group:focus-within {
  border-color: var(--color-primary);
}

.alias-input-group input {
  border: none;
  background: transparent;
  padding: var(--space-sm);
  flex: 1;
  min-width: 0;
}

.alias-input-group input:focus {
  outline: none;
  border: none;
}

.alias-prefix,
.alias-suffix {
  padding: var(--space-sm) var(--space-md);
  color: var(--text-color-secondary);
  background: var(--bg-color-tertiary);
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: var(--font-size-base);
  white-space: nowrap;
}

.hint {
  display: block;
  margin-top: var(--space-xs);
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.error-text {
  display: block;
  margin-top: var(--space-xs);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.success-text {
  display: block;
  margin-top: var(--space-xs);
  color: var(--color-success);
  font-size: var(--font-size-sm);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  cursor: pointer;
  padding: var(--space-md);
  background: var(--bg-color-secondary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  transition: var(--transition-colors);
}

.radio-option:hover {
  border-color: var(--color-primary);
  background: var(--bg-color-hover);
}

.radio-option input[type="radio"] {
  margin: 0;
  width: auto;
  accent-color: var(--color-primary);
}

.radio-label {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.radio-label strong {
  color: var(--text-color);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.radio-label small {
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
}

.invite-input-group {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.invite-input-group input {
  flex: 1;
}

.invite-input-group button {
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-colors);
}

.invite-input-group button:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.invite-input-group button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.invite-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.invite-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-color-tertiary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.invite-item .user-avatar {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-secondary);
  border-radius: var(--border-radius-full);
  margin-right: var(--space-sm);
}

.invite-item .default-avatar {
  font-size: var(--font-size-base);
  color: var(--color-primary);
}

.invite-item .user-info {
  display: flex;
  flex-direction: column;
}

.invite-item .user-name {
  font-size: var(--font-size-base);
  color: var(--text-color);
}

.invite-item .user-id {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
}

.remove-btn {
  margin-left: var(--space-md);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  transition: var(--transition-colors);
  background: none;
  color: var(--color-error);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-base);
}

.remove-btn:hover {
  background: var(--color-error);
  color: white;
}

.search-results {
  background: var(--bg-color-tertiary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-xs);
  margin-top: var(--space-xs);
  padding: var(--space-sm);
}

.results-header {
  font-size: var(--font-size-sm);
  color: var(--text-color-secondary);
  margin: var(--space-xs) var(--space-xs) var(--space-xs) var(--space-xs);
}

/* 对齐 TheBestSearch 的列表样式 */
.tbs-section {
  background: var(--bg-color-tertiary);
  border-radius: 8px;
}

.tbs-list {
  list-style: none;
  margin: 0;
  padding: 4px;
  display: grid;
  gap: 4px;
}

.tbs-item {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.tbs-item:hover {
  background: var(--bg-color-hover);
}

.tbs-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--bg-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-color);
}

.tbs-item-main {
  min-width: 0;
}

.tbs-title {
  font-size: 14px;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tbs-sub {
  font-size: 12px;
  color: var(--text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.manual-input-section {
  margin-top: var(--space-xs);
}

.manual-input .default-avatar {
  color: var(--color-warning);
}

.no-results-text {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
  padding: var(--space-xs);
}

.dialog-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
}

.cancel-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-color-secondary);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-colors);
}

.cancel-btn:hover {
  background: var(--bg-color-hover);
}

.create-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-colors);
}

.create-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .create-room-overlay {
    padding: var(--space-md);
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding-left: var(--space-lg);
    padding-right: var(--space-lg);
  }

  .dialog-footer {
    flex-direction: column;
  }

  .cancel-btn,
  .create-btn {
    width: 100%;
  }
}
</style>