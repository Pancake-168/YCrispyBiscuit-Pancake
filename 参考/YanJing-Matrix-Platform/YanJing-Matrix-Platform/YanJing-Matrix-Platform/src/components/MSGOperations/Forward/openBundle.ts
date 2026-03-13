import { createApp } from 'vue'
import ForwardBundleDialog from './ForwardBundleDialog.vue'
import type { MatrixMessageType } from '@/types/message'

type ForwardBundle = {
  sourceRoomId: string
  sourceEventIds: string[]
  items: Array<{
    type: MatrixMessageType
    senderName?: string
    senderId?: string
    content: string
    fileName?: string
    url?: string
  }>
}

export function openForwardBundleDialog(bundle: ForwardBundle) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(ForwardBundleDialog, {
    bundle,
    onClose: () => {
      app.unmount()
      container.remove()
    },
  })

  app.mount(container)
}