<template>
  <div class="org-list-view">
    <div v-if="!items.length" class="empty-state">
      <div class="empty-text">暂无成员或子部门</div>
    </div>
    <div v-else class="list-items">
      <div v-for="item in items" :key="item.id" class="list-item" @click="handleItemClick(item)">
        
        <!-- 图标区域 -->
        <div class="item-icon">
          <!-- 部门/组织图标 -->
          <svg v-if="item.type === 'department' || item.type === 'org'" 
            :class="['list-icon', item.type === 'department' ? 'list-icon--department' : 'list-icon--org']"
            viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <rect width="36" height="36" rx="18" fill="currentColor" fill-opacity="0.25" />
            <g clip-path="url(#clip0_129_420)">
              <path d="M15 18C15 17.0572 15 16.5858 14.6583 16.2929C14.3166 16 13.7666 16 12.6667 16C11.5667 16 11.0168 16 10.675 16.2929C10.3333 16.5858 10.3333 17.0572 10.3333 18C10.3333 18.9428 10.3333 19.4142 10.675 19.7071C11.0168 20 11.5667 20 12.6667 20C13.7666 20 14.3166 20 14.6583 19.7071C15 19.4142 15 18.9428 15 18Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M23.6667 13.3333C23.6667 12.3904 23.6667 11.919 23.3933 11.6261C23.1199 11.3333 22.68 11.3333 21.8 11.3333H20.8667C19.9867 11.3333 19.5467 11.3333 19.2734 11.6261C19 11.919 19 12.3904 19 13.3333C19 14.2761 19 14.7475 19.2734 15.0404C19.5467 15.3333 19.9867 15.3333 20.8667 15.3333H21.8C22.68 15.3333 23.1199 15.3333 23.3933 15.0404C23.6667 14.7475 23.6667 14.2761 23.6667 13.3333Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M23.6667 22.6667C23.6667 21.7239 23.6667 21.2525 23.3933 20.9596C23.1199 20.6667 22.68 20.6667 21.8 20.6667H20.8667C19.9867 20.6667 19.5467 20.6667 19.2734 20.9596C19 21.2525 19 21.7239 19 22.6667C19 23.6096 19 24.081 19.2734 24.3739C19.5467 24.6667 19.9867 24.6667 20.8667 24.6667H21.8C22.68 24.6667 23.1199 24.6667 23.3933 24.3739C23.6667 24.081 23.6667 23.6096 23.6667 22.6667Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M17 17.9994L17 20.6975C17 21.9468 17.6114 22.5078 19 22.6667M17 17.9994L17 15.3014C17 14.1231 17.5194 13.5057 19 13.3334M17 17.9994L15 17.9994" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </g>
            <defs>
              <clipPath id="clip0_129_420">
                <rect width="16" height="16" fill="white" transform="translate(9 10)" />
              </clipPath>
            </defs>
          </svg>
          
          <!-- 人员图标 -->
          <svg v-else class="list-icon list-icon--person" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="36" height="36" aria-hidden="true" focusable="false">
            <rect width="1024" height="1024" rx="512" fill="currentColor" fill-opacity="0.25" />
            <path d="M828.3 818.2c-8-66.8-31.8-129.9-68.7-182.4-31.8-45.2-72.1-81-117.7-104.6 27.5-20.6 49.7-47.2 64.9-78 19.6-39.6 26.4-84.2 19.7-128.8-6.5-43.2-26-83.2-56.4-115.7-30.6-32.7-69.2-54.7-111.9-63.6-15.7-3.3-31.5-4.9-47-4.9-58.2 0-112.9 22.7-154 63.8s-63.8 95.8-63.8 154c0 38.3 10.2 76 29.5 108.9 14.7 25 34.3 46.9 57.6 64.4-45.6 23.7-86 59.5-117.7 104.7-36.9 52.5-60.7 115.5-68.7 182.4-2 16.3 3.2 32.8 14.2 45.1 11.1 12.5 26.9 19.7 43.5 19.7h518.8c16.6 0 32.5-7.2 43.5-19.7 10.9-12.6 16.1-29.1 14.2-45.3zM429.2 586.4c20.1-8.5 33.6-27.3 35.2-49.2 1.5-21.8-9.2-42.4-28.1-53.7-45.2-27-72.2-74-72.2-125.6 0-81.1 65.9-147 147-147 10.6 0 21.5 1.1 32.5 3.4 57.6 12 103.9 61.6 112.8 120.6 9 60.3-18 117.3-70.4 148.7-18.8 11.2-29.5 31.7-28.1 53.7 1.6 21.9 15 40.7 35.2 49.2 84.6 35.7 146 121.6 162.5 225.6H266.4C283.3 708 344.8 622 429.2 586.4z" fill="currentColor" transform="translate(512, 512) scale(0.6) translate(-512, -512)"></path>
          </svg>
        </div>

        <!-- 内容区域 -->
        <div class="item-content">
          <div class="item-name">{{ item.nickname || item.name }}</div>
          <div v-if="item.type === 'person' && item.role" class="item-role">{{ item.role }}</div>
        </div>

        <!-- 详情按钮 (仅部门/组织) -->
        <button v-if="item.type === 'department' || item.type === 'org'" class="detail-btn" @click.stop="handleDetailClick(item)">
          <svg class="detail-icon" viewBox="0 0 6 10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" fill="none">
            <path d="M1.00003 1C1.00003 1 4.99999 3.94596 5 5.00003C5.00001 6.05411 1 9 1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrgNode } from '@/types/organization';

const props = defineProps<{
  items: OrgNode[]
}>();

const emit = defineEmits(['itemClick', 'show-detail']);

function handleItemClick(item: OrgNode) {
  emit('itemClick', item);
}

function handleDetailClick(item: OrgNode) {
  emit('show-detail', item);
}
</script>

<style scoped>
.org-list-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  /* 隐藏滚动条但保持功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.org-list-view::-webkit-scrollbar {
  display: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: var(--text-color-secondary);
  background: var(--bg-color-third);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  position: relative;
}

.empty-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 8px; /* 使用 gap 替代 margin */
  padding: 0.1rem; /* 稍微给点内边距防止贴边 */
}

.list-item {
  display: flex;
  align-items: center;
  background: var(--bg-color-third);
  border-radius: var(--border-radius-md);
  padding: var(--space-md);
  gap: var(--space-md); /* 内部元素间距 */
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.list-item:hover {
  background: var(--bg-color-secondary);
  box-shadow: var(--shadow-sm);
  border-color: var(--border-color);
}

.list-item:active {
  background: var(--color-primary-light);
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.list-icon {
  width: 100%;
  height: 100%;
  color: var(--text-color-secondary);
}

.list-icon--department, .list-icon--org {
  color: var(--color-primary);
}

.list-icon--person {
  color: #FFC107;
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  overflow: hidden;
}

.item-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-role {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px 6px;
  border-radius: 4px;
}

.detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-color-tertiary);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
  padding: 0;
}

.detail-btn:hover {
  background: var(--bg-color-hover);
  color: var(--color-primary);
}

.detail-icon {
  width: 12px;
  height: 12px;
}
</style>
