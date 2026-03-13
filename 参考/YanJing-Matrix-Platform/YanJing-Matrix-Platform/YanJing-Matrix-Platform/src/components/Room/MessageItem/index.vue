<template>
    <div class="message-item" :class="[
        { 'own-message': isSelf },
        { 'system-message': isSystemMessage },
        isFirstInGroup ? 'first-in-group' : '',
        isContinuedInGroup ? 'continued-in-group' : '',
        showForwardCheckbox ? 'has-forward-check' : ''
    ]" :data-time="formatTime(message.timestamp)" :data-event-id="message.id">
        <div v-if="isFirstInGroup && !isSystemMessage" class="avatar-container">
            <div class="avatar">
                <img v-if="senderAvatarBlobUrl" :src="senderAvatarBlobUrl" :alt="message.senderName || message.senderId" />
                <span v-else>{{ getInitials(message.senderName || message.senderId) }}</span>
            </div>
        </div>
        <label v-if="showForwardCheckbox && !hideOperations" class="forward-check">
            <input type="checkbox" :checked="isForwardSelected" @change="toggleForward" />
            <span class="check-dot"></span>
        </label>
        <div class="message-content">
            <div v-if="!isSystemMessage" class="message-header">
                <span v-if="isFirstInGroup" class="sender-name">{{ message.senderName || message.senderId }}</span>
                <!--span v-if="showStatus" class="message-status">{{ messageStatusText }}</span-->
            </div>
            <div v-if="replyPreview" class="reply-preview" @click="handleReplyJump">
                <div class="reply-header">
                    <span class="reply-label">回复</span>
                    <span class="reply-sender">{{ replyPreview.senderName }}</span>
                </div>
                <div class="reply-body">{{ replyPreview.summary }}</div>
            </div>
            <div v-if="message.forwardBundle" class="forward-bundle" @click="handleOpenForwardBundle">
                <div class="forward-title">转发消息</div>
                <div class="forward-preview">
                    <div v-for="(item, idx) in message.forwardBundle.items.slice(0, 3)" :key="idx" class="forward-line">
                        <span class="forward-sender">{{ item.senderName || item.senderId || '未知' }}</span>
                        <span class="forward-text">：{{ formatForwardItemSummary(item) }}</span>
                    </div>
                    <div v-if="message.forwardBundle.items.length > 3" class="forward-more">……</div>
                </div>
                <div class="forward-count">共 {{ message.forwardBundle.items.length }} 条</div>
            </div>
            <div class="bubble" :class="`type-${message.type}`">
                <div v-if="isSystemMessage" class="system-text">{{ message.content }}</div>
                <MessageMarkdown v-else-if="message.type === 'm.text'"
                    :content="message.format === 'org.matrix.custom.html' && message.formattedBody ? message.formattedBody : message.content"
                    :stream-mode="!!message.isStreaming" />
                <MessageAudio v-else-if="message.type === 'm.audio'" :content="message.content" :file-url="message.url"
                    :file-name="message.fileName" :file-size="toFileSize(message.fileSize)"
                    :mxc-url="message.rawMxcUrl" />
                <MessagePic v-else-if="message.type === 'm.image'" :content="message.content" :image-url="message.url"
                    :alt-text="message.fileName" :image-size="toFileSize(message.fileSize)"
                    :mxc-url="message.rawMxcUrl" />
                <MessageVideo v-else-if="message.type === 'm.video'" :content="message.content" :file-url="message.url"
                    :file-name="message.fileName" :file-size="toFileSize(message.fileSize)"
                    :mxc-url="message.rawMxcUrl" />
                <MessageFile v-else-if="message.type === 'm.file'" :content="message.content" :file-url="message.url"
                    :mxc-url="message.rawMxcUrl" :file-name="message.fileName"
                    :file-size="toFileSize(message.fileSize)" :mimetype="message.mimetype" />
            </div>
        </div>
        <div v-if="showOperations" class="message-operations" :class="{ 'is-self': isSelf }" role="toolbar"
            aria-label="Message actions">
            <button v-for="op in visibleOperations" :key="op.type" class="op-btn" type="button"
                :aria-label="operationLabels[op.type] || op.type" :title="operationLabels[op.type] || op.type"
                @click.stop="handleOperationClick(op.type)">
                <div class="op-icon">
                    <img :src="operationIcons[op.type]" :alt="op.type" />
                </div>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MatrixMessageItem } from '@/types/message'
import MessageMarkdown from './MessageElement/MessageMarkdown'
import MessageAudio from './MessageElement/MessageAudio'
import MessagePic from './MessageElement/MessagePic'
import MessageVideo from './MessageElement/MessageVideo'
import MessageFile from './MessageElement/MessageFile'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { formatTime } from '@/utils/Time'
import { MSGoperations } from '@/types/Operations'
import { openViewSourceDialog } from '@/components/MSGOperations/ViewSource/open'
import { openForwardBundleDialog } from '@/components/MSGOperations/Forward/openBundle'
import { deleteMessage, shouldShowDelete } from '@/services/Matrix/MSGOperations/MsgDelete'
import { openConfirmDialog, openMessageDialog } from '@/components/MessageDialog/open'
import { openFilePreviewDialog } from '@/components/FilePreviewDialog/open'
import { buildMediaCandidates, resolveMediaBaseUrl, fetchWithAuthToBlob, fetchWithAuthToBlobUrl } from '@/utils/media'
import { useSystemStore } from '@/stores/System'
import { matrixClient } from '@/services/Matrix/client'


interface Props {
    message: MatrixMessageItem & { isStreaming?: boolean }
    isSelf: boolean
    isFirstInGroup?: boolean
    isContinuedInGroup?: boolean
    hideOperations?: boolean
}

const props = defineProps<Props>()
const systemStore = useSystemStore()
const isSystemMessage = computed(() => props.message.type === 'm.system')

const operationIcons = {
    reply: new URL('@/assets/Project/components/Message/引用.svg', import.meta.url).href,
    preview: new URL('@/assets/Project/components/Message/预览.svg', import.meta.url).href,
    download: new URL('@/assets/Project/components/Message/下载.svg', import.meta.url).href,
    transcribe: new URL('@/assets/Project/components/Message/转换.svg', import.meta.url).href,
    edit: new URL('@/assets/Project/components/Message/编辑.svg', import.meta.url).href,
    forward: new URL('@/assets/Project/components/Message/转发.svg', import.meta.url).href,
    delete: new URL('@/assets/Project/components/Message/删除.svg', import.meta.url).href,
    viewSource: new URL('@/assets/Project/components/Message/查看.svg', import.meta.url).href,
} as const

const operationLabels: Record<string, string> = {
    reply: '回复',
    preview: '预览',
    download: '下载',
    transcribe: '转写',
    edit: '编辑',
    forward: '转发',
    delete: '删除',
    viewSource: '查看原始',
}

const isAudioMessage = computed(() => props.message.type === 'm.audio')
const isFileMessage = computed(() => props.message.type === 'm.file')
const isMediaMessage = computed(() => {
    return props.message.type === 'm.image' || props.message.type === 'm.video' || props.message.type === 'm.audio' || props.message.type === 'm.file'
})
const canEditMessage = computed(() => {
    return props.isSelf
        && props.message.type === 'm.text'
        && !props.message.replyToEventId
        && !props.message.forwardBundle
})

const visibleOperations = computed(() => {
    if (isSystemMessage.value) return []
    return MSGoperations.filter((op) => {
        if (op.type === 'edit') return canEditMessage.value
        if (op.type === 'delete') return shouldShowDelete(props.message.roomId, props.message.id)
        if (op.type === 'preview') return isFileMessage.value
        if (op.type === 'download') return isMediaMessage.value
        if (op.type === 'transcribe') return isAudioMessage.value
        return true
    })
})

const showForwardCheckbox = computed(() => {
    if (isSystemMessage.value) return false
    return systemStore.forwardSelecting && systemStore.forwardRoomId === props.message.roomId
})

const showOperations = computed(() => {
    return !props.hideOperations && !isSystemMessage.value
})

const isForwardSelected = computed(() => {
    return systemStore.forwardSelectedIds.includes(props.message.id)
})

const replyPreview = computed(() => {
    if (isSystemMessage.value) return null
    const replyId = props.message.replyToEventId
    if (!replyId) return null
    const list = systemStore.SystemMessages?.[props.message.roomId] ?? []
    const target = list.find((item) => item.id === replyId)
    if (!target) {
        return { senderName: '已回复消息', summary: `#${replyId}` }
    }

    const summary = (() => {
        if (target.type === 'm.image') return '[图片]'
        if (target.type === 'm.video') return '[视频]'
        if (target.type === 'm.audio') return '[音频]'
        if (target.type === 'm.file') return `[文件] ${target.fileName || ''}`.trim()
        return target.content
    })()

    return {
        senderName: target.senderName || target.senderId,
        summary,
    }
})
/*
const statusTextMap: Record<string, string> = {
    sending: '发送中',
    queued: '排队中',
    not_sent: '发送失败',
    cancelled: '已取消',
    sent: '已发送',
}

const messageStatusText = computed(() => {
    const status = props.message.status
    if (!status) return ''
    return statusTextMap[String(status)] || '发送中'
})

const showStatus = computed(() => {
    return !isSystemMessage.value && props.isSelf && !!messageStatusText.value
})
*/
const senderAvatarBlobUrl = ref('')

const revokeSenderAvatarBlobUrl = () => {
    if (senderAvatarBlobUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(senderAvatarBlobUrl.value)
    }
}

const resolveSenderAvatarMxc = (): string | undefined => {
    const client = matrixClient.getAuthedClient()
    if (!client) return undefined

    const room = client.getRoom(props.message.roomId)
    if (!room) return undefined

    const member = room.getMember(props.message.senderId)
    if (!member) return undefined

    const mxcFromMemberEvent = (member as { events?: { member?: { getContent?: () => { avatar_url?: string } } } })
        .events?.member?.getContent?.()?.avatar_url
    return mxcFromMemberEvent
}

const loadSenderAvatarBlob = async () => {
    const mxcUrl = resolveSenderAvatarMxc()
    if (!mxcUrl) {
        revokeSenderAvatarBlobUrl()
        senderAvatarBlobUrl.value = ''
        return
    }

    const baseUrl = resolveMediaBaseUrl({ mxcUrl })
    const candidates = buildMediaCandidates(baseUrl)
    if (!candidates.length) {
        revokeSenderAvatarBlobUrl()
        senderAvatarBlobUrl.value = ''
        return
    }

    for (const candidate of candidates) {
        try {
            const blobUrl = await fetchWithAuthToBlobUrl(candidate)
            revokeSenderAvatarBlobUrl()
            senderAvatarBlobUrl.value = blobUrl
            return
        } catch {
            // try next candidate
        }
    }

    revokeSenderAvatarBlobUrl()
    senderAvatarBlobUrl.value = ''
}

watch(
    () => [props.message.roomId, props.message.senderId],
    () => {
        void loadSenderAvatarBlob()
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    revokeSenderAvatarBlobUrl()
})

const toFileSize = (size?: string) => {
    if (!size) return undefined
    const n = Number(size)
    return Number.isFinite(n) ? n : undefined
}

type ForwardBundleItem = NonNullable<MatrixMessageItem['forwardBundle']>['items'][number]

const formatForwardItemSummary = (item: ForwardBundleItem) => {
    if (item.forwardBundle) {
        const count = item.forwardBundle.items?.length ?? 0
        return `转发消息（${count} 条）`
    }
    if (item.type === 'm.image') return '[图片]'
    if (item.type === 'm.video') return '[视频]'
    if (item.type === 'm.audio') return '[音频]'
    if (item.type === 'm.file') return `[文件] ${item.fileName || ''}`.trim()
    const text = item.content || '[空内容]'
    return text.length > 36 ? `${text.slice(0, 36)}…` : text
}

const getInitials = (name?: string) => {
    const text = name || ''
    return text.slice(0, 1).toUpperCase()
}

const downloadMessageMedia = async () => {
    const baseUrl = resolveMediaBaseUrl({ url: props.message.url, mxcUrl: props.message.rawMxcUrl })
    if (!baseUrl) {
        openMessageDialog('无法获取下载地址', { title: '下载失败' })
        return
    }
    try {
        const candidates = buildMediaCandidates(baseUrl)
        let blob: Blob | null = null
        for (const u of candidates) {
            try {
                blob = await fetchWithAuthToBlob(u)
                break
            } catch {
                // try next candidate
            }
        }
        if (!blob) throw new Error('下载失败')
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = props.message.fileName || 'download'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    } catch (error: unknown) {
        openMessageDialog(String(error || '下载失败'), { title: '下载失败' })
    }
}

const previewMessageFile = () => {
    if (!isFileMessage.value) return
    openFilePreviewDialog({
        fileName: props.message.fileName,
        fileSize: toFileSize(props.message.fileSize),
        url: props.message.url,
        mxcUrl: props.message.rawMxcUrl,
    })
}

/**
 * 处理操作条点击。
 * 输入：type（操作类型）。
 * 输出：void。
 * 逻辑：根据类型触发对应功能（目前仅 viewSource）。
 */
const handleOperationClick = (type: string) => {
    if (type === 'reply') {
        const senderName = props.message.senderName || props.message.senderId
        const content = props.message.content || ''
        const summary = content.length > 80 ? `${content.slice(0, 80)}…` : content
        systemStore.setReplyDraft({
            roomId: props.message.roomId,
            eventId: props.message.id,
            senderName,
            content: summary || '[媒体消息]'
        })
    }

    if (type === 'edit') {
        if (!canEditMessage.value) {
            openMessageDialog('仅支持编辑非回复的文本消息', { title: '无法编辑' })
            return
        }
        const content = props.message.content || ''
        systemStore.setEditDraft({
            roomId: props.message.roomId,
            eventId: props.message.id,
            content,
        })
    }

    if (type === 'forward') {
        systemStore.startForwardSelection(props.message.roomId, props.message.id)
    }

    if (type === 'download') {
        downloadMessageMedia()
    }

    if (type === 'preview') {
        previewMessageFile()
    }

    if (type === 'viewSource') {
        openViewSourceDialog(props.message.roomId, props.message.id)
    }

    if (type === 'delete') {
        openConfirmDialog('确定要撤回这条消息吗？', {
            title: '撤回消息',
            confirmText: '撤回',
            cancelText: '取消',
        }).then(async (confirmed) => {
            if (!confirmed) return
            try {
                await deleteMessage(props.message.roomId, props.message.id)
            } catch (error: unknown) {
                openMessageDialog(String(error || '撤回失败'), { title: '撤回失败' })
            }
        })
    }
}

const toggleForward = () => {
    systemStore.toggleForwardSelection(props.message.id)
}

const handleOpenForwardBundle = () => {
    if (!props.message.forwardBundle) return
    openForwardBundleDialog(props.message.forwardBundle)
}

/**
 * 跳转到被回复的原消息。
 * 输入：无。
 * 输出：void。
 * 逻辑：根据 replyToEventId 查找对应 DOM 并滚动到视口中间。
 */
const handleReplyJump = () => {
    const replyId = props.message.replyToEventId
    if (!replyId) return
    const target = document.querySelector(`[data-event-id="${replyId}"]`) as HTMLElement | null
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.classList.add('reply-highlight')
    window.setTimeout(() => target.classList.remove('reply-highlight'), 1200)
}



</script>

<style scoped>
.message-item {
    display: flex;
    gap: var(--space-sm);
    padding: 3px 5px;
    align-items: flex-start;
    width: 100%;
    align-self: stretch;
    justify-content: flex-start;
    transition: background-color 0.2s ease;
    position: relative;
}

.message-item.system-message {
    justify-content: center;
    padding: 4px 0;
}

.message-item.system-message:hover,
.message-item.system-message:focus-within {
    background-color: transparent;
}

.message-item.system-message::after {
    display: none;
}

.message-item.has-forward-check {
    padding-left: 26px;
}

.message-item.own-message {
    flex-direction: row-reverse;
    justify-content: flex-start;
}

.message-item.continued-in-group .message-content {
    margin-left: calc(var(--titlebar-height) + var(--space-sm));
}

.message-item.continued-in-group.own-message .message-content {
    margin-left: 0;
    margin-right: calc(var(--titlebar-height) + var(--space-sm));
}

.message-item:hover,
.message-item:focus-within {
    background-color: var(--hover-bg);
    border-radius: 6px;
    z-index: 10;
}

.message-item::after {
    content: attr(data-time);
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--font-xs);
    color: var(--text-muted);
    opacity: 0;
    transition: opacity 120ms ease;
    pointer-events: none;
    white-space: nowrap;
    z-index: 2;
}

.message-item:hover::after,
.message-item:focus-within::after {
    opacity: 1;
}

.message-item:not(.own-message)::after {
    right: 6px;
}

.message-item.own-message::after {
    left: 6px;
}

.message-status {
    margin-left: 6px;
    font-size: var(--font-xs);
    color: var(--text-muted);
    white-space: nowrap;
}

.bubble {
    max-width: min(64vw, 480px);
    padding: var(--space-xs);
    border-radius: var(--radius-md);
    width: fit-content;
    min-width: 0;
    overflow-wrap: anywhere;


    color: var(--text-color);

    backdrop-filter: var(--glass-blur);
    line-height: 1.5;
    word-break: break-word;
}

.bubble.type-m\.system {
    max-width: min(82vw, 700px);
    width: auto;
    padding: 3px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--glass-bg) 75%, transparent);
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
}

.system-text {
    font-size: var(--font-xs);
    color: var(--text-muted);
    text-align: center;
    line-height: 1.4;
}

.message-item.own-message .bubble {

    border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
}

.avatar-container {
    flex-shrink: 0;
    margin-top: 1px;
}

.avatar {
    width: var(--titlebar-height);
    height: var(--titlebar-height);
    border-radius: 50%;
    background: color-mix(in srgb, var(--primary-color) 12%, var(--glass-bg));
    color: var(--text-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    overflow: hidden;
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.forward-check {
    position: absolute;
    left: 4px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
}

.forward-check input {
    display: none;
}

.check-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    border: 1.5px solid color-mix(in srgb, var(--text-muted) 60%, transparent);
    background: transparent;
}

.forward-check input:checked+.check-dot {
    border-color: var(--primary-color);
    background: var(--primary-color);
}

.message-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
    min-width: 0;
    max-width: 100%;
}

.message-item.own-message .message-content {
    align-items: flex-end;
}

.reply-preview {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 5px 7px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--glass-bg) 80%, transparent);
    border: 1px solid rgba(255, 255, 255, 0.08);
    max-width: min(64vw, 480px);
    min-width: 0;
    cursor: pointer;
}

.reply-header {
    display: flex;
    align-items: center;
    gap: 4px;
}

.reply-label {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.reply-sender {
    font-size: var(--font-xs);
    color: var(--text-color);
    font-weight: 600;
}

.reply-body {
    font-size: var(--font-xs);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.reply-preview:hover {
    border-color: color-mix(in srgb, var(--primary-color) 24%, transparent);
}

.forward-bundle {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 4px;
    padding: 5px 7px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--glass-bg) 80%, transparent);
    border: 1px solid rgba(255, 255, 255, 0.08);
    max-width: min(64vw, 480px);
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow: hidden;
    cursor: pointer;
}

.forward-bundle:hover {
    border-color: color-mix(in srgb, var(--primary-color) 24%, transparent);
}

.forward-title {
    font-size: var(--font-xs);
    color: var(--text-color);
    font-weight: 600;
}

.forward-preview {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    max-width: 100%;
}

.forward-line {
    display: flex;
    align-items: baseline;
    gap: 3px;
    font-size: var(--font-xs);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    max-width: 100%;
    flex: 1 1 auto;
}

.forward-sender {
    color: var(--text-color);
    font-weight: 600;
    flex-shrink: 0;
}

.forward-text {
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1 1 auto;
}

.forward-more {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.forward-count {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.reply-highlight {
    outline: 1.5px solid color-mix(in srgb, var(--primary-color) 45%, transparent);
    border-radius: 6px;
    transition: outline 0.2s ease;
}

.message-operations {
    position: absolute;
    top: -10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 5px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--glass-bg) 85%, transparent);
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
    backdrop-filter: var(--glass-blur);
    box-shadow: var(--glass-shadow);
    opacity: 0;
    transform: translateY(-1px);
    transition: opacity 120ms ease, transform 120ms ease;
    pointer-events: none;
    z-index: 3;
}

.message-operations {
    left: calc(var(--titlebar-height) + var(--space-sm) + 34px);
    right: auto;
}

.message-item.own-message .message-operations,
.message-operations.is-self {
    left: auto;
    right: calc(var(--titlebar-height) + var(--space-sm) + 34px);
}


.message-item:hover .message-operations,
.message-item:focus-within .message-operations {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

.op-btn {
    width: 28px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color);
}

.op-btn:hover,
.op-btn:focus-visible {
    background: color-mix(in srgb, var(--primary-color) 16%, var(--glass-bg));
    border-color: color-mix(in srgb, var(--primary-color) 28%, transparent);
    outline: none;
}

.op-icon {
    width: 14px;
    height: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.op-icon img {
    width: 14px;
    height: 14px;
    object-fit: contain;
    filter: var(--icon-filter, none);
    opacity: 0.86;
}

@media (prefers-color-scheme: dark) {
    .op-icon img {
        opacity: 0.92;
    }
}

.message-header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
    font-size: var(--font-xs);
}

.message-time {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.markdown :deep(code) {
    background: color-mix(in srgb, var(--text-muted) 20%, transparent);
    padding: 0 3px;
    border-radius: 3px;
}

.markdown :deep(a) {
    color: var(--info-color);
    text-decoration: none;
}

.media-image img,
.media-video video {
    max-width: min(36vw, 200px);
    max-height: 200px;
    border-radius: 8px;
    object-fit: contain;
}

.media-audio audio,
.media-video video {
    width: min(36vw, 200px);
}

.media-file {
    display: flex;
    align-items: center;
    gap: 8px;
}

.file-icon {
    font-size: var(--font-sm);
}

.file-name {
    font-weight: 600;
}

.file-size {
    font-size: var(--font-xs);
    color: var(--text-muted);
}
</style>
