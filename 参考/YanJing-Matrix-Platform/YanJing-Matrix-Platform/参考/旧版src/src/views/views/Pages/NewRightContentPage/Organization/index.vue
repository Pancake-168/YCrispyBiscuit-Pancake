<template>
  <div class="organization-container">
    <!-- 1. 部门详情页 -->
    <DepartmentInformation 
      v-if="currentView === 'department'" 
      :id="currentDeptId"
      @back="showMainView"
    />

    <!-- 2. 组织详情页 -->
    <OrganizationInformation 
      v-else-if="currentView === 'organization'" 
      :id="currentOrgId"
      @back="showMainView"
    />

    <!-- 3. 默认主视图 (组织架构树/列表) -->
    <KeepAlive>
      <Views 
        v-if="currentView === 'main'" 
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
const currentDeptId = ref('');
const currentOrgId = ref('');

// 切换到主视图
const showMainView = () => {
  currentView.value = 'main';
  currentDeptId.value = '';
  currentOrgId.value = '';
};

// 切换到部门详情
const handleShowDepartment = (deptId: string) => {
  currentDeptId.value = deptId;
  currentView.value = 'department';
};

// 切换到组织详情
const handleShowOrganization = (orgId: string) => {
  currentOrgId.value = orgId;
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