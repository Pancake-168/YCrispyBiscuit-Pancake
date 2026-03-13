<template>
  <template v-for="(item, key) in properties" :key="key">
    <SchemaComponent :name="key" :schema="item" :data="data" :parent-schema="schema" />
  </template>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue';
import SchemaComponent from './SchemaComponent.vue';

const props = defineProps<{
  schema: any;
  data?: any;
  filter?: (schema: any) => boolean;
}>();

provide('nocobase-parent-schema', computed(() => props.schema));

const properties = computed(() => {
  if (!props.schema || !props.schema.properties) return {};
  
  let props_entries = Object.entries(props.schema.properties);
  
  // Apply filter if provided
  if (props.filter) {
    props_entries = props_entries.filter(([_, s]) => props.filter!(s));
  }

  // 最小化隐藏：过滤操作相关的组件
  props_entries = props_entries.filter(([_, s]: [string, any]) => {
    const component = s['x-component'];
    return !(component === 'Action' || component === 'ActionBar' || (typeof component === 'string' && (component.includes('Action') || component.includes('Button'))) || component === 'Filter.Action');
  });

  // NocoBase schemas often have x-index for ordering
  props_entries.sort((a: any, b: any) => {
    const indexA = a[1]['x-index'] || 0;
    const indexB = b[1]['x-index'] || 0;
    return indexA - indexB;
  });
  
  return Object.fromEntries(props_entries);
});
</script>
