
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IDMapUser } from '@/types/IDmap'

export const useIDmapStore = defineStore('idmap', () => {
    const list = ref<IDMapUser[]>([])

    function set(user: IDMapUser) {
        try {
            if (!user) return

            const index = list.value.findIndex(
                (u) => u.username === user.username || u.matrixId === user.matrixId
            )

            if (index >= 0) {
                list.value[index] = user
            } else {
              //  console.log('[System:IDmap:set]新增user：', user, '类型：', user.type)
                list.value.push(user)
              //  console.log('[System:IDmap:set]当前IDmap列表：', list.value)
            }
        } catch {
            // 不抛错，避免影响其他程序运行
        }
    }

    function clear() {
        try {
            list.value = []
            console.log('[System:IDmap:clear] 清空IDmap列表')
        } catch {
            // 不抛错，避免影响其他程序运行
        }
    }



    function getByUsername(username: string): IDMapUser | undefined {
        try {
            return list.value.find((u) => u.username === username)
        } catch {
            return undefined
        }
    }

    function getByMatrixId(matrixId: string): IDMapUser | undefined {
        try {
            return list.value.find((u) => u.matrixId === matrixId)
        } catch {
            return undefined
        }
    }

    return {
        list,
        set,
        clear,
        getByUsername,
        getByMatrixId
    }
})
