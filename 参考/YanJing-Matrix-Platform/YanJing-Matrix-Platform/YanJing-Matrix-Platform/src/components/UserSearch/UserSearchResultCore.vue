<template>
  <div class="user-result-core">
    <div class="user-result-avatar">
      <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" @error="emit('avatar-error')" />
      <span v-else>{{ fallbackText }}</span>
    </div>
    <div class="user-result-fields">
      <div v-for="(line, idx) in lines" :key="idx" class="user-result-line">{{ line }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  avatarUrl?: string
  fallbackText: string
  lines: string[]
}>()

const emit = defineEmits<{
  (e: 'avatar-error'): void
}>()
</script>

<style scoped>
.user-result-core {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  width: 100%;
}

.user-result-avatar {
  flex: 0 0 28px !important;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
  max-width: 28px !important;
  max-height: 28px !important;
  border-radius: 50%;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--primary-color) 28%, var(--bg-color));
  color: var(--text-color);
  font-size: var(--font-xs);
  font-weight: 600;
  line-height: 1;
}

.user-result-avatar img {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
  max-width: 28px !important;
  max-height: 28px !important;
  object-fit: cover;
  display: block;
}

.user-result-avatar > span {
  line-height: 1;
}

.user-result-fields {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 4px;
}

.user-result-line {
  color: var(--text-color);
  font-size: var(--font-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
