import { createApp, h } from 'vue'

import MediaPreviewOverlay from './MediaPreviewOverlay.vue'

interface OpenMediaPreviewOptions {
  kind: 'image' | 'video'
  fileName?: string
  fileSize?: number
  mimeType?: string
  url?: string
  mxcUrl?: string
}

export function openMediaPreviewOverlay(options: OpenMediaPreviewOptions) {
  if (!options.url && !options.mxcUrl) return

  const rootEl = document.createElement('div')
  document.body.appendChild(rootEl)
  document.body.style.overflow = 'hidden'

  const app = createApp({
    render() {
      return h(MediaPreviewOverlay, {
        kind: options.kind,
        fileName: options.fileName,
        fileSize: options.fileSize,
        mimeType: options.mimeType,
        url: options.url,
        mxcUrl: options.mxcUrl,
        onClose: () => {
          document.body.style.overflow = 'auto'
          app.unmount()
          rootEl.remove()
        },
      })
    },
  })

  app.mount(rootEl)
}