<!-- pages/Organization/Department/index.vue -->
<template>
  <div class="department-info">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <button class="back-btn" @click="$emit('back')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        返回列表
      </button>
    </div>

    <!-- 基本信息框 -->
    <div class="basic-info">
      <div class="dept-left">
        <div class="dept-icon">
          <svg class="icon-svg" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
            focusable="false">
            <rect width="36" height="36" rx="18" fill="currentColor" fill-opacity="0.25" />
            <g clip-path="url(#clip0_dept_info)">
              <path
                d="M15 18C15 17.0572 15 16.5858 14.6583 16.2929C14.3166 16 13.7666 16 12.6667 16C11.5667 16 11.0168 16 10.675 16.2929C10.3333 16.5858 10.3333 17.0572 10.3333 18C10.3333 18.9428 10.3333 19.4142 10.675 19.7071C11.0168 20 11.5667 20 12.6667 20C13.7666 20 14.3166 20 14.6583 19.7071C15 19.4142 15 18.9428 15 18Z"
                stroke="currentColor" stroke-width="1.5" />
              <path
                d="M23.6667 13.3333C23.6667 12.3904 23.6667 11.919 23.3933 11.6261C23.1199 11.3333 22.68 11.3333 21.8 11.3333H20.8667C19.9867 11.3333 19.5467 11.3333 19.2734 11.6261C19 11.919 19 12.3904 19 13.3333C19 14.2761 19 14.7475 19.2734 15.0404C19.5467 15.3333 19.9867 15.3333 20.8667 15.3333H21.8C22.68 15.3333 23.1199 15.3333 23.3933 15.0404C23.6667 14.7475 23.6667 14.2761 23.6667 13.3333Z"
                stroke="currentColor" stroke-width="1.5" />
              <path
                d="M23.6667 22.6667C23.6667 21.7239 23.6667 21.2525 23.3933 20.9596C23.1199 20.6667 22.68 20.6667 21.8 20.6667H20.8667C19.9867 20.6667 19.5467 20.6667 19.2734 20.9596C19 21.2525 19 21.7239 19 22.6667C19 23.6096 19 24.081 19.2734 24.3739C19.5467 24.6667 19.9867 24.6667 20.8667 24.6667H21.8C22.68 24.6667 23.1199 24.6667 23.3933 24.3739C23.6667 24.081 23.6667 23.6096 23.6667 22.6667Z"
                stroke="currentColor" stroke-width="1.5" />
              <path
                d="M17 17.9994L17 20.6975C17 21.9468 17.6114 22.5078 19 22.6667M17 17.9994L17 15.3014C17 14.1231 17.5194 13.5057 19 13.3334M17 17.9994L15 17.9994"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </g>
            <defs>
              <clipPath id="clip0_dept_info">
                <rect width="16" height="16" fill="white" transform="translate(9 10)" />
              </clipPath>
            </defs>
          </svg>
        </div>
        <div class="details">
          <span class="dept-name">{{ titleName }}</span>
          <span class="dept-meta">{{ subtitleLine1 }}</span>
          <span class="dept-meta">{{ subtitleLine2 }}</span>
        </div>
      </div>
      <div class="actions">
        <div v-if="isDeptOnly" class="quit-option" @click="handleUpdateDepartment">
          <span class="quit-text">更新部门</span>
        </div>
        <div v-if="isDeptOnly" class="quit-option danger" @click="handleDeleteDepartment">
          <span class="quit-text">删除部门</span>
        </div>
        <div v-if="isPost" class="quit-option" @click="handleUpdatePost">
          <span class="quit-text">更新职位</span>
        </div>
        <div v-if="isPost" class="quit-option danger" @click="handleDeletePost">
          <span class="quit-text">删除职位</span>
        </div>
      </div>
    </div>

    <!-- 部门字段展示：仅部门节点展示 -->
    <div v-if="isDeptOnly" class="field-panel">
      <div class="field-row">
        <span class="field-label">名称</span>
        <span class="field-value">{{ currentNode?.name || '-' }}</span>
      </div>
      <div class="field-row">
        <span class="field-label">描述</span>
        <span class="field-value">{{ currentNode?.description || '-' }}</span>
      </div>
    </div>

    <!-- 列表区域：部门 -> 职位列表；职位 -> 人员列表 -->
    <div class="member-list-container">
      <div class="member-list-header">{{ listTitle }} ({{ listItems.length }})</div>
      <div class="member-list">
        <div v-if="loading" class="empty-state">
          <div class="empty-text">加载中...</div>
        </div>
        <div v-else-if="!listItems.length" class="empty-state">
          <div class="empty-text">暂无{{ isDepartment ? '职位' : '成员' }}</div>
        </div>
        <div v-else class="member-item" v-for="item in listItems" :key="item.id">
          <div class="member-avatar">
            <svg class="icon-svg" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%"
              height="100%" aria-hidden="true" focusable="false">
              <rect width="1024" height="1024" rx="512" fill="currentColor" fill-opacity="0.25" />
              <path
                d="M828.3 818.2c-8-66.8-31.8-129.9-68.7-182.4-31.8-45.2-72.1-81-117.7-104.6 27.5-20.6 49.7-47.2 64.9-78 19.6-39.6 26.4-84.2 19.7-128.8-6.5-43.2-26-83.2-56.4-115.7-30.6-32.7-69.2-54.7-111.9-63.6-15.7-3.3-31.5-4.9-47-4.9-58.2 0-112.9 22.7-154 63.8s-63.8 95.8-63.8 154c0 38.3 10.2 76 29.5 108.9 14.7 25 34.3 46.9 57.6 64.4-45.6 23.7-86 59.5-117.7 104.7-36.9 52.5-60.7 115.5-68.7 182.4-2 16.3 3.2 32.8 14.2 45.1 11.1 12.5 26.9 19.7 43.5 19.7h518.8c16.6 0 32.5-7.2 43.5-19.7 10.9-12.6 16.1-29.1 14.2-45.3zM429.2 586.4c20.1-8.5 33.6-27.3 35.2-49.2 1.5-21.8-9.2-42.4-28.1-53.7-45.2-27-72.2-74-72.2-125.6 0-81.1 65.9-147 147-147 10.6 0 21.5 1.1 32.5 3.4 57.6 12 103.9 61.6 112.8 120.6 9 60.3-18 117.3-70.4 148.7-18.8 11.2-29.5 31.7-28.1 53.7 1.6 21.9 15 40.7 35.2 49.2 84.6 35.7 146 121.6 162.5 225.6H266.4C283.3 708 344.8 622 429.2 586.4z"
                fill="currentColor" transform="translate(512, 512) scale(0.6) translate(-512, -512)"></path>
            </svg>
          </div>

          <div class="member-details">
            <span class="member-name">{{ item.name }}</span>
            <span class="member-role">{{ itemSecondaryText(item) }}</span>
          </div>
        </div>
      </div>
    </div>




  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useOrganizationStore } from '@/stores/Organization';
import { storeToRefs, getActivePinia } from 'pinia';
import type { OrgNodeV2 } from '@/types/Organization';
import { openUpdateDepartmentDialog } from '@/components/Organization/UpdateDepartmentDialog/open';
import { DeleteDepartmentV2 } from '@/services/Project/Organization/department';
import { DeleteOrganizationPostV2 } from '@/services/Project/Organization/Post';
import { openMessageDialog, openConfirmDialog } from '@/components/MessageDialog/open';
import { openSetPostDialog } from '@/components/Organization/SetPost/open';

const emit = defineEmits<{ (e: 'back', focusDeptId?: string): void }>();

// props 声明，接收部门ID
const props = defineProps<{ id: string }>();

// 使用 V2 Store
const store = useOrganizationStore();
const { currentOrganization, flatMaps } = storeToRefs(store);

// 响应式状态
const loading = ref(false);
const currentNode = ref<OrgNodeV2 | null>(null);

const isDepartment = computed(() => {
  const t = currentNode.value?.type;
  return t === 'department' || t === 'org';
});

const isDeptOnly = computed(() => currentNode.value?.type === 'department');

const isPost = computed(() => currentNode.value?.type === 'post');

// 动态计算
const titleName = computed(() => {
  if (loading.value) return '加载中...';
  return currentNode.value?.name || '未找到';
});

const subtitleLine1 = computed(() => {
  if (isDepartment.value) return '类型：部门';
  if (isPost.value) return '类型：职位';
  return '类型：未知';
});

const subtitleLine2 = computed(() => {
  const orgName = currentOrganization.value?.name || '未找到';
  if (isDepartment.value) return `所属组织：${orgName}`;
  if (isPost.value) return `所属组织：${orgName}`;
  return `所属组织：${orgName}`;
});

const listTitle = computed(() => (isDepartment.value ? '职位列表' : '成员列表'));

// 列表项：部门 -> 直属职位；职位 -> 直属人员
const listItems = computed((): OrgNodeV2[] => {
  const node = currentNode.value;
  if (!node) return [];

  if (isDepartment.value) {
    // 只展示直属职位，不跨级汇总人员
    return (node.children || []).filter(c => c.type === 'post');
  }

  if (isPost.value) {
    // 只展示该职位下的人员
    return (node.children || []).filter(c => c.type === 'person');
  }

  return [];
});

function itemSecondaryText(item: OrgNodeV2) {
  // 人员：description 里放了 @username
  if (item.type === 'person') return item.description || '';
  // 职位：展示描述（如果有）或空
  if (item.type === 'post') return item.description || '';
  return item.description || '';
}

// 加载部门信息逻辑
const loadNode = async (nodeId: string) => {
  if (!nodeId) return;

  const appId = currentOrganization.value?.app_id;
  if (!appId) return;

  const flatMap = flatMaps.value.get(appId);
  const node = flatMap?.get(nodeId);
  if (!node) {
    currentNode.value = null;
    return;
  }

  currentNode.value = node;

  loading.value = true;
  try {
    // 部门：只拉直属子级（含职位），不跨级拉人
    if ((node.type === 'department' || node.type === 'org') && node.loadStatus !== 'detail') {
      await store.loadNodeDetail(appId, nodeId);
    }

    // 职位：只拉该职位下人员
    if (node.type === 'post' && node.loadStatus !== 'detail') {
      await store.loadPostDetail(appId, nodeId);
    }
  } finally {
    // 更新引用（某些情况下 Map 内部对象更新不触发视图刷新）
    currentNode.value = flatMaps.value.get(appId)?.get(nodeId) || node;
    loading.value = false;
  }
};



const handleUpdatePost = async () => {
  const appId = currentOrganization.value?.app_id;
  if (!appId) {
    openMessageDialog('未选择组织');
    return;
  }
  if (!currentNode.value || currentNode.value.type !== 'post') {
    openMessageDialog('当前节点不是职位');
    return;
  }

  const pinia = getActivePinia();
  if (!pinia) {
    openMessageDialog('Pinia 未初始化');
    return;
  }

  const postIdStr = String(currentNode.value.id);

  // 确保职位详情（含人员）已加载，否则 initialUserIds 可能为空
  if (currentNode.value.loadStatus !== 'detail') {
    try {
      await store.loadPostDetail(appId, postIdStr);
    } catch {
      // ignore
    }
  }

  const latest = flatMaps.value.get(appId)?.get(postIdStr) || currentNode.value;
  const initialUserIds = (latest.children || [])
    .filter((c) => c.type === 'person')
    .map((c) => Number(c.id))
    .filter((n) => Number.isFinite(n));

  openSetPostDialog({
    appid: String(appId),
    postId: Number(latest.id),
    initialName: latest.name,
    initialDescription: latest.description || '',
    initialUserIds,
    pinia,
    onUpdated: () => {
      currentNode.value = flatMaps.value.get(appId)?.get(postIdStr) || latest;
    },
  });
};

const handleDeleteDepartment = async () => {
  const appId = currentOrganization.value?.app_id;
  if (!appId) return;
  if (!currentNode.value || currentNode.value.type !== 'department') return;

  const ok = await openConfirmDialog(`确定删除部门「${currentNode.value.name}」吗？\n此操作不可恢复。`, {
    title: '确认删除',
    confirmText: '删除',
    cancelText: '取消',
  });
  if (!ok) return;

  const deletingId = String(currentNode.value.id);
  const focusParentId = currentNode.value.parentId ? String(currentNode.value.parentId) : '';
  const res = await DeleteDepartmentV2(appId, Number(currentNode.value.id));
  if (!res.ok) {
    openMessageDialog('删除失败，请稍后重试');
    return;
  }

  // 直接从 store 移除，避免 loadStatus 短路导致 UI/树不同步
  store.removeNodeFromCache(appId, deletingId);

  emit('back', focusParentId);
};

const handleDeletePost = async () => {
  const appId = currentOrganization.value?.app_id;
  if (!appId) return;
  if (!currentNode.value || currentNode.value.type !== 'post') return;

  const ok = await openConfirmDialog(`确定删除职位「${currentNode.value.name}」吗？\n此操作不可恢复。`, {
    title: '确认删除',
    confirmText: '删除',
    cancelText: '取消',
  });
  if (!ok) return;

  const deletingId = String(currentNode.value.id);
  const focusParentId = currentNode.value.parentId ? String(currentNode.value.parentId) : '';
  const res = await DeleteOrganizationPostV2(appId, Number(currentNode.value.id));
  if (!res.ok) {
    openMessageDialog('删除失败，请稍后重试');
    return;
  }

  // 直接从 store 移除，避免 loadStatus 短路导致 UI/树不同步
  store.removeNodeFromCache(appId, deletingId);

  emit('back', focusParentId);
};

const handleUpdateDepartment = () => {
  const appId = currentOrganization.value?.app_id;
  if (!appId) return;
  if (!currentNode.value || currentNode.value.type !== 'department') return;

  openUpdateDepartmentDialog({
    appid: appId,
    departmentId: currentNode.value.id,
    initialName: currentNode.value.name,
    initialDescription: currentNode.value.description || '',
    pinia: getActivePinia()!,
    onUpdated: ({ name, description }) => {
      // 直接更新 Store 中的节点字段，并触发引用替换以刷新 UI
      const map = flatMaps.value.get(appId);
      const node = map?.get(currentNode.value!.id);
      if (map && node) {
        node.name = name;
        node.description = description;

        flatMaps.value.set(appId, new Map(map));
        flatMaps.value = new Map(flatMaps.value);
      }

      currentNode.value = node || currentNode.value;
    },
  });
};

// 生命周期
onMounted(() => {
  loadNode(props.id);
});
watch(() => props.id, (newId) => {
  loadNode(newId);
});
watch(() => currentOrganization.value?.app_id, () => {
  loadNode(props.id);
});
</script>
<style scoped>
.department-info {
  background-color: var(--panel-bg);
  height: 100%;
  border-radius: var(--radius-lg);
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
}

.page-header {
  padding: var(--space-sm) var(--space-md);
  background-color: var(--panel-bg);
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--font-sm);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--hover-bg);
  color: var(--text-color);
}

.basic-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background-color: var(--panel-bg);
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  gap: var(--space-md);
  min-width: 0;

}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.field-panel {
  padding: var(--space-md);
  background-color: var(--panel-bg);
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.field-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
}

.field-label {
  width: 64px;
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.field-value {
  flex: 1;
  color: var(--text-color);
  font-size: var(--font-xs);
  white-space: pre-wrap;
  word-break: break-word;
}

.dept-left {
  display: flex;
  align-items: center;
  flex: 1;
  gap: var(--space-md);
  min-width: 0;
}

.dept-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}

.icon-svg {
  width: 100%;
  height: 100%;
}

.details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.dept-name {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-color);
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dept-meta {
  font-size: var(--font-sm);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quit-option {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--panel-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quit-option.danger .quit-text {
  color: var(--danger-color);
}

.quit-option:hover {
  background: var(--hover-bg);
}

.quit-option:hover .quit-text {
  color: var(--text-color);
}

.quit-option:active {
  opacity: 0.8;
}

.quit-text {
  font-size: var(--font-sm);
  transition: opacity 0.2s ease;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: var(--text-muted);
  padding: var(--space-lg);
}

.empty-text {
  font-size: var(--font-sm);
}

.member-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--panel-bg);
  border-radius: var(--radius-md);
  overflow: hidden;
  /* 防止子元素溢出 */
}

.member-list-header {
  padding: var(--space-md);
  font-size: var(--font-sm);
  color: var(--text-muted);
  font-weight: 500;
  background-color: var(--panel-bg);
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
}

.member-list {
  flex: 1;
  overflow-y: auto;
  /* 允许列表滚动 */
}

.member-item {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.member-item:last-child {
  border-bottom: none;
}

.member-item:hover {
  background-color: var(--hover-bg);
}

.member-avatar {
  width: 40px;
  height: 40px;
  margin-right: var(--space-md);
  color: #FFC107;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.member-name {
  font-size: var(--font-md);
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-role {
  font-size: var(--font-xs);
  color: var(--text-muted);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .page-header {
    padding: var(--space-sm);
  }

  .back-btn {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-xs);
  }

  .basic-info {
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-sm);
  }

  .dept-left,
  .actions {
    width: 100%;
  }

  .dept-name {
    font-size: var(--font-md);
  }

  .dept-meta {
    font-size: var(--font-xs);
  }

  .field-panel {
    padding: var(--space-sm);
  }

  .field-row {
    flex-direction: column;
    gap: var(--space-xs);
  }

  .field-label {
    width: auto;
  }

  .member-list-header,
  .member-item {
    padding: var(--space-sm);
  }

  .member-avatar {
    width: 32px;
    height: 32px;
    margin-right: var(--space-sm);
  }

  .member-name {
    font-size: var(--font-sm);
  }
}

.action-option {
  margin-top: auto;
  /* 推到底部 */
  padding: var(--space-lg);
  text-align: center;
  background-color: var(--panel-bg);
  border-top: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

.action-text {
  font-size: var(--font-md);
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: opacity 0.2s ease;
}

.action-text:hover {
  opacity: 0.8;
  color: var(--primary-hover);
}

.action-text:active {
  opacity: 0.6;
}
</style>