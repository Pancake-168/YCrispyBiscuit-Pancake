import { createApp, h } from 'vue'
import TheBestSearch from './index.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

export function openTheBestSearch() {
  if (rootEl) return // 已打开
  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)
  app = createApp({
    render: () => h(TheBestSearch, { onClose: closeTheBestSearch }),
  })
  app.mount(rootEl)
}

export function closeTheBestSearch() {
  if (app && rootEl) {
    app.unmount()
    rootEl.remove()
  }
  app = null
  rootEl = null
}
