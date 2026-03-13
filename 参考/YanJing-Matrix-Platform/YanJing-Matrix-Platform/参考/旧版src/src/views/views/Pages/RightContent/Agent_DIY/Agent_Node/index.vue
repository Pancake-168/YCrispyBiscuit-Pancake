<template>
    <div class="agent-node-container">
        <!-- 画布占据整个空间 -->
        <div class="canvas-content">
            <VueFlow :nodes="nodes" :edges="edges" :node-types="nodeTypes" @nodes-change="onNodesChange"
                @edges-change="onEdgesChange" :default-zoom="0.5" :min-zoom="0.1" :max-zoom="2" 
                :zoom-on-scroll="true" :pan-on-scroll="false" :fit-view-on-init="true" 
                :fit-view-options="{ padding: 0.4, includeHiddenNodes: false, minZoom: 0.3, maxZoom: 0.8 }" class="vue-flow-container">
                <template #node-customNode="{ data }">
                    <CustomNode :data="data" :readonly="false" @dropOnArea="onDropOnArea"
                        @removeParticipant="onRemoveParticipant" @removeTool="onRemoveTool"
                        @deleteAgentNode="onDeleteAgentNode" @editAgentNode="onEditAgentNode"
                        @editTeamNode="onEditTeamNode" @editToolNode="onEditToolNode" 
                        @deleteToolNode="onDeleteToolNode" />
                </template>
            </VueFlow>
        </div>

        <!-- 浮动固定的左侧数据列表 -->
        <div class="sidebar-float" :class="{ 'sidebar-collapsed': sidebarCollapsed }" v-show="!sidebarCollapsed" :style="{ top: sidebarPosition.top + 'px', left: sidebarPosition.left + 'px' }">
            <div class="sidebar-header" @mousedown="onSidebarHeaderMouseDown" style="cursor:move;">
                <span class="sidebar-title">组件库</span>
                <button class="collapse-btn" @click="toggleSidebar" title="收起">
                    ✕
                </button>
            </div>

            <div class="sidebar-content">
                <!-- 搜索框 -->
                <div class="search-box">
                    <input v-model="searchKeyword" type="text" placeholder="搜索组件..." class="search-input" />
                </div>

                <!-- Agent列表 -->
                <div class="data-section">
                    <div class="section-header" @click="toggleSection('agents')">
                        <span class="section-title">🤖 Agents</span>
                        <span class="toggle-icon" :class="{ collapsed: collapsedSections.agents }">▼</span>
                    </div>
                    <div v-if="!collapsedSections.agents" class="section-content">
                        <div v-for="agent in filteredAgents" :key="agent.config.name" class="data-item agent-item"
                            draggable="true" @dragstart="onDragStart($event, 'agent', agent)">
                            <div class="item-header">
                                <span class="item-name">{{ agent.config.name }}</span>
                                <span class="item-type">{{ agent.component_type }}</span>
                            </div>
                            <div class="item-desc">{{ agent.description }}</div>
                        </div>
                    </div>
                </div>

                <!-- 工具列表 -->
                <div class="data-section">
                    <div class="section-header" @click="toggleSection('tools')">
                        <span class="section-title">🔧 Tools</span>
                        <span class="toggle-icon" :class="{ collapsed: collapsedSections.tools }">▼</span>
                    </div>
                    <div v-if="!collapsedSections.tools" class="section-content">
                        <div v-for="tool in filteredTools" :key="tool.config.name" class="data-item tool-item"
                            draggable="true" @dragstart="onDragStart($event, 'tool', tool)">
                            <div class="item-header">
                                <span class="item-name">{{ tool.config.name }}</span>
                                <span class="item-type">{{ tool.component_type }}</span>
                            </div>
                            <div class="item-desc">{{ tool.description }}</div>
                        </div>
                    </div>
                </div>

                <!-- 终止条件列表 -->
                <div class="data-section">
                    <div class="section-header" @click="toggleSection('terminations')">
                        <span class="section-title">🛑 终止条件</span>
                        <span class="toggle-icon" :class="{ collapsed: collapsedSections.terminations }">▼</span>
                    </div>
                    <div v-if="!collapsedSections.terminations" class="section-content">
                        <div v-for="termination in filteredTerminations" :key="termination.label"
                            class="data-item termination-item" draggable="true"
                            @dragstart="onDragStart($event, 'termination', termination)">
                            <div class="item-header">
                                <span class="item-name">{{ termination.label }}</span>
                                <span class="item-type">{{ termination.component_type }}</span>
                            </div>
                            <div class="item-desc">{{ termination.description }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 展开按钮（当sidebar收起时显示） -->
        <button v-if="sidebarCollapsed" class="sidebar-toggle-btn" @click="toggleSidebar" title="展开组件库">
            📚
        </button>


        <!-- 编辑弹窗 -->
        <div v-if="showEditDialog" class="edit-dialog-overlay" @click="closeEditDialog">
            <div class="edit-dialog" @click.stop>
                <div class="dialog-header">
                    <h3>{{ editDialogTitle }}</h3>
                    <button class="close-btn" @click="closeEditDialog">✕</button>
                </div>
                <div class="dialog-content">
                    <div v-if="editingAgent" class="edit-form">
                        <RecursiveForm :obj="editingAgent" :root="true" />
                    </div>
                    <div v-if="editingTeam" class="edit-form">
                        <RecursiveForm :obj="editingTeam" :root="true" />
                    </div>
                    <div v-if="editingTool" class="edit-form">
                        <RecursiveForm :obj="editingTool" :root="true" />
                    </div>
                </div>
                <div class="dialog-actions">
                    <button @click="saveEdit" class="save-btn">保存</button>
                    <button @click="closeEditDialog" class="cancel-btn">取消</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineComponent, h, inject, nextTick } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { participants, Tool_List, termination_condition_List } from '../Data/List_Data'
import { parseRawDataToFlow } from '../Data/Parse_Raw_Data_To_Flow'
import CustomNode from './Custom_Node/index.vue'

// 获取父组件传递的共享数据
const teamData = inject<any>('teamData')
const recordChange = inject<any>('recordChange')

// 如果没有获取到父组件数据，则使用默认数据
if (!teamData?.value) {
    console.warn('[AgentNode] 未能获取到父组件的teamData，使用默认数据')
}

// 递归表单组件的工具函数
const isPrimitive = (val: any) => ['string', 'number', 'boolean'].includes(typeof val) || val === null

// 递归表单组件
const RecursiveForm: any = defineComponent({
    name: 'RecursiveForm',
    props: {
        obj: { type: Object, required: true },
        root: { type: Boolean, default: false }
    },
    setup(props: any): any {
        const getLabel = (key: string) => key
        
        return (): any => h('div',
            { class: props.root ? 'form-root' : '' },
            Object.entries(props.obj).map(([key, value]: [string, any]): any => {
                if (Array.isArray(value)) {
                    return h('div', { class: 'form-card' }, [
                        h('div', { class: 'form-label-row' }, getLabel(key)),
                        ...value.map((item: any, idx: number): any =>
                            isPrimitive(item)
                                ? h('div', { class: 'form-block' }, [
                                    h('div', { class: 'form-label-row form-array-index' }, `#${idx + 1}`),
                                    h('input', {
                                        class: 'form-input-row',
                                        value: item,
                                        onInput: (e: any) => {
                                            props.obj[key][idx] = e.target.value
                                        }
                                    })
                                ])
                                : h('div', { class: 'form-card' }, [
                                    h('div', { class: 'form-label-row form-array-index' }, `#${idx + 1}`),
                                    h(RecursiveForm, { obj: item })
                                ])
                        )
                    ])
                } else if (isPrimitive(value)) {
                    if (typeof value === 'boolean') {
                        return h('div', { class: 'form-block form-block-row' }, [
                            h('label', { class: 'form-label-inline' }, getLabel(key)),
                            h('input', {
                                class: 'form-checkbox-inline',
                                type: 'checkbox',
                                checked: value,
                                onChange: (e: any) => {
                                    props.obj[key] = e.target.checked
                                }
                            })
                        ])
                    } else if (typeof value === 'string' && value.length > 60) {
                        // 根据字段类型设置不同的行数和最小高度
                        let longTextRows = 4
                        let minHeight = '120px'
                        
                        if (['system_message', 'description'].includes(key)) {
                            longTextRows = 8
                            minHeight = '200px'
                        } else if (key === 'source_code') {
                            longTextRows = 12
                            minHeight = '300px'
                        } else if (['prompt', 'content', 'message'].includes(key)) {
                            longTextRows = 6
                            minHeight = '150px'
                        }
                        
                        return h('div', { class: 'form-block' }, [
                            h('div', { class: 'form-label-row' }, getLabel(key)),
                            h('textarea', {
                                class: 'form-input-row form-input-longtext',
                                value: value,
                                rows: longTextRows,
                                style: `resize:vertical; min-height:${minHeight}; line-height: 1.5;`,
                                onInput: (e: any) => {
                                    props.obj[key] = e.target.value
                                }
                            })
                        ])
                    } else {
                        return h('div', { class: 'form-block' }, [
                            h('div', { class: 'form-label-row' }, getLabel(key)),
                            h('input', {
                                class: 'form-input-row',
                                value: value,
                                onInput: (e: any) => {
                                    props.obj[key] = typeof value === 'number' ? Number(e.target.value) : e.target.value
                                }
                            })
                        ])
                    }
                } else if (typeof value === 'object' && value !== null) {
                    return h('div', { class: 'form-card' }, [
                        h('div', { class: 'form-label-row' }, getLabel(key)),
                        h(RecursiveForm, { obj: value })
                    ])
                } else {
                    return null
                }
            })
        )
    }
})

// VueFlow 相关
const nodeTypes = { customNode: CustomNode as any }

// 节点和边数据
const nodes = ref<any[]>([])
const edges = ref<any[]>([])

// 侧边栏状态
const sidebarCollapsed = ref(true)
const searchKeyword = ref('')
const collapsedSections = ref({
    agents: false,
    tools: false,
    terminations: false
})

// 编辑弹窗状态
const showEditDialog = ref(false)
const editingAgent = ref<any>(null)
const editingTeam = ref<any>(null)
const editingTool = ref<any>(null)
const editingNodeId = ref('')
const editingToolIndex = ref(-1)

// 计算属性
const editDialogTitle = computed(() => {
    if (editingAgent.value) return '编辑 Agent'
    if (editingTeam.value) return '编辑团队'
    if (editingTool.value) return '编辑工具'
    return '编辑'
})

// 过滤后的数据列表
const filteredAgents = computed(() => {
    if (!searchKeyword.value) return participants
    return participants.filter(agent =>
        agent.config.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
})

const filteredTools = computed(() => {
    if (!searchKeyword.value) return Tool_List
    return Tool_List.filter(tool =>
        tool.config.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
})

const filteredTerminations = computed(() => {
    if (!searchKeyword.value) return termination_condition_List
    return termination_condition_List.filter(termination =>
        termination.label.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        termination.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
})

// 数据同步 - 监听teamData变化，实时更新节点和边
let lastDataHash = ref('')
watch(teamData, (newData) => {
    if (!newData) return // 防护检查
    
    // 计算数据哈希，避免相同数据重复处理
    const currentHash = JSON.stringify(newData)
    if (currentHash === lastDataHash.value) {
        console.log('[AgentNode] 数据未变化，跳过更新')
        return
    }
    
    lastDataHash.value = currentHash
    console.log('[AgentNode] teamData changed，开始更新节点')
    updateNodesAndEdges()
}, { deep: true })

// 更新节点和边
function updateNodesAndEdges() {
    console.log('[AgentNode] 🔄 开始更新节点和边')
    
    if (!teamData?.value) {
        console.log('[AgentNode] ⚠️ teamData不存在，清空节点和边')
        nodes.value = []
        edges.value = []
        return // 防护检查
    }
    
    try {
        const { nodes: newNodes, edges: newEdges } = parseRawDataToFlow(teamData.value)
        nodes.value = newNodes
        edges.value = newEdges
        console.log('[AgentNode] ✅ 节点和边更新完成 - 节点数:', newNodes.length, '边数:', newEdges.length)
        
        // 在节点更新后设置合适的视图
        nextTick(() => {
            setTimeout(() => {
                fitViewWithPadding()
            }, 100) // 给一点延迟确保节点已渲染
        })
    } catch (error: any) {
        console.error('[AgentNode] ❌ 解析数据时出错:', error.message)
        // 出错时设置空节点和边
        nodes.value = []
        edges.value = []
    }
}

// 设置合适的视图，保持适当距离
function fitViewWithPadding() {
    try {
        // 直接在DOM上查找VueFlow实例
        const vueFlowElement = document.querySelector('.vue-flow-container')
        if (vueFlowElement && (vueFlowElement as any).__vueflow) {
            const vueFlowInstance = (vueFlowElement as any).__vueflow
            // 使用较小的缩放和padding来保持距离感
            vueFlowInstance.fitView({ 
                padding: 0.3,  // 30% padding
                minZoom: 0.5,  // 最小缩放
                maxZoom: 0.8   // 最大缩放，保持距离感
            })
        }
    } catch (error) {
        console.log('[AgentNode] fitView failed:', error)
    }
}

// 侧边栏相关方法
function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

function toggleSection(section: keyof typeof collapsedSections.value) {
    collapsedSections.value[section] = !collapsedSections.value[section]
}

// 拖拽开始
function onDragStart(e: DragEvent, type: string, item: any) {
    console.log('[AgentNode] Drag start:', type, item)
    e.dataTransfer?.setData('application/json', JSON.stringify({ type, item }))
}

// 拖拽到节点
function onDropOnArea({ area, payload, nodeId }: any) {
    console.log('[AgentNode] Drop on area:', { area, payload, nodeId })
    
    if (!teamData?.value) return // 防护检查

    if (area === 'participants' && payload.type === 'agent') {
        // 添加参与者到团队
        if (!teamData.value.config.participants) {
            teamData.value.config.participants = []
        }

        // 检查是否已存在
        const exists = teamData.value.config.participants.some(
            (p: any) => p.config.name === payload.item.config.name
        )

        if (!exists) {
            teamData.value.config.participants.push(JSON.parse(JSON.stringify(payload.item)))
            console.log('[AgentNode] Added participant:', payload.item.config.name)
            
            // 记录变化
            if (recordChange) {
                recordChange(`config.participants`, teamData.value.config.participants, 'add_participant')
            }
        }
    } else if (area === 'tools' && payload.type === 'tool') {
        // 添加工具到Agent
        const agent = teamData.value.config.participants?.find(
            (p: any) => p.config.name === nodeId
        )

        if (agent) {
            // 确保 workbench 结构存在
            if (!agent.config.workbench || agent.config.workbench.length === 0) {
                agent.config.workbench = [{
                    provider: "autogen_core.tools.StaticWorkbench",
                    component_type: "StaticWorkbench", 
                    version: 1,
                    component_version: 1,
                    description: "A workbench that provides a static set of tools that do not change after each tool execution.",
                    label: "StaticWorkbench",
                    config: {
                        tools: []
                    }
                }]
            }

            // 确保第一个workbench的config.tools存在
            if (!agent.config.workbench[0].config.tools) {
                agent.config.workbench[0].config.tools = []
            }

            // 检查是否已存在
            const exists = agent.config.workbench[0].config.tools.some(
                (t: any) => t.config.name === payload.item.config.name
            )

            if (!exists) {
                agent.config.workbench[0].config.tools.push(JSON.parse(JSON.stringify(payload.item)))
                console.log('[AgentNode] Added tool to agent workbench:', payload.item.config.name)
                
                // 记录变化
                if (recordChange) {
                    recordChange(`config.participants.${nodeId}.workbench.config.tools`, agent.config.workbench[0].config.tools, 'add_tool')
                }
            }
        }
    } else if (area === 'termination' && payload.type === 'termination') {
        // 设置终止条件
        teamData.value.config.termination_condition = JSON.parse(JSON.stringify(payload.item))
        console.log('[AgentNode] Set termination condition:', payload.item.label)
        
        // 记录变化
        if (recordChange) {
            recordChange('config.termination_condition', teamData.value.config.termination_condition, 'set_termination')
        }
    }
}

// 移除参与者
function onRemoveParticipant({ nodeId, index }: any) {
    console.log('[AgentNode] Remove participant:', { nodeId, index })
    if (teamData.value.config.participants && index >= 0) {
        teamData.value.config.participants.splice(index, 1)
        
        // 记录变化
        if (recordChange) {
            recordChange('config.participants', teamData.value.config.participants, 'remove_participant')
        }
    }
}

// 移除工具
function onRemoveTool({ nodeId, index }: any) {
    console.log('[AgentNode] Remove tool:', { nodeId, index })
    const agent = teamData.value.config.participants?.find(
        (p: any) => p.config.name === nodeId
    )

    if (agent && agent.config.workbench?.[0]?.config?.tools && index >= 0) {
        agent.config.workbench[0].config.tools.splice(index, 1)
        
        // 记录变化
        if (recordChange) {
            recordChange(`config.participants.${nodeId}.workbench.config.tools`, agent.config.workbench[0].config.tools, 'remove_tool')
        }
    }
}

// 删除Agent节点
function onDeleteAgentNode({ nodeId }: any) {
    console.log('[AgentNode] Delete agent node:', nodeId)
    if (teamData.value.config.participants) {
        teamData.value.config.participants = teamData.value.config.participants.filter(
            (p: any) => p.config.name !== nodeId
        )
        
        // 记录变化
        if (recordChange) {
            recordChange('config.participants', teamData.value.config.participants, 'delete_agent')
        }
    }
}

// 编辑Agent节点
function onEditAgentNode({ nodeId }: any) {
    console.log('[AgentNode] Edit agent node:', nodeId)
    const agent = teamData.value.config.participants?.find(
        (p: any) => p.config.name === nodeId
    )

    if (agent) {
        // 创建Agent数据副本，保留workbench结构但排除tools字段（tools由Tool节点负责编辑）
        const agentCopy = JSON.parse(JSON.stringify(agent))
        if (agentCopy.config.workbench) {
            agentCopy.config.workbench.forEach((wb: any) => {
                if (wb.config) {
                    delete wb.config.tools  // 只删除tools数组，保留workbench的其他字段
                }
            })
        }
        editingAgent.value = agentCopy
        editingNodeId.value = nodeId
        showEditDialog.value = true
    }
}

// 编辑团队节点
function onEditTeamNode() {
    console.log('[AgentNode] Edit team node')
    // 创建一个不包含 participants 的团队数据副本
    const teamDataCopy = JSON.parse(JSON.stringify(teamData.value))
    delete teamDataCopy.config.participants
    editingTeam.value = teamDataCopy
    showEditDialog.value = true
}

// 编辑Tool节点
function onEditToolNode(params: any) {
    console.log('[AgentNode] Edit tool node params:', params)
    
    // 标准模式：使用nodeId和toolIndex
    if (params.nodeId && typeof params.toolIndex === 'number' && !params.fallbackMode) {
        const agent = teamData.value.config.participants?.find(
            (p: any) => p.config.name === params.nodeId
        )
        
        console.log('[AgentNode] Standard mode - found agent:', agent?.config?.name)
        console.log('[AgentNode] Agent workbench:', agent?.config?.workbench)

        if (agent && agent.config.workbench?.[0]?.config?.tools?.[params.toolIndex]) {
            const tool = agent.config.workbench[0].config.tools[params.toolIndex]
            console.log('[AgentNode] Found tool:', tool)
            editingTool.value = JSON.parse(JSON.stringify(tool))
            editingNodeId.value = params.nodeId
            editingToolIndex.value = params.toolIndex
            showEditDialog.value = true
            return
        }
    }
    
    // Fallback模式：使用toolName在所有agents中搜索
    if (params.toolName && params.fallbackMode) {
        console.log('[AgentNode] Fallback mode - searching for tool:', params.toolName)
        
        for (const agent of teamData.value.config.participants || []) {
            const tools = agent.config?.workbench?.[0]?.config?.tools || []
            
            for (let i = 0; i < tools.length; i++) {
                const tool = tools[i]
                if (tool.config?.name === params.toolName || tool.label === params.toolName) {
                    console.log('[AgentNode] Found tool in fallback mode:', tool, 'in agent:', agent.config.name)
                    editingTool.value = JSON.parse(JSON.stringify(tool))
                    editingNodeId.value = agent.config.name
                    editingToolIndex.value = i
                    showEditDialog.value = true
                    return
                }
            }
        }
        console.error('[AgentNode] Tool not found in fallback mode:', params.toolName)
    }
    
    console.error('[AgentNode] Tool editing failed with params:', params)
}

// 删除Tool节点
function onDeleteToolNode(params: any) {
    console.log('[AgentNode] Delete tool node params:', params)
    
    // 标准模式：使用nodeId和toolIndex
    if (params.nodeId && typeof params.toolIndex === 'number' && !params.fallbackMode) {
        const agent = teamData.value.config.participants?.find(
            (p: any) => p.config.name === params.nodeId
        )
        
        console.log('[AgentNode] Standard mode - found agent for deletion:', agent?.config?.name)

        if (agent && agent.config.workbench?.[0]?.config?.tools && params.toolIndex >= 0) {
            console.log('[AgentNode] Deleting tool at index:', params.toolIndex)
            agent.config.workbench[0].config.tools.splice(params.toolIndex, 1)
            console.log('[AgentNode] Deleted tool from agent workbench')
            
            // 记录变化
            if (recordChange) {
                recordChange(`config.participants.${params.nodeId}.workbench.config.tools`, agent.config.workbench[0].config.tools, 'delete_tool')
            }
            return
        }
    }
    
    // Fallback模式：使用toolName在所有agents中搜索
    if (params.toolName && params.fallbackMode) {
        console.log('[AgentNode] Fallback mode - searching for tool to delete:', params.toolName)
        
        for (const agent of teamData.value.config.participants || []) {
            const tools = agent.config?.workbench?.[0]?.config?.tools || []
            
            for (let i = 0; i < tools.length; i++) {
                const tool = tools[i]
                if (tool.config?.name === params.toolName || tool.label === params.toolName) {
                    console.log('[AgentNode] Found tool to delete in fallback mode:', tool, 'in agent:', agent.config.name)
                    agent.config.workbench[0].config.tools.splice(i, 1)
                    console.log('[AgentNode] Deleted tool from agent workbench in fallback mode')
                    
                    // 记录变化
                    if (recordChange) {
                        recordChange(`config.participants.${agent.config.name}.workbench.config.tools`, agent.config.workbench[0].config.tools, 'delete_tool')
                    }
                    return
                }
            }
        }
        console.error('[AgentNode] Tool not found for deletion in fallback mode:', params.toolName)
    }
    
    console.error('[AgentNode] Tool deletion failed with params:', params)
}

// 保存编辑
function saveEdit() {
    if (editingAgent.value && editingNodeId.value) {
        // 保存Agent编辑
        const agent = teamData.value.config.participants?.find(
            (p: any) => p.config.name === editingNodeId.value
        )

        if (agent) {
            // 保存原始的workbench tools
            const originalWorkbenchTools = agent.config.workbench?.map((wb: any) => ({
                workbenchIndex: agent.config.workbench.indexOf(wb),
                tools: wb.config?.tools || []
            })) || []
            
            // 更新Agent数据（排除workbench.config.tools字段）
            Object.assign(agent, editingAgent.value)
            
            // 恢复workbench tools字段（由Tool节点负责编辑）
            originalWorkbenchTools.forEach(({ workbenchIndex, tools }: any) => {
                if (agent.config.workbench?.[workbenchIndex]?.config) {
                    agent.config.workbench[workbenchIndex].config.tools = tools
                }
            })
            
            console.log('[AgentNode] Saved agent edit:', editingNodeId.value)
            
            // 记录变化
            if (recordChange) {
                recordChange(`config.participants.${editingNodeId.value}`, editingAgent.value, 'edit_agent')
            }
        }
    } else if (editingTeam.value) {
        // 保存团队编辑（除了 participants 外的所有字段）
        const originalParticipants = teamData.value.config.participants
        Object.assign(teamData.value, editingTeam.value)
        // 恢复 participants 字段
        teamData.value.config.participants = originalParticipants
        console.log('[AgentNode] Saved team edit')
        
        // 记录变化
        if (recordChange) {
            recordChange('team_config', editingTeam.value, 'edit_team')
        }
    } else if (editingTool.value && editingNodeId.value && editingToolIndex.value >= 0) {
        // 保存Tool编辑
        const agent = teamData.value.config.participants?.find(
            (p: any) => p.config.name === editingNodeId.value
        )

        if (agent && agent.config.workbench?.[0]?.config?.tools?.[editingToolIndex.value]) {
            // 更新Tool数据
            Object.assign(agent.config.workbench[0].config.tools[editingToolIndex.value], editingTool.value)
            console.log('[AgentNode] Saved tool edit:', editingTool.value.config?.name)
            
            // 记录变化
            if (recordChange) {
                recordChange(`config.participants.${editingNodeId.value}.workbench.config.tools.${editingToolIndex.value}`, editingTool.value, 'edit_tool')
            }
        }
    }

    closeEditDialog()
}

// 关闭编辑弹窗
function closeEditDialog() {
    showEditDialog.value = false
    editingAgent.value = null
    editingTeam.value = null
    editingTool.value = null
    editingNodeId.value = ''
    editingToolIndex.value = -1
}

// VueFlow 事件处理
function onNodesChange(changes: any) {
    console.log('[AgentNode] Nodes changed:', changes)
}

function onEdgesChange(changes: any) {
    console.log('[AgentNode] Edges changed:', changes)
}









const sidebarPosition = ref({ top: 80, left: 20 })
const isDraggingSidebar = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

function loadSidebarPosition() {
  try {
    const pos = localStorage.getItem('sidebarPosition')
    if (pos) {
      const { top, left } = JSON.parse(pos)
      sidebarPosition.value.top = top
      sidebarPosition.value.left = left
    }
  } catch {}
}

function saveSidebarPosition() {
  localStorage.setItem('sidebarPosition', JSON.stringify(sidebarPosition.value))
}

function onSidebarHeaderMouseDown(e: MouseEvent) {
  isDraggingSidebar.value = true
  const sidebar = document.querySelector('.sidebar-float') as HTMLElement
  if (sidebar) {
    const rect = sidebar.getBoundingClientRect()
    dragOffset.value.x = e.clientX - rect.left
    dragOffset.value.y = e.clientY - rect.top
  }
  document.addEventListener('mousemove', onSidebarMouseMove)
  document.addEventListener('mouseup', onSidebarMouseUp)
}

function onSidebarMouseMove(e: MouseEvent) {
  if (!isDraggingSidebar.value) return
  const newLeft = e.clientX - dragOffset.value.x
  const newTop = e.clientY - dragOffset.value.y
  const winW = window.innerWidth, winH = window.innerHeight
  const sidebarW = 320, sidebarH = 400
  sidebarPosition.value.left = Math.max(0, Math.min(newLeft, winW - sidebarW))
  sidebarPosition.value.top = Math.max(0, Math.min(newTop, winH - sidebarH))
}

function onSidebarMouseUp() {
  if (isDraggingSidebar.value) {
    isDraggingSidebar.value = false
    saveSidebarPosition()
  }
  document.removeEventListener('mousemove', onSidebarMouseMove)
  document.removeEventListener('mouseup', onSidebarMouseUp)
}

onMounted(() => {
  updateNodesAndEdges()
  loadSidebarPosition()
})

</script>

<style scoped>
.agent-node-container {
    position: relative;
    height: 100vh;
    background: #f5f5f5;
}

/* 画布占据整个空间 */
.canvas-content {
    width: 100%;
    height: 100vh;
    position: relative;
}

.vue-flow-container {
    width: 100%;
    height: 100%;
}

/* 浮动固定的侧边栏样式 */
.sidebar-float {
    position: fixed;
    
    width: 320px;
    max-height: 65vh; /* 调整为65%视口高度，给底部留更多空间 */
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 100;
    transition: all 0.3s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.sidebar-float.sidebar-collapsed {
    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;
}

/* 展开按钮样式 */
.sidebar-toggle-btn {
    position: fixed;
    bottom: 80px;
    left: 20px;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 20px;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
    transition: all 0.3s ease;
    z-index: 101;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sidebar-toggle-btn:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e0e6f0;
    background: linear-gradient(90deg, #f8faff 0%, #f4f6fa 100%);
    flex-shrink: 0;
    border-radius: 12px 12px 0 0;
}

.sidebar-title {
    font-weight: 600;
    font-size: 16px;
    color: #333;
}

.collapse-btn {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    transition: all 0.2s;
}

.collapse-btn:hover {
    background: #e0e0e0;
    color: #333;
    border-color: #bbb;
}

.sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    background: #fafbfc;
}

.search-box {
    margin-bottom: 16px;
}

.search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    outline: none;
}

.search-input:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 数据分组样式 */
.data-section {
    margin-bottom: 20px;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
}

.section-header:hover {
    background: #e9ecef;
}

.section-title {
    font-weight: 600;
    font-size: 14px;
    color: #495057;
}

.toggle-icon {
    font-size: 12px;
    color: #6c757d;
    transition: transform 0.2s;
}

.toggle-icon.collapsed {
    transform: rotate(-90deg);
}

.section-content {
    padding: 8px 0;
}

/* 数据项样式 */
.data-item {
    padding: 12px;
    margin-bottom: 8px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: grab;
    transition: all 0.2s;
}

.data-item:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    transform: translateY(-1px);
}

.data-item:active {
    cursor: grabbing;
}

.agent-item {
    border-left: 4px solid #4CAF50;
}

.tool-item {
    border-left: 4px solid #FF9800;
}

.termination-item {
    border-left: 4px solid #f44336;
}

.item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}

.item-name {
    font-weight: 600;
    font-size: 14px;
    color: #333;
}

.item-type {
    font-size: 11px;
    color: #666;
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
}

.item-desc {
    font-size: 12px;
    color: #666;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

/* 画布容器样式 - 简化 */

/* 编辑弹窗样式 */
.edit-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.edit-dialog {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 3px 10px rgba(0, 0, 0, 0.1);
    width: 900px;
    height: 700px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid #e0e6f0;
}

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1.5px solid #e0e6f0;
    background: linear-gradient(90deg, #f8faff 0%, #f4f6fa 100%);
    flex-shrink: 0;
}

.dialog-header h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
    font-weight: 600;
}

.close-btn {
    background: #f5f5f5;
    border: 1px solid #ddd;
    font-size: 16px;
    color: #666;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 6px;
    transition: all 0.2s;
}

.close-btn:hover {
    background: #e0e0e0;
    color: #333;
    border-color: #bbb;
}

.dialog-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    background: #fbfcfd;
}

.edit-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
}

.dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 20px 24px;
    border-top: 1.5px solid #e0e6f0;
    background: linear-gradient(90deg, #f8faff 0%, #f4f6fa 100%);
    flex-shrink: 0;
}

.save-btn {
    padding: 12px 24px;
    background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3), 0 1.5px 0 #fff inset;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.2s;
}

.save-btn:hover {
    background: linear-gradient(90deg, #357ae8 0%, #409eff 100%);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4), 0 1.5px 0 #fff inset;
    transform: translateY(-1px);
}

.save-btn:active {
    transform: translateY(0) scale(0.98);
}

.cancel-btn {
    padding: 12px 24px;
    background: #f8f9fa;
    color: #666;
    border: 1.5px solid #e0e6f0;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.2s;
}

.cancel-btn:hover {
    background: #e9ecef;
    color: #495057;
    border-color: #ced4da;
    transform: translateY(-1px);
}

/* 递归表单样式 - 基于AgentNode优化 - 使用:deep()穿透 */
:deep(.form-root) {
    width: 100%;
}

:deep(.form-card) {
    border: 1.5px solid #e0e6f0;
    border-radius: 10px;
    background: #fafdff;
    margin: 14px 0 14px 0;
    padding: 16px 18px 10px 18px;
    box-shadow: 0 2px 8px rgba(179, 198, 224, 0.13);
}

:deep(.form-block) {
    margin-bottom: 20px;
}

:deep(.form-block-row) {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
}

:deep(.form-label-row) {
    font-size: 14px;
    color: #409eff;
    font-weight: 500;
    text-align: left;
    margin-bottom: 4px;
    min-width: 0;
    text-transform: capitalize;
}

:deep(.form-array-index) {
    color: #b3b3b3;
    font-size: 12px;
    background: #e9ecef;
    padding: 2px 8px;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 4px;
}

:deep(.form-label-inline) {
    font-size: 14px;
    color: #409eff;
    font-weight: 500;
    text-align: left;
    margin-bottom: 0;
    min-width: 120px;
    text-transform: capitalize;
}

:deep(.form-input-row) {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1.5px solid #b3c6e0;
    border-radius: 6px;
    font-size: 14px;
    color: #333;
    background: #f9f9fb;
    transition: border 0.2s;
    outline: none;
    margin-bottom: 2px;
}

:deep(.form-input-row:focus) {
    border: 1.5px solid #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

:deep(.form-input-longtext) {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    line-height: 1.6;
    padding: 12px 14px;
    background: #fbfbfb;
    border: 1.5px solid #d1d9e6;
    border-radius: 8px;
    resize: vertical;
    overflow-y: auto;
    word-wrap: break-word;
    white-space: pre-wrap;
    min-height: 80px;
}

:deep(.form-input-longtext:focus) {
    border-color: #409eff;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

:deep(.form-checkbox-inline) {
    width: 18px;
    height: 18px;
    accent-color: #409eff;
    margin-left: 0;
    transform: scale(1.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .sidebar-float {
        width: 280px;
        top: 10px;
        left: 10px;
        max-height: 60vh; /* 移动端调整为60%视口高度 */
    }

    .sidebar-toggle-btn {
        top: 10px;
        left: 10px;
        width: 44px;
        height: 44px;
        font-size: 18px;
    }

    .edit-dialog {
        width: 95%;
        height: 90%;
        margin: 10px;
    }
}

/* VueFlow 覆盖样式 */
:deep(.vue-flow__node) {
    cursor: default;
}

:deep(.vue-flow__handle) {
    background: #409eff;
    border: 2px solid #fff;
}

:deep(.vue-flow__edge) {
    stroke: #999;
    stroke-width: 2;
}

:deep(.vue-flow__edge.selected) {
    stroke: #409eff;
}
</style>