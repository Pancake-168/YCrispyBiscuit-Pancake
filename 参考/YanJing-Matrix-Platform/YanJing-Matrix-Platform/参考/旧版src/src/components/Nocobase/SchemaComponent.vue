<template>
  <component :is="decoratorComponent" v-bind="decoratorProps" v-if="decoratorComponent">
    <component :is="mainComponent" v-bind="componentProps">
      <RecursionField v-if="schema.properties" :schema="schema" :data="data" />
    </component>
  </component>
  <component :is="mainComponent" v-bind="componentProps" v-else-if="mainComponent">
    <RecursionField v-if="schema.properties" :schema="schema" :data="data" />
  </component>
  <RecursionField v-else-if="schema.properties" :schema="schema" :data="data" />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import RecursionField from './RecursionField.vue';

const props = defineProps<{
  name: string | number;
  schema: any;
  data?: any;
  parentSchema?: any;
}>();

// Component Registry Mapping
const componentMap: Record<string, any> = {
  'Grid': defineAsyncComponent(() => import('./components/Grid.vue')),
  'Grid.Row': defineAsyncComponent(() => import('./components/GridRow.vue')),
  'Grid.Col': defineAsyncComponent(() => import('./components/GridCol.vue')),
  'CardItem': defineAsyncComponent(() => import('./components/CardItem.vue')),
  'TableV2': defineAsyncComponent(() => import('./components/TableV2.vue')),
  'TableV2.Column': defineAsyncComponent(() => import('./components/TableColumn.vue')),
  'CollectionField': defineAsyncComponent(() => import('./components/CollectionField.vue')),
  'BlockItem': defineAsyncComponent(() => import('./components/BlockItem.vue')),
  'ActionBar': defineAsyncComponent(() => import('./components/ActionBar.vue')),
  'TableV2.Decorator': defineAsyncComponent(() => import('./components/TableDecorator.vue')),
  'Tabs': defineAsyncComponent(() => import('./components/Tabs.vue')),
  'Markdown.Void': defineAsyncComponent(() => import('./components/MarkdownVoid.vue')),
  'Action': defineAsyncComponent(() => import('./components/Action.vue')),
};

const resolveComponent = (name: string) => {
  if (!name) return null;
  return componentMap[name] || null;
};

const mainComponent = computed(() => resolveComponent(props.schema['x-component']));
const decoratorComponent = computed(() => resolveComponent(props.schema['x-decorator']));

const componentProps = computed(() => ({
  ...(props.schema['x-component-props'] || {}),
  schema: props.schema,
  parentSchema: props.parentSchema,
  name: props.name,
  data: props.data
}));

const decoratorProps = computed(() => ({
  ...(props.schema['x-decorator-props'] || {}),
  schema: props.schema,
  parentSchema: props.parentSchema,
  name: props.name,
  data: props.data
}));
</script>
