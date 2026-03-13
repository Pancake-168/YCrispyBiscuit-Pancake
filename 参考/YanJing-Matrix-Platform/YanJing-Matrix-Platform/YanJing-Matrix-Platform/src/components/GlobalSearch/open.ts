import { createApp, h } from 'vue'
import GlobalSearchDialog from './GlobalSearchDialog.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

/**
 * 打开全局搜索弹窗。
 * 输入：无。
 * 输出：void。
 * 逻辑：单例挂载弹窗，关闭时自动销毁。
 */
export function openTheBestSearch() {
  if (rootEl) return

  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  app = createApp({
    render() {
      return h(GlobalSearchDialog, {
        onClose: closeTheBestSearch,
      })
    },
  })

  app.mount(rootEl)
}

/**
 * 关闭全局搜索弹窗。
 */
export function closeTheBestSearch() {
  if (app && rootEl) {
    app.unmount()
    rootEl.remove()
  }
  app = null
  rootEl = null
}

export const openGlobalSearch = openTheBestSearch
export const closeGlobalSearch = closeTheBestSearch
