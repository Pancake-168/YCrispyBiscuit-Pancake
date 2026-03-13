<template>
  <TitleBar />
  <main class="app-content">
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { startProject } from '@/services/ProjectStart';
import TitleBar from '@/components/TitleBar.vue';

onMounted(async () => {

  await startProject();

  console.log(`[${import.meta.env.VITE_APP_NAME || 'System'}] App启动完成！`);
});


</script>

<style>
.app-content {
  flex: 1;
  overflow: auto;
  position: relative;
  background: var(--bg-color);
  color: var(--text-color);
}
</style>
