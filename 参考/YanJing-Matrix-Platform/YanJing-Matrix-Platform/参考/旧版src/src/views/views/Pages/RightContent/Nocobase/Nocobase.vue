<template>
  <div class="nocobase-container">
    <!-- 外部 Nocobase 页面嵌入 -->
    <iframe 
      :src="nocobaseUrl" 
      frameborder="0" 
      class="nocobase-iframe"
      @load="onIframeLoad"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

// 接收props参数
interface Props {
  agentID?: string
  applicationId?: string
  mode?: string
}

const props = defineProps<Props>()

// iframe 加载完成事件
function onIframeLoad() {
  console.log('[Nocobase] iframe 加载完成')
}

// 计算生成的 Nocobase URL
const nocobaseUrl = computed(() => {
  if (!props.agentID) {
    console.log('[Nocobase] agentID参数为空，无法生成URL')
    return ''
  }
  
  // 生成外部Nocobase管理系统的URL，使用agentID作为应用标识
  const url = `http://192.168.10.40:13000/apps/${props.agentID}/admin/settings/data-source-manager/main/collections?type=main`

  console.log('[Nocobase] 生成的URL:', url)
  return url
})

onMounted(() => {
  console.log('[Nocobase] 组件挂载完成，接收到的参数:', props)
})
</script>

<style scoped>
.nocobase-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.nocobase-iframe {
  width: 100%;
  height: 100%;
  border: none;
  flex: 1;
  background: white;
}
</style>