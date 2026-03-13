<template>
    <YCB_Header></YCB_Header>
    <div class="Docus-body">

        <div class="main-content">
            <div class="Docus-page">
                <h1 class="Docus-page-h1">文档中心</h1>
                <p>这里收录了本站各领域工具的详细文档与说明，欢迎查阅！</p>
                <p>   </p>
                <p> 还有！你要做好被花里胡哨的页面突脸的心理准备哦！</p>
            </div>
        </div>

        <div class="doc-list-wrapper" ref="docListRef">
            <n-card v-for="(item, idx) in docList" :key="item.Documentations_Key" hoverable class="doc-big-card"
                :class="{ 'slide-in': itemVisible[idx] }">
                <div class="doc-card-header">
                    <n-avatar :src="item.logo" size="large" class="doc-avatar" />
                    <div class="doc-card-title">{{ item.Documentations_Title }}</div>
                </div>
                <div class="doc-card-desc">{{ item.Documentations_Desc }}</div>
                <ul v-if="item.Documentations_Details" class="doc-card-detail-list">
                    <li>{{ item.Documentations_Details }}</li>
                </ul>
                <div class="doc-card-footer">
                    <n-button type="primary" @click="action(item)">进入文档</n-button>
                </div>
            </n-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import YCB_Header from '@/components/Header';
import { NCard, NAvatar, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';
import { ref, onMounted, nextTick } from 'vue';
import { getDocumentationsList } from './Documentations/Data/Data.ts';

const router = useRouter();
const docListRef = ref<HTMLElement | null>(null);
const docList = ref<any[]>([]);
const itemVisible = ref<any[]>([]);

onMounted(() => {
    getDocumentationsList().then((list) => {
        console.log('后端分区数据:', list);
        docList.value = list;
        itemVisible.value = Array(docList.value.length).fill(false);
        nextTick(() => {
            if (!docListRef.value) return;
            const observer = new window.IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    itemVisible.value = Array(docList.value.length).fill(false);
                    docList.value.forEach((_, idx) => {
                        setTimeout(() => {
                            itemVisible.value[idx] = true;
                        }, idx * 240);
                    });
                } else {
                    itemVisible.value = Array(docList.value.length).fill(false);
                }
            }, { threshold: 0.1 });
            observer.observe(docListRef.value);
        });
    });
});

function action(item: any) {
    router.push({
        path: '/Documentations/index',
        query: { category: item.Documentations_Key }
    });
}
</script>

<style scoped>
.Docus-body {
    position: relative;
    /* 让伪元素绝对定位于此容器内 */
    overflow: hidden;
    /* 防止伪元素溢出容器 */
}

.Docus-body::before {
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

.Docus-body>* {
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

.Docus-page {
    text-align: center;
}

.Docus-page-h1 {
    margin-bottom: 16px;
}
p {
    margin-bottom: 16px;
}

.doc-list-wrapper {
    margin-top: 164px;
    padding-bottom: 48px;
    width: 100%;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}


.doc-big-card {
    padding: 14px 16px 10px 16px;
    border-radius: 24px;
    box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.06);
    transition: box-shadow 0.2s;
    background: var(--bg-color-secondary);
    color: var(--text-color);
    margin-top: 24px;
    opacity: 0;
    transform: translateX(180px);
    transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-in {
    opacity: 1 !important;
    transform: translateX(0) !important;
}

.doc-card-header {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 10px;
}

.doc-avatar {
    border-radius: 8px;
    background: #f0f0f0;
}

.doc-card-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--text-color);
}

.doc-card-desc {
    color: var(--text-color-secondary);
    font-size: 1.05rem;
    margin-bottom: 10px;
}

.doc-card-detail-list {
    margin: 0 0 12px 0;
    padding-left: 18px;
    color: var(--text-color-secondary);
    font-size: 0.98rem;
}

.doc-card-footer {
    display: flex;
    justify-content: flex-end;
}
</style>
