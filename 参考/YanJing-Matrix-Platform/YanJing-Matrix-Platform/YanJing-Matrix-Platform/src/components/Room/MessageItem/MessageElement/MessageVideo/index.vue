<template>
    <div class="message-file-video" :class="{ 'is-preview-only': previewOnly }">
        <div class="mx_MVideoBody">
            <div class="mx_MediaContainer" @dblclick="toggleFullscreen">
                <video ref="videoRef" :src="mediaSourceUrl" playsinline preload="metadata"
                    class="mx_VideoPlayer" @loadedmetadata="onVideoLoadedMeta" @timeupdate="onTimeUpdate"
                    @ended="onEnded" @play="onPlay" @pause="onPause" @error="handleMediaError"></video>

                <div class="mx_MediaOverlay">
                    <div class="mx_MediaOverlay_name" :title="fileName">{{ fileName }}</div>
                    <div class="mx_MediaOverlay_byline">
                        <span v-if="fileSize">{{ formatFileSize(fileSize) }}</span>
                        <span v-if="videoResolution"> · {{ videoResolution }}</span>
                        <span v-if="videoDuration"> · {{ formattedVideoDuration }}</span>
                    </div>
                </div>

                <div class="mx_VideoControls">
                    <button class="mx_VideoControl_btn" type="button" :aria-label="isPlaying ? '暂停视频' : '播放视频'"
                        @click="togglePlay">
                        <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20"
                            height="20" aria-hidden="true">
                            <path fill="currentColor" d="M8 5v14l11-7z" />
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
                            aria-hidden="true">
                            <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    </button>
                    <div class="mx_VideoControl_seek" @click="onSeekClick" tabindex="0" role="slider"
                        :aria-valuemin="0" :aria-valuemax="videoDuration || 0" :aria-valuenow="currentTime">
                        <div class="mx_VideoControl_track">
                            <div class="mx_VideoControl_progress" :style="{ width: progressPct + '%' }"></div>
                        </div>
                    </div>
                    <div class="mx_VideoControl_time">{{ formattedCurrentTime }} / {{ formattedVideoDuration }}</div>
                </div>
            </div>
            <div class="mx_MediaInfo">
                <div class="mx_MediaName" :title="fileName">{{ fileName }}</div>
                <div class="mx_MediaByline">
                    <span v-if="fileSize">{{ formatFileSize(fileSize) }}</span>
                    <span v-if="videoResolution"> · {{ videoResolution }}</span>
                    <span v-if="videoDuration"> · {{ formattedVideoDuration }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { buildMediaCandidates, resolveMediaBaseUrl, fetchWithAuthToBlob } from '@/utils/media'

interface Props {
    content: string
    fileUrl?: string
    fileName?: string
    fileSize?: number
    mxcUrl?: string
    previewOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    fileName: '未知文件',
    previewOnly: false
})

const fetchedMediaUrl = ref<string | null>(null)
const fetchedMediaBlob = ref<Blob | null>(null)
const mediaError = ref(false)

// 视频预览相关
const videoRef = ref<HTMLVideoElement | null>(null)
const videoDuration = ref(0)
const videoWidth = ref(0)
const videoHeight = ref(0)
const videoResolution = computed(() => (videoWidth.value && videoHeight.value) ? `${videoWidth.value}×${videoHeight.value}` : '')
const formattedTime = (t: number) => {
    if (!isFinite(t) || t < 0) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}
const formattedVideoDuration = computed(() => formattedTime(videoDuration.value))
const formattedCurrentTime = computed(() => formattedTime(currentTime.value))

const mediaSourceUrl = computed(() => fetchedMediaUrl.value || props.fileUrl)

const isPlaying = ref(false)
const currentTime = ref(0)
const progressPct = computed(() =>
    videoDuration.value > 0 ? Math.min(100, Math.max(0, (currentTime.value / videoDuration.value) * 100)) : 0
)

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getBaseUrl = (): string | undefined => resolveMediaBaseUrl({ url: props.fileUrl, mxcUrl: props.mxcUrl })

const isDirectPlayableUrl = (url?: string) => {
    return !!url && (url.startsWith('blob:') || url.startsWith('data:'))
}

const ensureMediaReady = async () => {
    mediaError.value = false
    if (isDirectPlayableUrl(props.fileUrl)) return
    if (fetchedMediaUrl.value && fetchedMediaBlob.value) return
    const baseUrl = getBaseUrl()
    if (!baseUrl) {
        console.warn('[System:MessageVideo:ensureMediaReady] missing media url', {
            fileUrl: props.fileUrl,
            mxcUrl: props.mxcUrl,
            fileName: props.fileName,
            fileSize: props.fileSize
        })
        mediaError.value = true
        return
    }
    try {
        const candidates = buildMediaCandidates(baseUrl)
        if (candidates.length === 0) {
            console.warn('[System:MessageVideo:ensureMediaReady] no candidate urls', { baseUrl })
        }
        let blob: Blob | null = null
        for (const u of candidates) {
            try { blob = await fetchWithAuthToBlob(u); break } catch { /* next */ }
        }
        if (!blob) throw new Error('媒体加载失败')
        fetchedMediaBlob.value = blob
        fetchedMediaUrl.value = URL.createObjectURL(blob)
    } catch (e) {
        console.warn('[System:MessageVideo:ensureMediaReady] 加载媒体失败:', e, {
            fileUrl: props.fileUrl,
            mxcUrl: props.mxcUrl,
            fileName: props.fileName
        })
        mediaError.value = true
    }
}

const onVideoLoadedMeta = () => {
    if (!videoRef.value) return
    videoDuration.value = videoRef.value.duration || 0
    videoWidth.value = videoRef.value.videoWidth || 0
    videoHeight.value = videoRef.value.videoHeight || 0
}

const onTimeUpdate = () => {
    if (!videoRef.value) return
    currentTime.value = videoRef.value.currentTime || 0
}

const onEnded = () => {
    isPlaying.value = false
}

const onPlay = () => {
    isPlaying.value = true
}

const onPause = () => {
    isPlaying.value = false
}

const togglePlay = async () => {
    try {
        await ensureMediaReady()
        if (!videoRef.value) return
        if (videoRef.value.paused) {
            await videoRef.value.play()
            isPlaying.value = true
        } else {
            videoRef.value.pause()
            isPlaying.value = false
        }
    } catch (e) {
        console.warn('[System:MessageVideo:togglePlay] 播放失败:', e)
        mediaError.value = true
    }
}

const onSeekClick = (e: MouseEvent) => {
    if (!videoRef.value || !videoDuration.value) return
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    videoRef.value.currentTime = frac * videoDuration.value
    currentTime.value = videoRef.value.currentTime
}

const toggleFullscreen = async () => {
    const container = videoRef.value?.parentElement
    if (!container) return
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen()
        } else if (container.requestFullscreen) {
            await container.requestFullscreen()
        }
    } catch (e) {
        console.warn('[System:MessageVideo:toggleFullscreen] 切换全屏失败:', e)
    }
}

const handleMediaError = () => {
    mediaError.value = true
  //  console.error('媒体文件播放失败:', props.fileUrl)
}

onMounted(async () => {
    await ensureMediaReady()
})

onBeforeUnmount(() => {
    if (fetchedMediaUrl.value) URL.revokeObjectURL(fetchedMediaUrl.value)
})
</script>

<style scoped>
/* ========== 视频（Element 风格近似） ========== */

.message-file-video{
    width: 100%;
}

.message-file-video.is-preview-only {
    width: min(96vw, 1400px);
}
.mx_MVideoBody {
    width: 100%;
}

.mx_MediaContainer {
    width: 100%;
    max-width: min(34vw, 190px);
    background: var(--bg-color);
    border: var(--glass-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    position: relative;
}

.message-file-video.is-preview-only .mx_MediaContainer {
    max-width: min(96vw, 1400px);
    max-height: min(92vh, 980px);
    border: none;
    background: #000;
}

.mx_VideoPlayer {
    width: 100%;
    max-height: 190px;
    display: block;
    background: var(--bg-color);
}

.message-file-video.is-preview-only .mx_VideoPlayer {
    max-height: min(92vh, 980px);
    background: #000;
}

.mx_VideoControls {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 6px;
    align-items: center;
    padding: 6px 8px 8px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0));
}

.mx_VideoControl_btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--btn-text) 35%, transparent);
    background: color-mix(in srgb, var(--bg-color) 60%, transparent);
    color: var(--btn-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.mx_VideoControl_seek {
    width: 100%;
    cursor: pointer;
}

.mx_VideoControl_track {
    width: 100%;
    height: 5px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--btn-text) 25%, transparent);
    overflow: hidden;
}

.mx_VideoControl_progress {
    height: 100%;
    background: var(--primary-color);
    width: 0;
}

.mx_VideoControl_time {
    font-size: var(--font-xs);
    color: color-mix(in srgb, var(--btn-text) 90%, transparent);
    white-space: nowrap;
}

.mx_MediaInfo {
    /* 保留模板但避免与顶部叠加层重复显示 */
    display: none;
}

.mx_MediaName {
    margin-left: 8px;
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mx_MediaByline {
    margin-left: 8px;
    font-size: var(--font-xs);
    color: var(--text-muted);
}

/* 顶部信息叠加层（置于视频容器内部，避免与控件冲突） */
.mx_MediaOverlay {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    padding: 6px 8px 10px;
    color: var(--btn-text);
    pointer-events: none;
    /* 不拦截点击，避免影响原生视频控件 */
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0));
}

.mx_MediaOverlay_name {
    font-size: var(--font-sm);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mx_MediaOverlay_byline {
    font-size: var(--font-xs);
    opacity: 0.95;
}

/* 全屏时居中自适应 */
.mx_MediaContainer:fullscreen {
    width: 100vw;
    height: 100vh;
    max-width: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    border-radius: 0;
}

.mx_MediaContainer:fullscreen .mx_VideoPlayer {
    width: 100vw;
    height: 100vh;
    max-height: none;
    object-fit: contain;
}

.mx_MediaContainer:fullscreen .mx_MediaOverlay {
    z-index: 2;
}

.mx_MediaContainer:fullscreen .mx_VideoControls {
    z-index: 3;
    padding: 8px 12px 12px;
}

/* WebKit 兼容 */
.mx_MediaContainer:-webkit-full-screen {
    width: 100vw;
    height: 100vh;
    max-width: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    border-radius: 0;
}

.mx_MediaContainer:-webkit-full-screen .mx_VideoPlayer {
    width: 100vw;
    height: 100vh;
    max-height: none;
    object-fit: contain;
}

.mx_MediaContainer:-webkit-full-screen .mx_MediaOverlay {
    z-index: 2;
}

.mx_MediaContainer:-webkit-full-screen .mx_VideoControls {
    z-index: 3;
    padding: 8px 12px 12px;
}
</style>
