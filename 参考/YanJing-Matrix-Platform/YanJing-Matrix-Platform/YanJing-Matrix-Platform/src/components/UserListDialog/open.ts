import { createApp, h } from 'vue'
import { createPinia, type Pinia, getActivePinia } from 'pinia'
import UserListDialog from './UserListDialog.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

interface OpenUserListOptions {
  pinia?: Pinia
  onTalkRequest?: (userid: string, createdRoomId?: string) => void
}

export function openUserListDialog(options: OpenUserListOptions = {}) {
  if (rootEl) {
    closeUserListDialog()
  }

  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  app = createApp({
    render: () =>
      h(UserListDialog, {
        onClose: closeUserListDialog,
        onTalkRequestFromOrganizationList: options.onTalkRequest,
      }),
  })

  const pinia = options.pinia || getActivePinia() || createPinia()
  app.use(pinia)
  app.mount(rootEl)
}

export function closeUserListDialog() {
  if (app && rootEl) {
    app.unmount()
    if (document.body.contains(rootEl)) {
      document.body.removeChild(rootEl)
    }
  }
  app = null
  rootEl = null
}
