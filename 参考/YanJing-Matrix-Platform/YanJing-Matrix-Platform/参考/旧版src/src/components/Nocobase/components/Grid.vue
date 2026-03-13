<template>
  <div class="nocobase-grid">
    <slot></slot>
  </div>
</template>
<style scoped>
.nocobase-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
</style>
