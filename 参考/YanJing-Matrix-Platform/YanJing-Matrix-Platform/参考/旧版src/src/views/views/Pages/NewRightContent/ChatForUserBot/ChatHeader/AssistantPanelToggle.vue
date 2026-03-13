<template>
  <div v-if="showToggle" class="assistant-toggle-wrapper">
    <button
      class="assistant-toggle"
      :class="{ 'assistant-toggle--active': isAssistantPanelActive }"
      type="button"
      @click="handleToggle"
      :aria-pressed="isAssistantPanelActive"
    >
      <span class="assistant-toggle__label">{{ logoLabel }}</span>
      <span v-if="badgeText" class="assistant-toggle__badge">{{ badgeText }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAssistantSidebarStore } from '../../../../../../stores/assistantSidebar'

const assistantSidebarStore = useAssistantSidebarStore()

const showToggle = computed(() => assistantSidebarStore.showAssistantToggle)
const currentPanel = computed(() => assistantSidebarStore.currentPanel)

const isAssistantPanelActive = computed(() => currentPanel.value === 'systemList2')
const logoLabel = computed(() => (isAssistantPanelActive.value ? '系统' : '任务列表'))

const badgeText = computed(() => (isAssistantPanelActive.value ? assistantSidebarStore.otherRoomsBadge : ''))

const handleToggle = () => {
  assistantSidebarStore.togglePanel()
}
</script>

<style scoped>
.assistant-toggle-wrapper {
  display: flex;
  justify-content: flex-end;
}

.assistant-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-color-primary, rgba(255, 255, 255, 0.04));
  cursor: pointer;
  position: relative;
  padding: 6px 14px;
  border-radius: 999px;
  color: var(--text-color);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.assistant-toggle:hover {
  background: var(--bg-color-secondary);
}

.assistant-toggle:active {
  transform: translateY(1px);
}

.assistant-toggle--active {
  background: var(--color-primary-10, rgba(86, 120, 235, 0.12));
  border-color: var(--color-primary, #5a6ff0);
  color: var(--color-primary, #5a6ff0);
}

.assistant-toggle__label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  white-space: nowrap;
}

.assistant-toggle__badge {
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--color-warning, #ff9f43);
  color: #fff;
  font-size: calc(var(--font-size-base) * 1.1);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}
</style>
