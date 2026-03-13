<template>
    <div class="secretary">
        <div class="secretary__header">
            <!--div class="secretary__title">秘书</div-->
            <div class="secretary__status" :data-status="status">
                <span v-if="status === 'connected'">已连接</span>
                <span v-else-if="status === 'connecting'">连接中...</span>
                <span v-else-if="status === 'error'">连接失败</span>
                <span v-else>未连接</span>
            </div>
        </div>

        <div v-if="!wsUrl" class="secretary__hint">
            未配置秘书 WebSocket 地址
        </div>

        <!-- 流式工作建议：像聊天一样保留每一轮的记录 -->
        <div class="secretary__stream" aria-label="Streaming suggestion">
            <div class="secretary__stream-title">回复建议</div>
            <div class="secretary__stream-body">
                <div v-if="streamEntries.length === 0" class="secretary__empty">暂无建议</div>

                <div v-for="entry in streamEntries" :key="entry.id" class="secretary__entry">
                    <div class="secretary__entry-text">
                        <span>{{ entry.text || '...' }}</span>
                        <span v-if="entry.status === 'streaming'" class="secretary__entry-badge">(生成中)</span>
                    </div>

                    <div v-if="entry.choiceStatus === 'chosen'" class="secretary__entry-choice">
                        {{ entry.choiceText || '已选择' }}
                    </div>

                    <UserbotWsOptions
                        v-else-if="entry.choiceStatus === 'pending'"
                        :message="entry.optionsMessage"
                        :visible="true"
                        :disabled="status !== 'connected'"
                        title="发送"
                        :send="(payload) => handleOptionSend(entry, payload)"
                        :resolve-user="resolveUserForSecretaryOptionSendTODO"
                    />

                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import UserbotWsOptions from '@/components/UserbotWsOptions'
import type { ResolveUserForOptionSend, UserbotWsOptionSendPayload } from '@/services/Project/UserBot/options'
import { extractUserbotOptions } from '@/services/Project/UserBot/options'
import { useWechatStore } from "@/stores/WeChat";
import { useIDmapStore } from '@/stores/IDmap';
import { useUserBotStore } from '@/stores/UserBot';
import {VITE_API_WSS_BASE}from '@/apiUrls'

const wechatStore = useWechatStore();
const username = computed(() => wechatStore.userProfile?.username);
const userIDmap = useIDmapStore();
const matrixUser = computed(() => {
    const u = username.value
    return u ? userIDmap.getByUsername(u) : undefined
});

const userBotStore = useUserBotStore();


type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

const wsUrl = computed(() => {
    const username = (userBotStore.userBot as { username?: string } | null | undefined)?.username
    if (!username) return ''
    return `${VITE_API_WSS_BASE}/api/v2/ws/shayu/${username}`
})

const status = ref<WsStatus>('disconnected')
const lastError = ref<string>('')
const wsRef = ref<WebSocket | null>(null)
type StreamEntry = {
    id: string
    text: string
    status: 'streaming' | 'done'
    optionsKind: 'real' | 'fake' | null
    baseMeta: { agent: string; room: string; user?: string } | null
    optionsMeta: { agent: string; room: string; user?: string; options: string[] } | null
    optionsMessage: unknown | null
    choiceStatus: 'pending' | 'chosen' | 'hidden' | null
    choiceText: string
}

const streamEntries = ref<StreamEntry[]>([])
const entryIndexById = new Map<string, number>()

const hidePendingOptions = (exceptId?: string) => {
    streamEntries.value.forEach((entry) => {
        if (entry.id !== exceptId && entry.choiceStatus === 'pending') {
            entry.choiceStatus = 'hidden'
        }
    })
}

const getOrCreateEntry = (id: string): StreamEntry => {
    const idx = entryIndexById.get(id)
    if (typeof idx === 'number') {
        const existing = streamEntries.value[idx]
        if (existing) return existing
    }

    const entry: StreamEntry = {
        id,
        text: '',
        status: 'streaming',
        optionsKind: null,
        baseMeta: null,
        optionsMeta: null,
        optionsMessage: null,
        choiceStatus: null,
        choiceText: '',
    }
    streamEntries.value.push(entry)
    entryIndexById.set(id, streamEntries.value.length - 1)
    return entry
}

const resolveUserForSecretaryOptionSendTODO: ResolveUserForOptionSend = async () => {
    return matrixUser.value?.matrixId ?? null
}

const setChatInputText = (text: string) => {
    window.dispatchEvent(new CustomEvent('matrix:set-chat-input-text', { detail: { text } }))
}

const connect = () => {
    const url = wsUrl.value
    if (!url) return

    if (wsRef.value && (wsRef.value.readyState === WebSocket.OPEN || wsRef.value.readyState === WebSocket.CONNECTING)) {
        return
    }

    status.value = 'connecting'
    lastError.value = ''

    const ws = new WebSocket(url)
    wsRef.value = ws

    ws.onopen = () => {
        status.value = 'connected'
    }

    ws.onmessage = (event) => {
        const rawText = event.data
        let parsed: unknown = rawText
        if (typeof rawText === 'string') {
            try {
                parsed = JSON.parse(rawText)
            } catch {
                parsed = rawText
            }
        }

        // ===== 流式（像聊天一样） =====
        // 后端：appending(activity) 每个分片都带 options，但我们要：
        // 1) 按 content.id 串联 content.content，并保留每一轮的历史记录
        // 2) options 只在对应 finish(event_id) 后出现一次（显示在该条记录下方）
        const msg = parsed as any

        if (msg?.state === 'appending' && msg?.content_type === 'activity' && msg?.content) {
            const id = msg?.content?.id
            const chunk = msg?.content?.content
            if (typeof id === 'string' && typeof chunk === 'string') {
                const entry = getOrCreateEntry(id)
                entry.status = 'streaming'
                entry.text += chunk

                // 即使这一轮没有 options，也要把 agent/room/user 记下来，供 finish 后伪造 options 使用
                const agent = msg?.content?.agent
                const room = msg?.content?.room
                const user = msg?.content?.user
                if (typeof agent === 'string' && typeof room === 'string') {
                    entry.baseMeta = {
                        agent,
                        room,
                        user: typeof user === 'string' ? user : undefined,
                    }
                }

                // 把 options/meta 暂存起来，等 finish 再一次性放出
                const extracted = extractUserbotOptions(msg)
                if (extracted && extracted.id === id) {
                    entry.optionsMeta = {
                        agent: extracted.agent,
                        room: extracted.room,
                        user: extracted.user,
                        options: extracted.options,
                    }
                }
            }

            return
        }

        if (msg?.state === 'finish') {
            const eventId = msg?.event_id
            if (typeof eventId === 'string' && eventId) {
                const idx = entryIndexById.get(eventId)
                if (typeof idx === 'number') {
                    const entry = streamEntries.value[idx]
                    if (!entry) return
                    entry.status = 'done'
                    const meta = entry.optionsMeta
                    if (meta?.options?.length) {
                        entry.optionsKind = 'real'
                        entry.choiceStatus = 'pending'
                        entry.choiceText = ''
                        hidePendingOptions(entry.id)
                        // 用“裸 options payload”喂给 UserbotWsOptions（只触发一次）
                        entry.optionsMessage = {
                            id: entry.id,
                            options: meta.options,
                            agent: meta.agent,
                            room: meta.room,
                            user: meta.user,
                        }
                    } else {
                        // 某些轮次后端不再带 options，需要前端伪造第一类选项：“发送 / 不发送”
                        const base = entry.baseMeta
                        if (base?.agent && base?.room) {
                            entry.optionsKind = 'fake'
                            entry.choiceStatus = 'pending'
                            entry.choiceText = ''
                            hidePendingOptions(entry.id)
                            entry.optionsMessage = {
                                id: entry.id,
                                options: ['发送', '修改','放弃'],
                                agent: base.agent,
                                room: base.room,
                                user: base.user,
                            }
                        }
                    }
                }
            }
            return
        }

        // 其它消息：不触发 options 组件刷新
    }

    ws.onerror = () => {
        status.value = 'error'
        lastError.value = 'WebSocket error'
    }

    ws.onclose = () => {
        wsRef.value = null
        if (status.value !== 'error') status.value = 'disconnected'
    }
}

const disconnect = () => {
    const ws = wsRef.value
    wsRef.value = null
    if (ws) {
        try {
            ws.close()
        } catch {
            // ignore
        }
    }
    status.value = 'disconnected'
}

const sendViaSecretaryWs = async (payload: UserbotWsOptionSendPayload) => {
    const ws = wsRef.value
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error('秘书 WebSocket 未连接')
    }
    ws.send(JSON.stringify(payload).toString())
}

const handleOptionSend = async (entry: StreamEntry, payload: UserbotWsOptionSendPayload) => {
    const sendFn = entry.optionsKind === 'fake' ? sendFakeOption : sendViaSecretaryWs
    await sendFn(payload)

    const opt = payload.options?.[0]
    entry.choiceStatus = 'chosen'
    entry.choiceText = opt ? `已选择：${opt}` : '已选择'
}

// 伪造选项的点击：先不发给后端，行为由后续定义
const sendFakeOption = async (payload: UserbotWsOptionSendPayload) => {
    const opt = payload.options?.[0]
    if (opt === '发送') {
        const idx = entryIndexById.get(payload.id)
        if (typeof idx === 'number') {
            const entry = streamEntries.value[idx]
            if (!entry) return
            const meta = entry.optionsMeta || entry.baseMeta
            if (meta?.agent && meta?.room) {
                await sendViaSecretaryWs({
                    id: entry.id,
                    options: [],
                    agent: meta.agent,
                    room: meta.room,
                    user: meta.user ?? '',
                })
            }
        }
        return
    }
    if (opt === '放弃') {
        // 不发送：不做任何动作；UserbotWsOptions 会把 UI 置为已完成并禁用再次点击
        return
    }
    if (opt === '修改') {
        const idx = entryIndexById.get(payload.id)
        if (typeof idx === 'number') {
            const entry = streamEntries.value[idx]
            if (!entry) return
            setChatInputText(entry.text)
        }
        return
    }
}

onMounted(() => {
    connect()
})

watch(
    () => wsUrl.value,
    (url) => {
        if (url) {
            connect()
        } else {
            disconnect()
        }
    }
)

onUnmounted(() => {
    disconnect()
})
</script>

<style scoped>
.secretary {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.secretary__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
}

.secretary__title {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-color);
}

.secretary__status {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.secretary__hint {
    font-size: var(--font-xs);
    color: var(--text-muted);
    border-radius: var(--radius-sm);
    border: var(--glass-border);
    background: var(--glass-bg);
    padding: var(--space-sm);
}

.secretary__stream {
    border-radius: var(--radius-md);
    border: var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    padding: var(--space-sm);
    box-sizing: border-box;
}

.secretary__stream-title {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: var(--space-xs);
}

.secretary__stream-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.secretary__entry {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.secretary__entry-text {
    font-size: var(--font-xs);
    color: var(--text-color);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
}

.secretary__entry-choice {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.secretary__entry-badge {
    margin-left: var(--space-xs);
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.secretary__stream-body {
    font-size: var(--font-xs);
    color: var(--text-color);
    white-space: pre-wrap;
    word-break: break-word;
}

.secretary__feed {
    flex: 1;
    min-height: 0;
    overflow: auto;

    background: var(--panel-bg);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    box-sizing: border-box;
}

.secretary__empty {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.secretary__item {
    border: var(--glass-border);
    background: var(--glass-bg);
    border-radius: var(--radius-sm);
    padding: var(--space-sm);
    margin-bottom: var(--space-sm);
}

.secretary__item-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    font-size: var(--font-xs);
    color: var(--text-muted);
    margin-bottom: var(--space-xs);
}

.secretary__item-body {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: var(--font-xs);
    color: var(--text-color);
}
</style>
