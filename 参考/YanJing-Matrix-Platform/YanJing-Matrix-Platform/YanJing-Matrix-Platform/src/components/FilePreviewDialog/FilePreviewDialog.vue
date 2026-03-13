<template>
    <div class="dialog-mask yj-dialog-mask" @click.self="close">
        <div class="dialog yj-dialog-content">
            <div class="dialog-header">
                <div class="dialog-header-main">
                    <div class="dialog-title">{{ title }}</div>
                    <div class="dialog-subtitle" :title="fileName">{{ fileName }}</div>
                </div>
                <button class="header-close" type="button" @click="close">关闭</button>
            </div>

            <div class="dialog-meta">
                <span v-if="fileSizeText" class="meta-chip">{{ fileSizeText }}</span>
                <!--span v-if="mimeType" class="meta-chip">{{ mimeType }}</span-->
                <span class="meta-chip">{{ previewLabel }}</span>
            </div>

            <div class="dialog-body">
                <div v-if="loading" class="dialog-state">加载中...</div>
                <div v-else-if="error" class="dialog-state dialog-state--error">{{ error }}</div>
                <div v-else-if="previewKind === 'html'" class="html-preview" v-html="renderedHtml"></div>
                <div v-else-if="previewKind === 'markdown'" class="markdown-preview" v-html="renderedMarkdown"></div>
                <div v-else-if="previewKind === 'audio'" class="audio-preview">
                    <MessageAudio :content="fileName" :file-url="blobUrl" :file-name="fileName" :file-size="fileSize" />
                </div>
                <pre v-else-if="previewKind === 'text'" class="text-preview">{{ textContent }}</pre>
                <object v-else-if="previewKind === 'pdf' && blobUrl" class="pdf-preview" :data="blobUrl"
                    type="application/pdf">
                    <embed class="pdf-preview" :src="blobUrl" type="application/pdf" />
                    <div class="dialog-state dialog-state--unsupported">
                        <div class="unsupported-title">当前环境无法内嵌显示 PDF</div>
                        <div class="unsupported-reason">可以使用下方“外部打开”或“下载”。</div>
                    </div>
                </object>
                <div v-else class="dialog-state dialog-state--unsupported">
                    <div class="unsupported-title">暂不支持在线预览该文件类型</div>
                    <div v-if="unsupportedReason" class="unsupported-reason">{{ unsupportedReason }}</div>
                </div>
            </div>

            <div class="dialog-footer">
                <button class="btn btn--ghost" type="button" @click="emit('openExternal')">外部打开</button>
                <button class="btn btn--ghost" type="button" @click="emit('download')">下载</button>
                <button class="btn" type="button" @click="close">关闭</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import MessageAudio from '@/components/Room/MessageItem/MessageElement/MessageAudio'

type PreviewKind = 'text' | 'markdown' | 'html' | 'pdf' | 'audio' | 'unsupported'

const props = defineProps<{
    title: string
    fileName: string
    mimeType?: string
    fileSize?: number
    previewKind: PreviewKind
    previewKindLabel?: string
    textContent?: string
    htmlContent?: string
    blobUrl?: string
    loading?: boolean
    error?: string
    unsupportedReason?: string
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'download'): void
    (e: 'openExternal'): void
}>()

const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
})

const renderedMarkdown = computed(() => {
    if (!props.textContent) return ''
    return DOMPurify.sanitize(md.render(props.textContent))
})

const renderedHtml = computed(() => {
    if (!props.htmlContent) return ''
    return DOMPurify.sanitize(props.htmlContent)
})

const fileSizeText = computed(() => {
    if (props.fileSize == null) return ''
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let value = props.fileSize
    let index = 0
    while (value >= 1024 && index < units.length - 1) {
        value /= 1024
        index += 1
    }
    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
})

const previewLabel = computed(() => {
    if (props.previewKindLabel) return props.previewKindLabel
    if (props.loading) return '准备中'
    if (props.error) return '加载失败'
    if (props.previewKind === 'html') return '文档预览'
    if (props.previewKind === 'audio') return '音频播放'
    if (props.previewKind === 'markdown') return 'Markdown 预览'
    if (props.previewKind === 'text') return '文本预览'
    if (props.previewKind === 'pdf') return 'PDF 预览'
    return '仅支持下载'
})

function close() {
    emit('close')
}
</script>

<style scoped>
.dialog-mask {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--bg-color) 88%, transparent);
    backdrop-filter: blur(2px);
}

.dialog {
    width: 80vw;
    max-width: 94vw;
    height:90vh;
    max-height: 95vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
    background: var(--panel-bg, #161a22);
    box-shadow: 0 20px 48px color-mix(in srgb, var(--bg-color) 72%, transparent);
}

.dialog-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: var(--space-md)  var(--space-sm);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dialog-header-main {
    min-width: 0;
}

.dialog-title {
    color: var(--text-color);
    font-size: var(--font-md);
    font-weight: 600;
}

.dialog-subtitle {
    margin-top: 6px;
    color: var(--text-muted);
    font-size: var(--font-xs);
    word-break: break-all;
}

.header-close,
.btn {
    height: 32px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: color-mix(in srgb, var(--primary-color) 18%, var(--glass-bg));
    color: var(--text-color);
    cursor: pointer;
}

.btn--ghost,
.header-close {
    background: color-mix(in srgb, var(--glass-bg) 75%, transparent);
}

.header-close:hover,
.header-close:focus-visible,
.btn:hover,
.btn:focus-visible {
    outline: none;
    border-color: color-mix(in srgb, var(--primary-color) 28%, transparent);
}

.dialog-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: var(--space-xs)  var(--space-lg);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.meta-chip {
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--glass-bg) 80%, transparent);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--text-muted);
    font-size: var(--font-xs);
}

.dialog-body {
    flex: 1;
    min-height: 500px;
    overflow: auto;
    padding: var(--space-md) var(--space-lg);
}

.dialog-state {
    min-height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    text-align: center;
    white-space: pre-wrap;
}

.dialog-state--error {
    color: #d96c6c;
}

.dialog-state--unsupported {
    flex-direction: column;
    gap: 10px;
}

.unsupported-title {
    color: var(--text-color);
    font-size: var(--font-md);
}

.unsupported-reason {
    color: var(--text-muted);
    font-size: var(--font-xs);
}

.text-preview {
    margin: 0;
    color: var(--text-color);
    font-size: var(--font-xs);
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
}

.pdf-preview {
    width: 100%;
    min-height: 70vh;
    border: none;
    background: #fff;
}

.markdown-preview {
    color: var(--text-color);
    line-height: 1.75;
    word-break: break-word;
}

.html-preview {
    color: var(--text-color);
    line-height: 1.75;
    word-break: break-word;
}

.audio-preview {
    display: flex;
    justify-content: center;
    padding: 24px 0;
}

.audio-preview :deep(.message-file-audio) {
    width: min(100%, 720px);
}

.html-preview :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 16px;
}

.html-preview :deep(th),
.html-preview :deep(td) {
    padding: 8px 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    text-align: left;
    vertical-align: top;
}

.html-preview :deep(th) {
    background: color-mix(in srgb, var(--glass-bg) 88%, transparent);
}

.html-preview :deep(h1),
.html-preview :deep(h2),
.html-preview :deep(h3),
.html-preview :deep(h4),
.html-preview :deep(h5) {
    margin: 1.2em 0 0.6em;
}

.html-preview :deep(p),
.html-preview :deep(ul),
.html-preview :deep(ol),
.html-preview :deep(blockquote),
.html-preview :deep(pre) {
    margin: 0 0 1em;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
    margin: 1.2em 0 0.6em;
    color: var(--text-color);
}

.markdown-preview :deep(p),
.markdown-preview :deep(ul),
.markdown-preview :deep(ol),
.markdown-preview :deep(pre),
.markdown-preview :deep(blockquote) {
    margin: 0 0 1em;
}

.markdown-preview :deep(pre) {
    padding: 12px;
    overflow: auto;
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--glass-bg) 90%, transparent);
}

.markdown-preview :deep(code) {
    font-family: Consolas, 'Courier New', monospace;
}

.markdown-preview :deep(a) {
    color: var(--primary-color);
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: var(--space-sm) var(--space-lg) var(--space-lg);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
}
</style>