<template>
  <div class="dept-list-view">
    <div v-if="!items.length" class="empty-state">
      <div class="empty-text">暂无子部门</div>
    </div>
    <div v-else class="list-items">
      <div v-for="item in items" :key="item.id" class="list-item" @click="$emit('enter', item)">
        
        <!-- 图标区域 -->
        <div class="item-icon">
          <svg class="list-icon list-icon--department" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <rect width="36" height="36" rx="18" fill="currentColor" fill-opacity="0.25" />
            <g clip-path="url(#clip0_dept_select)">
              <path d="M15 18C15 17.0572 15 16.5858 14.6583 16.2929C14.3166 16 13.7666 16 12.6667 16C11.5667 16 11.0168 16 10.675 16.2929C10.3333 16.5858 10.3333 17.0572 10.3333 18C10.3333 18.9428 10.3333 19.4142 10.675 19.7071C11.0168 20 11.5667 20 12.6667 20C13.7666 20 14.3166 20 14.6583 19.7071C15 19.4142 15 18.9428 15 18Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M23.6667 13.3333C23.6667 12.3904 23.6667 11.919 23.3933 11.6261C23.1199 11.3333 22.68 11.3333 21.8 11.3333H20.8667C19.9867 11.3333 19.5467 11.3333 19.2734 11.6261C19 11.919 19 12.3904 19 13.3333C19 14.2761 19 14.7475 19.2734 15.0404C19.5467 15.3333 19.9867 15.3333 20.8667 15.3333H21.8C22.68 15.3333 23.1199 15.3333 23.3933 15.0404C23.6667 14.7475 23.6667 14.2761 23.6667 13.3333Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M23.6667 22.6667C23.6667 21.7239 23.6667 21.2525 23.3933 20.9596C23.1199 20.6667 22.68 20.6667 21.8 20.6667H20.8667C19.9867 20.6667 19.5467 20.6667 19.2734 20.9596C19 21.2525 19 21.7239 19 22.6667C19 23.6096 19 24.081 19.2734 24.3739C19.5467 24.6667 19.9867 24.6667 20.8667 24.6667H21.8C22.68 24.6667 23.1199 24.6667 23.3933 24.3739C23.6667 24.081 23.6667 23.6096 23.6667 22.6667Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M17 17.9994L17 20.6975C17 21.9468 17.6114 22.5078 19 22.6667M17 17.9994L17 15.3014C17 14.1231 17.5194 13.5057 19 13.3334M17 17.9994L15 17.9994" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </g>
            <defs>
              <clipPath id="clip0_dept_select">
                <rect width="16" height="16" fill="white" transform="translate(9 10)" />
              </clipPath>
            </defs>
          </svg>
        </div>

        <!-- 内容区域 -->
        <div class="item-content">
          <div class="item-name">{{ item.nickname || item.name }}</div>
        </div>

        <!-- 选择按钮 -->
        <button class="select-btn" @click.stop="$emit('select', item)">
          选择
        </button>
        
        <!-- 进入下级指示箭头 -->
        <div class="enter-icon">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrgNode } from '@/types/organization';

defineProps<{
  items: OrgNode[]
}>();

defineEmits(['enter', 'select']);
</script>

<style scoped>
.dept-list-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.dept-list-view::-webkit-scrollbar {
  display: none;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  color: var(--text-color-secondary);
}

.list-items {
  display: flex;
  flex-direction: column;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color-light);
  cursor: pointer;
  transition: background-color 0.2s;
}

.list-item:hover {
  background-color: var(--bg-color-hover);
}

.item-icon {
  width: 36px;
  height: 36px;
  margin-right: 12px;
  color: var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-icon {
  width: 100%;
  height: 100%;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-btn {
  padding: 4px 12px;
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 8px;
}

.select-btn:hover {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.enter-icon {
  color: var(--text-color-tertiary);
  display: flex;
  align-items: center;
}
</style>