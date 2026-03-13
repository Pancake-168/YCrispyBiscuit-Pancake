import { createApp, h, reactive } from 'vue'

import FilePreviewDialog from './FilePreviewDialog.vue'
import { buildMediaCandidates, fetchWithAuthToBlob, resolveMediaBaseUrl } from '@/utils/media'

type PreviewKind = 'text' | 'markdown' | 'html' | 'pdf' | 'audio' | 'unsupported'

interface OpenFilePreviewOptions {
  title?: string
  fileName?: string
  fileSize?: number
  mimetype?: string
  url?: string
  mxcUrl?: string
}

const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown', 'mdown', 'mkd'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'weba', 'webm'])
const TEXT_EXTENSIONS = new Set([
  'txt', 'text', 'log', 'json', 'xml', 'yml', 'yaml', 'csv', 'tsv', 'tex',
  'js', 'ts', 'tsx', 'jsx', 'vue', 'css', 'scss', 'less', 'html', 'htm',
  'sql', 'sh', 'bat', 'ps1', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'ini',
  'conf', 'properties', 'toml'
])
const DOCX_EXTENSIONS = new Set(['docx'])
const SPREADSHEET_EXTENSIONS = new Set(['xls', 'xlsx'])
const PRESENTATION_EXTENSIONS = new Set(['ppt', 'pptx'])
const LEGACY_WORD_EXTENSIONS = new Set(['doc'])
const MAX_TEXT_PREVIEW_SIZE = 2 * 1024 * 1024

const isPresentationMime = (mimeType?: string) => {
  const value = (mimeType || '').toLowerCase()
  return value.includes('presentationml.presentation') || value.includes('ms-powerpoint')
}

const isSpreadsheetMime = (mimeType?: string) => {
  const value = (mimeType || '').toLowerCase()
  return value.includes('spreadsheetml.sheet') || value.includes('ms-excel')
}

const isWordMime = (mimeType?: string) => {
  const value = (mimeType || '').toLowerCase()
  return value.includes('wordprocessingml.document') || value.includes('msword')
}

const getExtension = (fileName?: string) => fileName?.split('.').pop()?.trim().toLowerCase() || ''

const isTextMime = (mimeType?: string) => {
  if (!mimeType) return false
  const value = mimeType.toLowerCase()
  return value.startsWith('text/')
    || value === 'application/json'
    || value.endsWith('+json')
    || value === 'application/xml'
    || value === 'text/xml'
    || value.endsWith('+xml')
    || value === 'application/yaml'
    || value === 'text/yaml'
    || value === 'application/x-yaml'
    || value === 'application/javascript'
    || value === 'text/javascript'
    || value === 'application/typescript'
}

const detectPreviewKind = (fileName?: string, mimeType?: string): PreviewKind => {
  const ext = getExtension(fileName)
  const normalizedMime = (mimeType || '').toLowerCase()
  if (normalizedMime.startsWith('audio/') || AUDIO_EXTENSIONS.has(ext)) return 'audio'
  if (PRESENTATION_EXTENSIONS.has(ext) || isPresentationMime(normalizedMime)) return 'unsupported'
  if (normalizedMime.includes('pdf') || ext === 'pdf') return 'pdf'
  if (DOCX_EXTENSIONS.has(ext) || isWordMime(normalizedMime) && !LEGACY_WORD_EXTENSIONS.has(ext)) return 'html'
  if (SPREADSHEET_EXTENSIONS.has(ext) || isSpreadsheetMime(normalizedMime)) return 'unsupported'
  if (normalizedMime.includes('markdown') || MARKDOWN_EXTENSIONS.has(ext)) return 'markdown'
  if (isTextMime(normalizedMime) || TEXT_EXTENSIONS.has(ext)) return 'text'
  return 'unsupported'
}

const getPreviewLabel = (fileName?: string, mimeType?: string) => {
  const ext = getExtension(fileName)
  const normalizedMime = (mimeType || '').toLowerCase()
  if (normalizedMime.startsWith('audio/') || AUDIO_EXTENSIONS.has(ext)) return '音频播放'
  if (normalizedMime.includes('pdf') || ext === 'pdf') return 'PDF 预览'
  if (DOCX_EXTENSIONS.has(ext) || isWordMime(normalizedMime) && !LEGACY_WORD_EXTENSIONS.has(ext)) return 'Word 预览'
  if (SPREADSHEET_EXTENSIONS.has(ext) || isSpreadsheetMime(normalizedMime)) return '表格文件'
  if (PRESENTATION_EXTENSIONS.has(ext) || isPresentationMime(normalizedMime)) return '演示文稿'
  if (normalizedMime.includes('markdown') || MARKDOWN_EXTENSIONS.has(ext)) return 'Markdown 预览'
  if (isTextMime(normalizedMime) || TEXT_EXTENSIONS.has(ext)) return '文本预览'
  return '仅支持下载'
}

const buildUnsupportedReason = (fileName?: string, mimeType?: string) => {
  const ext = getExtension(fileName)
  if (PRESENTATION_EXTENSIONS.has(ext) || isPresentationMime(mimeType)) {
    return 'PPT/PPTX 当前采用降级策略：不在弹窗内解析页内容，建议直接下载或外部打开。'
  }
  if (SPREADSHEET_EXTENSIONS.has(ext) || isSpreadsheetMime(mimeType)) {
    return 'Excel/表格文件暂不提供弹窗预览，避免样式失真和信息误读，建议直接下载后在本地查看。'
  }
  if (LEGACY_WORD_EXTENSIONS.has(ext) || isWordMime(mimeType) && ext === 'doc') {
    return 'DOC 二进制文档暂未支持浏览器内解析，建议下载后用本地 Office 打开。'
  }
  if (mimeType) {
    return `当前文件类型为 ${mimeType}，暂未实现在线预览。`
  }
  return '当前文件类型暂未实现在线预览。'
}

const formatTextContent = (raw: string, fileName?: string, mimeType?: string) => {
  const ext = getExtension(fileName)
  const normalizedMime = (mimeType || '').toLowerCase()
  if (ext === 'json' || normalizedMime.includes('json')) {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      return raw
    }
  }
  return raw
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.style.display = 'none'
  anchor.href = objectUrl
  anchor.download = fileName || 'download'
  document.body.appendChild(anchor)
  anchor.click()
  URL.revokeObjectURL(objectUrl)
  document.body.removeChild(anchor)
}

const loadPreviewBlob = async (options: OpenFilePreviewOptions) => {
  const baseUrl = resolveMediaBaseUrl({ url: options.url, mxcUrl: options.mxcUrl })
  if (!baseUrl) throw new Error('无法获取文件地址')

  const candidates = buildMediaCandidates(baseUrl)
  for (const candidate of candidates) {
    try {
      return await fetchWithAuthToBlob(candidate, options.mimetype)
    } catch {
      // try next candidate
    }
  }

  throw new Error('文件加载失败')
}

export function openFilePreviewDialog(options: OpenFilePreviewOptions) {
  if (!options.url && !options.mxcUrl) return

  const rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  const state = reactive({
    loading: true,
    error: '',
    previewKind: 'unsupported' as PreviewKind,
    previewKindLabel: '',
    textContent: '',
    htmlContent: '',
    blobUrl: '',
    blob: null as Blob | null,
    mimeType: options.mimetype || '',
    fileSize: options.fileSize,
    unsupportedReason: '',
  })

  const shouldDownloadInsteadOfOpening = () => {
    const ext = getExtension(options.fileName)
    const mimeType = state.mimeType || options.mimetype || ''
    return PRESENTATION_EXTENSIONS.has(ext)
      || SPREADSHEET_EXTENSIONS.has(ext)
      || LEGACY_WORD_EXTENSIONS.has(ext)
      || isPresentationMime(mimeType)
      || isSpreadsheetMime(mimeType)
      || (isWordMime(mimeType) && ext === 'doc')
      || state.previewKind === 'unsupported'
  }

  const cleanup = () => {
    if (state.blobUrl) {
      URL.revokeObjectURL(state.blobUrl)
      state.blobUrl = ''
    }
    app.unmount()
    rootEl.remove()
  }

  const download = () => {
    if (state.blob) {
      downloadBlob(state.blob, options.fileName || 'download')
      return
    }
    if (options.url) {
      window.open(options.url, '_blank', 'noopener,noreferrer')
    }
  }

  const openExternal = () => {
    if (state.blob && shouldDownloadInsteadOfOpening()) {
      downloadBlob(state.blob, options.fileName || 'download')
      return
    }
    if (state.blobUrl) {
      window.open(state.blobUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (options.url) {
      window.open(options.url, '_blank', 'noopener,noreferrer')
    }
  }

  const app = createApp({
    render() {
      return h(FilePreviewDialog, {
        title: options.title || '文件预览',
        fileName: options.fileName || '未命名文件',
        fileSize: state.fileSize,
        mimeType: state.mimeType,
        previewKind: state.previewKind,
        previewKindLabel: state.previewKindLabel,
        textContent: state.textContent,
        htmlContent: state.htmlContent,
        blobUrl: state.blobUrl,
        loading: state.loading,
        error: state.error,
        unsupportedReason: state.unsupportedReason,
        onClose: cleanup,
        onDownload: download,
        onOpenExternal: openExternal,
      })
    },
  })

  app.mount(rootEl)

  void (async () => {
    try {
      const blob = await loadPreviewBlob(options)
      state.blob = blob
      state.fileSize = state.fileSize ?? blob.size
      state.mimeType = state.mimeType || blob.type || ''
      state.previewKind = detectPreviewKind(options.fileName, state.mimeType)
      state.previewKindLabel = getPreviewLabel(options.fileName, state.mimeType)
      state.blobUrl = URL.createObjectURL(blob)
      const ext = getExtension(options.fileName)

      if (state.previewKind === 'text' || state.previewKind === 'markdown') {
        if (blob.size > MAX_TEXT_PREVIEW_SIZE) {
          state.previewKind = 'unsupported'
          state.unsupportedReason = '文本文件超过 2 MB，当前版本不做在线展开，建议下载后查看。'
          return
        }
        const rawText = await blob.text()
        state.textContent = formatTextContent(rawText, options.fileName, state.mimeType)
        return
      }

      if (state.previewKind === 'html') {
        if (DOCX_EXTENSIONS.has(ext)) {
          state.htmlContent = await renderDocxToHtml(blob)
          return
        }
      }

      if (state.previewKind === 'unsupported') {
        state.unsupportedReason = buildUnsupportedReason(options.fileName, state.mimeType)
      }
    } catch (error) {
      state.error = String(error || '文件加载失败')
    } finally {
      state.loading = false
    }
  })()
}

const renderDocxToHtml = async (blob: Blob) => {
  const mammoth = await import('mammoth/mammoth.browser')
  const arrayBuffer = await blob.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })
  return result.value || '<p>文档内容为空</p>'
}
