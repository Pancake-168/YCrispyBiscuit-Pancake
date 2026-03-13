<template>
  <div 
    ref="markdownRoot" 
    class="markdown-body" 
    v-html="renderedHTML"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import DOMPurify from 'dompurify'
import Markdown from './Markdown'
import { linkifyString, options as linkifyOptions } from './linkify-matrix'
import { matrixClientV2 } from '../../../../../services/matrix/client'

interface Props {
  content: string
  /**
   * 是否将链接作为外部链接处理(在新标签页打开)
   */
  externalLinks?: boolean
  /**
   * 是否禁用大表情符号样式
   */
  disableBigEmoji?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  externalLinks: false,
  disableBigEmoji: false,
})

const emit = defineEmits<{
  'mention-user': [userId: string, displayName: string]
}>()

const markdownRoot = ref<HTMLElement | null>(null)

/**
 * 解析并渲染 Markdown
 */
const renderedHTML = computed(() => {
  if (!props.content) return ''

  try {
    const md = new Markdown(props.content)
    
    // 检查是否为纯文本
    if (md.isPlainText()) {
      // 纯文本，进行 linkify 处理
      const linkified = linkifyString(props.content, linkifyOptions)
      return DOMPurify.sanitize(linkified, {
        ALLOWED_TAGS: ['a', 'span'],
        ALLOWED_ATTR: ['href', 'class', 'rel', 'target'],
      })
    }

    // 渲染为 HTML
    let html = md.toHTML({ externalLinks: props.externalLinks })
    
    // 对 HTML 进行 linkify 处理
    html = linkifyString(html, linkifyOptions)
    
    // 安全清理 HTML
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'b', 'i', 'u', 's', 'del', 'sub', 'sup',
        'a', 'code', 'pre',
        'ul', 'ol', 'li',
        'blockquote',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span',
        'img',
      ],
      ALLOWED_ATTR: ['href', 'class', 'rel', 'target', 'src', 'alt', 'title', 'data-mx-maths'],
      ALLOW_DATA_ATTR: false,
    })
  } catch (error) {
    console.error('Markdown 渲染错误:', error)
    return DOMPurify.sanitize(props.content)
  }
})

/**
 * 处理点击事件 - 用于@提及和链接
 */
const handleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  
  // 处理@用户点击
  if (target.tagName === 'A' && target.classList.contains('linkified')) {
    const href = target.getAttribute('href')
    if (href && href.startsWith('https://matrix.to/#/@')) {
      // Matrix 用户ID
      event.preventDefault()
      const userId = href.replace('https://matrix.to/#/', '')
      const displayName = target.textContent || userId
      emit('mention-user', userId, displayName)
    }
  }
}

/**
 * 添加代码块复制按钮
 */
const addCopyButtons = () => {
  if (!markdownRoot.value) return
  
  // 移除旧按钮
  markdownRoot.value.querySelectorAll('.copy-btn').forEach((btn) => btn.remove())
  
  const preList = Array.from(markdownRoot.value.querySelectorAll('pre'))
  
  preList.forEach((pre) => {
    const parent = pre.parentNode
    const next = pre.nextSibling
    
    // 创建按钮
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>`
    btn.title = '复制代码'
    btn.onclick = () => {
      const code = pre.querySelector('code') || pre
      const text = code.textContent || ''
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '✓ 已复制'
        setTimeout(() => {
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>`
        }, 1500)
      })
    }
    
    // 创建包装器
    const wrapper = document.createElement('div')
    wrapper.style.position = 'relative'
    
    // 样式
    btn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 10;
      background: var(--bg-color-secondary, #f6f8fa);
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
      color: var(--text-color, #333);
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background 0.2s;
    `
    
    btn.onmouseenter = () => (btn.style.background = 'var(--bg-color-hover, #e1e4e8)')
    btn.onmouseleave = () => (btn.style.background = 'var(--bg-color-secondary, #f6f8fa)')
    
    const preClone = pre.cloneNode(true) as HTMLElement
    wrapper.appendChild(preClone)
    wrapper.appendChild(btn)
    
    if (parent) {
      parent.insertBefore(wrapper, next)
      parent.removeChild(pre)
    }
  })
}

onMounted(() => {
  addCopyButtons()
  
  // 监听自定义事件
  if (markdownRoot.value) {
    markdownRoot.value.addEventListener('mention-user-click', ((e: CustomEvent) => {
      const { userId } = e.detail
      emit('mention-user', userId, userId)
    }) as EventListener)
    
    markdownRoot.value.addEventListener('room-alias-click', ((e: CustomEvent) => {
      console.log('Room alias clicked:', e.detail.roomAlias)
      // 可以在这里添加房间别名处理逻辑
    }) as EventListener)
  }
})

// --------- 处理图片：为 media URL 注入鉴权与重试、去掉 access_token 直链 ---------
const processImages = async () => {
  if (!markdownRoot.value) return
  const client = matrixClientV2.getAuthedClient()
  const token = client?.getAccessToken?.()
  const baseHost = (() => { try { return new URL(client?.baseUrl || '').hostname } catch { return undefined } })()
  const imgs = Array.from(markdownRoot.value.querySelectorAll('img')) as HTMLImageElement[]

  const buildCandidates = (url: string): string[] => {
    const list: string[] = []
    try {
      const u0 = new URL(url)
      // 清理 access_token 查询
      u0.searchParams.delete('access_token')
      const cleaned = u0.toString()
      list.push(cleaned)
      // server_name 替换
      if (baseHost && cleaned.includes('/_matrix/media/')) {
        const u1 = new URL(cleaned)
        if (u1.pathname.includes('/download/')) {
          u1.pathname = u1.pathname.replace(/(\/download\/)([^/]+)(\/)/, `$1${baseHost}$3`)
          list.push(u1.toString())
        } else if (u1.pathname.includes('/thumbnail/')) {
          u1.pathname = u1.pathname.replace(/(\/thumbnail\/)([^/]+)(\/)/, `$1${baseHost}$3`)
          list.push(u1.toString())
        }
      }
      // 追加查询参数和 client/v1 变体
      const addParams = (u: string, params: Record<string,string>): string => {
        try { const x = new URL(u); Object.entries(params).forEach(([k,v])=>x.searchParams.set(k,v)); return x.toString() } catch { return u }
      }
      const addPathVariant = (u: string): string | undefined => {
        try {
          const x = new URL(u)
          if (x.pathname.includes('/_matrix/media/v3/download/')) { x.pathname = x.pathname.replace('/_matrix/media/v3/download/', '/_matrix/client/v1/media/download/'); x.searchParams.set('allow_redirect','true'); return x.toString() }
          if (x.pathname.includes('/_matrix/media/v3/thumbnail/')) { x.pathname = x.pathname.replace('/_matrix/media/v3/thumbnail/', '/_matrix/client/v1/media/thumbnail/'); x.searchParams.set('allow_remote','true'); return x.toString() }
          return undefined
        } catch { return undefined }
      }
      if (cleaned.includes('/download/')) list.push(addParams(cleaned, { allow_redirect: 'true' }))
      if (cleaned.includes('/thumbnail/')) list.push(addParams(cleaned, { allow_remote: 'true' }))
      const pv = addPathVariant(cleaned); if (pv) list.push(pv)
    } catch { list.push(url) }
    return Array.from(new Set(list))
  }

  const fetchToBlobUrl = async (u: string): Promise<string> => {
    const resp = await fetch(u, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, redirect: 'follow' })
    if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
    const blob = await resp.blob();
    return URL.createObjectURL(blob)
  }

  for (const img of imgs) {
    const src = img.getAttribute('src') || ''
    if (!src || !src.includes('/_matrix/media/')) continue
    const candidates = buildCandidates(src)
    let blobUrl: string | null = null
    for (const u of candidates) {
      try {
        console.debug('[MarkdownImage] try url:', u)
        blobUrl = await fetchToBlobUrl(u)
        break
      } catch (e) {
        console.warn('[MarkdownImage] failed url:', u, e)
      }
    }
    if (blobUrl) {
      img.setAttribute('data-original-src', src)
      img.src = blobUrl
    }
  }
}

watch(renderedHTML, async () => {
  await nextTick()
  addCopyButtons()
  processImages()
})
</script>

<style scoped>
/* ============================================
   Element/Matrix 官方 Markdown 样式
   基于 Element Web 的设计规范
   ============================================ */
.markdown-body {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color, #17191c);
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}

/* Element 标题样式 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  font-weight: 600;
  line-height: 1.2;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-body :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid var(--border-color, #e1e8ed);
  padding-bottom: 0.3em;
}

.markdown-body :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid var(--border-color, #e1e8ed);
  padding-bottom: 0.3em;
}

.markdown-body :deep(h3) { font-size: 1.25em; }
.markdown-body :deep(h4) { font-size: 1.1em; }
.markdown-body :deep(h5) { font-size: 1em; }
.markdown-body :deep(h6) { font-size: 0.9em; color: #737d8c; }

/* Element 段落 */
.markdown-body :deep(p) {
  margin: 0.5em 0;
}

/* Element 加粗和斜体 */
.markdown-body :deep(strong),
.markdown-body :deep(b) {
  font-weight: 600;
}

.markdown-body :deep(em),
.markdown-body :deep(i) {
  font-style: italic;
}

/* Element 删除线 */
.markdown-body :deep(del),
.markdown-body :deep(s) {
  text-decoration: line-through;
  opacity: 0.7;
}

/* Element 链接样式 */
.markdown-body :deep(a) {
  color: var(--link-color, #0086e6);
  text-decoration: none;
  cursor: pointer;
  word-break: break-word;
}

.markdown-body :deep(a):hover {
  text-decoration: underline;
}

.markdown-body :deep(a):visited {
  color: var(--link-visited, #551a8b);
}

/* Element 行内代码 */
.markdown-body :deep(code) {
  font-family: 'Inconsolata', 'Consolas', 'Courier New', monospace;
  font-size: 85%;
  background-color: var(--code-bg, rgba(27, 31, 35, 0.05));
  padding: 0.2em 0.4em;
  border-radius: 3px;
  color: var(--code-color, #c7254e);
}

/* Element 代码块 */
.markdown-body :deep(pre) {
  background-color: var(--codeblock-bg, #f6f8fa);
  border-radius: 4px;
  padding: 16px;
  margin: 0.5em 0;
  overflow-x: auto;
  font-size: 85%;
  line-height: 1.45;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: var(--codeblock-color, #24292e);
  font-size: inherit;
  border-radius: 0;
}

/* Element 列表 */
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0.5em 0;
  padding-left: 2em;
}

.markdown-body :deep(li) {
  margin: 0.25em 0;
}

.markdown-body :deep(li > p) {
  margin: 0;
}

/* Element 引用块 */
.markdown-body :deep(blockquote) {
  border-left: 4px solid var(--accent-color, #0dbd8b);
  margin: 0.5em 0;
  padding-left: 1em;
  color: var(--text-secondary, #737d8c);
}

/* Element 分割线 */
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color, #e1e8ed);
  margin: 1.5em 0;
}

/* Element 表格 */
.markdown-body :deep(table) {
  border-collapse: collapse;
  border-spacing: 0;
  margin: 0.5em 0;
  width: 100%;
  overflow: auto;
  display: block;
}

.markdown-body :deep(table thead) {
  background-color: var(--table-header-bg, #f6f8fa);
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--table-border, #d0d7de);
  padding: 6px 13px;
  text-align: left;
}

.markdown-body :deep(th) {
  font-weight: 600;
}

.markdown-body :deep(tr) {
  background-color: var(--table-row-bg, #ffffff);
  border-top: 1px solid var(--table-border, #d0d7de);
}

.markdown-body :deep(tr:nth-child(2n)) {
  background-color: var(--table-row-alt-bg, #f6f8fa);
}

/* Element 图片 */
.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 0.5em 0;
  display: block;
}

/* Element @提及样式 (Matrix 用户/房间) */
.markdown-body :deep(.linkified),
.markdown-body :deep(a[href*="matrix.to"]) {
  color: var(--mention-color, #0dbd8b);
  background-color: var(--mention-bg, rgba(13, 189, 139, 0.1));
  padding: 2px 4px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.markdown-body :deep(.linkified:hover),
.markdown-body :deep(a[href*="matrix.to"]:hover) {
  background-color: var(--mention-bg-hover, rgba(13, 189, 139, 0.2));
  text-decoration: none;
}

/* Element 任务列表 */
.markdown-body :deep(.task-list-item) {
  list-style-type: none;
}

.markdown-body :deep(.task-list-item input[type="checkbox"]) {
  margin: 0 0.5em 0 -1.3em;
  vertical-align: middle;
}

/* 上标和下标 */
.markdown-body :deep(sup) {
  vertical-align: super;
  font-size: smaller;
}

.markdown-body :deep(sub) {
  vertical-align: sub;
  font-size: smaller;
}
</style>
