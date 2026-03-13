<template>
  <div class="invite-dialog-overlay" @click="closeDialog">
    <div class="invite-dialog" @click.stop>
      <div class="dialog-header">
        <h3>邀请成员加入{{ inviteTypeText }}</h3>
        <button class="close-btn" @click="closeDialog">×</button>
      </div>

      <div class="dialog-body">
        <div class="invite-section">
          <label>搜索或输入用户ID</label>
          <div class="user-input-group">
            <input v-model="userIdInput" @input="handleSearchInput" @keyup.enter="addToInviteList"
              placeholder="输入昵称或ID搜索..." />
            <button @click="addToInviteList" :disabled="!userIdInput.trim()">
              添加
            </button>
          </div>

          <!-- 搜索结果列表 (平铺) -->
          <div v-if="showSearchResults" class="search-results">
            <div v-if="isSearching" class="searching-hint">搜索中...</div>
            <div v-else-if="searchResults.length === 0" class="no-results">未找到匹配用户</div>
            <div v-else class="results-list">
              <div v-for="result in searchResults" :key="result.item.userId" class="search-result-item"
                @click="selectUser(result.item)">
                <img v-if="result.item.avatarUrl" :src="mxcToHttp(result.item.avatarUrl)" class="user-avatar" />
                <div v-else class="user-avatar default-avatar">
                  {{ getDisplayName(result.item.userId, result.item.displayName).charAt(0).toUpperCase() }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ getDisplayName(result.item.userId, result.item.displayName) }}</div>
                  <div class="user-id-sub">{{ result.item.userId }}</div>
                </div>
                <div v-if="inviteList.includes(result.item.userId)" class="added-badge">已添加</div>
              </div>
            </div>
          </div>
        </div>

        <div class="invite-list" v-if="inviteList.length > 0">
          <h4>待邀请用户 ({{ inviteList.length }})</h4>
          <div class="invite-item" v-for="userId in inviteList" :key="userId">
            <div class="invite-user-info">
              <template v-if="userDetailsMap.has(userId)">
                <img v-if="userDetailsMap.get(userId)?.avatarUrl"
                  :src="mxcToHttp(userDetailsMap.get(userId)?.avatarUrl)" class="user-avatar-small" />
                <div v-else class="user-avatar-small default-avatar">
                  {{ getDisplayName(userId, userDetailsMap.get(userId)?.displayName).charAt(0).toUpperCase() }}
                </div>
                <div class="user-details">
                  <span class="user-name">{{ getDisplayName(userId, userDetailsMap.get(userId)?.displayName) }}</span>
                  <span class="user-id-sub">{{ userId }}</span>
                </div>
              </template>
              <template v-else>
                <div class="user-avatar-small default-avatar">?</div>
                <span class="user-id">{{ userId }}</span>
              </template>
            </div>
            <button @click="removeFromInviteList(userId)" class="remove-btn">×</button>
          </div>
        </div>

        <!--div class="invite-reason">
          <label>邀请理由（可选）</label>
          <textarea v-model="inviteReason" :placeholder="`说明邀请此用户加入${inviteTypeText}的原因...`" rows="3"></textarea>
        </div-->
      </div>

      <div class="dialog-footer">
        <button @click="closeDialog" class="cancel-btn">取消</button>
        <button @click="sendInvites" :disabled="inviteList.length === 0 || sending" class="invite-btn">
          {{ sending ? `邀请中... (${currentInviteIndex}/${inviteList.length})` : `邀请 ${inviteList.length} 个用户` }}
        </button>
      </div>

      <!-- 邀请结果 -->
      <div v-if="inviteResult" class="invite-result">
        <h4>邀请结果</h4>
        <div v-if="inviteResult.succeeded.length > 0" class="success-list">
          <!--p class="success">成功邀请 {{ inviteResult.succeeded.length }} 个用户：</p-->
          <ul>
            <li v-for="userId in inviteResult.succeeded" :key="userId">{{ userId }}</li>
          </ul>
        </div>
        <div v-if="inviteResult.failed.length > 0" class="failure-list">
          <p class="error">{{ inviteResult.failed.length }} 个用户邀请失败：</p>
          <ul>
            <li v-for="failure in inviteResult.failed" :key="failure.userId">
              {{ failure.userId }}: {{ failure.error }}
            </li>
          </ul>
        </div>
        <button @click="resetDialog" class="reset-btn">继续邀请</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { inviteManagementServiceV2 } from '@/services/members/invite.service'
import { InviteUserToApplication } from '@/services/Project/Organization/data/data'
import { removePrefixSuffix } from '@/utils/stringUtils'
import { resolveUserDisplayName } from '@/utils/displayName'


import { 搜索指定空间内的用户, 搜索用户 } from '@/services/matrix/search'
import { joinDepartment as joinDepartmentAPI } from '@/services/Project/Organization/data/data'
import { MATRIX_SERVER_URL, MATRIX_SERVER_URL_ALL, MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import { matrixClientV2 } from '@/services/matrix/client'
import type { UserSearchResult, SearchResult } from '@/types/room-management.types'
import { openMessageDialog } from '@/components/MessageDialog/open';

const getDisplayName = (userId: string, matrixDisplayName?: string) =>
  resolveUserDisplayName({ matrixId: userId, matrixDisplayName: matrixDisplayName || null })

interface Props {
  roomId: string
  inviteType?: 'space' | 'room' // 新增：邀请类型，默认为 room
  departmentId: number // 新增：部门ID
}

const props = withDefaults(defineProps<Props>(), {
  inviteType: 'room'
})

const emit = defineEmits<{
  close: []
  invited: [userIds: string[], inviteType: 'space' | 'room', roomId: string]
}>()

// 计算属性：基于邀请类型的显示文本
const inviteTypeText = computed(() => {
  return props.inviteType === 'space' ? '空间' : '房间'
})

// 响应式数据
const userIdInput = ref('')
const inviteList = ref<string[]>([])
const inviteReason = ref('')
const sending = ref(false)
const currentInviteIndex = ref(0)
const inviteResult = ref<{
  succeeded: string[]
  failed: Array<{ userId: string; error: string }>
} | null>(null)

// 搜索相关状态
const isSearching = ref(false)
const searchResults = ref<SearchResult<UserSearchResult>[]>([])
const showSearchResults = ref(false)
const searchTimeout = ref<any>(null)
const userDetailsMap = ref<Map<string, { displayName: string, avatarUrl?: string }>>(new Map())

// 方法
const closeDialog = () => {
  emit('close')
}

// 处理搜索输入
const handleSearchInput = () => {
  const query = userIdInput.value.trim()

  if (!query) {
    showSearchResults.value = false
    searchResults.value = []
    return
  }

  // 清除之前的定时器
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  // 防抖搜索
  searchTimeout.value = setTimeout(async () => {
    isSearching.value = true
    showSearchResults.value = true
    try {
      // 调用已优化的搜索接口（支持自动补全和兜底）
      searchResults.value = await 搜索用户(query, { limit: 10 })
    } catch (error) {
      console.error('搜索失败:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

// 从搜索结果选择用户
const selectUser = (user: UserSearchResult) => {
  if (inviteList.value.includes(user.userId)) return

  inviteList.value.push(user.userId)
  // 保存用户详情用于展示
  userDetailsMap.value.set(user.userId, {
    displayName: user.displayName,
    avatarUrl: user.avatarUrl
  })

  // 清空搜索状态
  userIdInput.value = ''
  showSearchResults.value = false
  searchResults.value = []
}

// MXC URL 转 HTTP URL
const mxcToHttp = (mxcUrl?: string) => {
  if (!mxcUrl) return ''
  const client = matrixClientV2.getAuthedClient()
  if (client && client.mxcUrlToHttp) {
    return client.mxcUrlToHttp(mxcUrl, 32, 32, 'scale', false)
  }
  return ''
}

const addToInviteList = () => {
  const userIdValue = userIdInput.value.trim()
  if (!userIdValue) return

  // 检查是否是完整的用户ID格式
  let userId = userIdValue
  if (!userId.startsWith('@')) {
    userId = `@${userId}`
  }

  if (!userId.includes(':')) {
    userId = `${userId}:${MATRIX_SERVER_URL}`
  }

  // 简单验证用户ID格式
  if (!/^@[a-zA-Z0-9._-]+:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userId)) {
    openMessageDialog(`用户ID格式不正确，应为 @username:${MATRIX_SERVER_URL} 格式`)
    return
  }

  if (inviteList.value.includes(userId)) {
    openMessageDialog('该用户已在邀请列表中')
    return
  }

  inviteList.value.push(userId)
  // 手动添加的，如果没有详情，尝试用ID作为显示名
  if (!userDetailsMap.value.has(userId)) {
    userDetailsMap.value.set(userId, { displayName: userId })
  }

  userIdInput.value = ''
  showSearchResults.value = false
}

const removeFromInviteList = (userId: string) => {
  const index = inviteList.value.indexOf(userId)
  if (index > -1) {
    inviteList.value.splice(index, 1)
    userDetailsMap.value.delete(userId)
  }
}

const sendInvites = async () => {
  if (inviteList.value.length === 0 || sending.value) return

  sending.value = true
  currentInviteIndex.value = 0

  const succeeded: string[] = []
  const failed: Array<{ userId: string; error: string }> = []

  // 新增：空间邀请时先查空间成员
  let memberIds: string[] = [];
  if (props.inviteType === 'space') {
    const spaceMembers = await 搜索指定空间内的用户(props.roomId);
    memberIds = spaceMembers.map(m => m.item.userId);
  }


  try {
    // 使用循环单个邀请，替代批量邀请
    for (let i = 0; i < inviteList.value.length; i++) {
      const userId = inviteList.value[i]
      currentInviteIndex.value = i + 1

      // 空间邀请时只邀请未在空间内的用户
      if (props.inviteType === 'space' && memberIds.includes(userId)) {
        console.log(`[InviteDialog] 跳过已在空间内的用户: ${userId}`);
        continue;
      }


      try {
        console.log(`[InviteDialog] 正在邀请第 ${i + 1}/${inviteList.value.length} 个用户: ${userId}`)


        // 调用单个邀请方法
        await inviteManagementServiceV2.邀请用户(
          props.roomId,
          userId,
          inviteReason.value || undefined
        )


        succeeded.push(userId)

        if (props.inviteType === 'space') {


          await InviteUserToApplication(props.roomId, userId)

          const userid1 = removePrefixSuffix(userId, "@", `:${MATRIX_SERVER_URL}`)
          // 直接使用username调用API
          await joinDepartmentAPI(
            userid1, // username
            String(props.departmentId) // departmentId as string
          )

        }


        console.log(`[InviteDialog]  成功邀请用户: ${userId}`)

        // 添加小延迟避免请求过快
        if (i < inviteList.value.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }

      } catch (error: any) {
        const errorMessage = error.message || '邀请失败'
        failed.push({
          userId,
          error: errorMessage
        })
        console.error(`[InviteDialog]  邀请用户失败: ${userId}`, error)
      }
    }

    const result = { succeeded, failed }
    inviteResult.value = result

    if (succeeded.length > 0) {
      emit('invited', succeeded, props.inviteType, props.roomId)
    }

  } catch (error: any) {
    console.error(`[InviteDialog] 循环邀请过程中发生严重错误:`, {
      inviteType: props.inviteType,
      roomId: props.roomId,
      error: error.message
    })
    openMessageDialog(`邀请过程中发生错误: ${error.message}`)
  } finally {
    sending.value = false
  }
}

const resetDialog = () => {
  inviteList.value = []
  inviteReason.value = ''
  inviteResult.value = null
  currentInviteIndex.value = 0
  userDetailsMap.value.clear()
}
</script>

<style scoped>
.invite-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal, 1000);
  padding: var(--space-lg);
}

.invite-dialog {
  background: var(--bg-color-third);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
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

.invite-section {
  margin-bottom: var(--space-lg);
}

.invite-section label {
  display: block;
  margin-bottom: var(--space-sm);
  color: var(--text-color);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
}

.user-input-group {
  display: flex;
  gap: var(--space-sm);
}

.user-input-group input {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  color: var(--text-color);
  font-size: var(--font-size-base);
}

.user-input-group input:focus {
  outline: none;
  border-color: var(--bg-color-fifth);
  background: var(--bg-color-third);
}

.user-input-group button {
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-color-fifth);
  color: var(--text-color);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-colors);
}

.user-input-group button:hover:not(:disabled) {
  background: var(--bg-color-fifth-hover, var(--bg-color-fifth));
  opacity: 0.9;
}

.user-input-group button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 搜索结果样式 - 统一风格 (平铺) */
.search-results {
  margin-top: var(--space-sm);
  background: var(--bg-color-third);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  max-height: 200px;
  overflow-y: auto;
}

.searching-hint,
.no-results {
  padding: var(--space-md);
  text-align: center;
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--border-color-light);
  /* 恢复底部分隔线 */
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: var(--bg-color-secondary);
  /* 与 CreateSimpleRoomDialog 一致 */
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: var(--space-md);
  object-fit: cover;
  flex-shrink: 0;
}

.default-avatar {
  background: var(--bg-color-fifth);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.user-info {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.user-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-id-sub {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.added-badge {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
  background: var(--bg-color-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: var(--space-sm);
  white-space: nowrap;
}

/* 待邀请列表样式优化 */
.invite-list {
  margin-bottom: var(--space-lg);
}

.invite-list h4 {
  margin: 0 0 var(--space-sm) 0;
  color: var(--text-color);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.invite-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-color-secondary);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--space-xs);
  border: 1px solid transparent;
}

.invite-item:hover {
  border-color: var(--border-color);
}

.invite-user-info {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.user-avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: var(--space-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.user-id {
  color: var(--text-color);
  font-size: var(--font-size-sm);
  font-family: 'Monaco', 'Consolas', monospace;
}

.remove-btn {
  background: var(--bg-color-fifth);
  border: none;
  color: var(--text-color);
  cursor: pointer;
  font-size: 16px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-left: var(--space-sm);
  flex-shrink: 0;
}

.remove-btn:hover {
  background: var(--color-error);
  color: white;
}

.invite-reason label {
  display: block;
  margin-bottom: var(--space-sm);
  color: var(--text-color);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
}

.invite-reason textarea {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  color: var(--text-color);
  font-size: var(--font-size-base);
  resize: vertical;
  font-family: inherit;
}

.invite-reason textarea:focus {
  outline: none;
  border-color: var(--bg-color-fifth);
  background: var(--bg-color-third);
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
  background: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-colors);
}

.cancel-btn:hover {
  background: var(--bg-color-hover);
  border-color: var(--text-color-secondary);
}

.invite-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-color-fifth);
  color: var(--text-color);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-colors);
}

.invite-btn:hover:not(:disabled) {
  background: var(--bg-color-fifth-hover, var(--bg-color-fifth));
  opacity: 0.9;
}

.invite-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.invite-result {
  padding: var(--space-lg) var(--space-xl);
  border-top: 1px solid var(--border-color);
  background: var(--bg-color-secondary);
}

.invite-result h4 {
  margin: 0 0 var(--space-md) 0;
  color: var(--text-color);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.success-list,
.failure-list {
  margin-bottom: var(--space-md);
}

.success {
  color: var(--color-success, #22c55e);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-xs);
}

.error {
  color: var(--color-error, #ef4444);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-xs);
}

.invite-result ul {
  margin: 0;
  padding-left: 20px;
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
}

.invite-result li {
  margin-bottom: 4px;
}

.reset-btn {
  padding: var(--space-xs) var(--space-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.reset-btn:hover {
  background: var(--color-primary-hover);
}
</style>
