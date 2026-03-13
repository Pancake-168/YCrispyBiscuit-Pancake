import { createApp, h } from 'vue'
import { createPinia, getActivePinia, type Pinia } from 'pinia'
import UpdateNicknameDialog from './UpdateNicknameDialog.vue'

export function openUpdateNicknameDialog(options: {
  pinia?: Pinia
  initialNickname?: string
  onUpdated?: (nickname: string) => void
}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const pinia = options.pinia || getActivePinia() || createPinia()

  const app = createApp({
    render() {
      return h(UpdateNicknameDialog, {
        initialNickname: options.initialNickname || '',
        onClose: () => {
          app.unmount()
          host.remove()
        },
        onUpdated: (nickname: string) => {
          options.onUpdated?.(nickname)
          app.unmount()
          host.remove()
        },
      })
    },
  })

  app.use(pinia)
  app.mount(host)
}
