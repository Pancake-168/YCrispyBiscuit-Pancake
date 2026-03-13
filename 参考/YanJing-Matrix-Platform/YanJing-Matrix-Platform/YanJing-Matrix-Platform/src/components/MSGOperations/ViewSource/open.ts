import { createApp, h, reactive } from 'vue'
import ViewSourceDialog from './ViewSourceDialog.vue'
import { getEventSource } from '@/services/Matrix/MSGOperations/MsgViewSource'

/**
 * 打开“查看原始消息”弹窗。
 * 输入：roomId、eventId、options（可选标题）。
 * 输出：void。
 * 逻辑：创建临时挂载点，拉取原始事件 JSON 并渲染弹窗。
 */
export function openViewSourceDialog(roomId: string, eventId: string, options?: { title?: string }) {
  if (!roomId || !eventId) return

  const rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  const state = reactive({
    source: '',
    loading: true,
  })

  const app = createApp({
    render() {
      return h(ViewSourceDialog, {
        title: options?.title || '查看原始消息',
        source: state.source,
        loading: state.loading,
        confirmText: '关闭',
        roomId,
        eventId,
        onClose: () => {
          app.unmount()
          rootEl.remove()
        },
      })
    },
  })

  app.mount(rootEl)

  getEventSource(roomId, eventId)
    .then((source) => {
      state.source = source
    })
    .catch((err: unknown) => {
      state.source = String(err || '加载失败')
    })
    .finally(() => {
      state.loading = false
    })
}
