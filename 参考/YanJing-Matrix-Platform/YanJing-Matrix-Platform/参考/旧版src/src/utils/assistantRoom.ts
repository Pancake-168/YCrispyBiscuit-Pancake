import { userInfoManager } from './userInfo'

const ASSISTANT_ROOM_FIELD = 'ASSISTANT_ROOM_ID'

export const getAssistantRoomIdFromProfile = (): string | null => {
  const value = userInfoManager.getPersonalInfo(ASSISTANT_ROOM_FIELD)
  if (typeof value === 'string' && value.trim()) {
    return value
  }
  return null
}

export const setAssistantRoomIdToProfile = (roomId: string | null): void => {
  if (!roomId) {
    userInfoManager.addField(ASSISTANT_ROOM_FIELD, null)
    return
  }
  userInfoManager.addField(ASSISTANT_ROOM_FIELD, roomId)
}
