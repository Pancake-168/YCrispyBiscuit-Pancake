import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * 任务管理 Store
 * 用于管理从后端 API 获取的任务列表数据
 * 每个任务对应一个 Matrix 房间
 */
export const useTaskStore = defineStore('task', () => {
  // 完整的任务列表数据（原始 API 返回）
  const taskList = ref<any[]>([])
  
  // 任务房间 ID 列表（用于过滤）
  const taskRoomIds = computed(() => {
    return taskList.value
      .map(task => task.room_id)
      .filter(Boolean)
  })

  /**
   * 设置任务列表
   * @param list - 从 API 获取的完整任务数据
   */
  const setTaskList = (list: any[]) => {
    if (!Array.isArray(list)) {
     
      taskList.value = []
      return
    }
    taskList.value = list
   
  }

  /**
   * 清空任务列表
   */
  const clearTaskList = () => {
    taskList.value = []
    console.log('[TaskStore] 任务列表已清空')
  }

  /**
   * 根据房间ID获取任务详情
   * @param roomId - 房间ID
   * @returns 任务对象或 null
   */
  const getTaskByRoomId = (roomId: string) => {
    return taskList.value.find(task => task.room_id === roomId) || null
  }

  return {
    // 状态
    taskList,
    taskRoomIds,
    
    // 方法
    setTaskList,
    clearTaskList,
    getTaskByRoomId
  }
})
