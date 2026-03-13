<template>
  <div class="room-status-indicator">
    <!-- 正常状态：已加入房间 -->
    <div v-if="membershipStatus === 'join'" class="status-normal">
      <slot />
    </div>

    <!-- 待处理邀请状态 -->
    <div v-else-if="membershipStatus === 'invite'" class="status-invited">
      <div class="status-content">
        <div class="status-icon">📩</div>
        <h3 class="status-title">您收到了邀请</h3>
        <p class="status-message">您被邀请加入此房间</p>
        <div class="status-actions">
          <button @click="handleAcceptInvite" :disabled="processing" class="action-btn accept">
            {{ processing ? '处理中...' : '接受邀请' }}
          </button>
          <button @click="handleDeclineInvite" :disabled="processing" class="action-btn decline">
            {{ processing ? '处理中...' : '拒绝邀请' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 所有其他状态：统一显示已离开房间，无操作 -->
    <div v-else class="status-left">
      <div class="status-content">
        <div class="status-icon">

          <svg class="lingjingsvg" width="263" height="82" viewBox="0 0 527 174" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M207.863 0.559391L185.104 19.9119L183.798 33.0248L183.768 33.3299L174.517 33.3641L169.279 72.7757L182.291 72.7275L182.234 73.1169L179.564 91.4651L179.522 91.7548L167.203 91.8003L159.252 152.322L159.214 152.617L128.404 152.731L128.451 152.348L136.051 91.9161L121.657 91.9689L109.273 152.531L109.244 152.677L109.115 152.754L74.2774 173.598L73.6054 174L73.7657 173.238L90.8338 92.0834L81.6238 92.1175L81.6734 91.7334L84.0026 73.7265L84.0408 73.4308L94.672 73.392L102.602 33.9696L90.646 34.0144L90.6997 33.6264L93.3676 14.5997L93.4085 14.3066H93.7069L179.882 14.3267L207.481 0L207.863 0.559391ZM475.348 149.655H442.096L428.214 45.6446H418.529L399.483 95.9503H426.923L428.86 117.024H391.089L378.499 149.655H294.886L299.405 115.325H291.657L270.673 152.035L226.446 172.769L264.54 115.325H249.044L255.5 64.6792L350.413 65.0191L343.633 115.325H326.523L324.909 131.64H352.349L393.672 31.0288L386.247 22.5315H455.332L475.348 149.655ZM510.213 149.655H477.93L492.457 31.0288L486.001 22.5315H527L510.213 149.655ZM10.5326 15.2936L87.2103 15.689L87.5932 15.691L87.5476 16.0684L85.2238 35.4337L85.1883 35.7321L62.1675 35.8177L49.584 62.352L81.6104 62.2336L81.5587 62.6183L70.2388 148.237L70.2005 148.532L10.6352 148.752L10.6848 148.368L17.2894 97.1099L0 97.1741L0.259542 96.6763L31.9485 35.9295L18.0989 35.981L18.1378 35.605L19.4395 22.8835L10.322 15.9018L9.51991 15.2889L10.5326 15.2936ZM243.273 14.6506L238.483 50.9681H247.531L247.467 51.3656L244.563 69.3959L244.516 69.6843H235.81L229.786 113.014L241.246 110.541L241.721 110.439L241.66 110.919L239.078 131.204L239.048 131.442L238.813 131.495L187.504 143.086L187.021 143.195L187.088 142.706L189.992 121.455L190.025 121.218L190.259 121.167L200.351 118.964L207.042 69.6843H196.397L196.445 69.2989L198.704 51.2686L198.742 50.9681H209.71L212.887 22.4292L207.161 14.8111L206.749 14.2631H243.324L243.273 14.6506ZM45.0403 79.6878L45.0028 79.9855L38.6886 130.947L38.6417 131.329L47.8886 131.295L47.9262 130.998L54.2404 80.0357L54.2873 79.6536L45.0403 79.6878ZM277.776 102.409H318.453L319.098 95.6103H278.421L277.776 102.409ZM280.036 84.3938H320.712L321.68 76.9162H281.004L280.036 84.3938ZM132.859 33.1787L132.806 33.453L125.081 73.2133L125.004 73.6087L125.409 73.6174L139.102 73.9065L139.409 73.9125L139.449 73.6114L144.776 33.52L144.828 33.1345L132.859 33.1787ZM356.374 48.8811L355.687 57.1034H250.615L251.988 43.057H272.247L270.187 34.4922H294.567L296.97 43.057H313.109L316.543 34.4922H342.296L338.519 43.057H354.657L378.35 31.0663L356.374 48.8811ZM380.614 3.92979L358.138 21.2288L356.865 31.3908L356.827 31.6912H258.359L258.404 31.3078L260.018 17.7854L260.054 17.483H293.21L287.519 10.3106L287.079 9.75588H325.595L325.564 10.1266L324.95 17.483H352.247L380.249 3.353L380.614 3.92979Z"
              fill="url(#paint0_linear_1302_2024)" />
            <defs>
              <linearGradient id="paint0_linear_1302_2024" x1="6.21731e-10" y1="87" x2="664.38" y2="87.2527"
                gradientUnits="userSpaceOnUse">
                <stop stop-color="#D0BCFF" />
                <stop offset="1" stop-color="#E3E3E3" />
              </linearGradient>
            </defs>
          </svg>



          
        </div>
        <h3 class="status-title">请选择聊天</h3>
        <p class="status-message"></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { inviteManagementServiceV2 } from '@/services/members/invite.service'
import { openConfirmDialog, openMessageDialog } from '@/components/MessageDialog/open'
interface Props {
  roomId?: string
  membershipStatus: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  statusChanged: []
}>()

// 状态管理
const processing = ref(false)

// 接受邀请
const handleAcceptInvite = async () => {
  if (!props.roomId) {
    openMessageDialog('没有房间ID，无法接受邀请')
    return
  }

  processing.value = true
  try {
    await inviteManagementServiceV2.接受邀请(props.roomId)

    // 等待一下让Matrix客户端状态同步
    await new Promise(resolve => setTimeout(resolve, 500))

    emit('statusChanged')
    openMessageDialog('已接受邀请')
  } catch (error: any) {
    console.error('[V2] 接受邀请失败:', error)
    openMessageDialog(`接受邀请失败: ${error.message}`)
  } finally {
    processing.value = false
  }
}

// 拒绝邀请
const handleDeclineInvite = async () => {
  if (!props.roomId) {
    openMessageDialog('没有房间ID，无法拒绝邀请')
    return
  }

  const ok = await openConfirmDialog('确定要拒绝此邀请吗？', {
    title: '确认操作',
    confirmText: '拒绝',
    cancelText: '取消',
  })
  if (!ok) return

  processing.value = true
  try {
    await inviteManagementServiceV2.拒绝邀请(props.roomId)

    // 等待一下让Matrix客户端状态同步
    await new Promise(resolve => setTimeout(resolve, 500))

    emit('statusChanged')
    openMessageDialog('已拒绝邀请')
  } catch (error: any) {
    console.error('[V2] 拒绝邀请失败:', error)
    openMessageDialog(`拒绝邀请失败: ${error.message}`)
  } finally {
    processing.value = false
  }
}

// 监听房间ID变化，重置状态
watch(() => props.roomId, () => {
  processing.value = false
})
</script>

<style scoped>
.room-status-indicator {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.status-normal {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.status-kicked,
.status-banned,
.status-invited,
.status-unknown,
.status-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--bg-color-secondary);
}

.status-content {
  text-align: center;
  max-width: 400px;
}

.status-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.status-title {
  margin-top: -20px;
  color: var(--text-color);
  font-size: var(--font-size-lg);
}

.status-message {
  margin: 0 0 8px 0;
  color: var(--text-color-secondary);
  font-size: 16px;
  line-height: 1.5;
}

.status-submessage {
  margin: 0 0 24px 0;
  color: var(--text-color-tertiary);
  font-size: 14px;
  line-height: 1.4;
}

.status-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 120px;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.rejoin {
  background: var(--color-primary);
  color: white;
}

.action-btn.rejoin:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.action-btn.accept {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.action-btn.accept:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.2);
}

.action-btn.decline {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.action-btn.decline:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.action-btn.back {
  background: var(--bg-color-tertiary);
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color);
}

.action-btn.back:hover:not(:disabled) {
  background: var(--border-color);
  color: var(--text-color);
}

.action-btn.refresh {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.action-btn.refresh:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .status-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .status-icon {
    font-size: 48px;
  }

  .status-title {
    font-size: 20px;
  }
}

/* 主题适配 */
@media (prefers-color-scheme: dark) {

  .status-kicked,
  .status-banned,
  .status-invited,
  .status-unknown {
    background: var(--bg-color-secondary, #1a1b23);
  }
}
</style>
