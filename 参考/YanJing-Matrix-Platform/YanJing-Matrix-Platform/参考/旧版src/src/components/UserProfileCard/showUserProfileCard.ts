import { createApp, h } from 'vue'
import UserProfileCard from './UserProfileCardClean.vue'

let app: ReturnType<typeof createApp> | null = null
let rootEl: HTMLElement | null = null

// 可选的“快速对话”处理器（由外部注册）
let quickChatHandler: ((userId: string, nickname?: string) => void) | null = null

// 供外部注册快速对话处理函数（避免入口依赖主页面，实现解耦）
export function setUserProfileCardQuickChatHandler(handler: (userId: string, nickname?: string) => void) {
  quickChatHandler = handler
}

export function showUserProfileCard(userId: string) {
  if (app && rootEl) {
    app.unmount()
    app = createApp({
      render: () => h(UserProfileCard, {
        visible: true,
        userId,
        onClose: hideUserProfileCard,
        onQuickChat: (uid: string, nickname?: string) => {
          try {
            if (quickChatHandler) {
              quickChatHandler(uid, nickname)
            } else {
              console.log('[UserProfileCard] quickChat (no handler):', uid, nickname)
            }
          } catch (e) {
            console.warn('[UserProfileCard] quickChat handler error:', e)
          }
        },
      }),
    })
    app.mount(rootEl)
    return
  }

  rootEl = document.createElement('div')
  document.body.appendChild(rootEl)
  app = createApp({
    render: () => h(UserProfileCard, {
      visible: true,
      userId,
      onClose: hideUserProfileCard,
      onQuickChat: (uid: string, nickname?: string) => {
        try {
          if (quickChatHandler) {
            quickChatHandler(uid, nickname)
          } else {
            console.log('[UserProfileCard] quickChat (no handler):', uid, nickname)
          }
        } catch (e) {
          console.warn('[UserProfileCard] quickChat handler error:', e)
        }
      },
    }),
  })
  app.mount(rootEl)
}

export function hideUserProfileCard() {
  if (app && rootEl) {
    app.unmount()
    rootEl.remove()
  }
  app = null
  rootEl = null
}
