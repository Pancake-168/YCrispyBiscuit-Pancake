<template>
	<div class="MainPage" :class="mainPageClass" @touchstart.passive="onTouchStart"
		@touchmove.passive="onTouchMove" @touchend.passive="onTouchEnd">


		<div v-if="appStore.isLoading" class="page-loading-overlay">
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">{{ appStore.loadingText }}</div>
            </div>
        </div>


		<div v-show="showTopFunctionList" class="PageList" :class="pageListClass">
			<FunctionList :mobile-compact="isMobileViewport" />
		</div>
		<div v-if="showDrawerMask" class="DrawerMask" @click="closeDrawer"></div>

		<div class="PageContent">
			<div class="MainPageContent">
				<div class="PageHeader" v-show="showPageHeader">
					<PageHeader />
				</div>
				<MessagePage v-show="systemStore.currentFunction === 'Message'" />
				<MissionPage v-show="systemStore.currentFunction === 'Mission'" />
				<OrganizationPage v-show="systemStore.currentFunction === 'Organization'" />
			
				<AIAdminPage v-show="systemStore.currentFunction === 'AIAdmin'" />
				<SystemMapPage v-show="systemStore.currentFunction === 'SystemMap'" />
				<SettingsPage v-show="systemStore.currentFunction === 'Settings'" />
			</div>
		</div>
	</div>


	<OrganizationDropdown @create-new-organization-dialog="handleOpenCreateOrganizationDialog" />
	<CreateOrganizationDialog v-model="createOrganizationDialogVisible"
		@submit-success="handleCreateOrganizationSuccess" @submit-error="handleCreateOrganizationError" />




</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount, onMounted } from 'vue'
import { sleep } from '@/utils/sleep'
import { startProject } from '@/services/ProjectStart'
import { useSystemStore } from '@/stores/System'
import { useSidebarStore } from '@/stores/sidebar'
import { UserInfo } from '@/services/Project/SSO/UserInfo'
import { initOrganization } from '@/services/ProjectStart'
import { useAppStore } from '@/stores/app'
import { useOrganizationStore } from '@/stores/Organization'
import { MOBILE_MAX_WIDTH } from '@/constants/breakpoints'


import FunctionList from '@/components/FunctionList'

import PageHeader from '@/components/PageHeader'
import MessagePage from '@/views/views/Pages/MessagePage'
import MissionPage from '@/views/views/Pages/MissionPage'
import AIAdminPage from '@/views/views/Pages/AIAdminPage'
import SystemMapPage from '@/views/views/Pages/SystemMapPage'
import SettingsPage from '@/views/views/Pages/SettingsPage'

import OrganizationPage from '@/views/views/Pages/OrganizationPage'
import OrganizationDropdown from '@/components/Organization/OrganizationDropdown'
import CreateOrganizationDialog from '@/components/Organization/CreateOrganizationDialog.vue'


const systemStore = useSystemStore()
const sidebarStore = useSidebarStore()
const appStore = useAppStore()
const organizationStore = useOrganizationStore()
const createOrganizationDialogVisible = ref(false)

const isDrawerMode = computed(() => appStore.functionListMode === 'drawer')
const isMobileViewport = ref(false)

const updateIsMobileViewport = () => {
	isMobileViewport.value = window.innerWidth <= MOBILE_MAX_WIDTH
}

const showTopFunctionList = computed(() => {
	if (!isMobileViewport.value) return true
	if (systemStore.currentFunction !== 'Message') return true
	return sidebarStore.messageMobilePanel === 'left'
})

const showPageHeader = computed(() => {
	if (!isMobileViewport.value) return true
	if (systemStore.currentFunction !== 'Message') return true
	return sidebarStore.messageMobilePanel === 'left'
})

const showDrawerMask = computed(() => isDrawerMode.value && sidebarStore.pageListOpen && showTopFunctionList.value)
const mainPageClass = computed(() => ({
	'drawer-open': isDrawerMode.value && sidebarStore.pageListOpen,
	'fixed-mode': appStore.functionListMode === 'fixed',
	'fixed-collapsed': appStore.functionListMode === 'fixed' && appStore.functionListCollapsed
}))
const pageListClass = computed(() => ({
	'is-open': isDrawerMode.value && sidebarStore.pageListOpen,
	'is-fixed': appStore.functionListMode === 'fixed',
	'is-collapsed': appStore.functionListMode === 'fixed' && appStore.functionListCollapsed,
	'is-mobile-compact': isMobileViewport.value
}))

function handleOpenCreateOrganizationDialog() {
	createOrganizationDialogVisible.value = true
}

function handleCloseCreateOrganizationDialog() {
	createOrganizationDialogVisible.value = false
}


const handleCreateOrganizationSuccess = async (data: any) => {
	console.log('[System:MainPage:handleCreateOrganizationSuccess]组织创建成功:', data)

	const createdOrgAppId = String(data ?? '').trim()

	appStore.setLoading(true, '正在刷新组织数据...')


	try {

		// 1. 重新获取用户信息 (更新 Apps 列表到 WechatStore 和 OrgStoreV2)
		console.log('[System:MainPage:handleCreateOrganizationSuccess] 等待2秒后开始刷新 UserInfo...');
		await sleep(2000); // 增加2秒等待，确保后端数据已就绪

		console.log('[System:MainPage:handleCreateOrganizationSuccess] 开始刷新 UserInfo...');

		// 确保使用最新的 UserInfo 接口逻辑
		await UserInfo();

		// 2. 重新初始化 V2 组织架构 (加载骨架等)
		console.log('[System:MainPage:handleCreateOrganizationSuccess] 开始重新初始化 V2 组织架构...');
		await initOrganization(); // 复用 Project_Start 逻辑

		// 3.切换至新组织
		if (createdOrgAppId) {
			const targetOrg = organizationStore.organizationList.find(
				(item) => String(item.app_id) === createdOrgAppId
			)

			if (targetOrg) {
				organizationStore.switchOrganization(targetOrg)

				systemStore.setCurrentFunction('Organization')
				console.log('[System:MainPage:handleCreateOrganizationSuccess] 已切换到新组织:', createdOrgAppId)
			} else {
				console.warn('[System:MainPage:handleCreateOrganizationSuccess] 未在组织列表中找到新组织:', createdOrgAppId)
			}
		}



	} catch (e) {
		console.log('[System:MainPage:handleCreateOrganizationSuccess] 刷新组织数据失败:', e)
	} finally {
		appStore.setLoading(false)
		handleCloseCreateOrganizationDialog()
	}
}


const handleCreateOrganizationError = (error: any) => {
	console.log('[System:MainPage:handleCreateOrganizationError] 组织创建失败:', error)
	// 这里可以显示错误提示
}



/**
 * 抽屉状态控制函数内容区开始
 */
// 左侧抽屉的状态
function openDrawer() {
	sidebarStore.openPageList()
}

function closeDrawer() {
	sidebarStore.closePageList()
}



let touchStartX = 0
let touchCurrentX = 0
let touching = false

function onTouchStart(event: TouchEvent) {
	if (!isDrawerMode.value) return
	const touch = event.touches?.[0]
	if (!touch) return
	touchStartX = touch.clientX
	touchCurrentX = touch.clientX
	// 仅在左边缘或抽屉已开时响应
	const edgeZone = 124
	touching = sidebarStore.pageListOpen || touchStartX <= edgeZone
}

function onTouchMove(event: TouchEvent) {
	if (!isDrawerMode.value) return
	if (!touching) return
	const touch = event.touches?.[0]
	if (!touch) return
	touchCurrentX = touch.clientX
}

function onTouchEnd() {
	if (!isDrawerMode.value) return
	if (!touching) return
	const deltaX = touchCurrentX - touchStartX
	const openThreshold = 60
	const closeThreshold = -60
	if (deltaX > openThreshold) {
		openDrawer()
	} else if (deltaX < closeThreshold) {
		closeDrawer()
	}
	touching = false
}
/**
 * 抽屉状态控制函数内容区结束
 */


onMounted(async () => {
	updateIsMobileViewport()
	window.addEventListener('resize', updateIsMobileViewport)
	await startProject()
})

onBeforeUnmount(() => {
	window.removeEventListener('resize', updateIsMobileViewport)
})



</script>

<style scoped>
.MainPage {
	position: relative;
	width: 100%;
	height: 100%;
	min-height: 0;
	overflow: hidden;
	background: transparent;
}

.MainPage.fixed-mode {
	display: flex;
	flex-direction: row;
}



/* 页面加载遮罩样式 */
.page-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
	background: var(--bg-color);
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
	gap: var(--space-lg);
}

.loading-spinner {
    width: 60px;
    height: 60px;
	border: 4px solid var(--hover-bg);
	border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-text {
	color: var(--text-color);
	font-size: var(--font-base);
    font-weight: 500;
    letter-spacing: 0.5px;
}




.PageList {
	position: fixed;
	top: 0;
	left: 0;
	height: 100%;
	width: clamp(120px, 22vw, 240px);

	min-width: 80px;
	background: var(--glass-bg);
	backdrop-filter: var(--glass-blur);
	-webkit-backdrop-filter: var(--glass-blur);
	border-right: var(--glass-border);

	transform: translateX(-100%);
	transition: transform 0.25s ease;
	z-index: 20;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.MainPage.fixed-mode .PageList {
	position: relative;
	transform: translateX(0);
	z-index: 1;
	width: max-content;
	max-width: min(32vw, 320px);
	min-width: 120px;
	height: 100%;
	transition: width 0.25s ease;
}

.MainPage.fixed-mode.fixed-collapsed .PageList {
	width: 56px;
	max-width: 56px;
	min-width: 56px;
}

.PageList.is-mobile-compact {
	width: 56px;
	max-width: 56px;
	min-width: 56px;
}

/* 抽屉打开态：在 MainPage 上加 drawer-open 类 */
.MainPage.drawer-open .PageList,
.PageList.is-open {
	transform: translateX(0);
}

.PageContent {
	position: relative;
	height: 100%;
	width: 100%;
	display: flex;
	min-width: 0;
}

.MainPage.fixed-mode .PageContent {
	flex: 1;
	width: auto;
}


.MainPageContent {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	overflow: hidden;
}


.DrawerMask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.35);
	backdrop-filter: blur(2px);
	z-index: 15;
}

.DrawerToggle {
	min-width: 64px;
	align-self: flex-start;
}

.PageHeader {
	flex: 0 0 auto;
	height: 48px;

	background: var(--glass-bg);
	border: var(--glass-border);

}


@media (max-width: 768px) {
	.PageList {
		width: min(80vw, 320px);
	}

	.MainPage.fixed-mode .PageList {
		width: 56px;
		max-width: 56px;
		min-width: 56px;
	}

	.PageContainer {
		grid-template-columns: 1fr;
		grid-template-rows: minmax(180px, 1fr) minmax(240px, 2fr) minmax(180px, 1fr);
	}
}

@media (max-width: 768px) {
	.DrawerToggle {
		min-width: 56px;
	}
}
</style>