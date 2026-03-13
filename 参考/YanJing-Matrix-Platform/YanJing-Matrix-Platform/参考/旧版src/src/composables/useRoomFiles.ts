import { ref, watch, onMounted, onBeforeUnmount, type Ref } from "vue";
import { messageServiceV2 } from "@/services/matrix/messages";
import { matrixEventManager } from "@/services/matrix/eventManager";
import { MatrixEventType, type MatrixMessage } from "@/types";

type FileKind = "image" | "video" | "audio" | "file";

export interface RoomFileItem {
  id: string; // eventId
  kind: FileKind;
  name: string;
  url?: string; // http url (may be undefined for encrypted not yet decryptable)
  mxcUrl?: string;
  encryptionInfo?: any; // 加密信息（当前项目默认未加密，但保留字段兼容消息结构）
  size?: number;
  width?: number;
  height?: number;
  duration?: number; // ms
  senderName?: string;
  timestamp: number;
  encrypted: boolean;
  mimetype?: string;
}

function isFileLike(msg: MatrixMessage): boolean {
  const t = msg.messageType;
  return t === "m.file" || t === "m.image" || t === "m.video" || t === "m.audio";
}

function toKind(t?: MatrixMessage["messageType"]): FileKind {
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

function mapToItem(msg: MatrixMessage): RoomFileItem {
  const info = msg.messageInfo || {} as any;
  return {
    id: msg.eventId,
    kind: toKind(msg.messageType),
    name: info.filename || msg.content || msg.eventId,
    url: info.url,
    mxcUrl: info.mxcUrl,
    encryptionInfo: info.encryptionInfo,
    size: info.size,
    width: info.width,
    height: info.height,
    duration: info.duration,
    mimetype: info.mimetype,
    senderName: msg.displayName || msg.sender,
    timestamp: msg.timestamp,
    encrypted: !!msg.encrypted,
  };
}

/**
 * 获取房间文件/媒体时间线的组合式逻辑：
 * - 首次拉取：从当前 live timeline 读取（messageServiceV2 内部会尝试解密）
 * - 分页：调用 matrixEventManager.loadMoreHistory 触发 scrollback，再次合并
 * - 实时：订阅 MESSAGE_RECEIVED / MESSAGE_DELETED 做增量更新
 */
export function useRoomFiles(roomIdRef: Ref<string | null>) {
  const files = ref<RoomFileItem[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const initedRoom = ref<string | null>(null);
  const idSet = new Set<string>();

  let subReceive: string | null = null;
  let subDelete: string | null = null;

  async function pullFromTimeline(roomId: string) {
    const msgs = await messageServiceV2.获取房间历史消息(roomId);
    const fileMsgs = msgs.filter(isFileLike);
    // 合并去重
    for (const m of fileMsgs) {
      if (!idSet.has(m.eventId)) {
        idSet.add(m.eventId);
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
      // 初始无法准确判断是否还有更多，这里保守置为 true，交由 loadMore 返回结果更新
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
      const more = await matrixEventManager.loadMoreHistory(roomId, limit);
      await pullFromTimeline(roomId);
      hasMore.value = !!more;
    } finally {
      loading.value = false;
    }
  }

  function attachSubscriptions(roomId: string) {
    detachSubscriptions();
    subReceive = matrixEventManager.subscribe(MatrixEventType.MESSAGE_RECEIVED, (payload: any) => {
      try {
        if (!payload?.content) return;
        const msg: MatrixMessage = payload.content;
        if (msg.roomId !== roomId) return;
        if (!isFileLike(msg)) return;
        if (idSet.has(msg.eventId)) return;
        const item = mapToItem(msg);
        idSet.add(item.id);
        files.value.unshift(item);
      } catch {}
    });

    subDelete = matrixEventManager.subscribe(MatrixEventType.MESSAGE_DELETED, (payload: any) => {
      try {
        if (!payload?.roomId || payload.roomId !== roomId) return;
        const idx = files.value.findIndex(f => f.id === payload.eventId);
        if (idx >= 0) {
          idSet.delete(files.value[idx].id);
          files.value.splice(idx, 1);
        }
      } catch {}
    });
  }

  function detachSubscriptions() {
    if (subReceive) { matrixEventManager.unsubscribe(subReceive); subReceive = null; }
    if (subDelete) { matrixEventManager.unsubscribe(subDelete); subDelete = null; }
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
