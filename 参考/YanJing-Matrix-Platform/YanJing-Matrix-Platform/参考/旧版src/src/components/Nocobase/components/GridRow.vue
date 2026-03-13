<template>
  <div class="nocobase-grid-row">
    <slot></slot>
  </div>
</template>
<style scoped>
.nocobase-grid-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}
</style>
