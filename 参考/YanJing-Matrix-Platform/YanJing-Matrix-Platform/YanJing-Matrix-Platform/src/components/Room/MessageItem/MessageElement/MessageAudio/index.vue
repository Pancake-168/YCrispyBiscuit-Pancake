<template>
  <div class="message-file-audio">
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


</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { buildMediaCandidates, resolveMediaBaseUrl, fetchWithAuthToBlob } from '@/utils/media'
import { formatFileSize } from '@/utils/FileSize'
import { formattedTime } from '@/utils/Time'

interface Props {
  content: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  // 添加原始mxc URL用于下载
  mxcUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  fileName: '未知文件'
})


const decrypting = ref(false) // 预加载状态
const mediaError = ref(false)
const fetchedMediaUrl = ref<string | null>(null)
const fetchedMediaBlob = ref<Blob | null>(null)

// 音频播放相关
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const progressPct = computed(() => duration.value > 0 ? Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100)) : 0)

const formattedCurrentTime = computed(() => formattedTime(currentTime.value))
const formattedDuration = computed(() => formattedTime(duration.value))

// 波形
const waveCanvas = ref<HTMLCanvasElement | null>(null)
const peaks = ref<number[] | null>(null)
const WAVE_BARS = 64
let resizeObserver: ResizeObserver | null = null

// 新增：计算媒体源URL
const mediaSourceUrl = computed(() => fetchedMediaUrl.value || props.fileUrl)

// 音频不提供点击下载按钮，下载另行处理


const getBaseUrl = (): string | undefined => resolveMediaBaseUrl({ url: props.fileUrl, mxcUrl: props.mxcUrl })

const isDirectPlayableUrl = (url?: string) => {
  return !!url && (url.startsWith('blob:') || url.startsWith('data:'))
}

// 公共：确保媒体已准备（音频路径用于播放与绘制波形）
const ensureMediaReady = async () => {
  mediaError.value = false
  if (isDirectPlayableUrl(props.fileUrl)) {
    return
  }
  if (fetchedMediaUrl.value && fetchedMediaBlob.value) return
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    console.warn('[System:MessageAudio:ensureMediaReady] missing media url', {
      fileUrl: props.fileUrl,
      mxcUrl: props.mxcUrl,
      fileName: props.fileName,
      fileSize: props.fileSize
    })
    mediaError.value = true
    return
  }
  decrypting.value = true
  try {
    const candidates = buildMediaCandidates(baseUrl)
    if (candidates.length === 0) {
      console.warn('[System:MessageAudio:ensureMediaReady] no candidate urls', { baseUrl })
    }
    let blob: Blob | null = null
    for (const u of candidates) {
      try { blob = await fetchWithAuthToBlob(u); break } catch { /* next */ }
    }
    if (!blob) throw new Error('媒体加载失败')
    fetchedMediaBlob.value = blob
    fetchedMediaUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    console.warn('[System:MessageAudio:ensureMediaReady] 加载媒体失败:', e, {
      fileUrl: props.fileUrl,
      mxcUrl: props.mxcUrl,
      fileName: props.fileName
    })
    mediaError.value = true
  } finally {
    decrypting.value = false
  }
}

// 生成并绘制波形（简化峰值）
const buildWaveform = async () => {
  try {
    const blob = fetchedMediaBlob.value
    if (!blob) return
    const arrayBuf = await blob.arrayBuffer()
    const AudioCtx = window.AudioContext
      || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
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
        const v = Math.abs(channelData[j] ?? 0)
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
    console.warn('[System:MessageAudio:buildWaveform] 生成波形失败，降级为进度条:', e)
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
      const barValue = bars[i] ?? 0
      const h = Math.max(2, barValue * (height - 6))
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
    console.warn('[System:MessageAudio:togglePlay] 播放失败:', e)
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
  await ensureMediaReady()
  // 初次尝试建立波形
  await buildWaveform()
  // 自适应重绘
  if (waveCanvas.value) {
    resizeObserver = new ResizeObserver(() => drawWave())
    resizeObserver.observe(waveCanvas.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver && waveCanvas.value) resizeObserver.unobserve(waveCanvas.value)
  if (fetchedMediaUrl.value) URL.revokeObjectURL(fetchedMediaUrl.value)
})

// 处理媒体错误
const handleMediaError = () => {
  mediaError.value = true

//  console.warn('[System:MessageAudio:handleMediaError] 媒体文件播放失败:', props.fileUrl) 
}

</script>



<style scoped>
/* ========== 音频（Element 风格近似） ========== */
.mx_MAudioBody {
  width: 100%;
}

.mx_AudioPlayer_container {
  display: grid;
  grid-template-columns: auto 1fr;
  /* 左：播放图标；右：信息 */
  grid-template-rows: auto auto;
  /* 第一行：图标+信息；第二行：波形条 */
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: var(--glass-border);
  border-radius: var(--radius-md);
  background: var(--glass-bg);
}

.mx_AudioPlayer_button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--text-muted) 30%, transparent);
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
    color: var(--text-color);
  transition: color 120ms ease;
}

.mx_AudioPlayer_button:hover svg,
.mx_AudioPlayer_button:focus-visible svg {
    color: var(--primary-color);
}

/* 播放中时，图标用主色强调 */
.mx_AudioPlayer_container.is-playing .mx_AudioPlayer_button svg {
  color: var(--primary-color);
}

.mx_AudioPlayer_seek {
  position: relative;
  height: 10px;
  display: flex;
  align-items: center;
  cursor: pointer;
  grid-row: 2;
  /* 波形位于第二行 */
  grid-column: 1 / -1;
  /* 跨越两列，长度与上方整体对齐 */
}

.mx_AudioPlayer_waveform {
  width: 100%;
  height: 10px;
  --audio-wave-color: var(--text-muted);
  --audio-wave-played-color: var(--primary-color);
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
  grid-column: 2;
  /* 信息在右侧 */
}

.mx_AudioPlayer_mediaName {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mx_AudioPlayer_byline {
  font-size: var(--font-xs);
  color: var(--text-muted);
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
  background: var(--glass-bg);
  border: var(--glass-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.collapse-btn:hover {
  background: var(--hover-bg);
}
</style>
