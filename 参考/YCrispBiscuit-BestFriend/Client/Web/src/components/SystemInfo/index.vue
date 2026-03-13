<template>
    <div v-if="systemInfoStore.systemInfo" class="SystemInfo">

        <div class="info-group">
            <div class="title">终端</div>
            <div class="data">
                <div>系统: {{ systemInfoStore.systemInfo['系统信息']?.['操作系统'] }} {{
                    systemInfoStore.systemInfo['系统信息']?.['操作系统版本'] }}</div>
                <div>主机名: {{ systemInfoStore.systemInfo['系统信息']?.['主机名'] }}</div>
            </div>
        </div>
        <div class="info-group">
            <div class="title">开机信息</div>
            <div class="data">
                <div>开机时间：{{ systemInfoStore.systemInfo['开机信息']?.['开机时间'] }}</div>
                <div>开机时长：{{ systemInfoStore.systemInfo['开机信息']?.['开机时长'] }}</div>
            </div>
        </div>

        <div class="info-group">
            <div class="title">CPU信息</div>
            <div class="data">
                <div>CPU型号：{{ systemInfoStore.systemInfo['CPU信息']?.['CPU型号'] }}</div>
                <div>CPU核心数：{{ systemInfoStore.systemInfo['CPU信息']?.['CPU核心数'] }}</div>
                <div>CPU逻辑核心数：{{ systemInfoStore.systemInfo['CPU信息']?.['CPU逻辑核心数'] }}</div>
            </div>
        </div>
        <div class="info-group">
            <div class="title">GPU信息</div>
            <div class="data">
                <div v-if="systemInfoStore.systemInfo['GPU信息'] && systemInfoStore.systemInfo['GPU信息'][0]">
                    GPU型号：{{ systemInfoStore.systemInfo['GPU信息'][0]['GPU型号'] }}，驱动版本：{{
                        systemInfoStore.systemInfo['GPU信息'][0]['驱动版本'] }}
                </div>
                <div v-if="systemInfoStore.systemInfo['GPU信息'] && systemInfoStore.systemInfo['GPU信息'][1]">
                    GPU型号：{{ systemInfoStore.systemInfo['GPU信息'][1]['GPU型号'] }}，显存：{{
                        systemInfoStore.systemInfo['GPU信息'][1]['显存'] }}，驱动版本：{{
                        systemInfoStore.systemInfo['GPU信息'][1]['驱动版本'] }}
                </div>
            </div>
        </div>

        <div class="info-group">
            <div class="title">内存信息</div>
            <div ref="memoryChartRef" class="chart"></div>
            <div>
                <div>总内存：{{ systemInfoStore.systemInfo['内存信息']?.['总内存'] }}</div>
                <div>可用内存：{{ systemInfoStore.systemInfo['内存信息']?.['可用内存'] }}</div>
                <div>内存使用率：{{ systemInfoStore.systemInfo['内存信息']?.['内存使用率'] }}</div>
            </div>
        </div>
        <div class="info-group">
            <div class="title">磁盘信息</div>
            <div class="data" v-if="systemInfoStore.systemInfo['磁盘信息'] && systemInfoStore.systemInfo['磁盘信息'][0]">
                <div>盘符：{{ systemInfoStore.systemInfo['磁盘信息'][0]['盘符'] }}</div>
                <div ref="diskChartRef0" class="chart"></div>
                <div>
                    <div>总大小：{{ systemInfoStore.systemInfo['磁盘信息'][0]['总大小'] }}</div>
                    <div>可用空间：{{ systemInfoStore.systemInfo['磁盘信息'][0]['可用空间'] }}</div>
                    <div>使用率：{{ systemInfoStore.systemInfo['磁盘信息'][0]['使用率'] }}</div>
                </div>
            </div>
            <div class="data" v-if="systemInfoStore.systemInfo['磁盘信息'] && systemInfoStore.systemInfo['磁盘信息'][1]">
                <div>盘符：{{ systemInfoStore.systemInfo['磁盘信息'][1]['盘符'] }}</div>
                <div ref="diskChartRef1" class="chart"></div>
                <div>
                    <div>总大小：{{ systemInfoStore.systemInfo['磁盘信息'][1]['总大小'] }}</div>
                    <div>可用空间：{{ systemInfoStore.systemInfo['磁盘信息'][1]['可用空间'] }}</div>
                    <div>使用率：{{ systemInfoStore.systemInfo['磁盘信息'][1]['使用率'] }}</div>
                </div>
            </div>
        </div>



        <div class="info-group">
            <div class="title">网络信息</div>
            <div class="data">
                <div v-if="systemInfoStore.systemInfo['网络信息'] && systemInfoStore.systemInfo['网络信息'][0]">
                    网卡名称：{{ systemInfoStore.systemInfo['网络信息'][0]['网卡名称'] }}，MAC地址：{{
                        systemInfoStore.systemInfo['网络信息'][0]['MAC地址'] }}，链路速度：{{
                        systemInfoStore.systemInfo['网络信息'][0]['链路速度'] }}
                </div>
                <div v-if="systemInfoStore.systemInfo['网络信息'] && systemInfoStore.systemInfo['网络信息'][1]">
                    网卡名称：{{ systemInfoStore.systemInfo['网络信息'][1]['网卡名称'] }}，MAC地址：{{
                        systemInfoStore.systemInfo['网络信息'][1]['MAC地址'] }}，链路速度：{{
                        systemInfoStore.systemInfo['网络信息'][1]['链路速度'] }}
                </div>
                <div v-if="systemInfoStore.systemInfo['网络信息'] && systemInfoStore.systemInfo['网络信息'][2]">
                    网卡名称：{{ systemInfoStore.systemInfo['网络信息'][2]['网卡名称'] }}，MAC地址：{{
                        systemInfoStore.systemInfo['网络信息'][2]['MAC地址'] }}，链路速度：{{
                        systemInfoStore.systemInfo['网络信息'][2]['链路速度'] }}
                </div>
            </div>
        </div>

    </div>


    <div v-else>暂无系统信息</div>
</template>



<script setup lang="ts">
import { useSystemInfoStore } from '@/stores/SystemInfo';
import * as echarts from 'echarts';
import { ref, onMounted, watch } from 'vue';
const systemInfoStore = useSystemInfoStore();

const memoryChartRef = ref();
const diskChartRef0 = ref();
const diskChartRef1 = ref();

function getColorByPercent(percent: number): string {
    if (percent < 40) return '#4caf50'; // 绿色
    if (percent < 70) return '#ff9800'; // 橙色
    return '#f44336'; // 红色
}

function renderMemoryChart() {
    const info = systemInfoStore.systemInfo?.['内存信息'];
    if (!info) return;
    const total = parseFloat((info['总内存'] || '0').replace(/[^\d.]/g, ''));
    const available = parseFloat((info['可用内存'] || '0').replace(/[^\d.]/g, ''));
    const used = total - available;
    const percent = total ? (used / total) * 100 : 0;
    const chart = echarts.init(memoryChartRef.value);
    chart.setOption({
        tooltip: {
            trigger: 'item',
            formatter: (params: { name: string; value: number; percent: number }) => `${params.name}: ${params.value.toFixed(2)} GB (${params.percent}%)`
        },
        series: [{
            type: 'pie',
            radius: '60%',
            data: [
                { value: used, name: '已用内存', itemStyle: { color: getColorByPercent(percent) } },
                { value: available, name: '可用内存', itemStyle: { color: '#ccc' } }
            ]
        }]
    });
}

function renderDiskChart(idx: number) {
    const disks = systemInfoStore.systemInfo?.['磁盘信息'];
    if (!disks || !disks[idx]) return;
    const disk = disks[idx];
    const total = parseFloat((disk['总大小'] || '0').replace(/[^\d.]/g, ''));
    const available = parseFloat((disk['可用空间'] || '0').replace(/[^\d.]/g, ''));
    const used = total - available;
    const percent = total ? (used / total) * 100 : 0;
    const chart = echarts.init(idx === 0 ? diskChartRef0.value : diskChartRef1.value);
    chart.setOption({
        tooltip: {
            trigger: 'item',
            formatter: (params: { name: string; value: number; percent: number }) => `${params.name}: ${params.value.toFixed(2)} GB (${params.percent}%)`
        },
        series: [{
            type: 'pie',
            radius: '60%',
            data: [
                { value: used, name: '已用空间', itemStyle: { color: getColorByPercent(percent) } },
                { value: available, name: '可用空间', itemStyle: { color: '#ccc' } }
            ]
        }]
    });
}

onMounted(() => {
    renderMemoryChart();
    renderDiskChart(0);
    renderDiskChart(1);
});
watch(() => systemInfoStore.systemInfo, () => {
    renderMemoryChart();
    renderDiskChart(0);
    renderDiskChart(1);
});
</script>
<style scoped>
.SystemInfo {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 0.5rem;
  
    color: var(--text-color);
    
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-normal);
   
    width: 100%;
  
    height: 100%;
   
    
}

.info-group {
    padding: var(--info-group-padding);
    background-color: var(--background-color-white);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: var(--base-gap);
}

.title {
    font-size: var(--font-size-title);
    font-weight: var(--font-weight-bold);
    color: var(--text-color2);
}

.data div {
    display: flex;
    flex-wrap: wrap;
    gap: var(--base-gap);
    font-size: var(--font-size-small);
    color: var(--text-color3);
}

.chart {
    width: var(--chart-width);
    height: var(--chart-height);
    background-color: var(--background-color2);
    border-radius: var(--border-radius);
}

/* 内存信息组：chart 和文本横向排列 */
.info-group:nth-child(5) .data {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--base-gap);
}

.info-group:nth-child(5) .chart {
    flex-shrink: 0;
}

/* 磁盘信息组：每个磁盘的data横向排列 */
.info-group:nth-child(6) .data {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--base-gap);
}

.info-group:nth-child(6) .chart {
    flex-shrink: 0;
}
</style>