<template>
  <div v-if="isElectron" class="title-bar" :class="{ 'is-electron': isElectron }">
    <div class="drag-region">
      <div class="app-info">
        <img src="/icon.png" class="app-logo" alt="app" />
        <span class="app-title">{{ appName }}</span>
      </div>
    </div>

    <div class="window-controls" v-if="isElectron">
      <button class="control-btn" @click="minimize" title="最小化">
        <svg viewBox="0 0 10 1" class="icon">
          <path d="M0 0h10v1H0z" />
        </svg>
      </button>

      <button class="control-btn" @click="maximize" :title="isMaximized ? '还原' : '最大化'">
        <svg v-if="!isMaximized" viewBox="0 0 10 10" class="icon">
          <path d="M0 0h10v10H0V0zm1 1v8h8V1H1z" />
        </svg>
        <svg v-else viewBox="0 0 10 10" class="icon">
          <path d="M2.1 0v2H0v8.1h8.2v-2h2V0H2.1zm5.1 9.1H1.1V3.1h6.1v6zm2-2.1h-1V2.1h-4V1.1h5v5.9z" />
        </svg>
      </button>

      <button class="control-btn btn-close" @click="close" title="关闭">
        <svg viewBox="0 0 10 10" class="icon">
          <path d="M0 0l10 10M10 0L0 10" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';



const isElectron = !!window.electronAPI;
const isMaximized = ref(false);
const appName = import.meta.env.VITE_APP_NAME || 'YCrispyBiscuit';

const minimize = () => window.electronAPI?.minimize();
const maximize = () => window.electronAPI?.maximize();
const close = () => window.electronAPI?.close();

onMounted(() => {
  if (isElectron) {
    window.electronAPI.onMaximizedStatus((status: boolean) => {
      isMaximized.value = status;
    });
  }
});
</script>

<style scoped>
.title-bar {
  height: 10px;
  height: var(--titlebar-height);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  z-index: 9999;


}

.drag-region {
  flex: 1;
  height: 100%;
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  padding-left: var(--space-md);
}

.app-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.app-logo {
  width: var(--logo-size-sm);
  height: var(--logo-size-sm);
}

.app-title {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--text-color);
  opacity: 0.8;
}

.window-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: var(--control-btn-width);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: default;
  transition: background 0.2s;
}

.control-btn:hover {
  background: var(--hover-bg);
}

.btn-close:hover {
  background: var(--danger-color) !important;
}

.icon {
  width: 10px;
  height: 10px;
  fill: none;
  stroke: var(--text-color);
  stroke-width: 1.2;
}

.btn-close:hover .icon {
  stroke: white;
}
</style>
