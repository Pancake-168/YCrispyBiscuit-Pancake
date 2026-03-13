<template>
  <div class="internal-browser-container">
    <div class="browser-header">
      <div class="browser-title-area">
        <div>资源</div>
        <!--span class="browser-icon"></span>
        <span class="browser-title" :title="url">{{ processedUrl }}</span-->
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
    <div class="browser-body">
      <div v-if="showMixedContentWarning" class="mixed-content-warning">
        <div class="warning-icon"></div>
        <div class="warning-content">
          <p class="warning-title">由于浏览器安全策略，内容可能无法显示</p>
          <div class="warning-steps">
            <div class="step-item">
              <span class="step-badge">1</span>
              <span>点击地址栏的 🛡️ 或 🔒 图标 (国产浏览器请留意地址栏右侧拦截提示)，允许加载内容。</span>
            </div>
            <div class="step-item">
              <span class="step-badge">2</span>
              <span>若仍无效，请 <a :href="processedUrl" target="_blank" class="open-link">在新窗口打开</a></span>
            </div>
          </div>
        </div>
        <button class="close-warning" @click="showMixedContentWarning = false" title="关闭提示">×</button>
      </div>
      <iframe :src="processedUrl" class="browser-iframe" :style="iframeStyle"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads"
        @load="handleLoad"></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useWechatStore } from '@/stores/WeChat'
import { wechatSSOService } from '@/services/Project/SSO/WeChatSSO'
import { NOCOBASE_URL } from '@/apiUrls'

const props = defineProps<{
  url: string
}>()

const wechatStore = useWechatStore()

defineEmits<{
  (e: 'close'): void
}>()

const showMixedContentWarning = ref(false)

const checkMixedContent = () => {
  // 简单判断：如果当前页面是 HTTPS 而 iframe 目标是 HTTP，则提示
  if (window.location.protocol === 'https:' && props.url.startsWith('http:')) {
    showMixedContentWarning.value = true
  } else {
    showMixedContentWarning.value = false
  }
}

// --- [核心逻辑 1] 解析 NocoBase 应用 Scope ---
/**
 * 根据 URL 提取 NocoBase 的应用 Scope
 * - 多应用路径: /apps/SCOPE/admin/... -> 返回 SCOPE
 * - 主应用路径: /admin/... -> 返回 root
 */
const extractScope = (url: string): string => {
  const match = url.match(/\/apps\/([^/]+)\//)
  return match?.[1] ?? 'root'
}

// --- [核心逻辑 2] 检测是否为 NocoBase 链接 ---
const isNocoBase = computed(() => {
  const nocoBaseHosts = [
    '192.168.10.106:13000',
    '127.0.0.1:13000',
    'localhost:13000',
    NOCOBASE_URL.replace('https://', '').replace('http://', '').split('/')[0]
  ]
  return nocoBaseHosts.some(host => props.url.includes(host))
})

// --- [核心逻辑 3] 获取并同步 Token ---
const updateToken = async () => {
  if (isNocoBase.value) {
    const scope = extractScope(props.url)
    console.log(`[InternalBrowser] 检测到 NocoBase 链接，匹配应用作用域: ${scope}`)
    // 调用 API 确保该 scope 的 token 最新并存入内存持久化在 store
    await wechatSSOService.generateNocobaseToken(undefined, scope)
  }
}

const processedUrl = computed(() => {
  const url = props.url
  if (!url) return 'about:blank'
  if (isNocoBase.value) {
    const scope = extractScope(url)
    const token = wechatStore.nocobaseSessions[scope]?.token
    if (token) {
      const separator = url.includes('?') ? '&' : '?'
      console.log(`[InternalBrowser] 添加 token 到 URL: ${url}${separator}token=${token}&embed=true`)
      return `${url}${separator}token=${token}&embed=true`
    }
  }
  console.log("[InternalBrowser] processedUrl:", url)
  return url
})

onMounted(() => {
  checkMixedContent()
  updateToken()
})

watch(() => props.url, () => {
  checkMixedContent()
  updateToken()
})

// 既然有了插件支持，不再需要手动裁剪侧边栏，直接全屏显示
const iframeStyle = computed(() => {
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
  background: var(--panel-bg);
  border-left: 1px solid color-mix(in srgb, var(--text-color) 18%, transparent);
  /* 宽度由父级布局控制 */
  width: 100%;
  max-width: 100%;

  min-width: 0;
  overflow: hidden;

  flex: 1;
  /* 防止被压缩 */
  transition: width 0.3s ease;

  z-index: 10;
}

.browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 18%, transparent);
  background: var(--panel-bg);
  box-sizing: border-box;
}

.browser-title-area {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  margin-right: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
}

.browser-icon {
  margin-right: 8px;
  font-size: var(--font-base);
}

.browser-title {
  font-size: var(--font-sm);
  color: var(--text-color);
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  font-weight: 500;
  flex: 0 0 auto;
  display: inline-block;
}

.browser-actions {
  display: flex;
  align-items: center;
  margin-right: auto;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
}

.action-btn:hover {
  background-color: var(--hover-bg);
  color: var(--text-color);
}

.close-btn:hover {
  background-color: #ff4d4f20;
  color: #ff4d4f;
}

.browser-body {
  height: 100%;
  width: 100%;
  flex: 1;
  overflow: hidden;
  /* 必须为 hidden 以裁剪 iframe */
  position: relative;
  background: #fff;
}

.browser-iframe {
  display: block;
  width: 100%;
  max-width: 100%;
  border: none;
}

.mixed-content-warning {
  background-color: #fffbe6;
  border-bottom: 1px solid #ffe58f;
  padding: 10px 12px;
  display: flex;
  align-items: flex-start;
  font-size: var(--font-sm);
  color: #595959;
  position: relative;
  z-index: 2;
}

.warning-icon {
  margin-right: 8px;
  font-size: var(--font-base);
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
  font-size: var(--font-xs);
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
  font-size: var(--font-md);
  line-height: 1;
  cursor: pointer;
  color: #999;
  padding: 0;
}

.close-warning:hover {
  color: #666;
}
</style>
