import { createApp, h } from 'vue'
import { createPinia, getActivePinia, type Pinia } from 'pinia'

import ApprovalManagementDialog from './ApprovalManagementDialog.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

type ApprovalDialogTab = 'todo' | 'submit' | 'template'

interface OpenApprovalDialogOptions {
  pinia?: Pinia
  defaultTab?: ApprovalDialogTab
}

export function openApprovalManagementDialog(options: OpenApprovalDialogOptions = {}) {
  if (rootEl) {
    closeApprovalManagementDialog()
  }

  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  app = createApp({
    render: () =>
      h(ApprovalManagementDialog, {
        defaultTab: options.defaultTab || 'todo',
        onClose: closeApprovalManagementDialog,
      }),
  })

  const pinia = options.pinia || getActivePinia() || createPinia()
  app.use(pinia)
  app.mount(rootEl)
}

export function closeApprovalManagementDialog() {
  if (app && rootEl) {
    app.unmount()
    if (document.body.contains(rootEl)) {
      document.body.removeChild(rootEl)
    }
  }
  app = null
  rootEl = null
}
