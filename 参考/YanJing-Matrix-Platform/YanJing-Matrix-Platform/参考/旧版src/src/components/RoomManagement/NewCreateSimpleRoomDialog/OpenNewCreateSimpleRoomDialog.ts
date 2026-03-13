import { createApp, h } from 'vue'
import NewCreateSimpleRoomDialog from './NewCreateSimpleRoomDialog.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

// 可选的“创建成功”回调，由调用方注册，用于拿到新建房间ID
let createdHandler: ((roomId: string) => void) | null = null
 
/**
 * 注册全局创建房间成功回调
 * 例如在 MainPage 中：
 *   setNewCreateRoomDialogCreatedHandler((roomId) => {
 *     // 跳转到房间等
 *   })
 */
export function setNewCreateRoomDialogCreatedHandler(handler: (roomId: string) => void) {
  createdHandler = handler
}

export function openNewCreateRoomDialog() {
  if (rootEl) return // 已经打开

  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  app = createApp({
    render: () => h(NewCreateSimpleRoomDialog, {
      onClose: closeNewCreateRoomDialog,
      onCreated: (roomId: string) => {
        try {
          if (createdHandler) {
            createdHandler(roomId)
          } else {
            console.log('[NewCreateSimpleRoomDialog] created (no handler):', roomId)
          }
        } catch (e) {
          console.warn('[NewCreateSimpleRoomDialog] created handler error:', e)
        }
      },
    }),
  })

  app.mount(rootEl)
}

export function closeNewCreateRoomDialog() {
  if (app && rootEl) {
    app.unmount()
    rootEl.remove()
  }
  app = null
  rootEl = null
}
