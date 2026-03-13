<template>
    <div class="message-pic" :class="{ 'is-preview-only': previewOnly }">
        <div class="image-container" :class="{ 'is-preview-only': previewOnly }" v-if="hasImage">
            <img :src="currentSrc || ''" :alt="altText" :title="altText" class="message-image" @click="openImagePreview"
                :loading="loading ? 'eager' : 'lazy'" />
            <div v-if="loading" class="image-loading">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
            </div>
            <div v-if="error" class="image-error">
                <span>图片加载失败</span>
                <button @click="retryLoad" class="retry-btn">重试</button>
            </div>
            <!-- 覆盖在图片底部的信息条 -->
            <div v-if="showImageInfo && !previewOnly && !loading && !error" class="image-info-overlay">
                <div class="image-info-row">
                    <span class="image-alt" :title="altText">{{ altText }}</span>
                    <span v-if="imageSize" class="image-size">{{ formatFileSize(imageSize) }}</span>
                </div>
            </div>
        </div>

        <!-- 图片预览模态框 -->
        <Teleport v-if="!previewOnly" to="body">
            <div v-if="showPreview" class="image-preview-modal" @click="closeImagePreview">
                <div class="preview-container">
                    <img :src="currentSrc || ''" :alt="altText" class="preview-image" />
                    <button class="close-btn" @click="closeImagePreview">&times;</button>
                </div>
            </div>
        </Teleport>
    </div>
</template>


<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { buildMediaCandidates, fetchWithAuthToBlobUrl as fetchWithAuthToBlobUrlRaw, mxcToHttp } from '@/utils/media'
import { formatFileSize } from '@/utils/FileSize'


interface Props {
    content: string
    imageUrl?: string
    altText?: string
    imageSize?: number
    showImageInfo?: boolean
    mxcUrl?: string
    previewOnly?: boolean
    messageInfo?: {
        mimetype?: string
    }
}



const props = withDefaults(defineProps<Props>(), {
    altText: '图片',
    showImageInfo: false,
    previewOnly: false
})



const loading = ref(true)
const error = ref(false)
const showPreview = ref(false)
const currentSrc = ref<string | null>(null)
const hasImage = computed(() => !!currentSrc.value || loading.value || error.value)





// 统一加载逻辑：先主图，失败则缩略图
const decryptAndLoadImage = async () => {
    if (currentSrc.value) return
    loading.value = true
    error.value = false

    try {

        const urls = buildUrlCandidates()
        const baseCandidates = [urls.primary, urls.thumbnail].filter(Boolean) as string[]
        const candidates = new Set<string>()
        for (const u of baseCandidates) {
            buildMediaCandidates(u).forEach((v) => candidates.add(v))
        }

        if (candidates.size === 0) throw new Error('缺少图片 URL')

        //let lastErr: any = null
        for (const url of candidates) {
            try {
                // console.debug('[ImageFetch] try url:', url)
                const blobUrl = await fetchWithAuthToBlobUrlRaw(url, props.messageInfo?.mimetype || 'image/jpeg')
                currentSrc.value = blobUrl
                return
            } catch {
                //      lastErr = e
                //    console.log('[ImageFetch] failed url:', url, lastErr)
                // 尝试下一个候选
            }
        }
        //throw lastErr || new Error('图片获取失败')











    } catch (e) {
        console.warn('[System:MessagePic:decryptAndLoadImage] 加载图片失败:', e)
        error.value = true
        loading.value = false
    } finally {
        loading.value = false
    }
}





// 构造下载与缩略图 URL（优先使用 mxc）
const buildUrlCandidates = (): { primary?: string; thumbnail?: string } => {
    const out: { primary?: string; thumbnail?: string } = {}
    if (props.mxcUrl) {
        out.primary = mxcToHttp(props.mxcUrl)
        out.thumbnail = mxcToHttp(props.mxcUrl, 1024, 1024, 'scale')
    } else if (props.imageUrl) {
        out.primary = props.imageUrl
        try {
            if (props.imageUrl.includes('/_matrix/media/')) {
                const u = new URL(props.imageUrl)
                u.pathname = u.pathname.replace('/download/', '/thumbnail/')
                u.search = 'width=1024&height=1024&method=scale'
                out.thumbnail = u.toString()
            }
        } catch { /* ignore */ }
    }
    return out
}




// 使用统一的媒体工具获取 blob URL



// 关闭图片预览
const closeImagePreview = () => {
    showPreview.value = false
    document.body.style.overflow = 'auto'
}


// 打开图片预览
const openImagePreview = () => {
    if (!error.value && currentSrc.value) {
        showPreview.value = true
        // 防止背景滚动
        document.body.style.overflow = 'hidden'
    }
}




// 重试加载图片
const retryLoad = () => {
    loading.value = true
    error.value = false
    currentSrc.value = null
    decryptAndLoadImage()
}



// 监听ESC键关闭预览
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && showPreview.value) {
        closeImagePreview()
    }
}





onMounted(() => {
    if (!props.imageUrl && !props.mxcUrl) {
        loading.value = false
        return
    }

    decryptAndLoadImage();

    document.addEventListener('keydown', handleKeydown)
})


onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    // 确保在组件销毁时恢复滚动
    document.body.style.overflow = 'auto'
})

</script>

<style scoped>
.message-pic {
    max-width: min(38vw, 220px);
}

.message-pic.is-preview-only {
    max-width: none;
    width: min(96vw, 1400px);
    height: min(92vh, 980px);
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-container {
    position: relative;
    max-width: min(38vw, 220px);
}

.image-container.is-preview-only {
    max-width: none;
    width: min(96vw, 1400px);
    height: min(92vh, 980px);
    display: flex;
    align-items: center;
    justify-content: center;
}

.message-image {
    max-width: min(38vw, 220px);
    max-height: 220px;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 10px;
    display: block;
}

.image-container.is-preview-only .message-image {
    max-width: 100%;
    max-height: 100%;
    border-radius: var(--radius-md);
    box-shadow: var(--glass-shadow);
    cursor: default;
}

.preview-image {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
}

.image-preview-modal {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: color-mix(in srgb, var(--bg-color) 78%, #000 22%);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
}

.preview-container {
    position: relative;
    width: min(96vw, 1400px);
    height: min(92vh, 980px);
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-container .preview-image {
    max-width: 100%;
    max-height: 100%;
    border-radius: var(--radius-md);
    box-shadow: var(--glass-shadow);
}

.close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    font-size: var(--font-lg);
    line-height: 1;
    color: var(--btn-text);
    background: color-mix(in srgb, var(--bg-color) 45%, transparent);
}

.close-btn:hover {
    background: color-mix(in srgb, var(--bg-color) 62%, transparent);
}
</style>
