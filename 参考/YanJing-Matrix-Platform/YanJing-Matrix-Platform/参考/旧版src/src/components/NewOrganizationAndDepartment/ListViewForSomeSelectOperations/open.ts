import { createApp, h } from 'vue'
import { createPinia, getActivePinia, type Pinia } from 'pinia'
import DeptSelector from './index.vue'
import type { OrgNode } from '@/types/organization'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

interface DeptSelectorOptions {
  appId: string
  title?: string
  onSelect?: (item: OrgNode) => void
  onClose?: () => void
  pinia?: Pinia
}

export function openDeptSelector(options: DeptSelectorOptions) {
  // 如果已经存在，先关闭旧的
  if (rootEl) {
    closeDeptSelector()
  }

  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  app = createApp({
    render() {
      return h(DeptSelector, {
        appId: options.appId,
        title: options.title,
        onSelect: (item: OrgNode) => {
          if (options.onSelect) options.onSelect(item)
          // 选择后通常会自动关闭，由组件内部调用 onClose，或者在这里显式关闭
          // 这里组件内部调用了 handleClose，会触发下面的 onClose
        },
        onClose: () => {
          if (options.onClose) options.onClose()
          closeDeptSelector()
        }
      })
    }
  })

  // 尝试复用传入的 Pinia，或者当前的 Pinia 实例，以共享 Store 状态
  const pinia = options.pinia || getActivePinia() || createPinia()
  app.use(pinia)
  
  app.mount(rootEl)
}

export function closeDeptSelector() {
  if (app) {
    app.unmount()
    app = null
  }
  if (rootEl) {
    document.body.removeChild(rootEl)
    rootEl = null
  }
}

/**
 * 以 Promise 方式调用部门选择器，支持 await 等待结果
 * @param options 配置项（不需要传入 onSelect 和 onClose）
 * @returns Promise<OrgNode | null> 选中的部门节点，如果用户取消或关闭则返回 null
 */
export function selectDepartment(options: Omit<DeptSelectorOptions, 'onSelect' | 'onClose'>): Promise<OrgNode | null> {
  return new Promise((resolve) => {
    openDeptSelector({
      ...options,
      onSelect: (item) => {
        resolve(item)
      },
      onClose: () => {
        resolve(null)
      }
    })
  })
}
