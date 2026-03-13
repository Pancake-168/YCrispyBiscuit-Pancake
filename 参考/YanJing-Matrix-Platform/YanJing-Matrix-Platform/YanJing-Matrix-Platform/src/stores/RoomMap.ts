
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { IDMapUser } from '@/types/IDmap'
import type { MatrixRoom } from '@/types/room'
import type { Room } from 'matrix-js-sdk'
import { useSystemStore } from '@/stores/System'
import { useIDmapStore } from '@/stores/IDmap'
import { MatrixClientRoom } from '@/services/Matrix/room'
import { matrixClient } from '@/services/Matrix/client'

export type RoomMapEntry = {
	entity: IDMapUser
	roomIds: string[]
}

const buildEntryKey = (entity: IDMapUser): string => {
	return entity.username
}


export const useRoomMapStore = defineStore('roomMap', () => {
	const mapByEntityKey = ref<Record<string, RoomMapEntry>>({})

	const list = computed(() => Object.values(mapByEntityKey.value))

	function clear() {
		mapByEntityKey.value = {}
	}

	function addRoomForEntity(entity: IDMapUser, roomId: string) {
		const key = buildEntryKey(entity)
		const existing = mapByEntityKey.value[key]
		if (!existing) {
			mapByEntityKey.value[key] = { entity, roomIds: [roomId] }
			return
		}
		if (!existing.roomIds.includes(roomId)) {
			existing.roomIds.push(roomId)
		}
	}

	function getRoomsByEntityKey(key: string): string[] {
		return mapByEntityKey.value[key]?.roomIds ?? []
	}

	function getRoomsByUsername(username: string): string[] {
		if (!username) return []
		return mapByEntityKey.value[username]?.roomIds ?? []
	}

	function updateRoomById(roomId: string): void {
		if (!roomId) return
		const idmapStore = useIDmapStore()
		const client = matrixClient.getAuthedClient()
		const selfUserId = client?.getUserId?.() ?? ''

		const members = MatrixClientRoom.getRoomMembersById(roomId)
		const memberIds = members.map((m) => m.userId).filter(Boolean)
		if (memberIds.length === 0) return

		const otherMemberIds = memberIds.filter((id) => id !== selfUserId)
		if (otherMemberIds.length === 0) return

		const candidates: IDMapUser[] = []
		for (const memberId of otherMemberIds) {
			const entity = idmapStore.getByMatrixId(memberId)
			if (entity) {
				candidates.push(entity)
			}
		}

		if (candidates.length === 0) return

		const isBotRoom = memberIds.length === 2
		const target = isBotRoom
			? (candidates.find((c) => c.type === 'bot') ?? candidates[0])
			: (candidates.find((c) => c.type === 'user') ?? candidates[0])

		if (!target) return

		addRoomForEntity(target, roomId)
		const key = buildEntryKey(target)
		const entry = mapByEntityKey.value[key]
		if (!entry || entry.roomIds.length <= 1) return
		const localClient = matrixClient.getAuthedClient()
		entry.roomIds.sort((a, b) => {
			const roomA = localClient?.getRoom?.(a)
			const roomB = localClient?.getRoom?.(b)
			if (!roomA && !roomB) return 0
			if (!roomA) return 1
			if (!roomB) return -1
			return MatrixClientRoom.compareRoomsForList(roomA, roomB)
		})
	}

	function rebuildFromSystemRooms(): void {
		const systemStore = useSystemStore()
		const idmapStore = useIDmapStore()

		const client = matrixClient.getAuthedClient()
		const selfUserId = client?.getUserId?.() ?? ''

		const nextMap: Record<string, RoomMapEntry> = {}
		const roomsById = new Map<string, MatrixRoom | Room>()

for (const item of systemStore.SystemRooms) {
                    const room = item.room
			const roomId = MatrixClientRoom.getRoomId(room)
			if (!roomId) continue

			if (!roomsById.has(roomId)) {
				roomsById.set(roomId, room)
			}

			const members = MatrixClientRoom.getRoomMembers(room)
			const memberIds = members.map((m) => m.userId).filter(Boolean)

			if (memberIds.length === 0) continue

			const otherMemberIds = memberIds.filter((id) => id !== selfUserId)
			if (otherMemberIds.length === 0) continue

			const candidates: IDMapUser[] = []
			for (const memberId of otherMemberIds) {
				const entity = idmapStore.getByMatrixId(memberId)
				if (entity) {
					candidates.push(entity)
				}
			}

			if (candidates.length === 0) continue

			const isBotRoom = memberIds.length === 2
			const target = isBotRoom
				? (candidates.find((c) => c.type === 'bot') ?? candidates[0])
				: (candidates.find((c) => c.type === 'user') ?? candidates[0])

			if (!target) continue

			const key = buildEntryKey(target)
			const existing = nextMap[key]
			if (!existing) {
				nextMap[key] = { entity: target, roomIds: [roomId] }
			} else if (!existing.roomIds.includes(roomId)) {
				existing.roomIds.push(roomId)
			}
		}

		for (const entry of Object.values(nextMap)) {
			entry.roomIds.sort((a, b) => {
				const roomA = roomsById.get(a)
				const roomB = roomsById.get(b)
				if (!roomA && !roomB) return 0
				if (!roomA) return 1
				if (!roomB) return -1
				return MatrixClientRoom.compareRoomsForList(roomA, roomB)
			})
		}

		mapByEntityKey.value = nextMap
	}

	return {
		mapByEntityKey,
		list,
		clear,
		addRoomForEntity,
		getRoomsByEntityKey,
		getRoomsByUsername,
		updateRoomById,
		rebuildFromSystemRooms
	}
})