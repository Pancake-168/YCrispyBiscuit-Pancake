<template>
  <div class="page yj-theme">

    <Header :activeNav="activeNav" @update:activeNav="(v) => activeNav = v" @navigate="handleNavigate" />

    <!--Nocobase :page-url="'https://t8960.zheshu.tech/admin/settings/system-settings'" /-->
    <MainPage />

    <Foot @navigate="handleNavigate" />



  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Header from './Header';
import MainPage from './MainPage';
import Foot from './Foot';
import Nocobase from '@/components/Nocobase/index.vue'

const activeNav = ref('首页')

function handleNavigate(section: string) {
  const element = document.getElementById(section);
  if (element) {
    const header = document.querySelector('.header-section') as HTMLElement;
    const headerHeight = header ? header.offsetHeight : 80;
    const elementRect = element.getBoundingClientRect();
    const elementPosition = elementRect.top + window.pageYOffset - headerHeight;
    window.scrollTo({ top: elementPosition, behavior: 'smooth' });
  }
}
</script>

<style scoped>
.page.yj-theme {
  min-height: 100vh;
  --zkzs-accent: #7A6BC6;
  --zkzs-accent-strong: #BFA8FF;
  --zkzs-accent-hover: #AB93F3;
  --zkzs-accent-muted: rgba(122, 107, 198, 0.15);
  --zkzs-text-main: #544A72;
  --zkzs-text-secondary: #6A6285;
  --zkzs-text-muted: #847DA0;
  --zkzs-text-inverse: #ffffff;
  --zkzs-bg-soft: #F5EEFF;
  --zkzs-bg-muted: #ECE4FF;
  --zkzs-bg-surface: #ffffff;
  --zkzs-border-color: rgba(122, 107, 198, 0.22);
  --zkzs-shadow: 0 10px 24px rgba(122, 107, 198, 0.18);
}

.page {
  /*  background-color: rgba(186, 179, 241, 0.25);
 */
  width: 100%;
  min-height: 100vh;
  overflow: auto;
  padding-top: 68px;
  /* 头部高度：上padding 16px + logo 36px + 下padding 16px */
}
</style>
