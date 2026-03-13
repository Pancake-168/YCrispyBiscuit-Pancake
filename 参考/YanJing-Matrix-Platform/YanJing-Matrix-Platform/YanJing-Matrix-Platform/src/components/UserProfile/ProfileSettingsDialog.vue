<template>
  <div :class="embedded ? 'embedded-root' : 'dialog-mask yj-dialog-mask'" @click.self="handleMaskClick">
    <div class="dialog yj-dialog-content" :class="{ embedded }" @click.stop>
      <div class="dialog-header">
       
        <button v-if="!embedded" class="btn btn-ghost close-btn" @click="closeDialog">×</button>
      </div>

      <div class="dialog-body">
        <div v-if="loading" class="muted">加载中...</div>
        <template v-else>
          <div class="field">
            <div class="label">当前用户</div>
            <div class="value">{{ wechatStore.userProfile?.username }}</div>
          </div>

          <div class="field">
            <div class="label">头像预览</div>
            <div class="avatar-row">
              <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" class="avatar" alt="avatar" />
              <div v-else class="avatar fallback">{{ avatarFallbackText }}</div>
              <label class="btn btn-ghost upload-btn" for="avatar-upload">选择图片</label>
              <input id="avatar-upload" class="file-input" type="file" accept="image/*" @change="handleAvatarFileChange" />
            </div>
          </div>

          <div class="field">
            <div class="label">昵称</div>
            <input v-model="displayName" class="input" placeholder="请输入昵称" maxlength="64" />
          </div>
        </template>
      </div>

      <div class="dialog-footer">
        <button v-if="!embedded" class="btn btn-ghost" @click="closeDialog">取消</button>
        <button class="btn btn-primary" :disabled="loading || saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { MATRIX_SERVER_URL } from '@/apiUrls'
import { openMessageDialog } from '@/components/MessageDialog/open'
import { matrixProfileService } from '@/services/Matrix/profile'
import type { MatrixMyProfile } from '@/types/profile-management'
import { createMatrixAvatarHelper } from '@/utils/matrixAvatar'
import { userdetail } from '@/services/Project/SSO/UserInfo'
import { useWechatStore } from '@/stores/WeChat'



const props = withDefaults(defineProps<{ embedded?: boolean }>(), {
  embedded: false,
})

const emit = defineEmits<{
  close: []
  updated: [profile: MatrixMyProfile]
}>()

const loading = ref(true)
const saving = ref(false)
const profile = ref<MatrixMyProfile>({
  userId: '',
  displayName: '',
})

const wechatStore = useWechatStore()


const displayName = ref('')
const avatarFile = ref<File | null>(null)
const avatarPreviewUrl = ref('')
const avatarHelper = createMatrixAvatarHelper(MATRIX_SERVER_URL)

const avatarFallbackText = computed(() => {
  return avatarHelper.getFallbackText(displayName.value, profile.value.userId)
})

const embedded = computed(() => props.embedded)

const closeDialog = () => {
  if (!embedded.value) {
    emit('close')
  }
}

const handleMaskClick = () => {
  if (!embedded.value) {
    closeDialog()
  }
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return '未知错误'
}

const revokeObjectUrlIfNeeded = () => {
  if (avatarPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }
}

const loadAvatarPreviewByMxc = async (mxcUrl?: string) => {
  if (!mxcUrl) {
    revokeObjectUrlIfNeeded()
    avatarPreviewUrl.value = ''
    return
  }

  const blobUrl = await avatarHelper.resolveAvatarByMxc(mxcUrl)
  if (blobUrl) {
    revokeObjectUrlIfNeeded()
    avatarPreviewUrl.value = blobUrl
    return
  }

  revokeObjectUrlIfNeeded()
  avatarPreviewUrl.value = ''
}

const loadProfile = async () => {
  loading.value = true
  try {
    const current = await matrixProfileService.getMyProfile()
    profile.value = current
    displayName.value = current.displayName || ''
    await loadAvatarPreviewByMxc(current.avatarMxcUrl)
  } catch (error: unknown) {
    openMessageDialog(`加载个人信息失败: ${getErrorMessage(error)}`)
  } finally {
    loading.value = false
  }
}

const handleAvatarFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    openMessageDialog('请选择图片文件作为头像')
    input.value = ''
    return
  }

  avatarFile.value = file
  revokeObjectUrlIfNeeded()
  avatarPreviewUrl.value = URL.createObjectURL(file)
}

const handleSave = async () => {
  if (!displayName.value.trim()) {
    openMessageDialog('昵称不能为空')
    return
  }

  saving.value = true
  try {
    const updated = await matrixProfileService.updateMyProfile({
      displayName: displayName.value,
      avatarFile: avatarFile.value || undefined,
    })
    profile.value = updated
    avatarFile.value = null
    await loadAvatarPreviewByMxc(updated.avatarMxcUrl)
    await userdetail(displayName.value)
    openMessageDialog('个人信息更新成功')
    emit('updated', updated)
    if (!embedded.value) {
      emit('close')
    }
  } catch (error: unknown) {
    openMessageDialog(`更新失败: ${getErrorMessage(error)}`)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadProfile()
})

onBeforeUnmount(() => {
  revokeObjectUrlIfNeeded()
  avatarHelper.dispose()
})
</script>

<style scoped>
.embedded-root {
  width: 100%;
  height: 100%;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--bg-color) 88%, transparent);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10010;
}

.dialog {
  width: min(560px, 92vw);
  max-height: 84vh;
  background: var(--panel-bg);
  border: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
  border-radius: var(--radius-md);
  box-shadow: 0 20px 48px color-mix(in srgb, var(--bg-color) 72%, transparent);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog.embedded {
  width: 100%;
  max-height: none;
  height: 100%;
  border-radius: var(--radius-md);
}

.dialog-header,
.dialog-footer {
  padding: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.dialog-title {
  font-size: var(--font-base);
  font-weight: 600;
}

.dialog-body {
  padding: var(--space-md);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.label,
.muted {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.value {
  color: var(--text-color);
  word-break: break-all;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
}

.avatar.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--primary-color) 25%, var(--panel-bg));
  color: var(--text-color);
  font-weight: 700;
}

.upload-btn {
  cursor: pointer;
}

.file-input {
  display: none;
}

.close-btn {
  min-width: 32px;
  height: 32px;
  padding: 0;
  font-size: var(--font-md);
}
</style>
