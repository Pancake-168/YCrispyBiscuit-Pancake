<template>
    <div class="org-views-container">
        <!-- 顶部工具栏：面包屑 + 视图切换 -->
        <div class="views-header" ref="headerRef" @wheel="handleWheel">
            <OrgBreadcrumb :items="breadcrumbs" @nav-click="handleBreadcrumbNav" />

            <div class="header-actions">
                <button class="action-btn" @click="onShowOrgDetail">组织详情</button>
                <button class="action-btn" @click="onShowDeptDetail" :disabled="!currentDeptId">部门详情 </button>
                <button class="action-btn" @click="handleCreateDepartment" :disabled="!currentDeptId">创建部门 </button>

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
                @show-detail="handleShowDetail" />
            <OrgTreeView v-else :root-node="currentRootNode" @node-click="handleTreeNodeClick" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useOrganizationStore } from '@/stores/organization';
import { storeToRefs, getActivePinia } from 'pinia';
import type { OrgNode } from '@/types/organization';
import OrgListView from './OrgListView/index.vue';
import OrgBreadcrumb from './OrgBreadcrumb/index.vue';
import OrgTreeView from './OrgTreeView/index.vue';
import { fetchDepartmentDetail, fetchAllOrgTrees, getBotUsernameByUser } from '@/services/Project/Organization/data/defaultData';
import { openCreateDepartmentDialog } from '@/components/NewOrganizationAndDepartment/CreateDepartmentDialog/open';
import { userInfoManager } from '@/utils/userInfo';
import { addPrefixSuffix, removePrefixSuffix } from '@/utils/stringUtils';
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls';
import { findRoomByUserIds } from '@/utils/roomMatcher';
import { roomCreateServiceV2 } from '@/services/rooms/room-create.service';
import { inviteManagementServiceV2 } from '@/services/members/invite.service';

const emit = defineEmits(['show-department', 'show-organization', 'talk-request-from-organization-list']);

// Store
const store = useOrganizationStore();
const { currentOrganization, flatDeptMaps, orgTrees } = storeToRefs(store);

// State
const viewMode = ref<'list' | 'tree'>('list');
const currentDeptId = ref<string>(''); // 空字符串表示根目录
const headerRef = ref<HTMLElement | null>(null);

// Computed: 当前显示的列表项 (列表视图用)
const currentItems = computed(() => {
    const appId = currentOrganization.value?.application_id;
    if (!appId) return [];

    if (!currentDeptId.value) {
        // 根目录：直接返回组织树的第一层
        return orgTrees.value.get(appId) || [];
    } else {
        // 子部门：从扁平索引中查找
        const flatMap = flatDeptMaps.value.get(appId);
        const node = flatMap?.get(currentDeptId.value);
        return node?.children || [];
    }
});

// Computed: 当前树的根节点 (树状视图用)
// 树状视图始终显示完整的组织树，从根开始
const currentRootNode = computed(() => {
    const appId = currentOrganization.value?.application_id;
    if (!appId) return null;

    const roots = orgTrees.value.get(appId);
    // 假设第一个节点是组织根节点
    return roots && roots.length > 0 ? roots[0] : null;
});

// Computed: 面包屑路径
const breadcrumbs = computed(() => {
    const appId = currentOrganization.value?.application_id;
    if (!appId) return [];

    const path: { id: string, name: string }[] = [];
    const flatMap = flatDeptMaps.value.get(appId);

    if (!currentDeptId.value) {
        // 根层级，显示组织名称
        if (currentOrganization.value) {
            path.push({ id: '', name: currentOrganization.value.application_name });
        }
    } else {
        // 递归查找父级
        let curr = flatMap?.get(currentDeptId.value);
        while (curr) {
            path.unshift({ id: curr.id, name: curr.name });
            if (curr.parentId && flatMap?.has(curr.parentId)) {
                curr = flatMap.get(curr.parentId);
            } else {
                curr = undefined;
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

async function handleItemClick(item: OrgNode) {
    if (item.type === 'department' || item.type === 'org') {
        // 每次点击都获取最新详情（包含人员）
        await fetchDepartmentDetail(item.id);
        // 进入下级
        currentDeptId.value = item.id;
    } else if (item.type === 'person') {
        if (item.username) {
            await TalkWithTargetAccount(item.username, item.nickname || item.name);
        }
    }
}

function handleShowDetail(item: OrgNode) {
    if (item.type === 'department') {
        emit('show-department', item.id);
    } else if (item.type === 'org') {
        emit('show-organization', item.id);
    }
}

function handleBreadcrumbNav(id: string) {
    currentDeptId.value = id;
}

function onShowOrgDetail() {
    if (currentOrganization.value?.application_id) {
        emit('show-organization', currentOrganization.value.application_id);
    }
}

function onShowDeptDetail() {
    if (currentDeptId.value) {
        emit('show-department', currentDeptId.value);
    }
}

function handleCreateDepartment() {
    const appId = currentOrganization.value?.application_id;
    if (!appId) return;

    const parentId = parseInt(currentDeptId.value || currentRootNode.value?.id || '0');

    openCreateDepartmentDialog({
        appid: appId,
        parentDepartmentId: parentId,
        pinia: getActivePinia()!,
        onCreated: async (name) => {
            // 刷新当前视图的数据
            const targetId = currentDeptId.value || currentRootNode.value?.id;
            if (targetId) {
                await fetchDepartmentDetail(targetId);
            }
            // 强制刷新整个组织树，以确保新创建的部门出现在结构中
            await fetchAllOrgTrees(true, store);
        }
    });
}

// 树节点点击处理：点击树节点时，切换列表视图到该部门，并自动切回列表模式（可选）
// 或者保持在树模式，但更新面包屑状态
async function handleTreeNodeClick(nodeId: string) {
    console.log('Tree node clicked:', nodeId);

    // 获取详情
    await fetchDepartmentDetail(nodeId);

    // 更新当前选中的部门ID，这样面包屑和列表视图状态都会同步
    currentDeptId.value = nodeId;

    // 需求：点哪个部门就显示哪个部门的下一层
    // 如果用户希望点击树节点后，右侧列表变成该部门的下一层，那么这里只需要更新 currentDeptId
    // 如果用户希望点击后直接切回列表视图查看详情，可以取消下面这行的注释
    // viewMode.value = 'list';
}













async function TalkWithTargetAccount(userid: string, username: string) {
  if (!userid) return;

  // 动态获取当前用户ID
  const loginUsername = userInfoManager.getLoginField('username')
  const currentUserId = loginUsername ? removePrefixSuffix(loginUsername, '@', MATRIX_SERVER_URL_TAIL) : ''

  if (!currentUserId) {
    console.warn('无法获取当前用户ID，无法发起对话');
    return;
  }

  const pureId = removePrefixSuffix(userid, "@", MATRIX_SERVER_URL_TAIL);
  if (pureId.endsWith('bot')) {
    // 处理与bot的对话逻辑
    const targetUserIds = [addPrefixSuffix(currentUserId, "@", MATRIX_SERVER_URL_TAIL), addPrefixSuffix(pureId, "@", MATRIX_SERVER_URL_TAIL)];
    const existingRoomId = await findRoomByUserIds(targetUserIds);

    if (existingRoomId && existingRoomId !== "未匹配到!") {
      console.log('找到已存在的房间:', existingRoomId);
      // 通过emit事件通知父组件
      console.log('emit talk-request-from-organization-list', pureId)
      emit('talk-request-from-organization-list', pureId);
      return;
    }

    const roomName = username || pureId;
    const roomOptions = {
      name: roomName,
      topic: `与${roomName}的私人对话`,
      visibility: 'private' as const,
      encryption: false,
      invites: [],
      historyVisibility: 'invited' as const,
      joinRule: 'invite' as const,
      guestAccess: 'forbidden' as const,
      ...(currentOrganization.value?.application_id ? { belongSpace: addPrefixSuffix(currentOrganization.value.application_id, '!', MATRIX_SERVER_URL_TAIL) } : {})
    };

    // 调用创建不加密房间的方法
    const newRoom = await roomCreateServiceV2.创建不加密的房间(roomOptions);

    try {
      await inviteManagementServiceV2.邀请用户(newRoom.roomId, addPrefixSuffix(pureId, "@", MATRIX_SERVER_URL_TAIL), `邀请 ${roomName} 加入对话`);
    } catch (inviteError) {
      console.warn('邀请智能体失败，但房间创建成功:', inviteError);
    }

    console.log('emit talk-request-from-organization-list', pureId, newRoom.roomId)
    emit('talk-request-from-organization-list', pureId, newRoom.roomId);

  } else {
    const botid1 = getBotUsernameByUser(pureId)
    const botid2 = getBotUsernameByUser(currentUserId)

    const targetUserIds = [addPrefixSuffix(currentUserId, "@", MATRIX_SERVER_URL_TAIL), addPrefixSuffix(pureId, "@", MATRIX_SERVER_URL_TAIL)];
    if (botid1) targetUserIds.push(addPrefixSuffix(removePrefixSuffix(botid1, '@', MATRIX_SERVER_URL_TAIL), "@", MATRIX_SERVER_URL_TAIL));
    if (botid2) targetUserIds.push(addPrefixSuffix(removePrefixSuffix(botid2, '@', MATRIX_SERVER_URL_TAIL), "@", MATRIX_SERVER_URL_TAIL));

    const existingRoomId = await findRoomByUserIds(targetUserIds);

    if (existingRoomId && existingRoomId !== "未匹配到!") {
      console.log('找到已存在的房间:', existingRoomId);
      console.log('emit talk-request-from-organization-list', pureId)
      emit('talk-request-from-organization-list', pureId);
      return;
    }

    const roomName = username || pureId;
    const roomOptions = {
      // name: roomName,
      // topic: `与${roomName}的私人对话`,
      visibility: 'private' as const,
      encryption: false,
      invites: [],
      historyVisibility: 'invited' as const,
      joinRule: 'invite' as const,
      guestAccess: 'forbidden' as const,
      ...(currentOrganization.value?.application_id ? { belongSpace: addPrefixSuffix(currentOrganization.value.application_id, '!', MATRIX_SERVER_URL_TAIL) } : {})
    };

    const newRoom = await roomCreateServiceV2.创建不加密的房间(roomOptions);

    try {
      await inviteManagementServiceV2.邀请用户(newRoom.roomId, addPrefixSuffix(pureId, "@", MATRIX_SERVER_URL_TAIL), `邀请 ${roomName} 加入对话`);
      if (botid1) await inviteManagementServiceV2.邀请用户(newRoom.roomId, addPrefixSuffix(removePrefixSuffix(botid1, '@', MATRIX_SERVER_URL_TAIL), "@", MATRIX_SERVER_URL_TAIL), `邀请 ${botid1} 加入对话`);
      if (botid2) await inviteManagementServiceV2.邀请用户(newRoom.roomId, addPrefixSuffix(removePrefixSuffix(botid2, '@', MATRIX_SERVER_URL_TAIL), "@", MATRIX_SERVER_URL_TAIL), `邀请 ${botid2} 加入对话`);
    } catch (inviteError) {
      console.warn('邀请智能体失败，但房间创建成功:', inviteError);
    }

    console.log('emit talk-request-from-organization-list', pureId, newRoom.roomId)
    emit('talk-request-from-organization-list', pureId, newRoom.roomId);

  }
}















// 监听组织切换，重置视图
watch(() => currentOrganization.value?.application_id, () => {
    currentDeptId.value = '';
});

onMounted(() => {
    // 打印 Map 内容以验证对象引用
    console.log('=== Organization Data Debug ===');
    console.log('OrgTrees (Hierarchical):', orgTrees.value);
    console.log('FlatDeptMaps (Flat Index):', flatDeptMaps.value);
});

</script>

<style scoped>
.org-views-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    gap: var(--space-md);
    /* 使用 gap 替代 margin */
}

.views-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-xs);
    flex-shrink: 0;
    background-color: var(--bg-color-third);
    /* 支持横向滚动 */
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    gap: var(--space-md);
    /* 隐藏滚动条 (Firefox) */
    scrollbar-width: none;
    /* 优化移动端滚动体验 */
    -webkit-overflow-scrolling: touch;
}

/* 隐藏滚动条 (Chrome, Safari, Edge) */
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
    padding: 4px 12px;
    border: 1px solid transparent;
    background: var(--bg-color-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--text-color);
    transition: all 0.2s;
    /* 移除过大的 min-width，改用更合理的宽度或由内容决定 */
    min-width: 80px;
}

@media (max-width: 600px) {
    .action-btn {
        min-width: auto;
        padding: 4px 8px;
        font-size: var(--font-size-xs);
    }
}

.action-btn:hover:not(:disabled) {
    background: var(--bg-color-hover);
    color: var(--color-primary);
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.view-switcher {
    display: flex;
    gap: 4px;
    background: var(--bg-color-secondary);
    padding: 2px;
    border-radius: var(--border-radius-md);
}

.switch-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--text-color-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.2s;
}

.switch-btn:hover {
    color: var(--text-color);
    background: var(--bg-color-hover);
}

.switch-btn.active {
    color: var(--color-primary);
    background: var(--bg-color-third);
    box-shadow: var(--shadow-xs);
}

.views-content {
    flex: 1;
    overflow: hidden;
    /* 确保内部滚动 */
    background: var(--bg-color-secondary);
    /* 给列表一个背景容器 */
    border-radius: var(--border-radius-lg);
    padding: var(--space-sm);
    /* 内部留白 */
}

.tree-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-color-secondary);
}
</style>
