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
import { buildMediaCandidates, fetchWithAuthToBlobUrl } from '@/utils/media'

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
    console.warn('[System:MarkdownRenderer:renderedHTML] Markdown 渲染错误:', error)
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
      top: 6px;
      right: 6px;
      z-index: 10;
      background: var(--md-codeblock-bg);
      border: none;
      border-radius: 3px;
      padding: 3px 6px;
      cursor: pointer;
      font-size: var(--font-xs);
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 3px;
      transition: background 0.2s;
    `
    
    btn.onmouseenter = () => (btn.style.background = 'var(--hover-bg)')
    btn.onmouseleave = () => (btn.style.background = 'var(--md-codeblock-bg)')
    
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
      console.log('[System:MarkdownRenderer:onMounted] Room alias clicked:', e.detail.roomAlias)
      // 可以在这里添加房间别名处理逻辑
    }) as EventListener)
  }
})

// --------- 处理图片：为 media URL 注入鉴权与重试、去掉 access_token 直链 ---------
const processImages = async () => {
  if (!markdownRoot.value) return
  const imgs = Array.from(markdownRoot.value.querySelectorAll('img')) as HTMLImageElement[]

  for (const img of imgs) {
    const src = img.getAttribute('src') || ''
    if (!src || (!src.includes('/_matrix/media/') && !src.includes('/_matrix/client/'))) continue
    const candidates = buildMediaCandidates(src)
    let blobUrl: string | null = null
    for (const u of candidates) {
      try {
        console.debug('[System:MarkdownImage:processImages] try url:', u)
        blobUrl = await fetchWithAuthToBlobUrl(u)
        break
      } catch (e) {
        console.warn('[System:MarkdownImage:processImages] failed url:', u, e)
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
  font-size: var(--font-xs);
  line-height: 1.2;
  color: var(--text-color);
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
  line-height: 1.15;
  margin-top: 0.5em;
  margin-bottom: 0.2em;
}

.markdown-body :deep(h1) {
  font-size: var(--font-sm);
  border-bottom: 1px solid var(--md-border-color);
  padding-bottom: 0.2em;
}

.markdown-body :deep(h2) {
  font-size: var(--font-sm);
  border-bottom: 1px solid var(--md-border-color);
  padding-bottom: 0.2em;
}

.markdown-body :deep(h3) { font-size: var(--font-sm); }
.markdown-body :deep(h4) { font-size: var(--font-xs); }
.markdown-body :deep(h5) { font-size: var(--font-xs); }
.markdown-body :deep(h6) { font-size: var(--font-xs); color: var(--md-subtle-text-color); }

/* Element 段落 */
.markdown-body :deep(p) {
  margin: 0.2em 0;
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
  color: var(--md-link-color);
  text-decoration: none;
  cursor: pointer;
  word-break: break-word;
}

.markdown-body :deep(a):hover {
  text-decoration: underline;
}

.markdown-body :deep(a):visited {
  color: var(--md-link-visited-color);
}

/* Element 行内代码 */
.markdown-body :deep(code) {
  font-family: 'Inconsolata', 'Consolas', 'Courier New', monospace;
  font-size: 70%;
  background-color: var(--md-code-bg);
  padding: 0.1em 0.25em;
  border-radius: 2px;
  color: var(--md-code-color);
}

/* Element 代码块 */
.markdown-body :deep(pre) {
  background-color: var(--md-codeblock-bg);
  border-radius: 3px;
  margin: 0.2em 0;
  overflow-x: auto;
  font-size: 50%;
  line-height: 1.2;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: var(--md-codeblock-color);
  font-size: inherit;
  border-radius: 0;
}

/* Element 列表 */
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0.2em 0;
  padding-left: 1.25em;
}

.markdown-body :deep(li) {
  margin: 0.08em 0;
}

.markdown-body :deep(li > p) {
  margin: 0;
}

/* Element 引用块 */
.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--md-quote-accent);
  margin: 0.2em 0;
  padding-left: 0.6em;
  color: var(--md-subtle-text-color);
}

/* Element 分割线 */
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--md-border-color);
  margin: 0.6em 0;
}

/* Element 表格 */
.markdown-body :deep(table) {
  border-collapse: collapse;
  border-spacing: 0;
  margin: 0.2em 0;
  width: 100%;
  overflow: auto;
  display: block;
}

.markdown-body :deep(table thead) {
  background-color: var(--md-table-header-bg);
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--md-table-border-color);
  padding: 3px 8px;
  text-align: left;
}

.markdown-body :deep(th) {
  font-weight: 600;
}

.markdown-body :deep(tbody tr) {
  background-color: var(--md-table-row-base-bg);
  border-top: 1px solid var(--md-table-border-color);
}

.markdown-body :deep(tbody tr:nth-child(2n)) {
  background-color: var(--md-table-row-alt-bg);
}

/* Element 图片 */
.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 3px;
  margin: 0.2em 0;
  display: block;
}

/* Element @提及样式 (Matrix 用户/房间) */
.markdown-body :deep(.linkified),
.markdown-body :deep(a[href*="matrix.to"]) {
  color: var(--md-mention-color);
  background-color: var(--md-mention-bg);
  padding: 1px 2px;
  border-radius: 3px;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.markdown-body :deep(.linkified:hover),
.markdown-body :deep(a[href*="matrix.to"]:hover) {
  background-color: var(--md-mention-bg-hover);
  text-decoration: none;
}

/* Element 任务列表 */
.markdown-body :deep(.task-list-item) {
  list-style-type: none;
}

.markdown-body :deep(.task-list-item input[type="checkbox"]) {
  margin: 0 0.3em 0 -1em;
  vertical-align: middle;
}

/* 上标和下标 */
.markdown-body :deep(sup) {
  vertical-align: super;
  font-size: x-small;
}

.markdown-body :deep(sub) {
  vertical-align: sub;
  font-size: x-small;
}
</style>
