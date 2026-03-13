<template>
  <div class="dept-list-view">
    <div v-if="!items.length" class="empty-state">
      <div class="empty-text">暂无数据</div>
    </div>

    <div v-else class="list-items">
      <div
        v-for="item in items"
        :key="item.id"
        class="list-item"
        @click="handleRowClick(item)"
      >
        <div class="item-icon">
          <svg
            v-if="item.type === 'department' || item.type === 'org'"
            class="list-icon list-icon--department"
            viewBox="0 0 36 36"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <rect width="36" height="36" rx="18" fill="currentColor" fill-opacity="0.25" />
            <g clip-path="url(#clip0_dept_select_v2)">
              <path
                d="M15 18C15 17.0572 15 16.5858 14.6583 16.2929C14.3166 16 13.7666 16 12.6667 16C11.5667 16 11.0168 16 10.675 16.2929C10.3333 16.5858 10.3333 17.0572 10.3333 18C10.3333 18.9428 10.3333 19.4142 10.675 19.7071C11.0168 20 11.5667 20 12.6667 20C13.7666 20 14.3166 20 14.6583 19.7071C15 19.4142 15 18.9428 15 18Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M23.6667 13.3333C23.6667 12.3904 23.6667 11.919 23.3933 11.6261C23.1199 11.3333 22.68 11.3333 21.8 11.3333H20.8667C19.9867 11.3333 19.5467 11.3333 19.2734 11.6261C19 11.919 19 12.3904 19 13.3333C19 14.2761 19 14.7475 19.2734 15.0404C19.5467 15.3333 19.9867 15.3333 20.8667 15.3333H21.8C22.68 15.3333 23.1199 15.3333 23.3933 15.0404C23.6667 14.7475 23.6667 14.2761 23.6667 13.3333Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M23.6667 22.6667C23.6667 21.7239 23.6667 21.2525 23.3933 20.9596C23.1199 20.6667 22.68 20.6667 21.8 20.6667H20.8667C19.9867 20.6667 19.5467 20.6667 19.2734 20.9596C19 21.2525 19 21.7239 19 22.6667C19 23.6096 19 24.081 19.2734 24.3739C19.5467 24.6667 19.9867 24.6667 20.8667 24.6667H21.8C22.68 24.6667 23.1199 24.6667 23.3933 24.3739C23.6667 24.081 23.6667 23.6096 23.6667 22.6667Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M17 17.9994L17 20.6975C17 21.9468 17.6114 22.5078 19 22.6667M17 17.9994L17 15.3014C17 14.1231 17.5194 13.5057 19 13.3334M17 17.9994L15 17.9994"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_dept_select_v2">
                <rect width="16" height="16" fill="white" transform="translate(9 10)" />
              </clipPath>
            </defs>
          </svg>

          <svg
            v-else-if="item.type === 'post'"
            class="list-icon list-icon--post"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <rect width="1024" height="1024" rx="512" fill="currentColor" fill-opacity="0.25" />
            <path
              d="M512 128c212.1 0 384 171.9 384 384S724.1 896 512 896 128 724.1 128 512 299.9 128 512 128zm0 96c-159 0-288 129-288 288s129 288 288 288 288-129 288-288S671 224 512 224zm-64 160h256v96H448v-96zm0 160h256v96H448v-96z"
              fill="currentColor"
            />
          </svg>

          <svg
            v-else
            class="list-icon list-icon--person"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <rect width="1024" height="1024" rx="512" fill="currentColor" fill-opacity="0.25" />
            <path
              d="M828.3 818.2c-8-66.8-31.8-129.9-68.7-182.4-31.8-45.2-72.1-81-117.7-104.6 27.5-20.6 49.7-47.2 64.9-78 19.6-39.6 26.4-84.2 19.7-128.8-6.5-43.2-26-83.2-56.4-115.7-30.6-32.7-69.2-54.7-111.9-63.6-15.7-3.3-31.5-4.9-47-4.9-58.2 0-112.9 22.7-154 63.8s-63.8 95.8-63.8 154c0 38.3 10.2 76 29.5 108.9 14.7 25 34.3 46.9 57.6 64.4-45.6 23.7-86 59.5-117.7 104.7-36.9 52.5-60.7 115.5-68.7 182.4-2 16.3 3.2 32.8 14.2 45.1 11.1 12.5 26.9 19.7 43.5 19.7h518.8c16.6 0 32.5-7.2 43.5-19.7 10.9-12.6 16.1-29.1 14.2-45.3z"
              fill="currentColor"
              transform="translate(512, 512) scale(0.6) translate(-512, -512)"
            />
          </svg>
        </div>

        <div class="item-content">
          <div class="item-name">{{ item.name }}</div>
        </div>

        <button
          v-if="isSelectable(item)"
          class="select-btn"
          @click.stop="$emit('select', item)"
        >
          选择
        </button>

        <div v-if="canEnter(item)" class="enter-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrgNodeV2 } from '@/types/organizationV2';
import type { SelectorCategoryV2 } from './open';

const emit = defineEmits<{
  enter: [item: OrgNodeV2];
  select: [item: OrgNodeV2];
}>();

const props = defineProps<{
  items: OrgNodeV2[];
  category: SelectorCategoryV2;
}>();

function isSelectable(item: OrgNodeV2) {
  if (props.category === 'department') return item.type === 'department';
  if (props.category === 'post') return item.type === 'post';
  return item.type === 'person';
}

function canEnter(item: OrgNodeV2) {
  if (item.type === 'org' || item.type === 'department') return true;
  // 只有在「人员选择」场景下，进入职位才有意义（可继续下钻到人员）
  if (item.type === 'post') return props.category === 'person';
  return false;
}

function handleRowClick(item: OrgNodeV2) {
  if (canEnter(item)) {
    emit('enter', item);
  }
}
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
  color: var(--text-color-secondary);
}

.list-icon--department {
  color: var(--color-primary);
}

.list-icon--post {
  color: var(--color-primary);
}

.list-icon--person {
  color: var(--color-success);
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
