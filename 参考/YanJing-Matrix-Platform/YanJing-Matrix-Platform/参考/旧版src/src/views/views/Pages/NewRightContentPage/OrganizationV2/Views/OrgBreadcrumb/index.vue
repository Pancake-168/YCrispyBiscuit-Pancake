<template>
  <div class="org-breadcrumb" ref="breadcrumbRef" @wheel.prevent="handleWheel">
    <div class="breadcrumb-items">
      <template v-for="(item, index) in items" :key="item.id">
        <span 
          class="breadcrumb-item" 
          :class="{ 'active': index === items.length - 1, 'clickable': index < items.length - 1 }"
          @click="index < items.length - 1 ? $emit('nav-click', item.id) : null"
          :title="item.name"
        >
          {{ item.name }}
        </span>
        <span v-if="index < items.length - 1" class="separator">&gt;</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  items: { id: string, name: string }[]
}>();

defineEmits(['nav-click']);

const breadcrumbRef = ref<HTMLElement | null>(null);

function handleWheel(e: WheelEvent) {
  if (breadcrumbRef.value) {
    breadcrumbRef.value.scrollLeft += e.deltaY;
  }
}
</script>

<style scoped>
.org-breadcrumb {
  display: flex;
  align-items: center;
  padding: var(--space-md) 0;
  padding-left: 1rem;
  /* 移除 width: 100%，允许在父容器中根据内容撑开 */
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.org-breadcrumb::-webkit-scrollbar {
  display: none;
}

.breadcrumb-items {
  display: flex;
  align-items: center;
  white-space: nowrap;
  gap: 4px; /* 使用 gap 替代 margin */
}

.breadcrumb-item {
  font-size: var(--font-size-base);
  color: var(--text-color-secondary);
  transition: color 0.2s;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  vertical-align: middle;
}

.breadcrumb-item.clickable {
  cursor: pointer;
}

.breadcrumb-item.clickable:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: var(--text-color);
  font-weight: var(--font-weight-semibold);
  cursor: default;
}

.separator {
  color: var(--text-color-tertiary);
  font-size: var(--font-size-sm);
  padding: 0 4px;
}
</style>
