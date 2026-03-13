<template>
  <div class="input-area" @paste="handlePaste" @dragover.prevent @drop.prevent="handleDrop"
    @click="handleContainerClick">
    <div v-if="attachments.length" class="attachments-preview" ref="attachmentsPreviewRef"
      @wheel="handleAttachmentsWheel">
      <div v-for="(item, idx) in attachments" :key="item.id" class="attachment-chip">
        <div class="thumb" v-if="item.isImage && item.previewUrl">
          <img :src="item.previewUrl" alt="preview" />
        </div>
        <div class="meta">
          <span class="name" :title="item.file.name">{{ item.file.name }}</span>
          <span class="size">{{ formatFileSize(item.file.size) }}</span>
        </div>
        <button class="remove" @click="removeAttachment(idx)" title="移除" type="button">×</button>
      </div>
    </div>

    <div v-if="editDraft" class="edit-preview">
      <div class="reply-meta">
        <span class="reply-label">编辑</span>
        <span class="reply-sender">原消息</span>
      </div>
      <div class="reply-content">{{ editDraft.content }}</div>
      <button class="reply-close" type="button" @click="systemStore.clearEditDraft">×</button>
    </div>

    <div v-if="replyDraft" class="reply-preview">
      <div class="reply-meta">
        <span class="reply-label">回复</span>
        <span class="reply-sender">{{ replyDraft.senderName }}</span>
      </div>
      <div class="reply-content">{{ replyDraft.content }}</div>
      <button class="reply-close" type="button" @click="systemStore.clearReplyDraft">×</button>
    </div>

    <div class="input-surface">
      <textarea v-model="localMessage" class="message-input" rows="6" placeholder="输入消息…" :disabled="isBusy"
        @input="handleInput" @keydown="handleKeydown" ref="inputRef"></textarea>
      <div class="input-actions">
        <div class="ai-menu-wrap" @click.stop v-if="systemStore.currentFunction === 'Message'">
          <button class="action-btn action-btn--rewrite" type="button" title="AI改写" @click="toggleAiMenu">
            <img src="@/assets/Project/components/Room/改写.svg" alt="AI改写" />
            <span>AI改写</span>
          </button>

          <div v-if="showAiMenu" class="ai-menu">
            <button class="ai-menu-item" type="button" @click="handleAiOptionClick('formal')">
              <img src="@/assets/Project/components/Room/AI/书面表达.svg" alt="书面表达" />
              <span>书面表达</span>
            </button>
            <button class="ai-menu-item" type="button" @click="handleAiOptionClick('lively')">
              <img src="@/assets/Project/components/Room/AI/灵动表达.svg" alt="灵动表达" />
              <span>灵动表达</span>
            </button>

            <div class="ai-menu-divider"></div>

            <div class="ai-submenu-wrap">
              <button class="ai-menu-item ai-menu-item--sub" type="button" @click="toggleAiSubMenu">
                <img src="@/assets/Project/components/Room/AI/引用资料.svg" alt="引用资料" />
                <span>引用资料</span>
                <img class="ai-arrow" src="@/assets/Project/components/Room/AI/右箭头.svg" alt="展开" />
              </button>

              <div v-if="showAiSubMenu" class="ai-submenu">
                <button class="ai-menu-item" type="button" @click="handleAiOptionClick('db')">
                  <img src="@/assets/Project/components/Room/AI/引用数据库.svg" alt="引用数据库" />
                  <span>引用数据库</span>
                </button>
                <button class="ai-menu-item" type="button" @click="handleAiOptionClick('kb')">
                  <img src="@/assets/Project/components/Room/AI/引用知识库.svg" alt="引用知识库" />
                  <span>引用知识库</span>
                </button>
              </div>
            </div>

            <div class="ai-menu-divider"></div>

            <button class="ai-menu-item" type="button" @click="handleAiOptionClick('deep')">
              <img src="@/assets/Project/components/Room/AI/深思熟虑.svg" alt="深思熟虑" />
              <span>深思熟虑</span>
            </button>
          </div>
        </div>


        <div class="ai-menu-wrap" @click.stop v-if="systemStore.currentFunction === 'Mission'">
          <button class="action-btn action-btn--rewrite" type="button" title="使用Skill" @click="toggleSkillMenu">
            <img src="@/assets/Project/components/Room/skill.svg" alt="使用Skill" />
            <span>使用Skill</span>
          </button>

          <div v-if="showSkillMenu" class="ai-menu">
            <button class="ai-menu-item" type="button" @click="handleSkillOptionClick('deep')">
              <img src="@/assets/Project/components/Room/AI/深思熟虑.svg" alt="深思熟虑" />
              <span>XXX</span>
            </button>
          </div>
        </div>



        <button class="action-btn action-btn--attach" type="button" title="选择文件" @click="triggerFileUpload">
          <img src="@/assets/Project/components/Room/链接.svg" alt="添加附件" />
          <span>添加附件</span>
        </button>
        <button class="action-btn action-btn--send" :class="{ 'is-waiting-reply': isAwaitingBotReply }" type="button" :disabled="!canSend" :title="isAwaitingBotReply ? '请等待 Bot 回复上一条消息' : '发送消息'" @click="handleSend">
          <img v-if="!sendButtonBusy" src="@/assets/Project/components/Room/发送.svg" alt="发送消息" />
          <span v-if="sendButtonBusy" class="spinner" :aria-label="isAwaitingBotReply ? '等待 Bot 回复' : '发送中'"></span>
          <span>{{ sendButtonLabel }}</span>
        </button>
        <input type="file" ref="fileInput" @change="handleFileSelect" style="display: none;" multiple />
      </div>
    </div>
    <div v-if="showMentionList" class="mention-list">
      <div v-for="(user, index) in mentionList" :key="user.userId" class="mention-item"
        :class="{ selected: index === selectedMentionIndex }" @click="selectMention(user)">
        <span class="mention-display-name">{{ user.displayName }}</span>
      </div>
    </div>
    <div class="action-bar">
      <div class="hint">{{ isAwaitingBotReply ? 'Bot 正在回复上一条消息，请稍候再发送' : 'Enter 发送，Shift+Enter 换行' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useBotRoomSendGateStore } from '@/stores/BotRoomSendGate'
import { useSystemStore } from '@/stores/System'
import { matrixMessageService } from '@/services/Matrix/message'
import { matrixClient } from '@/services/Matrix/client'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { buildMentionPayload, collectClipboardFiles, collectDragFiles } from '@/services/Matrix/MSG/sendMessage'
import { formatFileSize } from '@/utils/FileSize'
import { connectUserbotForRoom } from '@/services/Project/UserBot/useUserbotWebSocket'
import { openMessageDialog } from '@/components/MessageDialog/open';

type AttachmentItem = { id: string; file: File; isImage: boolean; previewUrl?: string }

const botRoomSendGateStore = useBotRoomSendGateStore()
const systemStore = useSystemStore()
const currentRoomId = computed(() => systemStore.currentSystemRoomId)
const currentRoomType = computed(() => {
  const roomId = currentRoomId.value
  return roomId ? systemStore.getRoomTypeById(roomId) : null
})
const isBotRoom = computed(() => currentRoomType.value === 'bot')
const editDraft = computed(() => {
  const draft = systemStore.editDraft
  if (!draft) return null
  if (draft.roomId !== currentRoomId.value) return null
  return draft
})
const replyDraft = computed(() => {
  const draft = systemStore.replyDraft
  if (!draft) return null
  if (draft.roomId !== currentRoomId.value) return null
  if (editDraft.value) return null
  return draft
})

const localMessage = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const attachments = ref<AttachmentItem[]>([])
const attachmentsPreviewRef = ref<HTMLElement | null>(null)
const localSending = ref(false)
const isBusy = computed(() => localSending.value)
const isAwaitingBotReply = computed(() => {
  const roomId = currentRoomId.value
  return !!roomId && isBotRoom.value && botRoomSendGateStore.isWaiting(roomId)
})
const sendButtonBusy = computed(() => isBusy.value || isAwaitingBotReply.value)
const sendButtonLabel = computed(() => isAwaitingBotReply.value ? '等待回复' : '发送消息')
const canSend = computed(() => {
  return (localMessage.value.trim().length > 0 || attachments.value.length > 0)
    && !isBusy.value
    && !isAwaitingBotReply.value
})

const showMentionList = ref(false)
const mentionList = ref<Array<{ userId: string; displayName: string }>>([])
const selectedMentionIndex = ref(-1)
const mentionStartIndex = ref(-1)
const showAiMenu = ref(false)
const showAiSubMenu = ref(false)
const showSkillMenu = ref(false)
const showSkillSubMenu = ref(false)

type ExternalInputEventDetail = { text?: string }

const handleExternalInputText = (event: Event) => {
  const customEvent = event as CustomEvent<ExternalInputEventDetail>
  const text = customEvent.detail?.text
  if (typeof text !== 'string') return
  localMessage.value = text
  setTimeout(() => {
    if (!inputRef.value) return
    inputRef.value.focus()
    const end = localMessage.value.length
    inputRef.value.setSelectionRange(end, end)
  }, 0)
}

const toggleAiMenu = () => {
  showAiMenu.value = !showAiMenu.value
  if (!showAiMenu.value) showAiSubMenu.value = false
}

const toggleAiSubMenu = () => {
  showAiSubMenu.value = !showAiSubMenu.value
}

const toggleSkillMenu = () => {
  showSkillMenu.value = !showSkillMenu.value
  if (!showSkillMenu.value) showSkillSubMenu.value = false
}

const handleAiOptionClick = (_mode: 'formal' | 'lively' | 'db' | 'kb' | 'deep') => {
  void _mode
  showAiMenu.value = false
  showAiSubMenu.value = false
}
const handleSkillOptionClick = (_mode: 'deep') => {
  void _mode
  showSkillMenu.value = false
  showSkillSubMenu.value = false
}

const handleContainerClick = () => {
  showAiMenu.value = false
  showAiSubMenu.value = false
}

/**
 * 打开系统文件选择框。
 * （通过原生文件选择触发后续 change 事件）。
 * 逻辑：调用隐藏的 file input.click()。
 */
const triggerFileUpload = () => {
  fileInput.value?.click()
}

/**
 * 处理文件选择变更。
 * 输入：原生 change 事件（包含 FileList）。
 * 输出：无（更新 attachments 列表）。
 * 逻辑：把选中的文件逐个转为附件项并清空 input 值。
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const files = Array.from(target.files)
  for (const file of files) {
    pushAttachment(file)
  }
  target.value = ''
}

/**
 * 处理粘贴事件中的文件。
 * 输入：剪贴板事件。
 * 输出：无（更新 attachments 列表）。
 * 逻辑：提取剪贴板文件并加入附件。
 */
const handlePaste = (event: ClipboardEvent) => {
  const files = collectClipboardFiles(event)
  if (files.length === 0) return
  for (const file of files) {
    pushAttachment(file)
  }
}

/**
 * 处理拖拽投放文件。
 * 输入：拖拽事件。
 * 输出：无（更新 attachments 列表）。
 * 逻辑：提取拖拽文件并加入附件。
 */
const handleDrop = (event: DragEvent) => {
  const files = collectDragFiles(event)
  if (files.length === 0) return
  for (const file of files) {
    pushAttachment(file)
  }
}

/**
 * 处理输入框键盘事件。
 * 输入：键盘事件。
 * 输出：无。
 * 逻辑：
 * - 当提及列表打开时处理上下选择、确认和取消。
 * - Enter 发送，Shift+Enter 换行。
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (showMentionList.value) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        selectedMentionIndex.value = Math.min(selectedMentionIndex.value + 1, mentionList.value.length - 1)
        return
      case 'ArrowUp':
        event.preventDefault()
        selectedMentionIndex.value = Math.max(selectedMentionIndex.value - 1, 0)
        return
      case 'Enter':
      case 'Tab':
        event.preventDefault()
        if (selectedMentionIndex.value >= 0 && selectedMentionIndex.value < mentionList.value.length) {
          const picked = mentionList.value[selectedMentionIndex.value]
          if (picked) selectMention(picked)
        }
        return
      case 'Escape':
        showMentionList.value = false
        mentionStartIndex.value = -1
        return
    }
  }

  if (event.key !== 'Enter') return
  if (event.shiftKey) return
  event.preventDefault()
  if (canSend.value) void handleSend()
}

/**
 * 处理输入变化，用于触发 @ 提及候选。
 * 输入：input 事件。
 * 输出：无（更新 mentionList、showMentionList 等状态）。
 * 逻辑：检测光标前的 @，按搜索词筛选成员列表。
 */
const handleInput = async (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const value = target.value
  const cursorPosition = target.selectionStart || 0

  const atIndex = value.lastIndexOf('@', cursorPosition - 1)
  if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === ' ' || value[atIndex - 1] === '\n')) {
    const searchText = value.substring(atIndex + 1, cursorPosition)
    mentionStartIndex.value = atIndex

    if (searchText.length > 0) {
      await searchUsers(searchText)
      showMentionList.value = mentionList.value.length > 0
    } else {
      await loadAllUsers()
      showMentionList.value = mentionList.value.length > 0
    }
    selectedMentionIndex.value = 0
  } else {
    showMentionList.value = false
    mentionStartIndex.value = -1
  }
}

/**
 * 发送消息（文本/附件/复合）。
 * 输入：无（读取当前输入与附件状态）。
 * 输出：Promise<void>。
 * 逻辑：
 * - 有文件：走复合消息发送。
 * - 仅文本：根据是否包含提及选择发送接口。
 */
const handleSend = async () => {

  const hasValidSession = await matrixClient.validateCurrentSession()
  if (!hasValidSession) {
   openMessageDialog(`发送失败: 当前token无效或已过期，请刷新页面`)
    console.error('[System:InputArea:handleSend] 当前 Matrix token 无效或已过期，已阻止发送消息')
    return
  }

  if (!canSend.value) return
  const roomId = currentRoomId.value
  if (!roomId) return
  const editEventId = editDraft.value?.eventId
  const replyToEventId = replyDraft.value?.eventId

  const text = localMessage.value.trim()
  const mentionPayload = text ? buildMentionPayload(text) : null
  const files = attachments.value.map((item) => item.file)

  try {
    void connectUserbotForRoom(roomId)
    localSending.value = true
    if (editEventId && text) {
      await matrixMessageService.editText(roomId, text, editEventId)
    } else if (files.length > 0) {
      await matrixMessageService.sendCompositeMessage(roomId, mentionPayload?.plainText || null, files, {
        textFirst: false,
        mentions: mentionPayload?.hasMentions ? mentionPayload.mentions : undefined,
        replyToEventId,
      })
    } else if (text) {
      if (mentionPayload?.hasMentions) {
        await matrixMessageService.sendTextWithMentions(roomId, mentionPayload.plainText, mentionPayload.mentions, undefined, {
          replyToEventId,
        })
      } else {
        await matrixMessageService.sendText(roomId, text, undefined, { replyToEventId })
      }
    }
    if (isBotRoom.value) {
      botRoomSendGateStore.markWaiting(roomId)
    }
  } finally {
    cleanupAfterSend()
  }
}

/**
 * 发送完成后的清理。
 * 输入：无。
 * 输出：无。
 * 逻辑：释放预览 URL、清空输入与附件、恢复焦点。
 */
const cleanupAfterSend = () => {
  attachments.value.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl))
  attachments.value = []
  localMessage.value = ''
  localSending.value = false
  systemStore.clearReplyDraft()
  systemStore.clearEditDraft()
  inputRef.value?.focus()
}

/**
 * 添加一个附件。
 * 输入：File。
 * 输出：无（更新 attachments 列表）。
 * 逻辑：生成唯一 id，图片文件生成预览 URL。
 */
const pushAttachment = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const item: AttachmentItem = { id, file, isImage }
  if (isImage) item.previewUrl = URL.createObjectURL(file)
  attachments.value.push(item)
}

/**
 * 移除指定附件。
 * 输入：附件索引。
 * 输出：无。
 * 逻辑：释放预览 URL 并从列表删除。
 */
const removeAttachment = (idx: number) => {
  const it = attachments.value[idx]
  if (!it) return
  if (it.previewUrl) URL.revokeObjectURL(it.previewUrl)
  attachments.value.splice(idx, 1)
}

/**
 * 处理附件栏滚轮横向滚动。
 * 输入：滚轮事件。
 * 输出：无。
 * 逻辑：当有横向溢出时，把垂直滚动量转换为横向滚动。
 */
const handleAttachmentsWheel = (event: WheelEvent) => {
  const container = attachmentsPreviewRef.value
  if (!container) return
  if (container.scrollWidth <= container.clientWidth) return
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  event.preventDefault()
  container.scrollLeft += event.deltaY
}

/**
 * 在当前房间内搜索成员（用于 @ 提及）。
 * 输入：搜索关键字。
 * 输出：Promise<void>。
 * 逻辑：过滤成员并更新 mentionList。
 */
const searchUsers = async (searchText: string) => {
  const roomId = currentRoomId.value
  if (!roomId) return

  const lowered = searchText.toLowerCase()
  const selfId = matrixClient.getAuthedClient()?.getUserId() ?? ''
  const members = MatrixClientRoom.getRoomMembersById(roomId)
  const list = members
    .filter((member) => member?.userId && member.userId !== selfId)
    .map((member) => ({
      userId: member.userId,
      displayName: member.name || member.userId,
    }))
    .filter((member) =>
      member.displayName.toLowerCase().includes(lowered) || member.userId.toLowerCase().includes(lowered)
    )
    .slice(0, 10)

  mentionList.value = list
}

/**
 * 加载当前房间成员（用于 @ 提及全量列表）。
 * 输入：无。
 * 输出：Promise<void>。
 * 逻辑：读取成员并更新 mentionList。
 */
const loadAllUsers = async () => {
  const roomId = currentRoomId.value
  if (!roomId) return

  const selfId = matrixClient.getAuthedClient()?.getUserId() ?? ''
  const members = MatrixClientRoom.getRoomMembersById(roomId)
  mentionList.value = members
    .filter((member) => member?.userId && member.userId !== selfId)
    .slice(0, 10)
    .map((member) => ({
      userId: member.userId,
      displayName: member.name || member.userId,
    }))
}

/**
 * 选中提及候选并插入到输入框。
 * 输入：用户对象（userId、displayName）。
 * 输出：无（更新输入框内容）。
 * 逻辑：把 @ 段替换为 @[name](userId) 形式并恢复光标。
 */
const selectMention = (user: { userId: string; displayName: string }) => {
  if (mentionStartIndex.value === -1) return
  const beforeAt = localMessage.value.substring(0, mentionStartIndex.value)
  const afterCursor = localMessage.value.substring(inputRef.value?.selectionStart || 0)
  const mentionText = `@[${user.displayName}](${user.userId}) `
  localMessage.value = beforeAt + mentionText + afterCursor

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

/**
 * 组件挂载后聚焦输入框。
 * 输入：无。
 * 输出：无。
 */
onMounted(() => {
  inputRef.value?.focus()
  window.addEventListener('matrix:set-chat-input-text', handleExternalInputText as EventListener)
})

watch(editDraft, (draft) => {
  if (!draft) return
  localMessage.value = draft.content
  setTimeout(() => inputRef.value?.focus(), 0)
})

/**
 * 组件卸载时释放预览 URL。
 * 输入：无。
 * 输出：无。
 */
onUnmounted(() => {
  attachments.value.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl))
  window.removeEventListener('matrix:set-chat-input-text', handleExternalInputText as EventListener)
})
</script>

<style scoped>
.input-area {
  width: 100%;
  padding: 0.5rem;
  border-top: var(--glass-border);
  background: var(--glass-bg);
  box-shadow: var(--glass-shadow);
  backdrop-filter: var(--glass-blur);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.reply-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--glass-bg) 80%, transparent);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.edit-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--glass-bg) 75%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary-color) 25%, transparent);
}

.reply-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.reply-label {
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.reply-sender {
  color: var(--text-color);
  font-size: var(--font-sm);
  font-weight: 600;
}

.reply-content {
  color: var(--text-muted);
  font-size: var(--font-sm);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
}

.reply-close {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--font-md);
  line-height: 1;
}

.reply-close:hover,
.reply-close:focus-visible {
  color: var(--text-color);
  outline: none;
}

.input-surface {
  position: relative;
  width: 100%;
  display: flex;

}

.message-input {
  width: 100%;
  height: 15vh;
  resize: none;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: var(--font-base);
  line-height: 1.5;
  outline: none;

}

.message-input::placeholder {
  color: var(--text-muted);
}


.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.hint {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.input-actions {
  position: absolute;
  right: 1rem;
  bottom: -1rem;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  z-index: 1;
}

.action-btn {
  height: 36px;
  padding: 0.5rem 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;

}

.action-btn img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: var(--icon-filter);
}

.action-btn--attach {
  border: var(--glass-border);
  background: var(--input-bg);
  color: var(--text-color);
}

.action-btn--send {
  border: var(--glass-border);
  background: var(--input-bg);
  color: var(--text-color);
}

.action-btn--send.is-waiting-reply {
  opacity: 0.72;
}

.action-btn--rewrite {
  border: var(--glass-border);
  background: var(--input-bg);
  color: var(--text-color);
}

.ai-menu-wrap {
  position: relative;
}

.ai-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);

  min-width: 140px;
  background: var(--glass-bg);
  border: var(--glass-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--glass-shadow);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 20;
}

.ai-menu-item {
  width: 100%;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-color);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  cursor: pointer;
  border-radius: 6px;
  font-size: var(--font-xs);
}

.ai-menu-item:hover {
  background: var(--hover-bg);
}

.ai-menu-item img {
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex: 0 0 auto;
  filter: var(--icon-filter);
}

.ai-menu-divider {
  height: 1px;
  margin: 2px 4px;
  background: color-mix(in srgb, var(--text-muted) 30%, transparent);
}

.ai-menu-item--sub {
  justify-content: flex-start;
}

.ai-arrow {
  margin-left: auto;
  width: 10px;
  height: 10px;
}

.ai-submenu-wrap {
  position: relative;
}

.ai-submenu {
  position: absolute;
  top: 0;
  left: calc(100% + 6px);
  min-width: 132px;
  background: var(--glass-bg);
  border: var(--glass-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--glass-shadow);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 21;
}

@media (max-width: 768px) {
  .input-actions {
    right: 0.5rem;
    gap: 6px;
  }

  .action-btn {
    height: 32px;
    padding: 0.4rem 0.55rem;
    gap: 0.25rem;
    font-size: var(--font-xs);
  }

  .action-btn img {
    width: 14px;
    height: 14px;
  }

  .ai-menu {
    min-width: 124px;
    max-width: 136px;
  }

  .ai-submenu {
    left: calc(100% + 4px);
    min-width: 124px;
    max-width: 136px;
  }
}

.action-btn:active {
  transform: translateY(1px);
}

.attachments-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 2px 2px 2px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}

.attachment-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--glass-bg);
  border: var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 6px 8px;
  min-width: 180px;
  max-width: 260px;
}

.thumb {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  flex: 0 0 auto;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


.meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.meta .name {
  font-size: var(--font-sm);
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta .size {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.remove {
  margin-left: auto;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.mention-list {
  position: relative;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
  background: var(--glass-bg);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-sm);
  padding: 6px;
}

.mention-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-color);
}

.mention-item.selected,
.mention-item:hover {
  background: var(--hover-bg);
}

.mention-display-name {
  font-size: var(--font-base);
  color: var(--text-color);
}


.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--text-muted);
  border-top-color: var(--text-color);
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
