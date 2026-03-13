<template>
    <Teleport to="body">
        <Transition name="menu-fade">
            <div 
                v-if="show" 
                class="task-menu-overlay" 
                @click="handleClose"
                @contextmenu.prevent
            >
                <div 
                    class="task-menu-content" 
                    :style="menuStyle"
                    @click.stop
                >
                    <div class="menu-item" @click="handleRedo" :class="{ disabled: isProcessing }">
                        <svg class="menu-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13 8a5 5 0 1 1-1.464-3.536L10 6h4V2l-1.5 1.5A7 7 0 1 0 15 8h-2z" 
                                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span class="menu-text">{{ isProcessing ? '重做中...' : '重做' }}</span>
                    </div>
                    
                    <div class="menu-item disabled">
                        <svg class="menu-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 2v6l4 4M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0z" 
                                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span class="menu-text">提炼</span>
                        <span class="menu-badge">敬请期待</span>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RedoTask } from '@/services/Project/Task/task'
import { openMessageDialog } from '@/components/MessageDialog/open';
// Props
const props = defineProps<{
    show: boolean
    position: { x: number; y: number }
    taskData: any | null
}>()

// Emits
const emit = defineEmits<{
    'update:show': [value: boolean]
    'redo-success': [data: { room_id: string }]
    'redo-error': [error: any]
}>()

// 响应式数据
const isProcessing = ref(false)

// 计算菜单位置样式
const menuStyle = computed(() => {
    const { x, y } = props.position
    
    // 确保菜单不超出视口
    const menuWidth = 200
    const menuHeight = 100
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let left = x
    let top = y
    
    // 如果右侧空间不足，显示在左侧
    if (x + menuWidth > viewportWidth) {
        left = x - menuWidth
    }
    
    // 如果下方空间不足，显示在上方
    if (y + menuHeight > viewportHeight) {
        top = y - menuHeight
    }
    
    return {
        left: `${left}px`,
        top: `${top}px`
    }
})

// 方法
const handleClose = () => {
    if (isProcessing.value) return
    emit('update:show', false)
}

const handleRedo = async () => {
    if (isProcessing.value || !props.taskData?.session_id) {
        console.warn('[TaskFunctionsList] 无法重做：正在处理中或缺少 session_id')
        return
    }
    
    isProcessing.value = true
    
    try {
        console.log('[TaskFunctionsList]  开始重做任务, session_id:', props.taskData.session_id)
        
        const result = await RedoTask(props.taskData.session_id)
        
        console.log('[TaskFunctionsList]  任务重做成功:', result)
        
        if (!result?.room_id) {
            throw new Error('后端未返回 room_id')
        }
        
        emit('redo-success', { room_id: result.room_id })
        handleClose()
        
    } catch (error) {
        console.error('[TaskFunctionsList]  任务重做失败:', error)
        emit('redo-error', error)
        openMessageDialog(`任务重做失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
        isProcessing.value = false
    }
}
</script>

<style scoped lang="scss">
.task-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3000;
    background: transparent;
}

.task-menu-content {
    position: fixed;
    background: var(--bg-color-tertiary, #ffffff);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1);
    padding: 4px;
    min-width: 160px;
    z-index: 3001;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-color, #1f2937);
    font-size: 14px;
    user-select: none;
    
    &:hover:not(.disabled) {
        background: var(--bg-color-secondary, #f3f4f6);
    }
    
    &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        
        .menu-text {
            color: var(--text-color-secondary, #9ca3af);
        }
    }
}

.menu-icon {
    flex-shrink: 0;
    color: var(--text-color-secondary, #6b7280);
}

.menu-text {
    flex: 1;
    font-weight: 500;
}

.menu-badge {
    font-size: 11px;
    padding: 2px 6px;
    background: var(--bg-color-hover, #e5e7eb);
    border-radius: 4px;
    color: var(--text-color-secondary, #6b7280);
}

// 过渡动画
.menu-fade-enter-active,
.menu-fade-leave-active {
    transition: opacity 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
    opacity: 0;
}

.menu-fade-enter-active .task-menu-content,
.menu-fade-leave-active .task-menu-content {
    transition: transform 0.15s ease, opacity 0.15s ease;
}

.menu-fade-enter-from .task-menu-content,
.menu-fade-leave-to .task-menu-content {
    transform: scale(0.95);
    opacity: 0;
}
</style>
