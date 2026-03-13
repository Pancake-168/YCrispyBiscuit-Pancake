<template>
    <div v-if="visible && active" class="userbot-options">
        <div class="userbot-options__header">
            <div class="userbot-options__title">{{ title }}</div>
            <div class="userbot-options__status" :data-status="uiState">
                <span v-if="uiState === 'idle'">可选</span>
                <span v-else-if="uiState === 'sending'">发送中...</span>
                <span v-else-if="uiState === 'sent'">已发送</span>
                <span v-else>发送失败</span>
            </div>
        </div>

        <div class="userbot-options__list">
            <button v-for="(opt, idx) in active.options" :key="`${active.id}-${idx}-${opt}`"
                class="userbot-options__item" type="button" :disabled="disabled || (uiState !== 'idle')"
                :data-selected="selectedOption === opt" @click="onSelect(opt)">
                {{ opt }}
            </button>
        </div>

        <div v-if="errorMessage" class="userbot-options__error">{{ errorMessage }}</div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { userbotWebSocketService } from '@/services/Project/UserBot/websocket'
import type {
    ResolveUserForOptionSend,
    UserbotWsOptionSendPayload,
    UserbotWsOptionsRaw,
} from '@/services/Project/UserBot/options'
import {
    buildUserbotOptionSendPayload,
    extractUserbotOptions,
    resolveUserForOptionSendTODO,
} from '@/services/Project/UserBot/options'

type UiState = 'idle' | 'sending' | 'sent' | 'error'

interface Props {
    /** 传入“最新一条 WS 入站消息”或“裸 activity payload”；组件会自动提取 options */
    message?: unknown
    /** true 时渲染（即使 message 有 options 也会受此开关影响） */
    visible?: boolean
    /** 整体禁用 */
    disabled?: boolean
    /** 标题 */
    title?: string

    /**
     * 发送实现：默认直接走 userbotWebSocketService.send(payload)
     * 也可以在接入时注入自定义 send（例如走别的通道/加埋点）。
     */
    send?: (payload: UserbotWsOptionSendPayload) => Promise<void> | void

    /**
     * user 构建钩子：入站消息可能没有 user，需要自己构建。
     * 默认是占位实现（返回 null），会导致发送失败并展示错误。
     */
    resolveUser?: ResolveUserForOptionSend
}

const props = withDefaults(defineProps<Props>(), {
    message: undefined,
    visible: true,
    disabled: false,
    title: '快捷选项',
    send: undefined,
    resolveUser: resolveUserForOptionSendTODO,
})

const active = ref<UserbotWsOptionsRaw | null>(null)
const uiState = ref<UiState>('idle')
const selectedOption = ref<string | null>(null)
const errorMessage = ref<string>('')

const sendImpl = computed(() => {
    return (
        props.send ??
        ((payload: UserbotWsOptionSendPayload) => {
            userbotWebSocketService.send(payload)
        })
    )
})

watch(
    () => props.message,
    (message) => {
        const extracted = extractUserbotOptions(message)
        if (!extracted) return

        // 同一个 id 重复推送时不重置已发送状态，避免 UI 抖动
        if (active.value?.id === extracted.id) {
            active.value = extracted
            return
        }

        active.value = extracted
        uiState.value = 'idle'
        selectedOption.value = null
        errorMessage.value = ''
    },
    { immediate: true }
)

const onSelect = async (option: string) => {
    if (!active.value) return
    if (props.disabled) return
    if (uiState.value !== 'idle') return

    selectedOption.value = option
    uiState.value = 'sending'
    errorMessage.value = ''

    try {
        const payload = await buildUserbotOptionSendPayload({
            source: active.value,
            option,
            resolveUser: props.resolveUser,
        })
        console.log("[System:UserbotWsOptions:onSelect] 发送选项 payload:", payload)

        await sendImpl.value(payload)
        uiState.value = 'sent'
    } catch (err: any) {
        uiState.value = 'error'
        errorMessage.value = err?.message || '发送失败'
    }
}
</script>

<style scoped>
.userbot-options {
    background: var(--glass-bg);
    border: var(--glass-border);
    border-radius: var(--radius-md);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    padding: var(--space-sm);
}

.userbot-options__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
}

.userbot-options__title {
    font-size: var(--font-xs);
    font-weight: 600;
    color: var(--text-color);
}

.userbot-options__status {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.userbot-options__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
}

.userbot-options__item {
    border: var(--glass-border);
    background: var(--panel-bg);
    color: var(--text-color);
    border-radius: var(--radius-sm);
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-xs);
    cursor: pointer;
}

.userbot-options__item[data-selected='true'] {
    border-color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 16%, transparent);
}

.userbot-options__item:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.userbot-options__error {
    margin-top: var(--space-sm);
    font-size: var(--font-xs);
    color: var(--danger-color);
}
</style>
