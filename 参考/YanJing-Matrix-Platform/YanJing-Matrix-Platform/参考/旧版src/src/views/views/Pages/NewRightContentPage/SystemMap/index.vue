<template>
    <div class="system-map-wrapper" :class="{ 'system-map--mobile': isMobile }" @touchstart="handleTouchStart"
        @touchmove="handleTouchMove" @touchend="handleTouchEnd">
        <!-- 过滤条 -->
        <div class="system-map-filter" :style="filterStyle">
            <div class="filter-row">
                <div class="filter-types">
                    <span class="filter-label">类型筛选</span>
                    <button
                        v-for="opt in typeOptions"
                        :key="opt.value"
                        type="button"
                        class="filter-chip"
                        :class="{ 'is-active': isTypeSelected(opt.value) }"
                        @click="toggleType(opt.value)"
                    >
                        {{ opt.label }}
                    </button>
                </div>
                <div class="filter-actions">
                    <button type="button" class="filter-btn" @click="selectAllTypes">全选</button>
                    <button type="button" class="filter-btn" @click="clearAllTypes">清空</button>
                </div>
            </div>

            <div class="filter-row">
                <div class="filter-search">
                    <span class="filter-label">关键词</span>
                    <input
                        v-model="filterState.keyword"
                        class="filter-input"
                        type="text"
                        placeholder="按名称/ID/类型搜索"
                    />
                </div>
                <label class="filter-toggle">
                    <input type="checkbox" v-model="filterState.keepParents" />
                    保留父级链路
                </label>
                <div class="filter-count">
                    显示 {{ nodes.length }} / {{ allNodes.length }}
                </div>
            </div>
        </div>
        <!-- 固定在左上角的JSON数据显示区域 -->
        <div v-if="selectedNode" class="top-left-panels">
            <div class="json-display-panel">
                <div class="panel-title">selectedNode</div>
                <pre>{{ JSON.stringify(selectedNode, null, 2) }}</pre>
            </div>

            <div class="json-display-panel">
                <div class="panel-title">overviewDetail</div>
                <template v-if="selectedNodeOverviewLoading">
                    <pre>Loading...</pre>
                </template>
                <template v-else-if="selectedNodeOverviewError">
                    <pre>{{ selectedNodeOverviewError }}</pre>
                </template>
                <template v-else>
                    <pre>{{ JSON.stringify(selectedNodeOverview, null, 2) }}</pre>
                </template>
            </div>
        </div>

        <template v-if="isMobile">
            <div class="system-map-track" :style="trackStyle">
                <div class="system-map-panel system-map-panel--left">
                    <VueFlow v-model:nodes="nodes" v-model:edges="edges" :node-types="nodeTypes"
                        :fit-view-on-init="true" :nodes-draggable="nodesDraggable" :nodes-connectable="nodesConnectable"
                        :elements-selectable="elementsSelectable" :max-zoom="2" :min-zoom="0.1" :zoom-on-scroll="true"
                        class="system-flow-container" @node-click="event => handleNodeClickAndGoRight(event.node)"
                        @pane-click="() => handleNodeClickAndGoRight(null)">
                        <!-- 背景网格：中间透明度和尺寸，平衡清晰度与精致感 -->
                        <Background variant="dots" :pattern-color="'var(--border-color, rgba(154, 119, 253, 0.45))'"
                            :gap="40" :size="1.8" />

                        <!-- 自定义节点插槽监听 -->
                        <template #node-custom="props">
                            <CustomNode v-bind="props" @expand="payload => handleNodeExpand(payload.id)" />
                        </template>
                    </VueFlow>
                </div>

                <div class="system-map-panel system-map-panel--right">
                    <div class="right-dock right-dock--mobile">
                        <InternalBrowser class="internal-browser" :url="internalBrowserUrl"
                            v-show="internalBrowserVisible" @close="internalBrowserVisible = false" />

                        <SideContent :selected-node="selectedNode" :selected-node-overview="selectedNodeOverview"
                            :selected-node-overview-loading="selectedNodeOverviewLoading"
                            :selected-node-overview-error="selectedNodeOverviewError" :all-nodes="allNodes"
                            v-show="!internalBrowserVisible" @clear-selection="handleNodeClick(null)"
                            @jump-to-node="handleJumpToNode" @open-internal-browser="handleOpenInternalBrowser"
                            @talk-request-from-organization-list="(...args: any[]) => emit('talk-request-from-organization-list', ...args)" />
                    </div>
                </div>
            </div>
        </template>

        <template v-else>
            <VueFlow v-model:nodes="nodes" v-model:edges="edges" :node-types="nodeTypes" :fit-view-on-init="true"
                :nodes-draggable="nodesDraggable" :nodes-connectable="nodesConnectable"
                :elements-selectable="elementsSelectable" :max-zoom="2" :min-zoom="0.1" :zoom-on-scroll="true"
                class="system-flow-container" @node-click="event => handleNodeClickAndGoRight(event.node)"
                @pane-click="() => handleNodeClickAndGoRight(null)">
                <!-- 背景网格：中间透明度和尺寸，平衡清晰度与精致感 -->
                <Background variant="dots" :pattern-color="'var(--border-color, rgba(154, 119, 253, 0.45))'" :gap="40"
                    :size="1.8" />

                <!-- 自定义节点插槽监听 -->
                <template #node-custom="props">
                    <CustomNode v-bind="props" @expand="payload => handleNodeExpand(payload.id)" />
                </template>
            </VueFlow>

            <!-- 右侧：NocoBase 内嵌 + 节点详情（并排且永久存活） -->
            <div class="right-dock" :style="{ width: `${dockWidthVw}vw` }">
                <div class="dock-resize-handle" @mousedown="initResize"></div>
                <InternalBrowser class="internal-browser" :url="internalBrowserUrl" v-show="internalBrowserVisible"
                    @close="internalBrowserVisible = false" />

                <SideContent :selected-node="selectedNode" :selected-node-overview="selectedNodeOverview"
                    :selected-node-overview-loading="selectedNodeOverviewLoading"
                    :selected-node-overview-error="selectedNodeOverviewError" :all-nodes="allNodes"
                    v-show="!internalBrowserVisible" @clear-selection="handleNodeClick(null)"
                    @jump-to-node="handleJumpToNode" @open-internal-browser="handleOpenInternalBrowser"
                    @talk-request-from-organization-list="(...args: any[]) => emit('talk-request-from-organization-list', ...args)" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { markRaw, onMounted, onUnmounted, ref, computed } from 'vue';
import { VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { NOCOBASE_URL } from '@/apiUrls';

// 导入自定义节点组件
import CustomNode from './CustomNode/index.vue';
// 导入侧边栏组件
import SideContent from './SideContent/index.vue';
import InternalBrowser from '@/components/InternalBrowser/index.vue';
// 导入逻辑处理函数
import { useSystemMapData } from './ts/ts';

const emit = defineEmits(['talk-request-from-organization-list']);

// 注册自定义节点类型
const nodeTypes = {
    custom: markRaw(CustomNode) as any,
};

const internalBrowserUrl = ref('');
const internalBrowserVisible = ref(false);

type MobilePanel = 'left' | 'right';
const isMobile = ref(typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches);
const mobilePanel = ref<MobilePanel>('left');
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchDeltaX = ref(0);
const touchDeltaY = ref(0);

const panelOrder: MobilePanel[] = ['left', 'right'];
const mobilePanelIndex = computed(() => panelOrder.indexOf(mobilePanel.value));
const trackStyle = computed(() => {
    if (!isMobile.value) return undefined;
    return {
        transform: `translateX(-${mobilePanelIndex.value * 100}%)`
    };
});

const goPrevPanel = () => {
    const idx = mobilePanelIndex.value;
    const nextIndex = (idx - 1 + panelOrder.length) % panelOrder.length;
    mobilePanel.value = panelOrder[nextIndex];
};

const goNextPanel = () => {
    const idx = mobilePanelIndex.value;
    const nextIndex = (idx + 1) % panelOrder.length;
    mobilePanel.value = panelOrder[nextIndex];
};

function handleOpenInternalBrowser(payload: { path: string }) {
    const path = payload?.path;
    if (!path) return;

    const base = String(NOCOBASE_URL || 'https://t8960.zheshu.tech').replace(/\/$/, '');
    const fullUrl = path.startsWith('http://') || path.startsWith('https://')
        ? path
        : `${base}${path.startsWith('/') ? '' : '/'}${path}`;

    internalBrowserUrl.value = fullUrl;
    internalBrowserVisible.value = true;
}

// 使用数据管理 Hook
const {
    nodes,
    edges,
    allNodes,
    availableTypes,
    selectedNode,
    selectedNodeOverview,
    selectedNodeOverviewLoading,
    selectedNodeOverviewError,
    handleNodeExpand,
    handleNodeClick,
    filterState,
    nodesDraggable,
    nodesConnectable,
    elementsSelectable
} = useSystemMapData({ onOpenInternalBrowser: handleOpenInternalBrowser });



const typeLabelMap: Record<string, string> = {
    workflow: '工作流',
    view: '视图',
    datatable: '数据表',
    dataset: '数据集',
    agent: '智能体',
    post: '职位',
    department: '部门',
};

const typeOptions = computed(() => {
    return availableTypes.value.map((value) => ({
        value,
        label: typeLabelMap[value] ?? value,
    }));
});

const isTypeSelected = (value: string) => filterState.value.types.has(value);

const toggleType = (value: string) => {
    const next = new Set(filterState.value.types);
    if (next.has(value)) {
        next.delete(value);
    } else {
        next.add(value);
    }
    filterState.value.types = next;
};

const selectAllTypes = () => {
    filterState.value.types = new Set(typeOptions.value.map(opt => opt.value));
};

const clearAllTypes = () => {
    filterState.value.types = new Set();
};

const handleNodeClickAndGoRight = (node: any) => {
    handleNodeClick(node);
    if (isMobile.value && node) {
        mobilePanel.value = 'right';
    }
};

// 右侧 dock 宽度（vw）：拖拽时更新该值，同时作用于 SideContent / InternalBrowser
const dockWidthVw = ref(25);
const minDockWidthVw = 15;
const maxDockWidthVw = 80;
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

const initResize = (e: MouseEvent) => {
    e.preventDefault();
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', stopResize);
    document.body.style.cursor = 'col-resize';
};

const handleResize = (e: MouseEvent) => {
    const newWidthPx = window.innerWidth - e.clientX;
    const vw = (newWidthPx / window.innerWidth) * 100;
    dockWidthVw.value = clamp(Math.round(vw * 10) / 10, minDockWidthVw, maxDockWidthVw);
};

const stopResize = () => {
    window.removeEventListener('mousemove', handleResize);
    window.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = 'default';
};

const filterStyle = computed(() => {
    if (isMobile.value) {
        return { left: '8px', right: '8px' };
    }
    return {
        left: '12px',
        right: `calc(${dockWidthVw.value}vw + 12px)`
    };
});

onMounted(() => {
    dockWidthVw.value = clamp(dockWidthVw.value, minDockWidthVw, maxDockWidthVw);
    window.addEventListener('resize', updateIsMobile);
});

const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
    if (isMobile.value && !panelOrder.includes(mobilePanel.value)) {
        mobilePanel.value = 'left';
    }
};

onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
});

const handleTouchStart = (event: TouchEvent) => {
    if (!isMobile.value) return;
    const touch = event.touches[0];
    touchStartX.value = touch.clientX;
    touchStartY.value = touch.clientY;
    touchDeltaX.value = 0;
    touchDeltaY.value = 0;
};

const handleTouchMove = (event: TouchEvent) => {
    if (!isMobile.value) return;
    const touch = event.touches[0];
    touchDeltaX.value = touch.clientX - touchStartX.value;
    touchDeltaY.value = touch.clientY - touchStartY.value;
    const absX = Math.abs(touchDeltaX.value);
    const absY = Math.abs(touchDeltaY.value);
    if (absX > 10 && absX > absY * 0.8) {
        event.preventDefault();
    }
};

const handleTouchEnd = () => {
    if (!isMobile.value) return;
    const deltaX = touchDeltaX.value;
    const deltaY = touchDeltaY.value;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > 40 && absX > absY * 1.0) {
        if (deltaX < 0) {
            goNextPanel();
        } else {
            goPrevPanel();
        }
    }
};

function handleJumpToNode(payload: { id: string | number; atype?: string }) {
    const id = payload?.id;
    if (id === undefined || id === null) return;

    const atype = payload?.atype ? String(payload.atype) : '';

    const target = (nodes.value || []).find((n: any) => {
        if (String(n.id) !== String(id)) return false;
        if (!atype) return true;
        return String(n?.data?.type || '') === atype;
    });
    if (target) {
        handleNodeClick(target);
    }
}

// 样式导入 (确保已安装相关包)
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
</script>

<style scoped>
.system-map-wrapper {
    width: 100%;
    height: 100%;
    /* 使用稍深的背景色，使纯白节点和鼠标指针更加清晰 */
    background-color: var(--bg-color-secondary, #F7F8FA);
    position: relative;
}

.system-map-filter {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    z-index: 200;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    backdrop-filter: blur(6px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.filter-types {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.filter-label {
    font-size: 12px;
    color: var(--text-color-secondary, #6b7280);
    margin-right: 4px;
}

.filter-chip {
    border: 1px solid var(--border-color, #e5e7eb);
    background: var(--bg-color-secondary, #f3f4f6);
    color: var(--text-color, #1f2937);
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.filter-chip.is-active {
    background: var(--color-primary, #3b82f6);
    color: #fff;
    border-color: var(--color-primary, #3b82f6);
}

.filter-actions {
    display: flex;
    gap: 8px;
}

.filter-btn {
    border: 1px solid var(--border-color, #e5e7eb);
    background: #fff;
    color: var(--text-color, #1f2937);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
}

.filter-search {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 200px;
}

.filter-input {
    flex: 1;
    min-width: 160px;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    background: #fff;
}

.filter-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-color, #1f2937);
}

.filter-count {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-color-secondary, #6b7280);
}

.system-map-track {
    width: 100%;
    height: 100%;
    display: flex;
    min-width: 0;
    min-height: 0;
    transition: transform 0.25s ease;
}

.system-map-panel {
    min-width: 0;
    min-height: 0;
    height: 100%;
    width: 100%;
}

.right-dock {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    z-index: 100;
    pointer-events: auto;
    height: 100%;
}

.right-dock--mobile {
    position: relative;
    width: 100%;

    display: flex;

}

.dock-resize-handle {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 4px;
    cursor: col-resize;
    background: transparent;
    transition: background 0.2s;
    z-index: 101;
}

.dock-resize-handle:hover {
    background: var(--bg-color-fifth);
}

.internal-browser {
    height: 100%;
    width: 100%;
    max-width: calc(100vw - 64px);
}

.top-left-panels {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 10px;
    z-index: 1000;
}

.json-display-panel {
    width: 300px;
    height: 250px;
    background-color: rgba(142, 142, 142, 0.5);
    color: #fff;

    border-radius: 8px;
    padding: 8px;
    font-size: calc(var(--font-size-base) * 0.9);
    line-height: 1.4;
    overflow: auto;
}

.panel-title {
    font-size: calc(var(--font-size-base) * 0.9);
    font-weight: 600;
    margin-bottom: 6px;
    opacity: 0.9;
}

.json-display-panel pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.system-flow-container {
    width: 100%;
    height: 100%;
    background: transparent;
}

.system-map--mobile {
    overflow: hidden;
}

.system-map--mobile .system-map-filter {
    top: 8px;
    left: 8px;
    right: 8px;
    padding: 10px 12px;
}

.system-map--mobile .system-map-track {
    width: 200%;
}

.system-map--mobile .system-map-panel {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
}

/* 让 VueFlow 内部层透明，以显示 wrapper 设置的背景色 */
:deep(.vue-flow__pane) {
    background: transparent;
}

:deep(.vue-flow__background) {
    z-index: 0;
}

/* 可以在这里覆盖 Vue Flow 的默认变量 */
:deep(.vue-flow__node-custom) {
    border: none;
    background: transparent;
    padding: 0;
}

:deep(.vue-flow__edge-path) {
    stroke: var(--border-color);
    stroke-width: 2;
}
</style>
