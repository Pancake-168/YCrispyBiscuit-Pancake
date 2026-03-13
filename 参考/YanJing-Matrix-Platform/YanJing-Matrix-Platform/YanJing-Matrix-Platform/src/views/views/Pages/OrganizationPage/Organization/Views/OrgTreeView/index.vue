<template>
  <div class="org-tree-view">
    <div ref="chartRef" class="echart-box"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import { TreeChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import type { OrgNodeV2 } from '@/types/Organization';

// 注册 ECharts 组件
echarts.use([TreeChart, CanvasRenderer, TooltipComponent]);

const props = defineProps<{
  rootNode: OrgNodeV2 | null;
}>();

const emit = defineEmits<{
  (e: 'node-click', node: OrgNodeV2): void;
}>();

type NodeColors = {
  org: string;
  department: string;
  post: string;
  person: string;
};

type TreeNodeData = {
  id: string;
  name: string;
  value?: OrgNodeV2;
  children?: TreeNodeData[];
  collapsed?: boolean;
  symbol?: string;
  symbolSize?: number;
  itemStyle?: {
    color: string;
    borderColor: string;
  };
};

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let themeObserver: MutationObserver | null = null;
const chartData = ref<TreeNodeData | null>(null); // 保存图表数据引用
const collapsedStateMap = new Map<string, boolean>();

// 颜色配置
const DEFAULT_NODE_COLORS = {
  // 按需求写死为蓝 / 绿 / 橙
  org: '#0969da',
  department: '#0969da',
  post: '#f59e0b',
  person: '#16a34a',
};

// SVG 缓存
const svgUriCache = new Map<string, string>();

// 创建 SVG 标记 (分为组织/部门图标 和 人员/职位图标，与 OrgListView 保持一致)
function createSvgMarkup(type: string, color: string): string {
  if (type === 'org' || type === 'department') {
    return `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" fill="none" style="color:${color}">
<rect width="36" height="36" rx="18" fill="currentColor" fill-opacity="0.25"/>
<g clip-path="url(#clip0_129_420)">
<path d="M15 18C15 17.0572 15 16.5858 14.6583 16.2929C14.3166 16 13.7666 16 12.6667 16C11.5667 16 11.0168 16 10.675 16.2929C10.3333 16.5858 10.3333 17.0572 10.3333 18C10.3333 18.9428 10.3333 19.4142 10.675 19.7071C11.0168 20 11.5667 20 12.6667 20C13.7666 20 14.3166 20 14.6583 19.7071C15 19.4142 15 18.9428 15 18Z" stroke="currentColor" stroke-width="1.5"/>
<path d="M23.6667 13.3333C23.6667 12.3904 23.6667 11.919 23.3933 11.6261C23.1199 11.3333 22.68 11.3333 21.8 11.3333H20.8667C19.9867 11.3333 19.5467 11.3333 19.2734 11.6261C19 11.919 19 12.3904 19 13.3333C19 14.2761 19 14.7475 19.2734 15.0404C19.5467 15.3333 19.9867 15.3333 20.8667 15.3333H21.8C22.68 15.3333 23.1199 15.3333 23.3933 15.0404C23.6667 14.7475 23.6667 14.2761 23.6667 13.3333Z" stroke="currentColor" stroke-width="1.5"/>
<path d="M23.6667 22.6667C23.6667 21.7239 23.6667 21.2525 23.3933 20.9596C23.1199 20.6667 22.68 20.6667 21.8 20.6667H20.8667C19.9867 20.6667 19.5467 20.6667 19.2734 20.9596C19 21.2525 19 21.7239 19 22.6667C19 23.6096 19 24.081 19.2734 24.3739C19.5467 24.6667 19.9867 24.6667 20.8667 24.6667H21.8C22.68 24.6667 23.1199 24.6667 23.3933 24.3739C23.6667 24.081 23.6667 23.6096 23.6667 22.6667Z" stroke="currentColor" stroke-width="1.5"/>
<path d="M17 17.9994L17 20.6975C17 21.9468 17.6114 22.5078 19 22.6667M17 17.9994L17 15.3014C17 14.1231 17.5194 13.5057 19 13.3334M17 17.9994L15 17.9994" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_129_420">
<rect width="16" height="16" fill="white" transform="translate(9 10)"/>
</clipPath>
</defs>
</svg>`;
  } else {
    // 职位/人员使用人员图标
    return `<svg width="36" height="36" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="color:${color}">
<rect width="1024" height="1024" rx="512" fill="currentColor" fill-opacity="0.25"/>
<path d="M828.3 818.2c-8-66.8-31.8-129.9-68.7-182.4-31.8-45.2-72.1-81-117.7-104.6 27.5-20.6 49.7-47.2 64.9-78 19.6-39.6 26.4-84.2 19.7-128.8-6.5-43.2-26-83.2-56.4-115.7-30.6-32.7-69.2-54.7-111.9-63.6-15.7-3.3-31.5-4.9-47-4.9-58.2 0-112.9 22.7-154 63.8s-63.8 95.8-63.8 154c0 38.3 10.2 76 29.5 108.9 14.7 25 34.3 46.9 57.6 64.4-45.6 23.7-86 59.5-117.7 104.7-36.9 52.5-60.7 115.5-68.7 182.4-2 16.3 3.2 32.8 14.2 45.1 11.1 12.5 26.9 19.7 43.5 19.7h518.8c16.6 0 32.5-7.2 43.5-19.7 10.9-12.6 16.1-29.1 14.2-45.3zM429.2 586.4c20.1-8.5 33.6-27.3 35.2-49.2 1.5-21.8-9.2-42.4-28.1-53.7-45.2-27-72.2-74-72.2-125.6 0-81.1 65.9-147 147-147 10.6 0 21.5 1.1 32.5 3.4 57.6 12 103.9 61.6 112.8 120.6 9 60.3-18 117.3-70.4 148.7-18.8 11.2-29.5 31.7-28.1 53.7 1.6 21.9 15 40.7 35.2 49.2 84.6 35.7 146 121.6 162.5 225.6H266.4C283.3 708 344.8 622 429.2 586.4z" fill="currentColor" transform="translate(512, 512) scale(0.6) translate(-512, -512)"></path>
</svg>`;
  }
}

function getSvgDataUri(type: string, color: string): string {
  const normalizedColor = color || DEFAULT_NODE_COLORS.org;
  const cacheKey = `${type}_${normalizedColor}`;
  if (!svgUriCache.has(cacheKey)) {
    svgUriCache.set(cacheKey, 'data:image/svg+xml;utf8,' + encodeURIComponent(createSvgMarkup(type, normalizedColor)));
  }
  return svgUriCache.get(cacheKey) as string;
}

function getNodeColors() {
  // 按需求写死颜色，不随主题变化
  return { ...DEFAULT_NODE_COLORS };
}

function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor: isDark ? '#f2f3f5' : '#23272a',
    lineColor: isDark ? '#42454a' : '#e3e5e8',
    borderColor: isDark ? '#42454a' : '#e0e0e0',
  };
}

// 转换数据为V2 包含部门和职位
function transformDataForECharts(node: OrgNodeV2, colors: NodeColors): TreeNodeData {
  // 过滤子节点：保留部门、组织、职位、人员（组织页需要展示人员）
  let children: TreeNodeData[] = [];
  if (node.children && node.children.length > 0) {
    children = node.children
      .filter(child => ['department', 'org', 'post', 'person'].includes(child.type))
      .map(child => transformDataForECharts(child, colors));
  }

  const nodeType = node.type as keyof typeof DEFAULT_NODE_COLORS;
  const nodeColor = colors[nodeType] || colors.org;

  return {
    id: node.id,
    name: node.name,
    value: node, // 存储原始节点数据
    children: children,
    symbol: `image://${getSvgDataUri(nodeType, nodeColor)}`,
    symbolSize: 36,
    itemStyle: {
      color: nodeColor,
      borderColor: nodeColor,
    },
    // 移除强制展开，交由 series.initialTreeDepth 控制
    // collapsed: false,
  };
}

// 计算树所需的垂直高度
function getRequiredHeight(node: TreeNodeData | null): number {
  // 如果节点折叠或无子节点，占用一个单位高度
  if (!node || node.collapsed || !node.children || node.children.length === 0) {
    return 60; // 每个节点的预留高度
  }
  // 否则高度为所有子节点高度之和
  return node.children.reduce((sum: number, child: TreeNodeData) => sum + getRequiredHeight(child), 0);
}

// 递归设置初始折叠状态
function setInitialCollapsed(node: TreeNodeData, depth: number) {
  // 默认只展开根节点 (depth 0) 和第一层 (depth 1)
  // 即 depth >= 1 的节点的子节点应该被折叠
  if (depth >= 1 && node.children && node.children.length > 0) {
    node.collapsed = true;
  } else {
    node.collapsed = false;
  }
  
  if (node.children) {
    node.children.forEach((c: TreeNodeData) => setInitialCollapsed(c, depth + 1));
  }
}

function collectCollapsedState(node: TreeNodeData | null) {
  if (!node) return;
  collapsedStateMap.set(node.id, !!node.collapsed);
  if (node.children) {
    node.children.forEach((child: TreeNodeData) => collectCollapsedState(child));
  }
}

function applyCollapsedState(node: TreeNodeData, depth: number) {
  const saved = collapsedStateMap.get(node.id);
  if (saved === undefined) {
    setInitialCollapsed(node, depth);
    return;
  }

  node.collapsed = saved;
  if (node.children) {
    node.children.forEach((child: TreeNodeData) => applyCollapsedState(child, depth + 1));
  }
}

function updateChartHeight() {
  if (!chartRef.value || !chartData.value) return;
  
  const contentHeight = getRequiredHeight(chartData.value);
  // 确保至少填满容器，或者根据内容撑开
  const containerHeight = chartRef.value.parentElement?.clientHeight || 600;
  const finalHeight = Math.max(containerHeight, contentHeight);
  
  chartRef.value.style.height = `${finalHeight}px`;
  chartInstance?.resize();
}

// 辅助函数：在树中查找节点
function findNodeById(node: TreeNodeData | null, id: string): TreeNodeData | null {
  if (!node) return null;
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

function getClickedNodeId(params: unknown): string | null {
  if (!params || typeof params !== 'object') return null;
  const eventData = (params as { data?: unknown }).data;
  if (!eventData || typeof eventData !== 'object') return null;
  const id = (eventData as { id?: unknown }).id;
  return typeof id === 'string' ? id : null;
}

function initChart() {
  if (!chartRef.value || !props.rootNode) return;
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
    
    // 绑定点击事件 (手动处理折叠和选择)
    chartInstance.on('click', (params) => {
      // ECharts 可能会克隆数据，所以我们需要在原始数据 chartData 中查找对应的节点
      const clickedId = getClickedNodeId(params);
      if (!clickedId) return;
      const targetNode = findNodeById(chartData.value, clickedId);
      
      if (targetNode) {
        // 1. 切换折叠状态
        if (targetNode.children && targetNode.children.length > 0) {
          targetNode.collapsed = !targetNode.collapsed;
          collapsedStateMap.set(targetNode.id, !!targetNode.collapsed);
          
          // 更新高度并重绘
          updateChartHeight();
          chartInstance?.setOption({
            series: [{
              data: [chartData.value]
            }]
          });
        }
        
        // 2. 触发外部选择事件
        if (targetNode.value) {
          emit('node-click', targetNode.value as OrgNodeV2);
        }
      }
    });
  }

  const themeColors = getThemeColors();
  const nodeColors = getNodeColors();

  collectCollapsedState(chartData.value);
  
  // 准备数据
  const rawData = transformDataForECharts(props.rootNode, nodeColors);
  // 优先恢复当前展开状态；新节点仍按初始规则处理。
  applyCollapsedState(rawData, 0);
  chartData.value = rawData;
  
  // 初始调整高度
  updateChartHeight();

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: '{b}'
    },
    series: [
      {
        type: 'tree',
        data: [chartData.value],
        top: '20px',
        left: '10%',
        bottom: '20px',
        right: '20%',
        symbolSize: 7,
        orient: 'LR', // 从左到右
        
        label: {
          position: 'right',
          verticalAlign: 'middle',
          align: 'left',
          fontSize: 14,
          color: themeColors.textColor,
          distance: 10
        },
        
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left'
          }
        },

        expandAndCollapse: false, // 禁用默认折叠，完全手动控制
        // initialTreeDepth: 1, // 手动控制后不再需要此配置
        roam: true, // 允许拖动与触控漫游
        
        animationDuration: 300, // 恢复少量动画，因为手动控制高度后不会闪烁
        animationDurationUpdate: 300,
        
        lineStyle: {
          color: themeColors.lineColor,
          width: 2,
          curveness: 0.5
        }
      }
    ]
  };

  chartInstance.setOption(option);
}

function refreshChartTheme() {
  if (!props.rootNode || !chartInstance) return;
  initChart();
}

// 监听树数据变化。
// 这里不能依赖 deep watch 的 newVal/oldVal 做对象对比：当 store 原地更新节点时，
// newVal 和 oldVal 往往会指向同一个响应式对象，导致树图漏掉重绘。
watch(() => props.rootNode, (newVal) => {
  if (!newVal) {
    chartData.value = null;
    collapsedStateMap.clear();
    chartInstance?.clear();
    return;
  }
  initChart();
}, { deep: true });

// 监听窗口大小变化
const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  nextTick(() => {
    initChart();

    themeObserver = new MutationObserver((mutations) => {
      const themeChanged = mutations.some(
        (mutation) => mutation.type === 'attributes' && mutation.attributeName === 'data-theme'
      );
      if (themeChanged) {
        refreshChartTheme();
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    window.addEventListener('resize', handleResize);
  });
});

onBeforeUnmount(() => {
  themeObserver?.disconnect();
  themeObserver = null;
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});
</script>

<style scoped>
.org-tree-view {
  width: 100%;
  height: 100%;
  overflow: auto; /* 允许滚动 */
  background: var(--panel-bg);
  border-radius: var(--radius-lg);
  position: relative;
  touch-action: pan-x pan-y;
}

.echart-box {
  width: 100%;
  /* height 由 JS 动态控制 */
  min-height: 100%;
  min-width: 100%;
  touch-action: none;
}

@media (max-width: 768px) {
  .org-tree-view {
    overflow: hidden;
  }
}
</style>
