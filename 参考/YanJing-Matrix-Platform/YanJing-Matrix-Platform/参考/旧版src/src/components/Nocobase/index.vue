<template>
  <div class="nocobase-page-container">
    <div v-if="loading" class="loading-state">
      <n-spin size="large" />
      <p>正在加载 NocoBase 页面...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <n-result status="error" title="加载失败" :description="error">
        <template #footer>
          <n-button @click="loadPage">重试</n-button>
        </template>
      </n-result>
    </div>
    <div v-else class="content-state">
      <SchemaRenderer :schema="schema" :data="pageData" :collections="collections" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { NSpin, NResult, NButton } from 'naive-ui';
import { fetchFullPageContent } from '@/services/nocobaseV1/getPageContent';
import SchemaRenderer from './SchemaRenderer.vue';

const props = defineProps<{
  pageUrl: string;
}>();

const loading = ref(true);
const error = ref<string | null>(null);
const schema = ref<any>(null);
const pageData = ref<any>(null);
const collections = ref<any>(null);

const loadPage = async () => {
  if (!props.pageUrl) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    console.log('[Nocobase Index] Loading page:', props.pageUrl);
    const result = await fetchFullPageContent(props.pageUrl);
    
    schema.value = result.schema;
    collections.value = result.collections;
    // Transform collections map to a simpler data map for the renderer
    const dataMap: Record<string, any[]> = {};
    Object.keys(result.collections).forEach(key => {
      dataMap[key] = result.collections[key].data;
    });
    pageData.value = dataMap;
    
    console.log('[Nocobase Index] Page loaded successfully');
  } catch (e: any) {
    console.error('[Nocobase Index] Failed to load page:', e);
    error.value = e.message || '未知错误';
  } finally {
    loading.value = false;
  }
};

onMounted(loadPage);

watch(() => props.pageUrl, loadPage);
</script>

<style scoped>
.nocobase-page-container {

  max-width: 50%;
  height: 100%;
  min-height: 400px;
  padding: 20px;
  background: #f5f7f9;
  overflow-y: auto;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}
</style>

<style>
/* 全局减小 NocoBase UI 字体大小 */
.nocobase-page-container,
.nocobase-page-container * {
  font-size: 10px !important;
}

/* 针对 Naive UI 组件的字体变量 */
.nocobase-page-container :deep(.n-data-table),
.nocobase-page-container :deep(.n-pagination),
.nocobase-page-container :deep(.n-button),
.nocobase-page-container :deep(.n-input),
.nocobase-page-container :deep(.n-select),
.nocobase-page-container :deep(.n-pagination-item) {
  --n-font-size: 10px;
  --n-font-size-small: 8px;
  --n-font-size-medium: 10px;
  --n-font-size-large: 12px;
}
</style>
