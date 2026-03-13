<template>
  <div class="org-list-view">
    <!-- 左侧：原列表区域 -->
    <div class="org-list-main">
      <div v-if="!items.length" class="empty-state">
        <div class="empty-text">暂无成员或子部门</div>
      </div>
      <div v-else class="list-items">
        <div v-for="item in items" :key="item.id" class="list-item" @click="handleItemClick(item)">

          <!-- 图标区域 -->
          <div class="item-icon">
            <!-- 部门/组织图标 -->
            <svg v-if="item.type === 'department' || item.type === 'org'"
              :class="['list-icon', getIconClass(item.type)]" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true" focusable="false">
              <rect width="36" height="36" rx="18" fill="currentColor" fill-opacity="0.25" />
              <g clip-path="url(#clip0_129_420)">
                <!-- 统一使用文件夹图标，通过颜色区分，或者将来换图标 -->
                <path
                  d="M15 18C15 17.0572 15 16.5858 14.6583 16.2929C14.3166 16 13.7666 16 12.6667 16C11.5667 16 11.0168 16 10.675 16.2929C10.3333 16.5858 10.3333 17.0572 10.3333 18C10.3333 18.9428 10.3333 19.4142 10.675 19.7071C11.0168 20 11.5667 20 12.6667 20C13.7666 20 14.3166 20 14.6583 19.7071C15 19.4142 15 18.9428 15 18Z"
                  stroke="currentColor" stroke-width="1.5" />
                <path
                  d="M23.6667 13.3333C23.6667 12.3904 23.6667 11.919 23.3933 11.6261C23.1199 11.3333 22.68 11.3333 21.8 11.3333H20.8667C19.9867 11.3333 19.5467 11.3333 19.2734 11.6261C19 11.919 19 12.3904 19 13.3333C19 14.2761 19 14.7475 19.2734 15.0404C19.5467 15.3333 19.9867 15.3333 20.8667 15.3333H21.8C22.68 15.3333 23.1199 15.3333 23.3933 15.0404C23.6667 14.7475 23.6667 14.2761 23.6667 13.3333Z"
                  stroke="currentColor" stroke-width="1.5" />
                <path
                  d="M23.6667 22.6667C23.6667 21.7239 23.6667 21.2525 23.3933 20.9596C23.1199 20.6667 22.68 20.6667 21.8 20.6667H20.8667C19.9867 20.6667 19.5467 20.6667 19.2734 20.9596C19 21.2525 19 21.7239 19 22.6667C19 23.6096 19 24.081 19.2734 24.3739C19.5467 24.6667 19.9867 24.6667 20.8667 24.6667H21.8C22.68 24.6667 23.1199 24.6667 23.3933 24.3739C23.6667 24.081 23.6667 23.6096 23.6667 22.6667Z"
                  stroke="currentColor" stroke-width="1.5" />
                <path
                  d="M17 17.9994L17 20.6975C17 21.9468 17.6114 22.5078 19 22.6667M17 17.9994L17 15.3014C17 14.1231 17.5194 13.5057 19 13.3334M17 17.9994L15 17.9994"
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </g>
              <defs>
                <clipPath id="clip0_129_420">
                  <rect width="16" height="16" fill="white" transform="translate(9 10)" />
                </clipPath>
              </defs>
            </svg>

            <svg v-else-if="item.type === 'post'" class="list-icon list-icon--post" viewBox="0 0 1024 1024"
              version="1.1" xmlns="http://www.w3.org/2000/svg" width="36" height="36" aria-hidden="true"
              focusable="false">
              <rect width="1024" height="1024" rx="512" fill="currentColor" fill-opacity="0.25" />
              <path
                d="M828.3 818.2c-8-66.8-31.8-129.9-68.7-182.4-31.8-45.2-72.1-81-117.7-104.6 27.5-20.6 49.7-47.2 64.9-78 19.6-39.6 26.4-84.2 19.7-128.8-6.5-43.2-26-83.2-56.4-115.7-30.6-32.7-69.2-54.7-111.9-63.6-15.7-3.3-31.5-4.9-47-4.9-58.2 0-112.9 22.7-154 63.8s-63.8 95.8-63.8 154c0 38.3 10.2 76 29.5 108.9 14.7 25 34.3 46.9 57.6 64.4-45.6 23.7-86 59.5-117.7 104.7-36.9 52.5-60.7 115.5-68.7 182.4-2 16.3 3.2 32.8 14.2 45.1 11.1 12.5 26.9 19.7 43.5 19.7h518.8c16.6 0 32.5-7.2 43.5-19.7 10.9-12.6 16.1-29.1 14.2-45.3zM429.2 586.4c20.1-8.5 33.6-27.3 35.2-49.2 1.5-21.8-9.2-42.4-28.1-53.7-45.2-27-72.2-74-72.2-125.6 0-81.1 65.9-147 147-147 10.6 0 21.5 1.1 32.5 3.4 57.6 12 103.9 61.6 112.8 120.6 9 60.3-18 117.3-70.4 148.7-18.8 11.2-29.5 31.7-28.1 53.7 1.6 21.9 15 40.7 35.2 49.2 84.6 35.7 146 121.6 162.5 225.6H266.4C283.3 708 344.8 622 429.2 586.4z"
                fill="currentColor" transform="translate(512, 512) scale(0.6) translate(-512, -512)"></path>
            </svg>



            <!-- 人员图标 -->
            <svg v-else class="list-icon list-icon--person" viewBox="0 0 1024 1024" version="1.1"
              xmlns="http://www.w3.org/2000/svg" width="36" height="36" aria-hidden="true" focusable="false">
              <rect width="1024" height="1024" rx="512" fill="currentColor" fill-opacity="0.25" />
              <path
                d="M828.3 818.2c-8-66.8-31.8-129.9-68.7-182.4-31.8-45.2-72.1-81-117.7-104.6 27.5-20.6 49.7-47.2 64.9-78 19.6-39.6 26.4-84.2 19.7-128.8-6.5-43.2-26-83.2-56.4-115.7-30.6-32.7-69.2-54.7-111.9-63.6-15.7-3.3-31.5-4.9-47-4.9-58.2 0-112.9 22.7-154 63.8s-63.8 95.8-63.8 154c0 38.3 10.2 76 29.5 108.9 14.7 25 34.3 46.9 57.6 64.4-45.6 23.7-86 59.5-117.7 104.7-36.9 52.5-60.7 115.5-68.7 182.4-2 16.3 3.2 32.8 14.2 45.1 11.1 12.5 26.9 19.7 43.5 19.7h518.8c16.6 0 32.5-7.2 43.5-19.7 10.9-12.6 16.1-29.1 14.2-45.3zM429.2 586.4c20.1-8.5 33.6-27.3 35.2-49.2 1.5-21.8-9.2-42.4-28.1-53.7-45.2-27-72.2-74-72.2-125.6 0-81.1 65.9-147 147-147 10.6 0 21.5 1.1 32.5 3.4 57.6 12 103.9 61.6 112.8 120.6 9 60.3-18 117.3-70.4 148.7-18.8 11.2-29.5 31.7-28.1 53.7 1.6 21.9 15 40.7 35.2 49.2 84.6 35.7 146 121.6 162.5 225.6H266.4C283.3 708 344.8 622 429.2 586.4z"
                fill="currentColor" transform="translate(512, 512) scale(0.6) translate(-512, -512)"></path>
            </svg>
          </div>

          <!-- 内容区域 -->
          <div class="item-content">
            <div class="item-name">{{ item.name }}</div>
            <!-- V2 Person 可以展示 Title 或 Post 信息 (如果 node 里有的话，目前 OrgNodeV2 不一定有 role 字段，这里假设有或者展示 loadStatus 作为调试) -->
            <!-- 如果是 loading 状态，显示加载中 -->
            <div v-if="item.loadStatus === 'loading'" class="item-role">加载中...</div>
          </div>

          <!-- 详情按钮 (仅部门/组织/职位) -->
          <button v-if="item.type === 'department' || item.type === 'org' || item.type === 'post'" class="detail-btn"
            @click.stop="handleDetailClick(item)">
            <svg class="detail-icon" viewBox="0 0 6 10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
              focusable="false" fill="none">
              <path d="M1.00003 1C1.00003 1 4.99999 3.94596 5 5.00003C5.00001 6.05411 1 9 1 9" stroke="currentColor"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧：可折叠用户列表面板（按 appid 缓存的 GetApplicationUserResponse） -->
    <!--div class="org-users-panel" :class="{ collapsed: usersPanelCollapsed }">
      <div class="org-users-header">
        <div v-if="!usersPanelCollapsed" class="org-users-title">
          成员
          <span class="org-users-count">{{ usersCount }}</span>
        </div>

        <button class="org-users-toggle" type="button" @click="toggleUsersPanel" :title="usersPanelCollapsed ? '展开' : '折叠'">
          <svg class="org-users-toggle-icon" viewBox="0 0 6 10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" fill="none">
            <path
              v-if="!usersPanelCollapsed"
              d="M1.00003 1C1.00003 1 4.99999 3.94596 5 5.00003C5.00001 6.05411 1 9 1 9"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path
              v-else
              d="M5 1C5 1 1.00004 3.94596 1.00003 5.00003C1.00002 6.05411 5 9 5 9"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div v-if="!usersPanelCollapsed" class="org-users-content">
        <div class="org-users-subtitle">
          {{ currentOrganizationName }}
        </div>

        <div v-if="!applicationUsers" class="org-users-empty">加载中...</div>
        <div v-else-if="!applicationUsers.data || applicationUsers.data.length === 0" class="org-users-empty">暂无成员</div>

        <div v-else class="org-users-list">
          <div
            v-for="u in applicationUsers.data"
            :key="u.id"
            class="org-user-row"
            role="button"
            tabindex="0"
            @click="handleUserRowClick(u.username)"
            @keydown.enter.prevent="handleUserRowClick(u.username)"
          >
            <div class="org-user-name">{{ u.nickname || u.username }}</div>
            <div class="org-user-sub">{{ u.username }}<span v-if="u.type" class="org-user-type">{{ u.type }}</span></div>
          </div>
        </div>
      </div>
    </div-->
  </div>
</template>

<script setup lang="ts">
//import { computed, ref } from 'vue';
import type { OrgNodeV2 } from '@/types/Organization';
//import { useOrganizationStore } from '@/stores/Organization';
//import { storeToRefs } from 'pinia';

defineProps<{
  items: OrgNodeV2[]
}>();

const emit = defineEmits(['itemClick', 'show-detail', 'user-talk']);
/*
const store = useOrganizationStore();

const { currentApplicationUsers } = storeToRefs(store);

const { currentOrganization } = storeToRefs(store);
const usersPanelCollapsed = ref(true);

const applicationUsers = computed(() => currentApplicationUsers.value);

const usersCount = computed(() => {
  const res = applicationUsers.value;
  if (!res) return 0;
  return Number(res?.meta?.count ?? res?.data?.length ?? 0);
});

const currentOrganizationName = computed(() => {
  return currentOrganization.value?.name || currentOrganization.value?.app_id || '';
});

function toggleUsersPanel() {
  usersPanelCollapsed.value = !usersPanelCollapsed.value;
}

function handleUserRowClick(username: string) {
  emit('user-talk', username);
}

*/
function handleItemClick(item: OrgNodeV2) {
  emit('itemClick', item);
}

function handleDetailClick(item: OrgNodeV2) {
  emit('show-detail', item);
}



function getIconClass(type: string) {
  switch (type) {
    case 'org': return 'list-icon--org';
    case 'department': return 'list-icon--department';
    case 'post': return 'list-icon--post';
    default: return '';
  }
}
</script>

<style scoped>
.org-list-view {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* 隐藏滚动条但保持功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.org-list-view::-webkit-scrollbar {
  display: none;
}

.org-list-main {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.org-list-main::-webkit-scrollbar {
  display: none;
}

.org-users-panel {
  display: flex;
  flex-direction: column;
  width: 280px;
  height: 100%;
  flex-shrink: 0;
  margin-left: var(--space-sm);
  background: var(--panel-bg);
  overflow: hidden;
}

.org-users-panel.collapsed {
  width: 40px;
}

.org-users-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm);
  gap: var(--space-sm);
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--panel-bg);
}

.org-users-title {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--text-color);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-users-count {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.org-users-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
}

.org-users-toggle:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
}

.org-users-toggle-icon {
  width: 12px;
  height: 12px;
}

.org-users-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.org-users-content::-webkit-scrollbar {
  display: none;
}

.org-users-subtitle {
  font-size: var(--font-xs);
  color: var(--text-muted);
  padding-bottom: var(--space-sm);

  margin-bottom: var(--space-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-users-empty {
  color: var(--text-muted);
  font-size: var(--font-xs);
  padding: var(--space-md);
  text-align: center;
}

.org-users-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.org-user-row {
  padding: var(--space-sm);
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
}

.org-user-row:hover {
  border-color: color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--hover-bg);
}

.org-user-name {
  font-size: var(--font-xs);
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-user-sub {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-xs);
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-user-type {
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--panel-bg);
  color: var(--text-muted);
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: var(--text-muted);
  background: var(--panel-bg);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  position: relative;
}

.empty-text {
  font-size: var(--font-md);
  font-weight: 500;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  /* 使用 gap 替代 margin */
  padding: var(--space-xs);
  /* 稍微给点内边距防止贴边 */
}

.list-item {
  display: flex;
  align-items: center;
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  gap: var(--space-md);
  /* 内部元素间距 */
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.list-item:hover {
  background: var(--panel-bg);
  box-shadow: var(--glass-shadow);
  border-color: color-mix(in srgb, var(--text-color) 16%, transparent);
}

.list-item:active {
  background: var(--active-bg);
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
  color: var(--text-muted);
}

.list-icon--department,
.list-icon--org {
  color: #0969da;
}

.list-icon--post {
  color: #f59e0b;
}

.list-icon--person {
  color: #16a34a;
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  overflow: hidden;
}

.item-name {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-role {
  font-size: var(--font-xs);
  color: var(--primary-color);
  background: var(--active-bg);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
  padding: 0;
}

.detail-btn:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
}

.detail-icon {
  width: 12px;
  height: 12px;
}
</style>
