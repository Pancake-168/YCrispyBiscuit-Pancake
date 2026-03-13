<script setup lang="ts">
import { useApiPagesStore } from '@/stores/ApiPage';
const apiPagesStore = useApiPagesStore();
</script>

<template>
    <div class="home-container">
        <h1>欢迎使用 YCrispBiscuit-BestFriend</h1>
        <p>这是主页内容。</p>
        <div class="api-pages">
            <h2>API 页面列表</h2>
            <ul>
                <li v-for="page in apiPagesStore.pages" :key="page.name">
                    {{ page.name }} - {{ page.url }}
                </li>
            </ul>
        </div>
    </div>


</template>