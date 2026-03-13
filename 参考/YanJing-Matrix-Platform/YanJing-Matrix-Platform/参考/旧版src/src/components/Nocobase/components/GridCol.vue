<template>
  <div class="nocobase-grid-col" :style="colStyle">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  width?: number | string;
}>();
const colStyle = computed(() => {
  if (typeof props.width === 'number') {
    return { flex: `0 0 ${props.width}%`, maxWidth: `${props.width}%` };
  }
  // NocoBase sometimes uses strings like "50%"
  if (typeof props.width === 'string' && props.width.endsWith('%')) {
    return { flex: `0 0 ${props.width}`, maxWidth: props.width };
  }
  return { flex: 1 };
});
</script>
<style scoped>
.nocobase-grid-col {
  min-width: 0;
}
</style>
