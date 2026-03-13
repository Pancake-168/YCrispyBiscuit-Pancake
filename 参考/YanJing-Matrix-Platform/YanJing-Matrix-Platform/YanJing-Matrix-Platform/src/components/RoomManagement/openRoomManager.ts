import { createApp, h } from 'vue'
import RoomManagerModal from './RoomManagerModal2.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

export function openRoomManager(roomId: string, options?: { onRoomUpdated?: (roomId: string) => void }) {
  if (!roomId) return

  const onClose = () => {
    if (app && rootEl) {
      app.unmount()
      rootEl.remove()
    }
    app = null
    rootEl = null
  }

  if (app && rootEl) {
    app.unmount()
    app = null
  }

  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  app = createApp({
    render: () =>
      h(RoomManagerModal, {
        roomId,
        onClose,
        onRoomUpdated: (rid: string) => options?.onRoomUpdated?.(rid),
      }),
  })

  app.mount(rootEl)
}
