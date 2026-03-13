<template>
  <n-card :title="title" class="nocobase-card-item">
    <slot></slot>
  </n-card>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { NCard } from 'naive-ui';
import { t } from '../utils/translate';

const props = defineProps<{
  schema: any;
}>();
const title = computed(() => t(props.schema.title));
</script>
<style scoped>
.nocobase-card-item {
  margin-bottom: 8px;
}
</style>
