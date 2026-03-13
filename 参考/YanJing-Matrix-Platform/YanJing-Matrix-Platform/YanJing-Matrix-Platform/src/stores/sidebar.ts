import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SidebarKey = 'sidebar1' | 'sidebar2' | 'sidebar3' | 'sidebar4' | 'sidebar5' | 'sidebar6'
export type SidebarSide = 'left' | 'right'
export type MessageMobilePanel = 'left' | 'middle' | 'right'

export interface SidebarState {
    left: boolean
    right: boolean
}

const createDefaultState = (): Record<SidebarKey, SidebarState> => ({
    sidebar1: { left: true, right: true },
    sidebar2: { left: true, right: true },
    sidebar3: { left: false, right: false },
    sidebar4: { left: false, right: false },
    sidebar5: { left: false, right: false },
    sidebar6: { left: true, right: false }
})



/**
 * 全局侧边栏状态管理
 */



export const useSidebarStore = defineStore('sidebar', () => {
    const sidebars = ref<Record<SidebarKey, SidebarState>>(createDefaultState())
    const pageListOpen = ref(false)
    const messageMobilePanel = ref<MessageMobilePanel>('left')

    function setSidebar(sidebar: SidebarKey, side: SidebarSide, value: boolean) {
        sidebars.value[sidebar] = {
            ...sidebars.value[sidebar],
            [side]: value
        }
    }

    function toggleSidebar(sidebar: SidebarKey, side: SidebarSide) {
        const current = sidebars.value[sidebar]?.[side] ?? false
        setSidebar(sidebar, side, !current)
    }

    function resetSidebars() {
        sidebars.value = createDefaultState()
    }

    function openPageList() {
        pageListOpen.value = true
    }

    function closePageList() {
        pageListOpen.value = false
    }

    function togglePageList() {
        pageListOpen.value = !pageListOpen.value
    }

    function setMessageMobilePanel(panel: MessageMobilePanel) {
        messageMobilePanel.value = panel
    }

    return {
        sidebars,
        pageListOpen,
        messageMobilePanel,
        setSidebar,
        toggleSidebar,
        resetSidebars,
        openPageList,
        closePageList,
        togglePageList,
        setMessageMobilePanel
    }
})
