<template>
  <div class="dept-selector-overlay" @click.self="handleClose">
    <div class="dept-selector-modal">
      <div class="modal-header">
        <h3 class="modal-title">{{ title || '选择部门' }}</h3>
        <button class="close-btn" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 面包屑导航 -->
        <div class="breadcrumb-container">
          <OrgBreadcrumb :items="breadcrumbs" @nav-click="handleBreadcrumbNav" />
        </div>

        <!-- 列表区域 -->
        <div class="list-container">
          <DepartmentList 
            :items="currentItems" 
            @enter="handleEnter" 
            @select="handleSelectRequest" 
          />
        </div>
      </div>
    </div>

    <!-- 二次确认弹窗 -->
    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <div class="confirm-title">确认选择</div>
        <div class="confirm-content">
          是否确认选择部门：<span class="highlight">{{ pendingItem?.name }}</span> ?
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
import { ref, computed, onMounted } from 'vue';
import { useOrganizationStore } from '@/stores/organization';
import { storeToRefs } from 'pinia';
import type { OrgNode } from '@/types/organization';
import DepartmentList from './DepartmentList.vue';
import OrgBreadcrumb from '@/views/views/Pages/NewRightContentPage/Organization/Views/OrgBreadcrumb/index.vue';
import { fetchDepartmentDetail } from '@/services/Project/Organization/data/defaultData';

const props = defineProps<{
  appId: string;
  title?: string;
  onSelect?: (item: OrgNode) => void;
  onClose?: () => void;
}>();

const store = useOrganizationStore();
const { flatDeptMaps, orgTrees } = storeToRefs(store);

const currentDeptId = ref<string>(''); // 空字符串表示根目录
const showConfirm = ref(false);
const pendingItem = ref<OrgNode | null>(null);

// 计算当前显示的列表项
const currentItems = computed(() => {
  if (!props.appId) return [];

  let nodes: OrgNode[] = [];
  if (!currentDeptId.value) {
    // 根目录
    nodes = orgTrees.value.get(props.appId) || [];
  } else {
    // 子部门
    const flatMap = flatDeptMaps.value.get(props.appId);
    const node = flatMap?.get(currentDeptId.value);
    nodes = node?.children || [];
  }

  // 过滤掉人员，只保留部门和组织
  return nodes.filter(node => node.type === 'department' || node.type === 'org');
});

// 计算面包屑
const breadcrumbs = computed(() => {
  if (!props.appId) return [];
  
  const path: { id: string, name: string }[] = [];
  const flatMap = flatDeptMaps.value.get(props.appId);

  // 根节点名称（通常是组织名）
  // 这里简单处理，如果能获取到组织名最好，否则显示"根目录"
  // 实际上 orgTrees 的第一个节点通常就是 Org 类型的根节点
  const rootNodes = orgTrees.value.get(props.appId);
  const rootName = rootNodes && rootNodes.length > 0 ? rootNodes[0].name : '组织';

  if (!currentDeptId.value) {
    path.push({ id: '', name: rootName });
  } else {
    let curr = flatMap?.get(currentDeptId.value);
    while (curr) {
      path.unshift({ id: curr.id, name: curr.name });
      if (curr.parentId && flatMap?.has(curr.parentId)) {
        curr = flatMap.get(curr.parentId);
      } else {
        curr = undefined;
      }
    }
    // 如果路径第一项不是根节点，可能需要补全根节点（视数据结构而定）
    // 假设 flatMap 包含了所有层级，这里应该能回溯到顶层
  }
  return path;
});

// 进入下级
async function handleEnter(item: OrgNode) {
  // 加载详情以确保子节点数据存在
  await fetchDepartmentDetail(item.id);
  currentDeptId.value = item.id;
}

// 面包屑导航
function handleBreadcrumbNav(id: string) {
  currentDeptId.value = id;
}

// 请求选择（弹出确认框）
function handleSelectRequest(item: OrgNode) {
  pendingItem.value = item;
  showConfirm.value = true;
}

// 确认选择
function confirmSelect() {
  if (pendingItem.value && props.onSelect) {
    props.onSelect(pendingItem.value);
    handleClose();
  }
}

function handleClose() {
  if (props.onClose) {
    props.onClose();
  }
}

onMounted(async () => {
  // 初始化时可能需要加载根数据，假设外部已经保证了 Store 中有基础数据
  // 如果没有，可能需要 fetchAllOrgTrees()，但这里尽量保持轻量
});
</script>

<style scoped>
.dept-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.dept-selector-modal {
  width: 600px;
  max-width: 90vw;
  height: 70vh;
  background-color: var(--bg-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-color-secondary);
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-color-secondary);
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: var(--bg-color-hover);
  color: var(--text-color);
}

.modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.breadcrumb-container {
  padding: 0 16px;
  border-bottom: 1px solid var(--border-color-light);
  background-color: var(--bg-color-third);
}

.list-container {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

/* 确认弹窗样式 */
.confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.confirm-box {
  background-color: var(--bg-color);
  padding: 24px;
  border-radius: 8px;
  width: 320px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  animation: popIn 0.2s ease-out;
}

@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.confirm-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-color);
}

.confirm-content {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
}

.highlight {
  color: var(--color-primary);
  font-weight: 600;
  margin: 0 4px;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 6px 16px;
  border: 1px solid var(--border-color);
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-color);
}

.btn-confirm {
  padding: 6px 16px;
  border: none;
  background-color: var(--color-primary);
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel:hover {
  background-color: var(--bg-color-hover);
}

.btn-confirm:hover {
  opacity: 0.9;
}
</style>