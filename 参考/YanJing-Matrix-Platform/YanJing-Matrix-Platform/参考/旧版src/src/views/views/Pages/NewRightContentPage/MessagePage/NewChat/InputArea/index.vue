<template>
  <div class="message-input-area" @paste="handlePaste" @dragover.prevent @drop.prevent="handleDrop">
    <!-- 附件预览（统一行为） -->
  <div v-if="attachments.length" class="attachments-preview" ref="attachmentsPreviewRef" @wheel.prevent="onPreviewWheel" @touchstart="onPreviewTouchStart" @touchmove="onPreviewTouchMove">
      <div v-for="(item, idx) in attachments" :key="item.id" class="attachment-chip">
        <div class="thumb" v-if="item.isImage && item.previewUrl">
          <img :src="item.previewUrl" alt="preview" />
        </div>
        <div class="file-icon" v-else>
          <svg v-if="item.file.type.startsWith('video/')" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
          <svg v-else-if="item.file.type.startsWith('audio/')" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
        </div>
        <div class="meta">
          <span class="name" :title="item.file.name">{{ item.file.name }}</span>
          <span class="size">{{ formatSize(item.file.size) }}</span>
        </div>
        <button class="remove" @click="removeAttachment(idx)" title="移除">×</button>
      </div>
      
    </div>
    <div v-if="hasReplyTarget" class="reply-target-banner" role="status">
      <div class="reply-target-text">
        <div class="reply-target-title">
          回复 {{ replySenderLabel }}
        </div>
        <div class="reply-target-summary">
          <span v-if="replyLoading" class="reply-target-spinner" aria-label="加载中"></span>
          <span v-else>{{ replySummaryText }}</span>
        </div>
      </div>
      <button class="reply-target-close" @click="cancelReply" title="取消回复" type="button">×</button>
    </div>
    <div class="message-input">
      <textarea 
        v-model="localMessage"
        @input="handleInput"
        @keydown="handleKeydown"
        placeholder="输入消息..."
        :disabled="isBusy" 
        ref="inputRef"
      ></textarea>
      <div class="more-actions">
        <button class="more-btn" @click.stop="toggleMoreActions" title="更多操作">
          <svg class="more-icon" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="20" fill="var(--chat-icon-bubble-bg)" />
            <path d="M20 15.1665V25.8332" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14.6665 20.4998H25.3332" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <transition name="fade">
          <div v-if="showMoreActions" class="actions-menu">
            <ul>
              <li @click="triggerFileUpload">
                <span class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </span>
                <span>文件上传</span>
              </li>
              <li class="disabled">
                <span class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                </span>
                <span>音视频通话</span>
              </li>
            </ul>
          </div>
        </transition>
      </div>
      <button 
        @click="handleSendMessage" 
        :disabled="(!localMessage.trim() && attachments.length === 0) || isBusy"
        class="send-button"
      >
        <span v-if="isBusy" class="spinner" aria-label="发送中"></span>
        <svg v-else class="send-icon" width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.9918 13.125L9.49182 7.13188C9.31483 7.03259 9.11182 6.98951 8.90976 7.00835C8.7077 7.02718 8.51615 7.10705 8.36056 7.23734C8.20497 7.36763 8.09271 7.54218 8.03868 7.73779C7.98465 7.9334 7.99141 8.14083 8.05807 8.3325L9.99557 13.9869C9.99532 13.989 9.99532 13.9911 9.99557 13.9931C9.99522 13.9952 9.99522 13.9973 9.99557 13.9994L8.05807 19.6663C8.00469 19.817 7.98825 19.9784 8.01014 20.1369C8.03203 20.2953 8.09161 20.4462 8.18388 20.5769C8.27615 20.7075 8.39841 20.8141 8.54041 20.8878C8.68241 20.9614 8.83999 20.9999 8.99995 21C9.17349 20.9996 9.34398 20.9544 9.49495 20.8688L19.9893 14.8656C20.1441 14.7789 20.2731 14.6526 20.3629 14.4996C20.4528 14.3466 20.5003 14.1724 20.5006 13.995C20.5009 13.8175 20.454 13.6432 20.3647 13.4899C20.2754 13.3366 20.1469 13.2098 19.9924 13.1225L19.9918 13.125ZM8.99995 20V19.9944L10.8837 14.5H14.4999C14.6326 14.5 14.7597 14.4473 14.8535 14.3536C14.9473 14.2598 14.9999 14.1326 14.9999 14C14.9999 13.8674 14.9473 13.7402 14.8535 13.6465C14.7597 13.5527 14.6326 13.5 14.4999 13.5H10.8887L9.0037 8.0075L8.99995 8L19.4999 13.9894L8.99995 20Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
    <!-- @提及列表 -->
    <div v-if="showMentionList" class="mention-list">
      <div 
        v-for="(user, index) in mentionList" 
        :key="user.userId"
        class="mention-item"
        :class="{ 'selected': index === selectedMentionIndex }"
        @click="selectMention(user)"
      >
        <span class="mention-display-name">{{ user.displayName }}</span>
        <span class="mention-user-id">{{ user.username }}</span>
      </div>
    </div>
    <input type="file" ref="fileInput" @change="handleFileSelect" style="display: none;" multiple />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, type Ref, computed, watch } from 'vue'
import { messageServiceV2 } from '@/services/matrix/messages'
import { matrixClientV2 } from '@/services/matrix/client'
import { buildMentionPayload, collectClipboardFiles, collectDragFiles } from '@/services/Operations/MsgInput'
import type { ReplyInputState } from '@/services/Operations/MsgReplyInput'
import { resolveUserDisplayName } from '@/utils/displayName'
import { useIDmapStore } from '@/stores/IDmap'

interface Props {
  sending: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'send-message': [message: { plainText: string; htmlText: string; hasMentions: boolean }, replyToEventId?: string]
  'mention-user': [userId: string, displayName: string]
}>()

const idmapStore = useIDmapStore()

// 辅助函数：严格从 IDMap 获取 username，不显示 MatrixID
const getDisplayUsername = (userId: string) => {
  const mapped = idmapStore.getByMatrixId(userId)
  return mapped?.username || '' 
}

// 解析提及标记：使用公共方法
const parseMentions = (message: string) => buildMentionPayload(message)

// 本地管理输入状态
const localMessage = ref('')
const showMoreActions = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const attachments = ref<Array<{ id: string; file: File; isImage: boolean; previewUrl?: string }>>([])
// 本地发送状态（用于防连点 + 展示加载）
const localSending = ref(false)
const isBusy = computed(() => props.sending || localSending.value)
// 预览条滚动支持（鼠标滚轮横向、移动端滑动）
const attachmentsPreviewRef = ref<HTMLDivElement | null>(null)
let touchStartX = 0

const onPreviewWheel = (e: WheelEvent) => {
  const el = attachmentsPreviewRef.value
  if (!el) return
  const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX
  el.scrollLeft += delta
}

const onPreviewTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0]?.clientX || 0
}

const onPreviewTouchMove = (e: TouchEvent) => {
  const el = attachmentsPreviewRef.value
  if (!el) return
  const currentX = e.touches[0]?.clientX || 0
  const dx = touchStartX - currentX
  el.scrollLeft += dx
  touchStartX = currentX
}

// @功能相关状态
const showMentionList = ref(false)
const mentionList = ref<Array<{userId: string, displayName: string, username?: string}>>([])
const selectedMentionIndex = ref(-1)
const mentionStartIndex = ref(-1)

// 从父组件注入 currentRoomId 以及回复上下文
const currentRoomId = inject<Ref<string | null>>('currentRoomId')
const chatContext = inject<any>('chatContext', null)
const replyInput = chatContext?.replyInput as {
  state: ReplyInputState
  hasReply?: { value: boolean }
  clearReplyTarget?: () => void
  getReplyPayload?: () => { roomId: string; eventId: string } | null
} | undefined
const replyState = replyInput?.state
const hasReplyTarget = computed(() => !!replyInput?.hasReply?.value)
const replyLoading = computed(() => replyState?.isLoading ?? false)
const replySenderLabel = computed(() => {
  const preview = replyState?.preview
  return preview?.senderName || preview?.senderId || '该消息'
})
const replySummaryText = computed(() => {
  if (replyLoading.value) return '加载中...'
  return replyState?.preview?.summary || '正在回复该消息'
})
const cancelReply = () => replyInput?.clearReplyTarget?.()

const resolveReplyToEventId = () => {
  if (!replyInput?.getReplyPayload) return undefined
  const payload = replyInput.getReplyPayload()
  if (!payload) return undefined
  if (payload.roomId !== currentRoomId?.value) return undefined
  return payload.eventId
}

const handleSendMessage = async () => {
  if (isBusy.value) return
  if (!localMessage.value.trim() && attachments.value.length === 0) return

  const replyToEventId = resolveReplyToEventId()

  // 如果有附件，则进行"复合消息"发送（多事件，同一 bundle）
  if (attachments.value.length > 0 && currentRoomId?.value) {
    try {
      localSending.value = true
      const files = attachments.value.map(a => a.file)
      // 仅当有实际文本内容时才构建 payload，否则传 null 避免发送空文本消息
      const payload = localMessage.value.trim() ? parseMentions(localMessage.value) : null
      await messageServiceV2.发送复合消息(currentRoomId.value, payload, files, { textFirst: false, replyToEventId })
    } catch (e) {
      console.error('[V2] 发送复合消息失败:', e)
    } finally {
      localSending.value = false
    }
    // 清理预览URL并重置
    attachments.value.forEach(a => a.previewUrl && URL.revokeObjectURL(a.previewUrl))
    attachments.value = []
    localMessage.value = ''
    inputRef.value?.focus()
    if (replyToEventId) {
      replyInput?.clearReplyTarget?.()
    }
    return
  }

  // 仅文本
  const parsedMessage = parseMentions(localMessage.value)
  emit('send-message', parsedMessage, replyToEventId)
  if (replyToEventId) {
    replyInput?.clearReplyTarget?.()
  }
  // 纯文本路径：做一次短暂的防连点冷却
  localSending.value = true
  localMessage.value = ''
  inputRef.value?.focus()
  setTimeout(() => (localSending.value = false), 1200)
}

// 处理输入事件，检测@符号
const handleInput = async (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const value = target.value
  const cursorPosition = target.selectionStart || 0

  // 检测@符号
  const atIndex = value.lastIndexOf('@', cursorPosition - 1)
  if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === ' ' || value[atIndex - 1] === '\n')) {
    const searchText = value.substring(atIndex + 1, cursorPosition)
    mentionStartIndex.value = atIndex

    if (searchText.length > 0) {
      // 搜索用户
      await searchUsers(searchText)
      showMentionList.value = mentionList.value.length > 0
    } else {
      // 显示所有用户
      await loadAllUsers()
      showMentionList.value = mentionList.value.length > 0
    }
    selectedMentionIndex.value = 0
  } else {
    showMentionList.value = false
    mentionStartIndex.value = -1
  }
}

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (showMentionList.value) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        selectedMentionIndex.value = Math.min(selectedMentionIndex.value + 1, mentionList.value.length - 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        selectedMentionIndex.value = Math.max(selectedMentionIndex.value - 1, 0)
        break
      case 'Enter':
      case 'Tab':
        event.preventDefault()
        if (selectedMentionIndex.value >= 0 && selectedMentionIndex.value < mentionList.value.length) {
          selectMention(mentionList.value[selectedMentionIndex.value])
        }
        break
      case 'Escape':
        showMentionList.value = false
        mentionStartIndex.value = -1
        break
    }
    return
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSendMessage()
  }
}

// 搜索用户
const searchUsers = async (searchText: string) => {
  if (!currentRoomId?.value) return

  try {
    const client = matrixClientV2.getAuthedClient()
    if (!client) return

    const room = client.getRoom(currentRoomId.value)
    if (!room) return

    const members = room.getMembers()
    const filteredMembers = members
      .filter((member: any) => {
        const displayName = resolveUserDisplayName({ matrixId: member.userId, matrixDisplayName: member.name || null })
        return displayName.toLowerCase().includes(searchText.toLowerCase()) &&
               member.userId !== client.getUserId() // 不显示自己
      })
      .slice(0, 10) // 限制数量

    mentionList.value = filteredMembers.map((member: any) => {
      const displayUsername = getDisplayUsername(member.userId)
      return {
        userId: member.userId,
        username: displayUsername,
        displayName: resolveUserDisplayName({ matrixId: member.userId, matrixDisplayName: member.name || null })
      }
    })
  } catch (error) {
    console.error('搜索用户失败:', error)
    mentionList.value = []
  }
}

// 加载所有用户
const loadAllUsers = async () => {
  if (!currentRoomId?.value) return

  try {
    const client = matrixClientV2.getAuthedClient()
    if (!client) return

    const room = client.getRoom(currentRoomId.value)
    if (!room) return

    const members = room.getMembers()
    mentionList.value = members
      .filter((member: any) => member.userId !== client.getUserId()) // 不显示自己
      .slice(0, 10) // 限制数量
      .map((member: any) => {
        const displayUsername = getDisplayUsername(member.userId)
        return {
          userId: member.userId,
          username: displayUsername,
          displayName: resolveUserDisplayName({ matrixId: member.userId, matrixDisplayName: member.name || null })
        }
      })
  } catch (error) {
    console.error('加载用户失败:', error)
    mentionList.value = []
  }
}

// 选择提及用户
const selectMention = (user: {userId: string, displayName: string}) => {
  if (mentionStartIndex.value === -1) return

  const beforeAt = localMessage.value.substring(0, mentionStartIndex.value)
  const afterCursor = localMessage.value.substring((inputRef.value?.selectionStart || 0))
  const mentionText = `@[${user.displayName}](${user.userId}) `

  localMessage.value = beforeAt + mentionText + afterCursor

  // 设置光标位置
  setTimeout(() => {
    if (inputRef.value) {
      const newPosition = beforeAt.length + mentionText.length
      inputRef.value.setSelectionRange(newPosition, newPosition)
      inputRef.value.focus()
    }
  }, 0)

  showMentionList.value = false
  mentionStartIndex.value = -1
}

// 切换更多操作菜单
const toggleMoreActions = () => {
  showMoreActions.value = !showMoreActions.value
}

// 点击外部关闭菜单
const closeMoreActionsOnClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.more-actions')) {
    showMoreActions.value = false
  }
}

// 触发文件上传
const triggerFileUpload = () => {
  fileInput.value?.click()
  showMoreActions.value = false
}

// 处理文件选择：加入队列，等待发送
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const files = Array.from(target.files)
  for (const file of files) {
    const isImage = file.type.startsWith('image/')
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    const item: { id: string; file: File; isImage: boolean; previewUrl?: string } = { id, file, isImage }
    if (isImage) item.previewUrl = URL.createObjectURL(file)
    attachments.value.push(item)
  }
  target.value = ''
}

// 粘贴图片/文件：加入队列，等待发送
const handlePaste = async (e: ClipboardEvent) => {
  const files = collectClipboardFiles(e)
  if (files.length === 0) return
  for (const file of files) {
    const isImage = file.type.startsWith('image/')
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    const item: { id: string; file: File; isImage: boolean; previewUrl?: string } = { id, file, isImage }
    if (isImage) item.previewUrl = URL.createObjectURL(file)
    attachments.value.push(item)
  }
}

// 拖拽文件：加入队列，等待发送
const handleDrop = async (e: DragEvent) => {
  const files = collectDragFiles(e)
  if (files.length === 0) return
  for (const file of files) {
    const isImage = file.type.startsWith('image/')
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    const item: { id: string; file: File; isImage: boolean; previewUrl?: string } = { id, file, isImage }
    if (isImage) item.previewUrl = URL.createObjectURL(file)
    attachments.value.push(item)
  }
}

const removeAttachment = (idx: number) => {
  const it = attachments.value[idx]
  if (!it) return
  if (it.previewUrl) URL.revokeObjectURL(it.previewUrl)
  attachments.value.splice(idx, 1)
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`
}


onMounted(() => {
  inputRef.value?.focus();
  document.addEventListener('click', closeMoreActionsOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMoreActionsOnClickOutside)
})

watch(() => currentRoomId?.value, (roomId) => {
  if (!replyInput?.getReplyPayload) return
  const payload = replyInput.getReplyPayload()
  if (payload && payload.roomId !== roomId) {
    replyInput.clearReplyTarget?.()
  }
})

// 暴露方法给父组件
defineExpose({
  insertMention: (displayName: string, userId?: string) => {
    // 如果没有提供userId，使用displayName作为userId（临时方案）
    const actualUserId = userId || displayName
    const mentionText = `@[${displayName}](${actualUserId}) `
    localMessage.value = localMessage.value + mentionText
    
    // 聚焦输入框
    setTimeout(() => {
      if (inputRef.value) {
        inputRef.value.focus()
        const newPosition = localMessage.value.length
        inputRef.value.setSelectionRange(newPosition, newPosition)
      }
    }, 0)
  }

  ,
  setText: (text: string) => {
    localMessage.value = text
    setTimeout(() => {
      if (inputRef.value) {
        inputRef.value.focus()
        const newPosition = localMessage.value.length
        inputRef.value.setSelectionRange(newPosition, newPosition)
      }
    }, 0)
  }
})
</script>

<style scoped>
.message-input-area {
  padding: 12px; /* 从16px缩小到12px */
 background: var(--bg-color-third);

  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap; /* 允许预览条占满一行，输入区在下一行 */
  gap: 12px; /* 增加间距 */
  align-items: center;
  position: relative; /* 为@提及列表提供定位基准 */
  width: 100%;
  box-sizing: border-box;
}

.attachments-preview { display: flex; flex-wrap: nowrap; gap: 8px; margin-bottom: 8px; width: 100%; flex-basis: 100%; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior-inline: contain; }
.attachment-chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1px solid rgba(154, 119, 253, 0.45); border-radius: 12px; background: #F7F4FF; }
.attachment-chip .thumb { width: 36px; height: 36px; border-radius: 4px; overflow: hidden; flex-shrink: 0; }
.attachment-chip .thumb img { width: 100%; height: 100%; object-fit: cover; }
.attachment-chip .file-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 4px; background: rgba(154, 119, 253, 0.1); color: var(--color-primary); font-size: var(--font-size-base); }
.attachment-chip .meta { display: flex; flex-direction: column; max-width: 220px; }
.attachment-chip .meta .name { font-size: var(--font-size-xs); color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.attachment-chip .meta .size { font-size: calc(var(--font-size-base) * 1.1); color: var(--text-color-secondary); }
.attachment-chip .remove { margin-left: 4px; border: none; background: transparent; color: var(--text-color-secondary); cursor: pointer; font-size: calc(var(--font-size-sm) + 1px); }
.reply-target-banner { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 8px 12px; border-radius: 10px; background: var(--bg-color-third); border: 1px solid var(--border-color); gap: 8px; }
.reply-target-text { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.reply-target-title { font-size: var(--font-size-xs); font-weight: 600; color: var(--text-color); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.reply-target-summary { font-size: var(--font-size-xs); color: var(--text-color-secondary); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.reply-target-close { border: none; background: transparent; color: var(--text-color-secondary); cursor: pointer; font-size: var(--font-size-lg); line-height: 1; padding: 2px 6px; }
.reply-target-close:hover { color: var(--text-color); }
.reply-target-spinner { width: 12px; height: 12px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; display: inline-block; animation: spin 0.8s linear infinite; margin-right: 4px; }

.message-input {
  display: flex;
  flex: 1;
  gap: 8px; /* 增加间距 */
  background: var(--bg-color-third);

  border-radius: 12px;
  padding: 14px 16px 48px 16px;
  align-items: flex-start;
  border: 1px solid var(--border-color);
  min-width: 0;
  min-height: 110px;
  position: relative;
  box-sizing: border-box;
}

.message-input textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-color);
  font-size: var(--font-size-sm);
  outline: none;
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 0;
  height: auto;
  line-height: 1.6;
  resize: none;
  min-height: 56px;
  width: 100%;
}

.message-input textarea::placeholder {
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .message-input-area {
    padding: 8px;
    gap: 8px;
  }

  .message-input {
    padding: 12px 12px 44px 12px;
    border-radius: 10px;
    min-height: 96px;
  }

  .message-input textarea {
    font-size: var(--font-size-xs);
  }

  .more-btn {
    width: 28px;
    height: 28px;
  }
}

.more-actions {
  position: absolute;
  right: 56px;
  bottom: 10px;
  flex-shrink: 0;
}

.more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid transparent;
  background-color: var(--bg-color-third);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--chat-icon-color, var(--text-color-secondary, #666));
}

.more-btn:hover {
  background: var(--bg-color-third);
  color: var(--chat-icon-color-hover, var(--color-primary, #1890ff));
}

.more-icon {
  color: inherit;
}

.actions-menu {
  position: absolute;
  bottom: 120%;
  right: 0;
 background: var(--bg-color-third);

  border-radius: 6px; /* 从8px缩小到6px */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  width: 140px; /* 从160px缩小到140px */
  z-index: 10;
  overflow: hidden;
  padding: 6px 0; /* 从8px 0缩小到6px 0 */
}

.actions-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.actions-menu li {
  display: flex;
  align-items: center;
  padding: 6px 12px; /* 从8px 14px缩小到6px 12px */
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: var(--font-size-xs); /* 从13px缩小到12px */
  color: var(--text-color);
}

.actions-menu li:hover {
  background-color: var(--bg-color-hover);
}

.actions-menu .icon {
  margin-right: 10px; /* 从12px缩小到10px */
  font-size: calc(var(--font-size-sm) + 1px); /* 从16px缩小到14px */
  display: inline-flex;
  align-items: center;
  color: inherit;
}

.actions-menu .disabled {
  color: var(--text-color-disabled, #ccc);
  cursor: not-allowed;
}

.actions-menu .disabled:hover {
  background-color: transparent;
}

.send-button {
  position: absolute;
  right: 12px;
  bottom: 10px;
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--bg-color-third);
  color: var(--chat-send-icon-color, var(--color-primary, #5865f2));
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: 500;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover:not(:disabled) {
  background: var(--bg-color-hover);
}

.send-button:disabled {
  background: var(--bg-color-third);
  color: var(--text-color-secondary);
  cursor: not-allowed;
}

.send-icon {
  color: inherit;
}

/* 发送中小圆圈动画 */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* @提及列表样式 */
.mention-list {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
 background: var(--bg-color-third);


  border-radius: 8px;
  width: 50%;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  margin-bottom: 8px;
  margin-left: 5vw;
}

.mention-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--border-color-light, #f0f0f0);
}

.mention-item:last-child {
  border-bottom: none;
}

.mention-item:hover,
.mention-item.selected {
  background-color: var(--bg-color, #f5f5f5);
}

.mention-display-name {
  font-weight: 500;
  color: var(--text-color);
  font-size: calc(var(--font-size-sm) + 1px);
}

.mention-user-id {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary, #666);
  margin-left: 8px;
}
</style>
