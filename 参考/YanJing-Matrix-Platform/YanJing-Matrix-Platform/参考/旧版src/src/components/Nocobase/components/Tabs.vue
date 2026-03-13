<template>
  <n-tabs type="line" animated class="nocobase-tabs">
    <n-tab-pane 
      v-for="(item, key) in panes" 
      :key="key" 
      :name="String(key)" 
      :tab="item.title || String(key)"
    >
      <RecursionField :schema="item" :data="data" />
    </n-tab-pane>
  </n-tabs>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NTabs, NTabPane } from 'naive-ui';
import RecursionField from '../RecursionField.vue';

const props = defineProps<{
  schema: any;
  data?: any;
}>();

const panes = computed(() => {
  const properties = props.schema.properties || {};
  const sortedKeys = Object.keys(properties).sort((a, b) => {
    return (properties[a]['x-index'] || 0) - (properties[b]['x-index'] || 0);
  });
  
  const result: Record<string, any> = {};
  for (const key of sortedKeys) {
    result[key] = properties[key];
  }
  return result;
});
</script>

<style scoped>
.nocobase-tabs {
  width: 100%;
}
</style>
