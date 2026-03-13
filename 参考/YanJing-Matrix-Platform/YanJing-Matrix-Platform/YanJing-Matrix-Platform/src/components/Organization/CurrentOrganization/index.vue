<template>
  <div class="current-organization">
    <div class="org-selector" ref="orgSelectorRef" @click="openDropdown($event)">
      <div class="org-info">
        <!--div class="org-avatar">
       
          <div class="default-avatar">{{ currentOrg?.name?.charAt(0) || 'O' }}</div>
        </div-->
        <div class="org-details">
          <div class="org-name">{{ currentOrg?.name || '请选择组织' }}</div>
        </div>
      </div>
      <div class="dropdown-icon">
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
import { computed } from 'vue'
import { useOrganizationStore } from '@/stores/Organization'


const store = useOrganizationStore()
const currentOrg = computed(() => store.currentOrganization)

const openDropdown = (event: MouseEvent) => {
  store.openDropdown(event.currentTarget as HTMLElement)
}
</script>

<style scoped lang="scss">
.current-organization {
  width: min(420px, 100%);
  max-width: 100%;
  flex: 0 1 auto;
  min-width: 0;
  user-select: none;
  padding: 0.5rem;
}

.org-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  width: 100%;

  background: var(--panel-bg);


  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--panel-bg);
    border-color: color-mix(in srgb, var(--text-color) 16%, transparent);
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
  min-width: 0;
  flex: 1;
}

.org-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--panel-bg);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .default-avatar {
    color: var(--text-muted);
    font-weight: 600;
    font-size: var(--font-xs);
  }
}

.org-details {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.org-name {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-icon {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* 紧凑模式 */
.current-organization--compact {
  .org-selector {
    padding: 8px;
    justify-content: center;
    border: none;
    background: transparent;

    &:hover {
      background: var(--hover-bg);
    }
  }

  .org-info {
    gap: 0;
  }
}
</style>
