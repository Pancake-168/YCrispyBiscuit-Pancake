<script setup lang="ts">
import { NMessageProvider, NConfigProvider, NDialogProvider, NNotificationProvider } from 'naive-ui'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

// 需要可滚动的页面列表（官网类页面）
const scrollablePages = ['YanJingAI', 'YanJingAI2', 'YanJingAI2OPC', 'YanJingAI2CUA', 'YanJingAI2Custom']

// 判断当前页面是否需要滚动
const isScrollable = computed(() => {
  return scrollablePages.includes(route.name as string)
})
</script>

<template>
  <n-config-provider>
    <n-dialog-provider>
      <n-notification-provider>
        <n-message-provider>
          <div class="app-container" :class="{ scrollable: isScrollable }">
            <router-view></router-view>
          </div>
        </n-message-provider>
      </n-notification-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh; /* 占满整个视口高度 */
  overflow: hidden; /* 防止出现滚动条 */
}

/* 可滚动页面的样式 */
.app-container.scrollable {
  overflow: auto; /* 允许滚动 */
  height: auto; /* 高度自适应内容 */
  min-height: 100vh; /* 最小高度为视口高度 */
}
</style>
