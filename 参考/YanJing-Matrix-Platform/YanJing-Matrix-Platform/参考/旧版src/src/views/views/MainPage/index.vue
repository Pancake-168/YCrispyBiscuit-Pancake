<template>
    <div class="matrix-chat-app">
        <!-- 全屏加载遮罩 -->
        <div v-if="isPageLoading" class="page-loading-overlay">
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">{{ loadingMessage }}</div>
            </div>
        </div>

        <div v-if="BySwitchRoom" class="page-loading-overlay">
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">{{ loadingMessage }}</div>
            </div>
        </div>

        <div class="discord-layout" :class="{ 'mobile-layout': isMobile }">

            <!-- 左侧功能列表组件 -->
            <div v-if="showFunctionSidebar" ref="functionSidebarRef" class="function-sidebar"
                :class="{ 'function-sidebar--compact': isFunctionSidebarCompact, 'function-sidebar--collapsed': isFunctionSidebarCollapsed }"
                :style="functionSidebarStyle">
                <LeftList :user-initials="getUserInitials()" :current-org="currentOrganization"
                    :current-function="currentFunction" :compact="isFunctionSidebarCompact" @userInfo="handleUserInfo"
                    @function-change="handleFunctionChange"
                    @open-organization-dropdown="handleOpenOrganizationDropdown" />
            </div>

            <!-- 功能区与频道列表之间的分隔条 -->
            <!--div v-if="!isMobile && !isFunctionSidebarCollapsed" class="resizer function-resizer"
                @mousedown="startResize($event, 'function')" title="拖拽调整功能区宽度"></div-->

            <!--div v-if="!isMobile && !isFunctionSidebarCollapsed" class="resizer function-resizer"></div-->

            <!-- 中间频道/功能区域组件 -->
            <!--div v-if="showChannelSidebar" class="channel-sidebar" :style="{ width: channelSidebarWidth }">
                <MiddleList :user-id="userId" :current-room-id="currentRoomId" :rooms="rooms"
                    :current-function="currentFunction" @select-room="handleSelectRoom" @join-room="handleJoinRoom"
                    @refresh-rooms="handleRefreshRooms" @open-room-manager="handleOpenRoomManager"
                    @open-global-manager="handleOpenGlobalManager" @open-space-manager="handleOpenSpaceManager"
                    @organization-action="handleOrganizationAction" @agent-select="handleAgentSelect"
                    @space-changed="handleSpaceChanged" @create-room="handleCreateRoom"
                    @add-new-organization="handleAddNewOrganization"
                    @talk-request-from-organization-list="handleTalkRequestFromOrganizationList" />
            </div-->

            <!-- 拖拽分隔条 (只在Web端且频道列表展开时显示) -->
            <!--div v-if="!isMobile && shouldShowMiddleList && channelSidebarWidth !== 'auto'" class="resizer"
                @mousedown="startResize($event, 'channel')" title="拖拽调整频道区域宽度"></div-->

            <!-- 右侧主内容区域组件 -->
            <!--div v-if="currentFunction !== 'newrooms' && (!isMobile || mobileViewMode === 'content' || !currentFunctionNeedsMiddleList) && !(isMobile && currentFunction === 'newrooms' && newroomsMobileMode === 'list')"
                class="main-chat-area"-->
            <!-- 移动端返回按钮 -->
            <!--div v-if="isMobile && currentFunctionNeedsMiddleList" 
                     class="mobile-back-btn" @click="switchToSidebarMode">
                    ← 返回
                </div-->

            <!--div class="right-content-head" v-if="!isMobile || !['workbench', 'market'].includes(currentFunction)">
                    <div v-if="isMobile && currentFunctionNeedsMiddleList" class="mobile-back-btn"
                        @click="switchToSidebarMode">
                        返回
                    </div>

                   

                </div>

             













               




                
            </div-->


            <div v-if="!isMobile || currentFunction !== 'newrooms' || newroomsMobileMode === 'chat'"
                class="NewRightContent" :class="{ 'NewRightContent--list-collapsed': isNewRightListCollapsed }">
                <div class="NewRightContent__inner">
                    <NewRightContentHead v-if="!assistantSidebarStore.focusModeActive && currentFunction !== 'MessagePage'"
                        :current-function-label="newRightFunctionLabel" :left-collapsed="isFunctionSidebarCollapsed"
                        :right-collapsed="isNewRightListCollapsed"
                        :is-mobile-newrooms="isMobile && currentFunction === 'newrooms'"
                        @toggle-left="handleToggleLeftSidebar" @toggle-right="toggleNewRightList"
                        @open-settings="handleUserInfo" @open-feedback="handleOpenFeedback" />
                    <div class="NewRightContent__body">
                        <NewRightContent v-if="currentFunction === 'newrooms'" ref="workspaceManagerRef" />
                        <MessagePage v-if="currentFunction === 'MessagePage'" ref="workspaceManagerRef"
                            @talk-request-from-organization-list="handleTalkRequestFromOrganizationList" />

                        <Organization v-else-if="currentFunction === 'NewOrganization'"
                            @talk-request-from-organization-list="handleTalkRequestFromOrganizationList" />


                        <Work_Bench v-else-if="currentFunction === 'workbench'" @show-info-page="handleShowInfoPage" />

                        <Application_Market_Inside v-else-if="currentFunction === 'market'"
                            @show-info-page="handleShowInfoPage" />
                        <Market_Information_Page v-else-if="currentFunction === 'marketInfo' && marketInfoParams"
                            @show-market-page="handleMarketInfoPageClose"
                            @agent-talk-request="(agentID, applicationID) => handleAgentTalkRequest(agentID, applicationID)"
                            @agent-develop-request="(agentID, applicationID) => handleAgentDevelopRequest(agentID, applicationID)"
                            :application-id="marketInfoParams.applicationId" :source="marketInfoParams.source" />
                        <UserInfoCom v-else-if="currentFunction === 'userInfo'" :user-id="userId"
                            @logout="handleLogout" />


                        <SystemMap v-else-if="currentFunction === 'systemmap'"
                            @talk-request-from-organization-list="handleTalkRequestFromOrganizationList" />

                    </div>
                </div>
            </div>

            <template v-if="currentFunction === 'newrooms' && (!isMobile || newroomsMobileMode === 'list')">
                <!--InternalBrowser v-if="showInternalBrowser" :url="internalBrowserUrl" @close="closeInternalBrowser" /-->
                <div class="NewRightContentList" :class="{ 'NewRightContentList--collapsed': isNewRightListCollapsed }">
                    <div class="NewRightContentList__inner">
                        <component v-if="rightPanelComponent" :is="rightPanelComponent"
                            @select-room="onRightPanelSelectRoom" @agent-select="onRightPanelAgentSelect"
                            @open-documents="showDocuments = true" @back="showDocuments = false" />
                    </div>
                </div>


            </template>

        </div>

        <!-- 悬浮的侧边栏切换按钮 (绝对定位，不占用布局空间) -->
        <!--div class="floating-toggles">
            <div class="floating-toggle function-toggle" @click="toggleFunctionSidebar"
                :style="getFunctionToggleStyle()">
                <span>{{ isFunctionSidebarCollapsed ? '▶' : '◀' }}</span>
            </div>

            
            <div v-if="shouldShowChannelToggle()" class="floating-toggle channel-toggle" @click="toggleChannelSidebar"
                :style="getChannelToggleStyle()">
                <span>{{ isChannelSidebarCollapsed ? '▶' : '◀' }}</span>
            </div>
        </div-->

        <!-- 主题切换悬浮按钮已移除，由RightContentHead管理 -->
        <!-- 组织下拉选择器 -->
        <NewOrganizationDropdownV2 @create-new-organization-dialog="handleCreateOrganizationDialogOpen" />

        <!-- 设备验证弹窗 -->
        <DeviceVerification ref="deviceVerificationRef" />










        <!-- 创建组织弹窗 -->

        <CreateOrganizationDialogV2 v-model="showCreateOrganizationDialog"
            @submit-success="handleCreateOrganizationSuccess" @submit-error="handleCreateOrganizationError" />

    </div>
</template>


<script setup lang="ts">


import { ref, computed, onMounted, onUnmounted, provide, readonly, nextTick, watch } from 'vue'
import LeftList from '../Pages/LeftList'
import MiddleList from '../Pages/MiddleList'

import DeviceVerification from '../../../components/DeviceVerification'


import NewOrganizationDropdownV2 from '@/components/NewOrganizationDropdownV2/index.vue'

import Organization from '../Pages/NewRightContentPage/OrganizationV2'
/*
import Work_Bench from '../Pages/RightContent/Work_Bench'
import Application_Market_Inside from '../Pages/RightContent/Application_Market_Inside'
import Market_Information_Page from '../Pages/RightContent/Application_Market_Inside/Market_Information_Page'
*/
import Work_Bench from '../Pages/NewRightContentPage/Work_Bench'
import Application_Market_Inside from '../Pages/NewRightContentPage/Application_Market_Inside'
import Market_Information_Page from '../Pages/NewRightContentPage/Market_Information_Page'


import { getOrganizationList } from '@/services/Project/ProjectStart/Project_Start'

import { getAssistantRoomIdFromProfile, setAssistantRoomIdToProfile } from '@/utils/assistantRoom'


import { matrixClientV2 as matrixClient } from '@/services/matrix/client'
import { matrixEventManager } from '@/services/matrix/eventManager'
import { replyInputManager } from '@/services/Operations/MsgReplyInput'
import { roomServiceV2 as roomService } from '@/services/matrix/rooms'
import { messageServiceV2 as messageService } from '@/services/matrix/messages'
import type { MatrixMessage, MatrixRoom, RoomSummaryEventData } from '@/types'
import { MatrixEventType } from '@/types'

import UserInfoCom from '../Pages/RightContent/UserInfo'


// 导入房间管理组件



// 导入创建弹窗组件



import CreateOrganizationDialogV2 from '../../../components/CreateOrganizationDialogV2.vue'

// 全局搜索 TheBestSearch 的打开入口由各子组件直接调用，不再在 MainPage 中转



// 导入用户资料卡组件
// 全局资料卡入口（显示/隐藏）与“快速对话”桥接注册
import { showUserProfileCard, hideUserProfileCard, setUserProfileCardQuickChatHandler } from '@/components/UserProfileCard/showUserProfileCard'

// 导入房间创建和邀请管理服务
import { roomCreateServiceV2 } from '@/services/rooms/room-create.service'
import { inviteManagementServiceV2 } from '@/services/members/invite.service'

import { 搜索用户 } from '@/services/matrix/search'


import SystemMap from '../Pages/NewRightContentPage/SystemMap'

import InternalBrowser from '@/components/InternalBrowser/index.vue'
import NewRightContent from '../Pages/NewRightContent'
import SystemList1 from '../Pages/NewRightContentList/SystemList1/index.vue'
import NewRightContentHead from '../Pages/NewRightContentHead'
import SystemList2 from '../Pages/NewRightContentList/SystemList2/index.vue'
import SystemList3 from '../Pages/NewRightContentList/SystemList3/index.vue'
import SystemList4 from '../Pages/NewRightContentList/SystemList4/index.vue'
import SourcesList from '../Pages/NewRightContentList/SourcesList/index.vue'
import MessagePage from '../Pages/NewRightContentPage/MessagePage/index.vue'
import { useAssistantSidebarStore } from '@/stores/assistantSidebar'
import { useTaskStore } from '@/stores/task'
import { useOrganizationStore } from '@/stores/organization'
import { useMarketStore } from '@/stores/market'
import { EnsureBotInstance, EnsureBotInstanceV2, Secretary } from '@/services/Project/Task/task'


import { MATRIX_SERVER_URL, MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import { addPrefixSuffix, removePrefixSuffix } from '@/utils/stringUtils'
import { Project_Start, getTaskList, NewProject_Start_GetAllOrgTrees, initOrganizationV2 } from '@/services/Project/ProjectStart/Project_Start'
import { useOrganizationStoreV2 } from '@/stores/organizationV2';
import { UserInfo } from '@/services/SSO/UserInfo'

import { useWechatStore } from "@/stores/wechat";
import { GetIMUserInfo } from '@/services/SSO/UserInfo';

import { userInfoManager } from '@/utils/userInfo'
import { findRoomByUserIds, roomMatcher } from '@/utils/roomMatcher'
//import {findRoomByUserIds2, roomMatcherV2} from '@/utils/roomMatcherV2'


import Nocobase from '@/components/Nocobase/index.vue'
import { openMessageDialog } from '@/components/MessageDialog/open';
import { resolveUserDisplayName } from '@/utils/displayName'

/**
 * Chat页面组件
 * 负责聊天界面的展示和交互，需要在已登录状态下使用
 */

// 状态管理 - 从 localStorage 获取用户信息
//const userId = localStorage.getItem('matrix_user_id') || ''

const userId0 = userInfoManager.getLoginField('username')
const userId = addPrefixSuffix(userId0, "@", MATRIX_SERVER_URL_TAIL)



// 聊天状态
const currentRoomId = ref('')
const newMessage = ref('')
const sending = ref(false)
const messages = ref<MatrixMessage[]>([])
const rooms = ref<MatrixRoom[]>([])
const assistantSidebarStore = useAssistantSidebarStore()
const taskStore = useTaskStore()
const marketStore = useMarketStore()

assistantSidebarStore.setAssistantRoomId(getAssistantRoomIdFromProfile() || null)



let roomSummarySubscriptionId: string | null = null
let messageDeleteSubscriptionId: string | null = null
let mountedCleanup: (() => void) | null = null
const marketInfoParams = ref<{ applicationId: string; source: string } | null>(null)
let currentOrganization = ref(userInfoManager.getPersonalInfo('CURRENTORGANIZATION') || null)

// 全局搜索直接使用 openTheBestSearch（当前仅在其他子组件中直接调用）

// 本页不再挂载本地用户资料卡实例，统一使用全局入口 showUserProfileCard/hideUserProfileCard

const isNewRightListCollapsed = ref(false)

// 内部浏览器状态
const showInternalBrowser = ref(false)
const internalBrowserUrl = ref('')

const handleOpenInternalBrowser = (event: Event) => {
    const customEvent = event as CustomEvent
    if (customEvent.detail && customEvent.detail.url) {
        internalBrowserUrl.value = customEvent.detail.url
        showInternalBrowser.value = true
    }
}

const closeInternalBrowser = () => {
    showInternalBrowser.value = false
    internalBrowserUrl.value = ''
}

onMounted(() => {
    window.addEventListener('app:openInternalBrowser', handleOpenInternalBrowser)
})

onUnmounted(() => {
    window.removeEventListener('app:openInternalBrowser', handleOpenInternalBrowser)
})

const showCreateDepartmentDialog = ref(false)
const externalLoadingActive = ref(false)
const createDepartmentDialogParams = ref<{ parentDepartmentId: number | null }>({
    parentDepartmentId: null
})
function handleAddNewOrganization() {
    createDepartmentDialogParams.value = { parentDepartmentId: 0 }
    showCreateDepartmentDialog.value = true
}

function handleCreateDepartmentDialogClose() {
    showCreateDepartmentDialog.value = false
}

// 创建组织弹窗状态和处理函数
const showCreateOrganizationDialog = ref(false)

const handleCreateOrganizationDialogOpen = () => {
    console.log(' MainPage: 打开创建组织弹窗')
    showCreateOrganizationDialog.value = true
}

const handleCreateOrganizationSuccess = async (data: any) => {
    console.log(' MainPage: 组织创建成功:', data)

    // 确保弹窗关闭（避免需要手动关闭）
    showCreateOrganizationDialog.value = false

    try {
        // 利用全局加载状态 (通过 BySwitchRoom 变量控制遮罩)
        loadingMessage.value = '正在刷新组织数据...'
        BySwitchRoom.value = true



        // 1. 重新获取用户信息 (更新 Apps 列表到 WechatStore 和 OrgStoreV2)
        console.log('MainPage: 等待2秒后开始刷新 UserInfo...');
        await sleep(2000); // 增加2秒等待，确保后端数据已就绪

        console.log('MainPage: 开始刷新 UserInfo...');

        // 确保使用最新的 UserInfo 接口逻辑
        await UserInfo();

        // 2. 重新初始化 V2 组织架构 (加载骨架等)
        console.log('MainPage: 开始重新初始化 V2 组织架构...');
        await initOrganizationV2(); // 复用 Project_Start 逻辑


        /*
        // 3. 自动切换到新组织
        // API 返回的字段不统一，做兼容 (appid / id / app_id)
        const newAppId = String(data?.appid || data?.id || data?.app_id || '');
        if (newAppId) {
            const orgStoreV2 = useOrganizationStoreV2(); // 使用 V2 Store
            const targetOrg = orgStoreV2.organizationList.find(org => String(org.app_id) === newAppId);
            
            if (targetOrg) {
                 console.log(`MainPage: 找到新组织 ${targetOrg.name}，正在自动切换...`);
                 orgStoreV2.switchOrganization(targetOrg);
            } else {
                 console.warn(`MainPage: 未在列表中找到新组织 (ID: ${newAppId})`);
            }
        }

        */
    } catch (e) {
        console.error('刷新组织数据失败', e)
        // 可以在这里加个 Toast 提示失败
    } finally {
        // 关闭遮罩
        BySwitchRoom.value = false
        loadingMessage.value = ''
    }
}

const handleCreateOrganizationError = (error: any) => {
    console.error(' MainPage: 组织创建失败:', error)
    // 这里可以显示错误提示
}



const setFunctionSidebarCollapsed = (collapsed: boolean) => {
    if (isFunctionSidebarCollapsed.value === collapsed) {
        return
    }
    isFunctionSidebarCollapsed.value = collapsed
    if (!collapsed) {
        nextTick(syncFunctionSidebarExpandedWidth)
    }
}

const handleToggleLeftSidebar = () => {
    setFunctionSidebarCollapsed(!isFunctionSidebarCollapsed.value)
}

const toggleNewRightList = () => {
    isNewRightListCollapsed.value = !isNewRightListCollapsed.value
}

// NewRightContentHead 的搜索事件直接触发全局搜索



const handleOpenFeedback = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:openFeedback'))
    }
}

// 处理个人中心按钮点击
const handleUserInfo = () => {
    currentFunction.value = 'userInfo';
};


// 设备验证弹窗组件引用
const deviceVerificationRef = ref<any | null>(null)







// 创建弹窗功能
const showCreateRoomDialog = ref(false)

// 当前选中的空间ID
const currentSpaceId = ref<string>('default')


const syncAssistantSidebarState = () => {
    const profileAssistantId = getAssistantRoomIdFromProfile()
    if (profileAssistantId !== assistantSidebarStore.assistantRoomId) {
        assistantSidebarStore.setAssistantRoomId(profileAssistantId || null)
    }

    const assistantId = assistantSidebarStore.assistantRoomId || null
    let assistantUnreadCount = 0
    let otherUnreadCount = 0

    rooms.value.forEach(room => {
        const unread = room.unreadCount ?? 0
        if (!unread) {
            return
        }

        if (assistantId && room.roomId === assistantId) {
            assistantUnreadCount += unread
        } else {
            otherUnreadCount += unread
        }
    })

    assistantSidebarStore.setAssistantUnread(assistantUnreadCount)
    assistantSidebarStore.setOtherRoomsUnread(otherUnreadCount)

    // 判断当前是否在 AI 助手范围内（保持原逻辑：唤醒房间 / 任务房间 / 补漏的专属bot房间）
    const taskStore = useTaskStore()
    const isTaskRoom = taskStore.taskRoomIds.includes(currentRoomId.value)
    const extraBotRooms = assistantSidebarStore.noTaskButUserBotRoomIds || []
    const isExtraBotRoom = extraBotRooms.includes(currentRoomId.value)
    const isAssistantScope = (assistantId && currentRoomId.value === assistantId) || isTaskRoom || isExtraBotRoom



    assistantSidebarStore.setAssistantActive(Boolean(isAssistantScope))
}


const applyRoomSummaryUpdate = (payload: RoomSummaryEventData) => {
    if (!payload || !payload.summary) {
        return
    }

    const index = rooms.value.findIndex(room => room.roomId === payload.roomId)
    if (index === -1) {
        rooms.value = roomService.获取房间列表()
        syncAssistantSidebarState()
        return
    }

    const existingRoom = rooms.value[index]
    const { summary } = payload

    const updatedRoom: MatrixRoom = {
        ...existingRoom,
        name: summary.name || existingRoom.name,
        lastActivity: summary.lastActivity || existingRoom.lastActivity,
        unreadCount: summary.unreadCount ?? existingRoom.unreadCount ?? 0,
        avatarUrl: summary.avatarUrl ?? existingRoom.avatarUrl
    }

    const updatedRooms = [...rooms.value]
    updatedRooms.splice(index, 1, updatedRoom)
    updatedRooms.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0))
    rooms.value = updatedRooms
    syncAssistantSidebarState()
}



const cleanupRoomSummarySubscription = () => {
    if (roomSummarySubscriptionId) {
        matrixEventManager.unsubscribe(roomSummarySubscriptionId)
        roomSummarySubscriptionId = null
    }
}


// 组织架构状态管理
const organizationState = ref({
    showOrgContent: false,
    orgId: '',
    deptId: '',
    tab: 'tree'
})



// 组织下拉选择器状态
const showOrganizationDropdown = ref(false)
const organizationDropdownData = ref<{
    allOrgs: any[]
    currentOrg: any | null
    triggerElement: HTMLElement | null
}>({
    allOrgs: [],
    currentOrg: null,
    triggerElement: null
})



// 布局状态
const currentFunction = ref<'newrooms' | 'MessagePage' | 'rooms' | 'workbench' | 'systemmap' | 'market' | 'marketInfo' | 'userInfo' | 'organization' | 'NewOrganization' | 'deviceManager'>('MessagePage')

const newRightFunctionLabel = computed(() => {
    const mapping: Record<string, string> = {
        rooms: '消息',
        newrooms: '消息',
        MessagePage: '消息',
        workbench: '工作台',
        systemmap: '系统蓝图',
        market: '智能体市场',
        marketInfo: '应用详情',
        userInfo: '个人中心',
        organization: '组织架构',
        NewOrganization: '组织架构',
        deviceManager: '设备管理'
    }
    return mapping[currentFunction.value] || '功能导航'
})

// 定义哪些功能需要显示中间列表
const functionsNeedingMiddleList = ['rooms', 'organization'] // 只有聊天功能需要房间列表

// ===== 页面加载状态 =====
const isPageLoading = ref(true)
const loadingMessage = ref('正在初始化...')
const BySwitchRoom = ref(false)

// ===== 移动端适配相关状态 =====
// 移动端检测
const isMobile = ref(false)

// 移动端布局模式：'sidebar' | 'content'
const mobileViewMode = ref<'sidebar' | 'content'>('sidebar')

// newrooms 在移动端下的视图模式：'list' 表示左侧功能 + 右侧列表视图，
// 'chat' 表示进入中间聊天视图（右侧列表隐藏）
const newroomsMobileMode = ref<'list' | 'chat'>('list')

// 简化模板中的判断，避免直接在模板里比较字面量
const isNewrooms = computed(() => currentFunction.value === 'newrooms')


// 检测是否为移动端设备
const checkIsMobile = () => {
    const mobileBreakpoint = 769 // 768px以下认为是移动端
    const wasMobile = isMobile.value
    isMobile.value = window.innerWidth < mobileBreakpoint

    // 只有在设备类型真正改变时才重置布局模式，保持用户的当前选择
    if (wasMobile !== isMobile.value) {
        // 根据当前功能设置移动端布局模式
        if (isMobile.value && functionsNeedingMiddleList.includes(currentFunction.value)) {
            mobileViewMode.value = 'sidebar' // 需要中间列表的功能，默认显示sidebar模式
        } else if (isMobile.value) {
            mobileViewMode.value = 'content' // 其他功能直接显示内容区
        } else {
            mobileViewMode.value = 'sidebar' // Web端显示完整布局
        }
    }
    // 如果设备类型没变，保持当前的mobileViewMode不变

    if (!isMobile.value && !isFunctionSidebarCollapsed.value && functionSidebarMode.value === 'expanded') {
        nextTick(syncFunctionSidebarExpandedWidth)
    }
}

// 切换到内容模式（移动端从sidebar切换到content）
const switchToContentMode = () => {
    if (isMobile.value) {
        mobileViewMode.value = 'content'
    }
}

// 返回到侧边栏模式（移动端从content切换到sidebar）
const switchToSidebarMode = () => {
    if (isMobile.value) {
        mobileViewMode.value = 'sidebar'
    }
}

// 右侧动态组件：在移动端 newrooms 的 chat 模式下禁止右侧面板切换，固定为 SystemList2（任务/历史面板）
const showDocuments = ref(false)

const rightPanelComponent = computed(() => {
    if (isMobile.value && currentFunction.value === 'newrooms' && newroomsMobileMode.value === 'chat') {
        return SystemList2
    }

    if (showDocuments.value) {
        return SourcesList
    }

    switch (assistantSidebarStore.currentPanel) {
        case 'systemList1':
            return SystemList1
        case 'systemList2':
            return SystemList2
        case 'systemList3':
            return SystemList3
        case 'systemList4':
            return SystemList4
        default:
            return SystemList2
    }
})

// 拖拽调整宽度相关状态
const channelSidebarBaseWidth = ref(240) // 频道区域基础宽度
const isResizing = ref(false)
const resizeType = ref<'channel' | 'function' | null>(null)
const resizeStartX = ref(0)
const channelResizeStartWidth = ref(0)
const functionResizeStartMode = ref<'expanded' | 'compressed'>('expanded')

// 侧边栏折叠状态
const isFunctionSidebarCollapsed = ref(false) // 功能侧边栏折叠状态
const isChannelSidebarCollapsed = ref(false)  // 频道侧边栏折叠状态




// 计算属性：动态宽度
const FUNCTION_SIDEBAR_DEFAULT_EXPANDED_WIDTH = 144
const FUNCTION_SIDEBAR_COMPRESSED_WIDTH = 56

const functionSidebarRef = ref<HTMLElement | null>(null)
const functionSidebarMode = ref<'expanded' | 'compressed'>('expanded')
const functionSidebarExpandedWidth = ref(FUNCTION_SIDEBAR_DEFAULT_EXPANDED_WIDTH)

// 左侧折叠时的左右留白，可以按需调整数值
const functionSidebarCollapsedSideGap = ref(0)

const functionSidebarWidth = computed(() => {
    if (isFunctionSidebarCollapsed.value) {
        return '0px'
    }

    if (isMobile.value) {
        return '53px'
    }

    const width = functionSidebarMode.value === 'compressed'
        ? FUNCTION_SIDEBAR_COMPRESSED_WIDTH
        : Math.max(functionSidebarExpandedWidth.value, FUNCTION_SIDEBAR_DEFAULT_EXPANDED_WIDTH)

    return `${width}px`
})


const functionSidebarStyle = computed(() => {
    const style: Record<string, string> = {
        width: functionSidebarWidth.value
    }

    if (isFunctionSidebarCollapsed.value) {
        style.margin = `10px ${functionSidebarCollapsedSideGap.value}px`
    }

    return style
})

const isFunctionSidebarCompact = computed(() => !isMobile.value && !isFunctionSidebarCollapsed.value && functionSidebarMode.value === 'compressed')

const syncFunctionSidebarExpandedWidth = () => {
    if (!functionSidebarRef.value) return
    const measured = Math.round(functionSidebarRef.value.getBoundingClientRect().width)
    if (measured > FUNCTION_SIDEBAR_COMPRESSED_WIDTH) {
        functionSidebarExpandedWidth.value = measured
    }
}

watch(isMobile, (value: boolean) => {
    if (value) {
        functionSidebarMode.value = 'expanded'
    } else if (!isFunctionSidebarCollapsed.value) {
        nextTick(syncFunctionSidebarExpandedWidth)
    }
})

watch(functionSidebarMode, (mode: 'expanded' | 'compressed') => {
    if (mode === 'expanded') {
        nextTick(syncFunctionSidebarExpandedWidth)
    }
})

watch(isFunctionSidebarCollapsed, (collapsed: boolean) => {
    if (!collapsed && !isMobile.value && functionSidebarMode.value === 'expanded') {
        nextTick(syncFunctionSidebarExpandedWidth)
    }
})





// 计算属性：是否当前功能需要中间列表
const currentFunctionNeedsMiddleList = computed(() => {
    return functionsNeedingMiddleList.includes(currentFunction.value)
})

// 计算属性：中间列表是否应该显示
const shouldShowMiddleList = computed(() => {
    return currentFunctionNeedsMiddleList.value && !isChannelSidebarCollapsed.value
})

// 计算属性：是否显示左侧功能侧边栏（移动端 newrooms 的 chat 模式下要隐藏）
const showFunctionSidebar = computed(() => {
    // 在移动端且处于 newrooms 的聊天视图时，不显示左侧功能栏
    if (isMobile.value && currentFunction.value === 'newrooms' && newroomsMobileMode.value === 'chat') {
        return false
    }

    // 否则遵循原有逻辑：非移动端 或 移动端处于 sidebar 模式 或 当前功能不需要中间列表
    return !isMobile.value || mobileViewMode.value === 'sidebar' || !currentFunctionNeedsMiddleList.value
})

// 计算属性：中间频道侧边栏是否显示（移动端 newrooms 的 chat 模式下要隐藏）
const showChannelSidebar = computed(() => {
    if (isMobile.value && currentFunction.value === 'newrooms' && newroomsMobileMode.value === 'chat') {
        return false
    }

    // 原有逻辑：只在需要中间列表且（非移动端或移动端处于 sidebar 模式）时显示
    return currentFunctionNeedsMiddleList.value && (!isMobile.value || mobileViewMode.value === 'sidebar')
})

const channelSidebarWidth = computed(() => {
    // 如果当前功能不需要中间列表，强制宽度为0
    if (!currentFunctionNeedsMiddleList.value) {
        return '0px'
    }

    // 如果是移动端且需要中间列表，占用剩余宽度
    if (isMobile.value && currentFunctionNeedsMiddleList.value && !isChannelSidebarCollapsed.value) {
        return 'auto'
    }

    // Web端使用固定宽度
    return isChannelSidebarCollapsed.value ? '0px' : channelSidebarBaseWidth.value + 'px'
})

// 计算属性：当前房间的消息
const currentRoomMessages = computed(() => {
    return messages.value.filter(msg => msg.roomId === currentRoomId.value)
})

// ========== 补漏扫描：识别“非任务但含bot”的房间 ==========
let scanNoTaskBotRoomsTimer: any = null
let scanNoTaskBotRoomsRunning = false

function scheduleScanNoTaskBotRooms(delay = 400) {
    if (scanNoTaskBotRoomsTimer) {
        clearTimeout(scanNoTaskBotRoomsTimer)
    }
    scanNoTaskBotRoomsTimer = setTimeout(() => {
        scanNoTaskBotRooms()
    }, delay)
}

async function scanNoTaskBotRooms() {
    if (scanNoTaskBotRoomsRunning) return
    if (!matrixClient.CheckLoginStatus()) return
    scanNoTaskBotRoomsRunning = true
    try {
        const assistantId = assistantSidebarStore.assistantRoomId || null
        const taskRoomIds = taskStore.taskRoomIds
        const exclude = new Set<string>([...(assistantId ? [assistantId] : []), ...taskRoomIds])

        const result: string[] = []
        // 计算当前用户与其专属 bot 的 canonical ID
        const selfCanonical = userId
        const selfRaw = removePrefixSuffix(selfCanonical, '@', MATRIX_SERVER_URL_TAIL)
        const botCanonical = addPrefixSuffix(`${selfRaw}userbot`, '@', MATRIX_SERVER_URL_TAIL)
        for (const room of rooms.value) {
            const roomId = room?.roomId
            if (!roomId || exclude.has(roomId)) continue
            try {
                const members = roomService.获取房间成员(roomId)
                if (!Array.isArray(members)) continue
                // 仅统计 join/invite 成员
                const filtered = members.filter((m: any) => !m || !m.membership || m.membership === 'join' || m.membership === 'invite')
                const canonicals = Array.from(new Set(filtered.map((m: any) => m?.userId).filter(Boolean)))
                // 严格判定：仅两人房，且为【自己 + 专属bot】
                if (canonicals.length === 2 && canonicals.includes(selfCanonical) && canonicals.includes(botCanonical)) {
                    result.push(roomId)
                }
            } catch (e) {
                console.warn('[MainPage] 扫描房间成员失败，跳过:', roomId, e)
            }
        }

        assistantSidebarStore.setNoTaskButUserBotRoomIds(result)
        console.log('[MainPage] 二次筛查完成，NoTaskButUserBotRooms:', result)
    } finally {
        scanNoTaskBotRoomsRunning = false
    }
}

// ========== 扩展扫描：识别其它领域 bot 两人房（JustThirdAgentRooms）===========
let scanThirdAgentRoomsTimer: any = null
let scanThirdAgentRoomsRunning = false

function scheduleScanJustThirdAgentRooms(delay = 500) {
    if (scanThirdAgentRoomsTimer) {
        clearTimeout(scanThirdAgentRoomsTimer)
    }
    scanThirdAgentRoomsTimer = setTimeout(() => {
        scanJustThirdAgentRooms()
    }, delay)
}

async function scanJustThirdAgentRooms() {
    if (scanThirdAgentRoomsRunning) return
    if (!matrixClient.CheckLoginStatus()) return
    scanThirdAgentRoomsRunning = true
    try {
        const assistantId = assistantSidebarStore.assistantRoomId || null
        const taskRoomIds = taskStore.taskRoomIds
        const extraBotRooms = assistantSidebarStore.noTaskButUserBotRoomIds || []
        const exclude = new Set<string>([...(assistantId ? [assistantId] : []), ...taskRoomIds, ...extraBotRooms])

        const result: string[] = []
        const selfCanonical = userId
        const selfRaw = removePrefixSuffix(selfCanonical, '@', MATRIX_SERVER_URL_TAIL)
        const selfUserbotRaw = `${selfRaw}userbot`
        for (const room of rooms.value) {
            const roomId = room?.roomId
            if (!roomId || exclude.has(roomId)) continue
            try {
                const members = roomService.获取房间成员(roomId)
                if (!Array.isArray(members)) continue
                const filtered = members.filter((m: any) => !m || !m.membership || m.membership === 'join' || m.membership === 'invite')
                const canonicals = Array.from(new Set(filtered.map((m: any) => m?.userId).filter(Boolean)))
                if (canonicals.length !== 2 || !canonicals.includes(selfCanonical)) continue
                const otherCanonical = canonicals.find(c => c !== selfCanonical)
                if (!otherCanonical) continue
                const otherRaw = removePrefixSuffix(otherCanonical, '@', MATRIX_SERVER_URL_TAIL)
                if (!otherRaw.endsWith('bot')) continue
                if (otherRaw === selfUserbotRaw) continue // 排除个人专属 userbot
                result.push(roomId)
            } catch (e) {
                console.warn('[MainPage] 扫描第三方 bot 房间成员失败，跳过:', roomId, e)
            }
        }
        assistantSidebarStore.setJustThirdAgentRoomIds(result)
        console.log('[MainPage] 扫描完成，JustThirdAgentRooms:', result)
    } finally {
        scanThirdAgentRoomsRunning = false
    }
}

// 任务房间列表变化后也触发一次扫描（补漏）
watch(
    () => taskStore.taskRoomIds,
    () => scheduleScanNoTaskBotRooms(300),
    { deep: false }
)

// 任务房间变化也触发第三方 bot 扫描
watch(
    () => taskStore.taskRoomIds,
    () => scheduleScanJustThirdAgentRooms(600),
    { deep: false }
)



















// 异步初始化所有功能
const performFullInitialization = async () => {
    try {
        console.log(' [MainPage] 开始完整初始化流程...')

        // 步骤1: 等待 Matrix 客户端启动（initializeChat 已在 onMounted 中同步调用）
        loadingMessage.value = '正在连接 Matrix 服务器...'
        console.log(' [1/7] 等待 Matrix 客户端启动...')
        await sleep(500) // 给 Matrix 客户端一点启动时间

        // 步骤2: 等待 Matrix 同步完成
        loadingMessage.value = '正在同步房间列表...'
        console.log(' [2/7] 等待 Matrix 初始同步完成...')
        try {
         //   await waitForAssistantRoomsReady()
            console.log(' [2/7] Matrix 同步完成')
        } catch (error) {
            console.error(' Matrix 同步失败:', error)
            throw error
        }

        // 步骤3: 执行项目启动逻辑
        loadingMessage.value = '正在初始化项目配置...'
        console.log(' [3/7] 执行项目启动逻辑...')
        await Project_Start()

        /*
        // 设置默认组织
        const orgList = userInfoManager.getPersonalInfo('ORGANIZATION') || []
        if (orgList.length > 0) {
            userInfoManager.addField('CURRENTORGANIZATION', orgList[0])
            // saveUserBotMapping()
            currentOrganization.value = orgList[0]
            console.log('[MainPage] 默认组织已设置:', orgList[0])
        }
            */
        console.log(' [3/7] 项目配置完成')

        // 步骤4: 初始化个人助手房间
        loadingMessage.value = '正在初始化个人助手...'
        console.log(' [4/7] 初始化个人助手房间...')
     //   await userbotroom()
  
        console.log(' [4/7] 个人助手初始化完成')

        // 步骤5: 获取任务列表
        loadingMessage.value = '正在加载任务列表...'
        console.log(' [5/7] 获取任务列表...')
      //  await getTaskList()
        console.log(' [5/7] 任务列表加载完成')

        // 步骤6: 预加载智能体市场数据
        loadingMessage.value = '正在加载智能体市场数据...'
        console.log(' [6/7] 预加载智能体市场数据...')
        try {
            if (userId0) {
                // 异步加载，不阻塞初始化流程
                marketStore.loadUserApps(userId0, 1)
            }
            marketStore.loadPublicApps(1)
            console.log(' [6/7] 智能体市场数据加载请求已发送')
        } catch (e) {
            console.warn(' 预加载智能体市场数据失败:', e)
        }

        // 步骤7: 最终检查
        loadingMessage.value = '正在完成最后配置...'
        console.log(' [7/7] 最终检查...')
        handleRefreshRooms() // 确保房间列表最新
        await sleep(500)
     //   await scanNoTaskBotRooms()
      //  await scanJustThirdAgentRooms()
        console.log(' [7/7] 最终检查完成')

        console.log(' [MainPage] 完整初始化流程成功完成！')
        loadingMessage.value = '加载完成'

        // 延迟一点时间让用户看到"加载完成"的提示
        await sleep(300)

    } catch (error) {
        console.error(' [MainPage] 初始化失败:', error)
        loadingMessage.value = '初始化失败，请刷新页面重试'
        // 保持加载状态显示错误，不隐藏遮罩
        throw error
    } finally {
        // 只有在没有错误时才隐藏加载遮罩
        if (!loadingMessage.value.includes('失败')) {
            isPageLoading.value = false
        }
    }
}

// 组件挂载时初始化
onMounted(() => {
    // 初始化移动端检测
    checkIsMobile()

    nextTick(() => {
        if (!isMobile.value) {
            syncFunctionSidebarExpandedWidth()
        }
    })

    // 监听窗口大小变化
    window.addEventListener('resize', checkIsMobile)

    // 立即初始化聊天（在事件监听器注册之前）
    initializeChat()

    // 监听Matrix重新登录事件
    const handleMatrixRelogin = (event: any) => {
        const reason = event.detail?.reason || '需要重新登录'
        console.log(' MainPage收到重新登录请求:', reason)

        // 直接触发登出，回到登录页面
        handleLogout()
    }
    window.addEventListener('matrix:needRelogin', handleMatrixRelogin)

    // 🔧 监听Matrix加密和同步事件 - 基于element-web模式
    const handleSyncStateChanged = (event: any) => {
        const { state, prevState } = event.detail || {}
        console.log(`[MainPage] 同步状态变化: ${prevState} → ${state}`)

        if (state === 'PREPARED') {
            console.log('[MainPage]  初始同步完成，Matrix客户端就绪')
        }
    }

    const handleCryptoCheckComplete = (event: any) => {
        const { crossSigningReady } = event.detail || {}
        console.log(`[MainPage] 加密检查完成，交叉签名状态: ${crossSigningReady ? '已就绪' : '未设置'}`)
    }

    const handleDeviceVerificationNeeded = (event: any) => {
        const { userId, deviceId } = event.detail || {}
        console.log(`[MainPage] 设备需要验证: ${deviceId} (用户: ${userId})`)
        // 可以在这里显示设备验证提示
    }

    const handleGlobalLoading = (event: Event) => {
        const customEvent = event as CustomEvent
        const detail = customEvent.detail || {}
        const visible = Boolean(detail.visible)
        const message = detail.message as string | undefined

        if (visible) {
            if (!BySwitchRoom.value) {
                BySwitchRoom.value = true
                externalLoadingActive.value = true
            }
            if (message) {
                loadingMessage.value = message
            }
        } else if (externalLoadingActive.value) {
            externalLoadingActive.value = false
            BySwitchRoom.value = false
            if (message && loadingMessage.value === message) {
                loadingMessage.value = ''
            }
        }
    }

    // 添加Matrix加密事件监听器
    window.addEventListener('matrix:sync_state_changed', handleSyncStateChanged)
    window.addEventListener('matrix:crypto_check_complete', handleCryptoCheckComplete)
    window.addEventListener('matrix:device_verification_needed', handleDeviceVerificationNeeded)
    window.addEventListener('app:globalLoading', handleGlobalLoading)

    // 添加快捷键测试设备验证弹窗（Ctrl+R）
    const handleKeydown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault()
            openDeviceVerification()
        }
    }
    document.addEventListener('keydown', handleKeydown)

    cleanupRoomSummarySubscription()
    roomSummarySubscriptionId = matrixEventManager.subscribe(
        MatrixEventType.ROOM_SUMMARY_UPDATED,
        (payload: RoomSummaryEventData) => {
            applyRoomSummaryUpdate(payload)
        }
    )

    // 订阅消息撤回事件：从当前消息集合中移除
    if (messageDeleteSubscriptionId) {
        matrixEventManager.unsubscribe(messageDeleteSubscriptionId)
        messageDeleteSubscriptionId = null
    }
    messageDeleteSubscriptionId = matrixEventManager.subscribe(
        MatrixEventType.MESSAGE_DELETED,
        (data: any) => {
            const { roomId, eventId } = data || {}
            if (!roomId || !eventId) return
            const before = messages.value.length
            messages.value = messages.value.filter(m => !(m.roomId === roomId && m.eventId === eventId))
            if (before !== messages.value.length) {
                console.log('[MainPage] 已移除被撤回消息:', eventId)
            }
        }
    )

    // 清理函数
    const cleanup = () => {
        document.removeEventListener('keydown', handleKeydown)
        window.removeEventListener('matrix:needRelogin', handleMatrixRelogin)
        window.removeEventListener('matrix:sync_state_changed', handleSyncStateChanged)
        window.removeEventListener('matrix:crypto_check_complete', handleCryptoCheckComplete)
        window.removeEventListener('matrix:device_verification_needed', handleDeviceVerificationNeeded)
        window.removeEventListener('app:globalLoading', handleGlobalLoading)
        window.removeEventListener('resize', checkIsMobile)
        cleanupRoomSummarySubscription()
        if (messageDeleteSubscriptionId) {
            matrixEventManager.unsubscribe(messageDeleteSubscriptionId)
            messageDeleteSubscriptionId = null
        }
        mountedCleanup = null
    }

    mountedCleanup = cleanup

    // 🚀 执行完整的异步初始化流程
    performFullInitialization().catch(error => {
        console.error(' [MainPage] 初始化流程失败:', error)
    })

})




onUnmounted(() => {
    if (mountedCleanup) {
        mountedCleanup()
    } else {
        cleanupRoomSummarySubscription()
        if (messageDeleteSubscriptionId) {
            matrixEventManager.unsubscribe(messageDeleteSubscriptionId)
            messageDeleteSubscriptionId = null
        }
        mountedCleanup = null
    }
})


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function waitForAssistantRoomsReady(maxWaitTime = 120000) {
    const startTime = Date.now()
    const checkInterval = 1500 // 每1.5秒检查一次
    let emptyRoomConfirmCount = 0 // 连续确认房间为空的次数

    console.log('[MainPage]  等待 Matrix 初始同步完成...')

    while (Date.now() - startTime < maxWaitTime) {
        try {
            const client = matrixClient.getAuthedClient()

            if (!client) {
                console.warn('[MainPage]  Matrix 客户端未初始化')
                await sleep(checkInterval)
                continue
            }

            // 检查初始同步是否完成
            const isSyncComplete = client.isInitialSyncComplete()
            const roomCount = rooms.value.length
            const elapsed = Math.round((Date.now() - startTime) / 1000)

            console.log(`[MainPage] 同步状态检查 (${elapsed}s): syncComplete=${isSyncComplete}, rooms=${roomCount}`)

            // 情况1：同步完成且有房间 -> 完美，直接通过
            if (isSyncComplete && roomCount > 0) {
                console.log(` Matrix 初始同步完成！共加载 ${roomCount} 个房间`)
                return true
            }

            // 情况2：同步完成但没房间 -> 进入观察期
            if (isSyncComplete && roomCount === 0) {
                emptyRoomConfirmCount++
                console.log(`[MainPage]  同步已完成但房间为空，正在进行第 ${emptyRoomConfirmCount}/5 次确认...`)

                // 只有连续 5 次（约10秒）确认都是这种情况，才认定为新用户
                if (emptyRoomConfirmCount >= 5) {
                    console.log(` 经多次确认，Matrix 同步完成且无房间（判定为新用户）`)
                    return true
                }

                // 还没确认够次数，尝试刷新一下，继续下一次循环
                handleRefreshRooms()
            }
            // 情况3：同步还没完成 -> 重置确认计数，继续等待
            else {
                if (emptyRoomConfirmCount > 0) {
                    console.log('[MainPage]  同步状态发生变化，重置空房间确认计数')
                    emptyRoomConfirmCount = 0
                }
                console.log(`[MainPage] Matrix 正在同步中，已等待 ${elapsed} 秒...`)
            }

        } catch (error) {
            console.warn('[MainPage] 检查同步状态失败:', error)
        }

        await sleep(checkInterval)
    }

    // 超时处理
    const finalRoomCount = rooms.value.length
    const totalWaitTime = Math.round((Date.now() - startTime) / 1000)

    console.error(` 等待 Matrix 同步超时！等待了 ${totalWaitTime} 秒，当前房间数: ${finalRoomCount}`)
    throw new Error(`Matrix 同步超时：等待了 ${totalWaitTime} 秒仍未完成同步。建议检查网络连接或稍后重试。`)
}

async function isRoomAvailable(roomId: string) {
    if (rooms.value.some(room => room.roomId === roomId)) {
        return true
    }

    handleRefreshRooms()
    await sleep(500)

    if (rooms.value.some(room => room.roomId === roomId)) {
        return true
    }

    try {
        const clientGetter = (matrixClient as any).getAuthedClient
        if (typeof clientGetter === 'function') {
            const authedClient = clientGetter.call(matrixClient)
            if (authedClient?.getRoom?.(roomId)) {
                return true
            }
        }
    } catch (error) {
        console.warn('[MainPage] 检查房间可用性失败:', error)
    }

    return false
}


async function resolveAssistantRoomFromCache(): Promise<string | null> {
    const cachedRoomId = getAssistantRoomIdFromProfile()

    if (!cachedRoomId || typeof cachedRoomId !== 'string') {
        return null
    }

    const available = await isRoomAvailable(cachedRoomId)
    if (!available) {
        console.log('[MainPage] 缓存的个人助手房间不可用，正在清理缓存...')
        setAssistantRoomIdToProfile(null)
        assistantSidebarStore.setAssistantRoomId(null)
        return null
    }

    // P1: 验证房间成员是否包含 userbot
    try {
        const room = rooms.value.find(r => r.roomId === cachedRoomId)
        if (room) {
            const cuserId = userInfoManager.getLoginField("username")
            const cuserId1 = removePrefixSuffix(cuserId, '@', MATRIX_SERVER_URL_TAIL)
            const botUsername = `${cuserId1}userbot`
            const botUsername1 = addPrefixSuffix(botUsername, '@', MATRIX_SERVER_URL_TAIL)

            const members = roomService.获取房间成员(cachedRoomId)
            const hasBotMember = members.some((m: any) => m.userId === botUsername1)

            if (!hasBotMember) {
                console.warn('[MainPage]  缓存房间缺少 bot 成员，清理缓存')
                setAssistantRoomIdToProfile(null)
                assistantSidebarStore.setAssistantRoomId(null)
                return null
            }
        }
    } catch (err) {
        console.warn('[MainPage] 验证房间成员失败，清理缓存:', err)
        setAssistantRoomIdToProfile(null)
        assistantSidebarStore.setAssistantRoomId(null)
        return null
    }

    console.log('[MainPage]  使用缓存的个人助手房间:', cachedRoomId)
    assistantSidebarStore.setAssistantRoomId(cachedRoomId)
    return cachedRoomId
}



async function locateAssistantRoom(targetUserIds: string[], maxRetries = 5, retryDelay = 1500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(` 第 ${attempt} 次尝试查找房间...`)

        handleRefreshRooms()
        await sleep(retryDelay)

        try {
            roomMatcher.clearCacheFor(targetUserIds)
        } catch (e) {
            console.warn('clearCacheFor 调用失败，忽略并继续：', e)
        }

        const foundRoomId = await findRoomByUserIds(targetUserIds)

        if (foundRoomId && foundRoomId !== "未匹配到!") {
            console.log(` 第 ${attempt} 次尝试成功找到房间: ${foundRoomId}`)
            return foundRoomId
        }

        console.log(` 第 ${attempt} 次尝试未找到房间，${attempt < maxRetries ? '继续重试...' : '已达到最大重试次数'}`)
    }

    return null
}

// 全局状态:防止并发执行和标记初始化完成
let isCreatingAssistantRoom = false
let assistantRoomInitialized = false

// localStorage key for tracking creation in progress
const ASSISTANT_ROOM_CREATING_KEY = 'matrix_assistant_room_creating'

































/*
async function userbotroom() {
    console.log('开始处理个人助手房间逻辑...');

    // P0: 防止并发执行
    if (isCreatingAssistantRoom) {
        console.warn(' 个人助手房间创建正在进行中，忽略重复调用');
        return;
    }

    // P0: 检查 localStorage 中是否有正在创建的标记（防止刷新后重复创建）
    const creatingTimestamp = localStorage.getItem(ASSISTANT_ROOM_CREATING_KEY)
    if (creatingTimestamp) {
        const elapsed = Date.now() - parseInt(creatingTimestamp, 10)
        const fiveMinutes = 5 * 60 * 1000

        if (elapsed < fiveMinutes) {
            console.warn(` 检测到 ${Math.round(elapsed / 1000)} 秒前有创建操作正在进行，跳过以防止重复创建`)
            return
        } else {
            console.warn(` 检测到过期的创建标记（${Math.round(elapsed / 1000)} 秒前），已清理`)
            localStorage.removeItem(ASSISTANT_ROOM_CREATING_KEY)
        }
    }

    // P0: 如果已初始化完成，跳过
    if (assistantRoomInitialized) {
        console.log(' 个人助手房间已初始化完成，跳过');
        return;
    }

    isCreatingAssistantRoom = true;
    localStorage.setItem(ASSISTANT_ROOM_CREATING_KEY, Date.now().toString())

    try {
        const cachedRoomId = await resolveAssistantRoomFromCache()
        if (cachedRoomId) {
            assistantRoomInitialized = true;
            return
        }

        //新增判断，由于项目需求，新增一个个人助手对话，这个助手得id格式为本人id加上userbot后缀，例如我自己是ycb，那么个人助手就是ycbuserbot
        const cuserId = userInfoManager.getLoginField("username")
        const cuserId1 = removePrefixSuffix(cuserId, '@', MATRIX_SERVER_URL_TAIL)
        const botUsername = `${cuserId1}userbot`
        const botUsername1 = addPrefixSuffix(botUsername, '@', MATRIX_SERVER_URL_TAIL)
        const cuserId2 = addPrefixSuffix(cuserId1, '@', MATRIX_SERVER_URL_TAIL)

        //然后使用房间查询，如果查到两人的房间，就无所谓跳过，如果没有就创建，如果是创建分支，则需要用户退出登录后重新登录一次
        const targetUserIds = [cuserId2, botUsername1];
        console.log('搜索房间参数:', targetUserIds);

        await waitForAssistantRoomsReady()

        // 改进的房间查找逻辑，添加重试机制（参考其他函数的实现）
        const existingRoomId = await locateAssistantRoom(targetUserIds)

        if (existingRoomId) {
            console.log('找到已存在的房间:', existingRoomId);
            setAssistantRoomIdToProfile(existingRoomId)
            assistantSidebarStore.setAssistantRoomId(existingRoomId)
            assistantRoomInitialized = true;

            //如果房间名称不是个人助手的名称（是名称，而不是matrix账号）
            const room = rooms.value.find(r => r.roomId === existingRoomId);
            const currentRoomName = room ? room.name : existingRoomId;

            if (currentRoomName === botUsername) {
                console.log('找到的房间名称与个人助手名称不匹配，开始搜索bot用户信息...');

                try {
                    // 搜索bot用户信息，获取昵称
                    const searchResults = await 搜索用户(botUsername1, { query: botUsername1, limit: 1 });

                    if (searchResults && searchResults.length > 0) {
                        const botUser = searchResults[0].item;
                        const botDisplayName = resolveUserDisplayName({
                            matrixId: botUser.userId,
                            matrixDisplayName: botUser.displayName || null
                        })

                        console.log('搜索到bot用户:', botDisplayName);

                        // 获取房间信息来检查当前名称
                        const room = rooms.value.find(r => r.roomId === existingRoomId);
                        const currentRoomName = room ? room.name : existingRoomId;

                        console.log(`需要将房间 ${existingRoomId} 的名称从 "${currentRoomName}" 改为 "${botDisplayName}"`);

                        // 实现房间重命名功能
                        try {
                            console.log(`正在将房间 ${existingRoomId} 重命名为 "${botDisplayName}"...`);
                            await roomService.设置房间名称(existingRoomId, botDisplayName);
                            console.log(` 房间重命名成功: ${botDisplayName}`);

                            // 重命名成功后刷新房间列表以更新UI
                            console.log(' 重命名后刷新房间列表...');
                            handleRefreshRooms();

                            // 等待一小段时间确保服务器同步
                            await new Promise(resolve => setTimeout(resolve, 1000));

                            // 再次刷新以确保UI更新
                            console.log(' 再次刷新房间列表确保UI更新...');
                            handleRefreshRooms();

                            console.log(' 房间列表刷新完成');
                        } catch (renameError) {
                            console.warn('房间重命名失败:', renameError);
                            console.log('继续使用现有房间名称');
                        }
                    } else {
                        console.log('未搜索到bot用户信息，使用默认名称');
                    }
                } catch (searchError) {
                    console.warn('搜索bot用户信息失败:', searchError);
                    console.log('继续使用现有房间名称');
                }

                console.log('继续使用现有房间');
            }
            return; // 找到房间则直接返回
        }


        console.log('未找到已存在的房间，开始创建新房间...');

        // 如果没有找到房间，自动创建一个新房间
        // 构建房间创建参数
        const roomName = botUsername // 优先使用昵称，否则使用用户名
        const roomOptions = {
            name: '通用助手', // 使用昵称或用户名作为房间名称
            topic: `通用助手`, // 房间主题也使用昵称或用户名
            visibility: 'private' as const, // 私有房间
            encryption: false, // 不启用端到端加密
            invites: [], // 先创建房间，稍后再邀请用户（如果用户账号存在的话）
            historyVisibility: 'invited' as const, // 历史消息对被邀请者可见
            joinRule: 'invite' as const, // 仅邀请加入
            guestAccess: 'forbidden' as const, // 禁止访客

        };

        console.log('创建房间参数:', roomOptions);

        // 调用创建不加密房间的方法
        const newRoom = await roomCreateServiceV2.创建不加密的房间(roomOptions);
        console.log('房间创建成功:', newRoom);

        setAssistantRoomIdToProfile(newRoom.roomId)
        assistantSidebarStore.setAssistantRoomId(newRoom.roomId)

        // 5. 尝试邀请用户进入房间
        try {
            console.log('尝试邀请用户进入房间:', botUsername1);
            await inviteManagementServiceV2.邀请用户(newRoom.roomId, botUsername1, `邀请 ${roomName} 加入对话`);
            console.log('用户邀请成功:', roomName);
        } catch (inviteError) {
            console.warn('邀请用户失败，但房间创建成功:', inviteError);
            // 邀请失败不影响主流程，用户仍可进入房间
        }

        // 房间创建成功后，刷新房间列表并切换到新房间
        console.log('房间创建完成，开始刷新房间列表...');
        handleRefreshRooms();

        // 切换到新创建的房间
        currentFunction.value = 'MessagePage';
        await handleSelectRoom(newRoom.roomId);

        // 确保WorkspaceManager中有Chat选项卡

  
        console.log(' 个人助手房间创建和设置完成');
        assistantRoomInitialized = true;

    } catch (error) {
        console.error(' 个人助手房间处理失败:', error);
        openMessageDialog('创建个人助手房间时发生错误，请稍后重试。');
    } finally {
        isCreatingAssistantRoom = false;
        localStorage.removeItem(ASSISTANT_ROOM_CREATING_KEY);
        console.log(' userbotroom 执行完毕，已重置并发标志并清理 localStorage 标记');
    }
}



*/









































// 处理功能切换
const handleFunctionChange = async (newFunction: 'rooms' | 'MessagePage' | 'newrooms' | 'workbench' | 'systemmap' | 'market' | 'marketInfo' | 'userInfo' | 'organization' | 'NewOrganization' | 'deviceManager') => {
    // 如果点击当前已选中的功能，直接返回，避免重复加载
    if (currentFunction.value === newFunction) {
        return
    }

    // 如果切换到组织架构功能
    if (newFunction === 'organization') {
        const currentOrg = userInfoManager.getPersonalInfo("CURRENTORGANIZATION")
        // 只有当存在当前组织时，才显示加载遮罩并渲染内容
        if (currentOrg) {
            BySwitchRoom.value = true
            loadingMessage.value = '正在加载组织数据...'
            organizationState.value = {
                showOrgContent: true,
                orgId: '',
                deptId: '',
                tab: 'tree'
            }
        } else {
            // 没有组织时，不显示遮罩，显示占位符
            organizationState.value = {
                showOrgContent: false,
                orgId: '',
                deptId: '',
                tab: 'tree'
            }
        }
    }

    currentFunction.value = newFunction
    console.log(`切换到功能: ${newFunction}`)

    // 重新检测移动端状态（但不强制重置布局模式）
    checkIsMobile()

    if (newFunction === 'rooms') {
        handleRefreshRooms()

        /*
        if (workspaceManagerRef.value) {
            await nextTick()
            workspaceManagerRef.value.addPanel('chat', 'Chat', '聊天', {})
        }

        */
    }



    // 切换功能时，频道侧边栏只在需要中间列表时自动展开，否则自动收起
    if (!functionsNeedingMiddleList.includes(newFunction)) {
        isChannelSidebarCollapsed.value = true
        console.log('当前功能不需要频道列表，已自动收起')
    } else {
        isChannelSidebarCollapsed.value = false
        console.log('当前功能需要频道列表，已自动展开')
    }
}

// 处理登出
const handleLogout = async () => {
    // 退出但保留用户名，清除访问令牌（UserLoginOut内部已处理localStorage清除）
    matrixClient.UserLoginOut(true)  // true表示保留用户名

    // 清除自动登录完成标识
    sessionStorage.removeItem('auto_login_completed')

    // 清除 Store 数据
    const organizationStore = useOrganizationStore()
    organizationStore.clear()

    const taskStore = useTaskStore()
    taskStore.clearTaskList()

    const assistantSidebarStore = useAssistantSidebarStore()
    assistantSidebarStore.clear()

    const marketStore = useMarketStore()
    marketStore.clear()

    // 跳转到登录页
    const router = await import('@/router')
    router.default.push('/login')
}


// 打开设备验证弹窗
const openDeviceVerification = () => {
    console.log('打开设备验证弹窗')
    if (deviceVerificationRef.value) {
        deviceVerificationRef.value.openVerification()
    }
}


// 初始化聊天页面
const initializeChat = async () => {
    try {
        // 设置消息监听
        messageService.设置消息监听器((message: MatrixMessage) => {
            // 检查消息是否已存在，避免重复添加
            const existingMessage = messages.value.find(msg => msg.eventId === message.eventId)
            if (!existingMessage) {
                messages.value.push(message)
            //    console.log('[V2] 添加新消息:', message.eventId)
            } else {
              //  console.log('[V2] 消息已存在，跳过:', message.eventId)
            }
        })

        // 等待一小段时间确保Matrix客户端完全初始化
        await new Promise(resolve => setTimeout(resolve, 500))

        // 获取房间列表，如果为空则重试
        await retryRefreshRooms()

        console.log('聊天页面初始化完成')
    } catch (err: any) {
        console.error('聊天页面初始化失败：', err)
    }
}


// 重试刷新房间列表的方法
const retryRefreshRooms = async (maxRetries = 3) => {
    let retryCount = 0

    while (retryCount < maxRetries) {
        handleRefreshRooms()

        if (rooms.value.length > 0) {
            console.log(`成功获取到 ${rooms.value.length} 个房间`)
            return
        }

        retryCount++
        if (retryCount < maxRetries) {
            console.log(`房间列表为空，等待重试 (${retryCount}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }

    if (rooms.value.length === 0) {
        console.warn('多次重试后仍无法获取房间列表，可能Matrix客户端未完全同步')
    }
}



// 处理选择房间
const handleSelectRoom = async (roomId: string) => {


   


    handleRefreshRooms()

    console.log(`\n[MainPage] handleSelectRoom called with roomId: ${roomId}`)

    currentRoomId.value = roomId

    const assistantId = assistantSidebarStore.assistantRoomId || null
    const taskStore = useTaskStore()
    const isTaskRoom = taskStore.taskRoomIds.includes(roomId)
    const extraBotRooms = assistantSidebarStore.noTaskButUserBotRoomIds || []
    // AI 助手范围：唤醒房间 / 任务房间 / 补漏的专属bot房间（保持 UI 原逻辑）
    const isAssistantScope = (assistantId && roomId === assistantId) || isTaskRoom || extraBotRooms.includes(roomId)

    // 通用判断：基于房间成员特征判断是否需要唤醒 Bot
    // 规则：2人房 + 包含自己 + 对方ID以bot结尾
    let isGenericBotRoom = false
    try {
        // 获取完整成员列表（包括 invite 状态），因为 roomService.获取房间成员 只返回 join 的
        const roomObj = roomService.获取房间详情(roomId)
        let members: any[] = []
        if (roomObj && typeof roomObj.getMembers === 'function') {
            members = roomObj.getMembers()
        } else {
            members = roomService.获取房间成员(roomId)
        }

        if (Array.isArray(members)) {
            const activeMembers = members.filter((m: any) => m.membership === 'join' || m.membership === 'invite')
            const memberIds = Array.from(new Set(activeMembers.map((m: any) => m.userId)))

            if (memberIds.length === 4 ) {
              const result = await Secretary("0")
                console.log('-----------------------[MainPage]启动唤醒秘书', result)
            }
        }
    } catch (e) {
        console.warn('[MainPage] 检查房间成员失败:', e)
    }

    const shouldEnsureBotInstance = isAssistantScope || isGenericBotRoom



    // 只在状态变化时才调用 setAssistantActive，避免重复触发
    if (assistantSidebarStore.isAssistantRoomActive !== isAssistantScope) {
        console.log('[MainPage] 调用 setAssistantActive:', isAssistantScope)
        assistantSidebarStore.setAssistantActive(Boolean(isAssistantScope))

        console.log('[MainPage] setAssistantActive 后:', {
            isAssistantRoomActive: assistantSidebarStore.isAssistantRoomActive,
            manualMode: assistantSidebarStore.manualMode,
            currentPanel: assistantSidebarStore.currentPanel
        })
    } else {
        console.log('[MainPage] 跳过 setAssistantActive（状态未变化）')
    }

    // 仅用于 API：四类房间均触发 EnsureBotInstance；UI 激活状态仍只看三类
    if (shouldEnsureBotInstance) {
        try {
            console.log('[MainPage EnsureBotInstance ] 调用 EnsureBotInstance API')
            //const botInstanceResult = await EnsureBotInstance(roomId)
            const botInstanceResult = await EnsureBotInstanceV2(roomId)
            console.log('[MainPage EnsureBotInstance ] EnsureBotInstance 结果:', botInstanceResult)
        } catch (error) {
            console.error('[MainPage EnsureBotInstance ] EnsureBotInstance 调用失败:', error)
        }
    }


    const botInstanceResult = await EnsureBotInstanceV2(roomId)
    console.log('[MainPage EnsureBotInstance ] EnsureBotInstance 结果:', botInstanceResult)



    // 查找房间信息
    const room = rooms.value.find(r => r.roomId === roomId)
    console.log('Selected room info:', {
        roomId,
        room,
        roomsCount: rooms.value.length,
        roomName: room?.name
    })

    // 移动端：选择房间后切换到内容模式
    if (isMobile.value && currentFunctionNeedsMiddleList.value) {
        switchToContentMode()
    }

    // 加载房间历史消息
    const roomMessages = await messageService.获取房间历史消息(roomId)

    // 清除当前房间的旧消息，添加历史消息
    messages.value = messages.value.filter(msg => msg.roomId !== roomId)
    messages.value.push(...roomMessages)

    console.log(`已加载房间 ${roomId} 的 ${roomMessages.length} 条历史消息`)
    console.log('当前消息列表:', messages)

    try {
        await matrixClient.markAsRead(roomId)
        console.log(`已请求将房间 ${roomId} 标记为已读`)

        if (room) {
            const updatedRoom: MatrixRoom = {
                ...room,
                unreadCount: 0
            }

            const updatedRooms = rooms.value.map(existing =>
                existing.roomId === roomId ? updatedRoom : existing
            )

            rooms.value = updatedRooms
        }
    } catch (error) {
        console.warn(`标记房间 ${roomId} 为已读失败:`, error)
    }

    syncAssistantSidebarState()
}



// 处理加入房间
const handleJoinRoom = async (roomIdOrAlias: string) => {
    try {
        await roomService.加入房间(roomIdOrAlias)
        console.log("成功加入房间：", roomIdOrAlias)
        handleRefreshRooms()
    } catch (err: any) {
        console.error("加入房间失败：", err)
        openMessageDialog("加入房间失败，请检查房间ID是否正确")
    }
}

// 处理刷新房间列表
const handleRefreshRooms = () => {
    // rooms.ts 中的 获取房间列表() 已经处理了房间类型分类和空间归属关系
    rooms.value = roomService.获取房间列表()

    console.log('刷新房间列表完成，房间数量:', rooms.value.length)
    syncAssistantSidebarState()
    // 轻微防抖后触发一次补漏扫描
    scheduleScanNoTaskBotRooms(400)
    scheduleScanJustThirdAgentRooms(500)
}

// 处理空间变化事件
const handleSpaceChanged = (spaceId: string) => {
    console.log('空间切换:', spaceId)
    currentSpaceId.value = spaceId
}






// 右侧列表（NewRightContentList 的动态组件）在移动端触发选择房间或智能体时
// 需要将 newroomsMobileMode 切换到 'chat' 并调用已有的切换房间逻辑（handleSelectRoom / handleAgentSelect）
const onRightPanelSelectRoom = async (roomId: string) => {
    try {
        if (isMobile.value) {
            newroomsMobileMode.value = 'chat'
            currentFunction.value = 'MessagePage'
            await handleSelectRoom(roomId)
        } else {
            await handleSelectRoom(roomId)
        }
    } catch (e) {
        console.warn('onRightPanelSelectRoom 处理失败:', e)
    }
}

const onRightPanelAgentSelect = async (agent: any) => {
    try {
        if (isMobile.value) {
            newroomsMobileMode.value = 'chat'
            currentFunction.value = 'MessagePage'
            await handleAgentSelect(agent)
        } else {
            await handleAgentSelect(agent)
        }
    } catch (e) {
        console.warn('onRightPanelAgentSelect 处理失败:', e)
    }
}

const handleCreateRoom = (spaceId: string) => {
    console.log('打开创建房间弹窗，空间ID:', spaceId)
    showCreateRoomDialog.value = true
}

const handleRoomCreated = (roomId: string) => {
    console.log('房间创建成功:', roomId)
    handleSelectRoom(roomId)
    handleRefreshRooms()
}




// 处理智能体选择事件
const handleAgentSelect = async (agent: any) => {
    console.log('选中智能体:', agent)
    BySwitchRoom.value = true

    try {
        if (!agent.username) {
            console.warn('智能体用户信息不完整')
            return
        }

        // 构建用户ID - 通常是 @username:domain 格式
        let currentUserId = userInfoManager.getLoginField("username")

        if (currentUserId.startsWith('@')) {
            // 如果当前用户ID以@开头，说明是完整的Matrix ID
            console.log('当前用户ID是完整的Matrix ID:', currentUserId)
        } else {
            // 否则，构建完整的Matrix ID
            const domain = MATRIX_SERVER_URL
            currentUserId = `@${currentUserId}:${domain}`
            console.log('构建的当前用户ID:', currentUserId)
        }

        const agentUserId = `@${agent.username}:${MATRIX_SERVER_URL}`
        // const agentUserId = `@lumine:${MATRIX_SERVER_URL}`

        console.log(`当前用户ID: ${currentUserId}`)
        console.log(`智能体用户ID: ${agentUserId}`)

        // 使用房间匹配器查找对应的房间
        const roomId = await findRoomByUserIds([currentUserId, agentUserId])

        if (roomId && roomId !== "未匹配到!") {
            // 找到房间，切换到该房间
            console.log(`找到房间: ${roomId}，准备切换`)
            await handleSelectRoom(roomId)

            // 确保切换到聊天功能
            if (currentFunction.value !== 'MessagePage') {
                currentFunction.value = 'MessagePage'
            }

            console.log(`已切换到与智能体 ${agent.nickname || agent.username} 的聊天房间`)
        } else {
            console.log('未找到与该智能体的聊天房间')
            openMessageDialog('未找到与该智能体的聊天房间')
        }
    } catch (error) {
        console.error('处理智能体选择时出错:', error)
        openMessageDialog('切换到智能体聊天时出错')
    } finally {
        BySwitchRoom.value = false
    }
}







// 处理组织下拉选择器相关事件
const handleOpenOrganizationDropdown = async (data: any) => {
    // 每次打开下拉列表前，先调用API获取最新组织数据
    await getOrganizationList()

    // 从 userInfoManager 获取最新的组织列表数据
    const orgList = userInfoManager.getPersonalInfo('ORGANIZATION') || []

    const currentOrg = userInfoManager.getPersonalInfo('CURRENTORGANIZATION') || null

    organizationDropdownData.value = {
        allOrgs: orgList,
        currentOrg,
        triggerElement: data.triggerElement
    }
    console.log(' MainPage: 打开组织选择下拉列表', {
        触发元素: data.triggerElement,
        组织列表: orgList,
        当前组织: currentOrg
    })
    showOrganizationDropdown.value = true
}

const closeOrganizationDropdown = () => {
    showOrganizationDropdown.value = false
}



function handleOrganizationSelected(org: any) {
    console.log(' MainPage: 收到组织选择事件', org)
    org.application_id = removePrefixSuffix(org.application_id, "!", MATRIX_SERVER_URL_TAIL)
    console.log(' MainPage: 处理后的组织ID', org)
//    userInfoManager.addField('CURRENTORGANIZATION', org)


    // saveUserBotMapping()


    currentOrganization.value = org
    showOrganizationDropdown.value = false
    console.log(' MainPage: 组织选择完成', {
        设置的组织: org,
        当前组织变量: currentOrganization.value,
        用户信息管理器中的组织: userInfoManager.getPersonalInfo('CURRENTORGANIZATION')
    })
}

// 处理发送消息
const handleSendMessage = async (
    messageContent?: string | { plainText: string; htmlText: string; hasMentions: boolean },
    replyToEventId?: string,
) => {
    // 如果传入了消息内容，使用传入的；否则使用当前的 newMessage
    const messageToSend = messageContent || newMessage.value.trim()

    console.log('MainPage handleSendMessage:', {
        messageContent,
        messageToSend,
        currentRoomId: currentRoomId.value,
        newMessage: newMessage.value
    })

    if (!messageToSend || !currentRoomId.value) {
        console.warn('发送消息取消:', { messageToSend, currentRoomId: currentRoomId.value })
        return
    }

    sending.value = true
    try {
        await messageService.发送文本消息(currentRoomId.value, messageToSend, undefined, {
            replyToEventId,
        })
        console.log("消息发送成功：", messageToSend)

        if (replyToEventId && replyInputManager.state.eventId === replyToEventId) {
            replyInputManager.clearReplyTarget()
        }

        // 如果使用的是 newMessage，清空它；如果是传入的参数，不需要清空（InputArea会自己清空）
        if (!messageContent) {
            newMessage.value = ''
        }
    } catch (err: any) {
        console.error("发送消息失败：", err)
        openMessageDialog(err.message || "发送消息失败")
    } finally {
        sending.value = false
    }
}




// 获取当前房间名称
const getCurrentRoomName = () => {
    const room = rooms.value.find(r => r.roomId === currentRoomId.value)
  /*  console.log('getCurrentRoomName:', {
        currentRoomId: currentRoomId.value,
        rooms: rooms.value.length,
        foundRoom: room,
        roomName: room ? room.name : currentRoomId.value
    })*/
    return room ? room.name : currentRoomId.value
}

const getUserInitials = () => {
    if (!userId || typeof userId !== 'string') {
        return 'U'
    }
    const displayName = resolveUserDisplayName({ matrixId: userId, matrixDisplayName: null })
    const initial = (displayName || '').trim().charAt(0)
    return initial ? initial.toUpperCase() : 'U'
}

// 拖拽调整大小相关方法
const FUNCTION_RESIZE_DRAG_THRESHOLD = 28


const startResize = (event: MouseEvent, type: 'channel' | 'function') => {
    if (type === 'function' && isMobile.value) {
        return
    }

    event.preventDefault()
    isResizing.value = true
    resizeType.value = type
    resizeStartX.value = event.clientX

    if (type === 'channel') {
        channelResizeStartWidth.value = channelSidebarBaseWidth.value
    } else if (type === 'function') {
        functionResizeStartMode.value = functionSidebarMode.value
    }

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
}


const handleResize = (event: MouseEvent) => {
    if (!isResizing.value || !resizeType.value) return

    const delta = event.clientX - resizeStartX.value

    if (resizeType.value === 'channel') {
        const minWidth = 180
        const maxWidth = 600
        const newWidth = channelResizeStartWidth.value + delta
        channelSidebarBaseWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth))
    } else if (resizeType.value === 'function') {
        if (Math.abs(delta) < FUNCTION_RESIZE_DRAG_THRESHOLD) {
            functionSidebarMode.value = functionResizeStartMode.value
        } else if (delta < 0) {
            functionSidebarMode.value = 'compressed'
        } else {
            functionSidebarMode.value = 'expanded'
        }
    }
}


const stopResize = () => {
    isResizing.value = false
    resizeType.value = null

    // 移除全局事件监听
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)

    // 恢复样式
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
}



function handleShowInfoPage(applicationId: string, source: string) {
    marketInfoParams.value = { applicationId, source }
    currentFunction.value = 'marketInfo'
}

function handleMarketInfoPageClose() {
    // 根据 source 参数决定返回到哪个页面
    const source = marketInfoParams.value?.source
    marketInfoParams.value = null

    if (source === 'my-apps') {
        currentFunction.value = 'workbench'  // 返回到工作台
    } else {
        currentFunction.value = 'market'     // 返回到智能体市场
    }
}



async function handleAutoCreateRoom(roomId: string) {
    BySwitchRoom.value = true
    loadingMessage.value = '正在进入房间...'
    try {
        // 这里可以直接跳转到房间
        await handleSelectRoom(roomId)
        currentFunction.value = 'MessagePage'
        // 或弹窗、消息提示等其它业务
        console.log('MainPage 收到自动创建房间事件，房间ID:', roomId)
    } finally {
        BySwitchRoom.value = false
    }
}



// 当前聊天的Agent信息
const currentAgentInfo = ref<{ agentID: string; applicationId: string } | null>(null)
console.log(' MainPage - currentAgentInfo 初始化:', currentAgentInfo.value)




const handleUserProfileQuickChat = async (userId: string, nickname?: string) => {
    console.log('用户资料卡快速聊天:', userId, '昵称:', nickname)

    BySwitchRoom.value = true
    loadingMessage.value = '正在发起对话...'


    try {
        // 1. 获取当前用户ID
        let currentUserId1 = userInfoManager.getLoginField("username");
        if (!currentUserId1) {
            console.error('无法获取当前用户ID');
            return;
        }


        currentUserId1 = addPrefixSuffix(currentUserId1, "@", MATRIX_SERVER_URL_TAIL);
        // 处理目标用户ID
        let userid1;
        if (!userId.includes('@') || !userId.includes(':')) {
            const serverDomain = currentUserId1.includes(':') ? currentUserId1.split(':')[1] : MATRIX_SERVER_URL_TAIL;
            userid1 = addPrefixSuffix(userId, "@", `:${serverDomain}`);
        } else {
            userid1 = userId; // 如果已经是完整格式，直接使用
        }



        // 2. 搜索是否已存在与该用户的房间
        const targetUserIds = [currentUserId1, userid1];
        console.log('搜索房间参数:', targetUserIds);

        // 导入房间匹配器

        const existingRoomId = await findRoomByUserIds(targetUserIds);

        if (existingRoomId && existingRoomId !== "未匹配到!") {
            console.log('找到已存在的房间:', existingRoomId);



            try {
                currentFunction.value = 'MessagePage'
                await handleSelectRoom(existingRoomId)



                /*
                if (workspaceManagerRef.value) {
                    await nextTick()
                    workspaceManagerRef.value.addPanel('chat', 'Chat', '聊天', {})
                }

                */
                // 尽可能刷新房间列表以保持UI同步
                handleRefreshRooms()
                return
            } catch (err) {
                console.warn(' existingRoomId 切换房间失败，回退到匹配逻辑:', err)
                // 继续后续匹配逻辑
            }
        }








        console.log('未找到已存在的房间，开始创建新房间...');

        // 3. 如果没有找到房间，自动创建一个新房间

        // 构建房间创建参数
        const pureUserId = removePrefixSuffix(userId, "@", MATRIX_SERVER_URL_TAIL)
        const roomName = nickname || pureUserId // 优先使用昵称，否则使用用户名
        const roomOptions = {
            // name: roomName, // 使用昵称或用户名作为房间名称
            //  topic: `与${roomName}的私人对话`, // 房间主题也使用昵称或用户名
            visibility: 'private' as const, // 私有房间
            encryption: false, // 不启用端到端加密
            invites: [], // 先创建房间，稍后再邀请用户（如果用户账号存在的话）
            historyVisibility: 'invited' as const, // 历史消息对被邀请者可见
            joinRule: 'invite' as const, // 仅邀请加入
            guestAccess: 'forbidden' as const, // 禁止访客
            belongSpace: addPrefixSuffix(currentOrganization.value?.application_id || 'default', "!", MATRIX_SERVER_URL_TAIL) // 使用原始的应用ID作为空间ID
        };

        console.log('创建房间参数:', roomOptions);

        // 调用创建不加密房间的方法
        const newRoom = await roomCreateServiceV2.创建不加密的房间(roomOptions);
        console.log('房间创建成功:', newRoom);

        // 5. 尝试邀请用户进入房间
        try {
            console.log('尝试邀请用户进入房间:', userid1);
            await inviteManagementServiceV2.邀请用户(newRoom.roomId, userid1, `邀请 ${roomName} 加入对话`);
            console.log('用户邀请成功:', userid1);
        } catch (inviteError) {
            console.warn('邀请用户失败，但房间创建成功:', inviteError);
            // 邀请失败不影响主流程，用户仍可进入房间
        }

        // 6. 创建成功后跳转到房间
        currentFunction.value = 'MessagePage'
        await handleSelectRoom(newRoom.roomId)

        // 确保WorkspaceManager中有Chat选项卡

        /*
        if (workspaceManagerRef.value) {
            await nextTick()
            workspaceManagerRef.value.addPanel('chat', 'Chat', '聊天', {})
        }
            */

        // 刷新房间列表
        handleRefreshRooms()

    } catch (error) {
        console.error('创建房间失败:', error);
    } finally {
        BySwitchRoom.value = false
    }

    // 关闭（全局入口）资料卡
    hideUserProfileCard()

}





// 注册全局资料卡的“快速对话”回调，桥接到当前页面的实现
// 注意：此注册不影响本页本地的 <UserProfileCard>，仅用于全局入口（如 TheBestSearch）弹出的资料卡
setUserProfileCardQuickChatHandler((uid: string, nick?: string) => {
    void handleUserProfileQuickChat(uid, nick)
})



async function handleTalkRequestFromOrganizationList(userid: string, createdRoomId?: string) {
    console.log('接收到来自组织列表的对话请求:', userid, 'createdRoomId:', createdRoomId)

    BySwitchRoom.value = true
    loadingMessage.value = '正在切换房间...'

    const rawTargetUser = userid
    const targetUserCanonical = addPrefixSuffix(removePrefixSuffix(rawTargetUser, '@', MATRIX_SERVER_URL_TAIL), '@', MATRIX_SERVER_URL_TAIL)

    // 如果子组件直接提供了刚创建的房间ID，优先使用它，避免依赖客户端同步导致的延迟
    if (createdRoomId) {
        try {
            currentFunction.value = 'MessagePage'

            // [修复] 刚创建的房间可能因成员列表未同步导致 handleSelectRoom 无法识别为 Bot 房间
            // 因此这里手动触发一次 EnsureBotInstance，并传入明确的目标用户 ID
            EnsureBotInstanceV2(createdRoomId, [targetUserCanonical]).catch(e => console.warn('[handleTalkRequestFromOrganizationList] 手动触发 EnsureBotInstanceV2 失败', e));
          
           
          
          
            await handleSelectRoom(createdRoomId)

            /*
            if (workspaceManagerRef.value) {
                await nextTick()
                workspaceManagerRef.value.addPanel('chat', 'Chat', '聊天', {})
            }

            */
            // 尽可能刷新房间列表以保持UI同步
            handleRefreshRooms()
            BySwitchRoom.value = false
            return
        } catch (err) {
            console.warn('使用子组件传入的 createdRoomId 切换房间失败，回退到匹配逻辑:', err)
            // 继续后续匹配逻辑
        }
    }
    else{
         console.log('经过多次重试仍未找到与该对象的聊天房间')
    }


    /*
    try {
        // 先切换到 rooms 功能
        currentFunction.value = 'MessagePage'

        // 规范化当前用户 ID 与目标用户 ID，确保都是完整的 Matrix ID：@user:domain




        const wechatStore = useWechatStore();
        const loginUsername = wechatStore.userProfile?.username || '';
        const self = await GetIMUserInfo(loginUsername);


        const selfIM = self.data?.im;


        const targetUserIds = [selfIM, targetUserCanonical];

        if (!userid.endsWith("bot")) {
            // 若不是以 bot 结尾的简写，尝试获取并加入对应的 bot 用户名
              const botid1 = getBotUsernameByUser(userid)
              const botid2 = getBotUsernameByUser(removePrefixSuffix(rawCurrentUser, '@', MATRIX_SERVER_URL_TAIL))
              if (botid1) {
                  targetUserIds.push(addPrefixSuffix(removePrefixSuffix(botid1, '@', MATRIX_SERVER_URL_TAIL), '@', MATRIX_SERVER_URL_TAIL))
              }
              if (botid2) {
                  targetUserIds.push(addPrefixSuffix(removePrefixSuffix(botid2, '@', MATRIX_SERVER_URL_TAIL), '@', MATRIX_SERVER_URL_TAIL))
              }
                  
        }

        console.log(`用于匹配的用户ID列表: ${JSON.stringify(targetUserIds)}`)

        // 等待一小段时间，给后端或客户端同步成员状态的时间
        console.log('等待5秒以确保后端成员状态同步...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 重试机制：多次尝试查找房间
        let roomId: string | null = null
        const maxRetries = 5
        const retryDelay = 1000 // 1秒延迟

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(` 第 ${attempt} 次尝试查找房间...`)

            // 每次尝试前都刷新房间列表
            handleRefreshRooms()
            await new Promise(resolve => setTimeout(resolve, retryDelay))

            // 清除房间匹配器缓存，确保获取最新数据（使用规范化后的 ID 列表）
            const roomMatcher = await import('@/utils/roomMatcher2')
            try {
                roomMatcher.roomMatcher2.clearCache()
            } catch (e) {
                console.warn('clearCacheFor 调用失败或参数不匹配，忽略并继续：', e)
            }

            // 尝试查找房间
            const foundRoomId = await findRoomByUserIds2(targetUserIds)

            if (foundRoomId && foundRoomId !== "未匹配到!") {
                roomId = foundRoomId
                console.log(` 第 ${attempt} 次尝试成功找到房间: ${roomId}`)
                break
            }

            console.log(` 第 ${attempt} 次尝试未找到房间，${attempt < maxRetries ? '继续重试...' : '已达到最大重试次数'}`)
        }

        if (roomId) {
            // 设置当前房间并确保 WorkspaceManager 有 Chat 选项卡
            await handleSelectRoom(roomId)
            
                        if (workspaceManagerRef.value) {
                            await nextTick()
                            workspaceManagerRef.value.addPanel('chat', 'Chat', '聊天', {})
                        }
                            
        } else {
            console.log('经过多次重试仍未找到与该对象的聊天房间')
        }
    } catch (error) {
        console.error('处理对象对话请求时出错:', error)
    }


    */
    BySwitchRoom.value = false
}








// 处理从Market_Information_Page来的对话请求
const handleAgentTalkRequest = async (agentID: string, applicationId: string) => {
    console.log('接收到Agent对话请求:', agentID)

    BySwitchRoom.value = true
    loadingMessage.value = '正在进入对话...'

    // 更新当前Agent信息
    currentAgentInfo.value = { agentID, applicationId }
    console.log(' MainPage - 已更新currentAgentInfo:', currentAgentInfo.value)
    console.log(' MainPage - currentAgentInfo ref 引用:', currentAgentInfo)

    try {
        // 1. 切换到WorkspaceManager (rooms功能)
        currentFunction.value = 'MessagePage'

        // 2. 先刷新房间列表，确保能获取到刚创建的房间
        console.log(' 刷新房间列表以获取最新房间...')

        // 3. 构建用户ID进行房间匹配
        const finalagentID = addPrefixSuffix(agentID, '@', MATRIX_SERVER_URL_TAIL)
        let currentUserId = userInfoManager.getLoginField("username")
        const finalcurrentUserId = addPrefixSuffix(currentUserId, '@', MATRIX_SERVER_URL_TAIL)

        console.log(`当前用户ID: ${finalcurrentUserId}`)
        console.log(`智能体用户ID: ${finalagentID}`)

        // 4. 重试机制：多次尝试查找房间
        let roomId = null
        const maxRetries = 5
        const retryDelay = 1000 // 1秒延迟

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(` 第 ${attempt} 次尝试查找房间...`)

            // 每次尝试前都刷新房间列表
            handleRefreshRooms()
            await new Promise(resolve => setTimeout(resolve, retryDelay))

            // 清除房间匹配器缓存，确保获取最新数据
            const roomMatcher = await import('@/utils/roomMatcher')
            roomMatcher.roomMatcher.clearCacheFor([finalcurrentUserId, finalagentID])

            // 尝试查找房间
            const foundRoomId = await findRoomByUserIds([finalcurrentUserId, finalagentID])

            if (foundRoomId && foundRoomId !== "未匹配到!") {
                roomId = foundRoomId
                console.log(` 第 ${attempt} 次尝试成功找到房间: ${roomId}`)
                break
            }

            console.log(` 第 ${attempt} 次尝试未找到房间，${attempt < maxRetries ? '继续重试...' : '已达到最大重试次数'}`)
        }

        if (roomId && roomId !== "未匹配到!") {
            // 5. 设置当前房间ID
            await handleSelectRoom(roomId)

            // 6. 确保WorkspaceManager中有Chat选项卡
            /*
            if (workspaceManagerRef.value) {
                await nextTick()
                // 通过WorkspaceManager添加Chat面板，传递agentID和applicationId参数
                workspaceManagerRef.value.addPanel('chat', 'Chat', '聊天', {
                    agentID,
                    applicationId
                })
            }
                */

            console.log(`已切换到与智能体的聊天房间: ${roomId}`)
        } else {
            console.log('经过多次重试仍未找到与该智能体的聊天房间')

        }
    } catch (error) {
        console.error('处理Agent对话请求时出错:', error)
    } finally {
        BySwitchRoom.value = false
    }
}



// 处理从Market_Information_Page来的开发请求
const handleAgentDevelopRequest = async (agentID: string, applicationId: string) => {
    console.log('接收到Agent开发请求:', { agentID, applicationId })

    BySwitchRoom.value = true
    loadingMessage.value = '正在准备开发环境...'

    // 更新当前Agent信息
    currentAgentInfo.value = { agentID, applicationId }
    console.log(' MainPage - handleAgentDevelopRequest 已更新currentAgentInfo:', currentAgentInfo.value)

    try {
        // 1. 先执行对话请求的逻辑（切换到rooms并打开chat）
        await handleAgentTalkRequest(applicationId, agentID)

        // 2. 额外添加Agent_DIY选项卡
        /*
        if (workspaceManagerRef.value) {
            await nextTick()
            // 添加Agent_DIY面板，并传入必要的参数
            const agentDiyProps = {
                agentID,
                applicationId,
                mode: 'development'
            }
            workspaceManagerRef.value.addPanel('agent_diy', 'Agent_DIY', '智能体 DIY', agentDiyProps)
        }
            */

        console.log('已为智能体开发打开Chat和Agent_DIY选项卡')
    } catch (error) {
        console.error('处理Agent开发请求时出错:', error)
        openMessageDialog('打开智能体开发环境时出错')
    } finally {
        BySwitchRoom.value = false
    }
}





// 提供聊天上下文给所有子组件
const chatContextValue = {
    // 状态数据 - 直接提供refs，避免不必要的computed包装
    currentRoomId: currentRoomId,
    roomName: computed(() => getCurrentRoomName()),
    message: newMessage,
    sending: sending,
    messages: currentRoomMessages,
    currentUserId: computed(() => userId),
    replyInput: replyInputManager,
    rooms: rooms,

    // Agent信息
    currentAgentInfo: currentAgentInfo,

    // 方法
    sendMessage: handleSendMessage,
    logout: handleLogout,  // 添加logout方法到context中
    setCurrentRoom: async (roomId: string) => {
        // 如果是移动端且处于 MessagePage 功能，进入 mobile chat 视图
        if (isMobile.value && currentFunction.value === 'MessagePage') {
            newroomsMobileMode.value = 'chat'
        }
        await handleSelectRoom(roomId)
    },  // 设置当前房间
    goBack: () => {
        currentRoomId.value = ''  // 清空当前房间，返回房间列表
    },
    refreshRoomData: async () => {
        handleRefreshRooms()  // 刷新房间数据
        await handleSelectRoom(currentRoomId.value)  // 重新选择当前房间以刷新消息
    },
    getFunctionSidebarCollapsed: () => isFunctionSidebarCollapsed.value,
    setFunctionSidebarCollapsed: (collapsed: boolean) => setFunctionSidebarCollapsed(collapsed),

    // 调试chatContext数据
    debug: () => {
        console.log('MainPage - chatContext debug:', {
            currentRoomId: currentRoomId.value,
            roomName: getCurrentRoomName(),
            roomsCount: rooms.value.length,
            messagesCount: currentRoomMessages.value.length,
            userId: userId
        })
    },

    // 打开用户资料卡方法（统一到全局入口）
    openUserProfileCard: (userId: string) => showUserProfileCard(userId),
    setReplyTarget: replyInputManager.setReplyTarget,
    clearReplyTarget: replyInputManager.clearReplyTarget,
}

// 标注当前是否处于 newrooms 的移动端聊天聚焦状态
Object.assign(chatContextValue, {
    isMobile: computed(() => isMobile.value),
    isInNewroomsMobileChat: computed(() => isMobile.value && currentFunction.value === 'MessagePage' && newroomsMobileMode.value === 'chat'),
    // 供子组件调用以回退到列表视图
    exitNewroomsMobile: () => {
        newroomsMobileMode.value = 'list'
    },
    enterNewroomsMobile: (roomId?: string) => {
        newroomsMobileMode.value = 'chat'
        if (roomId) {
            handleSelectRoom(roomId)
        }
    }
})

console.log(' MainPage - 创建chatContext:', {
    chatContextValue,
    currentAgentInfo: currentAgentInfo,
    currentAgentInfoValue: currentAgentInfo.value
})

provide('chatContext', chatContextValue)


provide('currentRoomId', readonly(currentRoomId))


</script>





<style scoped>
/* 页面加载遮罩样式 */
.page-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-color-secondary, #ffffff);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    transition: opacity 0.3s ease;
}

.loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}

.loading-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(88, 101, 242, 0.2);
    border-top-color: var(--color-primary, #5865f2);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-text {
    color: var(--text-color, #2c2f33);
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.5px;
}

/* 主题切换按钮样式 */
.theme-toggle-btn {
    position: fixed;
    right: 32px;
    bottom: 64px;
    z-index: 9999;
    width: 48px;
    height: 48px;
    background: var(--bg-color-secondary);
    color: var(--text-color);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    border: 2px solid var(--border-color);
    transition: background 0.3s, color 0.3s;
}

.theme-toggle-btn:hover {
    background: var(--color-primary);
    color: #fff;
}





/* Discord风格布局 */
.matrix-chat-app {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-color-third);
    color: var(--text-color);
    width: 100%;

}

.discord-layout {
    display: flex;
    height: 100%;
    gap: 5px;
    /* Web端组件间距 */
}

/* 移动端视口适配 */
@media (max-width: 768px) {
    .matrix-chat-app {
        /* 使用视口高度减去浏览器顶部URL框和底部分页栏的高度 */
        height: 100%;
        /* 减去顶部44px和底部48px */
        /* 设置左右边距px */
        padding: 8px 8px;
        /* 确保内容不会超出视口 */
        overflow: hidden;
        /* 设置最小高度，避免内容过小 */
        min-height: calc(100vh - 44px - 48px);

    }

    .discord-layout {
        height: 100%;
        gap: 10px;
        /* 移动端组件间距 */
    }
}

/* 左侧功能栏 - 只保留布局相关样式 */
.function-sidebar {

    margin-right: 1px;
    margin-left: 0;
    transition: width 0.3s ease;
    overflow: hidden;
    position: relative;
    z-index: 3;
    min-width: 0;
    flex-shrink: 0;

    border-right: 1px solid var(--bg-color-fifth);



    /* 允许完全收缩 */
}

.function-sidebar--compact {
    display: flex;
}

/* 悬浮切换按钮容器 */
.floating-toggles {
    position: fixed;
    top: 0;
    left: 3.5px;
    width: 100%;
    height: 100%;
    pointer-events: none;
    /* 让容器不阻挡鼠标事件 */
    z-index: 1000;
}

/* 单个悬浮按钮 */
.floating-toggle {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    background-color: rgba(88, 101, 242, 0.9);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    /* 圆角由JavaScript动态设置 */
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 600;
    user-select: none;
    pointer-events: auto;
    /* 恢复按钮的鼠标事件 */
    /* box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);
    */
    backdrop-filter: blur(4px);
}

/* 移除悬浮动画效果 */
/* .floating-toggle:hover {
    width: 32px;
    background-color: rgba(71, 82, 196, 0.95);
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.4);
    transform: translateY(-50%) translateX(var(--hover-direction, 2px));
} */

/* 功能栏按钮样式 */
.floating-toggle.function-toggle {
    background-color: rgba(124, 124, 124, 0);
}

/* 移除红色按钮悬浮效果 */
/* .floating-toggle.function-toggle:hover {
    background-color: rgba(194, 62, 65, 0.95);
} */

/* 频道列表按钮样式 */
.floating-toggle.channel-toggle {
    background-color: rgba(124, 124, 124, 0.9);
}

/* 移除绿色按钮悬浮效果 */
/* .floating-toggle.channel-toggle:hover {
    background-color: rgba(59, 165, 93, 0.95);
} */

.logout-btn:hover {
    background-color: #c23e41;
}

/* 中间频道/功能区域 */
.channel-sidebar {
    margin: 10px;
    margin-left: 2.5px;
    margin-right: 2.5px;
    background-color: var(--bg-color-third);

    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    overflow: hidden;
    position: relative;
    z-index: 2;
    min-width: 0;
    /* 允许完全收缩 */
}

/* 移动端时中间列表使用flex: 1占用剩余宽度 */
@media (max-width: 768px) {
    .channel-sidebar[style*="width: auto"] {
        flex: 1 !important;
        width: auto !important;
    }
}

/* 拖拽分隔条样式 */
.resizer {
    width: 2px;
    /*   background-color: var(--color-secondary);*/
    cursor: col-resize;
    position: relative;
    transition: background-color 0.2s ease;
}

.resizer::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -3px;
    right: -3px;
}

.function-resizer {
    width: 2px;
}



.NewRightContent {

    display: flex;
    flex-direction: column;
    min-width: 0;

    padding: 0px 0 0px 0;
    flex: 1 1 auto;
}

.NewRightContent__inner {

    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    background: var(--bg-color-secondary);
    border-radius: 8px;
    overflow: hidden;
}

.NewRightContent__body {

    flex: 1;
    min-height: 0;
    display: flex;
}

.NewRightContent--list-collapsed {
    flex: 1;
}


.NewRightContentList {
    --new-right-list-width: clamp(260px, 24vw, 360px);
    display: flex;
    flex-direction: column;
    min-width: 0;
    margin: 10px 0 10px 0;
    padding: 0 10px 0 5px;
    flex: 0 0 var(--new-right-list-width);
    max-width: var(--new-right-list-width);
    transition: flex-basis 0.3s ease, max-width 0.3s ease, padding 0.3s ease, margin 0.3s ease, opacity 0.25s ease;
}

.NewRightContentList__inner {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: 12px;
    opacity: 1;
    transition: opacity 0.2s ease;
}

.NewRightContentList--collapsed {
    flex-basis: 0 !important;
    max-width: 0 !important;
    padding: 0;
    margin: 10px 0;
    opacity: 0;
    pointer-events: none;
    overflow: hidden;
}

.NewRightContentList--collapsed .NewRightContentList__inner {
    opacity: 0;
}

.discord-layout:has(> .NewRightContent) {
    align-items: stretch;
}

.main-chat-area:has(+ .NewRightContent) {
    display: none;
}

@media (max-width: 768px) {

    .NewRightContent,
    .NewRightContentList {
        flex: 1 1 100%;
        width: 100%;
        max-width: 100%;
    }

    .NewRightContentList {
        margin-top: 12px;
    }

    .NewRightContentList--collapsed {
        margin: 0;
    }
}

.resizer:hover {
    background-color: var(--color-secondary);
}

.resizer:active {
    background-color: var(--color-secondary);
}

.channels-view,
.function-view {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.channels-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-color-secondary);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.header-content {
    flex: 1;
}

.function-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-color-secondary);
}

.channels-header h3,
.function-header h3 {
    margin: 0 0 8px 0;
    color: var(--text-color);
    font-size: 16px;
    font-weight: 600;
}

.user-id {
    font-size: 12px;
    color: var(--text-color-secondary);
}

.function-content {
    flex: 1;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

/* 右侧主聊天区域 */
.main-chat-area {

    margin: 10px;
    margin-left: 5px;
    margin-right: 5px;
    width: calc(100% - 39px);
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--workspace-bg);
    position: relative;
    padding: 10px;
    border-radius: 5px;
}

.right-content-head {
    position: relative;
    width: 100%;
    min-height: 40px;
    /* 从48px缩小到40px */
    display: flex;
    align-items: center;
    background: var(--workspace-bg);
}


.chat-view {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.chat-header {
    height: 40px;
    /* 从48px缩小到40px */
    padding: 0 12px;
    /* 从0 16px缩小到0 12px */
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-color-secondary);
}

.chat-header h4 {
    margin: 0;
    color: var(--text-color);
    font-size: 16px;
    font-weight: 600;
}

.chat-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.room-id {
    font-size: 12px;
    color: var(--text-color-secondary);
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    /* 从16px缩小到12px */
    background-color: var(--bg-color-secondary);
}

.message-input-area {
    padding: 16px;
    background-color: var(--bg-color-secondary);
}

.message-input {
    display: flex;
    gap: 8px;
    background-color: var(--border-color);
    border-radius: 8px;
    padding: 12px;
}

.message-input input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-color);
    font-size: 14px;
    outline: none;
}

.message-input input::placeholder {
    color: var(--text-color-secondary);
}

.send-button {
    padding: 8px 16px;
    background-color: var(--color-primary);
    color: var(--text-color);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s ease;
}

.send-button:hover:not(:disabled) {
    background-color: var(--color-primary-hover, #4752c4);
}

.send-button:disabled {
    background-color: var(--color-secondary, #4f545c);
    cursor: not-allowed;
}

.no-room-selected {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.welcome-message {
    max-width: 400px;
}

.welcome-message h2 {
    margin: 0 0 16px 0;
    color: var(--text-color);
    font-size: 24px;
    font-weight: 600;
}

.welcome-message p {
    margin: 0;
    color: var(--text-color-secondary);
    font-size: 16px;
    line-height: 1.5;
}

/* 移动端布局样式 */
.discord-layout.mobile-layout {
    position: relative;
    /* 移动端时确保布局占满可用空间 */
    height: 100%;
}

/* 在移动端时，确保显示的组件占满宽度 */
.discord-layout.mobile-layout .function-sidebar,
.discord-layout.mobile-layout .channel-sidebar,
.discord-layout.mobile-layout .main-chat-area {
    /* 移除 width: 100% !important，让JavaScript的内联样式生效 */
    margin: 0 !important;
    /* 移除 flex: 1 !important，让固定宽度生效 */
    /* flex: 1 !important; */
    /* 移动端时移除内边距，避免内容超出 */
    padding: 0 !important;
}

/* 移动端时确保功能侧边栏保持固定宽度 */
.discord-layout.mobile-layout .function-sidebar {
    flex-shrink: 0 !important;
    flex-basis: auto !important;
}

/* 移动端时隐藏分隔条 */
.discord-layout.mobile-layout .resizer {
    display: none !important;
}

/* 移动端时调整侧边栏样式 */
@media (max-width: 768px) {

    .channel-sidebar {
        margin: 0 !important;
        padding: 0 !important;
    }

    /* 移动端右侧内容区保持与左侧功能列表相同的边距并居中 */
    .main-chat-area {
        margin: 0 !important;
        padding: 8px !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: stretch !important;
        gap: 8px;
        flex: 1 1 auto;
        box-sizing: border-box;
        /* 确保内容区在移动端时能够正确显示内部组件 */
        min-height: calc(100vh - 44px - 48px - 16px);
    }

    .main-chat-area :deep(.workspace-manager) {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .main-chat-area :deep(.workspace-grid) {
        min-height: 0;
    }


}

/* 移动端返回按钮 */
.mobile-back-btn {
    position: absolute;

    z-index: 10;
    background: var(--bg-color-third);
    color: var(--text-color);
    padding: 8px 12px;
    border-radius: 6px;

    border: 1px solid var(--border-color);
    transition: background-color 0.2s ease;
}

.mobile-back-btn:hover {
    background: var(--bg-color-hover);
}

/* 移动端时调整返回按钮位置 */
@media (max-width: 768px) {
    .mobile-back-btn {
        top: 8px;
        left: 8px;
        padding: 6px 10px;
        font-size: 13px;
    }

    /* 确保聊天区域在移动端时正确显示 */
    .chat-view {
        height: 100%;
        overflow: hidden;
    }

    /* 调整消息容器在移动端时的样式 */
    .messages-container {
        flex: 1;
        overflow-y: auto;

        /* 确保消息容器不会超出可用空间 */
        max-height: calc(100vh - 44px - 48px - 100px);
        /* 减去顶部、底部和输入区域，从120px缩小到100px */
    }

    /* 调整输入区域在移动端时的样式 */
    .message-input-area {

        background-color: var(--bg-color-secondary);
        /* 确保输入区域固定在底部 */
        flex-shrink: 0;
    }

    /* 调整右侧内容头部在移动端时的样式 */
    .right-content-head {
        min-height: 36px;
        /* 从44px缩小到36px */
        padding: 6px 10px;
        /* 从8px 12px缩小到6px 10px */
    }
}
</style>
