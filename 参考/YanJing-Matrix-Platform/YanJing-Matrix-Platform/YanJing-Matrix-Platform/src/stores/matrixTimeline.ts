import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MatrixTimelineItem } from '@/types/timeline'

export const useMatrixTimelineStore = defineStore('matrixTimeline', () => {
  /** 房间 -> 时间线条目列表（包含消息与系统提示） */
  const itemsByRoomId = ref<Record<string, MatrixTimelineItem[]>>({})
  /** 房间 -> 未读数量（基于每条消息 isUnread 计算） */
  const unreadCountByRoomId = ref<Record<string, number>>({})
  /** 房间 -> 列表预览文本（通常取最新一条消息） */
  const previewByRoomId = ref<Record<string, string>>({})
  /** 房间 -> 历史加载中状态 */
  const loadingByRoomId = ref<Record<string, boolean>>({})

  /** 获取某房间的时间线条目 */
  const getRoomItems = (roomId: string): MatrixTimelineItem[] => {
    return itemsByRoomId.value[roomId] ?? []
  }

  /** 设置房间历史加载状态 */
  const setLoading = (roomId: string, loading: boolean) => {
    loadingByRoomId.value[roomId] = loading
  }

  /** 覆盖写入房间时间线 */
  const setRoomItems = (roomId: string, items: MatrixTimelineItem[]) => {
    itemsByRoomId.value[roomId] = items
  }

  /** 在房间时间线头部插入历史消息 */
  const prependRoomItems = (roomId: string, items: MatrixTimelineItem[]) => {
    if (items.length === 0) return
    const existing = getRoomItems(roomId)
    itemsByRoomId.value[roomId] = [...items, ...existing]
  }

  /** 插入或更新单条消息/系统提示 */
  const upsertRoomItem = (roomId: string, item: MatrixTimelineItem) => {
    const list = getRoomItems(roomId)
    const index = list.findIndex((it) => it.eventId === item.eventId)
    if (index >= 0) {
      list.splice(index, 1, { ...list[index], ...item })
    } else {
      list.push(item)
    }
    list.sort((a, b) => a.timestamp - b.timestamp)
    itemsByRoomId.value[roomId] = list
  }

  /** 删除单条消息/系统提示 */
  const removeRoomItem = (roomId: string, eventId: string) => {
    const list = getRoomItems(roomId)
    itemsByRoomId.value[roomId] = list.filter((it) => it.eventId !== eventId)
  }

  /** 设置房间列表预览文本 */
  const setRoomPreview = (roomId: string, preview: string) => {
    previewByRoomId.value[roomId] = preview
  }

  /** 重新计算某房间未读数量（以 isUnread 为准） */
  const recalcUnreadCount = (roomId: string) => {
    const list = getRoomItems(roomId)
    unreadCountByRoomId.value[roomId] = list.filter((it) => it.isUnread).length
  }

  /** 直接写入未读数量（用于快速清零） */
  const setRoomUnreadCount = (roomId: string, count: number) => {
    unreadCountByRoomId.value[roomId] = count
  }

  /**
   * 将单条消息标记为已读。
   * 输入：roomId、eventId。
   * 输出：void。
   * 逻辑：更新对应条目的 isUnread 并重算未读数量。
   */
  const markItemRead = (roomId: string, eventId: string) => {
    const list = getRoomItems(roomId)
    const index = list.findIndex((it) => it.eventId === eventId)
    if (index < 0) return
    if (!list[index]?.isUnread) return
    const next = [...list]
    const current = next[index] as MatrixTimelineItem
    next.splice(index, 1, { ...current, isUnread: false })
    itemsByRoomId.value[roomId] = next
    recalcUnreadCount(roomId)
  }

  /** 清理房间所有缓存 */
  const clearRoom = (roomId: string) => {
    delete itemsByRoomId.value[roomId]
    delete unreadCountByRoomId.value[roomId]
    delete previewByRoomId.value[roomId]
    delete loadingByRoomId.value[roomId]
  }

  return {
    itemsByRoomId,
    unreadCountByRoomId,
    previewByRoomId,
    loadingByRoomId,
    getRoomItems,
    setLoading,
    setRoomItems,
    prependRoomItems,
    upsertRoomItem,
    removeRoomItem,
    setRoomPreview,
    recalcUnreadCount,
    setRoomUnreadCount,
    markItemRead,
    clearRoom,
  }
})
