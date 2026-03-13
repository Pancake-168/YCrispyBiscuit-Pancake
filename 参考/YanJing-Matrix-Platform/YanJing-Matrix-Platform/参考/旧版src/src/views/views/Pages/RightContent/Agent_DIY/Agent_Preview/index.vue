<template>
    <div class="agent-preview-container">

        <!-- 画布占据整个空间 -->
        <div class="canvas-content">
            <VueFlow :nodes="nodes" :edges="edges" :node-types="nodeTypes" 
                :default-zoom="0.5" :min-zoom="0.1" :max-zoom="2" 
                :zoom-on-scroll="true" :pan-on-scroll="false" :fit-view-on-init="true" 
                :fit-view-options="{ padding: 0.4, includeHiddenNodes: false, minZoom: 0.3, maxZoom: 0.8 }" 
                class="vue-flow-container preview-mode">
                <template #node-customNode="{ data }">
                    <CustomNode :data="data" :readonly="true" />
                </template>
            </VueFlow>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, watch } from 'vue'
import { VueFlow } from '@vue-flow/core'
import CustomNode from '../Agent_Node/Custom_Node/index.vue'
import { parseRawDataToFlow } from '../Data/Parse_Raw_Data_To_Flow'

// 注入父组件传递的数据
const teamData = inject<any>('teamData')

// 节点类型定义
const nodeTypes = {
    customNode: CustomNode
} as any

// 节点和边数据
const nodes = ref([])
const edges = ref([])

// 计算节点和边的数据
const flowData = computed(() => {
    if (teamData?.value) {
        return parseRawDataToFlow(teamData.value)
    }
    return { nodes: [], edges: [] }
})

// 更新节点和边
function updateFlowData() {
    const data = flowData.value
    nodes.value = data.nodes
    edges.value = data.edges
}

// 组件挂载时初始化数据
onMounted(() => {
    updateFlowData()
})

// 监听数据变化
watch(() => teamData?.value, () => {
    updateFlowData()
}, { deep: true })
</script>

<style scoped>
.agent-preview-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #F5F5F5;
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 预览标题栏 - Material Design */
.preview-header {
    padding: 16px 24px;
    background: #E3F2FD;
    border-bottom: 1px solid #BBDEFB;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.14), 0 4px 5px rgba(0, 0, 0, 0.12), 0 1px 10px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 4;
}

.preview-title {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 500;
    color: #1565C0;
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
    letter-spacing: 0.15px;
}

.preview-subtitle {
    margin: 0;
    font-size: 14px;
    color: #1976D2;
    font-weight: 400;
    opacity: 0.8;
}

/* 画布内容区域 */
.canvas-content {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.vue-flow-container {
    width: 100%;
    height: 100%;
    background: #FAFAFA;
}

/* 预览模式特殊样式 */
.vue-flow-container.preview-mode {
    pointer-events: auto; /* 允许缩放和平移 */
}

/* 预览模式下禁用某些交互 */
.vue-flow-container.preview-mode :deep(.vue-flow__node) {
    cursor: default !important;
}

.vue-flow-container.preview-mode :deep(.vue-flow__edge) {
    pointer-events: none;
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .preview-header {
        padding: 12px 20px;
    }
    
    .preview-title {
        font-size: 16px;
    }
    
    .preview-subtitle {
        font-size: 13px;
    }
}

@media (max-width: 768px) {
    .preview-header {
        padding: 10px 16px;
    }
    
    .preview-title {
        font-size: 15px;
    }
    
    .preview-subtitle {
        font-size: 12px;
    }
}

@media (max-width: 480px) {
    .agent-preview-container {
        height: 100vh;
        overflow: hidden;
    }
    
    .preview-header {
        padding: 8px 12px;
    }
    
    .preview-title {
        font-size: 14px;
    }
    
    .preview-subtitle {
        font-size: 11px;
    }
}
</style>
