import { createApp, h } from 'vue'
import CreateBotDialog from './index.vue'

export type CreateBotDialogPayload = {
  appName: string
  nickname: string
  token: string
}

export function openCreateBotDialog(options: {
  applications: Array<any>
}): Promise<CreateBotDialogPayload | null> {
  if (typeof document === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    const rootEl = document.createElement('div')
    document.body.appendChild(rootEl)

    const app = createApp({
      render() {
        const cleanup = (result: CreateBotDialogPayload | null) => {
          resolve(result)
          app.unmount()
          rootEl.remove()
        }

        return h(CreateBotDialog, {
          applications: options.applications,
          onSubmit: (payload: CreateBotDialogPayload) => cleanup(payload),
          onClose: () => cleanup(null),
        })
      },
    })

    app.mount(rootEl)
  })
}
