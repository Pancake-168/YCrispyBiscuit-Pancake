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

  <div v-else class="selector-overlay yj-dialog-mask" @click.self="handleClose">
    <div class="selector-modal yj-dialog-content">
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
import { useOrganizationStore } from '@/stores/Organization';
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

const store = useOrganizationStore();
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
    return String(u.type || 'user') === props.targetType;
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
  background: color-mix(in srgb, var(--bg-color) 88%, transparent);
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
  background: var(--panel-bg);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  box-shadow: var(--glass-shadow);
  overflow: hidden;
}

.modal-header {
  padding: var(--space-lg);
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--panel-bg);
}

.modal-title {
  margin: 0;
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-color);
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--hover-bg);
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
  font-size: var(--font-xs);
  color: var(--text-muted);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
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
  color: var(--text-muted);
  font-size: var(--font-xs);
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
  border-bottom: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  margin-bottom: var(--space-sm);
}

.inline-title {
  font-size: var(--font-xs);
  color: var(--text-color);
  font-weight: 600;
}

.inline-subtitle {
  margin-top: 4px;
  font-size: var(--font-xs);
  color: var(--text-muted);
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
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
}

.row:hover {
  border-color: color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--hover-bg);
}

.row-main {
  min-width: 0;
  flex: 1;
}

.name {
  font-size: var(--font-xs);
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub {
  font-size: var(--font-xs);
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-btn {
  padding: 4px 12px;
  background-color: var(--panel-bg);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  border-radius: 4px;
  color: var(--text-color);
  font-size: var(--font-xs);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.select-btn:hover {
  background-color: var(--primary-color);
  color: var(--btn-text);
  border-color: var(--primary-color);
}

.confirm-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--bg-color) 88%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-box {
  width: 360px;
  max-width: 92vw;
  background: var(--panel-bg);
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  box-shadow: var(--glass-shadow);
  padding: var(--space-lg);
}

.confirm-title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: var(--space-md);
}

.confirm-content {
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.highlight {
  color: var(--text-color);
  font-weight: 500;
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
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--panel-bg);
  color: var(--text-color);
  cursor: pointer;
}

.btn-confirm {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: var(--btn-text);
}
</style>
