<template>
  
  <main class="app-content">
    <TitleBar />
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import TitleBar from '@/components/TitleBar.vue';

onMounted(async () => {

  

  console.log(`[${import.meta.env.VITE_APP_NAME || 'System'}] App启动完成！`);
});


</script>

<style>
.app-content {

  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
  background: var(--bg-color);
  color: var(--text-color);
  flex-direction: column;
}
</style>
