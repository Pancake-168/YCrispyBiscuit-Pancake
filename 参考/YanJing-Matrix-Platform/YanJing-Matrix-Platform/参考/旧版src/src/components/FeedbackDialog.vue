<template>
    <!-- 问题反馈弹窗 -->
    <Teleport to="body">
        <div v-if="visible" class="feedback-overlay" @click.self="close">
            <div class="feedback-dialog" :style="dialogStyle">
                <div class="feedback-options">
                    <button class="feedback-option" @click="openBugReport">
                        <div class="option-content">
                            <div class="option-title">反馈问题</div>
                        </div>
                    </button>
                    <button class="feedback-option" @click="openSuggestion">
                        <div class="option-content">
                            <div class="option-title">改进意见</div>

                        </div>
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

interface Props {
    visible: boolean
    triggerRect?: DOMRect
}

const props = withDefaults(defineProps<Props>(), {
    visible: false,
    triggerRect: undefined
})

const emit = defineEmits<{
    close: []
    'open-bug-report': []
    'open-suggestion': []
}>()

// 计算弹窗样式
const dialogStyle = computed(() => {
    if (!props.triggerRect) return {}

    const rect = props.triggerRect
    const isMobile = window.innerWidth < 768

    if (isMobile) {
        // 移动端：显示在按钮下方，居中对齐
        return {
            position: 'fixed' as const,
            top: `${Math.min(rect.bottom + 8, window.innerHeight - 120)}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '9999'
        }
    } else {
        // 桌面端：显示在按钮右侧
        const left = Math.min(rect.right + 8, window.innerWidth - 200)
        return {
            position: 'fixed' as const,
            top: `${Math.max(rect.top - 20, 8)}px`,
            left: `${left}px`,
            zIndex: '9999'
        }
    }
})

// 关闭弹窗
const close = () => {
    emit('close')
}

// 打开Bug反馈
const openBugReport = () => {
    emit('open-bug-report')
    close()
}

// 打开功能建议
const openSuggestion = () => {
    emit('open-suggestion')
    close()
}

// 监听ESC键关闭弹窗
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.visible) {
        close()
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.feedback-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    z-index: 9998;
    pointer-events: auto;
}

.feedback-dialog {
    background: var(--bg-color-secondary);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-color);
    min-width: 200px;
    max-width: 200px;
    overflow: hidden;
    pointer-events: auto;
}

.feedback-options {
    display: flex;
    flex-direction: column;
}

.feedback-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
    text-align: left;
    width: 100%;
    border-bottom: 1px solid var(--border-color);
}

.feedback-option:last-child {
    border-bottom: none;
}

.feedback-option:hover {
    background: var(--bg-color-third);
}

.option-icon {
    font-size: 24px;
    flex-shrink: 0;
}

.option-content {
    flex: 1;
    min-width: 0;
}

.option-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 4px;
}

.option-description {
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    line-height: 1.4;
}

/* 移动端样式 */
@media (max-width: 768px) {
    .feedback-dialog {
        min-width: 220px;
        max-width: 85vw;
    }

    .feedback-option {
        padding: 14px;
        gap: 10px;
    }

    .option-icon {
        font-size: 20px;
    }

    .option-title {
        font-size: var(--font-size-sm);
    }

    .option-description {
        font-size: var(--font-size-xs);
    }
}
</style>
