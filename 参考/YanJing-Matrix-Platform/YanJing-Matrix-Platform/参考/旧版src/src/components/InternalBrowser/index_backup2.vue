<template>
  <div class="internal-browser-container">
    <div class="browser-header">
      <div class="browser-title-area">
        <span class="browser-icon"></span>
        <span class="browser-title" :title="url">{{ url }}</span>
      </div>
      <div class="browser-actions">
        <div class="action-btn close-btn" @click="$emit('close')" title="关闭预览">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>
    </div>
    <div class="browser-body" ref="browserBodyRef">
      <div v-if="showMixedContentWarning" class="mixed-content-warning">
        <div class="warning-icon">⚠️</div>
        <div class="warning-content">
          <p class="warning-title">由于浏览器安全策略，内容可能无法显示</p>
          <div class="warning-steps">
            <div class="step-item">
              <span class="step-badge">1</span>
              <span>点击地址栏的 🛡️ 或 🔒 图标 (国产浏览器请留意地址栏右侧拦截提示)，允许加载内容。</span>
            </div>
            <div class="step-item">
              <span class="step-badge">2</span>
              <span>若仍无效，请 <a :href="url" target="_blank" class="open-link">在新窗口打开</a></span>
            </div>
          </div>
        </div>
        <button class="close-warning" @click="showMixedContentWarning = false" title="关闭提示">×</button>
      </div>
      <iframe ref="iframeRef" :src="processedUrl" class="browser-iframe" :style="iframeStyle"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads"
        @load="handleLoad"></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  url: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const browserBodyRef = ref<HTMLElement | null>(null)
const showMixedContentWarning = ref(false)
const containerWidth = ref(0)

let resizeObserver: ResizeObserver | null = null

const checkMixedContent = () => {
  // ...existing code...
}

onMounted(() => {
  checkMixedContent()

  if (browserBodyRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(browserBodyRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

watch(() => props.url, () => {
  checkMixedContent()
})

const processedUrl = computed(() => {
  return props.url
})

// 检测是否为 NocoBase 链接
const isNocoBase = computed(() => {
  return props.url.includes('192.168.10.106:13000')
})

// 智能计算 NocoBase 的布局偏移
const nocoBaseLayout = computed(() => {
  const url = props.url.toLowerCase()

  if (!isNocoBase.value) {
    return { top: 0, left: 0 }
  }

  // 1. 优先进行路由类型判断

  // 情况 A：独立页面（登录、注册、公共分享、远程页面等）
  // 这些页面在 NocoBase 中是全屏渲染的，没有 Header 和 Sider
  const isStandalonePage =
    url.includes('/signin') ||
    url.includes('/signup') ||
    url.includes('/forgot-password') ||
    url.includes('/reset-password') ||
    url.includes('/public') ||
    url.includes('/remote')

  if (isStandalonePage) {
    return { top: 0, left: 0 }
  }

  // 情况 B：管理界面
  if (url.includes('/admin')) {
    const top = 46 // Header 高度固定
    let left = 0


    if (url.includes('/admin/settings') && (containerWidth.value > 200)) {
      left = 200
      return { top, left }
    }



    // 只有在管理界面下，才根据容器宽度决定是否裁剪侧边栏
    // 这里的 1100px 是为了确保在内嵌模式下，只有空间非常充裕才切掉菜单
    if (containerWidth.value > 992) {
      left = 200
    } else {
      // 宽度不足时，NocoBase 会自动折叠或隐藏菜单，我们保持 left 为 0
      left = 0
    }


    return { top, left }
  }

  // 情况 C：其他未知路径，默认不裁剪
  return { top: 0, left: 0 }
})

// 计算 iframe 样式（方案二：物理裁剪）
const iframeStyle = computed(() => {
  const { top, left } = nocoBaseLayout.value

  if (top > 0 || left > 0) {
    return {
      position: 'absolute',
      top: `-${top}px`,
      left: `-${left}px`,
      width: `calc(100% + ${left}px)`,
      height: `calc(100% + ${top}px)`,
      border: 'none'
    }
  }

  return {
    width: '100%',
    height: '100%',
    border: 'none'
  }
})

const handleLoad = () => {
  console.log('Iframe loaded')
}
</script>

<style scoped>
.internal-browser-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color-main);
  border-left: 1px solid var(--border-color);
  /* 宽度由父级布局控制，或者在这里强制覆盖 */
  width: 50%;
  min-width: 400px;
  flex-shrink: 0;
  /* 防止被压缩 */
  transition: width 0.3s ease;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-color-secondary);
  box-sizing: border-box;
}

.browser-title-area {
  display: flex;
  align-items: center;
  overflow: hidden;
  flex: 1;
  margin-right: 10px;
}

.browser-icon {
  margin-right: 8px;
  font-size: 16px;
}

.browser-title {
  font-size: 14px;
  color: var(--text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.browser-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-color-secondary);
}

.action-btn:hover {
  background-color: var(--bg-color-hover);
  color: var(--text-color-primary);
}

.close-btn:hover {
  background-color: #ff4d4f20;
  color: #ff4d4f;
}

.browser-body {
  flex: 1;
  overflow: hidden;
  /* 必须为 hidden 以裁剪 iframe */
  position: relative;
  background: #fff;
}

.browser-iframe {
  display: block;
  border: none;
}

.mixed-content-warning {
  background-color: #fffbe6;
  border-bottom: 1px solid #ffe58f;
  padding: 10px 12px;
  display: flex;
  align-items: flex-start;
  font-size: 13px;
  color: #595959;
  position: relative;
  z-index: 2;
}

.warning-icon {
  margin-right: 8px;
  font-size: 16px;
  line-height: 1.4;
}

.warning-content {
  flex: 1;
  padding-right: 20px;
}

.warning-title {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #d48806;
}

.warning-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  line-height: 1.5;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background-color: #faad14;
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  margin-right: 8px;
  margin-top: 2px;
  flex-shrink: 0;
}

.open-link {
  color: #1890ff;
  text-decoration: none;
  font-weight: 500;
}

.open-link:hover {
  text-decoration: underline;
}

.close-warning {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: #999;
  padding: 0;
}

.close-warning:hover {
  color: #666;
}
</style>
