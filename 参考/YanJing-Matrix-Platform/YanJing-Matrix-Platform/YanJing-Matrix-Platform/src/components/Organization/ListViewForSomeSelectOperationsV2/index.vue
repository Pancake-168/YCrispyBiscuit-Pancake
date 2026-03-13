<template>
  <div class="selector-overlay yj-dialog-mask" @click.self="handleClose">
    <div class="selector-modal yj-dialog-content">
      <div class="modal-header">
        <h3 class="modal-title">{{ title || defaultTitle }}</h3>
        <button class="close-btn" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="breadcrumb-container">
          <OrgBreadcrumb :items="breadcrumbs" @nav-click="handleBreadcrumbNav" />
        </div>

        <div class="list-container">
          <DepartmentList :items="currentItems" :category="category" @enter="handleEnter"
            @select="handleSelectRequest" />
        </div>
      </div>
    </div>

    <!-- 二次确认弹窗 -->
    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <div class="confirm-title">确认选择</div>
        <div class="confirm-content">
          是否确认选择：<span class="highlight">{{ pendingItem?.name }}</span> ?
        </div>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="showConfirm = false">取消</button>
          <button class="btn-confirm" @click="confirmSelect">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useOrganizationStore } from '@/stores/Organization';
import type { OrgNodeV2 } from '@/types/Organization';
import type { SelectorCategoryV2 } from './open';
import DepartmentList from './DepartmentList.vue';
import OrgBreadcrumb from '@/views/views/Pages/OrganizationPage/Organization/Views/OrgBreadcrumb/index.vue';

const props = defineProps<{
  appid: string;
  category: SelectorCategoryV2;
  title?: string;
  onSelect?: (item: OrgNodeV2) => void;
  onClose?: () => void;
}>();

const store = useOrganizationStore();
const { flatMaps, orgTrees, currentOrganization } = storeToRefs(store);

const currentNodeId = ref<string>(''); // 空字符串表示根目录
const showConfirm = ref(false);
const pendingItem = ref<OrgNodeV2 | null>(null);

const defaultTitle = computed(() => {
  if (props.category === 'department') return '选择部门';
  if (props.category === 'post') return '选择职位';
  return '选择人员';
});

function isSelectable(item: OrgNodeV2) {
  if (props.category === 'department') return item.type === 'department';
  if (props.category === 'post') return item.type === 'post';
  return item.type === 'person';
}

const displayTypes = computed(() => {
  if (props.category === 'department') return new Set<OrgNodeV2['type']>(['org', 'department']);
  if (props.category === 'post') return new Set<OrgNodeV2['type']>(['org', 'department', 'post']);
  return new Set<OrgNodeV2['type']>(['org', 'department', 'post', 'person']);
});

const currentItems = computed(() => {
  const appId = props.appid;
  if (!appId) return [];

  let nodes: OrgNodeV2[] = [];
  if (!currentNodeId.value) {
    nodes = orgTrees.value.get(appId) || [];
  } else {
    const flatMap = flatMaps.value.get(appId);
    const node = flatMap?.get(currentNodeId.value);
    nodes = node?.children || [];
  }

  return nodes.filter((n) => displayTypes.value.has(n.type));
});

const breadcrumbs = computed(() => {
  const appId = props.appid;
  if (!appId) return [];

  const flatMap = flatMaps.value.get(appId);
  const roots = orgTrees.value.get(appId);

  const rootName =
    (currentOrganization.value && String(currentOrganization.value.app_id) === String(appId) && currentOrganization.value.name) ||
    (roots?.[0]?.name || '组织');

  const path: { id: string; name: string }[] = [];

  if (!currentNodeId.value) {
    path.push({ id: '', name: rootName });
    return path;
  }

  let curr = flatMap?.get(currentNodeId.value);
  while (curr) {
    path.unshift({ id: curr.id, name: curr.name });
    if (curr.parentId && flatMap?.has(curr.parentId)) {
      curr = flatMap.get(curr.parentId);
    } else {
      curr = undefined;
    }
  }

  if (path.length > 0) {
    const topNodeId = path[0]?.id;
    const topNode = topNodeId ? flatMap?.get(topNodeId) : undefined;
    if (topNode && topNode.type !== 'org') {
      path.unshift({ id: '', name: rootName });
    }
  }

  return path;
});

async function handleEnter(item: OrgNodeV2) {
  const appId = props.appid;
  if (!appId) return;

  if (item.type === 'org' || item.type === 'department') {
    if (item.loadStatus === 'skeleton') {
      await store.loadNodeDetail(appId, item.id);
    }
    currentNodeId.value = item.id;
    return;
  }

  // 只有「人员选择」时允许下钻到职位人员
  if (item.type === 'post' && props.category === 'person') {
    if (item.loadStatus !== 'detail') {
      await store.loadPostDetail(appId, item.id);
    }
    currentNodeId.value = item.id;
  }
}

function handleBreadcrumbNav(id: string) {
  currentNodeId.value = id;
}

function handleSelectRequest(item: OrgNodeV2) {
  if (!isSelectable(item)) return;
  pendingItem.value = item;
  showConfirm.value = true;
}

function confirmSelect() {
  if (pendingItem.value && props.onSelect) {
    props.onSelect(pendingItem.value);
    handleClose();
  }
}

function handleClose() {
  props.onClose?.();
}
</script>

<style scoped>
.selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: color-mix(in srgb, var(--bg-color) 88%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.selector-modal {
  width: 640px;
  max-width: 92vw;
  height: 72vh;
  background: var(--panel-bg);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  box-shadow: var(--glass-shadow);
  overflow: hidden;
}

.modal-header {
  padding: var(--space-lg);
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--panel-bg);
}

.modal-title {
  margin: 0;
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-color);
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-color);
}

.modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.breadcrumb-container {
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--panel-bg);
}

.list-container {
  flex: 1;
  overflow: hidden;
}

/* 确认弹窗样式 */
.confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: color-mix(in srgb, var(--bg-color) 88%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.confirm-box {
  background: var(--panel-bg);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  width: 340px;
  max-width: 90vw;
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  box-shadow: var(--glass-shadow);
}

.confirm-title {
  font-size: var(--font-sm);
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--text-color);
}

.confirm-content {
  font-size: var(--font-xs);
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
  line-height: 1.5;
}

.highlight {
  color: var(--primary-color);
  font-weight: 600;
  margin: 0 4px;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
}

.btn-cancel {
  padding: var(--space-xs) var(--space-md);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-color);
}

.btn-confirm {
  padding: var(--space-xs) var(--space-md);
  border: none;
  background: var(--primary-color);
  color: var(--btn-text);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.btn-cancel:hover {
  background: var(--hover-bg);
}

.btn-confirm:hover {
  opacity: 0.9;
}
</style>
