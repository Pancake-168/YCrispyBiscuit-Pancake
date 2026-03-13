<template>
    <div class="breadcrumb">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb-list">
                <li v-for="(page, index) in breadcrumbs" :key="page.id" class="breadcrumb-item">
                    <span v-if="index === breadcrumbs.length - 1" class="breadcrumb-current">{{ page.name }}</span>
                    <a v-else @click="setCurrentPage(page.id)" class="breadcrumb-link">{{ page.name }}</a>
                    <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator"> — </span>
                </li>
            </ol>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePageStore } from '@/stores/Page'
import type { Page } from '@/types/Page'

const pageStore = usePageStore()
const breadcrumbs = ref<Page[]>([])

const updateBreadcrumbs = async () => {
    breadcrumbs.value = await pageStore.getBreadcrumbs()
}

onMounted(() => {
    updateBreadcrumbs()
})

// 监听 currentPage 变化，更新面包屑
import { watch } from 'vue'
watch(() => pageStore.currentPage, updateBreadcrumbs)

const setCurrentPage = (pageId: string) => {
    pageStore.setCurrentPage(pageId)
}
</script>

<style scoped>
.breadcrumb-list {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;

    align-items: center;
}

.breadcrumb-item {
    display: flex;
    align-items: center;
}

.breadcrumb-link {
    font-weight: bold;
    /* 悬停效果 */
  cursor: pointer;
}

.breadcrumb-link:hover {
    opacity: 1;
}

.breadcrumb-current {
    font-weight: bold;
    color: var(--fg-default);
    /* 悬停效果 */
  cursor: pointer;
}

.breadcrumb-separator {
    font-weight: var(--font-weight-bold);
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    
}
</style>