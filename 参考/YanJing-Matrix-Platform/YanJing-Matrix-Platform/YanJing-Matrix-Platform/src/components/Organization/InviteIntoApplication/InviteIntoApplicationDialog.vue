<template>
  <div class="invite-overlay yj-dialog-mask" @click.self="handleClose">
    <div class="invite-modal yj-dialog-content">
      <div class="modal-header">
        <h3 class="modal-title">邀请加入组织</h3>
        <button class="close-btn" type="button" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="subtitle">当前组织：{{ orgName }}</div>

        <div class="form-row">
          <div class="label">用户名</div>
          <input
            v-model.trim="username"
            class="input"
            type="text"
            placeholder="请输入用户名或手机号"
            :disabled="submitting"
            @keydown.enter.prevent="handleSubmit"
          />
          
        </div>

        <div class="actions">
          <button class="btn-cancel" type="button" @click="handleClose" :disabled="submitting">取消</button>
          <button class="btn-confirm" type="button" @click="handleSubmit" :disabled="submitting || !canSubmit">
            {{ submitting ? '处理中...' : '确认邀请' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useOrganizationStore } from '@/stores/Organization';
import { Acceptinvitation } from '@/services/Project/Organization/Application';
import { openMessageDialog } from '@/components/MessageDialog/open';

const props = defineProps<{
  appid: string;
  onClose?: () => void;
}>();

const store = useOrganizationStore();
const { currentOrganization } = storeToRefs(store);

const username = ref('');
const submitting = ref(false);

const orgName = computed(() => {
  if (currentOrganization.value && String(currentOrganization.value.app_id) === String(props.appid)) {
    return currentOrganization.value.name || currentOrganization.value.app_id || props.appid;
  }
  return props.appid;
});

const canSubmit = computed(() => username.value.length > 0 && String(props.appid || '').length > 0);

async function handleSubmit() {
  if (!canSubmit.value) return;

  submitting.value = true;
  try {
    const res = await Acceptinvitation(String(props.appid), username.value);
    if (res.ok) {
      openMessageDialog('已邀请');
      // 刷新成员列表缓存，让 UI 能尽快看到变化
      await store.loadApplicationUsers(String(props.appid), true);
      handleClose();
    } else {
      openMessageDialog('邀请失败');
    }
  } catch (e) {
    console.warn('[System:InviteIntoApplication:handleSubmit] 邀请异常', e);
    openMessageDialog('邀请异常');
  } finally {
    submitting.value = false;
  }
}

function handleClose() {
  props.onClose?.();
}
</script>

<style scoped>
.invite-overlay {
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

.invite-modal {
  width: 520px;
  max-width: 92vw;
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
  padding: var(--space-lg);
}

.subtitle {
  font-size: var(--font-xs);
  color: var(--text-muted);
  margin-bottom: var(--space-md);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.input:disabled {
  opacity: 0.6;
}

.hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.actions {
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

.btn-cancel:disabled,
.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
