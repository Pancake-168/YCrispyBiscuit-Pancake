<template>
    <div class="todo-list-container">
        <div class="panel-header-row">
            <h4>我的待办</h4>
            <button class="action-btn" @click="loadAll" :disabled="store.loading.todos || store.loading.mySubmissions">
                {{ (store.loading.todos || store.loading.mySubmissions) ? '加载中...' : '刷新列表' }}
            </button>
        </div>

        <div v-if="!store.todos.length" class="empty-text">暂无待办</div>

        <div class="todo-list" v-else>
            <div class="todo-item" v-for="todo in store.todos" :key="todo.instanceId" @click="selectedTodo = todo">
                <div class="todo-main">
                    <div class="todo-title">{{ getDisplayTitle(todo) }}</div>
                   
                </div>
                <div class="todo-arrow">
                    <span class="arrow-icon">›</span>
                </div>
            </div>
        </div>

        <div class="section-divider"></div>

        <div class="panel-header-row sub">
            <h4>我的全部审批</h4>
        </div>

        <div v-if="!store.mySubmissions.length" class="empty-text">暂无审批记录</div>

        <div class="todo-list all-list" v-else>
            <div class="todo-item all-item" v-for="item in store.mySubmissions" :key="item.instanceId"
                @click="openSubmissionDetail(item)">
                <div class="todo-main">
                    <div class="todo-title">{{ getSubmissionTitle(item) }}</div>
                    <div class="todo-meta">{{ getSubmissionDate(item) }}</div>
                </div>
                <div class="status-tag" :class="getStatusClass(item.status || item.formData?.status)">
                    {{ getStatusText(item.status || item.formData?.status) }}
                </div>
            </div>
        </div>

        <!-- 详情弹窗 -->
        <TodoDetailDialog v-if="selectedTodo" :todo="selectedTodo"
            @close="selectedTodo = null" @submit-action="handleAction" />

        <!-- 全部审批详情（复用同一弹窗渲染链路，只读） -->
        <TodoDetailDialog
            v-if="selectedSubmissionTodo"
            :todo="selectedSubmissionTodo"
            :readonly="true"
            @close="selectedSubmission = null"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ApprovalTemplateDetail } from '@/services/Project/Approval/data'
import { useApprovalStore } from '@/stores/approval'
import TodoDetailDialog from './TodoDetailDialog.vue'
import type { ApprovalMySubmission, ApprovalTodo } from '@/types/approval'

const store = useApprovalStore()
const selectedTodo = ref<ApprovalTodo | null>(null)
const selectedSubmission = ref<ApprovalMySubmission | null>(null)
const templateNameMap = ref<Record<number, string>>({})

const selectedSubmissionTodo = computed<ApprovalTodo | null>(() => {
    const item = selectedSubmission.value
    if (!item) return null

    return {
        instanceId: item.instanceId,
        templateId: Number((item.instance as any)?.f_mo0sgat484w || 0),
        currentNode: {
            id: Number((item.instance as any)?.f_1915g8693pj || 0),
            node_order: 0,
            approver_type: 'position',
            approver_role: '',
            required: false,
            createdAt: item.instance?.createdAt || item.formData?.createdAt || '',
            updatedAt: item.instance?.updatedAt || item.formData?.updatedAt || '',
            f_o4gcgk6wnek: Number((item.instance as any)?.f_mo0sgat484w || 0),
            createdById: Number(item.instance?.createdById || 0),
            updatedById: Number(item.instance?.updatedById || 0),
        } as any,
        submitter: item.formData?.f_1e4owcjhjmp || '',
        submitter_name: item.formData?.f_1e4owcjhjmp || '',
        createdAt: item.formData?.createdAt || '',
        status: item.status || item.formData?.status,
        dataJson: item.formData?.data_json || {},
    } as ApprovalTodo
})

async function loadAll() {
    await Promise.all([
        store.loadTodos(),
        store.loadMySubmissions(),
    ])

    await preloadSubmissionTemplateNames()
}

function getSubmissionTemplateId(item: ApprovalMySubmission) {
    return Number((item.instance as any)?.f_mo0sgat484w || 0)
}

async function preloadSubmissionTemplateNames() {
    const templateIds = Array.from(new Set(
        (store.mySubmissions || [])
            .map((item) => getSubmissionTemplateId(item))
            .filter((id) => !!id)
    ))

    const toLoad = templateIds.filter((id) => !templateNameMap.value[id])
    if (!toLoad.length) return

    await Promise.all(
        toLoad.map(async (templateId) => {
            try {
                const detail = await ApprovalTemplateDetail(templateId)
                if (detail?.template?.name) {
                    templateNameMap.value[templateId] = detail.template.name
                }
            } catch {
                // ignore single template load failure
            }
        })
    )
}

function openSubmissionDetail(item: ApprovalMySubmission) {
    selectedSubmission.value = item
}

async function handleAction(payload: { action: 'approve' | 'reject', comment: string }) {
    if (!selectedTodo.value) return

    const res = await store.actionApproval({
        instanceId: selectedTodo.value.instanceId,
        action: payload.action,
        comment: payload.comment
    })

    // actionApproval already removes the item from the list on success
    if (res.ok) {
        selectedTodo.value = null // 关闭弹窗
        // await loadTodos() // 可选：重新加载以确保同步
    }
}

function getDisplayTitle(todo: ApprovalTodo) {
    const name = (todo as any).submitter_name || todo.submitter || (todo as any).submitterName || '未知用户'
    return `${name} 的审批申请`
}

function getSubmissionTitle(item: ApprovalMySubmission) {
    const templateId = getSubmissionTemplateId(item)
    return templateNameMap.value[templateId] || item.formData?.f_wtyroydwvm5 || '未知'
}

function getSubmissionDate(item: ApprovalMySubmission) {
    return item.formData?.createdAt ? new Date(item.formData.createdAt).toLocaleString() : '-'
}

function getStatusText(status?: string) {
    switch (status) {
        case 'in_progress':
            return '进行中'
        case 'approved':
            return '已通过'
        case 'rejected':
            return '已拒绝'
        default:
            return status || '未知'
    }
}

function getStatusClass(status?: string) {
    switch (status) {
        case 'in_progress':
            return 'in-progress'
        case 'approved':
            return 'approved'
        case 'rejected':
            return 'rejected'
        default:
            return 'unknown'
    }
}

onMounted(() => {
    loadAll()
})
</script>

<style scoped>
.todo-list-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    height: 100%;
    min-height: 0;
    border: var(--glass-border);
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    padding: var(--space-md);
}

.panel-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
}

.panel-header-row h4 {
    margin: 0;
    font-size: var(--font-base);
}

.action-btn {
    border: 1px solid color-mix(in srgb, var(--text-color) 18%, transparent);
    background: var(--input-bg);
    color: var(--text-color);
    border-radius: var(--radius-sm);
    padding: var(--space-xs) var(--space-md);
    cursor: pointer;
    font-size: var(--font-sm);
}

.action-btn:hover:not(:disabled) {
    background: var(--hover-bg);
}

.action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.empty-text {
    color: var(--text-muted);
    font-size: var(--font-sm);
    padding: var(--space-md);
    text-align: center;
   
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--bg-color) 70%, var(--panel-bg));
}

.todo-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}

.all-list {
    max-height: 80%;
}

.todo-item {
    border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
    border-radius: var(--radius-sm);
    padding: var(--space-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s, transform 0.2s;
    background: color-mix(in srgb, var(--panel-bg) 96%, var(--bg-color));
}

.main{
    width: 100%;
    height: 100%;
}

.all-item {
    cursor: pointer;
}

.todo-item:hover {
    background-color: color-mix(in srgb, var(--hover-bg) 80%, var(--panel-bg));
    border-color: color-mix(in srgb, var(--primary-color) 22%, transparent);
    transform: translateY(-1px);
}

.todo-title {
    font-weight: 600;
    font-size: var(--font-base);
    margin-bottom: 2px;
}

.todo-meta {
    color: var(--text-muted);
    font-size: var(--font-sm);
}

.section-divider {
    border-top: 1px dashed color-mix(in srgb, var(--text-color) 20%, transparent);
    margin: var(--space-xs) 0;
}

.panel-header-row.sub {
    margin-top: var(--space-xs);
}

.status-tag {
    font-size: var(--font-xs);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    white-space: nowrap;
}

.status-tag.in-progress {
    color: var(--warning-color);
    background: color-mix(in srgb, var(--warning-color) 12%, transparent);
    border-color: color-mix(in srgb, var(--warning-color) 35%, transparent);
}

.status-tag.approved {
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    border-color: color-mix(in srgb, var(--primary-color) 35%, transparent);
}

.status-tag.rejected {
    color: var(--danger-color);
    background: color-mix(in srgb, var(--danger-color) 12%, transparent);
    border-color: color-mix(in srgb, var(--danger-color) 35%, transparent);
}

.status-tag.unknown {
    color: var(--text-muted);
    background: color-mix(in srgb, var(--text-color) 8%, transparent);
    border-color: color-mix(in srgb, var(--text-color) 18%, transparent);
}

.todo-arrow {
    color: var(--text-muted);
}

.arrow-icon {
    font-size: 1.2em;
    font-weight: bold;
}

@media (max-width: 900px) {
    .todo-list-container {
        padding: var(--space-sm);
    }

    .panel-header-row h4 {
        font-size: var(--font-sm);
    }

    .action-btn {
        font-size: var(--font-xs);
    }

    .todo-title {
        font-size: var(--font-sm);
    }

    .todo-meta {
        font-size: var(--font-xs);
    }
}
</style>
