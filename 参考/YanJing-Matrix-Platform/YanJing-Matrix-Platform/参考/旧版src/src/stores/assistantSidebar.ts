import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useTaskStore } from './task'
import { userInfoManager } from '@/utils/userInfo'
import { addPrefixSuffix, removePrefixSuffix } from '@/utils/stringUtils'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'

export type AssistantSidebarPanel =
  | 'systemList1'
  | 'systemList2'
  | 'systemList3'
  | 'systemList4'
export type AssistantSidebarMode = 'auto' | AssistantSidebarPanel

export const useAssistantSidebarStore = defineStore('assistantSidebar', () => {
  const assistantRoomId = ref<string | null>(null)
  const isAssistantRoomActive = ref(false)
  // 额外识别出的 bot 房间（不在任务列表且非个人助手房间）
  const noTaskButUserBotRoomIds = ref<string[]>([])
  // 其它领域 bot 两人房（排除个人专属 userbot），扩展助手域
  const justThirdAgentRoomIds = ref<string[]>([])

  const assistantUnread = ref(0)
  const otherRoomsUnread = ref(0)

  const manualMode = ref<AssistantSidebarMode>('auto')
  const focusModeActive = ref(false)
  const focusModeManualBackup = ref<AssistantSidebarMode>('auto')
  const selectedMissionId = ref<string | null>(null)
  const selectedResourceId = ref<string | null>(null)

  const currentPanel = computed<AssistantSidebarPanel>(() => {
    if (manualMode.value !== 'auto') {
      return manualMode.value
    }
    return isAssistantRoomActive.value ? 'systemList2' : 'systemList1'
  })

  const showAssistantToggle = computed(() => isAssistantRoomActive.value && !focusModeActive.value)
  const canSwitchPanels = computed(() => !focusModeActive.value)
  
  // 从 taskStore 获取任务列表，并并入“非任务但含专属bot的两人房”作为虚拟任务
  const missions = computed(() => {
    const taskStore = useTaskStore()
    const baseList = taskStore.taskList || []

    // 已存在的任务房间ID集合（避免重复）
    const existingRoomIds = new Set<string>(
      baseList.map((t: any) => t?.room_id).filter(Boolean)
    )

    // 计算当前用户 from/to 账号
    const username = userInfoManager.getLoginField('username') || ''
    const selfCanonical = addPrefixSuffix(
      removePrefixSuffix(username, '@', MATRIX_SERVER_URL_TAIL),
      '@',
      MATRIX_SERVER_URL_TAIL
    )
    const toAccountRaw = `${removePrefixSuffix(username, '@', MATRIX_SERVER_URL_TAIL)}userbot`

    // 为每个补漏房间生成一个“虚拟任务”对象（最小必要字段）
    const virtualTasks = (noTaskButUserBotRoomIds.value || [])
      .filter((roomId) => roomId && !existingRoomIds.has(roomId))
      .map((roomId) => ({
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        from_account: selfCanonical,
        room_id: roomId,
        application_id: '',
        to_account: toAccountRaw,
        stateData: {
          task: {
            title: '个人助手',
            topic: ''
          },
          // 与现有前端使用保持兼容
          type: 'deerflow'
        },
        session_id: '',
        other: {},
        agent_id: 0,
        id: `virtual-${roomId}`,
        createdById: 0,
        updatedById: 0
      }))

    return [...baseList, ...virtualTasks]
  })
  
  const currentMission = computed(() => {
    if (!selectedMissionId.value) {
      return null
    }
    // 使用 room_id 查找任务
    return missions.value.find(task => task.room_id === selectedMissionId.value) ?? null
  })
  
  const currentResources = computed(() => {
    // 暂时返回空数组，资源功能待后续实现
    return []
  })
  
  const currentResource = computed(() => {
    // 暂时返回 null，资源功能待后续实现
    return null
  })

  const setAssistantRoomId = (roomId: string | null) => {
    assistantRoomId.value = roomId
  }

  const setNoTaskButUserBotRoomIds = (ids: string[]) => {
    try {
      const unique = Array.from(new Set((ids || []).filter(Boolean)))
      noTaskButUserBotRoomIds.value = unique
    } catch {
      noTaskButUserBotRoomIds.value = []
    }
  }

  const setJustThirdAgentRoomIds = (ids: string[]) => {
    try {
      const unique = Array.from(new Set((ids || []).filter(Boolean)))
      justThirdAgentRoomIds.value = unique
    } catch {
      justThirdAgentRoomIds.value = []
    }
  }

  const setAssistantActive = (active: boolean) => {
   
    
    isAssistantRoomActive.value = active
    if (!active) {
     
      focusModeActive.value = false
      manualMode.value = 'auto'
      selectedMissionId.value = null
      selectedResourceId.value = null
    }
    
   
  }

  const setManualMode = (mode: AssistantSidebarMode) => {
    if (focusModeActive.value) {
      return
    }
    manualMode.value = mode
    if (mode === 'systemList1' || mode === 'auto') {
      selectedMissionId.value = null
      selectedResourceId.value = null
    }
    if (mode === 'systemList2') {
      selectedResourceId.value = null
    }
  }

  const togglePanel = () => {
    if (!showAssistantToggle.value || focusModeActive.value) {
      return
    }
    if (currentPanel.value === 'systemList1') {
      manualMode.value = 'systemList2'
      selectedResourceId.value = null
    } else if (currentPanel.value === 'systemList2') {
      manualMode.value = 'systemList1'
      selectedMissionId.value = null
      selectedResourceId.value = null
    } else {
      manualMode.value = 'systemList2'
      selectedResourceId.value = null
    }
  }

  const resetPanelForAssistantRoom = () => {
    if (manualMode.value === 'auto') {
      return
    }
    manualMode.value = 'systemList2'
    selectedResourceId.value = null
  }

  const setAssistantUnread = (count: number) => {
    assistantUnread.value = Math.max(0, count || 0)
  }

  const setOtherRoomsUnread = (count: number) => {
    otherRoomsUnread.value = Math.max(0, count || 0)
  }

  const getBadgeText = (count: number) => {
    if (!count) return ''
    return count > 99 ? '99+' : String(count)
  }

  const assistantBadge = computed(() => getBadgeText(assistantUnread.value))
  const otherRoomsBadge = computed(() => getBadgeText(otherRoomsUnread.value))

  const switchToPanel = (panel: AssistantSidebarPanel) => {
    if (focusModeActive.value) {
      if (panel === 'systemList1') {
        return
      }
      manualMode.value = panel === 'systemList2' ? 'systemList3' : panel
    } else {
      manualMode.value = panel
    }
    if (panel === 'systemList2') {
      selectedResourceId.value = null
    }
    if (panel === 'systemList1') {
      selectedMissionId.value = null
      selectedResourceId.value = null
    }
  }

  const enableAutoMode = () => {
    if (focusModeActive.value) {
      return
    }
    manualMode.value = 'auto'
    selectedMissionId.value = null
    selectedResourceId.value = null
  }

  const enterFocusMode = () => {
    if (focusModeActive.value) {
      return
    }
    focusModeManualBackup.value = manualMode.value
    focusModeActive.value = true
    if (!selectedMissionId.value && missions.value.length > 0) {
      selectedMissionId.value = missions.value[0].room_id
    }
    selectedResourceId.value = null
    manualMode.value = 'systemList3'
  }

  const exitFocusMode = () => {
    if (!focusModeActive.value) {
      return
    }
    focusModeActive.value = false
    manualMode.value = focusModeManualBackup.value
    if (manualMode.value === 'systemList1' || manualMode.value === 'auto') {
      selectedMissionId.value = null
      selectedResourceId.value = null
    }
  }

  const openMission = (roomId: string) => {
   
    
    selectedMissionId.value = roomId  // 使用 room_id 作为任务标识
    selectedResourceId.value = null
    if (focusModeActive.value) {
      manualMode.value = 'systemList3'
    
      return
    }
    manualMode.value = 'systemList3'
   
  }

  const openResource = (resourceId: string) => {
    if (!selectedMissionId.value) {
      return
    }
    selectedResourceId.value = resourceId
    manualMode.value = 'systemList4'
  }

  const backToMissionResources = () => {
    selectedResourceId.value = null
    manualMode.value = 'systemList3'
  }

  const backToMissionList = () => {
    selectedMissionId.value = null
    selectedResourceId.value = null
    manualMode.value = focusModeActive.value ? 'systemList3' : 'systemList2'
  }

  const clear = () => {
    assistantRoomId.value = null
    isAssistantRoomActive.value = false
    noTaskButUserBotRoomIds.value = []
    justThirdAgentRoomIds.value = []
    assistantUnread.value = 0
    otherRoomsUnread.value = 0
    manualMode.value = 'auto'
    focusModeActive.value = false
    selectedMissionId.value = null
    selectedResourceId.value = null
  }

  return {
    assistantRoomId,
    isAssistantRoomActive,
    noTaskButUserBotRoomIds,
    justThirdAgentRoomIds,
    currentPanel,
    manualMode,
    focusModeActive,
    canSwitchPanels,
    showAssistantToggle,
    missions,
    currentMission,
    currentResources,
    currentResource,
    selectedMissionId,
    selectedResourceId,
    assistantUnread,
    otherRoomsUnread,
    assistantBadge,
    otherRoomsBadge,
    enterFocusMode,
    exitFocusMode,
    setAssistantRoomId,
    setNoTaskButUserBotRoomIds,
    setJustThirdAgentRoomIds,
    setAssistantActive,
    setManualMode,
    togglePanel,
    resetPanelForAssistantRoom,
    setAssistantUnread,
    setOtherRoomsUnread,
    switchToPanel,
    enableAutoMode,
    openMission,
    openResource,
    backToMissionResources,
    backToMissionList,
    clear
  }
})
