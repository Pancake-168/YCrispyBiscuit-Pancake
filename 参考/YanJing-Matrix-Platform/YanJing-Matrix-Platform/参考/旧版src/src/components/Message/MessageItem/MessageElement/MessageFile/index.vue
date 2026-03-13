<template>
  <div class="message-file-audio" v-if="isAudio">
    <div class="mx_MAudioBody">
      <div class="mx_AudioPlayer_container" :class="{ 'is-playing': isPlaying }">
        <button class="mx_AudioPlayer_button" type="button" :aria-label="isPlaying ? '暂停音频' : '播放音频'"
          @click="togglePlay">
          <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
            aria-hidden="true">
            <path fill="currentColor" d="M8 5v14l11-7z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        </button>

        <div class="mx_AudioPlayer_seek" @click="onSeekClick" @keydown.enter.prevent="onKeyboardSeek('forward')"
          @keydown.left.prevent="onKeyboardSeek('backward')" @keydown.right.prevent="onKeyboardSeek('forward')"
          tabindex="0" role="slider" :aria-valuemin="0" :aria-valuemax="duration || 0" :aria-valuenow="currentTime">
          <canvas ref="waveCanvas" class="mx_AudioPlayer_waveform"></canvas>
          <div class="mx_AudioPlayer_progress" :style="{ width: progressPct + '%' }"></div>
        </div>

        <div class="mx_AudioPlayer_mediaInfo">
          <div class="mx_AudioPlayer_mediaName" :title="fileName">{{ fileName }}</div>
          <div class="mx_AudioPlayer_byline">
            <span class="mx_AudioPlayer_time">{{ formattedCurrentTime }} / {{ formattedDuration }}</span>
            <span v-if="fileSize" class="mx_AudioPlayer_size"> · {{ formatFileSize(fileSize) }}</span>
          </div>
        </div>

      
      </div>

      <audio ref="audioRef" :src="mediaSourceUrl" preload="metadata" @loadedmetadata="onLoadedMeta"
        @timeupdate="onTimeUpdate" @ended="onEnded" @error="handleMediaError"
        class="mx_AudioPlayer_hiddenAudio"></audio>

      <!--div v-if="mediaError" class="media-error">
        <span>媒体文件无法播放</span>
        <button @click="retryMedia" class="retry-btn">重试</button>
      </div-->
    </div>
  </div>


  <div class="message-file-video" v-if="isVideo">
    <div class="mx_MVideoBody">
      <div class="mx_MediaContainer">
        <video ref="videoRef" :src="mediaSourceUrl" controls playsinline preload="metadata" class="mx_VideoPlayer"
          @loadedmetadata="onVideoLoadedMeta" @error="handleMediaError"></video>
      
        <div class="mx_MediaOverlay">
          <div class="mx_MediaOverlay_name" :title="fileName">{{ fileName }}</div>
          <div class="mx_MediaOverlay_byline">
            <span v-if="fileSize">{{ formatFileSize(fileSize) }}</span>
            <span v-if="videoResolution"> · {{ videoResolution }}</span>
            <span v-if="videoDuration"> · {{ formattedVideoDuration }}</span>
          </div>
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
      <!--div v-if="mediaError" class="media-error">
        <span>媒体文件无法播放</span>
        <button @click="retryMedia" class="retry-btn">重试</button>
      </div-->
    </div>
  </div>


  <div class="message-file-other" v-if="!isVideo && !isAudio">
    <div class="other-container">
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
    </div>
  </div>


  <!--div class="message-file">
    <div class="file-container">
    
      <div class="file-header">
        <div class="file-icon">
        
          <span class="icon default-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </span>
        </div>

        <div class="file-info">
          <div class="file-name" :title="fileName">{{ fileName }}</div>
          <div class="file-details">
            <span v-if="fileSize" class="file-size">{{ formatFileSize(fileSize) }}</span>
            <span v-if="fileName" class="file-type">{{ getFileTypeDisplay(fileName) }}</span>
          </div>
        </div>

        <div class="file-actions">
          <button v-if="fileUrl" @click="downloadFile" class="download-btn" :disabled="downloading" title="下载文件">
            <span v-if="downloading" class="loading-spinner"></span>
            <span v-else>⬇️</span>
          </button>

       
          <button v-else class="download-btn disabled" disabled title="文件暂不可下载">
            🚫
          </button>

          <button v-if="fileUrl && (isAudio || isVideo)" @click="togglePreview" class="preview-btn"
            :disabled="decrypting" :title="isAudio ? '播放音频' : '播放视频'">
            <span v-if="decrypting" class="loading-spinner"></span>
            <span v-else>
              <svg v-if="!showPreview" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </span>
          </button>
        </div>
      </div>

   
      <div v-if="showPreview && (isAudio || isVideo)" class="media-preview">
        <audio v-if="isAudio" :src="mediaSourceUrl" controls class="audio-player" @error="handleMediaError" />
        <video v-else-if="isVideo" :src="mediaSourceUrl" controls class="video-player" @error="handleMediaError" />
        <div v-if="mediaError" class="media-error">
          <span>媒体文件无法播放</span>
          <button @click="retryMedia" class="retry-btn">重试</button>
        </div>
      </div>

    
      <div v-if="showTextPreview && textContent" class="text-preview">
        <pre>{{ textContent }}</pre>
        <button @click="showTextPreview = false" class="collapse-btn">收起</button>
      </div>
    </div>
  </div-->
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Attachment, EncryptedAttachment } from '@matrix-org/matrix-sdk-crypto-wasm'
import { matrixClientV2 } from '../../../../../services/matrix/client'
import { openMessageDialog } from '@/components/MessageDialog/open';

interface Props {
  content: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isAudio?: boolean
  isVideo?: boolean
  // 添加原始mxc URL用于下载
  mxcUrl?: string
  // 添加加密信息用于解密文件
  encryptionInfo?: any
}

const props = withDefaults(defineProps<Props>(), {
  fileName: '未知文件',
  isAudio: false,
  isVideo: false
})


// 构造候选 URL：原始路径 + 将路径中的 server_name 替换为 baseUrl 主机名
const emit = defineEmits(['download-encrypted']);

const downloading = ref(false)
const decrypting = ref(false) // 解密或预加载状态
const showPreview = ref(false)
const mediaError = ref(false)
const showTextPreview = ref(false)
const textContent = ref('')
const decryptedMediaUrl = ref<string | null>(null) // 新增：存储解密后的媒体URL
const fetchedMediaUrl = ref<string | null>(null)
const decryptedMediaBlob = ref<Blob | null>(null)
const fetchedMediaBlob = ref<Blob | null>(null)

// 音频播放相关
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const progressPct = computed(() => duration.value > 0 ? Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100)) : 0)
const formattedTime = (t: number) => {
  if (!isFinite(t) || t < 0) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
const formattedCurrentTime = computed(() => formattedTime(currentTime.value))
const formattedDuration = computed(() => formattedTime(duration.value))

// 波形
const waveCanvas = ref<HTMLCanvasElement | null>(null)
const peaks = ref<number[] | null>(null)
const WAVE_BARS = 64
let resizeObserver: ResizeObserver | null = null

// 视频预览相关
const videoRef = ref<HTMLVideoElement | null>(null)
const videoDuration = ref(0)
const videoWidth = ref(0)
const videoHeight = ref(0)
const videoResolution = computed(() => (videoWidth.value && videoHeight.value) ? `${videoWidth.value}×${videoHeight.value}` : '')
const formattedVideoDuration = computed(() => formattedTime(videoDuration.value))

// 新增：计算媒体源URL
const mediaSourceUrl = computed(() => {
  if (props.encryptionInfo && decryptedMediaUrl.value) {
    return decryptedMediaUrl.value;
  }
  if (!props.encryptionInfo && fetchedMediaUrl.value) {
    return fetchedMediaUrl.value;
  }
  return props.fileUrl;
});

// 音频不提供点击下载按钮，下载另行处理

// 获取文件类型显示名称
const getFileTypeDisplay = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toUpperCase();
  if (extension) {
    return `${extension} 文件`;
  }
  return '文件';
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const buildCandidates = (url?: string): string[] => {
  const list: string[] = []
  if (!url) return list
  list.push(url)
  try {
    const client = matrixClientV2.getAuthedClient();
    const baseHost = (() => { try { return new URL(client?.baseUrl || '').hostname } catch { return undefined } })()
    const addParams = (u: string, params: Record<string, string>): string => {
      try { const x = new URL(u); Object.entries(params).forEach(([k, v]) => x.searchParams.set(k, v)); return x.toString() } catch { return u }
    }
    const addPathVariant = (u: string): string | undefined => {
      try {
        const x = new URL(u)
        if (x.pathname.includes('/_matrix/media/v3/download/')) { x.pathname = x.pathname.replace('/_matrix/media/v3/download/', '/_matrix/client/v1/media/download/'); x.searchParams.set('allow_redirect', 'true'); return x.toString() }
        if (x.pathname.includes('/_matrix/media/v3/thumbnail/')) { x.pathname = x.pathname.replace('/_matrix/media/v3/thumbnail/', '/_matrix/client/v1/media/thumbnail/'); x.searchParams.set('allow_remote', 'true'); return x.toString() }
        return undefined
      } catch { return undefined }
    }
    if (url.includes('/_matrix/media/')) {
      if (baseHost) {
        try {
          const u = new URL(url)
          if (u.pathname.includes('/download/')) { u.pathname = u.pathname.replace(/(\/download\/)([^/]+)(\/)/, `$1${baseHost}$3`); list.push(u.toString()) }
          if (u.pathname.includes('/thumbnail/')) { u.pathname = u.pathname.replace(/(\/thumbnail\/)([^/]+)(\/)/, `$1${baseHost}$3`); list.push(u.toString()) }
        } catch {/* ignore */ }
      }
      if (url.includes('/download/')) list.push(addParams(url, { allow_redirect: 'true' }))
      if (url.includes('/thumbnail/')) list.push(addParams(url, { allow_remote: 'true' }))
      const pv = addPathVariant(url); if (pv) list.push(pv)
    }
  } catch {/* ignore */ }
  return Array.from(new Set(list))
}

// 公共：确保媒体已准备（音频路径用于播放与绘制波形）
const ensureMediaReady = async () => {
  mediaError.value = false
  if (props.encryptionInfo) {
    if (decryptedMediaUrl.value && decryptedMediaBlob.value) return
    if (!props.mxcUrl) { mediaError.value = true; return }
    decrypting.value = true
    try {
      const client = matrixClientV2.getAuthedClient();
      if (!client) throw new Error('研境AI客户端未认证')
      const httpUrl = client.mxcUrlToHttp(props.mxcUrl, null, null, null, true)
      if (!httpUrl) throw new Error('无法将MXC URL转换为HTTP URL')
      const token = client.getAccessToken?.()
      const candidates = buildCandidates(httpUrl)
      let encryptedData: ArrayBuffer | null = null
      for (const u of candidates) {
        try {
          const response = await fetch(u, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, redirect: 'follow' })
          if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
          encryptedData = await response.arrayBuffer()
          break
        } catch { /* try next */ }
      }
      if (!encryptedData) throw new Error('文件下载失败: 资源不存在')
      const mediaEncryptionInfo = JSON.stringify(props.encryptionInfo)
      const encryptedAttachment = new EncryptedAttachment(new Uint8Array(encryptedData), mediaEncryptionInfo)
      const decryptedData = Attachment.decrypt(encryptedAttachment)
      const arrayBuffer = decryptedData.buffer as ArrayBuffer
      const encMime = (props.encryptionInfo as any)?.mimetype as string | undefined
      const blob = new Blob([arrayBuffer], encMime ? { type: encMime } : undefined)
      decryptedMediaBlob.value = blob
      decryptedMediaUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      console.error('解密媒体失败:', e)
      mediaError.value = true
    } finally {
      decrypting.value = false
    }
  } else {
    if (fetchedMediaUrl.value && fetchedMediaBlob.value) return
    if (!props.fileUrl) { mediaError.value = true; return }
    decrypting.value = true
    try {
      const client = matrixClientV2.getAuthedClient();
      const token = client?.getAccessToken?.();
      const tryFetch = async (u: string): Promise<Blob> => {
        const resp = await fetch(u, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, redirect: 'follow' })
        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
        return await resp.blob()
      }
      const candidates = buildCandidates(props.fileUrl)
      let blob: Blob | null = null
      for (const u of candidates) {
        try { blob = await tryFetch(u); break } catch { /* next */ }
      }
      if (!blob) throw new Error('媒体加载失败')
      fetchedMediaBlob.value = blob
      fetchedMediaUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      console.error('加载媒体失败:', e)
      mediaError.value = true
    } finally {
      decrypting.value = false
    }
  }
}

// 生成并绘制波形（简化峰值）
const buildWaveform = async () => {
  try {
    const blob = props.encryptionInfo ? decryptedMediaBlob.value : fetchedMediaBlob.value
    if (!blob) return
    const arrayBuf = await blob.arrayBuffer()
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0))
    const channelData = audioBuf.getChannelData(0)
    const samplesPerBar = Math.floor(channelData.length / WAVE_BARS)
    const newPeaks: number[] = []
    for (let i = 0; i < WAVE_BARS; i++) {
      const start = i * samplesPerBar
      const end = Math.min(start + samplesPerBar, channelData.length)
      let peak = 0
      for (let j = start; j < end; j++) {
        const v = Math.abs(channelData[j])
        if (v > peak) peak = v
      }
      newPeaks.push(peak)
    }
    // 归一化
    const maxPeak = Math.max(...newPeaks, 0.01)
    peaks.value = newPeaks.map(p => p / maxPeak)
    ctx.close()
    drawWave()
  } catch (e) {
    console.warn('生成波形失败，降级为进度条:', e)
    peaks.value = null
    drawWave()
  }
}

const drawWave = () => {
  const canvas = waveCanvas.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, rect.width)
  const height = Math.max(24, rect.height)
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  // 背景
  ctx.clearRect(0, 0, width, height)
  const bars = peaks.value
  const playedFrac = duration.value > 0 ? currentTime.value / duration.value : 0
  const playedBars = bars ? Math.floor((bars.length) * playedFrac) : 0
  const baseColor = getComputedStyle(canvas).getPropertyValue('--audio-wave-color').trim() || '#A3A3A3'
  const playedColor = getComputedStyle(canvas).getPropertyValue('--audio-wave-played-color').trim() || '#3D7EFF'
  if (bars && bars.length) {
    const gap = 2
    const barWidth = Math.max(1, (width - gap * (bars.length - 1)) / bars.length)
    for (let i = 0; i < bars.length; i++) {
      const h = Math.max(2, bars[i] * (height - 6))
      const x = i * (barWidth + gap)
      const y = (height - h) / 2
      ctx.fillStyle = i <= playedBars ? playedColor : baseColor
      ctx.fillRect(x, y, barWidth, h)
    }
  } else {
    // 无波形时画一条进度底线
    ctx.fillStyle = baseColor
    ctx.fillRect(0, height / 2 - 2, width, 4)
    ctx.fillStyle = playedColor
    ctx.fillRect(0, height / 2 - 2, width * playedFrac, 4)
  }
}

const onLoadedMeta = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration || 0
  }
}

const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime || 0
    drawWave()
  }
}

const onEnded = () => { isPlaying.value = false }

const onVideoLoadedMeta = () => {
  if (!videoRef.value) return
  videoDuration.value = videoRef.value.duration || 0
  videoWidth.value = videoRef.value.videoWidth || 0
  videoHeight.value = videoRef.value.videoHeight || 0
}

const togglePlay = async () => {
  try {
    await ensureMediaReady()
    if (!audioRef.value) return
    if (audioRef.value.paused) {
      await audioRef.value.play()
      isPlaying.value = true
    } else {
      audioRef.value.pause()
      isPlaying.value = false
    }
  } catch (e) {
    console.error('播放失败:', e)
    mediaError.value = true
  }
}

const onSeekClick = (e: MouseEvent) => {
  if (!audioRef.value || !duration.value) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  audioRef.value.currentTime = frac * duration.value
  currentTime.value = audioRef.value.currentTime
  drawWave()
}

const onKeyboardSeek = (dir: 'forward' | 'backward') => {
  if (!audioRef.value) return
  const delta = 5 // 5 秒步进
  audioRef.value.currentTime = Math.min(duration.value, Math.max(0, audioRef.value.currentTime + (dir === 'forward' ? delta : -delta)))
}

onMounted(async () => {
  if (props.isAudio) {
    await ensureMediaReady()
    // 初次尝试建立波形
    await buildWaveform()
    // 自适应重绘
    if (waveCanvas.value) {
      resizeObserver = new ResizeObserver(() => drawWave())
      resizeObserver.observe(waveCanvas.value)
    }
  }
  if (props.isVideo) {
    await ensureMediaReady()
  }
})

onBeforeUnmount(() => {
  if (resizeObserver && waveCanvas.value) resizeObserver.unobserve(waveCanvas.value)
  if (decryptedMediaUrl.value) URL.revokeObjectURL(decryptedMediaUrl.value)
  if (fetchedMediaUrl.value) URL.revokeObjectURL(fetchedMediaUrl.value)
})
// 下载文件
const downloadFile = async () => {
  if (props.encryptionInfo) { emit('download-encrypted'); return }
  if (!props.fileUrl) { openMessageDialog('文件链接无效，无法下载。'); return }
  downloading.value = true
  try {
    const client = matrixClientV2.getAuthedClient();
    const token = client?.getAccessToken?.();
    const tryFetch = async (u: string): Promise<Blob> => {
      const resp = await fetch(u, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, redirect: 'follow' })
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
      return await resp.blob()
    }
    const candidates = buildCandidates(props.fileUrl)
    let blob: Blob | null = null; let lastErr: any = null
    for (const u of candidates) {
      try { console.debug('[FileDownload] try url:', u); blob = await tryFetch(u); lastErr = null; break } catch (e) { console.warn('[FileDownload] failed url:', u, e); lastErr = e }
    }
    if (!blob) throw lastErr || new Error('下载失败: 资源不存在')
    const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.style.display = 'none'; a.href = url; a.download = props.fileName || 'download'; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a)
  } catch (error) {
    console.error(' 文件下载失败:', error); openMessageDialog(`文件下载失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally { downloading.value = false }
}

// 切换媒体预览
const togglePreview = async () => {
  // 如果已经显示，则直接隐藏
  if (showPreview.value) {
    showPreview.value = false;
    return;
  }

  mediaError.value = false;

  // 加密媒体：提前解密
  if (props.encryptionInfo && !decryptedMediaUrl.value) {
    if (!props.mxcUrl) {
      openMessageDialog('无法解密：缺少mxcUrl');
      return;
    }
    decrypting.value = true;
    try {
      const client = matrixClientV2.getAuthedClient();
      if (!client) throw new Error('研境AI客户端未认证');

      const httpUrl = client.mxcUrlToHttp(props.mxcUrl, null, null, null, true);
      if (!httpUrl) throw new Error('无法将MXC URL转换为HTTP URL');

      const token = client.getAccessToken?.();
      const candidates = buildCandidates(httpUrl)
      let encryptedData: ArrayBuffer | null = null
      for (const u of candidates) {
        try {
          console.debug('[FileEncrypted] try url:', u)
          const response = await fetch(u, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, redirect: 'follow' })
          if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
          encryptedData = await response.arrayBuffer()
          break
        } catch (e) {
          console.warn('[FileEncrypted] failed url:', u, e)
        }
      }
      if (!encryptedData) throw new Error('文件下载失败: 资源不存在')

      const mediaEncryptionInfo = JSON.stringify(props.encryptionInfo);
      const encryptedAttachment = new EncryptedAttachment(new Uint8Array(encryptedData), mediaEncryptionInfo);
      const decryptedData = Attachment.decrypt(encryptedAttachment);

      const arrayBuffer = decryptedData.buffer as ArrayBuffer;
      const blob = new Blob([arrayBuffer]);
      decryptedMediaUrl.value = URL.createObjectURL(blob);

    } catch (error) {
      console.error('解密媒体文件失败:', error);
      mediaError.value = true;
      return; // 出错时终止
    } finally {
      decrypting.value = false;
    }
  }

  // 未加密媒体：拉取成 Blob 以绕过 CSP
  if (!props.encryptionInfo && !fetchedMediaUrl.value) {
    if (!props.fileUrl) {
      mediaError.value = true;
      return;
    }
    decrypting.value = true;
    try {
      const client = matrixClientV2.getAuthedClient();
      const token = client?.getAccessToken?.();
      const tryFetch = async (u: string): Promise<string> => {
        const resp = await fetch(u, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, redirect: 'follow' })
        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
        const blob = await resp.blob();
        return URL.createObjectURL(blob)
      }
      const candidates = buildCandidates(props.fileUrl)
      let lastErr: any = null
      for (const u of candidates) {
        try {
          console.debug('[FilePreview] try url:', u)
          fetchedMediaUrl.value = await tryFetch(u)
          lastErr = null
          break
        } catch (e) {
          console.warn('[FilePreview] failed url:', u, e)
          lastErr = e
        }
      }
      if (lastErr) throw lastErr
    } catch (error) {
      console.error('加载媒体文件失败:', error);
      mediaError.value = true;
      return;
    } finally {
      decrypting.value = false;
    }
  }

  // 显示预览
  showPreview.value = true;
};

// 处理媒体错误
const handleMediaError = () => {
  mediaError.value = true
  console.error('媒体文件播放失败:', props.fileUrl)
}

// 重试播放媒体
const retryMedia = () => {
  mediaError.value = false
  // 强制重新加载媒体元素
  const mediaElement = document.querySelector('.audio-player, .video-player') as HTMLMediaElement
  if (mediaElement) {
    mediaElement.load()
  }
}
</script>

<style scoped>
.message-file {
  max-width: 100%;
  margin: 0;
  width: 100%;
  display: block;
}

.file-container {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-color-secondary);
  overflow: hidden;
  transition: all 0.2s ease;
}

.file-container:hover {
  border-color: rgba(24, 144, 255, 0.45);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.12);
}

.file-header {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
  border-radius: 20%;
  background-color: var(--color-primary);
}

.file-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.icon {
  font-size: 20px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.file-details {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.file-size {
  font-weight: 500;
}

.file-type {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.download-btn,
.preview-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;
}

.download-btn:hover,
.preview-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.download-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--bg-color-tertiary);
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 1px solid #f3f3f3;
  border-top: 1px solid var(--color-primary, #1890ff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.media-preview {
  border-top: 1px solid var(--border-color);
  padding: 12px;
  background: var(--bg-color);
}

.audio-player {
  width: 100%;
  height: 40px;
}

.video-player {
  width: 100%;
  max-height: 300px;
  border-radius: 6px;
}

.media-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.retry-btn {
  padding: 4px 8px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: var(--color-primary-hover);
}

.text-preview {
  border-top: 1px solid var(--border-color);
  background: var(--bg-color);
  position: relative;
}

.text-preview pre {
  margin: 0;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-color);
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}

/* ========== 音频（Element 风格近似） ========== */
.mx_MAudioBody {
  width: 100%;
}

.mx_AudioPlayer_container {
  display: grid;
  grid-template-columns: auto 1fr; /* 左：播放图标；右：信息 */
  grid-template-rows: auto auto;   /* 第一行：图标+信息；第二行：波形条 */
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(154, 119, 253, 0.4);
  border-radius: 12px;
  background: #F7F4FF;
}

.mx_AudioPlayer_button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(154, 119, 253, 0.4);
  background: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  grid-row: 1;
  grid-column: 1;
}

/* 主题化与尺寸统一：音频播放/暂停内联 SVG */
.mx_AudioPlayer_button svg {
  width: 18px;
  height: 18px;
  display: block;
  color: var(--icon-color, var(--text-color));
  transition: color 120ms ease;
}

.mx_AudioPlayer_button:hover svg,
.mx_AudioPlayer_button:focus-visible svg {
  color: var(--icon-color-hover, var(--color-primary));
}

/* 播放中时，图标用主色强调 */
.mx_AudioPlayer_container.is-playing .mx_AudioPlayer_button svg {
  color: var(--color-primary);
}

.mx_AudioPlayer_seek {
  position: relative;
  height: 10px;
  display: flex;
  align-items: center;
  cursor: pointer;
  grid-row: 2;        /* 波形位于第二行 */
  grid-column: 1 / -1;/* 跨越两列，长度与上方整体对齐 */
}

.mx_AudioPlayer_waveform {
  width: 100%;
  height: 10px;
  --audio-wave-color: var(--text-color-secondary);
  --audio-wave-played-color: var(--color-primary);
}

.mx_AudioPlayer_progress {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 0%;
  pointer-events: none;
}

.mx_AudioPlayer_mediaInfo {
  display: flex;
  flex-direction: column;
  min-width: 0;
  grid-row: 1;
  grid-column: 2; /* 信息在右侧 */
}

.mx_AudioPlayer_mediaName {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mx_AudioPlayer_byline {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.mx_AudioPlayer_hiddenAudio {
  display: none;
}

@media (max-width: 768px) {
  .mx_AudioPlayer_container {
    grid-template-columns: auto 1fr;
    grid-auto-rows: auto;
    gap: 8px;
  }

  .mx_AudioPlayer_download {
    grid-column: 2 / span 1;
    justify-self: end;
  }
}

.collapse-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.collapse-btn:hover {
  background: var(--bg-color);
}

/* ========== 视频（Element 风格近似） ========== */
.mx_MVideoBody {
  width: 100%;
}

.mx_MediaContainer {
  width: 100%;
  background: var(--color-black);
  border: 1px solid rgba(154, 119, 253, 0.4);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.mx_VideoPlayer {
  width: 100%;
  max-height: 360px;
  display: block;
  background: var(--color-black);
}

.mx_MediaInfo {
  /* 保留模板但避免与顶部叠加层重复显示 */
  display: none;
}

.mx_MediaName {
    margin-left: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mx_MediaByline {
  margin-left: 10px;
  font-size: 12px;
  color: var(--text-color-secondary);
}

/* 顶部信息叠加层（置于视频容器内部，避免与控件冲突） */
.mx_MediaOverlay {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  padding: 8px 10px 12px;
  color: var(--color-white);
  pointer-events: none; /* 不拦截点击，避免影响原生视频控件 */
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0));
}

.mx_MediaOverlay_name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mx_MediaOverlay_byline {
  font-size: 12px;
  opacity: 0.95;
}

/* ========== 其他文件（紧凑行，仅作用于 message-file-other 块） ========== */
.message-file-other .other-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(154, 119, 253, 0.4);
  border-radius: 12px;
  background: #F7F4FF;
}

.message-file-other .other-icon {
  width: 24px;
  height: 24px;
  color: var(--color-primary);
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
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-file-other .other-byline {
  font-size: 11px;
  color: var(--text-color-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-header {
    padding: 10px;
    gap: 10px;
  }

  .file-icon {
    width: 36px;
    height: 36px;
  }

  .icon {
    font-size: 18px;
  }

  .file-name {
    font-size: 13px;
  }

  .file-details {
    font-size: 11px;
  }

  .download-btn,
  .preview-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .video-player {
    max-height: 200px;
  }
}
</style>
