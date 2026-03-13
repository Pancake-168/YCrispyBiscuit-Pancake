<template>
    <div class="room-list">
        <div v-for="entry in entries" :key="entry.entity.username" class="room-item"
            :class="{ active: entry.primaryRoomId === activeRoomId, invite: entry.room ? MatrixClientRoom.isInviteRoom(entry.room) : false }" type="button"
            @click="handleSelect(entry.primaryRoomId)">
            <div class="avatar">
                <img v-if="entry.primaryRoomId && getDisplayAvatarUrl(entry.primaryRoomId)"
                    :src="getDisplayAvatarUrl(entry.primaryRoomId)" alt="room-avatar" />
                <span v-else class="avatar-text">{{ getDisplayAvatarText(entry.primaryRoomId, entry.entity)
                    }}</span>
            </div>

            <div class="content">
                <div class="top">
                    <span class="name" :title="getDisplayName(entry.primaryRoomId, entry.entity)">{{ getDisplayName(entry.primaryRoomId, entry.entity) }}</span>
                    <span v-if="entry.room && MatrixClientRoom.getDisplayTime(entry.room)" class="time">{{
                        MatrixClientRoom.getDisplayTime(entry.room) }}</span>
                </div>
                <div class="bottom">
                    <span class="preview" :title="entry.room ? MatrixClientRoom.getPreview(entry.room) : ''">{{
                        entry.room ? MatrixClientRoom.getPreview(entry.room) : '' }}</span>
                    <span v-if="entry.room && MatrixClientRoom.getAttentionCount(entry.room) > 0"
                        class="badge"
                        :class="{ 'badge-invite': entry.room && MatrixClientRoom.isInviteRoom(entry.room) && MatrixClientRoom.getUnreadCount(entry.room) === 0 }">
                        {{ entry.room ? MatrixClientRoom.getAttentionLabel(entry.room) : '' }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/System'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { useRoomMapStore } from '@/stores/RoomMap'
import { useRoomDisplayStore } from '@/stores/RoomDisplay'
import type { IDMapUser } from '@/types/IDmap'

const systemStore = useSystemStore()
const roomMapStore = useRoomMapStore()
const roomDisplayStore = useRoomDisplayStore()

const entries = computed(() => {
    const roomsById = new Map(
        (systemStore.SystemRooms ?? []).map((item) => [MatrixClientRoom.getRoomId(item.room), item.room])
    )
    return roomMapStore.list
        .map((entry) => {
            const primaryRoomId = entry.roomIds[0]
            const room = primaryRoomId ? roomsById.get(primaryRoomId) : undefined
            return {
                entity: entry.entity as IDMapUser,
                primaryRoomId,
                room
            }
        })
        .filter((entry) => Boolean(entry.primaryRoomId))
        .sort((a, b) => {
            if (!a.room && !b.room) return 0
            if (!a.room) return 1
            if (!b.room) return -1
            return MatrixClientRoom.compareRoomsForList(a.room, b.room)
        })
})
const activeRoomId = computed(() => systemStore.currentSystemRoomId || undefined)

const getDisplayName = (roomId: string | undefined, entity: IDMapUser) => {
    if (!roomId) {
        return entity.nickname || entity.username || ''
    }

    return roomDisplayStore.getRoomDisplayName(roomId, [entity.nickname, entity.username])
}

const getDisplayAvatarUrl = (roomId: string | undefined) => {
    if (!roomId) return undefined
    return roomDisplayStore.getRoomDisplayAvatarUrl(roomId)
}

const getDisplayAvatarText = (roomId: string | undefined, entity: IDMapUser) => {
    if (!roomId) {
        return (entity.nickname || entity.username || '?').charAt(0).toUpperCase()
    }

    return roomDisplayStore.getRoomDisplayInitial(roomId, [entity.nickname, entity.username])
}

const handleSelect = (roomId?: string) => {
    if (!roomId) return
    systemStore.setCurrentSystemRoomId(roomId)
}
</script>

<style scoped>
.room-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    max-width: none;
    padding: var(--space-xs);
    box-sizing: border-box;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;

}

.room-item {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    gap: var(--space-sm);
    align-items: center;

    padding-top: 0.2rem;
    padding-bottom: 0.2rem;
    padding-left: var(--space-xs);
    padding-right: var(--space-xs);




    backdrop-filter: var(--glass-blur);
    color: var(--text-color);
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
}

.room-item:hover {

    transform: translateY(-1px);
}

.room-item.active {
    background: color-mix(in srgb, var(--primary-color) 12%, var(--glass-bg));
    border-color: color-mix(in srgb, var(--primary-color) 45%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary-color) 25%, transparent), var(--glass-shadow);
}

.room-item.invite:not(.active) {
    background: color-mix(in srgb, var(--warning-color, #f59e0b) 12%, var(--glass-bg));
}

.avatar {
    display: flex;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: color-mix(in srgb, var(--primary-color) 14%, var(--glass-bg));
    color: var(--text-color);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--border-color, rgba(255,255,255,0.12)) 70%, transparent);
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-text {
    font-size: var(--font-sm);
    font-weight: 700;
    color: var(--text-color);
    line-height: 1;
}

.content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    min-width: 0;
}

.name {
    font-weight: 600;
    font-size: var(--font-sm);
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.time {
    font-size: var(--font-xs);
    color: var(--text-muted);
    white-space: nowrap;
}

.bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    min-width: 0;
}

.preview {
    color: var(--text-muted);
    font-size: var(--font-xs);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
}

.badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--danger-color);
    color: #fff;
    font-size: var(--font-xs);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.badge-invite {
    background: var(--warning-color, #f59e0b);
}

@media (max-width: 768px) {
    .room-item {
        grid-template-columns: 2rem minmax(0, 1fr);
        padding: var(--space-sm);
    }
}
</style>
