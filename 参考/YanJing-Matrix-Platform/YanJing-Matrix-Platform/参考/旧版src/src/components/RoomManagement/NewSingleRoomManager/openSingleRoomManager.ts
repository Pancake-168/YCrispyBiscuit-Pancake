import { createApp, h } from 'vue'
import SingleRoomManager from './SingleRoomManager.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

// 可选的房间更新回调（外部注册）
let roomUpdatedHandler: ((roomId: string) => void) | null = null

export function setSingleRoomManagerRoomUpdatedHandler(handler: (roomId: string) => void) {
  roomUpdatedHandler = handler
}

// roomId 可选：若不提供则内部使用 chatContext.currentRoomId
export function openSingleRoomManager(roomId?: string) {
  if (app && rootEl) {
    app.unmount()
    app = createApp({
      render: () => h(SingleRoomManager, {
        roomId, // 可能为 undefined
        onClose: closeSingleRoomManager,
        onRoomUpdated: (rid: string) => {
          try {
            if (roomUpdatedHandler) roomUpdatedHandler(rid)
            else console.log('[SingleRoomManager] roomUpdated (no handler):', rid)
          } catch (e) {
            console.warn('[SingleRoomManager] roomUpdated handler error:', e)
          }
        },
      }),
    })
    app.mount(rootEl)
    return
  }

  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)
  app = createApp({
    render: () => h(SingleRoomManager, {
      roomId,
      onClose: closeSingleRoomManager,
      onRoomUpdated: (rid: string) => {
        try {
          if (roomUpdatedHandler) roomUpdatedHandler(rid)
          else console.log('[SingleRoomManager] roomUpdated (no handler):', rid)
        } catch (e) {
          console.warn('[SingleRoomManager] roomUpdated handler error:', e)
        }
      },
    }),
  })
  app.mount(rootEl)
}

export function closeSingleRoomManager() {
  if (app && rootEl) {
    app.unmount()
    rootEl.remove()
  }
  app = null
  rootEl = null
}
