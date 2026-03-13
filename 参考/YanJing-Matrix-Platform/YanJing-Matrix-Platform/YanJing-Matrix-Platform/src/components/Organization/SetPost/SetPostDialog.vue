<template>
  <div class="setpost-overlay yj-dialog-mask" @click.self="handleClose">
    <div class="setpost-modal yj-dialog-content">
      <div class="modal-header">
        <h3 class="modal-title">设置职位</h3>
        <button class="close-btn" type="button" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="subtitle">当前组织：{{ orgName }}</div>

        <div class="form">
          <div class="form-row">
            <div class="label">职位名称</div>
            <input v-model.trim="name" class="input" type="text" placeholder="请输入职位名称" :disabled="submitting" />
          </div>

          <div class="form-row">
            <div class="label">职位描述</div>
            <textarea v-model.trim="description" class="textarea" placeholder="请输入职位描述" :disabled="submitting"
              rows="3" />
          </div>
        </div>

        <div class="two-col">
          <!-- 左侧：选择器入口（复用 ApplicationUserSelectorV2） -->
          <div class="col left">
            <ApplicationUserSelectorV2 :appid="props.appid" targetType="user" title="用户列表选择器" :inline="true"
              :confirm="false" :onSelect="handleInlineSelect" :onClose="() => { }" />
          </div>

          <!-- 右侧：最终提交列表 -->
          <div class="col right">
            <div class="col-title">最终提交成员 ({{ selectedUserIds.length }})</div>
            <div class="list" v-if="selectedUserIds.length">
              <div v-for="uid in selectedUserIds" :key="uid" class="row">
                <div class="row-main">
                  <div class="name">{{ displayName(uid) }}</div>
                  <div class="sub">ID: {{ uid }}</div>
                </div>
                <button class="btn-danger" type="button" :disabled="submitting" @click="removeUser(uid)">删除</button>
              </div>
            </div>
            <div v-else class="empty">暂无成员</div>
          </div>
        </div>

        <div class="actions">
          <button class="btn-cancel" type="button" @click="handleClose" :disabled="submitting">取消</button>
          <button class="btn-confirm" type="button" @click="handleSubmit" :disabled="submitting || !canSubmit">
            {{ submitting ? '提交中...' : '确认更新' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useOrganizationStore } from '@/stores/Organization';
import { openMessageDialog } from '@/components/MessageDialog/open';
import { UpdateOrganizationPostV2 } from '@/services/Project/Organization/Post';
import ApplicationUserSelectorV2 from '@/components/Organization/ApplicationUserSelectorV2/index.vue';
import type { ApplicationUserItem } from '@/types/application';
import type { OrgNodeV2 } from '@/types/Organization';

const props = defineProps<{
  appid: string;
  postId: number;
  initialName: string;
  initialDescription: string;
  initialUserIds: number[];
  onClose?: () => void;
  onUpdated?: (payload: { name: string; description: string; userIds: number[] }) => void;
}>();

const store = useOrganizationStore();
const { currentOrganization, applicationUsersByAppId, flatMaps } = storeToRefs(store);

const name = ref(props.initialName || '');
const description = ref(props.initialDescription || '');
const selectedUserIds = ref<number[]>(Array.from(new Set((props.initialUserIds || []).map((x) => Number(x)).filter((x) => Number.isFinite(x)))));

const submitting = ref(false);

const orgName = computed(() => {
  if (currentOrganization.value && String(currentOrganization.value.app_id) === String(props.appid)) {
    return currentOrganization.value.name || currentOrganization.value.app_id || props.appid;
  }
  return props.appid;
});

const canSubmit = computed(() => String(props.appid || '').length > 0 && Number.isFinite(props.postId) && name.value.length > 0);

const appUsers = computed<ApplicationUserItem[]>(() => {
  return applicationUsersByAppId.value.get(props.appid)?.data || [];
});

function handleInlineSelect(user: ApplicationUserItem) {
  addUser(Number(user.id));
}

function displayName(uid: number) {
  const u = appUsers.value.find((x) => Number(x.id) === Number(uid));
  if (!u) return String(uid);
  return u.nickname || u.username || String(uid);
}

function addUser(uid: number) {
  const id = Number(uid);
  if (!Number.isFinite(id)) return;
  if (selectedUserIds.value.includes(id)) return;
  selectedUserIds.value = selectedUserIds.value.concat(id);
}

function removeUser(uid: number) {
  const id = Number(uid);
  selectedUserIds.value = selectedUserIds.value.filter((x) => x !== id);
}

async function ensureUsersLoaded() {
  if (!props.appid) return;
  if (applicationUsersByAppId.value.has(props.appid)) return;
  try {
    await store.loadApplicationUsers(props.appid);
  } catch {
    // ignore
  }
}

function updateStorePostSnapshot(payload: { name: string; description: string; userIds: number[] }) {
  const appId = props.appid;
  const postIdStr = String(props.postId);

  const map = flatMaps.value.get(appId);
  const node = map?.get(postIdStr);
  if (!map || !node || node.type !== 'post') return;

  node.name = payload.name;
  node.description = payload.description;

  const idSet = new Set(payload.userIds.map((x) => Number(x)));
  const persons: OrgNodeV2[] = [];
  for (const u of appUsers.value) {
    const uid = Number(u.id);
    if (!idSet.has(uid)) continue;
    persons.push({
      id: String(uid),
      type: 'person',
      name: u.nickname || u.username || String(uid),
      parentId: postIdStr,
      description: u.username ? `@${u.username}` : '',
    });
  }

  // 保底：如果成员列表里有些 uid 在应用成员里没找到，也要写入占位节点，避免 UI 数量不一致
  for (const uid of payload.userIds) {
    const exists = persons.some((p) => Number(p.id) === Number(uid));
    if (!exists) {
      persons.push({
        id: String(uid),
        type: 'person',
        name: String(uid),
        parentId: postIdStr,
        description: '',
      });
    }
  }

  node.children = persons;
  node.loadStatus = 'detail';

  flatMaps.value.set(appId, new Map(map));
  flatMaps.value = new Map(flatMaps.value);
}

async function handleSubmit() {
  if (!canSubmit.value) return;

  submitting.value = true;
  try {
    const userIds = selectedUserIds.value.map((x) => Number(x)).filter((x) => Number.isFinite(x));
    const res = await UpdateOrganizationPostV2(props.appid, props.postId, name.value, description.value, userIds);
    if (!res.ok) {
      openMessageDialog('更新失败');
      return;
    }

    openMessageDialog('更新成功');

    const payload = { name: name.value, description: description.value, userIds };
    updateStorePostSnapshot(payload);
    props.onUpdated?.(payload);

    handleClose();
  } catch (e) {
    console.warn('[System:SetPost:handleSubmit] 更新职位异常', e);
    openMessageDialog('更新异常');
  } finally {
    submitting.value = false;
  }
}

function handleClose() {
  props.onClose?.();
}

onMounted(() => {
  ensureUsersLoaded();
});
</script>

<style scoped>
.setpost-overlay {
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

.setpost-modal {
  width: 860px;
  max-width: 96vw;
  height: 78vh;
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
  gap: var(--space-md);
}

.subtitle {
  font-size: var(--font-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: var(--font-xs);
  color: var(--text-color);
  font-weight: 500;
}

.input {
  height: 36px;
  padding: 0 12px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--panel-bg);
  color: var(--text-color);
  outline: none;
}

.textarea {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--panel-bg);
  color: var(--text-color);
  outline: none;
  resize: vertical;
}

.two-col {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: var(--space-md);
}

.col {
  flex: 1;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  border-radius: var(--radius-md);
  background: var(--panel-bg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
}

.col-title {
  font-size: var(--font-xs);
  color: var(--text-color);
  font-weight: 600;
}

.col-sub {
  margin-top: 6px;
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.hint {
  margin-top: var(--space-md);
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.btn {
  margin-top: var(--space-md);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--panel-bg);
  color: var(--text-color);
  cursor: pointer;
}

.btn:hover {
  background: var(--hover-bg);
}

.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-top: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 8px;
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
}

.row:hover {
  border-color: color-mix(in srgb, var(--text-color) 16%, transparent);
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
  margin-top: 4px;
  font-size: var(--font-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  flex: 1;
  min-height: 0;
  margin-top: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.btn-danger {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  background: var(--panel-bg);
  color: var(--danger-color);
  cursor: pointer;
}

.btn-danger:hover {
  background: var(--hover-bg);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
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

.btn-cancel:disabled,
.btn-confirm:disabled,
.btn:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
