<template>
    <div class="Calendar">
        <div class="CalenderOptions">
            <div class="Option1" @click="pageStore.setCurrentPage('CalendarAdd')">创建</div>
            <div class="Option2">切换视图</div>

        </div>

    </div>

</template>



<script setup lang="ts">

import { usePageStore } from '@/stores/Page'
const pageStore = usePageStore()

</script>




<style scoped>
.Calendar {
    display: flex;
    width: 100%;
    padding: 1rem;
}
</style>