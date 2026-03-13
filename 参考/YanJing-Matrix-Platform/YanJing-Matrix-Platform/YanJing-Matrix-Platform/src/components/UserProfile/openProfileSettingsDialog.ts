import { createApp, h } from 'vue'
import ProfileSettingsDialog from './ProfileSettingsDialog.vue'
import type { MatrixMyProfile } from '@/types/profile-management'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

export function openProfileSettingsDialog(options?: {
  onUpdated?: (profile: MatrixMyProfile) => void
}) {
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
      h(ProfileSettingsDialog, {
        onClose,
        onUpdated: (profile: MatrixMyProfile) => options?.onUpdated?.(profile),
      }),
  })

  app.mount(rootEl)
}
