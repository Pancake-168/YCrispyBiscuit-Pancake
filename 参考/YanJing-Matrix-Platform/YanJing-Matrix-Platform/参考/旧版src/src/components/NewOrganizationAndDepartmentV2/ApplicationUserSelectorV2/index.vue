<template>
  <div v-if="inline" class="inline-root">
    <div class="inline-header">
      <div class="inline-title">{{ title || defaultTitle }}</div>
      <div class="inline-subtitle">{{ organizationName }}</div>
    </div>

    <div v-if="loading" class="empty">加载中...</div>
    <div v-else-if="!filteredUsers.length" class="empty">暂无数据</div>

    <div v-else class="list">
      <div v-for="u in filteredUsers" :key="u.id" class="row" @click="requestSelect(u)">
        <div class="row-main">
          <div class="name">{{ u.nickname || u.username }}</div>
          <div class="sub">{{ u.username }}</div>
        </div>
        <button class="select-btn" type="button" @click.stop="requestSelect(u)">选择</button>
      </div>
    </div>
  </div>

  <div v-else class="selector-overlay" @click.self="handleClose">
    <div class="selector-modal">
      <div class="modal-header">
        <h3 class="modal-title">{{ title || defaultTitle }}</h3>
        <button class="close-btn" @click="handleClose" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="subtitle">{{ organizationName }}</div>

        <div v-if="loading" class="empty">加载中...</div>
        <div v-else-if="!filteredUsers.length" class="empty">暂无数据</div>

        <div v-else class="list">
          <div v-for="u in filteredUsers" :key="u.id" class="row" @click="requestSelect(u)">
            <div class="row-main">
              <div class="name">{{ u.nickname || u.username }}</div>
              <div class="sub">{{ u.username }}</div>
            </div>
            <button class="select-btn" type="button" @click.stop="requestSelect(u)">选择</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <div class="confirm-title">确认选择</div>
        <div class="confirm-content">是否确认选择：<span class="highlight">{{ pending?.nickname || pending?.username }}</span> ?</div>
        <div class="confirm-actions">
          <button class="btn-cancel" type="button" @click="showConfirm = false">取消</button>
          <button class="btn-confirm" type="button" @click="confirmSelect">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useOrganizationStoreV2 } from '@/stores/organizationV2';
import type { ApplicationUserItem } from '@/types/application';
import type { ApplicationUserSelectorTargetType } from './open';

const props = defineProps<{
  appid: string;
  targetType: ApplicationUserSelectorTargetType;
  title?: string;
  inline?: boolean;
  confirm?: boolean;
  onSelect?: (item: ApplicationUserItem) => void;
  onClose?: () => void;
}>();

const store = useOrganizationStoreV2();
const { applicationUsersByAppId, currentOrganization } = storeToRefs(store);

const loading = ref(false);
const showConfirm = ref(false);
const pending = ref<ApplicationUserItem | null>(null);

const inline = computed(() => !!props.inline);
const confirmEnabled = computed(() => props.confirm !== false);

const defaultTitle = computed(() => (props.targetType === 'bot' ? '选择机器人' : '选择成员'));

const organizationName = computed(() => {
  if (currentOrganization.value && String(currentOrganization.value.app_id) === String(props.appid)) {
    return currentOrganization.value.name || currentOrganization.value.app_id || '';
  }
  return props.appid;
});

const response = computed(() => applicationUsersByAppId.value.get(props.appid));

const filteredUsers = computed(() => {
  const res = response.value;
  const list = res?.data || [];
  return list.filter((u) => {
    // 后端/类型里约定 u.type 为 'user' | 'bot'
    return String((u as any).type || 'user') === props.targetType;
  });
});

async function ensureLoaded() {
  if (!props.appid) return;
  if (applicationUsersByAppId.value.has(props.appid)) return;

  loading.value = true;
  try {
    await store.loadApplicationUsers(props.appid);
  } finally {
    loading.value = false;
  }
}

function requestSelect(u: ApplicationUserItem) {
  if (!confirmEnabled.value) {
    props.onSelect?.(u);
    if (!inline.value) {
      handleClose();
    }
    return;
  }

  pending.value = u;
  showConfirm.value = true;
}

function confirmSelect() {
  if (pending.value) {
    props.onSelect?.(pending.value);
  }
  if (!inline.value) {
    handleClose();
  }
  showConfirm.value = false;
  pending.value = null;
}

function handleClose() {
  props.onClose?.();
}

watch(
  () => props.appid,
  () => {
    ensureLoaded();
  },
  { immediate: true }
);

onMounted(() => {
  ensureLoaded();
});
</script>

<style scoped>
.selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--bg-color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.selector-modal {
  width: 560px;
  max-width: 92vw;
  height: 72vh;
  background: var(--bg-color-third);
  border-radius: var(--border-radius-lg);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-color-secondary);
}

.modal-title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color);
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-color-secondary);
  padding: 4px;
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--bg-color-hover);
  color: var(--text-color);
}

.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: var(--space-md);
}

.subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--space-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
}

.list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list::-webkit-scrollbar {
  display: none;
}

.inline-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.inline-header {
  padding: 0 0 var(--space-sm) 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--space-sm);
}

.inline-title {
  font-size: var(--font-size-sm);
  color: var(--text-color);
  font-weight: var(--font-weight-semibold);
}

.inline-subtitle {
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--bg-color-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid transparent;
  cursor: pointer;
}

.row:hover {
  border-color: var(--border-color);
  background: var(--bg-color-hover);
}

.row-main {
  min-width: 0;
  flex: 1;
}

.name {
  font-size: var(--font-size-sm);
  color: var(--text-color);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
  margin-top: 2px;
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
  flex-shrink: 0;
}

.select-btn:hover {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.confirm-overlay {
  position: absolute;
  inset: 0;
  background: var(--bg-color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-box {
  width: 360px;
  max-width: 92vw;
  background: var(--bg-color-third);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  padding: var(--space-lg);
}

.confirm-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color);
  margin-bottom: var(--space-md);
}

.confirm-content {
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
}

.highlight {
  color: var(--text-color);
  font-weight: var(--font-weight-medium);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.btn-cancel,
.btn-confirm {
  padding: 6px 14px;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-color-secondary);
  color: var(--text-color);
  cursor: pointer;
}

.btn-confirm {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}
</style>
