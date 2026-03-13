<template>
  <div class="internal-browser-container">
    <div class="browser-header">
      <div class="browser-title-area">
        <span class="browser-icon">🌐</span>
        <span class="browser-title" :title="url">{{ url }}</span>
      </div>
      <div class="browser-actions">
        <div class="action-btn close-btn" @click="$emit('close')" title="关闭预览">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>
    </div>
    <div class="browser-body">
      <iframe 
        ref="iframeRef"
        :src="processedUrl" 
        frameborder="0" 
        class="browser-iframe" 
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads"
        @load="handleLoad"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  url: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

const processedUrl = computed(() => {
  // 将目标 IP 转换为带有标记的相对路径
  // 这样浏览器地址栏显示的是 /some/path?noco=1，而不是 /nocobase-proxy/some/path
  // 从而避免 NocoBase 的客户端路由因为不认识 /nocobase-proxy 前缀而报 404
  if (props.url.includes('192.168.10.106:13000')) {
    const path = props.url.replace('http://192.168.10.106:13000', '')
    // 确保路径以 / 开头
    const safePath = path.startsWith('/') ? path : '/' + path
    // 添加 noco=1 标记，让 vite 中间件识别并代理
    return `${safePath}${safePath.includes('?') ? '&' : '?'}noco=1`
  }
  return props.url
})

// React input value setter helper
function setNativeValue(element: HTMLInputElement, value: string) {
  const lastValue = element.value
  element.value = value
  const event = new Event('input', { bubbles: true })
  // @ts-ignore
  event.simulated = true
  // @ts-ignore
  const tracker = element._valueTracker
  if (tracker) {
    tracker.setValue(lastValue)
  }
  element.dispatchEvent(event)
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

const handleLoad = () => {
  if (!iframeRef.value) return
  
  // 仅针对 NocoBase 代理地址尝试自动填充
  // 检查 URL 是否包含 noco=1 标记
  if (processedUrl.value.includes('noco=1') || processedUrl.value.includes('/nocobase-proxy')) {
    try {
      console.log('NocoBase iframe loaded, starting auto-fill process...')
      
      // 注入 WebSocket 补丁，解决 ws://localhost:13001 连接失败的问题
      try {
        const win = iframeRef.value.contentWindow as any
        if (win && win.WebSocket) {
          const OriginalWebSocket = win.WebSocket
          win.WebSocket = function(url: string | URL, protocols?: string | string[]) {
            let newUrl = url.toString()
            // 拦截指向 localhost:13001 的 WS 连接，重定向到我们的代理
            if (newUrl.includes('localhost:13001')) {
               // 替换为当前页面的 host (localhost:5174) 加上代理前缀
               // 注意：这里仍然使用 /nocobase-proxy 前缀，因为 WS 连接不经过中间件的 URL 重写逻辑
               // 而是直接由 vite 的 proxy 模块处理
               newUrl = newUrl.replace('localhost:13001', `${window.location.host}/nocobase-proxy`)
               console.log('[Proxy Fix] Redirecting WebSocket:', url, '->', newUrl)
            }
            return new OriginalWebSocket(newUrl, protocols)
          }
          // 复制原型链常量
          win.WebSocket.prototype = OriginalWebSocket.prototype
          win.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING
          win.WebSocket.OPEN = OriginalWebSocket.OPEN
          win.WebSocket.CLOSING = OriginalWebSocket.CLOSING
          win.WebSocket.CLOSED = OriginalWebSocket.CLOSED
        }
      } catch (e) {
        console.warn('Failed to patch WebSocket:', e)
      }

      // 轮询查找输入框，因为页面渲染需要时间
      let attempts = 0
      const maxAttempts = 40 // 20秒
      
      const tryFill = () => {
        if (attempts >= maxAttempts) return
        attempts++

        try {
          const doc = iframeRef.value?.contentWindow?.document
          if (!doc) return

          // 查找登录表单元素
          const inputs = doc.querySelectorAll('input')
          const submitBtn = doc.querySelector('button[type="submit"]') || doc.querySelector('button.ant-btn-primary')

          if (inputs.length > 0 && submitBtn) {
            let userFilled = false
            let passFilled = false

            inputs.forEach(input => {
              const type = input.getAttribute('type')
              const placeholder = (input.getAttribute('placeholder') || '').toLowerCase()
              
              if (type === 'password') {
                input.focus()
                setNativeValue(input, 'admin123')
                input.blur()
                passFilled = true
              } else if (type === 'text' || type === 'email' || !type) {
                // 简单的启发式规则
                if (!userFilled && (placeholder.includes('user') || placeholder.includes('email') || placeholder.includes('账号') || placeholder.includes('邮箱') || inputs[0] === input)) {
                  input.focus()
                  setNativeValue(input, 'admin@nocobase.com')
                  input.blur()
                  userFilled = true
                }
              }
            })

            if (userFilled && passFilled) {
              console.log('Auto-filled NocoBase credentials, attempting login...')
              
              // 尝试点击登录，增加对 disabled 状态的处理
              let clickAttempts = 0
              const tryClick = () => {
                if (clickAttempts > 20) return // 最多尝试 10 秒
                clickAttempts++
                
                const btn = submitBtn as HTMLButtonElement
                if (!btn.disabled && !btn.classList.contains('disabled')) {
                  console.log('Clicking login button...')
                  btn.click()
                  // 补充触发鼠标事件
                  btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
                  btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
                } else {
                  console.log('Login button disabled, waiting...')
                  setTimeout(tryClick, 500)
                }
              }

              setTimeout(tryClick, 500)
              return // 成功
            }
          }
        } catch (e) {
          console.warn('Access denied or error accessing iframe content:', e)
          return // 停止重试
        }

        setTimeout(tryFill, 500)
      }

      tryFill()
    } catch (e) {
      console.error('Failed to setup auto-fill:', e)
    }
  }
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
  flex-shrink: 0; /* 防止被压缩 */
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
  position: relative;
  background: #fff; /* iframe 内容通常是白底 */
}

.browser-iframe {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
