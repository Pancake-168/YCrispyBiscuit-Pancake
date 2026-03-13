<template>
    <div class="org-views-container">
        <!-- 顶部工具栏：面包屑 + 视图切换 -->
        <div class="views-header" ref="headerRef" @wheel="handleWheel">
            <OrgBreadcrumb :items="breadcrumbs" @nav-click="handleBreadcrumbNav" />

            <div class="header-actions">
                <button class="action-btn" @click="onShowOrgDetail">组织详情</button>
                <button class="action-btn" @click="onShowDeptDetail" :disabled="!currentDeptId">详情</button>
                <button class="action-btn" @click="handleCreateDepartment"
                    :disabled="!currentDeptId || isPost">创建部门</button>
                <button class="action-btn" @click="handleCreatePost" :disabled="!currentDeptId || isPost">创建职位</button>
                <div class="view-switcher">
                    <button class="switch-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'"
                        title="列表视图">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M8 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M8 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M3 6H3.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M3 12H3.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M3 18H3.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </button>
                    <button class="switch-btn" :class="{ active: viewMode === 'tree' }" @click="viewMode = 'tree'"
                        title="树状视图">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12L12 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M12 12L4 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M12 12L20 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M12 3V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- 内容区域 -->
        <div class="views-content">
            <OrgListView v-if="viewMode === 'list'" :items="currentItems" @itemClick="handleItemClick"
                @show-detail="handleShowDetail" @user-talk="TalkWithTargetAccount" />
            <OrgTreeView v-else :root-node="currentRootNode" @node-click="handleTreeNodeClick" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useOrganizationStore } from '@/stores/Organization';
import { storeToRefs, getActivePinia } from 'pinia';
import type { OrgNodeV2 } from '@/types/Organization';
import OrgListView from './OrgListView/index.vue';
import OrgBreadcrumb from './OrgBreadcrumb/index.vue';
import OrgTreeView from './OrgTreeView/index.vue';
import { openCreateDepartmentDialog } from '@/components/Organization/CreateDepartmentDialog/open';
import { openCreatePostDialog } from '@/components/Organization/CreatePostDialog/open';
import { talkWithTargetAccount } from '@/composables/useTalkWithTargetAccount3';
import { refreshRoomState } from '@/services/Matrix/refreshRoomState';


const props = defineProps<{ focusDeptId?: string | null }>();
const emit = defineEmits(['show-department', 'show-organization']);

// Store V2
const store = useOrganizationStore();
const { currentOrganization, flatMaps, orgTrees } = storeToRefs(store);

// State
const viewMode = ref<'list' | 'tree'>('list');
const currentDeptId = ref<string>(''); // 空字符串表示根目录
const headerRef = ref<HTMLElement | null>(null);

// 外层删除节点后会带 parentId 回来，这里同步更新当前层级/面包屑
watch(
    () => props.focusDeptId,
    (next) => {
        if (next === undefined || next === null) return;
        currentDeptId.value = next;
    },
    { immediate: true }
);

// Computed: Helper to check if current level is a Post
const isPost = computed(() => {
    const appId = currentOrganization.value?.app_id;
    if (!appId || !currentDeptId.value) return false;
    const node = flatMaps.value.get(appId)?.get(currentDeptId.value);
    return node?.type === 'post';
});

// Computed: 当前显示的列表项 (列表视图用)
const currentItems = computed(() => {
    const appId = currentOrganization.value?.app_id;
    if (!appId) return [];

    if (!currentDeptId.value) {
        // 根目录
        return orgTrees.value.get(appId) || [];
    } else {
        // 子级
        const flatMap = flatMaps.value.get(appId);
        const node = flatMap?.get(currentDeptId.value);
        return node?.children || [];
    }
});

// Computed: 当前树的根节点
const currentRootNode = computed<OrgNodeV2 | null>(() => {
    const appId = currentOrganization.value?.app_id;
    if (!appId) return null;
    const roots = orgTrees.value.get(appId);
    return roots?.[0] ?? null;
});

// Computed: 面包屑路径
const breadcrumbs = computed(() => {
    const appId = currentOrganization.value?.app_id;
    if (!appId) return [];

    const path: { id: string, name: string }[] = [];

    // 如果没有 ID，显示组织名
    if (!currentDeptId.value) {
        if (currentOrganization.value) {
            path.push({ id: '', name: currentOrganization.value.name || "" });
        }
    } else {
        const flatMap = flatMaps.value.get(appId);
        let curr = flatMap?.get(currentDeptId.value);

        while (curr) {
            path.unshift({ id: curr.id, name: curr.name });
            if (curr.parentId && flatMap?.has(curr.parentId)) {
                curr = flatMap.get(curr.parentId);
            } else {
                curr = undefined;
            }
        }

        // 智能补全：如果路径顶端不是 "org" 节点，说明树根可能直接是一级部门，手动加上组织名作为 Root 链接
        // 这样可以保证用户总能导航回最外层的列表
        if (path.length > 0) {
            const topNodeId = path[0]?.id;
            const topNode = topNodeId ? flatMap?.get(topNodeId) : undefined;
            if (topNode && topNode.type !== 'org') {
                path.unshift({ id: '', name: currentOrganization.value?.name || '首页' });
            }
        }
    }
    return path;
});

// Methods
function handleWheel(e: WheelEvent) {
    if (!headerRef.value) return;
    if (headerRef.value.scrollWidth > headerRef.value.clientWidth) {
        if (e.deltaY !== 0) {
            headerRef.value.scrollLeft += e.deltaY;
            e.preventDefault();
        }
    }
}

// 核心点击处理逻辑
async function handleItemClick(item: OrgNodeV2) {
    const appId = currentOrganization.value?.app_id;
    if (!appId) return;

    if (item.type === 'department' || item.type === 'post' || item.type === 'org') {
        // 1. 懒加载检测（post 的人员加载逻辑与 SystemMap 对齐：点击就尝试加载，非 detail 才请求）
        if (item.type === 'post') {
            if (item.loadStatus !== 'detail') {
                await store.loadPostDetail(appId, item.id);
            }
        } else {
            if (item.loadStatus === 'skeleton') {
                await store.loadNodeDetail(appId, item.id);
            }
        }
        // 2. 进入列表
        currentDeptId.value = item.id;
    } else if (item.type === 'person') {

        console.log('[OrganizationV2] TODO: 发起对话', { userId: item.id, name: item.name, username: item.username });
        if (item.username) {
            await TalkWithTargetAccount(item.username);
        }

    }
}

function handleShowDetail(item: OrgNodeV2) {
    if (item.type === 'department' || item.type === 'post') {
        emit('show-department', item.id);
    } else if (item.type === 'org') {
        emit('show-organization', item.id);
    }
}

function handleBreadcrumbNav(id: string) {
    currentDeptId.value = id;
}

function onShowOrgDetail() {
    if (currentOrganization.value?.app_id) {
        emit('show-organization', currentOrganization.value.app_id);
    }
}

function onShowDeptDetail() {
    if (currentDeptId.value) {
        emit('show-department', currentDeptId.value);
    }
}

function handleCreateDepartment() {
    const appId = currentOrganization.value?.app_id;
    if (!appId) return;

    // 创建部门只能挂在某个部门/组织节点下（按钮本身已做 disabled 控制）
    const parentId = parseInt(currentDeptId.value || currentRootNode.value?.id || '1');
    const flatMap = flatMaps.value.get(appId);

    console.log('[CreateDepartment:precheck] context', {
        appId,
        currentDeptId: currentDeptId.value,
        currentRootNodeId: currentRootNode.value?.id,
        resolvedParentId: parentId,
        hasFlatMap: !!flatMap,
        parentExistsInFlatMap: flatMap ? flatMap.has(String(parentId)) : false,
        currentOrgName: currentOrganization.value?.name,
    });

    openCreateDepartmentDialog({
        appid: appId,
        parentDepartmentId: parentId,
        pinia: getActivePinia()!,
        onCreated: async () => {
            // 创建成功后刷新当前父节点的 children，让新部门立即出现在列表中
            const targetId = String(parentId);
            await store.loadNodeDetail(appId, targetId);
        }
    });
}

function handleCreatePost() {
    const appId = currentOrganization.value?.app_id;
    if (!appId) return;

    // 创建职位只能挂在某个部门/组织节点下（按钮本身已做 disabled 控制）
    const parentId = parseInt(currentDeptId.value || currentRootNode.value?.id || '1');

    openCreatePostDialog({
        appid: appId,
        parentDepartmentId: parentId,
        pinia: getActivePinia()!,
        onCreated: async () => {
            // 创建成功后刷新当前父节点的 children，让新职位立即出现在列表中
            const targetId = String(parentId);
            await store.loadNodeDetail(appId, targetId);
        }
    });
}




async function handleTreeNodeClick(item: OrgNodeV2) {
    // 树节点点击逻辑
    if (['department', 'post', 'org'].includes(item.type)) {
        const appId = currentOrganization.value?.app_id;
        if (appId) {
            if (item.type === 'post') {
                if (item.loadStatus !== 'detail') {
                    await store.loadPostDetail(appId, item.id);
                }
            } else if (item.loadStatus === 'skeleton') {
                await store.loadNodeDetail(appId, item.id);
            }
        }
        currentDeptId.value = item.id;
        // 保持在树视图？还是切回列表？用户习惯通常是点击树节点，右侧展示详情或子级列表
        // viewMode.value = 'list';
        return;
    }

    if (item.type === 'person' && item.username) {
        console.log('[OrganizationV2] : 发起对话（树节点）', { id: item.id, name: item.name, username: item.username });
        await TalkWithTargetAccount(item.username);
    }
}


















async function TalkWithTargetAccount(username: string) {
    if (!username) return;

    const roomId = await talkWithTargetAccount(username)

    // 新架构下不再依赖外层 MainPage 事件链，直接在本页完成“进入消息房间”
    if (roomId) {
        await refreshRoomState({
            showLoading: true,
            loadingText: '正在进入对话...',
            preferredRoomId: roomId,
        })
    }
}






















// 监听
watch(() => currentOrganization.value?.app_id, () => {
    currentDeptId.value = '';
});

onMounted(() => {
    const appId = currentOrganization.value?.app_id;
    // 如果树为空，可能需要初始化加载 (通常 App 初始化时已加载)
    console.log('V2 Org View Mounted', appId);
});

</script>

<style scoped>
.org-views-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    gap: var(--space-md);
}

.views-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-xs);
    flex-shrink: 0;
    background-color: var(--panel-bg);
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    gap: var(--space-md);
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
}

.views-header::-webkit-scrollbar {
    display: none;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-shrink: 0;
}

.action-btn {
    padding: var(--space-xs) var(--space-md);
    border: 1px solid transparent;
    background: var(--panel-bg);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--font-xs);
    color: var(--text-color);
    transition: all 0.2s;
    min-width: 80px;
}

@media (max-width: 768px) {
    .action-btn {
        min-width: auto;
        padding: var(--space-xs) var(--space-sm);
        font-size: var(--font-xs);
    }
}

.action-btn:hover:not(:disabled) {
    background: var(--hover-bg);
    color: var(--primary-color);
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.view-switcher {
    display: flex;
    gap: var(--space-xs);
    background: var(--panel-bg);
    padding: var(--space-xs);
    border-radius: var(--radius-md);
}

.switch-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s;
}

.switch-btn:hover {
    color: var(--text-color);
    background: var(--hover-bg);
}

.switch-btn.active {
    color: var(--primary-color);
    background: var(--panel-bg);
    box-shadow: var(--glass-shadow);
}

.views-content {
    flex: 1;
    overflow: hidden;
    background: var(--panel-bg);
    border-radius: var(--radius-lg);
    padding: var(--space-sm);
}

.tree-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
}
</style>
