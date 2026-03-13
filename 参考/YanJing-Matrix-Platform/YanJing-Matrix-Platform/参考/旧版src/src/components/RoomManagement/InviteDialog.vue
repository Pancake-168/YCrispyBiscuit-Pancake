<template>
  <div class="invite-dialog-overlay" @click="closeDialog">
    <div class="invite-dialog" @click.stop>
      <div class="dialog-header">
        <h3>邀请成员加入{{ inviteTypeText }}</h3>
        <button class="close-btn" @click="closeDialog">×</button>
      </div>

      <div class="dialog-body">
        <div class="invite-section">
          <label>搜索用户或输入完整ID</label>
          <div class="user-input-group">
            <input v-model="userIdInput" placeholder="输入昵称/用户名/ID" @input="handleInputChange" @keyup.enter="addToInviteList" />
            <button @click="addToInviteList" :disabled="!userIdInput.trim()">
              添加
            </button>
          </div>
          <!-- 搜索结果列表 -->
          <div v-if="showSearchResults && (searchResults.length > 0 || userIdInput.trim())" class="search-results">
            <div v-if="searching" class="search-loading">🔍 搜索中...</div>
            <div v-if="searchResults.length > 0">
              <div class="results-header">搜索结果 ({{ searchResults.length }})</div>
              <div v-for="result in searchResults" :key="result.item.userId" class="search-result-item" @click="selectSearchUser(result.item)">
                <div class="user-info">
                  <div class="user-name">{{ getDisplayName(result.item.userId, result.item.displayName) }}</div>
                  <div class="user-id">{{ result.item.userId }}</div>
                  <div class="user-server">{{ result.item.serverName }}</div>
                </div>
              </div>
            </div>
            <div v-if="searchResults.length === 0 && userIdInput.trim() && !searching" class="no-results">
              <div class="no-results-text">未找到用户，可直接输入完整ID邀请</div>
            </div>
          </div>
        </div>

        <div class="invite-list" v-if="inviteList.length > 0">
          <h4>待邀请用户</h4>
          <div class="invite-item" v-for="userId in inviteList" :key="userId">
            <span class="user-id">{{ userId }}</span>
            <button @click="removeFromInviteList(userId)" class="remove-btn">×</button>
          </div>
        </div>

        <div class="invite-reason">
          <label>邀请理由（可选）</label>
          <textarea v-model="inviteReason" :placeholder="`说明邀请此用户加入${inviteTypeText}的原因...`" rows="3"></textarea>
        </div>
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
          <p class="success">成功邀请 {{ inviteResult.succeeded.length }} 个用户：</p>
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
import { inviteManagementServiceV2 } from '../../services/members/invite.service'
import { InviteUserToApplication } from '@/services/Project/Organization/data/data.ts'
import { MATRIX_SERVER_URL } from '@/apiUrls'
import { openMessageDialog } from '@/components/MessageDialog/open';
import { resolveUserDisplayName } from '@/utils/displayName'


import { 搜索指定空间内的用户 } from '../../services/matrix/search'
import { 搜索用户 } from '../../services/matrix/search'

const getDisplayName = (userId: string, matrixDisplayName?: string) =>
  resolveUserDisplayName({ matrixId: userId, matrixDisplayName: matrixDisplayName || null })



interface Props {
  roomId: string
  inviteType?: 'space' | 'room' // 新增：邀请类型，默认为 room
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

// 新增：搜索相关
const searchResults = ref<any[]>([])
const searching = ref(false)
const showSearchResults = ref(false)
let searchTimeout: number | null = null

// 方法
const closeDialog = () => {
  emit('close')
}

// 搜索输入处理（防抖）
const handleInputChange = () => {
  showSearchResults.value = !!userIdInput.value.trim()
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!userIdInput.value.trim()) {
    searchResults.value = []
    searching.value = false
    return
  }
  searching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const results = await 搜索用户(userIdInput.value.trim(), { query: userIdInput.value.trim(), limit: 20 })
      searchResults.value = results
    } catch {
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 300) as unknown as number
}

// 选择搜索结果加入邀请列表
const selectSearchUser = (user: any) => {
  if (inviteList.value.includes(user.userId)) return
  inviteList.value.push(user.userId)
  userIdInput.value = ''
  searchResults.value = []
  showSearchResults.value = false
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

  userIdInput.value = ''
  searchResults.value = []
  showSearchResults.value = false
}

const removeFromInviteList = (userId: string) => {
  const index = inviteList.value.indexOf(userId)
  if (index > -1) {
    inviteList.value.splice(index, 1)
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
  z-index: 1001;
  padding: 20px;
}

.invite-dialog {
  background: var(--bg-color-third);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-color-fifth);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-color-fifth);
  color: var(--text-color);
}

.dialog-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.invite-section {
  margin-bottom: 20px;
}

.invite-section label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-color);
  font-weight: 500;
  font-size: 14px;
}

.user-input-group {
  display: flex;
  gap: 8px;
}

.user-input-group input {
  flex: 1;
  padding: 10px 12px;
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-color);
  font-size: 14px;
}

.user-input-group input:focus {
  outline: none;

}

.user-input-group button {
  padding: 10px 16px;
  background: var(--bg-color-fifth);
  color: var(--text-color);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.user-input-group button:hover:not(:disabled) {
  background: var(--bg-color-fifth);
}

.user-input-group button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-results {
  margin-bottom: 20px;
}

.search-results h4 {
  margin: 0 0 12px 0;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 600;
}

.search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-color-secondary);
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.search-item:hover {
  background: var(--bg-color-fifth);
}

.user-name {
  margin-top: 10px;
  color: var(--text-color-secondary);
  font-size: var(--font-size-base);
}

.invite-list {
  margin-bottom: 20px;
}

.invite-list h4 {
  margin: 0 0 12px 0;
  color: var(--text-color-secondary);
  font-size: var(--font-size-base);
  font-weight: 600;
}

.invite-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-color-secondary);
  border-radius: 6px;
  margin-bottom: 6px;
}

.user-id {
  color: var(--text-color);
  font-size: 13px;
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
}

.remove-btn:hover {
  background: var(--bg-color-fifth);
  color: white;
}

.invite-reason label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-color);

  font-size: var(--font-size-base);
}

.invite-reason textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-color-secondary);

  border-radius: 6px;
  color: var(--text-color);
  font-size: var(--font-size-base);
  resize: vertical;
  font-family: inherit;
}

.invite-reason textarea:focus {
  outline: none;

}

.dialog-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
}

.cancel-btn {
  padding: 10px 20px;
  background: var(--bg-color-fifth);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: var(--bg-color-fifth);
}

.invite-btn {
  padding: 10px 20px;
  background: var(--bg-color-fifth);
  color: var(--text-color);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.invite-btn:hover:not(:disabled) {
  background: var(--bg-color-fifth);
}

.invite-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.invite-result {
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-color-secondary);
}

.invite-result h4 {
  margin: 0 0 16px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.success-list,
.failure-list {
  margin-bottom: 16px;
}

.success {
  color: #22c55e;
  font-weight: 500;
  margin-bottom: 8px;
}

.error {
  color: #ef4444;
  font-weight: 500;
  margin-bottom: 8px;
}

.invite-result ul {
  margin: 0;
  padding-left: 20px;
  color: var(--text-color-secondary);
  font-size: 13px;
}

.invite-result li {
  margin-bottom: 4px;
}

.reset-btn {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.reset-btn:hover {
  background: var(--color-primary-hover);
}


.results-header{
  background-color: var(--bg-color-secondary);
  margin-top: 10px;
  margin-bottom: 10px;
}

.search-result-item{
  background-color: var(--bg-color-secondary);
}

.user-info{
  margin: 10px;
  width: 100%;
  height: 100%;
}
</style>
