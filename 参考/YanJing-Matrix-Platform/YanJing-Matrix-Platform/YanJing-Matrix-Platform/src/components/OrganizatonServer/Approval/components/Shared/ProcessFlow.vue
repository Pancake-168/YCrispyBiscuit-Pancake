<template>
    <div class="process-flow">
        <div class="flow-title">审批流程</div>
        <div class="flow-steps">
            <div v-for="(node, index) in nodes" :key="node.id" class="step-item" :class="{
                'is-active': currentNodeId === node.id,
                'is-passed': currentNodeId && node.id < currentNodeId // 简单假设 id 递增，实际应根据 order 或 status 判断
            }">
                <div class="step-icon">
                    {{ index + 1 }}
                </div>
                <div class="step-content">
                    <div class="step-name">
                        节点 {{ node.node_order }}
                        <span v-if="node.required" class="badge-required">必填</span>
                    </div>
                    <div class="step-approver">
                        <span class="label">审批人:</span>
                        {{ formatApprover(node) }}
                    </div>
                </div>
                <div class="step-line" v-if="index < nodes.length - 1"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ApprovalNode } from '@/types/approval'

defineProps<{
    nodes: ApprovalNode[]
    currentNodeId?: number
}>()

function formatApprover(node: ApprovalNode) {
    if (node.approver_type === 'position') {
        return `职位: ${node.approver_role}`
    }
    if (node.approver_type === 'manager') {
        return `直属主管 (层级 ${node.approver_role})`
    }
    return `${node.approver_type}: ${node.approver_role}`
}
</script>

<style scoped>
.process-flow {
    border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
    border-radius: var(--radius-sm);
    padding: var(--space-md);
    background: color-mix(in srgb, var(--bg-color) 74%, var(--panel-bg));
}

.flow-title {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin-bottom: var(--space-sm);
    font-weight: 600;
}

.flow-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.step-item {
    display: flex;
    position: relative;
    padding-bottom: var(--space-md);
}

.step-item:last-child {
    padding-bottom: 0;
}

.step-icon {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--input-bg);
    border: 2px solid var(--text-muted);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    z-index: 2;
    margin-right: var(--space-sm);
    flex-shrink: 0;
}

.step-line {
    position: absolute;
    top: 26px;
    left: 12px;
    /* Center of 24px icon */
    bottom: 0;
    width: 2px;
    background: color-mix(in srgb, var(--text-color) 10%, transparent);
    z-index: 1;
}

.step-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 2px;
}

.step-name {
    font-size: var(--font-base);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.step-approver {
    font-size: var(--font-sm);
    color: var(--text-muted);
}

.badge-required {
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--danger-color) 10%, transparent);
    color: var(--danger-color);
}

/* Active State */
.step-item.is-active .step-icon {
    border-color: var(--primary-color);
    background: var(--primary-color);
    color: #fff;
}

.step-item.is-active .step-name {
    color: var(--primary-color);
}

/* Passed State (Future Enhancement) */
.step-item.is-passed .step-icon {
    border-color: var(--info-color);
    color: var(--info-color);
}
</style>
