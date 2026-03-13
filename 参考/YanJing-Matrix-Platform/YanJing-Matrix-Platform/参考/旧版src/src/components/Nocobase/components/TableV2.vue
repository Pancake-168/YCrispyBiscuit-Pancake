<template>
  <div class="nocobase-table-v2">
    <!-- 隐藏操作按钮区域 -->
    <!-- <div class="nocobase-table-header-actions" v-if="hasNonColumnProperties">
      <RecursionField 
        :schema="schema" 
        :data="data" 
        :filter="nonColumnFilter"
      />
    </div> -->
    <div class="table-container">
      <n-data-table
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        :remote="false"
        :scroll-x="tableScrollX"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, inject, ref, reactive, watch } from 'vue';
import { NDataTable } from 'naive-ui';
import CollectionField from './CollectionField.vue';
import RecursionField from '../RecursionField.vue';
import { t } from '../utils/translate';

const props = defineProps<{
  schema: any;
  parentSchema?: any;
  data?: any;
}>();

const rootData = inject<any>('nocobase-root-data');
const collections = inject<any>('nocobase-collections');
const parentSchemaContext = inject<any>('nocobase-parent-schema');

const collectionName = computed(() => {
  return props.schema['x-component-props']?.collection || 
         props.schema['x-decorator-props']?.collection ||
         props.parentSchema?.['x-component-props']?.collection ||
         props.parentSchema?.['x-decorator-props']?.collection ||
         parentSchemaContext?.value?.['x-component-props']?.collection ||
         parentSchemaContext?.value?.['x-decorator-props']?.collection;
});

const tableData = computed(() => {
  let name = collectionName.value;
  const data = props.data || rootData?.value;
  
  // Fallback: if no collection name found, but data has only one collection
  if (!name && data && typeof data === 'object') {
    const keys = Object.keys(data).filter(k => Array.isArray(data[k]));
    if (keys.length === 1) {
      name = keys[0];
      console.log('[TableV2] Fallback to single collection:', name);
    }
  }

  console.log('[TableV2] collectionName:', name);
  if (!name) return [];
  
  console.log('[TableV2] data source:', data);
  const result = data?.[name] || data?.data || [];
  console.log('[TableV2] resolved data:', result);
  return result;
});

const loading = ref(false);

// 使用 reactive 维护分页状态，确保 UI 交互能实时响应
const pagination = reactive({
  page: 1,
  pageSize: props.schema['x-component-props']?.pageSize || 20, // 默认最小数据量 20
  showSizePicker: true,
  pageSizes: [20, 50, 100, 500],
  onChange: (page: number) => {
    pagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
  }
});

// 监听 schema 变化同步 pageSize
watch(() => props.schema['x-component-props']?.pageSize, (newSize) => {
  if (newSize) pagination.pageSize = newSize;
});

const nonColumnFilter = (s: any) => {

  // 隐藏所有操作相关的组件
  const component = s['x-component'];
  if (component === 'Action' || component === 'ActionBar' || component?.includes('Action')) {
    return false; // 不渲染
  }

  return s['x-component'] !== 'TableV2.Column';
};

const hasNonColumnProperties = computed(() => {
  if (!props.schema.properties) return false;
  return Object.values(props.schema.properties).some(nonColumnFilter);
});

const columns = computed(() => {
  const cols: any[] = [];
  const properties = props.schema.properties || {};
  
  const sortedKeys = Object.keys(properties).sort((a, b) => {
    return (properties[a]['x-index'] || 0) - (properties[b]['x-index'] || 0);
  });

  for (const key of sortedKeys) {
    const colSchema = properties[key];
    if (colSchema['x-component'] === 'TableV2.Column') {
      // Find the CollectionField inside this column
      const fieldKey = Object.keys(colSchema.properties || {})[0];
      const fieldSchema = colSchema.properties?.[fieldKey];
      
      if (fieldSchema) {
        let title = colSchema.title || fieldSchema.title;
        
        // If title is missing, try to find it in collection fields
        if (!title && collectionName.value && collections?.value?.[collectionName.value]) {
          const fieldName = fieldSchema['x-collection-field']?.split('.').pop();
          const fieldMeta = collections.value[collectionName.value].fields?.find((f: any) => f.name === fieldName);
          if (fieldMeta) {
            title = fieldMeta.uiSchema?.title || fieldMeta.name;
          }
        }

        // 隐藏操作列
        const finalTitle = t(title || key);
        if (finalTitle.includes('操作') || finalTitle.includes('Actions') || finalTitle.includes('Action') || finalTitle.toLowerCase().includes('operation')) {
          continue; // 跳过操作列
        }

        cols.push({
          //  title: t(title || key),
          title: finalTitle,
          key: fieldSchema['x-collection-field'] || key,
          minWidth: 100, // 设置最小宽度，避免挤压
          render(row: any) {
            return h(CollectionField, {
              schema: fieldSchema,
              data: row
            });
          }
        });
      }
    }
  }
  
  if (cols.length === 0) {
    // Fallback if no columns defined in properties
    return [{ title: 'No Columns', key: 'empty' }];
  }
  
  return cols;
});

const tableScrollX = computed(() => {
  return columns.value.length * 120 + 100; // 估算总宽度
});
</script>

<style scoped>
.nocobase-table-v2 {
  width: 100%;
}

.table-container {
  overflow-x: auto;
  max-width: 100%;
}

.table-container :deep(.n-data-table) {
  table-layout: fixed;
}
</style>
