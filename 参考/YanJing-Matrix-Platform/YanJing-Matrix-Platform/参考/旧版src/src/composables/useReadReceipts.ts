import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { debounce } from 'lodash'
import { matrixClientV2 } from '@/services/matrix/client'
import { matrixEventManager } from '@/services/matrix/eventManager'

/**
 * useReadReceipts - composable to auto-send read receipts and set read markers
 * @param containerRef - messages container DOM ref
 * @param messagesRef - reactive array of messages (flat list, not grouped)
 * @param roomIdRef - room id ref
 * @param opts - options
 */
export function useReadReceipts(
  containerRef: Ref<HTMLElement | null>,
  messagesRef: Ref<any[]>,
  roomIdRef: Ref<string | undefined | null>,
  opts: { sendReadReceiptOnLoad?: boolean; manageReadMarkers?: boolean; manageReadReceipts?: boolean } = {}
) {
  const { sendReadReceiptOnLoad = true, manageReadMarkers = true, manageReadReceipts = true } = opts

  // keep last sent read receipt event id to avoid duplicate sends
  const lastRRSentEventId = ref<string | null>(null)

  function getLastVisibleEventId(): string | null {
    const container = containerRef.value
    if (!container) return null
    const children = Array.from(container.querySelectorAll('[data-event-id]')) as HTMLElement[]
    if (!children.length) return null
    const containerRect = container.getBoundingClientRect()
    // find last node whose bottom <= container bottom
    for (let i = children.length - 1; i >= 0; i--) {
      const node = children[i]
      const rect = node.getBoundingClientRect()
      // Compare relative to container
      if (rect.bottom <= containerRect.bottom + 2) {
        return node.dataset.eventId || null
      }
    }
    return null
  }

  function indexForEventId(evId?: string | null): number | null {
    if (!evId) return null
    const idx = messagesRef.value.findIndex((m: any) => m.eventId === evId)
    return idx >= 0 ? idx : null
  }

  async function getCurrentReadReceipt(roomId: string): Promise<string | null> {
    try {
      const client = matrixClientV2.getAuthedClient()
      if (!client) return null
      const myUserId = client.getSafeUserId()
      const room = client.getRoom(roomId)
      if (!room) return null
      const rr = room.getEventReadUpTo(myUserId)
      return rr ?? null
    } catch (e) {
      return null
    }
  }

  const SCROLL_BOTTOM_THRESHOLD = 20

  function isAtBottom(): boolean {
    const container = containerRef.value
    if (!container) return false
    const bottomGap = container.scrollHeight - (container.scrollTop + container.clientHeight)
    return bottomGap <= SCROLL_BOTTOM_THRESHOLD
  }

  // NOTE: Future extension - find last visible event index with heuristics
  // For now use getLastVisibleEventId() + indexForEventId()

  function shouldSendReadReceipt(currentReadReceiptEventId: string | null, lastReadEventId: string | null): boolean {
    if (!lastReadEventId) return false
  if (lastRRSentEventId.value === lastReadEventId) return false
    if (currentReadReceiptEventId === lastReadEventId) return false
    const idxCurrent = indexForEventId(currentReadReceiptEventId)
    const idxLast = indexForEventId(lastReadEventId)
    if (idxLast === null) return false
    if (idxCurrent === null) return true
    return idxLast > idxCurrent
  }

  const sendReadReceipts = async (roomId?: string, lastEventId?: string) => {
    if (!roomId) return
    if (!manageReadReceipts) return
    try {
      // Attempt to send mark as read via eventManager which will both send RR and RM
      await matrixEventManager.markAsRead(roomId, lastEventId)
  lastRRSentEventId.value = lastEventId ?? lastRRSentEventId.value
    } catch (e) {
      console.warn('[useReadReceipts] sendReadReceipts error', e)
    }
  }

  const debouncedCheck = debounce(async () => {
    const roomId = roomIdRef.value
    if (!roomId) return
    if (!containerRef.value) return
    if (!isAtBottom()) return

    const lastEventId = getLastVisibleEventId()
    if (!lastEventId) return

    const currentRR = await getCurrentReadReceipt(roomId)
    if (shouldSendReadReceipt(currentRR, lastEventId)) {
      await sendReadReceipts(roomId, lastEventId)
    }
  }, 250)

  const onScroll = () => {
    if (!manageReadMarkers && !manageReadReceipts) return
    debouncedCheck()
  }

  // Watch messages changes and if at bottom then mark as read
  const unwatchMessages = watch(
    () => messagesRef.value.length,
    async () => {
      // After messages changed, if container is at bottom, mark read
      if (!roomIdRef.value) return
      if (isAtBottom()) {
        const lastEventId = getLastVisibleEventId()
        await sendReadReceipts(roomIdRef.value, lastEventId ?? undefined)
      }
    }
  )

  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', onScroll)
    }
    if (sendReadReceiptOnLoad && roomIdRef.value) {
      // If we are on the live timeline and at bottom on load, send receipts for last
      const lastEventId = getLastVisibleEventId()
      if (lastEventId) sendReadReceipts(roomIdRef.value, lastEventId)
    }
  })

  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', onScroll)
    }
    debouncedCheck.cancel()
    unwatchMessages()
  })

  return {
    sendReadReceipts,
    getLastVisibleEventId,
    isAtBottom
  }
}
