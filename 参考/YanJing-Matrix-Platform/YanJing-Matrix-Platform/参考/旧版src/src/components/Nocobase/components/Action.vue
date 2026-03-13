<template>
  <n-button v-bind="buttonProps" @click="handleClick">
    {{ title }}
  </n-button>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { NButton } from 'naive-ui';
import { t } from '../utils/translate';

const props = defineProps<{
  schema: any;
}>();
const title = computed(() => t(props.schema.title));
const buttonProps = computed(() => ({
  type: (props.schema['x-component-props']?.type || 'default') as 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error',
  size: 'small' as 'small' | 'medium' | 'large' | 'tiny'
}));
const handleClick = () => {
  console.log('Action clicked:', props.schema.title);
};
</script>
