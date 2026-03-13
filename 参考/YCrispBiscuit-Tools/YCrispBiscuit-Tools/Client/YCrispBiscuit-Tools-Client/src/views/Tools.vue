<template>
  <YCB_Header></YCB_Header>
  <div class="Tools-body">

    <div class="main-content">
      <div class="tools-page">
        <h1 class="tools-page-h1">工具箱</h1>
        <p>什么？你问为什么这么多容器但只有一个工具能用？因为我懒啊</p>
      </div>
    </div>



    <!-- 工具列表区域，初始在页面下方，需要下滑才能看到 -->
    <div class="tools-list-wrapper" ref="toolsListRef">
      <n-grid :cols="gridCols" :x-gap="24" :y-gap="24" responsive="screen">
        <n-grid-item v-for="(tool, idx) in tools" :key="tool.name">
          <n-card :hoverable="true" class="tool-card" :class="{ 'slide-in': itemVisible[idx] }"
            :style="{ '--n-title-text-color': 'var(--text-color)' }">
            <template #header>
              <div class="tool-header">
                <img v-if="tool.logo" :src="tool.logo" class="tool-logo-inline" alt="logo" />
                <span class="tool-name">{{ tool.name }}</span>
              </div>
            </template>
            <div class="tool-desc">{{ tool.desc }}</div>
            <n-button type="primary" @click="tool.action" size="small">进入</n-button>
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>
  </div>
</template>

<script setup lang="ts">
import YCB_Header from '@/components/Header';
import { ref, computed, onMounted, nextTick } from 'vue';
import { NGrid, NGridItem, NCard, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';

const router = useRouter();
// 工具列表数据
const tools = [
  {
    name: 'ACGN个人喜好表生成器',
    desc: '这是一个为动漫游戏爱好者打造的个人喜好表生成器，可自定义数据库，支持图表下载。',
    logo: new URL('@/assets/bilibili_blue.png', import.meta.url).href,
    action: () => {
      router.push('/Tools/ACGN_Personal_Preference_Table_Generator');
    }
  },
  {
    name: '几何背景',
    desc: '一些前端背景。',
    logo: new URL('@/assets/background.png', import.meta.url).href,
    action: () => {
      router.push('/Tools/BackgroundForClient');
    }
  },
  {
    name: '示例工具',
    desc: '这是一个示例工具的描述，可以自定义扩展。',
    action: () => {

    }
  },
  {
    name: '示例工具',
    desc: '支持自适应布局和主题切换。',
    action: () => {

    }
  },
  {
    name: '示例工具',
    desc: '这是一个示例工具的描述，可以自定义扩展。',
    action: () => {

    }
  },
  {
    name: '示例工具',
    desc: '支持自适应布局和主题切换。',
    action: () => {

    }
  },
  {
    name: '示例工具',
    desc: '这是一个示例工具的描述，可以自定义扩展。',
    action: () => {

    }
  },
  {
    name: '示例工具',
    desc: '支持自适应布局和主题切换。',
    action: () => {

    }
  },
  {
    name: '示例工具',
    desc: '这是一个示例工具的描述，可以自定义扩展。',
    action: () => {

    }
  },
  {
    name: '示例工具',
    desc: '支持自适应布局和主题切换。',
    action: () => {

    }
  },

];

// 响应式列数
const gridCols = computed(() => {
  if (window.innerWidth < 600) return 1;
  if (window.innerWidth < 900) return 2;
  return 3;
});

// 动画相关
const itemVisible = ref(Array(tools.length).fill(false));
const toolsListRef = ref<HTMLElement | null>(null);

function playStaggeredIn() {
  itemVisible.value = Array(tools.length).fill(false);
  let idx = 0;
  function showNext() {
    if (idx >= tools.length) return;
    itemVisible.value[idx] = true;
    idx++;
    if (idx < tools.length) {
      requestAnimationFrame(() => {
        setTimeout(showNext, 100); // 100ms 间隔，动画更丝滑
      });
    }
  }
  showNext();
}

onMounted(() => {
  nextTick(() => {
    if (!toolsListRef.value) return;
    const observer = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        playStaggeredIn();
      } else {
        itemVisible.value = Array(tools.length).fill(false);
      }
    }, { threshold: 0.1 });
    observer.observe(toolsListRef.value);
  });
});
</script>

<style scoped>
.Tools-body {
  position: relative;
  /* 让伪元素绝对定位于此容器内 */
  overflow: hidden;
  /* 防止伪元素溢出容器 */
}

.Tools-body::before {
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

.Tools-body>* {
  position: relative;
  /* 让内容层级高于伪元素 */
  z-index: 1;
  /* 保证内容显示在伪元素之上 */
}

.main-content {
  min-height: calc(100vh - 64px);
  /* 64px为导航栏高度 */
  display: flex;
  align-items: center;
  justify-content: center;


}

.tools-page {
  text-align: center;
}

.tools-page-h1 {
  margin-bottom: 16px;
}

.tools-list-wrapper {
  margin-top: 164px;
  padding-bottom: 48px;
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.tool-card {
  transition: box-shadow var(--transition-duration) var(--transition-timing);
  border-radius: var(--border-radius-md);
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
  background-color: var(--bg-color-secondary);
  color: var(--text-color);
  opacity: 0;
  transform: translateX(60px);
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  min-height: 48px;
  padding-left: 4px;
}

.tool-logo-inline {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
  background: var(--bg-color-secondary);
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.06);
}

.tool-name {
  font-size: var(--font-size-lg);
  color: var(--text-color);
  font-weight: 600;
}

.tool-desc {
  margin-bottom: var(--space-md);
  color: var(--text-color-secondary);
  min-height: 40px;
}

.slide-in {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 900px) {
  .tools-list-wrapper {
    max-width: 96vw;
    padding-left: 2vw;
    padding-right: 2vw;
  }
}

@media (max-width: 600px) {
  .tools-list-wrapper {
    margin-top: 32px;
    padding-bottom: 24px;
  }
}
</style>

<style>
.tool-card :deep(.n-card__header),
.tool-card :deep(.n-card__title) {
  color: var(--text-color) !important;
}
</style>

<style>
[data-theme="light"] .tool-card {
  --n-title-text-color: var(--text-color);
}

[data-theme="dark"] .tool-card {
  --n-title-text-color: var(--text-color);
}
</style>
