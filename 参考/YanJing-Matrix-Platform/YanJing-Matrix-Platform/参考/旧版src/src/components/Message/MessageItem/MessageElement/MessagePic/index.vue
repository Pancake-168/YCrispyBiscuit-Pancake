<template>
  <div class="message-pic">
    <div class="image-container" v-if="hasImage">
      <img :src="currentSrc || ''" :alt="altText" :title="altText" class="message-image" @click="openImagePreview"
        @error="handleImageError" @load="handleImageLoad" :loading="loading ? 'eager' : 'lazy'" />
      <div v-if="loading" class="image-loading">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      <div v-if="error" class="image-error">
        <span class="error-icon">🖼️</span>
        <span>图片加载失败</span>
        <button @click="retryLoad" class="retry-btn">重试</button>
      </div>
      <!-- 覆盖在图片底部的信息条 -->
      <div v-if="showImageInfo && !loading && !error" class="image-info-overlay">
        <div class="image-info-row">
          <span class="image-alt" :title="altText">{{ altText }}</span>
          <span v-if="imageSize" class="image-size">{{ formatFileSize(imageSize) }}</span>
        </div>
      </div>
    </div>

    <!-- 图片信息展示（已改为覆盖在图片底部，移除此块） -->

    <!-- 如果没有图片URL但有内容，显示内容 -->
    <div v-if="!imageUrl && content" class="fallback-content">
      <p>{{ content }}</p>
    </div>

    <!-- 图片预览模态框 -->
    <Teleport to="body">
      <div v-if="showPreview" class="image-preview-modal" @click="closeImagePreview">
        <div class="preview-container">
          <img :src="currentSrc || ''" :alt="altText" class="preview-image" />
          <button class="close-btn" @click="closeImagePreview">&times;</button>
          <div class="preview-info">
            <p>{{ altText }}</p>
            <p v-if="imageSize">大小: {{ formatFileSize(imageSize) }}</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Attachment, EncryptedAttachment } from '@matrix-org/matrix-sdk-crypto-wasm'
import { matrixClientV2 } from '../../../../../services/matrix/client'

interface Props {
  content: string
  imageUrl?: string
  altText?: string
  imageSize?: number
  showImageInfo?: boolean
  mxcUrl?: string
  encryptionInfo?: any
  messageInfo?: {
    mimetype?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  altText: '图片',
  showImageInfo: false
})

const loading = ref(true)
const error = ref(false)
const showPreview = ref(false)
const currentSrc = ref<string | null>(null)
const hasImage = computed(() => !!currentSrc.value || loading.value || error.value)

// 构造下载与缩略图 URL（优先使用 mxc）
const buildUrlCandidates = (client: any): { primary?: string; thumbnail?: string; primaryAlt?: string; thumbnailAlt?: string } => {
  const out: { primary?: string; thumbnail?: string; primaryAlt?: string; thumbnailAlt?: string } = {}
  const baseHost = (() => { try { return new URL(client.baseUrl).hostname } catch { return undefined } })()
  if (props.mxcUrl) {
    out.primary = client.mxcUrlToHttp(props.mxcUrl, null, null, null, true)
    // 生成缩略图（scale 1024）
    try {
      out.thumbnail = client.mxcUrlToHttp(props.mxcUrl, 1024, 1024, 'scale', true)
    } catch { /* ignore */ }
  } else if (props.imageUrl) {
    out.primary = props.imageUrl
    // 尝试从 download 路径构造 thumbnail 备用
    try {
      if (props.imageUrl.includes('/_matrix/media/')) {
        const u = new URL(props.imageUrl)
        const replaced = u.pathname.replace('/download/', '/thumbnail/')
        u.pathname = replaced
        u.search = 'width=1024&height=1024&method=scale'
        out.thumbnail = u.toString()
      }
    } catch { /* ignore */ }
  }
  // 基于 baseHost 生成备用 server_name 变体（将路径中的 server_name 替换为 baseHost）
  if (baseHost) {
    const swapServer = (urlStr?: string) => {
      if (!urlStr) return undefined
      try {
        const u = new URL(urlStr)
        u.pathname = u.pathname.replace(/(\/download\/)([^/]+)(\/)/, `$1${baseHost}$3`)
        u.pathname = u.pathname.replace(/(\/thumbnail\/)([^/]+)(\/)/, `$1${baseHost}$3`)
        return u.toString()
      } catch { return undefined }
    }
    out.primaryAlt = swapServer(out.primary)
    out.thumbnailAlt = swapServer(out.thumbnail)
  }
  return out
}

const fetchWithAuthToBlobUrl = async (url: string, mime?: string): Promise<string> => {
  const client = matrixClientV2.getAuthedClient();
  if (!client) throw new Error('研境AI客户端未认证');
  const token = client.getAccessToken?.();
  const resp = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    redirect: 'follow'
  })
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
  const buf = await resp.arrayBuffer()
  if (props.encryptionInfo) {
    const info = JSON.stringify(props.encryptionInfo)
    const enc = new EncryptedAttachment(new Uint8Array(buf), info)
    const dec = Attachment.decrypt(enc)
    const blob = new Blob([new Uint8Array(dec)], { type: mime || props.messageInfo?.mimetype || 'image/jpeg' })
    return URL.createObjectURL(blob)
  } else {
    const blob = new Blob([buf], { type: mime || props.messageInfo?.mimetype || 'image/jpeg' })
    return URL.createObjectURL(blob)
  }
}

// 统一加载逻辑：先主图，失败则缩略图
const decryptAndLoadImage = async () => {
  if (currentSrc.value) return
  loading.value = true
  error.value = false
  try {
    const client = matrixClientV2.getAuthedClient();
    if (!client) throw new Error('研境AI客户端未认证');
    const urls = buildUrlCandidates(client)
    const baseCandidates = [urls.primary, urls.thumbnail, urls.primaryAlt, urls.thumbnailAlt].filter(Boolean) as string[]
    // 扩展候选：追加 allow_redirect/allow_remote，及 client/v1 路径变体
    const addParams = (u: string, params: Record<string, string>): string => {
      try {
        const x = new URL(u)
        Object.entries(params).forEach(([k, v]) => x.searchParams.set(k, v))
        return x.toString()
      } catch { return u }
    }
    const pathVariant = (u: string): string | undefined => {
      try {
        const x = new URL(u)
        if (x.pathname.includes('/_matrix/media/v3/download/')) {
          x.pathname = x.pathname.replace('/_matrix/media/v3/download/', '/_matrix/client/v1/media/download/')
          x.searchParams.set('allow_redirect', 'true')
          return x.toString()
        }
        if (x.pathname.includes('/_matrix/media/v3/thumbnail/')) {
          x.pathname = x.pathname.replace('/_matrix/media/v3/thumbnail/', '/_matrix/client/v1/media/thumbnail/')
          x.searchParams.set('allow_remote', 'true')
          return x.toString()
        }
        return undefined
      } catch { return undefined }
    }
    const candidates: string[] = []
    for (const u of baseCandidates) {
      candidates.push(u)
      if (u.includes('/_matrix/media/v3/download/')) {
        candidates.push(addParams(u, { allow_redirect: 'true' }))
      }
      if (u.includes('/_matrix/media/v3/thumbnail/')) {
        candidates.push(addParams(u, { allow_remote: 'true' }))
      }
      const pv = pathVariant(u)
      if (pv) candidates.push(pv)
    }

    if (candidates.length === 0) throw new Error('缺少图片 URL')

    let lastErr: any = null
    for (const url of candidates) {
      try {
        console.debug('[ImageFetch] try url:', url)
        const blobUrl = await fetchWithAuthToBlobUrl(url)
        currentSrc.value = blobUrl
        return
      } catch (e) {
        lastErr = e
        console.warn('[ImageFetch] failed url:', url, e)
        // 尝试下一个候选
      }
    }
    throw lastErr || new Error('图片获取失败')
  } catch (err) {
    console.error('图片加载失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 处理图片加载成功
const handleImageLoad = () => {
  loading.value = false
  error.value = false
}

// 处理图片加载失败
const handleImageError = () => {
  loading.value = false
  error.value = true
}

// 重试加载图片
const retryLoad = () => {
  loading.value = true
  error.value = false
  // 强制重新加载图片
  const img = document.querySelector('.message-image') as HTMLImageElement
  if (img) {
    img.src = img.src
  }
}

// 打开图片预览
const openImagePreview = () => {
  if (!error.value && currentSrc.value) {
    showPreview.value = true
    // 防止背景滚动
    document.body.style.overflow = 'hidden'
  }
}

// 关闭图片预览
const closeImagePreview = () => {
  showPreview.value = false
  document.body.style.overflow = 'auto'
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

onMounted(() => {
  if (!props.imageUrl && !props.mxcUrl) {
    loading.value = false
    return
  }
  decryptAndLoadImage();
})

// 监听ESC键关闭预览
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showPreview.value) {
    closeImagePreview()
  }
}

onMounted(() => {
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
  max-width: 100%;
  margin: 0;
  width: 100%;
  display: block;
}

.image-container {
  position: relative;
  display: block;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.message-image {
  width: 100%;
  max-height: 280px;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: none;
  display: block;
}

.message-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 16px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid var(--color-primary, #1890ff);
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

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: var(--bg-color-secondary, #f8f9fa);
  border: 1px dashed var(--border-color, #d9d9d9);
  border-radius: 8px;
  color: var(--text-color-secondary, #666);
}

.error-icon {
  font-size: 32px;
}

.retry-btn {
  padding: 6px 12px;
  background: var(--color-primary, #1890ff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: var(--color-primary-hover, #40a9ff);
}

.image-info {
  margin-top: 4px;
  margin-left: 10px;
  margin-right: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-color-secondary, #666);
}

.image-alt {
  font-style: italic;
}

.image-size {
  font-weight: 500;
}

.fallback-content p {
  margin: 0;
  color: var(--text-color, #333);
  font-size: 16px;
  line-height: 1.375;
}

/* 图片预览模态框 */
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000001;
  backdrop-filter: blur(4px);
}

.preview-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 32px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.preview-info {
  margin-top: 16px;
  text-align: center;
  color: white;
}

.preview-info p {
  margin: 4px 0;
  font-size: 14px;
}

.preview-info p:first-child {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-image {
    max-height: 220px;
  }

  .preview-container {
    max-width: 95vw;
    max-height: 95vh;
  }

  .preview-image {
    max-height: 75vh;
  }

  .close-btn {
    top: -35px;
    font-size: 28px;
    width: 35px;
    height: 35px;
  }
}

/* 覆盖在图片底部的信息条 */
.image-info-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 6px 10px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.2), rgba(0,0,0,0));
  color: #fff;
  pointer-events: none; /* 不阻挡点击预览 */
}
.image-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.image-info-overlay .image-alt {
  max-width: 75%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.image-info-overlay .image-size { opacity: 0.9; }
</style>
