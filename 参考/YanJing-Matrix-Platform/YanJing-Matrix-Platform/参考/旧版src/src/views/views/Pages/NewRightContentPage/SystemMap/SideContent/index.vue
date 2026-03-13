<template>
    <div class="side-content-container">
        <div class="content-wrapper">
            <!-- 头部 -->
            <div class="side-header">
                <h3 class="title">
                    <template v-if="selectedNode">
                        <span class="title-node">
                            <span class="type-icon title-icon">
                                <span
                                    class="icon-badge"
                                    :class="[
                                        (selectedNodeType === 'org' || selectedNodeType === 'root' || selectedNodeType === 'department') && 'icon-badge--charcoal',
                                        selectedNodeType === 'post' && 'icon-badge--violet',
                                        selectedNodeType === 'agent' && 'icon-badge--emerald',
                                        selectedNodeType === 'dataset' && 'icon-badge--blue-deep',
                                        selectedNodeType === 'person' && 'icon-badge--violet',
                                        selectedNodeType === 'workflow' && 'icon-badge--orange-vibrant',
                                        (selectedNodeType === 'view' || selectedNodeType === 'datatable') && 'icon-badge--blue-ice',
                                        (!selectedNodeType || !['org','root','department','post','agent','dataset','person','workflow','view','datatable'].includes(selectedNodeType)) && 'icon-badge--neutral'
                                    ]"
                                >
                                    <!-- org/department/root：network（炭黑） -->
                                    <svg v-if="selectedNodeType === 'org' || selectedNodeType === 'root' || selectedNodeType === 'department'"
                                        xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                        class="lucide lucide-network h-4 w-4 icon-badge__svg" aria-hidden="true">
                                        <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                                        <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                                        <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                                        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                                        <path d="M12 12V8"></path>
                                    </svg>

                                    <!-- post：id-card（偏青蓝） -->
                                    <svg v-else-if="selectedNodeType === 'post'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                        class="lucide lucide-id-card h-4 w-4 icon-badge__svg" aria-hidden="true">
                                        <path d="M16 10h2"></path>
                                        <path d="M16 14h2"></path>
                                        <path d="M6.17 15a3 3 0 0 1 5.66 0"></path>
                                        <circle cx="9" cy="11" r="2"></circle>
                                        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                    </svg>

                                    <!-- agent：robot（紫） -->
                                    <svg v-else-if="selectedNodeType === 'agent'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                        class="icon-badge__svg" aria-hidden="true">
                                        <path d="M12 8V4H8" />
                                        <rect x="4" y="8" width="16" height="12" rx="2" />
                                        <path d="M9 12h.01" />
                                        <path d="M15 12h.01" />
                                        <path d="M8 16h8" />
                                    </svg>

                                    <!-- dataset：database（紫） -->
                                    <svg v-else-if="selectedNodeType === 'dataset'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                        class="lucide lucide-database h-4 w-4 icon-badge__svg" aria-hidden="true">
                                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                        <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
                                        <path d="M3 12A9 3 0 0 0 21 12"></path>
                                    </svg>

                                    <!-- person：user（橙） -->
                                    <svg v-else-if="selectedNodeType === 'person'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                        class="lucide lucide-user h-4 w-4 icon-badge__svg" aria-hidden="true">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>

                                    <!-- default -->
                                    <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                        class="icon-badge__svg" aria-hidden="true">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v8" />
                                        <path d="M8 12h8" />
                                    </svg>
                                </span>
                            </span>
                            <span class="title-text">{{ currentInfo?.name || selectedNode?.data?.name || '-' }}</span>
                        </span>
                    </template>
                    <template v-else>数据总览</template>
                </h3>
                <button v-if="selectedNode" class="close-btn" @click="$emit('clear-selection')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>

            <!-- 内容区 -->
            <div class="side-body">
                <template v-if="selectedNode">
                    <template v-if="selectedNodeOverviewLoading">
                        <div class="hint full-row">加载节点详情中...</div>
                    </template>
                    <template v-else-if="selectedNodeOverviewError">
                        <div class="hint error full-row">{{ selectedNodeOverviewError }}</div>
                    </template>
                    <template v-else-if="!selectedNodeOverview">
                        <div class="hint full-row">暂无节点详情</div>
                    </template>
                    <template v-else>
                        <!-- 1) 当前节点 -->
                        <div class="block">
                            <div class="block-head">
                                <div class="head-left">
                                    <div class="type-icon">
                                        <span
                                            class="icon-badge"
                                            :class="[
                                                (selectedNodeType === 'org' || selectedNodeType === 'root' || selectedNodeType === 'department') && 'icon-badge--blue',
                                                selectedNodeType === 'post' && 'icon-badge--orange',
                                                selectedNodeType === 'agent' && 'icon-badge--emerald',
                                                selectedNodeType === 'dataset' && 'icon-badge--purple',
                                                selectedNodeType === 'person' && 'icon-badge--orange',
                                                selectedNodeType === 'workflow' && 'icon-badge--rose',
                                                (selectedNodeType === 'view' || selectedNodeType === 'datatable') && 'icon-badge--cyan',
                                                (!selectedNodeType || !['org','root','department','post','agent','dataset','person','workflow','view','datatable'].includes(selectedNodeType)) && 'icon-badge--neutral'
                                            ]"
                                        >
                                            <svg v-if="selectedNodeType === 'org' || selectedNodeType === 'root' || selectedNodeType === 'department'"
                                                xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                class="lucide lucide-network h-4 w-4 icon-badge__svg" aria-hidden="true">
                                                <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                                                <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                                                <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                                                <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                                                <path d="M12 12V8"></path>
                                            </svg>
                                            <svg v-else-if="selectedNodeType === 'post'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                class="lucide lucide-id-card h-4 w-4 icon-badge__svg" aria-hidden="true">
                                                <path d="M16 10h2"></path>
                                                <path d="M16 14h2"></path>
                                                <path d="M6.17 15a3 3 0 0 1 5.66 0"></path>
                                                <circle cx="9" cy="11" r="2"></circle>
                                                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                            </svg>
                                            <svg v-else-if="selectedNodeType === 'agent'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                class="icon-badge__svg" aria-hidden="true">
                                                <path d="M12 8V4H8" />
                                                <rect x="4" y="8" width="16" height="12" rx="2" />
                                                <path d="M9 12h.01" />
                                                <path d="M15 12h.01" />
                                                <path d="M8 16h8" />
                                            </svg>
                                            <svg v-else-if="selectedNodeType === 'dataset'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                class="lucide lucide-database h-4 w-4 icon-badge__svg" aria-hidden="true">
                                                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                                <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
                                                <path d="M3 12A9 3 0 0 0 21 12"></path>
                                            </svg>
                                            <svg v-else-if="selectedNodeType === 'person'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                class="lucide lucide-user h-4 w-4 icon-badge__svg" aria-hidden="true">
                                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none"
                                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                class="icon-badge__svg" aria-hidden="true">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 8v8" />
                                                <path d="M8 12h8" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div class="head-title">
                                        <div class="head-name">{{ currentInfo?.name || selectedNode?.data?.name || '-'
                                            }}</div>
                                        <div class="head-sub">
                                            {{ currentInfo?.atype || selectedNodeType || '-' }} / {{ currentInfo?.id ??
                                                selectedNode?.id ?? '-' }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="block-body">
                                <div class="pill" v-if="currentInfo?.description">{{ currentInfo.description }}</div>
                                <div class="pill" v-else>暂无描述</div>
                            </div>
                        </div>

                        <!-- 2) 上级组织/部门 -->
                        <template v-if="parentInfo">
                            <div class="section-title full-row">上级组织</div>
                            <div class="block is-clickable" @click="emitJumpToNode(parentInfo)">
                                <div class="block-head">
                                    <div class="head-left">
                                        <div class="type-icon type-icon--small">
                                            <span class="icon-badge icon-badge--blue">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                    class="lucide lucide-network h-4 w-4 icon-badge__svg" aria-hidden="true">
                                                    <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                                                    <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                                                    <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                                                    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                                                    <path d="M12 12V8"></path>
                                                </svg>
                                            </span>
                                        </div>
                                        <div class="head-name">{{ parentInfo.name || '-' }}</div>
                                    </div>
                                </div>
                                <div class="block-body">
                                    <!--div class="row">
                                        <span class="row-label">类型</span>
                                        <span class="row-value">{{ parentInfo.atype || '-' }}</span>
                                    </div>
                                    <div class="row">
                                        <span class="row-label">ID</span>
                                        <span class="row-value">{{ parentInfo.id ?? '-' }}</span>
                                    </div>
                                    <div class="row" v-if="parentInfo.path">
                                        <span class="row-label">path</span>
                                        <span class="row-value">{{ parentInfo.path }}</span>
                                    </div-->
                                </div>
                            </div>
                        </template>

                        <!-- 3) 下级组织/部门 -->
                        <template v-if="childDepartments.length">
                            <div class="section-title full-row">下级组织（{{ childDepartments.length }}）</div>
                            <div
                                class="block is-clickable"
                                v-for="c in childDepartments"
                                :key="`dept-${String(c.id)}`"
                                @click="emitJumpToNode(c)"
                            >
                                <div class="block-head">
                                    <div class="head-left">
                                        <div class="type-icon type-icon--small">
                                            <span class="icon-badge icon-badge--blue">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                    class="lucide lucide-network h-4 w-4 icon-badge__svg" aria-hidden="true">
                                                    <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                                                    <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                                                    <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                                                    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                                                    <path d="M12 12V8"></path>
                                                </svg>
                                            </span>
                                        </div>
                                        <div class="head-name">{{ c.name || '-' }}</div>
                                    </div>
                                </div>
                                <div class="block-body">
                                    <!--div class="row">
                                        <span class="row-label">类型</span>
                                        <span class="row-value">{{ c.atype || '-' }}</span>
                                    </div>
                                    <div class="row">
                                        <span class="row-label">ID</span>
                                        <span class="row-value">{{ c.id ?? '-' }}</span>
                                    </div>
                                    <div class="row" v-if="c.description">
                                        <span class="row-label">描述</span>
                                        <span class="row-value">{{ c.description }}</span>
                                    </div-->
                                </div>
                            </div>
                        </template>

                        <!-- 4) 职位 -->
                        <template v-if="childPosts.length">
                            <div class="section-title full-row">职位（{{ childPosts.length }}）</div>
                            <div
                                class="block is-clickable"
                                v-for="p in childPosts"
                                :key="`post-${String(p.id)}`"
                                @click="emitJumpToNode(p)"
                            >
                                <div class="block-head">
                                    <div class="head-left">
                                        <div class="type-icon type-icon--small">
                                            <span class="icon-badge icon-badge--orange">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round"
                                                    class="lucide lucide-id-card h-4 w-4 icon-badge__svg" aria-hidden="true">
                                                    <path d="M16 10h2"></path>
                                                    <path d="M16 14h2"></path>
                                                    <path d="M6.17 15a3 3 0 0 1 5.66 0"></path>
                                                    <circle cx="9" cy="11" r="2"></circle>
                                                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                                </svg>
                                            </span>
                                        </div>
                                        <div class="head-name">{{ p.name || '-' }}</div>
                                    </div>
                                </div>
                                <div class="block-body">
                                    <!--div class="row">
                                        <span class="row-label">类型</span>
                                        <span class="row-value">{{ p.atype || '-' }}</span>
                                    </div>
                                    <div class="row">
                                        <span class="row-label">ID</span>
                                        <span class="row-value">{{ p.id ?? '-' }}</span>
                                    </div>
                                    <div class="row" v-if="p.description">
                                        <span class="row-label">描述</span>
                                        <span class="row-value">{{ p.description }}</span>
                                    </div-->
                                </div>
                            </div>
                        </template>

                        <!-- 4.5) 智能体 / 数据集（下级） -->
                        <template v-if="childAgents.length">
                            <div class="section-title full-row">智能体（{{ childAgents.length }}）</div>
                            <div
                                class="block is-clickable"
                                v-for="a in childAgents"
                                :key="`agent-${String(a.id)}`"
                                @click="emitJumpToNode(a)"
                            >
                                <div class="block-head">
                                    <div class="head-left">
                                        <div class="type-icon type-icon--small">
                                            <span class="icon-badge icon-badge--emerald">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round"
                                                    class="icon-badge__svg" aria-hidden="true">
                                                    <path d="M12 8V4H8" />
                                                    <rect x="4" y="8" width="16" height="12" rx="2" />
                                                    <path d="M9 12h.01" />
                                                    <path d="M15 12h.01" />
                                                    <path d="M8 16h8" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div class="head-name">{{ a.name || '-' }}</div>
                                    </div>
                                </div>
                                <div class="block-body"></div>
                            </div>
                        </template>

                        <template v-if="childDatasets.length">
                            <div class="section-title full-row">数据集（{{ childDatasets.length }}）</div>
                            <div
                                class="block is-clickable"
                                v-for="d in childDatasets"
                                :key="`dataset-${String(d.id)}`"
                                @click="emitJumpToNode(d)"
                            >
                                <div class="block-head">
                                    <div class="head-left">
                                        <div class="type-icon type-icon--small">
                                            <span class="icon-badge icon-badge--purple">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round"
                                                    class="lucide lucide-database h-4 w-4 icon-badge__svg" aria-hidden="true">
                                                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                                    <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
                                                    <path d="M3 12A9 3 0 0 0 21 12"></path>
                                                </svg>
                                            </span>
                                        </div>
                                        <div class="head-name">{{ d.name || '-' }}</div>
                                    </div>
                                </div>
                                <div class="block-body"></div>
                            </div>
                        </template>

                        <!-- 5) 人员（账号） -->
                        <template v-if="usersList.length">
                            <div class="section-title full-row">账号（{{ usersList.length }}）</div>
                            <div
                                class="block is-clickable"
                                v-for="u in usersList"
                                :key="`user-${String(u.id)}`"
                                @click="emitJumpToNode(u, 'person')"
                            >
                                <div class="block-head">
                                    <div class="user-head">
                                        <div class="avatar">
                                            <span class="icon-badge icon-badge--orange">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                    class="lucide lucide-user h-4 w-4 icon-badge__svg" aria-hidden="true">
                                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div class="user-name">{{ u.nickname || '-' }}</div>
                                    </div>
                                    <!-- 对话按钮 -->
                                    <button class="action-btn" @click.stop="handleTalk(u)" title="发起对话">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div class="block-body">
                                    <!--div class="row">
                                        <span class="row-label">username</span>
                                        <span class="row-value">{{ u.username || '-' }}</span>
                                    </div>
                                    <div class="row">
                                        <span class="row-label">ID</span>
                                        <span class="row-value">{{ u.id ?? '-' }}</span>
                                    </div-->
                                </div>
                            </div>
                        </template>
                    </template>
                </template>

                <template v-else>
                    <div class="stats-grid full-row">
                        <div class="stat-card">
                            <div class="stat-value">{{ stats.departments }}</div>
                            <div class="stat-label">部门总数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">{{ stats.posts }}</div>
                            <div class="stat-label">职位总数</div>
                        </div>
                        <!--div class="stat-card">
                            <div class="stat-value">{{ stats.persons }}</div>
                            <div class="stat-label">账号总数</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-value">-</div>
                            <div class="stat-label">暂无数据</div>
                        </div-->
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { talkWithTargetAccount } from '@/composables/useTalkWithTargetAccount';

const props = defineProps<{
    selectedNode: any;
    selectedNodeOverview: any;
    selectedNodeOverviewLoading: boolean;
    selectedNodeOverviewError: string;
    allNodes: any[];
}>();

const emit = defineEmits(['clear-selection', 'jump-to-node', 'open-internal-browser', 'talk-request-from-organization-list']);

function emitJumpToNode(item: any, atypeOverride?: string) {
    if (!item) return;
    const id = item?.id ?? item?.nodeId;
    if (id === undefined || id === null) return;
    emit('jump-to-node', { id, atype: atypeOverride ?? item?.atype ?? item?.type });
}

async function handleTalk(u: any) {
    const username = u?.username;
    // 如果没有 username，尝试用 id 或其他字段兜底，或者直接返回
    if (!username) {
        console.warn('handleTalk: missing username', u);
        return;
    }
    await talkWithTargetAccount(username, (userId, roomId) => {
        emit('talk-request-from-organization-list', userId, roomId);
    });
}

// 模拟统计数据
const stats = computed(() => {
    const nodes = props.allNodes || [];
    return {
        departments: nodes.filter(n => (n.type || n.data?.type) === 'department').length,
        posts: nodes.filter(n => (n.type || n.data?.type) === 'post').length,
        persons: nodes.filter(n => (n.type || n.data?.type) === 'person').length,
        tasks: 0
    };
});


const selectedNodeType = computed(() => {
    return (props.selectedNode?.data?.type ?? props.selectedNode?.type ?? '') as string;
});

const overviewData = computed(() => {
    const d = props.selectedNodeOverview;
    return d?.data ?? null;
});

// OverviewDetail 解析：兼容 department/post 两种当前节点 key
const currentInfo = computed(() => {
    const d = overviewData.value;
    if (!d || Array.isArray(d)) return null;
    return (d as any).department || (d as any).post || null;
});

const parentInfo = computed(() => {
    const curr = currentInfo.value;
    return curr?.parent || null;
});

const childList = computed(() => {
    const d = overviewData.value;
    if (!d || Array.isArray(d)) return [];
    const child = (d as any).child;
    if (Array.isArray(child)) return child;
    const list = child?.data;
    return Array.isArray(list) ? list : [];
});

const childDepartments = computed(() => {
    return childList.value.filter((x: any) => x?.atype === 'department');
});

const childPosts = computed(() => {
    return childList.value.filter((x: any) => x?.atype === 'post');
});

const childAgents = computed(() => {
    return childList.value.filter((x: any) => x?.atype === 'agent');
});

const childDatasets = computed(() => {
    return childList.value.filter((x: any) => x?.atype === 'dataset');
});

const usersList = computed(() => {
    const d = overviewData.value;
    // agent 的详情返回通常是 data: [users]
    if (selectedNodeType.value === 'agent' && Array.isArray(d)) return d;
    if (!d || Array.isArray(d)) return [];
    const list = (d as any).users;
    return Array.isArray(list) ? list : [];
});
</script>

<style scoped>
.side-content-container {
    position: relative;
    height: 100%;
    width: 100%;
    background: var(--bg-color-secondary);
    border-left: 1px solid var(--bg-color-fifth);
    display: flex;
    flex-direction: row;
    box-shadow: var(--shadow-lg);
    min-width: 0;
}

.content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 20px;
    min-width: 0;
}

.side-header {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--bg-color-fifth);
    flex-shrink: 0;
}

.title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-color);
    padding: 0;
}

.title-node {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.title-icon {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    min-width: 28px;
    max-width: 28px;
}

.title-text {
    display: inline-block;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.action-btn {
    background: transparent;
    border: none;
    color: var(--text-color-secondary);
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
    margin-left: auto;
}

.action-btn:hover {
    background: var(--bg-color-fourth);
    color: var(--color-primary);
}

.close-btn {
    background: transparent;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}

.close-btn:hover {
    background: var(--bg-color-third);
}

.side-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-top: 20px;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 12px;
}

.divider {
    height: 1px;
    background: var(--bg-color-fifth);
    padding: 0;
}

.hint {
    font-size: calc(var(--font-size-base) * 0.9);
    color: var(--text-color-secondary);
}

.hint.error {
    color: var(--color-error, #f04747);
}

.section-title {
    font-size: calc(var(--font-size-base) * 0.9);
    color: var(--text-color-secondary);
    padding: 2px 4px;
}

.full-row {
    flex: 0 0 100%;
}

.block {
    background: var(--bg-color-third);
    border: 1px solid var(--bg-color-fifth);
    border-radius: 8px;
    overflow: hidden;
    flex: 1 1 260px;
    min-width: 0;
    display: flex;
}

.block.is-clickable {
    cursor: pointer;
}

.block.is-clickable:hover {
    background: var(--bg-color-secondary);
}

.block-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid var(--bg-color-fifth);
}

.head-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.type-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
}

.type-icon.type-icon--small {
    width: 24px;
    height: 24px;
    border-radius: 6px;
}

/* 与图谱 CustomNode 一致的徽章样式 */
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

.type-icon--small .icon-badge {
    width: 24px;
    height: 24px;
    border-radius: 6px;
}

.type-icon--small .icon-badge__svg {
    width: 16px;
    height: 16px;
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

.icon-badge--blue-ice {
    /* Dataset Assets (View/Table): 冰蓝色 #93C5FD */
    border-color: rgba(147, 197, 253, 0.75);
    background: rgba(147, 197, 253, 0.14);
    color: #93C5FD;
}

.icon-badge--neutral {
    border-color: var(--bg-color-fifth);
    background: var(--bg-color-third);
    color: var(--text-color);
}

.head-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.head-name {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.head-sub {
    font-size: calc(var(--font-size-base) * 0.9);
    color: var(--text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.block-body {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.pill {
    font-size: calc(var(--font-size-base) * 1.1);
    color: var(--text-color-secondary);
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--bg-color-fifth);
    background: var(--bg-color-secondary);
}

.row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.row-label {
    font-size: calc(var(--font-size-base) * 0.9);
    color: var(--text-color-secondary);
    flex-shrink: 0;
}

.row-value {
    font-size: calc(var(--font-size-base) * 0.9);
    color: var(--text-color);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}

.user-head {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.avatar {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.user-name {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 统计网格 */
.stats-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

@media (max-width: 768px) {
    .content-wrapper {
        padding: 12px;
    }

    .side-body {
        gap: 10px;
    }

    .block {
        flex: 1 1 100%;
    }

    .stats-grid {
        flex-direction: column;
    }
}

.stat-card {
    background: var(--bg-color-third);
    padding: 16px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--bg-color-fifth);
}

.stat-value {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--bg-color-fifth);
}

.stat-label {
    font-size: calc(var(--font-size-base) * 0.9);
    color: var(--text-color-secondary);
    padding-top: 4px;
}

/* 节点详情卡片 */
.info-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-color-third);
    border-radius: 6px;
}

.label {
    font-size: var(--font-size-base);
    color: var(--text-color-secondary);
    width: 60px;
    flex-shrink: 0;
}

.value {
    font-size: var(--font-size-base);
    color: var(--text-color);
    font-weight: 500;
}
</style>
