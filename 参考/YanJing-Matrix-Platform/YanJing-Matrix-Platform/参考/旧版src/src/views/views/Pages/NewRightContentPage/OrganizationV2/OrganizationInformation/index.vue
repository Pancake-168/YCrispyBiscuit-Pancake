<!-- pages/Organization/OrganizationInformation/index.vue -->
<template>
  <div class="organization-info">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <button class="back-btn" @click="$emit('back')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        返回列表
      </button>
    </div>

    <!-- 基本信息框 -->
    <div class="org-basic-info">
      <div class="org-left">
        <div class="org-icon">
          <svg class="icon-svg" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <rect width="36" height="36" rx="18" fill="currentColor" fill-opacity="0.25" />
            <g clip-path="url(#clip0_org_info)">
              <path d="M15 18C15 17.0572 15 16.5858 14.6583 16.2929C14.3166 16 13.7666 16 12.6667 16C11.5667 16 11.0168 16 10.675 16.2929C10.3333 16.5858 10.3333 17.0572 10.3333 18C10.3333 18.9428 10.3333 19.4142 10.675 19.7071C11.0168 20 11.5667 20 12.6667 20C13.7666 20 14.3166 20 14.6583 19.7071C15 19.4142 15 18.9428 15 18Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M23.6667 13.3333C23.6667 12.3904 23.6667 11.919 23.3933 11.6261C23.1199 11.3333 22.68 11.3333 21.8 11.3333H20.8667C19.9867 11.3333 19.5467 11.3333 19.2734 11.6261C19 11.919 19 12.3904 19 13.3333C19 14.2761 19 14.7475 19.2734 15.0404C19.5467 15.3333 19.9867 15.3333 20.8667 15.3333H21.8C22.68 15.3333 23.1199 15.3333 23.3933 15.0404C23.6667 14.7475 23.6667 14.2761 23.6667 13.3333Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M23.6667 22.6667C23.6667 21.7239 23.6667 21.2525 23.3933 20.9596C23.1199 20.6667 22.68 20.6667 21.8 20.6667H20.8667C19.9867 20.6667 19.5467 20.6667 19.2734 20.9596C19 21.2525 19 21.7239 19 22.6667C19 23.6096 19 24.081 19.2734 24.3739C19.5467 24.6667 19.9867 24.6667 20.8667 24.6667H21.8C22.68 24.6667 23.1199 24.6667 23.3933 24.3739C23.6667 24.081 23.6667 23.6096 23.6667 22.6667Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M17 17.9994L17 20.6975C17 21.9468 17.6114 22.5078 19 22.6667M17 17.9994L17 15.3014C17 14.1231 17.5194 13.5057 19 13.3334M17 17.9994L15 17.9994" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </g>
            <defs>
              <clipPath id="clip0_org_info">
                <rect width="16" height="16" fill="white" transform="translate(9 10)" />
              </clipPath>
            </defs>
          </svg>
        </div>
        <div class="org-details">
          <span class="org-name">{{ orgName }}</span>
          <span class="org-admin">管理员：{{ adminNames }}</span>
        </div>

        <div class="quit-option" @click="handleInviteIntoOrganization">
          <span class="quit-text">邀请加入组织</span>
        </div>


        <!-- 退出企业选项 -->
        <div class="quit-option" @click="handleQuit">
          <span class="quit-text">退出该企业</span>
        </div>
      </div>
      <div class="org-right">
        <!--button class="invite-btn" @click="handleInviteIntoOrganization">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          邀请成员
        </button-->
      </div>
    </div>

    <!-- 组织信息列表 -->
    <div class="org-info-list">
      <div class="info-item" v-for="(item, index) in orgInfoList" :key="index">
        <span class="info-label">{{ item.label }}</span>
        <span class="info-value">{{ item.value }}</span>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useOrganizationStoreV2 } from '@/stores/organizationV2';
import { storeToRefs, getActivePinia } from 'pinia';
import { openConfirmDialog, openMessageDialog } from '@/components/MessageDialog/open'
import { openInviteIntoApplicationDialog } from '@/components/NewOrganizationAndDepartmentV2/InviteIntoApplication/open'
const props = defineProps<{ id: string }>(); // 接收 Org ID

// 使用 Pinia Store V2
const store = useOrganizationStoreV2();
const { currentOrganization, flatMaps } = storeToRefs(store);

// 组织名称
const orgName = computed(() => currentOrganization.value?.name || '未选择组织');

// 管理员名单 (V2 暂无明确定义，沿用逻辑遍历 Root 下的职位或人员)
const adminNames = computed(() => {
  // TODO: V2 适配
  return '未指定';
});

// 组织信息列表
const orgInfoList = computed(() => {
  let deptCount = 0;
  let postCount = 0;
  const appId = currentOrganization.value?.app_id;
  
  if (appId) {
    const map = flatMaps.value.get(appId);
    if (map) {
      // 遍历扁平 Map 统计
      for (const node of map.values()) {
        if (node.type === 'department') deptCount++;
        if (node.type === 'post') postCount++;
      }
    }
  }

  return [
    { label: '地区', value: '未指定' },
    { label: '行业', value: '未指定' },
    { label: '部门数量', value: deptCount.toString() },
    { label: '职位数量', value: postCount.toString() },
  ];
});

// 邀请加入组织
function handleInviteIntoOrganization() {
  const appid = currentOrganization.value?.app_id;
  if (!appid) {
    openMessageDialog('未选择组织');
    return;
  }

  const pinia = getActivePinia();
  if (!pinia) {
    openMessageDialog('Pinia 未初始化');
    return;
  }

  openInviteIntoApplicationDialog({
    appid: String(appid),
    pinia,
  });
}

// 退出企业处理函数
const handleQuit = async () => {
  const confirmed = await openConfirmDialog('确认退出该组织？', {
    title: '确认退出',
    confirmText: '退出',
    cancelText: '取消',
  })
  if (!confirmed) return
  console.log('退出组织:', currentOrganization.value?.name);
  openMessageDialog('退出功能 (V2) 开发中');
};
</script>

<style scoped>
.organization-info {
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

.org-basic-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-color-secondary);

}

.org-left {
  display: flex;
  align-items: center;
  flex: 1;
  gap: var(--space-md);
}

.org-icon {
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

.org-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-xs);
}

.org-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color);
  letter-spacing: 0.5px;
}

.org-admin {
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
  color: var(--color-error);
}

.quit-option:active {
  opacity: 0.8;
}

.quit-text {
  font-size: var(--font-size-sm);
  color: var(--text-color-secondary);
  transition: color 0.2s ease;
}

.org-right {
  display: flex;
  align-items: center;
}

.org-info-list {
  flex: 1;
  padding: var(--space-md) 0;
  display: flex;
  flex-direction: column;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-color-third);
  border-bottom: 1px solid var(--border-color-light);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: var(--font-size-base);
  color: var(--text-color);
  font-weight: var(--font-weight-medium);
}

.info-value {
  font-size: var(--font-size-base);
  color: var(--text-color-secondary);
  font-style: italic;
}
</style>