<template>
    <div class="message-file-other">
        <div
            class="other-container"
            :class="{ 'is-clickable': canPreview }"
            role="button"
            tabindex="0"
            @click="openPreview"
            @keydown.enter.prevent="openPreview"
            @keydown.space.prevent="openPreview"
        >
            <div class="other-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
            </div>
            <div class="other-info">
                <div class="other-name" :title="fileName">{{ fileName }}</div>
                <div class="other-byline">
                    <span v-if="fileSize">{{ formatFileSize(fileSize) }}</span>
                    <span v-if="fileName"> · {{ getFileTypeDisplay(fileName) }}</span>
                </div>
            </div>
            <!--button v-if="canDownload" class="download-btn" type="button" @click="downloadFile">下载</button-->
        </div>
    </div>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { openFilePreviewDialog } from '@/components/FilePreviewDialog/open'

//  import { computed } from 'vue'
//  import { buildMediaCandidates, fetchWithAuthToBlob } from '@/utils/media'
//import { resolveMediaBaseUrl, } from '@/utils/media'
interface Props {
    content: string
    fileUrl?: string
    mxcUrl?: string
    fileName?: string
    fileSize?: number
    mimetype?: string
}

const props = withDefaults(defineProps<Props>(), {
    fileName: '未知文件'
})

const canPreview = computed(() => !!props.fileUrl || !!props.mxcUrl)

const openPreview = () => {
    if (!canPreview.value) return
    openFilePreviewDialog({
        fileName: props.fileName,
        fileSize: props.fileSize,
        mimetype: props.mimetype,
        url: props.fileUrl,
        mxcUrl: props.mxcUrl,
    })
}

//const canDownload = computed(() => !!props.fileUrl || !!props.mxcUrl)

const getFileTypeDisplay = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toUpperCase()
    if (extension) {
        return `${extension} 文件`
    }
    return '文件'
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

//const getBaseUrl = (): string | undefined => resolveMediaBaseUrl({ url: props.fileUrl, mxcUrl: props.mxcUrl })
/*
const downloadFile = async () => {
    const baseUrl = getBaseUrl()
    if (!baseUrl) return
    try {
        const candidates = buildMediaCandidates(baseUrl)
        let blob: Blob | null = null
        for (const u of candidates) {
            try { blob = await fetchWithAuthToBlob(u); break } catch { 
             }
        }
        if (!blob) throw new Error('下载失败')
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = props.fileName || 'download'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    } catch (error) {
        console.warn('[System:MessageFile:downloadFile] 文件下载失败:', error)
    }
}
*/
</script>



<style scoped>
/* ========== 其他文件（紧凑行，仅作用于 message-file-other 块） ========== */
.message-file-other .other-container {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border: var(--glass-border);
    border-radius: var(--radius-md);
    background: var(--glass-bg);
}

.message-file-other .other-container.is-clickable {
    cursor: pointer;
}

.message-file-other .other-container.is-clickable:hover,
.message-file-other .other-container.is-clickable:focus-visible {
    outline: none;
    background: var(--hover-bg);
}

.message-file-other .other-icon {
    width: 20px;
    height: 20px;
    color: var(--primary-color);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.message-file-other .other-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.message-file-other .other-name {
    font-size: var(--font-sm);
    font-weight: 500;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.message-file-other .other-byline {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.message-file-other .download-btn {
    margin-left: auto;
    padding: 5px 8px;
    font-size: var(--font-xs);
    border-radius: var(--radius-sm);
    border: var(--glass-border);
    background: var(--glass-bg);
    color: var(--text-color);
    cursor: pointer;
}

.message-file-other .download-btn:hover {
    background: var(--hover-bg);
}
</style>