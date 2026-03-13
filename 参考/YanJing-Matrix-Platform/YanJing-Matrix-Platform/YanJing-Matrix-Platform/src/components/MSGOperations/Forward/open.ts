import { createApp, h } from 'vue'
import ForwardDialog from './ForwardDialog.vue'

type RoomOption = { id: string; name: string }

/**
 * 打开转发房间选择弹窗。
 * 输入：rooms。
 * 输出：Promise<string[]>。
 * 逻辑：返回用户选择的房间 ID 列表。
 */
export function openForwardDialog(rooms: RoomOption[]): Promise<string[]> {
  return new Promise((resolve) => {
    const rootEl = document.createElement('div')
    document.body.appendChild(rootEl)

    const app = createApp({
      render() {
        const cleanup = (confirmed: boolean, roomIds: string[]) => {
          resolve(confirmed ? roomIds : [])
          app.unmount()
          rootEl.remove()
        }

        return h(ForwardDialog, {
          rooms,
          onClose: cleanup,
        })
      },
    })

    app.mount(rootEl)
  })
}