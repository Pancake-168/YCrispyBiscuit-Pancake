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
          <span class="dept-name">{{ departmentName }}</span>
          <span class="dept-meta">部门主管：{{ departmentHead }}</span>
          <span class="dept-meta">所属组织：{{ parentOrgName }}</span>
        </div>
      </div>
      <div class="quit-option" @click="handleInviteIntoSpace">
        <span class="quit-text">
          邀请成员
        </span>
      </div>
    </div>

    <!-- 成员列表 -->
    <div class="member-list-container">
      <div class="member-list-header">成员列表 ({{ members.length }})</div>
      <div class="member-list">
        <div v-if="!members.length" class="empty-state">
          <div class="empty-text">暂无成员</div>
        </div>
        <div v-else class="member-item" v-for="member in members" :key="member.id">
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
            <span class="member-name">{{ member.nickname }}</span>
            <span class="member-role">{{ member.role }}</span>
          </div>
        </div>
      </div>
    </div>




  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useOrganizationStore } from '@/stores/organization';
import { storeToRefs } from 'pinia';
import type { OrgNode } from '@/types/organization';
import { fetchDepartmentDetail } from '@/services/Project/Organization/data/defaultData';
import { openInviteDialog } from '@/components/NewOrganizationAndDepartment/InviteDialog/open';
import { addPrefixSuffix } from '@/utils/stringUtils';
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls';


// 新增 props 声明
const props = defineProps<{ id: string }>();

// 使用 Pinia Store
const store = useOrganizationStore();
const { currentOrganization, flatDeptMaps } = storeToRefs(store);

// 响应式状态
const department = ref<OrgNode | null>(null);
const loading = ref(false);
const showInviteDialog = ref(false);

// 动态计算
const departmentName = computed(() => department.value?.name || (loading.value ? '加载中...' : '未找到'));
const parentOrgName = computed(() => currentOrganization.value?.application_name || '未找到');

const departmentHead = computed(() => {
  const head = department.value?.children?.find(child => child.type === 'person' && child.role === '主管');
  return head?.name || '未指定';
});

const members = computed((): OrgNode[] =>
  (department.value?.children?.filter(child => child.type === 'person') ?? [])
);

// 加载部门信息逻辑
const loadDepartment = async (deptId: string) => {
  if (!deptId) {
    console.error('[Department] 缺少部门ID参数');
    return;
  }

  // 1. 尝试从 Store 的扁平索引中获取部门节点
  const appId = currentOrganization.value?.application_id;
  if (!appId) {
    console.warn('[Department] 未找到当前组织信息');
    return;
  }

  const flatMap = flatDeptMaps.value.get(appId);
  const deptNode = flatMap?.get(deptId);

  if (deptNode) {
    department.value = deptNode;

    // 2. 检查是否需要加载详细信息（例如成员列表为空时）
    // 即使本地有数据，也尝试刷新最新成员列表
    loading.value = true;
    try {
      // 新版 fetchDepartmentDetail 只需要 deptId，内部会自动处理 appId 和 Store 更新
      await fetchDepartmentDetail(deptId);

      // 由于 department.value 是 Store 中对象的引用，Store 更新后这里会自动响应
      // 无需手动处理数据映射和赋值
      console.log('[Department] 部门详情已更新');
    } catch (e) {
      console.error('[Department] 获取部门详情失败', e);
    } finally {
      loading.value = false;
    }
  } else {
    console.error('[Department] 在当前组织中未找到该部门');
    department.value = null;
  }
};

// 邀请成员逻辑
const handleInviteIntoSpace = () => {
  const appId = currentOrganization.value?.application_id;
  if (!appId) {
    console.warn('未找到当前组织信息');
    return;
  }

  // 构造 Room ID (Space ID)
  const roomId = addPrefixSuffix(appId, "!", MATRIX_SERVER_URL_TAIL);
  // 获取当前部门 ID
  const departmentId = parseInt(props.id);

  openInviteDialog({
    roomId,
    departmentId,
    inviteType: 'space',
    onInvited: () => {
      // 邀请成功后刷新部门详情
      loadDepartment(props.id);
    }
  });
};

// 页面加载和 props 变化时自动加载
onMounted(() => {
  loadDepartment(props.id);
});
watch(() => props.id, (newId) => {
  loadDepartment(newId);
});
// 监听当前组织变化，如果切换了组织，可能需要重新加载（或者清空）
watch(() => currentOrganization.value?.application_id, () => {
  loadDepartment(props.id);
});



</script>
<style scoped>
.department-info {
  background-color: var(--bg-color-third);
  height: 100%;
  border-radius: var(--border-radius-lg);
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.page-header {
  padding: var(--space-sm) var(--space-md);
  background-color: var(--bg-color-third);
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: calc(var(--font-size-sm) + 1px);
  padding: 6px 12px;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--bg-color-hover);
  color: var(--text-color);
}

.basic-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-md);
  background-color: var(--bg-color-secondary);
  border-bottom: 1px solid var(--border-color);

}

.dept-left {
  display: flex;
  align-items: center;
  flex: 1;
  gap: var(--space-md);
}

.dept-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.icon-svg {
  width: 100%;
  height: 100%;
}

.details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.dept-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color);
  letter-spacing: 0.5px;
}

.dept-meta {
  font-size: var(--font-size-base);
  color: var(--text-color-secondary);
}

.quit-option {
  padding: 6px 12px;
  border-radius: var(--border-radius-md);
  background: var(--bg-color-fifth);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quit-option:hover {
  background: var(--bg-color-hover);
}

.quit-option:hover .quit-text {
  color: var(--text-color);
}

.quit-option:active {
  opacity: 0.8;
}

.quit-text {
  font-size: var(--font-size-base);
  transition: opacity var(--transition-duration-fast) var(--transition-timing);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: var(--text-color-secondary);
  padding: var(--space-lg);
}

.empty-text {
  font-size: var(--font-size-base);
}

.member-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-third);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  /* 防止子元素溢出 */
}

.member-list-header {
  padding: var(--space-md) var(--space-md);
  font-size: var(--font-size-base);
  color: var(--text-color-secondary);
  font-weight: var(--font-weight-medium);
  background-color: var(--bg-color-third);
  border-bottom: 1px solid var(--border-color-light);
}

.member-list {
  flex: 1;
  overflow-y: auto;
  /* 允许列表滚动 */
}

.member-item {
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-md);
  border-bottom: 1px solid var(--border-color-light);
  transition: background-color var(--transition-duration) var(--transition-timing);
  cursor: pointer;
}

.member-item:last-child {
  border-bottom: none;
}

.member-item:hover {
  background-color: var(--bg-color-hover);
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
}

.member-name {
  font-size: var(--font-size-lg);
  color: var(--text-color);
  font-weight: var(--font-weight-medium);
}

.member-role {
  font-size: var(--font-size-sm);
  color: var(--text-color-tertiary);
  font-style: italic;
}

.action-option {
  margin-top: auto;
  /* 推到底部 */
  padding: var(--space-lg);
  text-align: center;
  background-color: var(--bg-color-secondary);
  border-top: 1px solid var(--border-color-light);
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
}

.action-text {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.5px;
  transition: opacity var(--transition-duration-fast) var(--transition-timing);
}

.action-text:hover {
  opacity: 0.8;
  color: var(--color-primary-hover);
}

.action-text:active {
  opacity: 0.6;
}
</style>