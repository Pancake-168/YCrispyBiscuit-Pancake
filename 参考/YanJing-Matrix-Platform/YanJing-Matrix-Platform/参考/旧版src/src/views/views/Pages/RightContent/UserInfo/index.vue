<template>
  <div class="discord-user-card">
    <div class="user-card-main">
      <div class="user-avatar-large">
        <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="avatar" />
        <div v-else class="default-avatar">{{ cleanDisplayName?.charAt(0) || 'O' }}</div>
      </div>
      <div class="user-info-block">
        <div class="user-display">{{ cleanDisplayName }}</div>
        <!--div class="user-sub">{{ userId || '-' }}</div-->
      </div>
    </div>
    <div class="user-actions-bar">
      <button class="edit-btn" @click="handleEditNickname">修改昵称</button>
      <button class="logout-btn" @click="logout">退出登录</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, inject, watchEffect, onMounted } from 'vue'
import { getActivePinia } from 'pinia'
import { roomServiceV2 } from '@/services/matrix/rooms'
import { userInfoManager } from '@/utils/userInfo'
import { useWechatStore } from '@/stores/wechat'
import { openUpdateNicknameDialog } from '@/components/UserInfo/UpdateNicknameDialog/open'
import { resolveUserDisplayName } from '@/utils/displayName'

const chatContext = inject('chatContext') as any

const wechatStore = useWechatStore()

const userId = computed(() => chatContext?.currentUserId?.value || '')
const avatarUrl = computed(() => chatContext?.currentUser?.avatarUrl || '')
const roomCount = ref(0)

// 从用户信息管理器获取干净的用户名显示
const cleanDisplayName = computed(() => {
  // 最高优先级：userProfile（来自 SSO UserInfo）
  const profile = wechatStore.userProfile
  if (profile?.nickname?.trim()) {
    return profile.nickname.trim()
  }
  if (profile?.username?.trim()) {
    return profile.username.trim()
  }

  // 其次使用用户信息管理器中的用户名
  const username = userInfoManager.getLoginField('username')
  if (username) {
    return username
  }
  // 如果没有，则尝试从userId中提取
  if (userId.value) {
    return resolveUserDisplayName({ matrixId: userId.value, matrixDisplayName: null })
  }
  return userId.value || '未知用户'
})

function handleEditNickname() {
  const profile = wechatStore.userProfile
  openUpdateNicknameDialog({
    pinia: getActivePinia() || undefined,
    initialNickname: profile?.nickname || '',
    onUpdated: () => {
      // userdetail 内部会更新 store，这里无需额外处理
    },
  })
}


function updateStats() {
  const roomsArr = roomServiceV2.获取房间列表()
  roomCount.value = roomsArr.length
}

onMounted(updateStats)
watchEffect(() => {
  updateStats()
})

const logout = () => {
  if (chatContext?.logout) chatContext.logout()
}
</script>

<style scoped>
.default-avatar {

  color: var(--text-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-title);
}

.discord-user-card {
  background: var(--bg-color-third);
  display: flex;
  width: 100%;
  height: 100%;
  padding: 40px;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 28px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .discord-user-card {
    min-width: auto;
    margin: 0;
    padding: 0;
    border-radius: 0;
    /* 隐藏卡片边框和阴影，完全融入页面背景 */
    box-shadow: none;
    border: none;
    /* 填满整个容器 */
    width: 100%;
    height: 100%;
    /* 使用页面背景色，完全融入页面 */
    background: var(--bg-color-third);
    /* 移除最大高度限制 */
    max-height: none;
    overflow: visible;
  }
}

.user-card-main {
  display: flex;

  flex-direction: row;
  align-items: flex-start;
  gap: 32px;
  width: 100%;
}

/* 移动端时改为垂直排列 */
@media (max-width: 768px) {
  .user-card-main {
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    padding: 20px 16px;
  }
}

.user-avatar-large {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--bg-color-tertiary);
  box-shadow: 0 2px 12px var(--shadow-color, #00000033);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 移动端头像调整 */
@media (max-width: 768px) {
  .user-avatar-large {
    width: 80px;
    height: 80px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-info-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: flex-start;
  margin-top: 8px;
}

.user-sub {
  font-size: 14px;
  color: var(--text-color-secondary);
}

/* 移动端用户信息块样式 */
@media (max-width: 768px) {
  .user-info-block {
    margin-top: 0;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
  }
}

.user-display {
  color: var(--text-color);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* 移动端用户名显示 */
@media (max-width: 768px) {
  .user-display {
    font-size: 24px;
    font-weight: 600;
  }
}

.user-id {
  font-size: 15px;
  color: var(--text-color-secondary);
  margin-bottom: 2px;
}

.user-status {
  font-size: 14px;
  color: var(--color-success);
  margin-bottom: 10px;
}

.user-stats-row {
  display: flex;
  gap: 40px;
  margin-top: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 14px;
}

.stat-label {
  color: var(--text-color-secondary);
  margin-bottom: 2px;
}

.stat-value {
  color: var(--text-color);
  font-weight: bold;
  font-size: 18px;
}

.user-actions-bar {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  gap: 12px;

}

/* 移动端操作栏样式 */
@media (max-width: 768px) {
  .user-actions-bar {
    justify-content: center;
    margin-top: 24px;
    padding: 0 16px 20px 16px;
  }
}

.logout-btn {
  padding: 12px 40px;
  border: none;
  border-radius: 10px;
  background: var(--color-error);
  color: var(--text-color);
  box-shadow: 0 2px 8px var(--shadow-color, #00000022);
  font-size: var(--font-size-btn);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;

}

.edit-btn {
  padding: 12px 40px;
  border: none;
  border-radius: 10px;
  background: var(--bg-color-tertiary);
  color: var(--text-color);
  box-shadow: 0 2px 8px var(--shadow-color, #00000022);
  font-size: var(--font-size-btn);
  font-weight: 700;
  cursor: pointer;
}

/* 移动端退出按钮样式 */
@media (max-width: 768px) {
  .logout-btn {
    padding: 14px 28px;
    font-size: 16px;
    width: 100%;
    max-width: 200px;
    border-radius: 8px;
  }
}

@media (max-width: 768px) {
  .edit-btn {
    padding: 14px 28px;
    font-size: 16px;
    width: 100%;
    max-width: 200px;
    border-radius: 8px;
  }
}

.logout-btn:hover {
  background: var(--color-error-hover);
}
</style>