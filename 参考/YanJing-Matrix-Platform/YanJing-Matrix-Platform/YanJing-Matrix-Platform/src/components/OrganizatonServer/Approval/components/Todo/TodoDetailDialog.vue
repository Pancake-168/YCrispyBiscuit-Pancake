<template>
    <div class="todo-detail-modal yj-dialog-mask" @click.self="$emit('close')">
        <div class="modal-content yj-dialog-content">
            <div class="modal-header">
                <h5>审批详情</h5>
                <button class="close-btn" @click="$emit('close')">×</button>
            </div>

            <div class="modal-body">
                <div v-if="loadingTemplate" class="loading-state">
                    加载模板数据中...
                </div>
                <template v-else>
                    <div class="info-group">
                        <div class="info-row">
                            <label>提交人：</label>
                            <span>{{ displaySubmitter }}</span>
                        </div>
                        <div class="info-row">
                            <label>提交时间：</label>
                            <span>{{ displayTime }}</span>
                        </div>
                        <!--div class="info-row">
                            <label>当前节点：</label>
                            <span class="highlight">{{ todo.currentNode.node_order }} - {{
                                todo.currentNode.approver_type }} ({{ todo.currentNode.approver_role }})</span>
                        </div-->
                    </div>

                    <!-- 动态表单渲染（只读） -->
                    <div class="form-preview" v-if="template">
                        <div class="form-title">
                            {{ template.template.name }} v{{ template.template.version }}
                        </div>
                        

                        <div class="dynamic-fields">
                            <div v-for="field in (template.template.ui_config?.fields || [])" :key="field.id"
                                class="field-item">
                                <div class="field-label">{{ field.label || field.id }}</div>
                                <div class="field-value">
                                    {{ renderFieldValue(field, parsedDataJson?.[field.id]) }}
                                </div>
                            </div>
                            <div v-if="!(template.template.ui_config?.fields?.length)" class="no-fields">
                                该模板未定义显示字段
                            </div>
                        </div>
                    </div>
                </template>

                <!-- 审批操作区域 -->
                <div class="action-section" v-if="!readonly">
                    <textarea v-model="comment" class="input comment-input" placeholder="请输入审批意见（通过时可选，驳回时建议填写）"
                        rows="3"></textarea>

                    <div class="error-msg" v-if="error">{{ error }}</div>

                    <div class="btn-group">
                        <button class="action-btn danger" @click="handleAction('reject')" :disabled="submitting">
                            {{ submitting ? '处理中...' : '驳回' }}
                        </button>
                        <button class="action-btn primary" @click="handleAction('approve')" :disabled="submitting">
                            {{ submitting ? '处理中...' : '通过' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ApprovalTemplateDetail } from '@/services/Project/Approval/data'
import { GetIMUserInfo } from '@/services/Project/SSO/UserInfo'
import type { ApprovalTodo, ApprovalTemplateActiveResult, ApprovalUiConfigField } from '@/types/approval'

const props = defineProps<{
    todo: ApprovalTodo
    readonly?: boolean
}>()

const readonly = computed(() => !!props.readonly)

const parsedDataJson = computed(() => {
    // 兼容处理：可能叫 dataJson 或 data_json
    // 也可能因为后端返回 JSON 字符串而非对象，尝试在此处解析
    const raw = props.todo.dataJson || (props.todo as any).data_json
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw)
        } catch (e) {
            console.error('Failed to parse dataJson string:', e)
            return {}
        }
    }
    return raw || {}
})

const submitterNickname = ref('')

const displaySubmitter = computed(() => {
    const username = (props.todo as any).submitter_name || props.todo.submitter || (props.todo as any).submitterName || '未知'
    // 如果获取到了昵称，优先显示昵称，Username作为补充信息显示在括号里，或者只显示昵称
    // 根据用户需求“可以直接显示昵称”，这里我们主要突显昵称
    if (submitterNickname.value) {
        return `${submitterNickname.value} (${username})`
    }
    return username
})

const displayTime = computed(() => {
    // 优先使用 currentNode.createdAt，因为根对象可能没有时间
    // 后端返回的实例数据可能没有 createdAt，但 currentNode 一定有
    const val = props.todo.currentNode?.createdAt || props.todo.createdAt || (props.todo as any).created_at
    return val ? new Date(val).toLocaleString() : '未知'
})

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'action-completed'): void
    (e: 'submit-action', payload: { action: 'approve' | 'reject', comment: string }): void
}>()

const loadingTemplate = ref(false)
const template = ref<ApprovalTemplateActiveResult | null>(null)
const comment = ref('')
const submitting = ref(false)
const error = ref('')

// 获取模板详情以渲染字段标签
async function loadTemplateDetail() {
    const templateId = Number(props.todo.templateId || props.todo.currentNode?.f_o4gcgk6wnek || 0)
    if (!templateId) return

    loadingTemplate.value = true
    try {
        const res = await ApprovalTemplateDetail(templateId)
        template.value = res
    } catch (e) {
        console.error(e)
        error.value = '加载模板失败，无法显示详细信息'
    } finally {
        loadingTemplate.value = false
    }
}

function renderFieldValue(_field: ApprovalUiConfigField, value: unknown) {
    if (value === null || value === undefined || value === '') {
        return '-'
    }
    // 未来可以在这里扩展更多类型的渲染逻辑，如日期、人员选择等
    return String(value)
}

function handleAction(action: 'approve' | 'reject') {
    if (submitting.value) return

    // 简单的校验，如果驳回建议填写意见
    if (action === 'reject' && !comment.value.trim()) {
        // check if comment is required
    }

    emit('submit-action', { action, comment: comment.value })
}

async function loadSubmitterNickname() {
    // 获取用户名
    const username = (props.todo as any).submitter_name || props.todo.submitter || (props.todo as any).submitterName
    if (!username || username === '未知') return

    try {
        const { ok, data } = await GetIMUserInfo(username)
        if (ok && data?.nickname) {
            submitterNickname.value = data.nickname
        }
    } catch (e) {
        console.warn('[System:Approval:TodoDetail] 获取提交人昵称失败', e)
    }
}

onMounted(() => {
    // Debug output to help verify data structure
    console.log('[System:Approval:TodoDetail] Mounted with props.todo:', props.todo)
    console.log('[System:Approval:TodoDetail] Parsed dataJson:', parsedDataJson.value)
    loadTemplateDetail()
    loadSubmitterNickname()
})
</script>

<style scoped>
.todo-detail-modal {
    position: fixed;
    inset: 0;
    z-index: 12000;
    background: color-mix(in srgb, var(--bg-color) 88%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
    backdrop-filter: blur(2px);
}

.modal-content {
    background: var(--panel-bg);
    width: 100%;
    max-width: 560px;
    border-radius: var(--radius-md);
    box-shadow: 0 20px 48px color-mix(in srgb, var(--bg-color) 72%, transparent);
    display: flex;
    flex-direction: column;
    max-height: 86vh;
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
 
}

.modal-header h5 {
    margin: 0;
    font-size: var(--font-md);
}

.close-btn {
    background: transparent;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--text-muted);
    line-height: 1;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
}

.close-btn:hover {
    background: var(--hover-bg);
    color: var(--text-color);
}

.modal-body {
    padding: var(--space-md);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.info-group {
    background: color-mix(in srgb, var(--bg-color) 70%, var(--panel-bg));
    padding: var(--space-md);
    border-radius: var(--radius-sm);
    font-size: var(--font-sm);
   
}

.info-row {
    display: flex;
    margin-bottom: 4px;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-row label {
    color: var(--text-muted);
    width: 80px;
    flex-shrink: 0;
}

.highlight {
    color: var(--primary-color);
    font-weight: 500;
}

.form-preview {
   
    border-radius: var(--radius-sm);
    padding: var(--space-md);
    background: color-mix(in srgb, var(--bg-color) 78%, var(--panel-bg));
}

.form-title {
    font-weight: 600;
    font-size: var(--font-sm);
    margin-bottom: var(--space-sm);
    padding-bottom: var(--space-xs);
   
}

.dynamic-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.field-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.field-label {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.field-value {
    font-size: var(--font-sm);
    padding: 6px 10px;
    background: var(--input-bg);
    border-radius: 4px;
    min-height: 28px;
    display: flex;
    align-items: center;
   
}

.no-fields {
    color: var(--text-muted);
    font-size: var(--font-xs);
    text-align: center;
    padding: 10px;
}

.action-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  
    padding-top: var(--space-md);
}

.comment-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    background: var(--input-bg);
    color: var(--text-color);
    font-size: var(--font-sm);
    resize: vertical;
}

.comment-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 24%, transparent);
}

.btn-group {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
}

.action-btn {
    min-width: 88px;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    cursor: pointer;
    font-size: var(--font-sm);
}

.action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.action-btn.danger {
    background: color-mix(in srgb, var(--danger-color) 10%, transparent);
    color: var(--danger-color);
    border-color: color-mix(in srgb, var(--danger-color) 20%, transparent);
}

.action-btn.danger:hover:not(:disabled) {
    background: color-mix(in srgb, var(--danger-color) 20%, transparent);
}

.action-btn.primary {
    background: var(--primary-color);
    color: var(--btn-text);
    border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
}

.action-btn.primary:hover:not(:disabled) {
    background: var(--primary-hover);
}

.error-msg {
    color: var(--danger-color);
    font-size: var(--font-xs);
}

@media (max-width: 900px) {
    .modal-content {
        max-height: 92vh;
    }

    .modal-header,
    .modal-body {
        padding: var(--space-sm);
    }

    .btn-group {
        width: 100%;
    }

    .action-btn {
        flex: 1;
    }
}
</style>
