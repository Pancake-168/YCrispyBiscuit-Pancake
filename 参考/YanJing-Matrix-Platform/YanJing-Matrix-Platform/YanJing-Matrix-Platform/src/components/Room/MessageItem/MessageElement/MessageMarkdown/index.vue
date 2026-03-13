<template>
    <div class="markdown-body">
        <!-- 流式渲染模式 -->
        <div v-if="streamMode" class="stream-container">
            <div ref="streamOutput" class="stream-output" v-html="streamHtml" />
            <div v-if="isStreaming" class="stream-cursor">|</div>
        </div>

        <!-- Think 模式 -->
        <div v-else-if="hasThink" ref="markdownRoot">
            <details class="think-details">
                <summary class="think-summary">思考过程</summary>
                <div class="think-content" v-html="thinkHtml" @click="handleClick" />
            </details>
            <div class="think-result" v-html="resultHtml" @click="handleClick" />
        </div>

        <!-- 正常渲染模式 -->
        <div v-else ref="markdownRoot" v-html="safeHtml" @click="handleClick" />
    </div>
</template>


<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import DOMPurify from 'dompurify'
import Markdown from './Vue-Markdown/Markdown'
import { linkifyHtml, options as linkifyOptions } from './Vue-Markdown/linkify-matrix'
import { NOCOBASE_URL } from '@/apiUrls'

interface Props {
    content: string
    streamMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    streamMode: false
})

const emit = defineEmits<{
    'mention-user': [userId: string, displayName: string]
}>()

const hasThink = computed(() => props.content.includes('<think>') && props.content.includes('</think>'))
const thinkHtml = computed(() => hasThink.value ? (props.content.match(/<think>([\s\S]*?)<\/think>/)?.[1] || '') : '')
const resultHtml = computed(() => hasThink.value ? props.content.replace(/<think>[\s\S]*?<\/think>/, '') : props.content)

const relativeNocoBasePathPattern = /(^|(?:\s|\(|\[|\u3000))((?:\/admin|\/apps\/)[^\s<>")\]\u3001\u3002\uff0c\uff1b\uff1a]*)/g

const buildRelativeNocoBaseLinkHtml = (text: string): string => {
    return text.replace(relativeNocoBasePathPattern, (_match, prefix: string, path: string) => {
        return `${prefix}<a href="${path}" target="_blank" rel="noreferrer noopener" class="linkified linkified-nocobase">${path}</a>`
    })
}

const linkifyRelativeNocoBasePaths = (html: string): string => {
    if (!html || (html.indexOf('/admin') === -1 && html.indexOf('/apps/') === -1)) {
        return html
    }

    const container = document.createElement('div')
    container.innerHTML = html

    const skipTags = new Set(['A', 'PRE', 'CODE', 'SCRIPT', 'STYLE', 'TEXTAREA'])
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    const textNodes: Text[] = []

    let current = walker.nextNode()
    while (current) {
        const textNode = current as Text
        const parentElement = textNode.parentElement
        if (parentElement && !skipTags.has(parentElement.tagName)) {
            textNodes.push(textNode)
        }
        current = walker.nextNode()
    }

    for (const textNode of textNodes) {
        const originalText = textNode.textContent || ''
        if (!originalText || !relativeNocoBasePathPattern.test(originalText)) {
            relativeNocoBasePathPattern.lastIndex = 0
            continue
        }

        relativeNocoBasePathPattern.lastIndex = 0
        const replacement = document.createElement('span')
        replacement.innerHTML = buildRelativeNocoBaseLinkHtml(originalText)
        textNode.parentNode?.replaceChild(replacement, textNode)
    }

    return container.innerHTML
}

/**
 * 预处理内容 - 清理和格式化混乱的 HTML/JSON 内容
 */
const preprocessContent = (content: string): string => {
    // 1. 处理 HTML 实体编码的 JSON (如 &quot; 替换为 ")
    let processed = content.replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')

    // 2. 提取 <p> 标签中嵌入的 JSON 代码块并转换为 Markdown 代码块
    processed = processed.replace(/<p>([^<]*\{[^}]*"code"[^}]*\}[^<]*)<\/p>/g, (match, content) => {
        try {
            // 尝试解析 JSON
            const jsonMatch = content.match(/\{.*"code"\s*:\s*"(.*)"\s*\}/s)
            if (jsonMatch && jsonMatch[1]) {
                const code = jsonMatch[1]
                    .replace(/\\n/g, '\n')  // 转换换行符
                    .replace(/\\"/g, '"')   // 转换引号
                    .replace(/\\t/g, '    ') // 转换制表符

                // 获取 JSON 之前的文本
                const beforeJson = content.substring(0, content.indexOf('{'))

                // 返回格式化的 Markdown
                return `${beforeJson}\n\n\`\`\`python\n${code}\n\`\`\`\n`
            }
        } catch (e) {
            console.warn('[System:MarkdownRenderer:preprocessContent] Failed to parse embedded JSON:', e)
        }
        return match
    })

    // 3. 如果整个内容是 <p> 包裹的简单文本,移除 <p> 标签
    if (processed.match(/^<p>[^<]+<\/p>$/)) {
        processed = processed.replace(/<\/?p>/g, '')
    }

    return processed
}

/**
 * 使用新的 CommonMark 渲染器
 */
const safeHtml = computed(() => {
    // console.log('原始内容:', props.content)
    if (!props.content) return ''

    try {
        // 预处理内容
        const content = preprocessContent(props.content)
        //   console.log('预处理后:', content)

        // 判断是否为 HTML 内容
        const isHtml = /<([a-zA-Z][\w\d]*)(\s[^>]*)?>/.test(content)

        let rendered: string
        if (isHtml) {
            // 直接安全渲染原始 HTML
            rendered = content

            // 强制处理 HTML 中的链接，确保都在新窗口打开
            try {
                const tempDiv = document.createElement('div')
                tempDiv.innerHTML = rendered
                const links = tempDiv.querySelectorAll('a')
                if (links.length > 0) {
                    Array.from(links).forEach(link => {
                        link.setAttribute('target', '_blank')
                        link.setAttribute('rel', 'noreferrer noopener')
                    })
                    rendered = tempDiv.innerHTML
                }
            } catch (e) {
                console.warn('[System:MarkdownRenderer:safeHtml] HTML链接处理失败:', e)
            }
        } else {
            // 使用新的 CommonMark 渲染器
            const md = new Markdown(content)
            // 渲染为 HTML，开启 externalLinks 以在新窗口打开链接
            rendered = md.toHTML({ externalLinks: true })
            // 对 HTML 进行 linkify 处理
            rendered = linkifyHtml(rendered, linkifyOptions)
        }

        rendered = linkifyRelativeNocoBasePaths(rendered)

        //  console.log('渲染后:', rendered)

        // 强化安全过滤
        return DOMPurify.sanitize(rendered, {
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
            ALLOWED_ATTR: ['href', 'class', 'rel', 'target', 'src', 'alt', 'title', 'id', 'align'],
            FORBID_ATTR: ['style'],
            FORBID_TAGS: ['style', 'base', 'meta', 'object', 'embed', 'iframe', 'form', 'input', 'button', 'select', 'option', 'textarea', 'script'],
        })
    } catch (error) {
        console.warn('[System:MarkdownRenderer:safeHtml] Markdown 渲染错误:', error)
        return DOMPurify.sanitize(props.content)
    }
})

// 响应式数据
const markdownRoot = ref<HTMLElement | null>(null)
const streamHtml = ref('')
const isStreaming = ref(false)

/**
 * 处理点击事件 - 用于@提及和拦截特定链接
 */
const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const link = target.closest('a')

    if (!link) return

    const href = link.getAttribute('href')
    if (!href) return

    const nocobaseBase = String(NOCOBASE_URL || '').replace(/\/$/, '')
    const isRelativeNocoBasePath = href.startsWith('/admin') || href.startsWith('/apps/')
    const resolvedHref = isRelativeNocoBasePath && nocobaseBase
        ? `${nocobaseBase}${href.startsWith('/') ? '' : '/'}${href}`
        : href

    // 1. 拦截 NocoBase 相关链接，通过内部浏览器打开
    const nocoBaseHosts = [
        '192.168.10.106:13000',
        '127.0.0.1:13000',
        'localhost:13000',
        NOCOBASE_URL.replace('https://', '').replace('http://', '').split('/')[0]
    ]

    const isNocoBaseLink = isRelativeNocoBasePath || nocoBaseHosts.some(host => resolvedHref.includes(host))

    if (isNocoBaseLink) {
        event.preventDefault()
        event.stopPropagation()
        // 触发全局事件，由消息页右侧容器接管展示
        window.dispatchEvent(new CustomEvent('app:openInternalBrowser', {
            detail: { url: resolvedHref }
        }))
        return
    }

    // 2. 处理@用户点击
    if (link.classList.contains('linkified')) {
        if (resolvedHref.startsWith('https://matrix.to/#/@')) {
            // Matrix 用户ID
            event.preventDefault()
            const userId = resolvedHref.replace('https://matrix.to/#/', '')
            const displayName = link.textContent || userId
            emit('mention-user', userId, displayName)
        }
    }
}

// startStreaming 函数已删除 - 流式内容通过 watch 自动更新，不需要手动触发

const urlRegex = /(https?:\/\/[^\s<>"'`]+|ftp:\/\/[^\s<>"'`]+|www\.[^\s<>"'`]+)/gi;

function addLinksToCodeBlocks() {
    if (!markdownRoot.value) return;

    // 处理所有代码块中的链接
    const codeElements = markdownRoot.value.querySelectorAll('pre code');
    codeElements.forEach(code => {
        // 获取原始文本内容
        const originalText = code.textContent || '';

        // 检查是否包含URL
        if (urlRegex.test(originalText)) {
            // 重置正则表达式
            urlRegex.lastIndex = 0;

            // 将URL转换为可点击的链接
            const linkedText = originalText.replace(urlRegex, (url) => {
                // 确保URL有协议前缀
                const href = url.startsWith('www.') ? `https://${url}` : url;
                return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="code-link">${url}</a>`;
            });

            // 更新代码块内容
            code.innerHTML = linkedText;
        }
    });
}

function addMentionClickHandlers() {
    if (!markdownRoot.value) return;

    // 为@提及链接添加点击事件处理，阻止跳转到外部链接
    const mentionLinks = markdownRoot.value.querySelectorAll('a[href*="matrix.to"]');
    mentionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // 阻止默认的导航行为
            // 不执行任何其他操作
        });
    });
}

function addCopyButtons() {
    if (!markdownRoot.value) return;
    // 移除旧按钮，防止重复
    markdownRoot.value.querySelectorAll('.ycb-copy-btn').forEach(btn => btn.remove());
    // 先收集所有 pre 节点，批量处理，避免 DOM 结构变化导致只处理第一个
    const preList = Array.from(markdownRoot.value.querySelectorAll('pre'));
    // 彻底修复：cloneNode 深拷贝 pre，插入 wrapper 后不影响原 preList
    preList.forEach(pre => {
        const parent = pre.parentNode;
        const next = pre.nextSibling;
        // 创建按钮
        const btn = document.createElement('button');
        btn.className = 'ycb-copy-btn';
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><rect x="2" y="2" width="13" height="13" rx="2" ry="2"></rect></svg>';
        btn.title = '复制代码';
        btn.onclick = () => {
            const code = pre.querySelector('code');
            if (code) {
                // 复制时获取纯文本内容，不包含HTML标签
                const textContent = code.textContent || code.innerText || '';
                navigator.clipboard.writeText(textContent).then(() => {
                    btn.textContent = '已复制!';
                    setTimeout(() => {
                        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><rect x="2" y="2" width="13" height="13" rx="2" ry="2"></rect></svg>';
                    }, 1200);
                });
            }
        };
        // 固定按钮在 pre 父容器右上角，避免层级错误
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        btn.style.position = 'absolute';
        btn.style.top = 'var(--md-copy-btn-top)';
        btn.style.right = 'var(--md-copy-btn-right)';
        btn.style.zIndex = '10';
        btn.style.background = 'var(--md-codeblock-bg)';
        btn.style.border = 'none';
        btn.style.borderRadius = 'var(--md-copy-btn-radius)';
        btn.style.padding = 'var(--md-copy-btn-padding-y) var(--md-copy-btn-padding-x)';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = 'var(--md-copy-btn-font-size)';
        btn.style.color = 'var(--text-color)';
        btn.style.boxShadow = 'var(--md-copy-btn-shadow)';
        btn.style.transition = 'background 0.2s';
        btn.style.pointerEvents = 'auto';
        btn.onmouseenter = () => btn.style.background = 'var(--hover-bg)';
        btn.onmouseleave = () => btn.style.background = 'var(--md-codeblock-bg)';
        // cloneNode 深拷贝 pre，避免 DOM 移动影响后续 pre
        const preClone = pre.cloneNode(true);
        wrapper.appendChild(preClone);
        wrapper.appendChild(btn);
        if (parent) {
            parent.insertBefore(wrapper, next);
            parent.removeChild(pre);
        }
    });
}





onMounted(() => {
    nextTick(() => {
        if (props.streamMode) {
            // 流式模式初始化
            isStreaming.value = true
            streamHtml.value = props.content || ''

            // 初始渲染
            try {
                const md = new Markdown(streamHtml.value)
                streamHtml.value = linkifyRelativeNocoBasePaths(md.toHTML({ externalLinks: false }))
            } catch (e) {
                console.warn('[System:MarkdownRenderer:onMounted] Initial stream render error:', e)
            }
        } else {
            addCopyButtons()
            addLinksToCodeBlocks()
            addMentionClickHandlers()
        }
    })
})

// 监听 content，实现增量流式追加
watch(() => props.content, (newContent, oldContent) => {
    if (props.streamMode) {
        // 流式模式：增量追加
        const newLength = newContent?.length || 0
        const oldLength = oldContent?.length || 0

        // 只处理内容增加的情况
        if (newLength > oldLength) {
            // 直接更新 streamHtml，不需要逐字动画（WebSocket 已经是逐字推送）
            streamHtml.value = newContent || ''

            // 渲染 Markdown（使用防抖避免频繁渲染）
            nextTick(() => {
                try {
                    const md = new Markdown(streamHtml.value)
                    streamHtml.value = linkifyRelativeNocoBasePaths(md.toHTML({ externalLinks: false }))
                } catch (e) {
                    console.warn('[System:MarkdownRenderer:watch] Stream render error:', e)
                }
            })
        }
    } else {
        nextTick(() => {
            addCopyButtons()
            addLinksToCodeBlocks()
            addMentionClickHandlers()
        })
    }
}, { immediate: false })

// 监听streamMode变化
watch(() => props.streamMode, (newStreamMode) => {
    if (newStreamMode) {
        // 初始化流式渲染
        isStreaming.value = true
        streamHtml.value = props.content || ''
    } else {
        // 结束流式渲染
        isStreaming.value = false
    }
})
</script>


<style scoped>
/* 流式渲染样式 */
.stream-container {
    position: relative;
}

.stream-output {
    min-height: 20px;
}

.stream-cursor {
    display: inline-block;
    animation: blink 1s infinite;
    font-weight: bold;
    color: var(--primary-color);
    margin-left: 2px;
}

@keyframes blink {

    0%,
    50% {
        opacity: 1;
    }

    51%,
    100% {
        opacity: 0;
    }
}

/* Element 官方基础样式 */
.markdown-body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif !important;
    font-size: var(--font-sm);
    letter-spacing: 0;
    white-space: normal !important;
    line-height: 1.55 !important;
    background-color: inherit;
    color: inherit;
    flex: 1;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

@media (max-width: 768px) {
    .markdown-body {
        max-width: 100%;
        width: 100%;
        overflow-wrap: anywhere;
        word-break: break-word;
    }
}

/* Element 官方标题样式 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
    font-family: inherit !important;
    color: inherit;
    font-weight: 600;
    line-height: 1.35;
    margin: 0;
}

/* Make h1 and h2 the same size as h3 (Element 官方规则) */
.markdown-body :deep(h1),
.markdown-body :deep(h2) {
    font-size: 1.08em;
    border-bottom: none !important;
    /* override GFM */
}

.markdown-body :deep(h3) {
    font-size: 1.02em;
}

.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
    font-size: 0.98em;
}

.markdown-body :deep(h6) {
    color: var(--text-muted);
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(blockquote),
.markdown-body :deep(pre),
.markdown-body :deep(table),
.markdown-body :deep(hr) {
    margin: 0;
}

.markdown-body :deep(p + p),
.markdown-body :deep(p + ul),
.markdown-body :deep(p + ol),
.markdown-body :deep(p + blockquote),
.markdown-body :deep(p + pre),
.markdown-body :deep(p + table),
.markdown-body :deep(ul + p),
.markdown-body :deep(ol + p),
.markdown-body :deep(blockquote + p),
.markdown-body :deep(pre + p),
.markdown-body :deep(table + p),
.markdown-body :deep(ul + ul),
.markdown-body :deep(ol + ol),
.markdown-body :deep(ul + ol),
.markdown-body :deep(ol + ul),
.markdown-body :deep(blockquote + blockquote),
.markdown-body :deep(pre + pre),
.markdown-body :deep(table + table),
.markdown-body :deep(hr + p),
.markdown-body :deep(h1 + p),
.markdown-body :deep(h2 + p),
.markdown-body :deep(h3 + p),
.markdown-body :deep(h4 + p),
.markdown-body :deep(h5 + p),
.markdown-body :deep(h6 + p),
.markdown-body :deep(p + h1),
.markdown-body :deep(p + h2),
.markdown-body :deep(p + h3),
.markdown-body :deep(p + h4),
.markdown-body :deep(p + h5),
.markdown-body :deep(p + h6),
.markdown-body :deep(h1 + h2),
.markdown-body :deep(h2 + h3),
.markdown-body :deep(h3 + h4),
.markdown-body :deep(h4 + h5),
.markdown-body :deep(h5 + h6) {
    margin-top: 0.42em;
}

.markdown-body :deep(li + li) {
    margin-top: 0.16em;
}

.markdown-body :deep(li > p),
.markdown-body :deep(li > ul),
.markdown-body :deep(li > ol) {
    margin-top: 0.18em;
}

/* Element 官方链接样式 */
.markdown-body :deep(a) {
    color: var(--primary-color);
    text-decoration: none;
    cursor: pointer;
}

.markdown-body :deep(a:hover) {
    text-decoration: underline;
}

/* Element 官方引用块样式 */
.markdown-body :deep(blockquote) {
    border-left: 2px solid var(--md-border-color);
    color: var(--md-subtle-text-color);
    border-radius: 2px;
    padding: 0.18em 0 0.18em 0.68em;
}

/* Override nested lists being lower-roman (Element 官方) */
.markdown-body :deep(ol ol),
.markdown-body :deep(ul ol) {
    list-style-type: revert;
}

/* Make list type disc to match rich text editor (Element 官方) */
.markdown-body :deep(ul) {
    list-style-type: disc;
    padding-left: 1.2em;
}

.markdown-body :deep(ol) {
    padding-left: 1.25em;
}



/* 支持居中对齐的 HTML */
.markdown-body :deep(div[align="center"]) {
    text-align: center;
    margin: 0.32em 0;
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




/* Element 官方图片样式 */
.markdown-body :deep(img) {
    object-fit: contain;
    object-position: left top;
    /* Override the default colors of the 'github-markdown-css' library */
    background-color: inherit !important;
    max-width: min(36vw, 200px) !important;
    max-height: 200px;
    width: auto;
    height: auto;
}

.markdown-body :deep(video) {
    max-width: min(36vw, 200px) !important;
    max-height: 200px;
    width: min(36vw, 200px);
    height: auto;
    object-fit: contain;
    border-radius: var(--radius-sm);
}

/* Element 官方 Pill (提及) 样式 */
.markdown-body :deep(.mx_Pill),
.markdown-body :deep(a[href*="matrix.to"]) {
    padding: 1px 0.3em 1px 0.3em;

    border-radius: 16px;
    vertical-align: text-top;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    max-width: 100%;
    overflow: hidden;
    cursor: pointer;

    text-decoration: none !important;
}

/* 普通链接样式 - 覆盖 .linkified 样式，使其看起来像普通链接 */
.markdown-body :deep(.linkified) {
    color: var(--primary-color) !important;
    text-decoration: none !important;
    background-color: transparent !important;
    padding: 0 !important;
    border-radius: 0 !important;
    display: inline !important;
    line-height: inherit !important;
    vertical-align: baseline !important;
}

.markdown-body :deep(.linkified:hover) {
    text-decoration: underline !important;
    background-color: transparent !important;
}

/* Element 官方 @room 提及样式 */
.markdown-body :deep(.mx_Pill.mx_AtRoomPill) {
    background-color: var(--danger-color) !important;
}

.markdown-body :deep(.mx_Pill.mx_AtRoomPill:hover) {
    background-color: var(--danger-color) !important;
    opacity: 0.9;
}

/* Element 任务列表样式 */
.markdown-body :deep(.task-list-item) {
    list-style-type: none;
}

.markdown-body :deep(.task-list-item input[type="checkbox"]) {
    margin: 0 0.4em 0 -1.1em;
    vertical-align: middle;
}

/* 代码块中的链接样式 */
.markdown-body :deep(pre code a.code-link) {
    color: var(--primary-color) !important;
    text-decoration: underline !important;
}

.markdown-body :deep(pre code a.code-link):hover {
    opacity: 0.8;
}

/* Element 官方大表情样式 */
.markdown-body :deep(.mx_EventTile_bigEmoji) {
    font-size: var(--font-sm);
    line-height: 30px;
}

.markdown-body :deep(.mx_EventTile_bigEmoji .mx_Emoji) {
    font-size: inherit !important;
}

/* Element 官方 Spoiler (剧透) 样式 */
.markdown-body :deep(.mx_EventTile_spoiler) {
    cursor: pointer;
    appearance: none;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font-size: inherit;
    font-family: inherit;
    line-height: inherit;
    text-align: inherit;
}

.markdown-body :deep(.mx_EventTile_spoiler .mx_EventTile_spoiler_reason) {
    color: var(--md-subtle-text-color);
    font-size: var(--font-xs);
}

.markdown-body :deep(.mx_EventTile_spoiler .mx_EventTile_spoiler_content) {
    filter: blur(5px) saturate(0.1) sepia(1);
    transition-duration: 0.5s;
    pointer-events: none;
}

.markdown-body :deep(.mx_EventTile_spoiler.visible > .mx_EventTile_spoiler_content) {
    filter: none;
    user-select: auto;
    pointer-events: auto;
}

/* Element 官方 - 高亮搜索结果 */
.markdown-body :deep(.mx_EventTile_searchHighlight) {
    background-color: var(--warning-color);
    color: var(--btn-text);
    border-radius: 4px;
    padding-inline: 1px;
    cursor: pointer;
}

.markdown-body :deep(.mx_EventTile_searchHighlight a) {
    background-color: var(--warning-color);
    color: var(--btn-text);
}



/* Element 表格样式 */
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
    padding: 5px 8px;
    text-align: left;
    vertical-align: top;
    line-height: 1.45;
}

/* 只对允许换行的普通文本单元格设置最小宽度，防止被挤压成一字一行 */
.markdown-body :deep(td):not(.nowrap) {
    min-width: 120px;
}

.markdown-body :deep(.nowrap) {
    white-space: nowrap;
}

.markdown-body :deep(th) {
    font-weight: 600;
}

.markdown-body :deep(tbody tr) {
    background-color: var(--md-table-row-alt-bg);
    border-top: 1px solid var(--md-table-border-color);
}

.markdown-body :deep(tbody tr:nth-child(2n)) {
    background-color: var(--md-table-row-base-bg);
}




/* Element 官方代码样式 */
.markdown-body :deep(pre),
.markdown-body :deep(code) {
    font-family: 'Inconsolata', 'Courier', monospace !important;
    background-color: var(--md-code-bg);
}

/* Element 官方行内代码样式 */
.markdown-body :deep(code:not(pre *)) {
    background-color: var(--md-code-bg);
    border: 1px solid var(--md-border-color);
    border-radius: 3px;
    padding: 0.08em 0.36em;
    font-size: 0.92em;
    line-height: 1.35;
}

.markdown-body :deep(code) {
    white-space: pre-wrap;
    /* don't collapse spaces in inline code blocks */
}

/* Element 官方代码块样式 */
.markdown-body :deep(pre) {
    overflow-x: overlay;
    overflow-y: visible;
    border: 1px solid var(--md-border-color);
    border-radius: 3px;
    padding: 10px 12px;
    background-color: var(--md-codeblock-bg);
}

.markdown-body :deep(pre)::-webkit-scrollbar-corner {
    background: transparent;
}

.markdown-body :deep(pre code) {
    white-space: pre;
    /* we want code blocks to be scrollable and not wrap */
    background: transparent;
    border: none;
    padding: 0;
    font-size: 0.92em;
    line-height: 1.55;
}

.markdown-body :deep(pre code > *) {
    display: inline;
}

/* Think 模式样式 */
.think-details {
    border-radius: var(--radius-sm);
    overflow: hidden;
}

.think-summary {
    cursor: pointer;
    padding: var(--space-xs) var(--space-sm);
    background: var(--md-codeblock-bg);
    border-radius: var(--radius-sm);
    user-select: none;
    list-style: none;
    transition: var(--md-transition-colors);
    font-size: var(--font-xs);
    line-height: 1.4;
}

.think-summary:hover {
    background: var(--hover-bg);
}

.think-summary::-webkit-details-marker {
    display: none;
}

.think-content {
    padding: var(--space-sm);
    border: 1px solid var(--md-border-color);
    border-top: 0;
    background: var(--panel-bg);
    line-height: 1.5;
}

.think-result {
    margin-top: 4px;
}
</style>