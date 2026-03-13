<template>
  <div v-if="store.dropdownVisible" class="organization-dropdown-overlay" @click="store.closeDropdown()">
    <div class="organization-dropdown" ref="dropdownRef" :style="dropdownPosition" @click.stop>
      <div class="dropdown-header">
        <h3>选择企业/团队</h3>
        <button class="close-btn" @click="store.closeDropdown()">✕</button>
      </div>

      <div class="org-list">
        <div v-for="org in store.organizationList" :key="org.app_id" class="org-item"
          :class="{ 'selected': store.currentOrganization?.app_id === org.app_id }"
          @click="store.switchOrganization(org)">
          <div class="org-item-avatar">
            <!-- V2 暂无 avatar 字段，暂时注释 -->
            <!-- <img v-if="org.avatar" :src="org.avatar" :alt="org.application_name" /> -->
            <div class="default-avatar">{{ org.name?.charAt(0) }}</div>
          </div>
          <div class="org-item-info">
            <div class="org-item-name">{{ org.name }}</div>
            <div class="org-item-dept">组织直属</div>
          </div>

          <div v-if="store.currentOrganization?.app_id === org.app_id" class="selected-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.6667 7.99996C14.6667 4.31806 11.6819 1.33329 8.00004 1.33329C4.31814 1.33329 1.33337 4.31806 1.33337 7.99996C1.33337 11.6819 4.31814 14.6666 8.00004 14.6666C11.6819 14.6666 14.6667 11.6819 14.6667 7.99996Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M5.33337 8.33333L7.00004 10L10.6667 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </div>

        <!-- 新建组织入口 (保留) -->
        <div class="org-item new-org-item" @click="handleCreateNew">
          <div class="org-item-avatar">
             <div class="default-avatar">+</div>
          </div>
          <div class="org-item-info">
            <div class="org-item-name">立即新建或加入企业/团队</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useOrganizationStoreV2 } from '@/stores/organizationV2'

const emit = defineEmits(['create-new-organization-dialog'])
const store = useOrganizationStoreV2()
const dropdownRef = ref<HTMLElement>()

// 计算下拉框位置
const dropdownPosition = computed(() => {
  if (!store.triggerElement) return {}
  
  const rect = store.triggerElement.getBoundingClientRect()
  return {
    top: `${rect.top}px`,
    left: `${rect.right + 10}px` // 显示在触发元素右侧
  }
})
const handleCreateNew = () => {
  emit('create-new-organization-dialog')
  store.closeDropdown()
} 

// 监听打开状态，自动调整位置（防止溢出屏幕）
watch(() => store.dropdownVisible, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    if (dropdownRef.value && store.triggerElement) {
      // 这里可以添加更复杂的边界检测逻辑
    }
  }
})
</script>

<style scoped lang="scss">
.organization-dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: var(--bg-color-mask);
}

.organization-dropdown {
  position: fixed;
  width: 320px;
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow: hidden;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 14px;
    cursor: pointer;
    color: var(--text-color-secondary);
    &:hover { color: var(--text-color); }
  }
}

.org-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.org-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 12px;
  
  &:hover {
    background: var(--bg-color-tertiary);
  }
  
  &.selected {
    background: var(--color-primary-light);
  }
}

.org-item-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-color-fourth);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .default-avatar {
    color: var(--text-color-secondary);
    font-weight: 600;
    font-size: 18px;
  }
}

.org-item-info {
  flex: 1;
  overflow: hidden;
}

.org-item-name {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-item-dept {
  font-size: 9px;
  color: var(--text-color-secondary);
}

.selected-icon {
  color: var(--color-primary);
  display: flex;
  align-items: center;
}

.new-org-item {
  margin-top: 8px;
  border-top: 1px dashed var(--border-color);
  border-radius: 0 0 8px 8px;
  
  .org-item-avatar .default-avatar {
    font-size: 24px;
    font-weight: 300;
  }

  .org-item-avatar {
    background: var(--color-primary-light);

    .default-avatar {
      color: var(--color-primary);
    }
  }
}
</style>
