import { createApp, h } from 'vue'
import CreateRoomDialog from './CreateRoomDialog.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

export function openCreateRoomDialog(options?: {
    defaultSpaceRoomId?: string
    onCreated?: (roomId: string) => void
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
            h(CreateRoomDialog, {
                defaultSpaceRoomId: options?.defaultSpaceRoomId,
                onClose,
                onCreated: (roomId: string) => options?.onCreated?.(roomId),
            }),
    })

    app.mount(rootEl)
}
