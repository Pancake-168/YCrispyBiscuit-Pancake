<template>
  <div class="MainPage" :class="{ 'home-layout': pageStore.currentPage === 'Home' }">
    <div class="LeftHeader" @click="pageStore.currentPage = 'Home'">
      <div class="LeftHeaderText">
        {{ content.LeftHeader }}
      </div>
    </div>
    <div class="LeftBar">
      <LeftBar />
    </div>
    <div class="Line"></div>
    <div class="RightHeader" v-if="pageStore.currentPage !== 'Home'">
      <RightHeader />
    </div>
    <div class="HorizontalLine" v-if="pageStore.currentPage !== 'Home'"></div>
    <div class="RightContent">
      <MainContent />
    </div>
    <div class="RightLine"></div>
    <div class="RightBar"></div>
    
  </div>
</template>

<script setup lang="ts">
import { content } from '@/content/zh';
import { usePageStore } from '@/stores/Page';
import MainContent from '@/views/Pages/MainContent';
import LeftBar from '@/views/Pages/LeftBar';
import RightHeader from '@/views/Pages/RightHeader';

const pageStore = usePageStore();


</script>

<style scoped>
.MainPage {
  /* 
    布局计算与重构：
    1. 容器尺寸：使用 100% 继承父级大小，避免 vw/vh 忽视父级上下文。
    2. 背景修复：原 border 模拟背景会导致内容区域塌陷，改为 radial-gradient。
    3. 布局模式：采用 Grid 布局，精确还原设计稿的区域划分。
    
    尺寸计算：
    - Padding (内边距): 20px (根据 LeftHeader top/left 推算)
    - Gap (间距): 20px (根据 RightHeader left 340 - LeftHeader width 300 - Padding 20 推算)
    - Columns (列): 
      - 左列: 300px (固定)
      - 右列: 1fr (自适应，1920宽下约 1560px，与设计稿 1556px 基本一致)
    - Rows (行):
      - 上行: 100px (固定)
      - 下行: 1fr (自适应，1080高下约 920px，与设计稿 920px 完全一致)
  */

  /*
  后续：第一格缩放至原本的80%，变为240px和80px
  */
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  display: grid;
  grid-template-columns: 170px 1px 1fr 1px 200px;
  /* 添加分界线列 */
  grid-template-rows: 60px 1px 1fr;
  /* 添加横线行 */
  gap: 0.1rem;



  box-sizing: border-box;
}

.LeftHeader {
  /* Grid 落位：第1列，第1行 */
  grid-column: 1;
  grid-row: 1;

  width: 100%;
  height: 100%;
  border-radius: 10px;
padding-top: 1rem;
  /* box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.3); */

  /* 文字居中：使用 Flex */
  display: flex;
  justify-content: center;
  align-items: center;

  /* 悬停效果 */
  cursor: pointer;

}

.LeftHeaderText {
  height: 70%;
  padding: 0.5rem;


  display: flex;
  justify-content: center;
  align-items: center;
color: var(--fg-default);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
  text-align: center;
  letter-spacing: 0em;
  font-variation-settings: "opsz" auto;

}

.LeftHeaderText:hover {
  background: var(--bg-secondary);
  transform: scale(1.05);
  /* 悬浮时轻微放大 */
}

.LeftHeaderText:active {
  background: var(--bg-secondary);
  /* 点击时背景变化 */
  transform: scale(0.95);
  /* 点击时轻微缩小 */
}

.LeftBar {
  /* Grid 落位：第1列，第3行 */
  grid-column: 1;
  grid-row: 3;

  width: 100%;
  height: 100%;
  border-radius: 10px;

  /* box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.3); */
}

.Line {
  /* 左右分界线：垂直线 */
  grid-column: 2;
  grid-row: 1 / span 3;
  /* 跨越所有行 */
  width: 1px;
  height: 96%;
  background: #ddd;
  /* 分界线颜色 */
  justify-self: center;
  /* 横向居中 */
  align-self: center;
  /* 纵向居中 */
}

.Line:hover {
  transform: scaleX(2);
  /* 居中变粗 */
  transform-origin: center;
  /* 从中心缩放 */
}

.HorizontalLine {
  /* 上下分界线：水平线 */
  grid-column: 3;
  grid-row: 2;
  width: 96%;
  height: 1px;
  background: #ddd;
  /* 分界线颜色 */
  justify-self: center;
  /* 横向居中 */
}

.HorizontalLine:hover {
  transform: scaleY(2);
  /* 居中变粗 */
  transform-origin: center;
  /* 从中心缩放 */
}

.RightLine {
  /* 右侧分界线：垂直线 */
  grid-column: 4;
  grid-row: 1 / span 3;
  width: 1px;
  height: 96%;
  background: #ddd;
  justify-self: center;
  align-self: center;
}

.RightLine:hover {
  transform: scaleX(2);
  transform-origin: center;
}

.RightHeader {
  /* Grid 落位：第3列，第1行 */
  grid-column: 3;
  grid-row: 1;

  width: 100%;
  height: 100%;
  border-radius: 10px;

  /* box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.3); */
}

.RightContent {
  /* Grid 落位：第3列，第3行 */
  grid-column: 3;
  grid-row: 3;

  width: 100%;
  height: 100%;
  border-radius: 10px;

  /* box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.3); */
  overflow: auto;
}

/* 当处于 Home 页面时，RightContent 向上扩展，占据 RightHeader + RightContent 的位置 */
.MainPage.home-layout .RightContent {
  grid-row: 1 / span 3;
  /* 从第1行开始，跨越3行 */
  grid-column: 3;
}

.RightBar {
  /* Grid 落位：第5列，第1-3行 */
  grid-column: 5;
  grid-row: 1 / span 3;

  width: 100%;
  height: 100%;
  border-radius: 10px;

  /* box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.3); */
}
</style>
