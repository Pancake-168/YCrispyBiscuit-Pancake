<template>
  <div class="nocobase-schema-renderer">
    <RecursionField :schema="schema" :data="data" />
  </div>
</template>

<script setup lang="ts">
import { provide, computed } from 'vue';
import RecursionField from './RecursionField.vue';

const props = defineProps<{
  schema: any;
  data: any;
  collections?: any;
}>();

// Provide global context if needed
provide('nocobase-root-data', computed(() => props.data));
provide('nocobase-root-schema', computed(() => props.schema));
provide('nocobase-collections', computed(() => props.collections));
</script>

<style scoped>
.nocobase-schema-renderer {
  width: 100%;
  height: 100%;
}
</style>
