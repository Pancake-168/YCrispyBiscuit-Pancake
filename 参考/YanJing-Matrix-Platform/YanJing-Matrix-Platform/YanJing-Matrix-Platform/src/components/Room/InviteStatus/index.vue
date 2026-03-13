<template>
  <div class="invite-status">
    <div class="invite-card">
      <div class="invite-title">您收到了邀请</div>
      <div class="invite-desc">接受后将加入该聊天，拒绝后将从列表中移除。</div>
      <div class="invite-actions">
        <button class="btn btn-primary" type="button" :disabled="processing" @click="handleAccept">
          {{ processing ? '处理中...' : '接受邀请' }}
        </button>
        <button class="btn btn-danger" type="button" :disabled="processing" @click="handleReject">
          {{ processing ? '处理中...' : '拒绝邀请' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { roomManagementService } from '@/services/Matrix/roomManagement'
import { openConfirmDialog, openMessageDialog } from '@/components/MessageDialog/open'
import { refreshRoomState } from '@/services/Matrix/refreshRoomState'

const props = defineProps<{
  roomId: string
}>()
const emit = defineEmits<{
  changed: []
}>()

const processing = ref(false)

const handleAccept = async () => {
  if (!props.roomId) return
  processing.value = true
  try {
    await roomManagementService.acceptInvite(props.roomId)
    await refreshRoomState({
      showLoading: true,
      loadingText: '正在更新状态...',
      preferredRoomId: props.roomId,
    })
    emit('changed')
    openMessageDialog('已接受邀请')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误'
    openMessageDialog(`接受邀请失败: ${message}`)
  } finally {
    processing.value = false
  }
}

const handleReject = async () => {
  if (!props.roomId) return

  const ok = await openConfirmDialog('确定要拒绝此邀请吗？', {
    title: '确认操作',
    confirmText: '拒绝',
    cancelText: '取消',
  })
  if (!ok) return

  processing.value = true
  try {
    await roomManagementService.rejectInvite(props.roomId)
    await refreshRoomState({
      showLoading: true,
      loadingText: '正在更新状态...',
    })
    emit('changed')
    openMessageDialog('已拒绝邀请')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误'
    openMessageDialog(`拒绝邀请失败: ${message}`)
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.invite-status {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  box-sizing: border-box;
}

.invite-card {
  width: min(460px, 100%);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--glass-bg);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-md);
}

.invite-title {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-color);
}

.invite-desc {
  font-size: var(--font-sm);
  color: var(--text-muted);
  line-height: 1.6;
}

.invite-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

@media (max-width: 768px) {
  .invite-actions {
    flex-direction: column;
  }

  .invite-actions :deep(.btn) {
    width: 100%;
  }
}
</style>
