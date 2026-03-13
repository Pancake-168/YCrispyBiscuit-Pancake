import { createApp, h } from 'vue'
import { createPinia, type Pinia } from 'pinia'
import CreatePostDialog from './CreatePostDialog.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

interface CreatePostOptions {
  parentDepartmentId?: number
  appid: string
  onCreated?: (postName: string) => void
  pinia?: Pinia
}

export function openCreatePostDialog(options: CreatePostOptions) {
  if (rootEl) {
    // 如果已经存在，先关闭旧的
    closeCreatePostDialog()
  }
  
  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)
  
  app = createApp({
    render: () => h(CreatePostDialog, {
      parentDepartmentId: options.parentDepartmentId,
      appid: options.appid,
      onClose: closeCreatePostDialog,
      onCreated: (name: string) => {
        if (options.onCreated) {
          options.onCreated(name)
        }
        // 创建成功后不自动关闭，让用户决定是继续创建还是关闭
        // 或者根据组件内部逻辑处理
      }
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

export function closeCreatePostDialog() {
  if (app && rootEl) {
    app.unmount()
    if (document.body.contains(rootEl)) {
      document.body.removeChild(rootEl)
    }
  }
  app = null
  rootEl = null
}
