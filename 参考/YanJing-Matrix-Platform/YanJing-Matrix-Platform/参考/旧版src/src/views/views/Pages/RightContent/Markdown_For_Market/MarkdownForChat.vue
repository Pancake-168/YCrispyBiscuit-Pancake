<template>
  <div class="markdown-chat-container">
    <!-- 嵌入 Markdown_For_Market 组件 -->
    <MarkdownIndex 
      :applicationId="props.agentID"
      :imAccount="props.applicationId"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import MarkdownIndex from './index.vue'

// 接收props参数
interface Props {
  agentID?: string
  applicationId?: string
  mode?: string
}

const props = defineProps<Props>()

onMounted(() => {
  console.log('[MarkdownForChat] 组件挂载完成，接收到的参数:', props)
})
</script>

<style scoped>
.markdown-chat-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}
</style>