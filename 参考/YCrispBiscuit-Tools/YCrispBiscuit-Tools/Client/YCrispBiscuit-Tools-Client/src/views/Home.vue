<template>
    <YCB_Header></YCB_Header>
    <div class="Home-body">
      
    </div>
</template>

<script setup lang="ts">
import YCB_Header from '@/components/Header';

</script>

<style scoped>
.Home-body {
    position: relative;
    /* 让伪元素绝对定位于此容器内 */
    overflow: hidden;
    /* 防止伪元素溢出容器 */
}

.Home-body::before {
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

.Home-body>* {
    position: relative;
    /* 让内容层级高于伪元素 */
    z-index: 1;
    /* 保证内容显示在伪元素之上 */
}
</style>