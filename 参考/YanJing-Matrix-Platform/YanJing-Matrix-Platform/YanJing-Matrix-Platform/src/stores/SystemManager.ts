import { defineStore } from 'pinia'
import { ref } from 'vue'


export const SYSTEM_FUNCTIONS = [
    { id: 'NocoBase', name: 'NocoBase' },
    { id: 'Settings', name: '设置' }
] as const

export type SystemFunctionId = typeof SYSTEM_FUNCTIONS[number]['id']

/**
 * 全局系统房间与消息管理
 */


export const useSystemManagerStore = defineStore('ManagerSystem', () => {



    /**
     * 这是一个全局页面状态切换组件
     */
    const currentFunction = ref<SystemFunctionId>('NocoBase')

    function setCurrentFunction(func: SystemFunctionId) {
        console.log('[System:useSystemStore:setCurrentFunction]', func)
        currentFunction.value = func
    }








    return {
        currentFunction,
        setCurrentFunction
    }

})