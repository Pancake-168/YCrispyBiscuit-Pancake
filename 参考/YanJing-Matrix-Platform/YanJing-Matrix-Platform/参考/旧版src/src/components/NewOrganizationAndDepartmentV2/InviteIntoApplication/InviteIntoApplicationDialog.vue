<template>
  <div class="invite-overlay" @click.self="handleClose">
    <div class="invite-modal">
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
            placeholder="请输入用户名"
            :disabled="submitting"
            @keydown.enter.prevent="handleSubmit"
          />
          <div class="hint">输入username</div>
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
import { useOrganizationStoreV2 } from '@/stores/organizationV2';
import { Acceptinvitation } from '@/services/Project/OrganizationV2/Application';
import { openMessageDialog } from '@/components/MessageDialog/open';

const props = defineProps<{
  appid: string;
  onClose?: () => void;
}>();

const store = useOrganizationStoreV2();
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
    console.warn('[InviteIntoApplication] 邀请异常', e);
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
  background: var(--bg-color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.invite-modal {
  width: 520px;
  max-width: 92vw;
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
  padding: var(--space-lg);
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-color-secondary);
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
  font-size: var(--font-size-sm);
  color: var(--text-color);
  font-weight: var(--font-weight-medium);
}

.input {
  height: 36px;
  padding: 0 12px;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-color-secondary);
  color: var(--text-color);
  outline: none;
}

.input:disabled {
  opacity: 0.6;
}

.hint {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
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

.btn-cancel:disabled,
.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
