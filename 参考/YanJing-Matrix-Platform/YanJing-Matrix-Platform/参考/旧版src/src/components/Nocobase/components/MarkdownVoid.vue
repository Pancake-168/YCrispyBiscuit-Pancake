<template>
  <div class="nocobase-markdown-void" v-html="content"></div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  schema: any;
}>();
const content = computed(() => props.schema['x-content'] || '');
</script>
