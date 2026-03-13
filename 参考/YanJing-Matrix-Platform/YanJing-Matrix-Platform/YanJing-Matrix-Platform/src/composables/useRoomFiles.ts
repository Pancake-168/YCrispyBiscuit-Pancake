import { ref, watch, onMounted, onBeforeUnmount, type Ref } from "vue";
import { matrixMessageService } from "@/services/Matrix/message";
import { matrixEventManager } from "@/services/Matrix/eventManager";
import { matrixTimelineService } from "@/services/Matrix/timeline";
import { MatrixEventType, type MessageEventPayload } from "@/types/eventManager";
import type { MatrixMessageItem } from "@/types/message";

type FileKind = "image" | "video" | "audio" | "file";

export interface RoomFileItem {
  id: string; // Matrix event id（对应 MatrixMessageItem.id）
  kind: FileKind;
  name: string;
  url?: string; // http url (may be undefined for encrypted not yet decryptable)
  mxcUrl?: string;
  encryptionInfo?: unknown; // 加密信息（当前项目默认未加密，但保留字段兼容消息结构）
  size?: number;
  width?: number;
  height?: number;
  duration?: number; // ms
  senderName?: string;
  timestamp: number;
  encrypted: boolean;
  mimetype?: string;
}

function isFileLike(msg: MatrixMessageItem): boolean {
  const t = msg.type;
  return t === "m.file" || t === "m.image" || t === "m.video" || t === "m.audio";
}

function toKind(t?: MatrixMessageItem["type"]): FileKind {
  switch (t) {
    case "m.image":
      return "image";
    case "m.video":
      return "video";
    case "m.audio":
      return "audio";
    default:
      return "file";
  }
}

function mapToItem(msg: MatrixMessageItem): RoomFileItem {
  const parsedSize = msg.fileSize ? Number(msg.fileSize) : undefined;
  const size = Number.isFinite(parsedSize as number) ? parsedSize : undefined;

  return {
    id: msg.id,
    kind: toKind(msg.type),
    name: msg.fileName || msg.content || msg.id,
    url: msg.url,
    mxcUrl: msg.rawMxcUrl,
    size,
    mimetype: msg.mimetype,
    senderName: msg.senderName || msg.senderId,
    timestamp: msg.timestamp,
    encrypted: false,
  }
}

/**
 * 获取房间文件/媒体时间线的组合式逻辑：
 * - 首次拉取：通过 matrixMessageService.getRoomMessages 读取当前房间消息
 * - 分页：通过 matrixTimelineService.loadHistory 触发 scrollback，再次合并
 * - 实时：通过 matrixEventManager.on 订阅 MESSAGE_RECEIVED / MESSAGE_DELETED 做增量更新
 */
export function useRoomFiles(roomIdRef: Ref<string | null>) {
  const files = ref<RoomFileItem[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const initedRoom = ref<string | null>(null);
  const idSet = new Set<string>();

  let subReceive: (() => void) | null = null;
  let subDelete: (() => void) | null = null;

  async function pullFromTimeline(roomId: string) {
    const msgs = matrixMessageService.getRoomMessages(roomId);
    const fileMsgs = msgs.filter(isFileLike);
    // 合并去重
    for (const m of fileMsgs) {
      if (!idSet.has(m.id)) {
        idSet.add(m.id);
        files.value.push(mapToItem(m));
      }
    }
    // 最新在上：按时间戳降序
    files.value.sort((a, b) => b.timestamp - a.timestamp);
  }

  async function refreshInitial() {
    const roomId = roomIdRef.value;
    if (!roomId) return;
    loading.value = true;
    try {
      files.value = [];
      idSet.clear();
      await pullFromTimeline(roomId);
      // 初始无法准确判断是否还有更多，先保守置为 true，后续由 loadMore 结果修正
      hasMore.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function loadMore(limit: number = 30) {
    const roomId = roomIdRef.value;
    if (!roomId) return;
    loading.value = true;
    try {
      const moreItems = await matrixTimelineService.loadHistory(roomId, limit);
      await pullFromTimeline(roomId);
      hasMore.value = moreItems.length > 0;
    } finally {
      loading.value = false;
    }
  }

  function attachSubscriptions(roomId: string) {
    detachSubscriptions();
    subReceive = matrixEventManager.on(MatrixEventType.MESSAGE_RECEIVED, (payload: MessageEventPayload) => {
      try {
        if (!payload?.room || !payload?.event) return;
        if (payload.room.roomId !== roomId) return;

        const eventId = payload.event.getId?.();
        if (!eventId || idSet.has(eventId)) return;

        const msgs = matrixMessageService.getRoomMessages(roomId);
        const msg = msgs.find((item) => item.id === eventId);
        if (!msg || !isFileLike(msg)) return;

        const item = mapToItem(msg);
        idSet.add(item.id);
        files.value.unshift(item);
      } catch (error) {
        console.warn('[System:useRoomFiles:MESSAGE_RECEIVED] 增量处理失败:', error)
      }
    });

    subDelete = matrixEventManager.on(MatrixEventType.MESSAGE_DELETED, (payload: MessageEventPayload) => {
      try {
        if (!payload?.room || payload.room.roomId !== roomId) return;

        const redacts = (payload.event as unknown as { getRedacts?: () => string | null }).getRedacts?.();
        const targetId = redacts || payload.event.getId?.();
        if (!targetId) return;

        const idx = files.value.findIndex((f) => f.id === targetId);
        if (idx >= 0) {
          const fileItem = files.value[idx];
          if (!fileItem) return;
          idSet.delete(fileItem.id);
          files.value.splice(idx, 1);
        }
      } catch (error) {
        console.warn('[System:useRoomFiles:MESSAGE_DELETED] 增量处理失败:', error)
      }
    });
  }

  function detachSubscriptions() {
    if (subReceive) {
      subReceive();
      subReceive = null;
    }
    if (subDelete) {
      subDelete();
      subDelete = null;
    }
  }

  onMounted(() => {
    if (roomIdRef.value) {
      initedRoom.value = roomIdRef.value;
      attachSubscriptions(roomIdRef.value);
      void refreshInitial();
    }
  });

  onBeforeUnmount(() => {
    detachSubscriptions();
  });

  watch(roomIdRef, async (newId) => {
    if (!newId) return;
    if (initedRoom.value !== newId) {
      initedRoom.value = newId;
      attachSubscriptions(newId);
      await refreshInitial();
    }
  });

  return {
    files,
    loading,
    hasMore,
    refreshInitial,
    loadMore,
  };
}

export default useRoomFiles;
