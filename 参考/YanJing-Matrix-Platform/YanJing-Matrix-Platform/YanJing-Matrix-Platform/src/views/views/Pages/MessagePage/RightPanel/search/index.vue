<template>
  <div class="panel">
    <div class="panel__title">搜索内容</div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.panel {
  height: 100%;
  border-radius: var(--radius-md);
  border: var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  padding: var(--space-sm);
  box-sizing: border-box;
}

.panel__title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-color);
}
</style>
