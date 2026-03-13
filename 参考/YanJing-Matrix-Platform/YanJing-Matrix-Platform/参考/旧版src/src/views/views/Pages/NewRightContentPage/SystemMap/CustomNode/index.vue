<template>
    <!-- 组织（根节点） -->
    <div v-if="data.type === 'org'" class="system-map-card org-node" :class="{ 'is-collapsed': data.isCollapsed }">
        <!--div class="node-icon">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2 h-4 w-4"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
        </div-->
        <div class="node-icon icon-badge icon-badge--blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-network h-4 w-4 icon-badge__svg" aria-hidden="true">
                <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                <path d="M12 12V8"></path>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- 部门 -->
    <div v-else-if="data.type === 'department'" class="system-map-card department-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-network h-4 w-4 icon-badge__svg" aria-hidden="true">
                <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                <path d="M12 12V8"></path>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- 职位 -->
    <div v-else-if="data.type === 'post'" class="system-map-card post-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-id-card h-4 w-4 icon-badge__svg" aria-hidden="true">
                <path d="M16 10h2"></path>
                <path d="M16 14h2"></path>
                <path d="M6.17 15a3 3 0 0 1 5.66 0"></path>
                <circle cx="9" cy="11" r="2"></circle>
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- Agent -->
    <div v-else-if="data.type === 'agent'" class="system-map-card agent-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--emerald">
            <!-- robot -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon-badge__svg" aria-hidden="true">
                <path d="M12 8V4H8" />
                <rect x="4" y="8" width="16" height="12" rx="2" />
                <path d="M9 12h.01" />
                <path d="M15 12h.01" />
                <path d="M8 16h8" />
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- Dataset -->
    <div v-else-if="data.type === 'dataset'" class="system-map-card dataset-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--purple">
            <!-- folder -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-database h-4 w-4 icon-badge__svg" aria-hidden="true">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
                <path d="M3 12A9 3 0 0 0 21 12"></path>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- Dataset 资产：View -->
    <div v-else-if="data.type === 'view'" class="system-map-card dataset-asset-node view-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--cyan">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-panels-top-left h-4 w-4 icon-badge__svg" aria-hidden="true">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M3 9h18"></path>
                <path d="M9 21V9"></path>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- Dataset 资产：Datatable -->
    <div v-else-if="data.type === 'datatable'" class="system-map-card dataset-asset-node datatable-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--cyan">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-workflow h-4 w-4 icon-badge__svg" aria-hidden="true">
                <rect width="8" height="8" x="3" y="3" rx="2"></rect>
                <path d="M7 11v4a2 2 0 0 0 2 2h4"></path>
                <rect width="8" height="8" x="13" y="13" rx="2"></rect>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- Dataset 资产：Workflow -->
    <div v-else-if="data.type === 'workflow'" class="system-map-card dataset-asset-node workflow-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--rose">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-git-merge h-4 w-4 icon-badge__svg" aria-hidden="true">
                <circle cx="18" cy="18" r="3"></circle>
                <circle cx="6" cy="6" r="3"></circle>
                <path d="M6 21V9a9 9 0 0 0 9 9"></path>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>


    <!-- 过渡节点：下属部门 -->
    <div v-else-if="data.type === 'sub_department'" class="system-map-card transition-node sub-department-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-folder h-4 w-4 icon-badge__svg" aria-hidden="true">
                <path
                    d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z">
                </path>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- 过渡节点：下属职位 -->
    <div v-else-if="data.type === 'sub_post'" class="system-map-card transition-node sub-post-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-folder h-4 w-4 icon-badge__svg" aria-hidden="true">
                <path
                    d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z">
                </path>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- 过渡节点：视图页面 -->
    <div v-else-if="data.type === 'view_page'" class="system-map-card transition-node view-page-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--cyan">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-folder h-4 w-4 icon-badge__svg" aria-hidden="true">
                <path
                    d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z">
                </path>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- 过渡节点：工作流 -->
    <div v-else-if="data.type === 'workflow_group'" class="system-map-card transition-node workflow-group-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--rose">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-folder h-4 w-4 icon-badge__svg" aria-hidden="true">
                <path
                    d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z">
                </path>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- 过渡节点：数据表 -->
    <div v-else-if="data.type === 'datatable_group'" class="system-map-card transition-node datatable-group-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--cyan">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-folder h-4 w-4 icon-badge__svg" aria-hidden="true">
                <path
                    d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z">
                </path>
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- 人员 -->
    <div v-else-if="data.type === 'person'" class="system-map-card person-node"
        :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon icon-badge icon-badge--orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-user h-4 w-4 icon-badge__svg">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        </div>
        <div class="node-label">{{ data.name }}</div>
        <!-- 人员通常是叶子节点，不需要展开按钮 -->
        <div class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <!-- 人员可能也可以作为连线的起点（如果有业务需求） -->
        <Handle type="source" :position="Position.Right" />
    </div>

    <!-- 默认/未知 -->
    <div v-else class="system-map-card" :class="{ 'is-collapsed': data.isCollapsed }">
        <div class="node-icon">?</div>
        <div class="node-label">{{ data.name || '未知节点' }}</div>
        <button class="expand-btn" @click.stop="handleExpand" v-if="data.hasChildren">
            {{ data.isCollapsed ? '展开' : '收起' }}
        </button>
        <div v-else class="expand-placeholder"></div>
        <Handle type="target" :position="Position.Left" />
        <Handle type="source" :position="Position.Right" />
    </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';


const props = defineProps<{
    id: string;
    data: any;
    type: string;
}>();

const emit = defineEmits(['expand']);

function handleExpand() {
    emit('expand', { id: props.id, data: props.data });
}
</script>

<style scoped>
/* --- 彻底统一的卡片样式 --- */
.system-map-card {
    width: 220px;
    /* 固定宽度确保完全统一 */
    height: 48px;
    /* 固定高度确保完全统一 */
    padding: 0 16px;
    background: var(--bg-color-secondary);
    border: 1px solid var(--bg-color-fifth);
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--shadow-xs);
    transition: all 0.2s ease;
    position: relative;
    box-sizing: border-box;
}

.system-map-card.is-collapsed {
    border-color: var(--bg-color-fifth);
    background: var(--bg-color-third);
    opacity: 0.9;
}

.system-map-card:hover {
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
}

/* --- 内部元素彻底统一 --- */
.node-icon {
    font-size: var(--font-size-md);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

/* 图标圆角卡片（用于 org 节点） */
.icon-badge {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.icon-badge__svg {
    width: 18px;
    height: 18px;
}

.icon-badge--blue {
    /* 组织/部门 (Structure): 科技蓝 #3B82F6 */
    border-color: rgba(59, 130, 246, 0.75);
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;
}

.icon-badge--orange {
    /* 职位/人员 (Human): 活力橙 #F97316 */
    border-color: rgba(249, 115, 22, 0.75);
    background: rgba(249, 115, 22, 0.14);
    color: #F97316;
}

.icon-badge--emerald {
    /* Agent (AI): 极光绿 #10B981 */
    border-color: rgba(16, 185, 129, 0.75);
    background: rgba(16, 185, 129, 0.14);
    color: #10B981;
}

.icon-badge--purple {
    /* Dataset (Data): 深邃紫 #A855F7 */
    border-color: rgba(168, 85, 247, 0.75);
    background: rgba(168, 85, 247, 0.14);
    color: #A855F7;
}

.icon-badge--rose {
    /* Workflow (Process): 玫瑰红 #F43F5E */
    border-color: rgba(244, 63, 94, 0.75);
    background: rgba(244, 63, 94, 0.14);
    color: #F43F5E;
}

.icon-badge--cyan {
    /* Asset/View: 青色 #06B6D4 */
    border-color: rgba(6, 182, 212, 0.75);
    background: rgba(6, 182, 212, 0.14);
    color: #06B6D4;
}

.icon-badge--neutral {
    border-color: var(--bg-color-fifth);
    background: var(--bg-color-third);
    color: var(--text-color);
}


.node-label {
    font-size: var(--font-size-base);
    font-weight: 500;
    color: var(--text-color);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.expand-btn {
    padding: 4px 10px;
    font-size: calc(var(--font-size-base) * 0.9);
    background: var(--bg-color-secondary);
    border: 1px solid var(--bg-color-6);
    border-radius: 4px;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
}

.expand-placeholder {
    width: 46px;
    /* 与 expand-btn 宽度一致，确保占位统一 */
    flex-shrink: 0;
}

.expand-btn:hover {
    background: var(--bg-color-fifth);
    color: var(--color-white);
    border-color: var(--bg-color-fifth);
}

/* --- 连接点样式 --- */
:deep(.vue-flow__handle) {
    width: 8px;
    height: 8px;
    background: var(--bg-color-fifth);
    border: 2px solid var(--bg-color-third);
}
</style>
