<template>
    <div class="agent-diy-container">

        <!-- 主要内容区域 -->
        <div class="main-content">
            <!-- 工具栏 -->
            <div class="toolbar">
                <!-- 视图切换按钮 -->
                <div class="view-switcher">
                    <button class="view-btn" :class="{ active: currentView === 'Node' }" @click="currentView = 'Node'">
                        🔗 节点视图
                    </button>
                    <button class="view-btn" :class="{ active: currentView === 'Json' }" @click="currentView = 'Json'">
                        📝 JSON视图
                    </button>
                    <button class="view-btn" :class="{ active: currentView === 'Preview' }" @click="currentView = 'Preview'">
                        👁️ 预览视图
                    </button>
                    <button class="view-btn chat-switch-btn" @click="switchChatConversation">
                        {{ chatSwitchButtonText }}
                    </button>
                    <button class="view-btn chat-switch-btn" >
                        版本控制
                    </button>
                </div>

                <!-- 未来其他可能的操作 -->
                <div class="actions">
                    <!-- 撤销/重做按钮 -->
                    <div class="undo-redo-group">
                        <button 
                            @click="undo()" 
                            :disabled="!canUndo()" 
                            class="undo-btn"
                            :title="`撤销 (Ctrl+Z) - 可撤销${undoStack.length - 1}步`"
                        >
                            ↶ 撤销
                        </button>
                        <button 
                            @click="redo()" 
                            :disabled="!canRedo()" 
                            class="redo-btn"
                            :title="`重做 (Ctrl+Shift+Z) - 可重做${redoStack.length}步`"
                        >
                            ↷ 重做
                        </button>
                        <!--button 
                            @click="console.log('[Debug] 撤销状态:', getUndoRedoDebugInfo())" 
                            class="debug-btn"
                            title="在控制台输出撤销状态调试信息"
                        >
                            🐛 调试
                        </button-->
                    </div>

                    <!-- 变化追踪状态显示 -->
                    <div class="change-tracker-status">
                        <span class="change-count">{{ getChangeStats().totalChanges }} 处变化</span>
                        <button v-if="getChangeStats().totalChanges > 0" @click="showChangeDetails = !showChangeDetails" class="detail-btn" title="查看数据变化详情">
                            � 变化
                        </button>
                        <span class="operation-count">{{ getOperationStats().totalOperations }} 个操作</span>
                        <button v-if="getOperationStats().totalOperations > 0" @click="showOperationDetails = !showOperationDetails" class="operation-btn" title="查看操作记录">
                            📋 操作
                        </button>
                        <button v-if="getOperationStats().totalOperations > 0" @click="resetChangeTracking()" class="reset-btn" title="重置追踪">
                            🔄 重置
                        </button>
                    </div>

                    <!-- WebSocket 状态和操作 -->
                    <div class="websocket-status">
                        <span class="connection-status" :class="{ connected: isConnected, disconnected: !isConnected }">
                            {{ isConnected ? '🟢 已连接' : '🔴 未连接' }}
                        </span>
                        <span v-if="autoSaveTimer || isSaving" class="auto-save-status">
                            {{ isSaving ? '💾 保存中...' : '⏱️ 准备保存...' }}
                        </span>
                        <!--button @click="getDataFromBackend()" :disabled="!isConnected" class="websocket-btn" title="从后端获取数据">
                            📥 获取
                        </button-->
                        <!--button @click="deployToBackend()" :disabled="!isConnected || isSaving" class="websocket-btn" title="保存到后端">
                            💾 保存
                        </button-->
                    </div>
                </div>
            </div>

            <!-- 变化详情面板 -->
            <div v-if="showChangeDetails && getChangeStats().totalChanges > 0" class="change-details-panel">
                <div class="change-details-header">
                    <h4>� 数据变化详情</h4>
                    <button @click="showChangeDetails = false" class="close-details">✕</button>
                </div>
                <div class="change-details-content">
                    <div class="change-summary">
                        <p><strong>数据变化数:</strong> {{ getChangeStats().totalChanges }}</p>
                        <p><strong>撤销栈:</strong> {{ undoStack.length - 1 }} 步可撤销</p>
                        <p><strong>重做栈:</strong> {{ redoStack.length }} 步可重做</p>
                    </div>
                    <div class="change-log">
                        <h5>变化字段:</h5>
                        <div v-for="(changePath, index) in getChangeStats().changedPaths" :key="index" class="change-item">
                            <div class="change-info">
                                <span class="change-type" data-type="data_change">变化</span>
                                <span class="change-path">{{ changePath.path }}</span>
                                <span class="change-status">已修改</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 操作详情面板 -->
            <div v-if="showOperationDetails && getOperationStats().totalOperations > 0" class="change-details-panel">
                <div class="change-details-header">
                    <h4>📋 操作追踪记录</h4>
                    <button @click="showOperationDetails = false" class="close-details">✕</button>
                </div>
                <div class="change-details-content">
                    <div class="change-summary">
                        <p><strong>总操作数:</strong> {{ getOperationStats().totalOperations }}</p>
                        <p v-if="getOperationStats().lastOperationTime"><strong>最后操作:</strong> {{ new Date(getOperationStats().lastOperationTime).toLocaleString() }}</p>
                    </div>
                    <div class="change-log">
                        <h5>操作记录:</h5>
                        <div v-for="(operation, index) in getOperationStats().operationLog" :key="index" class="change-item">
                            <div class="change-info">
                                <span class="change-type" :data-type="operation.operationType">{{ operation.operationType }}</span>
                                <span class="change-path">{{ operation.fieldPath }}</span>
                                <span class="change-time">{{ new Date(operation.timestamp).toLocaleTimeString() }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 视图内容区域 -->
            <div class="view-container">
                <!-- 节点视图 -->
                <Agent_Node v-if="currentView === 'Node'" v-show="currentView === 'Node'" />

                <!-- JSON视图 -->
                <Agent_Json v-if="currentView === 'Json'" v-show="currentView === 'Json'" />

                <!-- 预览视图 -->
                <Agent_Preview v-if="currentView === 'Preview'" v-show="currentView === 'Preview'" />
            </div>
        </div>

        <!-- 未来扩展区域 -->
        <div class="future-area">
            <!-- 留给未来可能进行的其他操作的空间 -->
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Agent_Node from './Agent_Node/index'
import Agent_Json from './Agent_JSON/index'
import Agent_Preview from './Agent_Preview/index'
import { rawData } from './Data/Raw_Data'
import { useWebSocket } from '../../../../../utils/websocket'
import { addPrefixSuffix, removePrefixSuffix } from '../../../../../utils/stringUtils'
import { MATRIX_SERVER_URL,MATRIX_SERVER_URL_ALL,MATRIX_SERVER_URL_TAIL } from '@/apiUrls'

import { openMessageDialog } from '@/components/MessageDialog/open';


// 定义事件发射器
const emit = defineEmits<{
    'switch-conversation': [userId: string]
}>()


// 路由参数
const route = useRoute()
const applicationId = computed(() => route.params.applicationId as string)
const account = computed(() => route.params.account as string)
console.log('[Agent_DIY] 接收到的路由参数:', {
  applicationId: applicationId.value,
  account: account.value
});


// 当前视图状态
const currentView = ref<'Node' | 'Json' | 'Preview'>('Node')

// 变化详情显示状态
const showChangeDetails = ref(false)

// 操作详情显示状态
const showOperationDetails = ref(false)

// 共享的团队数据
const teamData = ref(JSON.parse(JSON.stringify(rawData)))

// 当前记录ID（从WebSocket接收的数据ID）
const currentRecordId = ref<number | null>(null)

// 上一次状态快照（用于计算变化差异）
const previousStateSnapshot = ref<any>(null)

// ========== 操作追踪系统 ========== //
const operationLog = ref<any[]>([])

// ========== 变化追踪系统 ========== //
const originalDataSnapshot = ref<any>(null)

// ========== 撤销/重做系统 ========== //
const undoStack = ref<any[]>([])
const redoStack = ref<any[]>([])
const maxUndoSteps = 50 // 最大撤销步数
const isUndoRedoOperation = ref(false) // 标记当前是否在执行撤销/重做操作

// 记录原始数据快照
function saveOriginalSnapshot() {
    originalDataSnapshot.value = JSON.parse(JSON.stringify(teamData.value))
    // 初始状态也保存到撤销栈
    undoStack.value = [JSON.parse(JSON.stringify(teamData.value))]
    redoStack.value = []
    console.log('[ChangeTracker] 📸 保存原始数据快照')
}

// 保存当前状态到撤销栈
function saveToUndoStack() {
    const currentState = JSON.parse(JSON.stringify(teamData.value))
    undoStack.value.push(currentState)
    
    // 清空重做栈（新操作后不能重做之前的撤销）
    redoStack.value = []
    
    // 限制撤销栈大小
    if (undoStack.value.length > maxUndoSteps) {
        undoStack.value.shift()
    }
    
    console.log(`[UndoRedo] 💾 保存状态到撤销栈 (${undoStack.value.length}/${maxUndoSteps})`)
}

// 记录数据变化
function recordChange(fieldPath: string, newValue: any, operationType: string = 'edit') {
    // 如果正在执行撤销/重做操作，不记录变化
    if (isUndoRedoOperation.value) {
        return
    }
    
    // 在记录变化前，先保存当前状态作为previousState（用于变化对比）
    if (!previousStateSnapshot.value) {
        console.log('[ChangeAnalysis] 📸 首次保存previousState快照')
        previousStateSnapshot.value = JSON.parse(JSON.stringify(teamData.value))
    }
    
    // 在记录变化前，先保存当前状态到撤销栈
    saveToUndoStack()
    
    const timestamp = new Date().toISOString()
    const change = {
        timestamp,
        fieldPath,
        newValue: JSON.parse(JSON.stringify(newValue)),
        operationType
    }
    operationLog.value.push(change)
    console.log(`[OperationTracker] 📝 记录操作: ${fieldPath} (${operationType})`)
    
    // 触发自动保存
    autoSave()
}

// 撤销操作
function undo() {
    if (undoStack.value.length <= 1) {
        console.log('[UndoRedo] ⚠️ 没有可撤销的操作')
        return false
    }
    
    isUndoRedoOperation.value = true
    
    try {
        // 将当前状态移到重做栈
        const currentState = JSON.parse(JSON.stringify(teamData.value))
        redoStack.value.push(currentState)
        
        // 从撤销栈取出上一个状态
        undoStack.value.pop() // 移除当前状态
        const previousState = undoStack.value[undoStack.value.length - 1]
        
        // 恢复数据
        teamData.value = JSON.parse(JSON.stringify(previousState))
        
        // 添加撤销操作记录
        const timestamp = new Date().toISOString()
        operationLog.value.push({
            timestamp,
            fieldPath: 'system',
            newValue: null,
            operationType: 'undo'
        })
        
        console.log(`[UndoRedo] ↶ 撤销操作 (撤销栈: ${undoStack.value.length}, 重做栈: ${redoStack.value.length})`)
        
        // 重要：撤销后需要保存到后端数据库
        console.log('[UndoRedo] 💾 撤销操作完成，开始保存到后端数据库')
        
        return true
    } finally {
        isUndoRedoOperation.value = false
        
        // 在finally块中触发自动保存，确保撤销后的状态被保存到后端
        console.log('[UndoRedo] 🚀 触发自动保存（撤销操作）')
        autoSave()
    }
}

// 重做操作
function redo() {
    if (redoStack.value.length === 0) {
        console.log('[UndoRedo] ⚠️ 没有可重做的操作')
        return false
    }
    
    isUndoRedoOperation.value = true
    
    try {
        // 将当前状态保存到撤销栈
        const currentState = JSON.parse(JSON.stringify(teamData.value))
        undoStack.value.push(currentState)
        
        // 从重做栈取出状态并恢复
        const redoState = redoStack.value.pop()
        teamData.value = JSON.parse(JSON.stringify(redoState))
        
        // 添加重做操作记录
        const timestamp = new Date().toISOString()
        operationLog.value.push({
            timestamp,
            fieldPath: 'system',
            newValue: null,
            operationType: 'redo'
        })
        
        console.log(`[UndoRedo] ↷ 重做操作 (撤销栈: ${undoStack.value.length}, 重做栈: ${redoStack.value.length})`)
        
        // 重要：重做后需要保存到后端数据库
        console.log('[UndoRedo] 💾 重做操作完成，开始保存到后端数据库')
        
        return true
    } finally {
        isUndoRedoOperation.value = false
        
        // 在finally块中触发自动保存，确保重做后的状态被保存到后端
        console.log('[UndoRedo] 🚀 触发自动保存（重做操作）')
        autoSave()
    }
}

// 检查是否可以撤销/重做
function canUndo() {
    return undoStack.value.length > 1
}

function canRedo() {
    return redoStack.value.length > 0
}

// 调试函数：获取撤销栈状态
function getUndoRedoDebugInfo() {
    return {
        undoStackLength: undoStack.value.length,
        redoStackLength: redoStack.value.length,
        canUndo: canUndo(),
        canRedo: canRedo(),
        isUndoRedoOperation: isUndoRedoOperation.value,
        currentDataSnapshot: teamData.value ? JSON.stringify(teamData.value).substring(0, 100) + '...' : 'null'
    }
}

// 生成变化摘要
function generateChangesSummary(): any {
    if (!originalDataSnapshot.value || !teamData.value) {
        return {}
    }
    
    const changes: any = {}
    const original = originalDataSnapshot.value
    const current = teamData.value
    
    // 深度比较数据变化
    const changedPaths = findChangedPaths(original, current, '')
    
    changedPaths.forEach(pathInfo => {
        const { path, currentValue } = pathInfo
        setNestedValue(changes, path, currentValue)
    })
    
    return changes
}

// 递归查找变化路径
function findChangedPaths(original: any, current: any, basePath: string = ''): Array<{path: string, originalValue: any, currentValue: any}> {
    const changes: Array<{path: string, originalValue: any, currentValue: any}> = []
    
    if (JSON.stringify(original) === JSON.stringify(current)) {
        return changes
    }
    
    // 数组作为整体比较
    if (Array.isArray(original) || Array.isArray(current)) {
        if (JSON.stringify(original) !== JSON.stringify(current)) {
            changes.push({
                path: basePath,
                originalValue: original,
                currentValue: current
            })
        }
        return changes
    }
    
    // 对象字段逐一比较
    if (typeof original === 'object' && typeof current === 'object' && original !== null && current !== null) {
        const allKeys = new Set([...Object.keys(original), ...Object.keys(current)])
        
        for (const key of allKeys) {
            const newPath = basePath ? `${basePath}.${key}` : key
            const originalValue = original[key]
            const currentValue = current[key]
            
            if (JSON.stringify(originalValue) !== JSON.stringify(currentValue)) {
                changes.push(...findChangedPaths(originalValue, currentValue, newPath))
            }
        }
    } else {
        // 基础类型直接比较
        if (original !== current) {
            changes.push({
                path: basePath,
                originalValue: original,
                currentValue: current
            })
        }
    }
    
    return changes
}

// 设置嵌套对象值
function setNestedValue(obj: any, path: string, value: any) {
    const keys = path.split('.')
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!(key in current)) {
            current[key] = {}
        }
        current = current[key]
    }
    
    current[keys[keys.length - 1]] = value
}

// 获取操作统计
function getOperationStats() {
    const operationCount = operationLog.value.length
    
    return {
        totalOperations: operationCount,
        lastOperationTime: operationLog.value.length > 0 ? operationLog.value[operationLog.value.length - 1].timestamp : null,
        operationLog: operationLog.value
    }
}

// 获取变化统计（与原始版本对比）
function getChangeStats() {
    const summary = generateChangesSummary()
    const changeCount = Object.keys(summary).length
    
    return {
        totalChanges: changeCount,
        changesSummary: summary,
        changedPaths: findChangedPaths(originalDataSnapshot.value, teamData.value, '')
    }
}

// 重置变化追踪（保存新快照）
function resetChangeTracking() {
    saveOriginalSnapshot()
    operationLog.value = []
    console.log('[ChangeTracker] 🔄 重置变化追踪')
}

// 专门用于WebSocket数据同步的函数（不重置原始快照）
function syncDataFromWebSocket(newData: any, operationType: string = 'websocket_sync') {
    // 先保存当前状态到撤销栈（让用户可以撤销同步）
    console.log('[WebSocket] 💾 保存当前状态到撤销栈（WebSocket同步前）')
    saveToUndoStack()
    
    // 标记为非用户操作，避免触发自动保存
    console.log('[WebSocket] 🔒 设置撤销重做操作标记为true (避免触发自动保存)')
    isUndoRedoOperation.value = true
    
    try {
        console.log('[WebSocket] 💾 开始同步数据')
        // 直接使用新数据更新当前数据
        teamData.value = JSON.parse(JSON.stringify(newData))
        console.log('[WebSocket] ✅ 数据同步完成')
        
        // 添加同步操作记录到操作日志
        const timestamp = new Date().toISOString()
        operationLog.value.push({
            timestamp,
            fieldPath: 'system.websocket_sync',
            newValue: '数据同步',
            operationType: operationType
        })
        console.log('[WebSocket] 📝 记录同步操作到操作日志')
        
        // 更新previousStateSnapshot作为变化对比的基准（但不重置原始快照）
        previousStateSnapshot.value = JSON.parse(JSON.stringify(teamData.value))
        console.log('[WebSocket] 📸 更新previousStateSnapshot作为变化对比基准')
        
        console.log('[WebSocket] 🎉 数据同步完成！用户可以通过撤销功能回到同步前的状态')
        
    } finally {
        console.log('[WebSocket] 🔓 重置撤销重做操作标记为false')
        isUndoRedoOperation.value = false
    }
}

// 键盘快捷键处理
function handleKeydown(event: KeyboardEvent) {
    // Ctrl+Z 撤销
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
    }
    // Ctrl+Shift+Z 或 Ctrl+Y 重做
    else if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || 
             (event.ctrlKey && event.key === 'y')) {
        event.preventDefault()
        redo()
    }
}

// ========== 聊天控制系统 ========== //
// 检查是否在iframe中运行
const isInIframe = ref(window !== window.parent)

// 聊天用户状态管理
const currentChatUserId = ref('') // 当前正在聊天的用户ID
const alternateChatUserId = ref('') // 备选聊天用户ID

// 计算属性：动态按钮文本
const chatSwitchButtonText = computed(() => {
    if (!currentChatUserId.value && !alternateChatUserId.value) {
        return '调试';
    }
    
    // 获取两个用户ID
    const talk_user1 = applicationId.value;
    const talk_user11 = talk_user1.startsWith('@RBT#') ? talk_user1 : `@RBT#${talk_user1}`;
    const talk_user111 = talk_user11.endsWith('Bot') ? talk_user11 : `${talk_user11}Bot`;
    const talk_user222 = account.value;
    
    // 根据当前用户显示不同的调试状态
    if (currentChatUserId.value === talk_user111) {
        return '调试';
    } else if (currentChatUserId.value === talk_user222) {
        return '关闭调试';
    }
    
    // 默认情况
    return '切换聊天';
});

// 向父窗口发送消息的通用函数
function sendMessageToParent(type: string, payload: any = {}) {
    if (!isInIframe.value) {
        console.warn('[Agent_DIY] 不在iframe中，无法发送消息到父窗口');
        return;
    }

    const message = { type, payload };
    console.log('[Agent_DIY] 发送消息到父窗口:', message);
    
    try {
        window.parent.postMessage(message, window.location.origin);
        console.log('[Agent_DIY] 消息发送成功');
    } catch (error) {
        console.error('[Agent_DIY] 发送消息失败:', error);
    }
}

// 主要的聊天切换函数 - 实现两用户间切换
function switchChatConversation() {
    console.log('[Agent_DIY] 聊天切换按钮被点击');
    
    // ========== 🔧 你原来的用户ID逻辑 ========== //
    let talk_user1 = removePrefixSuffix(applicationId.value,"@RBT#","Bot");
    talk_user1=addPrefixSuffix(talk_user1,"@",MATRIX_SERVER_URL_TAIL);


    console.log('[Agent_DIY] 当前对话ID:', talk_user1);

    let talk_user2 =removePrefixSuffix(account.value,"@RBT#","Bot");
     talk_user2=addPrefixSuffix(talk_user2,"@",MATRIX_SERVER_URL_TAIL);
    console.log('[Agent_DIY] 备选对话ID:', talk_user2);
    
    // ========== � 初始化或切换逻辑 ========== //
    
    let targetUserId = '';
    
    // 如果是第一次点击，初始化状态
    if (!currentChatUserId.value && !alternateChatUserId.value) {
        console.log('[Agent_DIY] 首次切换，初始化状态');
        
        // 假设当前正在与talk_user111聊天，准备切换到talk_user222
        currentChatUserId.value = talk_user1;
        alternateChatUserId.value = talk_user2;
        targetUserId = talk_user2;
        
        console.log('[Agent_DIY] 初始化完成 - 当前房间:', currentChatUserId.value);
        console.log('[Agent_DIY] 初始化完成 - 备选房间:', alternateChatUserId.value);
        console.log('[Agent_DIY] 准备切换到:', targetUserId);
    } 
    // 执行切换操作
    else {
        console.log('[Agent_DIY] 执行用户切换');
        console.log('[Agent_DIY] 切换前 - 当前房间:', currentChatUserId.value);
        console.log('[Agent_DIY] 切换前 - 备选房间:', alternateChatUserId.value);
        
        // 交换当前用户和备选用户
        const temp = currentChatUserId.value;
        currentChatUserId.value = alternateChatUserId.value;
        alternateChatUserId.value = temp;
        
        targetUserId = currentChatUserId.value;
        
        console.log('[Agent_DIY] 切换后 - 当前房间:', currentChatUserId.value);
        console.log('[Agent_DIY] 切换后 - 备选房间:', alternateChatUserId.value);
        console.log('[Agent_DIY] 目标用户:', targetUserId);
    }
    
    // ========== ✅ 验证和执行切换 ========== //
    
    if (!targetUserId || !targetUserId.trim()) {
        console.warn('[Agent_DIY] 没有有效的目标用户ID');
        openMessageDialog('切换失败：没有找到有效的聊天对象ID');
        return;
    }
    
    console.log('[Agent_DIY] 🔄 请求切换聊天对象到:', targetUserId);
    
    // 通过 emit 发送事件给父组件
    emit('switch-conversation', targetUserId.trim());
    
    /*
    // 发送切换消息到父窗口
    sendMessageToParent('SWITCH_CONVERSATION', {
        userid: targetUserId.trim()
    });
    */
    // 显示操作反馈
    console.log(`[Agent_DIY] ✅ 已请求切换到房间: ${targetUserId}`);
    
    // 可选：显示用户友好的提示
    // openMessageDialog(`正在切换到用户: ${targetUserId}`);
}

// 其他辅助聊天控制函数
// 注意：以下函数已注释，因为未被使用
// function sendQuickMessage(message?: string) {
//     const messageToSend = message || prompt('请输入要发送的消息:');
//     if (messageToSend && messageToSend.trim()) {
//         console.log('[Agent_DIY] 请求发送消息:', messageToSend);
//         sendMessageToParent('SEND_MESSAGE', {
//             message: messageToSend.trim()
//         });
//     }
// }

// function closeRightPanel() {
//     console.log('[Agent_DIY] 请求关闭右侧面板');
//     sendMessageToParent('CLOSE_PANEL');
// }

// 重置聊天切换状态
// function resetChatSwitchState() {
//     console.log('[Agent_DIY] 重置聊天切换状态');
//     currentChatUserId.value = '';
//     alternateChatUserId.value = '';
// }

// 获取当前聊天状态信息
// function getChatSwitchStatus() {
//     return {
//         currentUser: currentChatUserId.value,
//         alternateUser: alternateChatUserId.value,
//         isInitialized: !!(currentChatUserId.value && alternateChatUserId.value),
//         buttonText: chatSwitchButtonText.value
//     };
// }


























// ==================================================================================
// WebSocket 系统 - 后端数据存储与同步
// ==================================================================================
// WebSocket 连接状态
const isConnected = ref(false)
const isSaving = ref(false)
const autoSaveTimer = ref<any>(null)

// 动态WebSocket连接URL
//const websocketUrl = computed(() => `wss://chat.zy-jn.org.cn/aagent/ws/${applicationId.value}`)


const websocketUrl = computed(() => {
    // 对account进行URL编码以处理特殊字符如#和@
    const encodedAccount = encodeURIComponent(account.value)
    return `wss://${MATRIX_SERVER_URL}/api/v2/ws/${applicationId.value}/blueprint/${encodedAccount}`
})


// WebSocket实例
let websocketInstance: ReturnType<typeof useWebSocket> | null = null

// WebSocket消息发送包装器
function sendWebSocketMessage(data: any) {
    console.log('[WebSocket] 🔍 准备发送消息，检查连接状态')
    console.log('[WebSocket] 🔍 WebSocket实例存在:', !!websocketInstance)
    console.log('[WebSocket] 🔍 连接状态:', isConnected.value)
    
    if (websocketInstance && isConnected.value) {
        console.log('[WebSocket] ✅ 连接正常，开始发送消息')
        console.log('[WebSocket] 📤 发送的数据内容:', JSON.stringify(data, null, 2))
        websocketInstance.send(data)
        console.log('[WebSocket] ✅ 消息发送完成')
    } else {
        console.error('[WebSocket] ❌ WebSocket未连接，无法发送消息')
        console.error('[WebSocket] 🔍 失败原因 - WebSocket实例:', !!websocketInstance, '连接状态:', isConnected.value)
    }
}

// 自动接收数据函数 - 连接成功后自动触发
function autoReceiveData() {
    try {
        console.log('[WebSocket] 🤖 开始自动数据接收流程')
        console.log('[WebSocket] 🔍 当前applicationId:', applicationId.value)
        console.log('[WebSocket] 🤖 自动请求后端数据...')
        
        // 构造查询请求数据
        const requestData = { 
            table: 'AgentTeam',
            account: account.value,
            action: 'select' 
        }
        console.log('[WebSocket] 📝 构造的查询请求:', JSON.stringify(requestData, null, 2))
        
        // 发送查询请求，让后端返回Agent_DIY数据
        sendWebSocketMessage(requestData)
        
        console.log('[WebSocket] ✅ 自动数据请求已发送，等待后端响应')
        console.log('[WebSocket] ⏳ 请等待后端处理并返回数据...')
        
    } catch (error: any) {
        console.error('[WebSocket] ❌ 自动请求数据失败:', error)
        console.error('[WebSocket] 🔍 错误详情:', error.message)
        console.error('[WebSocket] 🔍 错误堆栈:', error.stack)
    }
}

// 手动从后端获取数据
function getDataFromBackend() {
    try {
        console.log('[WebSocket] 🔄 手动数据获取流程开始')
        console.log('[WebSocket] 🔍 当前连接状态:', isConnected.value)
        console.log('[WebSocket] 🔄 手动请求后端数据...')
        
        const requestData = { 
            table: 'AgentTeam',
            account: account.value,
            action: 'select' 
        }
        console.log('[WebSocket] 📝 手动请求数据:', JSON.stringify(requestData, null, 2))
        
        sendWebSocketMessage(requestData)
        console.log('[WebSocket] ✅ 手动数据请求已发送')
        
    } catch (error: any) {
        console.error('[WebSocket] ❌ 手动请求数据失败:', error)
        console.error('[WebSocket] 🔍 手动请求错误详情:', error.message)
    }
}

// 分析数据变化（用于SubmissionRecord格式）
function analyzeChanges(current: any, previous: any): { content: any, originalContent: any } {
    console.log('[ChangeAnalysis] 🔍 开始分析数据变化')
    console.log('[ChangeAnalysis] 📊 当前数据类型:', typeof current)
    console.log('[ChangeAnalysis] 📊 之前数据类型:', typeof previous)
    
    const content: any = {}
    const originalContent: any = {}
    
    if (!previous) {
        console.log('[ChangeAnalysis] ⚠️ 没有之前的状态，返回完整当前状态')
        return { 
            content: JSON.parse(JSON.stringify(current)), 
            originalContent: {} 
        }
    }
    
    // 递归比较对象，找出变化的键值对
    function findChangedFields(currentObj: any, previousObj: any, path: string = '') {
        if (typeof currentObj !== 'object' || typeof previousObj !== 'object') {
            if (JSON.stringify(currentObj) !== JSON.stringify(previousObj)) {
                console.log('[ChangeAnalysis] 🔍 发现变化字段:', path || 'root')
                setNestedValue(content, path || 'root', currentObj)
                setNestedValue(originalContent, path || 'root', previousObj)
            }
            return
        }
        
        // 处理数组 - 数组作为整体记录
        if (Array.isArray(currentObj) || Array.isArray(previousObj)) {
            if (JSON.stringify(currentObj) !== JSON.stringify(previousObj)) {
                console.log('[ChangeAnalysis] 📝 数组变化:', path)
                setNestedValue(content, path, JSON.parse(JSON.stringify(currentObj)))
                setNestedValue(originalContent, path, JSON.parse(JSON.stringify(previousObj)))
            }
            return
        }
        
        // 处理对象字段
        const allKeys = new Set([
            ...Object.keys(currentObj || {}), 
            ...Object.keys(previousObj || {})
        ])
        
        for (const key of allKeys) {
            const newPath = path ? `${path}.${key}` : key
            const currentValue = currentObj?.[key]
            const previousValue = previousObj?.[key]
            
            findChangedFields(currentValue, previousValue, newPath)
        }
    }
    
    findChangedFields(current, previous)
    
    console.log('[ChangeAnalysis] 📊 分析结果:')
    console.log('[ChangeAnalysis] 📋 变化字段数量:', Object.keys(content).length)
    console.log('[ChangeAnalysis] 📋 content:', content)
    console.log('[ChangeAnalysis] 📋 originalContent:', originalContent)
    
    return { content, originalContent }
}

// 部署/保存数据到后端
function deployToBackend() {
    try {
        console.log('[WebSocket] 💾 部署数据到后端流程开始')
        console.log('[WebSocket] 🔍 当前连接状态:', isConnected.value)
        console.log('[WebSocket] 🔍 当前保存状态:', isSaving.value)
        console.log('[WebSocket] � 当前记录ID:', currentRecordId.value)
        console.log('[WebSocket] �💾 部署数据到后端...')
        
        isSaving.value = true
        console.log('[WebSocket] 🔄 设置保存状态为true')
        
        // 检查必要的数据
        if (!currentRecordId.value) {
            console.warn('[WebSocket] ⚠️ 没有记录ID，无法发送数据')
            isSaving.value = false
            return
        }
        
        // 分析变化
        console.log('[WebSocket] 🔍 开始分析数据变化')
        const changeAnalysis = analyzeChanges(teamData.value, previousStateSnapshot.value)
        console.log('[WebSocket] 📊 变化分析完成:', {
            contentFieldsCount: Object.keys(changeAnalysis.content).length,
            originalContentFieldsCount: Object.keys(changeAnalysis.originalContent).length
        })
        
        // 构造SubmissionRecord格式的数据
        const submissionData = {
            table: 'SubmissionRecord',
            action: 'insert', 
            account: account.value,
            value: {
                master: currentRecordId.value.toString(),      // 使用当前记录ID作为master
                teamBody: JSON.parse(JSON.stringify(teamData.value)),  // 完整的当前teamBody JSON对象
                content: changeAnalysis.content,               // 变化的部分（当前值）
                originalContent: changeAnalysis.originalContent // 变化的部分（原始值）
            }
        }
        
        console.log('[WebSocket] 📝 构造的SubmissionRecord数据结构:')
        console.log('[WebSocket] 📋 - 表名:', submissionData.table)
        console.log('[WebSocket] 📋 - 操作:', submissionData.action)
        console.log('[WebSocket] 📋 - master ID:', submissionData.value.master)
        console.log('[WebSocket] 📋 - teamBody大小:', JSON.stringify(submissionData.value.teamBody).length, '字符')
        console.log('[WebSocket] 📋 - content变化字段数:', Object.keys(submissionData.value.content).length)
        console.log('[WebSocket] 📋 - originalContent字段数:', Object.keys(submissionData.value.originalContent).length)
        console.log('[WebSocket] 📝 完整SubmissionRecord数据:', JSON.stringify(submissionData, null, 2))
        
        sendWebSocketMessage(submissionData)
        console.log('[WebSocket] ✅ SubmissionRecord部署请求已发送')
        console.log('[WebSocket] ⏳ 等待后端确认保存结果...')
        console.log('[WebSocket] 🔍 发送时间戳:', new Date().toISOString())
        console.log('[WebSocket] 📊 发送数据摘要:')
        console.log('[WebSocket] 📋   - 表名:', submissionData.table)
        console.log('[WebSocket] 📋   - 操作:', submissionData.action)
        console.log('[WebSocket] 📋   - master ID:', submissionData.value.master)
        console.log('[WebSocket] 📋   - teamBody大小:', JSON.stringify(submissionData.value.teamBody).length, '字符')
        console.log('[WebSocket] 📋   - content变化字段:', Object.keys(submissionData.value.content).join(', '))
        console.log('[WebSocket] 📋   - originalContent字段:', Object.keys(submissionData.value.originalContent).join(', '))
        console.log('[WebSocket] 📋   - 实际发送的JSON大小:', JSON.stringify(submissionData).length, '字符')
        
        // 保存当前状态作为下次的previousState
        previousStateSnapshot.value = JSON.parse(JSON.stringify(teamData.value))
        console.log('[WebSocket] 📸 保存当前状态作为下次比较的基准')
        
        // 设置超时重置保存状态（防止一直显示保存中）
        setTimeout(() => {
            if (isSaving.value) {
                console.warn('[WebSocket] ⚠️ 保存超时，自动重置保存状态')
                console.warn('[WebSocket] 🕒 超时时间:', new Date().toISOString())
                console.warn('[WebSocket] ❓ 可能原因: 1.后端未响应 2.网络问题 3.数据格式问题 4.后端错误')
                
                // 清理自动保存定时器
                if (autoSaveTimer.value) {
                    console.warn('[WebSocket] 🗑️ 超时清理自动保存定时器')
                    clearTimeout(autoSaveTimer.value)
                    autoSaveTimer.value = null
                }
                
                isSaving.value = false
            }
        }, 10000) // 10秒超时
        
        console.log('[WebSocket] ⏰ 设置超时保护，10秒后检查保存状态')
        
    } catch (error: any) {
        console.error('[WebSocket] ❌ 部署失败:', error)
        console.error('[WebSocket] 🔍 部署错误详情:', error.message)
        console.error('[WebSocket] 🔍 部署错误堆栈:', error.stack)
        isSaving.value = false
        console.log('[WebSocket] 🔄 重置保存状态为false')
    }
}

// 自动保存功能
function autoSave() {
    console.log('[WebSocket] 🕐 自动保存功能触发')
    console.log('[WebSocket] 🔍 检查当前定时器状态:', !!autoSaveTimer.value)
    
    // 清除之前的定时器（防抖机制）
    if (autoSaveTimer.value) {
        console.log('[WebSocket] 🗑️ 清除之前的自动保存定时器（防抖）')
        clearTimeout(autoSaveTimer.value)
    }
    
    console.log('[WebSocket] ⏰ 设置新的自动保存定时器 (2秒后触发)')
    console.log('[WebSocket] 💡 防抖机制：连续操作只会在最后一次操作2秒后保存')
    
    // 设置新的定时器
    autoSaveTimer.value = setTimeout(() => {
        console.log('[WebSocket] 🕐 自动保存定时器触发，开始执行保存')
        console.log('[WebSocket] 📊 即将保存最终状态，包含所有累积的用户操作')
        console.log('[WebSocket] 💾 执行自动保存到后端...')
        deployToBackend()
    }, 2000) // 2秒后自动保存
    
    console.log('[WebSocket] ✅ 自动保存定时器设置完成')
}

// WebSocket连接函数
function connectWebSocket() {
    console.log('[WebSocket] 🔌 开始WebSocket连接流程')
    console.log('[WebSocket] 🔍 检查现有WebSocket实例:', !!websocketInstance)
    
    if (websocketInstance) {
        console.log('[WebSocket] 🔄 关闭现有WebSocket连接')
        websocketInstance.close()
        websocketInstance = null
        console.log('[WebSocket] ✅ 现有连接已关闭')
    }
    
    console.log('[WebSocket] 🔍 检查applicationId参数:', applicationId.value)
    console.log('[WebSocket] 🔍 检查account参数:', account.value)
    if (!applicationId.value || !account.value) {
        console.warn('[WebSocket] ⚠️ 缺少必要参数，无法连接WebSocket')
        console.warn('[WebSocket] 🔍 applicationId值:', applicationId.value)
        console.warn('[WebSocket] 🔍 account值:', account.value)
        return
    }
    
    console.log('[WebSocket] 🔌 准备连接到WebSocket服务器')
    console.log('[WebSocket] 🌐 目标URL:', websocketUrl.value)
    console.log('[WebSocket] 🔌 连接到:', websocketUrl.value)
    
    websocketInstance = useWebSocket(websocketUrl.value)
    console.log('[WebSocket] ✅ WebSocket实例已创建')
    
    // 监听连接状态
    console.log('[WebSocket] 👂 设置连接状态监听器')
    watch(
        () => websocketInstance?.isConnected.value,
        (connected) => {
            console.log('[WebSocket] 📡 连接状态变化:', connected)
            isConnected.value = !!connected
            console.log('[WebSocket] 🔄 更新本地连接状态为:', isConnected.value)
            
            if (connected) {
                console.log('[WebSocket] 🚀 WebSocket连接成功！')
                console.log('[WebSocket] ✅ 连接建立完成，准备自动触发数据接收')
                console.log('[WebSocket] ⏱️ 延迟500ms以确保连接完全稳定')
                
                // 延迟一下确保连接完全稳定
                setTimeout(() => {
                    console.log('[WebSocket] 🕐 延迟时间到，开始自动数据接收')
                    autoReceiveData()
                }, 500)
            } else {
                console.log('[WebSocket] 🔌 WebSocket连接断开')
                console.log('[WebSocket] ⚠️ 连接状态已更新为断开')
            }
        },
        { immediate: true }
    )
    
    console.log('[WebSocket] 📨 设置消息处理器')
    // 处理接收到的消息
    websocketInstance.connect((rawData) => {
        try {
            console.log('[WebSocket] � ==========收到新消息==========')
            console.log('[WebSocket] 📥 收到时间戳:', new Date().toISOString())
            console.log('[WebSocket] 📥 收到原始数据类型:', typeof rawData)
            console.log('[WebSocket] �📥 收到原始数据:', rawData)
            console.log('[WebSocket] 🔍 原始数据详细结构:', JSON.stringify(rawData, null, 2))
            console.log('[WebSocket] 🔍 数据长度:', JSON.stringify(rawData).length, '字符')
            
            // 处理数组格式数据
            let processedData = rawData
            console.log('[WebSocket] 🔍 检查数据是否为数组:', Array.isArray(rawData))
            
            if (Array.isArray(rawData) && rawData.length > 0) {
                console.log('[WebSocket] 🔄 检测到数组格式数据，提取第一个元素')
                console.log('[WebSocket] 📊 数组长度:', rawData.length)
                processedData = rawData[0]
                console.log('[WebSocket] ✅ 已提取第一个元素:', processedData)
            } else if (Array.isArray(rawData) && rawData.length === 0) {
                console.log('[WebSocket] 🚫 收到空数组，忽略处理')
                console.log('[WebSocket] ⚠️ 空数组无需处理，直接返回')
                return
            }
            
            console.log('[WebSocket] 🔍 处理后的数据:', processedData)
            console.log('[WebSocket] 🔍 检查是否包含content字段:', !!processedData?.content)
            console.log('[WebSocket] 🔍 检查是否包含originalContent字段:', !!processedData?.originalContent)
            
            // 检查是否是SubmissionRecord的响应确认
            if (processedData && processedData.table === 'SubmissionRecord') {
                console.log('[WebSocket] ✅ 检测到SubmissionRecord响应确认')
                console.log('[WebSocket] 📝 SubmissionRecord响应:', processedData)
                
                // 清理自动保存定时器
                if (autoSaveTimer.value) {
                    console.log('[WebSocket] 🗑️ 清理自动保存定时器 (SubmissionRecord确认)')
                    clearTimeout(autoSaveTimer.value)
                    autoSaveTimer.value = null
                }
                
                isSaving.value = false
                console.log('[WebSocket] 🔄 重置保存状态为false (SubmissionRecord确认)')
                console.log('[WebSocket] ✅ SubmissionRecord确认处理完成')
                return
            }
            
            // 检查是否是包含三个字段的消息（content/originalContent/teamBody）
            if (processedData && (processedData.content !== undefined || processedData.originalContent !== undefined) && processedData.teamBody) {
                console.log('[WebSocket] 🚀 检测到包含三个字段的消息：content + originalContent + teamBody')
                console.log('[WebSocket] 📝 消息内容:', {
                    hasContent: !!processedData.content,
                    hasOriginalContent: !!processedData.originalContent,
                    hasTeamBody: !!processedData.teamBody,
                    additionalFields: Object.keys(processedData).filter(key => 
                        !['content', 'originalContent', 'teamBody'].includes(key)
                    )
                })
                
                // 1. 首先处理状态指示器重置（如果当前正在保存状态）
                if (isSaving.value || autoSaveTimer.value) {
                    console.log('[WebSocket] 🔄 检测到保存状态，执行状态指示器重置')
                    
                    // 清理自动保存定时器
                    if (autoSaveTimer.value) {
                        console.log('[WebSocket] 🗑️ 清理自动保存定时器')
                        clearTimeout(autoSaveTimer.value)
                        autoSaveTimer.value = null
                    }
                    
                    isSaving.value = false
                    console.log('[WebSocket] 🔄 重置保存状态为false')
                }
                
                // 2. 然后处理实时数据更新（使用teamBody覆盖当前数据）
                console.log('[WebSocket] 🔄 开始实时数据更新流程')
                console.log('[WebSocket] 📊 新teamBody数据结构检查:', {
                    provider: processedData.teamBody.provider,
                    component_type: processedData.teamBody.component_type,
                    version: processedData.teamBody.version,
                    hasConfig: !!processedData.teamBody.config,
                    hasParticipants: !!processedData.teamBody.config?.participants
                })
                
                // 使用新的同步函数，不重置原始快照
                syncDataFromWebSocket(processedData.teamBody, 'realtime_update')
                
                console.log('[WebSocket] ✅ 三字段消息处理完成（状态重置 + 数据更新）')
                return
            }
            
            // 检查是否是仅包含部署确认字段的消息（content/originalContent但无teamBody）
            if (processedData && (processedData.content !== undefined || processedData.originalContent !== undefined) && !processedData.teamBody) {
                console.log('[WebSocket] ✅ 检测到纯部署确认消息（无teamBody）')
                console.log('[WebSocket] 📝 确认消息内容:', {
                    content: processedData.content,
                    originalContent: processedData.originalContent
                })
                
                // 清理自动保存定时器
                if (autoSaveTimer.value) {
                    console.log('[WebSocket] 🗑️ 清理自动保存定时器 (纯部署确认)')
                    clearTimeout(autoSaveTimer.value)
                    autoSaveTimer.value = null
                }
                
                isSaving.value = false
                console.log('[WebSocket] 🔄 重置保存状态为false (纯部署确认)')
                console.log('[WebSocket] ✅ 纯部署确认处理完成')
                return
            }
            
            // 检查是否是任何包含success或error字段的响应
            if (processedData && (processedData.success !== undefined || processedData.error !== undefined)) {
                console.log('[WebSocket] ✅ 检测到操作响应确认')
                console.log('[WebSocket] 📝 操作响应:', {
                    success: processedData.success,
                    error: processedData.error,
                    message: processedData.message
                })
                
                // 清理自动保存定时器
                if (autoSaveTimer.value) {
                    console.log('[WebSocket] 🗑️ 清理自动保存定时器 (操作响应确认)')
                    clearTimeout(autoSaveTimer.value)
                    autoSaveTimer.value = null
                }
                
                isSaving.value = false
                console.log('[WebSocket] 🔄 重置保存状态为false (操作响应确认)')
                if (processedData.error) {
                    console.error('[WebSocket] ❌ 后端返回错误:', processedData.error)
                }
                console.log('[WebSocket] ✅ 操作响应确认处理完成')
                return
            }
            
            console.log('[WebSocket] 🔍 检查是否包含teamBody字段:', !!processedData?.teamBody)
            // 检查是否是有效的数据获取响应
            if (!processedData || !processedData.teamBody) {
                console.log('[WebSocket] 🚫 非数据获取响应，忽略处理')
                console.log('[WebSocket] 🔍 数据结构不符合预期:')
                console.log('[WebSocket] 🔍 - processedData存在:', !!processedData)
                console.log('[WebSocket] 🔍 - teamBody存在:', !!processedData?.teamBody)
                return
            }
            
            console.log('[WebSocket] ✅ 检测到有效的数据获取响应，开始处理')
            
            // 记录外层ID和数据源选择逻辑
            let recordId = processedData.id
            let finalTeamBody = processedData.teamBody
            
            console.log('[WebSocket] � 外层数据ID:', recordId)
            console.log('[WebSocket] 🔍 检查latest字段:', !!processedData.latestSubmission)
            
            // 根据latest字段决定使用哪个数据源
            if (processedData.latestSubmission && processedData.latestSubmission.teamBody) {
                console.log('[WebSocket] 🔄 检测到latest字段，使用latest中的最新数据')
                console.log('[WebSocket] 📊 latest数据完整结构:', processedData.latest)
                
                // 使用latest中的ID和teamBody
               // recordId = processedData.latestSubmission.id
                finalTeamBody = processedData.latestSubmission.teamBody

                console.log('[WebSocket] � 使用latest中的ID:', recordId)
                console.log('[WebSocket] 📋 使用latest中的teamBody')
            } else {
                console.log('[WebSocket] 📋 latest为空或无teamBody，使用外层数据')
                console.log('[WebSocket] 📋 使用外层ID:', recordId)
                console.log('[WebSocket] 📋 使用外层teamBody')
            }
            
            console.log('[WebSocket] 🔍 最终选择的数据源:')
            console.log('[WebSocket] � - 记录ID:', recordId)
            console.log('[WebSocket] 🔍 - teamBody数据:', finalTeamBody)
            console.log('[WebSocket] � - teamBody结构检查:', {
                provider: finalTeamBody.provider,
                component_type: finalTeamBody.component_type,
                version: finalTeamBody.version,
                hasConfig: !!finalTeamBody.config,
                hasParticipants: !!finalTeamBody.config?.participants
            })
            
            // 存储当前记录ID
            currentRecordId.value = recordId
            console.log('[WebSocket] 💾 存储当前记录ID:', currentRecordId.value)
            
            // 更新团队数据 - 直接使用teamBody，因为它就是Agent_Team格式
            if (finalTeamBody) {
                console.log('[WebSocket] 🔄 开始更新团队数据流程')
                console.log('[WebSocket] 📊 团队数据结构类型:', typeof finalTeamBody)
                console.log('[WebSocket] 📊 团队数据大小:', JSON.stringify(finalTeamBody).length, '字符')
                
                // 检查是否是初始加载（撤销栈为空或只有一个初始状态）
                const isInitialLoad = undoStack.value.length <= 1
                console.log('[WebSocket] � 是否为初始加载:', isInitialLoad)
                
                if (isInitialLoad) {
                    // 初始加载时，重置所有状态
                    console.log('[WebSocket] � 初始加载，重置所有追踪状态')
                    
                    // 标记为非用户操作，避免触发变化追踪
                    console.log('[WebSocket] 🔒 设置撤销重做操作标记为true (避免触发变化追踪)')
                    isUndoRedoOperation.value = true
                    
                    try {
                        console.log('[WebSocket] 💾 开始深拷贝团队数据')
                        teamData.value = JSON.parse(JSON.stringify(finalTeamBody))
                        console.log('[WebSocket] ✅ 团队数据更新完成')
                        
                        console.log('[WebSocket] 📸 重新保存数据快照作为新基准（初始加载）')
                        // 初始加载时重新保存快照
                        saveOriginalSnapshot()
                        console.log('[WebSocket] ✅ 数据快照保存完成')
                        
                        // 同时更新previousStateSnapshot作为变化对比的基准
                        previousStateSnapshot.value = JSON.parse(JSON.stringify(teamData.value))
                        console.log('[WebSocket] 📸 更新previousStateSnapshot作为变化对比基准')
                        
                    } finally {
                        console.log('[WebSocket] 🔓 重置撤销重做操作标记为false')
                        isUndoRedoOperation.value = false
                    }
                } else {
                    // 非初始加载时，使用同步函数保持撤销历史
                    console.log('[WebSocket] 🔄 非初始加载，使用同步函数保持撤销历史')
                    syncDataFromWebSocket(finalTeamBody, 'websocket_load')
                }
                
                console.log('[WebSocket] 📊 更新后的团队数据结构:', {
                    provider: teamData.value.provider,
                    component_type: teamData.value.component_type,
                    participantsCount: teamData.value.config?.participants?.length || 0
                })
            }
            
            console.log('[WebSocket] ========消息处理完成========')
            
        } catch (error: any) {
            console.error('[WebSocket] ❌ 处理接收数据时出错:', error)
            console.error('[WebSocket] 🔍 错误详情:', error.message)
            console.error('[WebSocket] 🔍 错误堆栈:', error.stack)
            console.error('[WebSocket] 🔍 导致错误的原始数据:', rawData)
            isSaving.value = false
            console.log('[WebSocket] 🔄 因错误重置保存状态为false')
        }
    })
    
    console.log('[WebSocket] ✅ WebSocket连接设置完成')
}

// 监听applicationId和account变化，重新连接WebSocket
watch([applicationId, account], ([newId, newAccount], [oldId, oldAccount]) => {
    console.log('[WebSocket] 👂 路由参数监听器触发')
    console.log('[WebSocket] 🔍 旧applicationId:', oldId, '旧account:', oldAccount)
    console.log('[WebSocket] 🔍 新applicationId:', newId, '新account:', newAccount)
    
    // 只有当ID或account真正改变时才重新连接
    if ((newId && newId !== oldId) || (newAccount && newAccount !== oldAccount)) {
        console.log('[WebSocket] 🔄 路由参数变化，重新连接WebSocket:', newId, newAccount)
        console.log('[WebSocket] 🌐 新的WebSocket URL将是:', `wss://${MATRIX_SERVER_URL}/aagent/ws/${newId}`)
        connectWebSocket()
        console.log('[WebSocket] ✅ 重新连接请求已发送')
    } else if (newId && newAccount && !oldId && !oldAccount) {
        console.log('[WebSocket] 🔄 首次设置路由参数，建立WebSocket连接:', newId, newAccount)
        connectWebSocket()
    } else {
        console.warn('[WebSocket] ⚠️ 路由参数未变化或为空，跳过重连')
    }
}, { immediate: true })

// ==================================================================================
// WebSocket 系统结束
// ==================================================================================

// 向子组件提供数据和变化追踪函数
provide('teamData', teamData)
provide('recordChange', recordChange)
provide('getChangeStats', getChangeStats)
provide('getOperationStats', getOperationStats)
provide('originalDataSnapshot', originalDataSnapshot)
provide('resetChangeTracking', resetChangeTracking)
provide('undo', undo)
provide('redo', redo)
provide('canUndo', canUndo)
provide('canRedo', canRedo)
provide('getUndoRedoDebugInfo', getUndoRedoDebugInfo)

// 向子组件提供 WebSocket 相关功能
provide('isConnected', isConnected)
provide('isSaving', isSaving)
provide('getDataFromBackend', getDataFromBackend)
provide('deployToBackend', deployToBackend)
provide('autoSave', autoSave)

// 组件挂载时保存初始快照并绑定键盘事件
onMounted(() => {
    console.log('[Lifecycle] 🚀 组件挂载开始')
    console.log('[Lifecycle] 📸 保存初始数据快照')
    saveOriginalSnapshot()
    
    // 绑定全局键盘事件
    console.log('[Lifecycle] ⌨️ 绑定全局键盘事件监听器')
    document.addEventListener('keydown', handleKeydown)
    
    // 检查iframe状态和跨窗口通信准备
    console.log('[Agent_DIY] iframe状态检查:', {
        isInIframe: isInIframe.value,
        parentOrigin: window.location.origin,
        canSendMessage: isInIframe.value
    });
    
    if (isInIframe.value) {
        console.log('[Agent_DIY] 在iframe中运行，已准备好跨窗口通信');
        // 可选：发送初始化消息到父窗口
        sendMessageToParent('IFRAME_READY', { 
            applicationId: applicationId.value,
            account: account.value 
        });
    } else {
        console.log('[Agent_DIY] 不在iframe中运行，聊天控制功能将不可用');
    }
    
    // 显示聊天切换相关的调试信息
    console.log('[Agent_DIY] 聊天切换系统初始化信息:');
    console.log('[Agent_DIY] - 应用ID:', applicationId.value);
    console.log('[Agent_DIY] - 账户:', account.value);
    
    const user1_id = (() => {
        const talk_user1 = applicationId.value;
        const talk_user11 = talk_user1.startsWith('@RBT#') ? talk_user1 : `@RBT#${talk_user1}`;
        return talk_user11.endsWith('Bot') ? talk_user11 : `${talk_user11}Bot`;
    })();
    
    console.log('[Agent_DIY] - 机器人ID:', user1_id);
    console.log('[Agent_DIY] - 用户ID:', account.value);
    console.log('[Agent_DIY] - 初始按钮文本:', chatSwitchButtonText.value);
    
    // 不在这里初始化WebSocket，因为applicationId的watch已经处理了
    console.log('[Lifecycle] ⚠️ WebSocket连接由applicationId监听器管理，此处跳过')
    console.log('[Lifecycle] ✅ 组件挂载完成')
})

// 组件卸载时移除键盘事件监听并清理WebSocket连接
onUnmounted(() => {
    console.log('[Lifecycle] 🔄 组件卸载开始')
    
    console.log('[Lifecycle] ❌ 移除全局键盘事件监听器')
    document.removeEventListener('keydown', handleKeydown)
    
    // 清理WebSocket连接
    console.log('[Lifecycle] 🔍 检查WebSocket实例是否需要清理:', !!websocketInstance)
    if (websocketInstance) {
        console.log('[WebSocket] 🔌 组件卸载，关闭WebSocket连接')
        websocketInstance.close()
        websocketInstance = null
        console.log('[WebSocket] ✅ WebSocket连接已关闭并清理')
    }
    
    // 清理定时器
    console.log('[Lifecycle] 🔍 检查自动保存定时器是否需要清理:', !!autoSaveTimer.value)
    if (autoSaveTimer.value) {
        console.log('[Lifecycle] ⏰ 清理自动保存定时器')
        clearTimeout(autoSaveTimer.value)
        autoSaveTimer.value = null
        console.log('[Lifecycle] ✅ 自动保存定时器已清理')
    }
    
    console.log('[Lifecycle] ✅ 组件卸载完成')
})
</script>

<style scoped>
.agent-diy-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f5f5f5;
}

/* 头部样式 */
.header {
    padding: 20px 24px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #333;
    text-align: center;
}

/* 主要内容区域 */
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* 工具栏样式 */
.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1px 2px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
}

.view-switcher {
    display: flex;
    gap: 2px;
    background: #f0f0f0;
    border-radius: 8px;
    padding: 4px;
}

.view-btn {
    padding: 8px 20px;
    background: transparent;
    color: #666;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
}

.view-btn:hover {
    background: #e0e0e0;
    color: #333;
}

.view-btn.active {
    background: #409eff;
    color: white;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

/* 聊天切换按钮特殊样式 */
.view-btn.chat-switch-btn {
    
    color: black;
    position: relative;
    overflow: hidden;
}



.view-btn.chat-switch-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
}



.view-btn.chat-switch-btn:hover::before {
    left: 100%;
}

.actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

/* 撤销/重做按钮组 */
.undo-redo-group {
    display: flex;
    gap: 2px;
    background: #f0f0f0;
    border-radius: 6px;
    padding: 2px;
}

.undo-btn, .redo-btn, .debug-btn {
    padding: 6px 12px;
    background: transparent;
    color: #333;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s;
    min-width: 60px;
}

.undo-btn:hover:not(:disabled), .redo-btn:hover:not(:disabled), .debug-btn:hover {
    background: #e0e0e0;
    transform: translateY(-1px);
}

.undo-btn:disabled, .redo-btn:disabled {
    color: #ccc;
    cursor: not-allowed;
    background: transparent;
}

.undo-btn:not(:disabled) {
    background: #4caf50;
    color: white;
}

.undo-btn:not(:disabled):hover {
    background: #45a049;
}

.redo-btn:not(:disabled) {
    background: #2196f3;
    color: white;
}

.redo-btn:not(:disabled):hover {
    background: #1976d2;
}

.debug-btn {
    background: #ff9800;
    color: white;
    min-width: 50px;
}

.debug-btn:hover {
    background: #f57c00;
}

/* 变化追踪状态 */
.change-tracker-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.change-count {
    font-size: 12px;
    color: #6c757d;
    font-weight: 500;
}

.operation-count {
    font-size: 12px;
    color: #6c757d;
    font-weight: 500;
    margin-left: 8px;
}

.operation-btn {
    padding: 4px 8px;
    background: #9c27b0;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    transition: all 0.2s;
}

.operation-btn:hover {
    background: #7b1fa2;
    transform: translateY(-1px);
}

.reset-btn {
    padding: 4px 8px;
    background: #ff9800;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    transition: all 0.2s;
}

.reset-btn:hover {
    background: #f57c00;
    transform: translateY(-1px);
}

.detail-btn {
    padding: 4px 8px;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    transition: all 0.2s;
}

.detail-btn:hover {
    background: #1976d2;
    transform: translateY(-1px);
}

/* 变化详情面板 */
.change-details-panel {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin: 8px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.change-details-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
}

.change-details-header h4 {
    margin: 0;
    font-size: 14px;
    color: #333;
}

.close-details {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: #666;
    padding: 4px;
}

.close-details:hover {
    color: #333;
}

.change-details-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
}

.change-summary {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
}

.change-summary p {
    margin: 4px 0;
    font-size: 12px;
    color: #666;
}

.change-log h5 {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #333;
}

.change-item {
    margin-bottom: 8px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;
    border-left: 3px solid #409eff;
}

.change-info {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 11px;
}

.change-type {
    background: #409eff;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
    min-width: 80px;
    text-align: center;
}

/* 不同操作类型的颜色 */
.change-type[data-type="undo"] {
    background: #ff9800;
}

.change-type[data-type="redo"] {
    background: #4caf50;
}

.change-type[data-type="add_participant"],
.change-type[data-type="add_tool"] {
    background: #4caf50;
}

.change-type[data-type="remove_participant"],
.change-type[data-type="remove_tool"],
.change-type[data-type="delete_agent"] {
    background: #f44336;
}

.change-type[data-type="edit_agent"],
.change-type[data-type="edit_team"],
.change-type[data-type="json_manual_edit"] {
    background: #2196f3;
}

.change-type[data-type="data_change"] {
    background: #673ab7;
}

.change-type[data-type="realtime_update"] {
    background: #e91e63;
    animation: pulse-realtime 2s ease-in-out;
}

@keyframes pulse-realtime {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(233, 30, 99, 0.7); }
    50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(233, 30, 99, 0.2); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(233, 30, 99, 0); }
}

.change-status {
    color: #666;
    font-size: 11px;
}

.change-path {
    color: #333;
    font-weight: 500;
    flex: 1;
}

.change-time {
    color: #666;
}

/* WebSocket 状态样式 */
.websocket-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.connection-status {
    font-size: 12px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 3px;
}

.connection-status.connected {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.connection-status.disconnected {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.auto-save-status {
    font-size: 11px;
    color: #ff9800;
    font-weight: 500;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

.websocket-btn {
    padding: 4px 8px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    transition: all 0.2s;
}

.websocket-btn:hover:not(:disabled) {
    background: #218838;
    transform: translateY(-1px);
}

.websocket-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
}

.websocket-btn:nth-child(4) {
    background: #007bff;
}

.websocket-btn:nth-child(4):hover:not(:disabled) {
    background: #0056b3;
}

/* 视图容器 */
.view-container {
    flex: 1;
    overflow: hidden;
    position: relative;
}

/* 未来扩展区域 */
.future-area {
    min-height: 0; /* 预留空间，可根据需要添加样式 */
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .toolbar {
        padding: 12px 16px;
    }
    
    .view-btn {
        padding: 10px 16px;
        font-size: 13px;
    }
}

@media (max-width: 768px) {
    .header {
        padding: 16px 20px;
    }
    
    .title {
        font-size: 20px;
    }
    
    .toolbar {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
        padding: 16px 20px;
    }
    
    .view-switcher {
        justify-content: center;
        width: 100%;
    }
    
    .view-btn {
        flex: 1;
        text-align: center;
        padding: 12px 20px;
        font-size: 14px;
    }
}

@media (max-width: 480px) {
    .agent-diy-container {
        height: 100vh;
        overflow: hidden;
    }
    
    .header {
        padding: 12px 16px;
    }
    
    .title {
        font-size: 18px;
    }
    
    .toolbar {
        padding: 12px 16px;
        gap: 8px;
    }
    
    .view-switcher {
        padding: 2px;
    }
    
    .view-btn {
        padding: 10px 16px;
        font-size: 13px;
        border-radius: 4px;
    }
    
    .view-container {
        flex: 1;
        overflow: hidden;
    }
}
</style>