import { createApp, h } from 'vue'

import MessageDialog from './MessageDialog.vue'
import ConfirmDialog from './ConfirmDialog.vue'

export function openMessageDialog(message: string, options?: {
  title?: string
  confirmText?: string
  onClose?: () => void
}) {
  const rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  const app = createApp({
    render() {
      return h(MessageDialog, {
        title: options?.title || '提示',
        message,
        confirmText: options?.confirmText || '知道了',
        onClose: () => {
          options?.onClose?.()
          app.unmount()
          rootEl.remove()
        },
      })
    },
  })

  app.mount(rootEl)
}

export function openConfirmDialog(message: string, options?: {
  title?: string
  confirmText?: string
  cancelText?: string
}): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(true)

  return new Promise((resolve) => {
    const rootEl = document.createElement('div')
    document.body.appendChild(rootEl)

    const app = createApp({
      render() {
        const cleanup = (result: boolean) => {
          resolve(result)
          app.unmount()
          rootEl.remove()
        }

        return h(ConfirmDialog, {
          title: options?.title || '确认',
          message,
          confirmText: options?.confirmText || '确定',
          cancelText: options?.cancelText || '取消',
          onConfirm: () => cleanup(true),
          onCancel: () => cleanup(false),
        })
      },
    })

    app.mount(rootEl)
  })
}
