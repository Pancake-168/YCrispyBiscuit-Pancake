<template>
    <!-- 拖拽区域：顶部20px -->
    <div class="drag-region"></div>




    <div class="views" v-if="!AllServicesOK">
        <Loading />
    </div>
    <div v-else class="views">
        <MainPage />
    </div>
</template>


<script setup lang="ts">
import Loading from '@/components/Loading';
import MainPage from '@/views/MainPage';
import { useAppStore } from '@/stores/App';
import { computed, onMounted, onUnmounted } from 'vue';
import { ProjectStart, ProjectStop } from '@/services/ProjectStart';
import { getSystemInfo, stopSystemInfo } from '@/services/project/SystemInfo'


const appStore = useAppStore();
const AllServicesOK = computed(() => appStore.initialized);

onMounted(async () => {


    await Promise.all([
        ProjectStart(),
        // getSystemInfo()
    ]);

    appStore.setInitialized(true);
});

onUnmounted(() => {
    // stopSystemInfo();
    ProjectStop();
    appStore.setInitialized(false);
});

</script>



<style scoped>
.views {
    height: 100%;
    width: 100%;
    background: var(--bg-canvas);
}


.drag-region {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 30px;
    -webkit-app-region: drag;
    /* 允许拖拽 */
    z-index: 10;
    /* 确保在顶部 */
}
</style>
