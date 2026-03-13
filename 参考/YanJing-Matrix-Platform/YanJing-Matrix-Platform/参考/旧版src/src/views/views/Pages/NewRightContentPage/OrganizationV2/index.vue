<template>
  <div class="organization-container">
    <!-- 1. 部门详情页 -->
    <DepartmentInformation 
      v-if="currentView === 'department'" 
      :id="currentId"
      @back="showMainView"
    />

    <!-- 2. 组织详情页 -->
    <OrganizationInformation 
      v-else-if="currentView === 'organization'" 
      :id="currentId"
      @back="showMainView"
    />

    <!-- 3. 默认主视图 (组织架构树/列表) -->
    <KeepAlive>
      <Views 
        v-if="currentView === 'main'" 
        :focus-dept-id="focusDeptId"
        @show-department="handleShowDepartment"
        @show-organization="handleShowOrganization"
        @talk-request-from-organization-list="(...args: any[]) => emit('talk-request-from-organization-list', ...args)"
      />
    </KeepAlive>
  </div>
  
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DepartmentInformation from './DepartmentInformation/index.vue';
import OrganizationInformation from './OrganizationInformation/index.vue';
import Views from './Views/index.vue';

const emit = defineEmits(['talk-request-from-organization-list']);

// 定义视图状态类型
type ViewType = 'main' | 'department' | 'organization';

// 状态管理
const currentView = ref<ViewType>('main');
const currentId = ref(''); // 统一使用 ID，可能是 OrgID 或 DeptID
const focusDeptId = ref<string | null>(null);

// 切换到主视图
const showMainView = (focusId?: string) => {
  currentView.value = 'main';
  currentId.value = '';

  // KeepAlive 会保留 Views 的 currentDeptId，删除节点后需要把焦点切回上一级。
  // 通过 prop 通知 Views 更新面包屑/当前层级。
  const next = (focusId ?? '');
  if (focusDeptId.value === next) {
    focusDeptId.value = null;
  }
  focusDeptId.value = next;
};

// 切换到部门详情
const handleShowDepartment = (id: string) => {
  currentId.value = id;
  currentView.value = 'department';
};

// 切换到组织详情
const handleShowOrganization = (id: string) => {
  currentId.value = id;
  currentView.value = 'organization';
};
</script>

<style scoped>
.organization-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>