<template>
  <div class="agent-diy-container">
    <!-- Agent DIY 页面嵌入 -->
    <iframe 
      :src="agentDiyUrl" 
      frameborder="0" 
      class="agent-diy-iframe"
      @load="onIframeLoad"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {addPrefixSuffix} from '../../../../../utils/stringUtils'

// 接收props参数
interface Props {
  agentID?: string
  applicationId?: string
  mode?: string
}

const props = defineProps<Props>()

// iframe 加载完成事件
function onIframeLoad() {
  console.log('[Agent_DIY] iframe 加载完成')
}

// 计算生成的 Agent DIY URL
const agentDiyUrl = computed(() => {
  if (!props.applicationId || !props.agentID) {
    console.log('[Agent_DIY] 参数不完整，无法生成URL:', { agentID: props.agentID, applicationId: props.applicationId })
    return ''
  }
  const finalagentID = addPrefixSuffix(props.agentID, '@RBT#', 'Bot')
  console.log('[Agent_DIY] 处理后的智能体ID:', finalagentID)

  // URL编码账户参数以处理特殊字符如 # 和 @
  const encodedUserId = encodeURIComponent(finalagentID)
  const url = `http://192.168.10.40:5173/${props.applicationId}/Agent_DIY/${encodedUserId}`
  
  console.log('[Agent_DIY] 生成的URL:', url)
  return url
})

onMounted(() => {
  console.log('[Agent_DIY] 组件挂载完成，接收到的参数:', props)
})
</script>

<style scoped>
.agent-diy-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.agent-diy-iframe {
  width: 100%;
  height: 100%;
  border: none;
  flex: 1;
  background: white;
}
</style>