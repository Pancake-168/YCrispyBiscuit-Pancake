<template>
  <div v-if="visible" class="password-prompt-overlay" @click.self="handleCancel">
    <div class="password-prompt-dialog">
      <h3 class="prompt-title">{{ title }}</h3>
      <p class="prompt-message" v-html="message"></p>
      <div class="prompt-input-group">
        <label for="password-input">密码</label>
        <input
          id="password-input"
          v-model="password"
          type="password"
          class="prompt-input"
          @keyup.enter="handleSubmit"
          ref="passwordInput"
        />
      </div>
      <div class="prompt-actions">
        <button @click="handleCancel" class="btn btn-secondary">取消</button>
        <button @click="handleSubmit" class="btn btn-danger" :disabled="!password">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
  visible: boolean;
  title: string;
  message: string;
}>();

const emit = defineEmits<{
  (e: 'submit', password: string): void;
  (e: 'cancel'): void;
}>();

const password = ref('');
const passwordInput = ref<HTMLInputElement | null>(null);

watch(() => props.visible, (newValue) => {
  if (newValue) {
    password.value = ''; // Reset password on open
    nextTick(() => {
      passwordInput.value?.focus();
    });
  }
});

const handleSubmit = () => {
  if (password.value) {
    emit('submit', password.value);
  }
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.password-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.password-prompt-dialog {
  background-color: var(--dm-bg-secondary);
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--dm-border);
}

.prompt-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--dm-header-primary);
  margin: 0 0 12px 0;
}

.prompt-message {
  font-size: 14px;
  color: var(--dm-text-normal);
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.prompt-input-group {
  margin-bottom: 24px;
}

.prompt-input-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--dm-text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.prompt-input {
  width: 100%;
  padding: 10px;
  background-color: var(--dm-bg-tertiary);
  border: 1px solid var(--dm-border);
  border-radius: 4px;
  color: var(--dm-text-normal);
  font-size: 14px;
}

.prompt-input:focus {
  outline: none;
  border-color: var(--dm-blurple);
}

.prompt-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Reusing button styles from DeviceManager */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.17s ease, color 0.17s ease;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary { background-color: var(--dm-interactive-normal); color: var(--dm-text-normal); }
.btn-secondary:hover:not(:disabled) { background-color: var(--dm-interactive-hover); }
.btn-danger { background-color: var(--dm-red); color: white; }
.btn-danger:hover:not(:disabled) { filter: brightness(1.1); }
</style>
