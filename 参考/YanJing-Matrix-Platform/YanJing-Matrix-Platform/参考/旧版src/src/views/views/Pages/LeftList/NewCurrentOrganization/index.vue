<template>
  <div class="current-organization">
    <div class="org-selector" ref="orgSelectorRef" @click="openDropdown($event)">
      <div class="org-info">
        <div class="org-avatar">
          <img v-if="currentOrg?.avatar" :src="currentOrg.avatar" :alt="currentOrg.application_name" />
          <div v-else class="default-avatar">{{ currentOrg?.application_name?.charAt(0) || 'O' }}</div>
        </div>
        <div v-if="!isMobile" class="org-details">
          <div class="org-name">{{ currentOrg?.application_name || '请选择组织' }}</div>
        </div>
      </div>
      <div v-if="!isMobile" class="dropdown-icon">
        <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16"
          height="16">
          <path
            d="M483.072 714.496l30.165333 30.208 415.957334-415.829333a42.837333 42.837333 0 0 0 0-60.288 42.538667 42.538667 0 0 0-60.330667-0.042667l-355.541333 355.413333-355.242667-355.413333a42.496 42.496 0 0 0-60.288 0 42.837333 42.837333 0 0 0-0.085333 60.330667l383.701333 383.872 1.706667 1.749333z"
            fill="currentColor"></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useOrganizationStore } from '@/stores/organization'


const store = useOrganizationStore()
const currentOrg = computed(() => store.currentOrganization)

const isMobile = ref(false)

// 检测移动端
const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 769
}

const openDropdown = (event: MouseEvent) => {
  store.openDropdown(event.currentTarget as HTMLElement)
}

// 初始化 Store 数据
onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
})
</script>

<style scoped lang="scss">
.current-organization {
  width: 100%;
  user-select: none;
}

.org-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-color-hover);
    border-color: var(--color-primary);
  }

  &:active {
    transform: scale(0.98);
  }
}

.org-info {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.org-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .default-avatar {
    color: var(--color-primary);
    font-weight: 600;
    font-size: var(--font-size-lg);
  }
}

.org-details {
  flex: 1;
  overflow: hidden;
}

.org-name {
  font-size: calc(var(--font-size-sm) + 1px);
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-icon {
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
}

/* 紧凑模式 */
.current-organization--compact {
  .org-selector {
    padding: 8px;
    justify-content: center;
    border: none;
    background: transparent;

    &:hover {
      background: var(--bg-color-hover);
    }
  }

  .org-info {
    gap: 0;
  }
}
</style>
