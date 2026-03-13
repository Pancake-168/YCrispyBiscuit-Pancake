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
import type { OrgNode } from '@/types/organization';
import { useOrganizationStore } from '@/stores/organization';
import { storeToRefs } from 'pinia';

// 注册 ECharts 组件
echarts.use([TreeChart, CanvasRenderer, TooltipComponent]);

const props = defineProps<{
  rootNode: OrgNode | null;
}>();

const emit = defineEmits(['node-click']);

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
const chartData = ref<any>(null); // 保存图表数据引用

// 颜色配置
const DEFAULT_NODE_COLORS = {
  org: '#5865f2',
  department: '#22c55e',
  person: '#f59e0b',
};

// SVG 缓存
const svgUriCache = new Map<string, string>();

// 创建 SVG 标记 (使用旧版图标)
function createSvgMarkup(color: string): string {
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
}

function getSvgDataUri(color: string): string {
  const normalized = color || DEFAULT_NODE_COLORS.org;
  if (!svgUriCache.has(normalized)) {
    svgUriCache.set(normalized, 'data:image/svg+xml;utf8,' + encodeURIComponent(createSvgMarkup(normalized)));
  }
  return svgUriCache.get(normalized) as string;
}

function getNodeColors() {
  const styles = getComputedStyle(document.documentElement);
  const resolve = (name: string, fallback: string) => {
    const value = styles.getPropertyValue(name).trim();
    return value || fallback;
  };
  return {
    org: resolve('--color-primary', DEFAULT_NODE_COLORS.org),
    department: resolve('--color-success', DEFAULT_NODE_COLORS.department),
    person: resolve('--color-warning', DEFAULT_NODE_COLORS.person),
  };
}

function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor: isDark ? '#f2f3f5' : '#23272a',
    lineColor: isDark ? '#42454a' : '#e3e5e8',
    borderColor: isDark ? '#42454a' : '#e0e0e0',
  };
}

// 转换数据为 ECharts 格式
// 关键优化：只包含部门，不包含人员
function transformDataForECharts(node: OrgNode, colors: any): any {
  // 过滤子节点：只保留部门类型
  let children: any[] = [];
  if (node.children && node.children.length > 0) {
    children = node.children
      .filter(child => child.type === 'department' || child.type === 'org')
      .map(child => transformDataForECharts(child, colors));
  }

  const nodeType = node.type as keyof typeof DEFAULT_NODE_COLORS;
  const nodeColor = colors[nodeType] || colors.org;

  return {
    id: node.id,
    name: node.name,
    value: node, // 存储原始节点数据
    children: children,
    symbol: `image://${getSvgDataUri(nodeColor)}`,
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
function getRequiredHeight(node: any): number {
  // 如果节点折叠或无子节点，占用一个单位高度
  if (!node || node.collapsed || !node.children || node.children.length === 0) {
    return 60; // 每个节点的预留高度
  }
  // 否则高度为所有子节点高度之和
  return node.children.reduce((sum: number, child: any) => sum + getRequiredHeight(child), 0);
}

// 递归设置初始折叠状态
function setInitialCollapsed(node: any, depth: number) {
  // 默认只展开根节点 (depth 0) 和第一层 (depth 1)
  // 即 depth >= 1 的节点的子节点应该被折叠
  if (depth >= 1 && node.children && node.children.length > 0) {
    node.collapsed = true;
  } else {
    node.collapsed = false;
  }
  
  if (node.children) {
    node.children.forEach((c: any) => setInitialCollapsed(c, depth + 1));
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
function findNodeById(node: any, id: string): any {
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

function initChart() {
  if (!chartRef.value || !props.rootNode) return;
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
    
    // 绑定点击事件 (手动处理折叠和选择)
    chartInstance.on('click', (params: any) => {
      // ECharts 可能会克隆数据，所以我们需要在原始数据 chartData 中查找对应的节点
      const clickedId = params.data.id;
      const targetNode = findNodeById(chartData.value, clickedId);
      
      if (targetNode) {
        // 1. 切换折叠状态
        if (targetNode.children && targetNode.children.length > 0) {
          targetNode.collapsed = !targetNode.collapsed;
          
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
          emit('node-click', targetNode.value.id);
        }
      }
    });
  }

  const themeColors = getThemeColors();
  const nodeColors = getNodeColors();
  
  // 准备数据
  const rawData = transformDataForECharts(props.rootNode, nodeColors);
  // 应用初始折叠逻辑
  setInitialCollapsed(rawData, 0);
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
        roam: false, // 禁用缩放漫游，因为我们现在使用原生滚动条
        
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

// 监听数据变化
watch(() => props.rootNode, (newVal, oldVal) => {
  // 简单比较，避免不必要的重绘
  if (JSON.stringify(transformDataForECharts(newVal as OrgNode, getNodeColors())) === 
      JSON.stringify(transformDataForECharts(oldVal as OrgNode, getNodeColors()))) {
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
    window.addEventListener('resize', handleResize);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});
</script>

<style scoped>
.org-tree-view {
  width: 100%;
  height: 100%;
  overflow: auto; /* 允许滚动 */
  background: var(--bg-color-third);
  border-radius: var(--border-radius-lg);
  position: relative;
}

.echart-box {
  width: 100%;
  /* height 由 JS 动态控制 */
  min-height: 100%;
}
</style>
