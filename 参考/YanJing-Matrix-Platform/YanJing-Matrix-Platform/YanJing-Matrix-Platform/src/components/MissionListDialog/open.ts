import { createApp, h } from 'vue'
import { createPinia, type Pinia, getActivePinia } from 'pinia'
import MissionListDialog from './MissionListDialog.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

interface OpenMissionListOptions {
  pinia?: Pinia
  onTalkRequest?: (userid: string, createdRoomId?: string) => void
}

export function openMissionListDialog(options: OpenMissionListOptions = {}) {
  if (rootEl) {
    closeMissionListDialog()
  }

  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  app = createApp({
    render: () =>
      h(MissionListDialog, {
        onClose: closeMissionListDialog,
        onTalkRequestFromOrganizationList: options.onTalkRequest,
      }),
  })

  const pinia = options.pinia || getActivePinia() || createPinia()
  app.use(pinia)
  app.mount(rootEl)
}

export function closeMissionListDialog() {
  if (app && rootEl) {
    app.unmount()
    if (document.body.contains(rootEl)) {
      document.body.removeChild(rootEl)
    }
  }
  app = null
  rootEl = null
}
