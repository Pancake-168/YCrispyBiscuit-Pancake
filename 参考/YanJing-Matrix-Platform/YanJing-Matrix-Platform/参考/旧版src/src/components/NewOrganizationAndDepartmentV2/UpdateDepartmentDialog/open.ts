import { createApp, h } from 'vue'
import { createPinia, type Pinia } from 'pinia'
import UpdateDepartmentDialog from './UpdateDepartmentDialog.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

interface UpdateDepartmentOptions {
  appid: string
  departmentId: string
  initialName?: string
  initialDescription?: string
  onUpdated?: (payload: { name: string; description: string }) => void
  pinia?: Pinia
}

export function openUpdateDepartmentDialog(options: UpdateDepartmentOptions) {
  if (rootEl) {
    // 如果已经存在，先关闭旧的
    closeUpdateDepartmentDialog()
  }
  
  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)
  
  app = createApp({
    render: () => h(UpdateDepartmentDialog, {
      appid: options.appid,
      departmentId: options.departmentId,
      initialName: options.initialName,
      initialDescription: options.initialDescription,
      onClose: closeUpdateDepartmentDialog,
      onUpdated: (payload: { name: string; description: string }) => {
        options.onUpdated?.(payload)
      },
    }),
  })
  
  // 如果传入了 pinia 实例，则使用它，否则创建一个新的（独立的）
  if (options.pinia) {
    app.use(options.pinia)
  } else {
    app.use(createPinia())
  }
  
  app.mount(rootEl)
}

export function closeUpdateDepartmentDialog() {
  if (app && rootEl) {
    app.unmount()
    if (document.body.contains(rootEl)) {
      document.body.removeChild(rootEl)
    }
  }
  app = null
  rootEl = null
}
