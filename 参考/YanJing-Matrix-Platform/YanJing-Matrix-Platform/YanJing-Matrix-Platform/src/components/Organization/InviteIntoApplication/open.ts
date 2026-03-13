import { createApp, h } from 'vue'
import { createPinia, type Pinia } from 'pinia'
import InviteIntoApplicationDialog from './InviteIntoApplicationDialog.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

interface InviteIntoApplicationOptions {
  appid: string
  pinia?: Pinia
}

export function openInviteIntoApplicationDialog(options: InviteIntoApplicationOptions) {
  if (rootEl) {
    closeInviteIntoApplicationDialog()
  }

  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  app = createApp({
    render: () =>
      h(InviteIntoApplicationDialog, {
        appid: options.appid,
        onClose: closeInviteIntoApplicationDialog,
      }),
  })

  if (options.pinia) {
    app.use(options.pinia)
  } else {
    app.use(createPinia())
  }

  app.mount(rootEl)
}

export function closeInviteIntoApplicationDialog() {
  if (app && rootEl) {
    app.unmount()
    if (document.body.contains(rootEl)) {
      document.body.removeChild(rootEl)
    }
  }
  app = null
  rootEl = null
}
