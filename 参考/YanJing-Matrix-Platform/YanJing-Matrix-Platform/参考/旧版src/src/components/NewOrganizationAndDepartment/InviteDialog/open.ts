import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import InviteDialog from './InviteDialog.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

interface InviteDialogOptions {
  roomId: string
  inviteType?: 'space' | 'room'
  departmentId: number
  onInvited?: (userIds: string[], inviteType: 'space' | 'room', roomId: string) => void
  onClose?: () => void
}

export function openInviteDialog(options: InviteDialogOptions) {
  if (rootEl) {
    // 如果已经存在，先关闭旧的
    closeInviteDialog()
  }
  
  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)
  
  app = createApp({
    render: () => h(InviteDialog, {
      roomId: options.roomId,
      inviteType: options.inviteType || 'room',
      departmentId: options.departmentId,
      onClose: () => {
        closeInviteDialog()
        if (options.onClose) {
          options.onClose()
        }
      },
      onInvited: (userIds: string[], inviteType: 'space' | 'room', roomId: string) => {
        if (options.onInvited) {
          options.onInvited(userIds, inviteType, roomId)
        }
        // 邀请成功后通常关闭弹窗，或者根据需求保持
        // 这里我们选择不自动关闭，让组件内部决定，或者用户手动关闭
        // 但通常弹窗会在操作完成后关闭，这里假设组件内部会触发 close 事件
      }
    }),
  })
  
  // 为该组件实例创建一个独立的 Pinia 实例，避免依赖全局实例
  app.use(createPinia())
  app.mount(rootEl)
}

export function closeInviteDialog() {
  if (app && rootEl) {
    app.unmount()
    if (document.body.contains(rootEl)) {
      document.body.removeChild(rootEl)
    }
  }
  app = null
  rootEl = null
}
