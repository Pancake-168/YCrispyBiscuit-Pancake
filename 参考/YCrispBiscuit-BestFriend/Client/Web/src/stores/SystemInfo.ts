import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SystemInfo } from '@/types/SystemInfo'

export const useSystemInfoStore = defineStore('systemInfo', () => {
    const systemInfo = ref<SystemInfo | null>(null)

    function setSystemInfo(data: SystemInfo) {
        systemInfo.value = data
    }

    function clearSystemInfo() {
        systemInfo.value = null
    }

    return {
        systemInfo,
        setSystemInfo,
        clearSystemInfo
    }
})