<template>
  <div class="background">
    <div class="ycb-docu-layout">
      <!-- 主要内容区域 -->
      <main class="ycb-main-card">
        <!-- Markdown 内容卡片 -->
        <section class="ycb-content-card">
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <Markdown v-else :content="docContent" />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, defineProps } from 'vue';
import { useRoute } from 'vue-router';
import Markdown from './Markdown.vue'
import { fetchMarkdownContent } from './Data/Data'

// 定义 props，用于接收从父组件传递过来的数据
const props = defineProps({
  applicationId: String,
  imAccount: String,
});

const route = useRoute();
const loading = ref(true);
const error = ref('');
const docContent = ref('');

// 使用 watchEffect 来响应 props 或路由参数的变化
// 这使得组件既可以作为路由页面使用，也可以作为嵌入式组件使用
watchEffect(async () => {
  // 确定数据来源：优先使用 props，如果 props 未提供，则回退到路由参数
  const currentApplicationId = props.applicationId || route.params.applicationId as string;
  const currentAccount = props.imAccount || (route.params.account ? decodeURIComponent(route.params.account as string) : undefined);

  // 如果关键参数缺失，则显示错误信息并停止执行
  if (!currentApplicationId || !currentAccount) {
    error.value = '获取内容失败：缺少必要的参数 (applicationId 或 imAccount)';
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = '';
    
    console.log('Markdown组件 - 正在获取内容...');
    console.log('  - Application ID:', currentApplicationId);
    console.log('  - Account:', currentAccount);
    
    // 调用 API 获取 markdown 内容
    const result = await fetchMarkdownContent(currentApplicationId, currentAccount);
    
    console.log('Markdown组件 - API 返回结果:', result);
    
    if (result.ok && result.data && result.data.length > 0) {
      // 从 API 返回的数据中提取 description 字段作为 markdown 内容
      docContent.value = result.data[0].description || '暂无内容';
    } else {
      // 增强错误信息，方便调试
      const apiUrl = `/aagent/a/${currentApplicationId}/${encodeURIComponent(currentAccount)}`;
      error.value = `获取内容失败。API: ${apiUrl} - 响应: ${JSON.stringify(result.data)}`;
    }
  } catch (err) {
    console.error('获取 markdown 内容时发生异常:', err);
    error.value = '加载失败，请检查网络或联系管理员。';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.background {
  position: relative;
  overflow: hidden;
  min-height: 100%;
  /* 确保背景能够完全覆盖 */
}

.background::before {
  content: "";
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  filter: blur(8px);
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
  /* 添加主题适配 */
  transition: opacity var(--transition-duration) var(--transition-timing);
}

/* 深色主题下调整背景透明度 */
[data-theme="dark"] .background::before {
  opacity: 0.3;
}

.background > * {
  position: relative;
  z-index: 1;
}


.ycb-docu-layout {
  display: flex;
  gap: 32px;
  padding: 32px;
  min-height: 100vh;
  max-width: 100vw;
  box-sizing: border-box;
  align-items: flex-start;
  transition: color var(--transition-duration) var(--transition-timing);
  background-color: var(--bg-color-secondary) !important;
}

.ycb-main-card {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 32px;
  transition: color var(--transition-duration) var(--transition-timing);
  background-color: var(--bg-color-secondary) !important;
}

.ycb-content-card {
  flex: 6.5 1 0%;
  min-width: 0;
  background: var(--bg-color-secondary);
  border-radius: 18px;
  box-shadow: 0 2px 12px 0 rgba(114, 114, 114, 0.5);
  padding: 16px 16px 16px 16px;
  min-height: 320px;
  transition: color var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);
  overflow: auto !important;
  /* 隐藏滚动条（兼容 Chrome/Safari/Edge） */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.ycb-content-card::-webkit-scrollbar {
  display: none;
}




.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 1.1rem;
  color: var(--text-color-secondary);
  /* 添加加载动画 */
  position: relative;
}

.loading::after {
  content: '';
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-left: 8px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 1.1rem;
  color: var(--color-error);
  text-align: center;
  background-color: var(--color-error-light);
  border-radius: var(--border-radius-md);
  padding: var(--space-lg);
  margin: var(--space-md);
  border: 1px solid var(--color-error);
}

@media (max-width: 900px) {
  .ycb-docu-layout {
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .ycb-main-card {
    gap: 18px;
  }
}



/* 强制Modal内所有元素主题适配 */
:deep(.n-modal),
:deep(.n-modal-mask),
:deep(.n-modal-container),
:deep(.n-modal-body),
:deep(.n-modal-body-wrapper),
:deep(.n-modal-card),
:deep(.n-modal-card__content),
:deep(.n-card),
:deep(.n-card__content),
:deep(.n-card__header),
:deep(.n-card__header__main),
:deep(.n-card__footer),
:deep(.background),
:deep(.ycb-docu-layout),
:deep(.ycb-main-card),
:deep(.ycb-content-card) {
  background-color: var(--bg-color-secondary) !important;
  background: var(--bg-color-secondary) !important;
  color: var(--text-color) !important;
  transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
}
</style>
