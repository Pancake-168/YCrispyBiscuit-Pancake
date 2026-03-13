<template>
  <div class="new-org-list-container">
    <!-- 空状态 -->
    <div v-if="orgStore.orgTree.length === 0" class="org-card empty-card" @click="$emit('add-new-organization')">
      <div class="empty-text">暂无组织，点击添加</div>
    </div>

    <!-- 组织列表 -->
    <div v-for="org in orgStore.orgTree" :key="org.id" class="org-card" :class="{ active: selectedOrgId === org.id }"
      @click="handleOrgClick(org)">
      <div class="org-header">
        <div class="org-icon">
          <span v-if="!org.avatar">{{ org.name.charAt(0) }}</span>
          <img v-else :src="org.avatar" />
        </div>
        <span class="org-name">{{ org.name }}</span>
        
        <!-- 右侧操作区 -->
        <div class="org-actions">
           <button class="action-btn" @click.stop="handleShowInfo(org)">
             详情
           </button>
        </div>
      </div>

      <!--div class="org-menu-item clickable" @click="emitAction('list', org, userDepartments[org.id])">
          -- 所在部门：{{ userDepartments[org.id]?.name || '' }}
        </div>
        <div class="org-menu-item clickable" @click="showMembersList[org.id] = !showMembersList[org.id]">
          -- 成员列表：
        </div-->
    </div>

    <!--<AgentList/>               -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useOrganizationStore } from '@/stores/organization'
import type { OrgNode } from '@/types/organization'

const emit = defineEmits<{
  'select-org': [org: OrgNode],
  'show-info': [org: OrgNode],
  'add-new-organization': []
}>()

const orgStore = useOrganizationStore()
const selectedOrgId = ref<string>('')

const handleOrgClick = (org: OrgNode) => {
  selectedOrgId.value = org.id
  emit('select-org', org)
}

const handleShowInfo = (org: OrgNode) => {
  emit('show-info', org)
}
</script>

<style scoped lang="scss">
.new-org-list-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.org-card {
  background: var(--bg-color-secondary);
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: var(--bg-color-hover);
  }

  &.active {
    border-color: var(--color-primary);
    background: var(--bg-color-active);
  }
}

.org-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.org-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
}

.org-name {
  flex: 1;
  font-weight: 600;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-btn {
  padding: 4px 8px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.empty-card {
  border-style: dashed;
  display: flex;
  justify-content: center;
  color: var(--text-color-secondary);
}
</style>