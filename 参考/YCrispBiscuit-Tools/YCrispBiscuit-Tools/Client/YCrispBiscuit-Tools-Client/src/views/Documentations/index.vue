<template>
  <div class="background">
    <div class="ycb-docu-layout">
      <!-- 左侧分区卡片 -->
      <aside class="ycb-sidebar-group">
        <div class="ycb-sidebar-title-card">
          <div class="ycb-sidebar-title">{{ categoryTitle }}</div>
        </div>
        <div class="ycb-doc-list-card">
          <div class="ycb-doc-list">
            <div v-for="(doc, idx) in docMenuOptions" :key="doc.key" @click="handleDocChange(doc.key)"
              :class="['ycb-doc-list-item', { 'active': doc.key === activeDocKey }]">
              <span>{{ doc.label }}</span>
              <div v-if="idx < docMenuOptions.length - 1" class="ycb-doc-list-divider"></div>
            </div>
          </div>
        </div>
      </aside>
      <!-- 右侧区域 -->
      <main class="ycb-main-card">
        <!-- 顶部导航栏卡片 -->
        <div class="ycb-navbar-card">
          <div class="ycb-navbar-left">{{ activeDocLabel }}</div>
          <div class="ycb-navbar-right">
            <n-button quaternary @click="goBack">返回文档主页</n-button>
            <n-button quaternary @click="toggleTheme" style="margin-left: 12px;">
              <n-icon size="20">
                <template v-if="isDark"> <moon-outline /> </template>
                <template v-else> <sunny-outline /> </template>
              </n-icon>
              <span style="margin-left: 6px;">{{ isDark ? '暗色' : '亮色' }}</span>
            </n-button>
          </div>
        </div>
        <!-- 下方内容区 -->
        <div class="ycb-content-row">
          <!-- 左下：正文卡片 -->
          <section class="ycb-content-card">
            <!-- 正文区域，先空着 -->
            <Markdown :content="docContent" @updateToc="tocList = $event" @updateLinks="customLinks = $event" />
          </section>
          <!-- 右下：目录+链接卡片 -->
          <aside class="ycb-toc-link-card">
            <div class="ycb-toc-card">
              <div class="ycb-toc-title">目录</div>
              <n-list bordered class="ycb-toc-list">
                <n-list-item v-for="item in tocList" :key="item.id" class="ycb-toc-list-item">
                  <a :href="`#${item.id}`">{{ item.text }}</a>
                </n-list-item>
              </n-list>
            </div>
            <div class="ycb-link-card">
              <div class="ycb-link-title">相关链接</div>
              <n-list bordered class="ycb-link-list">
                <n-list-item v-for="link in customLinks" :key="link.url" class="ycb-link-list-item">
                  <a :href="link.url" target="_blank">{{ link.text }}</a>
                </n-list-item>
              </n-list>
            </div>
          </aside>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NList, NListItem, NButton, NIcon } from 'naive-ui';
import { SunnyOutline as sunnyOutline, MoonOutline as moonOutline } from '@vicons/ionicons5';
import { useAppStore } from '@/stores/app';
import { getDocumentationsList, getCategoryDocs, getDocContent } from './Data/Data';
import Markdown from './Markdown.vue'

const appStore = useAppStore();
const router = useRouter();
const route = useRoute();
const categoryKey = ref(route.query.category as string || '');
const categoryTitle = ref('');
const docMenuOptions = ref<{ label: string, key: string }[]>([]);
const activeDocKey = ref('');
const docContent = ref('')

const activeDocLabel = computed(() => {
  const doc = docMenuOptions.value.find(d => d.key === activeDocKey.value);
  return doc ? doc.label : '';
});

const tocList = ref<{ id: string, text: string }[]>([]); // TODO: 替换为正文解析目录
const customLinks = ref<{ url: string, text: string }[]>([]); // TODO: 替换为正文解析相关链接
const isDark = computed(() => appStore.isDark);

onMounted(async () => {
  // 获取所有分区数据
  const partitions = await getDocumentationsList();
  const partition = partitions.find(p => p.Documentations_Key === categoryKey.value);
  categoryTitle.value = partition ? partition.Documentations_Title : '';
  // 加载分区下所有 md 文档列表
  const docs = await getCategoryDocs(categoryKey.value);
  docMenuOptions.value = docs.map(doc => ({ label: doc.label, key: doc.key }));
  if (docs.length) {
    activeDocKey.value = docs[0].key;
  }
  // 加载文档内容
  async function loadDocContent(key: string) {
    docContent.value = await getDocContent(key, categoryKey.value)
    console.log('加载文档内容:', docContent.value);
  }

  watch(activeDocKey, (key) => {
    if (key) loadDocContent(key)
  }, { immediate: true })
});

function goBack() {
  router.push('/Documentations');
}

function toggleTheme() {
  appStore.toggleTheme();
}

function handleDocChange(key: string) {
  activeDocKey.value = key;
}

</script>

<style scoped>
.background {
  position: relative;
  /* 让伪元素绝对定位于此容器内 */
  overflow: hidden;
  /* 防止伪元素溢出容器 */

}

.background::before {
  content: "";
  /* 生成一个空内容的伪元素 */
  position: absolute;
  /* 绝对定位，覆盖整个父容器 */
  inset: 0;
  /* 顶部、右侧、底部、左侧都为0，撑满父容器 */
  background-image: url('@/assets/DocuBack.jpg');
  /* 设置背景图片，与原背景一致 */
  background-size: cover;
  /* 背景图片铺满容器 */
  background-position: center;
  /* 背景图片居中显示 */
  background-attachment: fixed;
  /* 背景图片固定，不随内容滚动 */
  filter: blur(8px);
  /* 应用8px的高斯模糊效果 */
  opacity: 0.5;
  /* 设置不透明度为0.5，实现半透明 */
  z-index: 0;
  /* 保证伪元素在内容下方 */
  pointer-events: none;
  /* 禁止鼠标事件穿透，避免影响内容交互 */
}

.background>* {
  position: relative;
  /* 让内容层级高于伪元素 */
  z-index: 1;
  /* 保证内容显示在伪元素之上 */
}


.ycb-docu-layout {
  display: flex;
  gap: 32px;
  padding: 32px;
  /* background: var(--bg-color);*/
  min-height: 100vh;
  max-width: 100vw;
  box-sizing: border-box;
  align-items: flex-start;
  transition: color var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);

}

/* 左侧分区卡片分组 */
.ycb-sidebar-group {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 左上title卡片 */
.ycb-sidebar-title-card {
  background: transparent;
  border-radius: 20px;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.5);
  padding: 28px 20px;
  display: flex;
  align-items: center;
  min-height: 60px;
  transition: color var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);
}

.ycb-sidebar-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-color);
  transition: color 0.3s;
}

/* 左下文档列表卡片 */
.ycb-doc-list-card {
  background: transparent;
  border-radius: 20px;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.5);
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  transition: color var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);
}

.ycb-doc-list {
  background: transparent;
  border-radius: 14px;
  padding: 0;
}

.ycb-doc-list-item {
  font-size: 1.08rem;
  color: var(--text-color);
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: color var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);
  position: relative;
  display: flex;
  align-items: center;
  /* 让横线始终在底部 */
  flex-direction: row;
}

.ycb-doc-list-item.active {
  background: var(--primary-color);
  color: #00f1bd;
}

.ycb-doc-list-divider {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 1px;
  background: var(--divider-color, #e5e5e5);
  z-index: 1;
}

.ycb-main-card {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 32px;
  transition: color var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);
}

.ycb-navbar-card {
 background: transparent;
  border-radius: 18px;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 60px;
  margin-bottom: 0;
  transition: color var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);
}

.ycb-navbar-left {
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--text-color);
  transition: color 0.3s;
}

.ycb-navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}


:deep(.n-button__content) {
  color: var(--text-color) !important;
}


.ycb-content-row {
  display: flex;
  gap: 32px;
  width: 100%;

  margin: 0 auto;
  box-sizing: border-box;
}

.ycb-content-card {
  flex: 6.5 1 0%;
  min-width: 0;

  background: transparent;
  border-radius: 18px;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.5);
  padding: 16px 16px 16px 16px;
  min-height: 320px;
  transition: color var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);
  overflow: visible !important;

}

.ycb-toc-link-card {
  flex: 2 1 0%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  
}

.ycb-toc-card,
.ycb-link-card {
  background: transparent;
  border-radius: 20px;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.5);
  padding: 24px 18px;
  transition: color var(--transition-duration) var(--transition-timing), background-color var(--transition-duration) var(--transition-timing);
}

.ycb-toc-title,
.ycb-link-title {
  font-size: 1.08rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 14px;
  transition: color var(--transition-duration) var(--transition-timing);
}

.ycb-toc-list,
.ycb-link-list {
  background: transparent;
  border-radius: 10px;
  padding: 0;
  max-width: 100%;
}

.ycb-toc-list-item,
.ycb-link-list-item {
  font-size: 0.98rem;
  color: var(--text-color);
  border-radius: 8px;
  padding: 8px 14px;
  margin-bottom: 5px;
  transition: background 0.3s, color 0.3s;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
}

.ycb-toc-list-item a,
.ycb-link-list-item a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.3s;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: inline-block;
  vertical-align: bottom;
}

@media (max-width: 900px) {
  .ycb-docu-layout {
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .ycb-sidebar-card {
    width: 100%;
    min-height: auto;
    border-radius: 16px;
    padding: 18px 10px;
  }

  .ycb-main-card {
    gap: 18px;
  }

  .ycb-content-row {
    flex-direction: column;
    gap: 18px;
  }
}
</style>
