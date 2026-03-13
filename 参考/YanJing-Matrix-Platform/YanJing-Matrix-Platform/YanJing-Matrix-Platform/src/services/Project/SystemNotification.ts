import router from '@/router'
import { matrixClient } from '@/services/Matrix/client'
import { matrixEventManager } from '@/services/Matrix/eventManager'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { useRoomDisplayStore } from '@/stores/RoomDisplay'
import { useSystemStore } from '@/stores/System'
import { MatrixEventType, type MessageEventPayload } from '@/types/eventManager'
import type { UserConfig } from '@/types/UserConfig'
import { SystemStorageManager } from '@/utils/SystemStorage'
import { watch } from 'vue'

type NotificationChannelPayload = {
  eventId: string
  roomId: string
  title: string
  body: string
}

const DEFAULT_NOTIFICATION_SOUND_URL = '/sounds/notification.mp3'
const NOTIFICATION_SOUND_THROTTLE_MS = 1500
const NOTIFICATION_SOUND_MAX_PLAY_MS = 2000

class SystemNotificationService {
  private initialized = false
  private bootstrapped = false
  private permissionRequest: Promise<NotificationPermission> | null = null
  private notifiedEventIds = new Set<string>()
  private currentAudio: HTMLAudioElement | null = null
  private currentAudioStopTimer: number | null = null
  private lastSoundStartedAt = 0
  private readonly handleAppActivated = () => {
    void this.syncActiveRoomUnread()
  }

  init(): void {
    if (this.initialized) return
    this.initialized = true

    matrixEventManager.on(MatrixEventType.MESSAGE_RECEIVED, this.handleMessageReceived)
    matrixEventManager.on(MatrixEventType.READ_RECEIPT, this.handleReadReceipt)

    this.bootstrapNotificationBaseline()

    const systemStore = useSystemStore()
    watch(
      () => systemStore.currentSystemRoomId,
      (roomId) => {
        if (!roomId) return
        void this.syncRoomUnread(roomId)
      },
      { immediate: true },
    )

    if (window.electronAPI) {
      window.addEventListener('focus', this.handleAppActivated)
      document.addEventListener('visibilitychange', this.handleAppActivated)
      window.addEventListener('pageshow', this.handleAppActivated)
      void this.syncActiveRoomUnread()
    }

    if (window.electronAPI?.onSystemNotificationNavigate) {
      window.electronAPI.onSystemNotificationNavigate((roomId: string) => {
        void this.navigateToRoom(roomId)
      })
    }
  }

  private handleMessageReceived = (payload: MessageEventPayload) => {
    const next = this.buildPayload(payload)
    if (!next) return
    if (!this.shouldNotify(payload, next.roomId, next.eventId)) return

    this.notifiedEventIds.add(next.eventId)
    this.compactNotifiedEventIds()

    if (window.electronAPI) {
      void this.showElectronNotification(next)
      return
    }

    void this.showWebNotification(next)
  }

  private handleReadReceipt = (payload: { room: { roomId: string }; event: { getContent?: () => unknown } }) => {
    if (!window.electronAPI) return
    const roomId = payload.room?.roomId || ''
    if (!roomId) return

    const client = matrixClient.getAuthedClient()
    const currentUserId = client?.getUserId?.() || ''
    if (!currentUserId) return

    const content = payload.event.getContent?.() as Record<string, Record<string, Record<string, unknown>>> | undefined
    if (!content) return

    for (const receiptByType of Object.values(content)) {
      if (!receiptByType || typeof receiptByType !== 'object') continue
      for (const receiptUsers of Object.values(receiptByType)) {
        if (!receiptUsers || typeof receiptUsers !== 'object') continue
        if (currentUserId in receiptUsers) {
          void window.electronAPI.clearRoomUnread(roomId)
          return
        }
      }
    }
  }

  private buildPayload(payload: MessageEventPayload): NotificationChannelPayload | null {
    const event = payload.event
    const room = payload.room
    const roomId = room?.roomId || ''
    const eventId = event?.getId?.() || ''
    if (!roomId || !eventId) return null

    const senderId = event.getSender?.() || ''
    const senderName = room.getMember?.(senderId)?.name?.trim() || this.formatSenderId(senderId)
    const roomDisplayStore = useRoomDisplayStore()
    const roomName = roomDisplayStore.getRoomDisplayName(roomId, [MatrixClientRoom.getRoomName(room)]).trim()
    const body = this.formatNotificationBody(event.getContent?.() as Record<string, unknown> | undefined)
    const title = roomName && senderName && roomName !== senderName
      ? `${senderName} · ${roomName}`
      : roomName || senderName || '新消息'

    return {
      eventId,
      roomId,
      title,
      body,
    }
  }

  private shouldNotify(payload: MessageEventPayload, roomId: string, eventId: string): boolean {
    if (!this.bootstrapped) return false
    if (this.notifiedEventIds.has(eventId)) return false

    const client = matrixClient.getAuthedClient()
    const currentUserId = client?.getUserId?.() || ''
    const senderId = payload.event.getSender?.() || ''
    if (!senderId || senderId === currentUserId) return false

    const systemStore = useSystemStore()
    const roomType = systemStore.getRoomTypeById(roomId)
    const currentFunction = systemStore.currentFunction
    const currentRoomId = systemStore.currentSystemRoomId
    const isActiveRoom = roomId === currentRoomId
      && ((roomType === 'bot' && currentFunction === 'Mission') || (roomType !== 'bot' && currentFunction === 'Message'))
    const appFocused = document.visibilityState === 'visible' && document.hasFocus()

    if (appFocused) {
      return false
    }

    if (isActiveRoom && appFocused) {
      return false
    }

    return true
  }

  private async showWebNotification(payload: NotificationChannelPayload): Promise<void> {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return

    void this.playNotificationSound()

    const permission = await this.ensureBrowserPermission()
    if (permission !== 'granted') return

    const notification = new Notification(payload.title, {
      body: payload.body,
      tag: payload.eventId,
      icon: '/icon.png',
    })

    notification.onclick = () => {
      window.focus()
      void this.navigateToRoom(payload.roomId)
      notification.close()
    }
  }

  private async showElectronNotification(payload: NotificationChannelPayload): Promise<void> {
    void this.playNotificationSound()

    await window.electronAPI.showSystemNotification({
      title: payload.title,
      body: payload.body,
      roomId: payload.roomId,
    })
  }

  private async ensureBrowserPermission(): Promise<NotificationPermission> {
    if (Notification.permission !== 'default') {
      return Notification.permission
    }

    if (!this.permissionRequest) {
      this.permissionRequest = Notification.requestPermission().finally(() => {
        this.permissionRequest = null
      })
    }

    return this.permissionRequest
  }

  private async navigateToRoom(roomId: string): Promise<void> {
    if (!roomId) return

    const systemStore = useSystemStore()
    const roomType = systemStore.getRoomTypeById(roomId)
    const targetFunction = roomType === 'bot' ? 'Mission' : 'Message'

    if (router.currentRoute.value.path !== '/chat') {
      await router.push('/chat')
    }

    await systemStore.setCurrentFunction(targetFunction)
    systemStore.setCurrentSystemRoomId(roomId)
    await this.syncRoomUnread(roomId)
  }

  private isAppInteractive(): boolean {
    if (typeof document === 'undefined') return false
    return document.visibilityState === 'visible' && document.hasFocus()
  }

  private async syncActiveRoomUnread(): Promise<void> {
    const systemStore = useSystemStore()
    await this.syncRoomUnread(systemStore.currentSystemRoomId)
  }

  private async syncRoomUnread(roomId: string): Promise<void> {
    if (!window.electronAPI || !roomId) return
    if (!this.isAppInteractive()) return
    await window.electronAPI.clearRoomUnread(roomId)
  }

  private bootstrapNotificationBaseline(): void {
    const client = matrixClient.getAuthedClient()
    const syncState = client?.getSyncState?.() || null
    const hasRooms = (client?.getRooms?.().length || 0) > 0

    if (syncState === 'PREPARED' || (syncState === 'SYNCING' && hasRooms)) {
      this.markBootstrapReady()
      return
    }

    matrixEventManager.once(MatrixEventType.SYNC_COMPLETED, () => {
      this.markBootstrapReady()
    })
  }

  private markBootstrapReady(): void {
    this.seedCurrentTimelineEventIds()
    this.bootstrapped = true
  }

  private seedCurrentTimelineEventIds(): void {
    const client = matrixClient.getAuthedClient()
    const rooms = client?.getRooms?.() || []

    for (const room of rooms) {
      const events = room.getLiveTimeline?.().getEvents?.() || []

      for (let index = events.length - 1; index >= 0; index -= 1) {
        const event = events[index]
        const eventId = event?.getId?.() || ''
        const eventType = event?.getType?.() || ''

        if (!eventId) continue
        if (eventType !== 'm.room.message' && eventType !== 'm.room.redaction') continue

        this.notifiedEventIds.add(eventId)
        break
      }
    }

    this.compactNotifiedEventIds()
  }

  private formatNotificationBody(content?: Record<string, unknown>): string {
    const msgtype = typeof content?.msgtype === 'string' ? content.msgtype : 'm.text'
    const body = typeof content?.body === 'string' ? content.body.trim() : ''

    if (msgtype === 'm.image') return body ? `[图片] ${body}` : '[图片]'
    if (msgtype === 'm.file') return body ? `[文件] ${body}` : '[文件]'
    if (msgtype === 'm.audio') return body ? `[语音] ${body}` : '[语音]'
    if (msgtype === 'm.video') return body ? `[视频] ${body}` : '[视频]'

    if (!body) return '收到一条新消息'
    return body.length > 120 ? `${body.slice(0, 117)}...` : body
  }

  private formatSenderId(senderId: string): string {
    return senderId.replace(/^@/, '').split(':')[0] || '新消息'
  }

  private compactNotifiedEventIds(): void {
    if (this.notifiedEventIds.size <= 200) return
    const nextIds = Array.from(this.notifiedEventIds).slice(-120)
    this.notifiedEventIds = new Set(nextIds)
  }

  private async playNotificationSound(): Promise<void> {
    const soundConfig = await this.getNotificationSoundConfig()
    if (!soundConfig.enabled) return
    if (!soundConfig.url) return

    const now = Date.now()
    if (now - this.lastSoundStartedAt < NOTIFICATION_SOUND_THROTTLE_MS) {
      return
    }

    this.stopCurrentAudio()
    const started = await this.tryPlayCustomSound(soundConfig.url)
    if (started) {
      this.lastSoundStartedAt = now
    }
  }

  private async getNotificationSoundConfig(): Promise<{ enabled: boolean; url: string }> {
    const config = await SystemStorageManager.getUserConfig<UserConfig>()
    const enabled = config?.notificationSoundEnabled !== false
    const url = this.normalizeNotificationSoundUrl()
    return { enabled, url }
  }

  private normalizeNotificationSoundUrl(): string {
    return DEFAULT_NOTIFICATION_SOUND_URL
  }

  private async tryPlayCustomSound(source: string): Promise<boolean> {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return false

    try {
      const audio = new Audio(source)
      audio.preload = 'auto'
      audio.volume = 0.9
      audio.currentTime = 0

      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.clearCurrentAudioStopTimer()
          this.currentAudio = null
        }
      }

      this.currentAudio = audio

      await audio.play()
      this.currentAudioStopTimer = window.setTimeout(() => {
        if (this.currentAudio !== audio) return
        this.stopCurrentAudio()
      }, NOTIFICATION_SOUND_MAX_PLAY_MS)

      return true
    } catch {
      if (this.currentAudio?.src === new URL(source, window.location.href).href) {
        this.currentAudio = null
      }
      this.clearCurrentAudioStopTimer()
      return false
    }
  }

  private stopCurrentAudio(): void {
    this.clearCurrentAudioStopTimer()

    if (!this.currentAudio) return

    try {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
    } catch {
      // ignore
    }

    this.currentAudio = null
  }

  private clearCurrentAudioStopTimer(): void {
    if (this.currentAudioStopTimer === null) return

    window.clearTimeout(this.currentAudioStopTimer)
    this.currentAudioStopTimer = null
  }

}

export const systemNotificationService = new SystemNotificationService()