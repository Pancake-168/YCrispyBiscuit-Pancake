import { ref, computed, watch } from 'vue';
import { ConnectionMode } from '@vue-flow/core';
import { useOrganizationStore } from '@/stores/Organization';
import { GetOverView, GetOverViewDetail } from '@/services/Project/OverView/overviewV2';
import type { GetOverViewDetailResponse, OverviewApiNode, OverviewDatasetAsset, OverviewNode, OverviewNodeType } from '@/types/OverView';



/**
 * 自动布局配置
 */
const LAYOUT_CONFIG = {
    HORIZONTAL_SPACING: 350, // 水平间距
    VERTICAL_SPACING: 80,    // 垂直间距
    START_X: 50,             // 起始 X
    START_Y: 50,             // 起始 Y
};

/**
 * 系统图谱数据管理 Hook
 */
export function useSystemMapData(options?: { onOpenInternalBrowser?: (payload: { path: string }) => void }) {
    const store = useOrganizationStore();

    const overviewNodes = ref<OverviewNode[]>([]);
    // dataset 节点点击后的详情资产（view/datatable/...），作为图谱子节点注入。
    // key: datasetNodeId, value: asset nodes
    const datasetAssetNodesByDatasetId = ref<
        Map<
            string,
            Array<{
                id: string;
                parentId: string;
                name: string;
                type: string;
                description?: string;
                path?: string;
                raw?: OverviewDatasetAsset;
            }>
        >
    >(new Map());
    const overviewLoading = ref(false);
    const overviewError = ref<string>('');
    const datasetPrefetchSeq = ref(0);
    // 过滤状态（类型 + 关键词 + 是否保留父链）
    const filterState = ref({
        types: new Set<string>(),
        keyword: '',
        keepParents: true,
    });
    const typesInitialized = ref(false);

    // VueFlow 需要 v-model 绑定可写的 ref；否则会出现 “computed value is readonly” 警告。
    // 这里用 graphNodes/graphEdges 作为 VueFlow 的模型层，再由我们从 store/layout 计算并同步进去。
    const graphNodes = ref<any[]>([]);
    const graphEdges = ref<any[]>([]);

    // 从当前组织 appid 拉取系统图谱数据源（Overview API），并缓存为本地 ref。
    watch(
        () => store.currentOrganization?.app_id,
        async (appid) => {
            if (!appid) {
                overviewNodes.value = [];
                datasetAssetNodesByDatasetId.value = new Map();
                overviewLoading.value = false;
                overviewError.value = '';
                return;
            }

            // appid 发生变化时，先清空上一个 app 的 dataset 资产节点，避免污染。
            datasetAssetNodesByDatasetId.value = new Map();

            overviewLoading.value = true;
            overviewError.value = '';

            const res = await GetOverView(String(appid));
            if (!res.ok || !res.data) {
                overviewNodes.value = [];
                overviewError.value = '获取系统图谱数据失败';
                overviewLoading.value = false;
                return;
            }

            const list: OverviewApiNode[] = Array.isArray(res.data.data)
                ? res.data.data
                : [];

            const mapped: OverviewNode[] = list
                .map((n) => {
                    const type = String(n.atype) as OverviewNodeType;
                    if (type !== 'department' && type !== 'post' && type !== 'agent' && type !== 'dataset' && type !== 'workflow') {
                        return null;
                    }
                    return {
                        id: String(n.id),
                        parentId: n.parentId === undefined || n.parentId === null ? undefined : String(n.parentId),
                        name: n.name,
                        type,
                        description: n.description,
                        path: n.path,
                    };
                })
                .filter(Boolean) as OverviewNode[];

            overviewNodes.value = mapped;
            overviewLoading.value = false;

            // 预取所有 dataset 节点的详情并注入资产节点
            const seq = ++datasetPrefetchSeq.value;
            const datasetNodes = mapped.filter(n => n.type === 'dataset');
            if (!datasetNodes.length) return;

            const nextMap = new Map<string, any[]>();

            for (const node of datasetNodes) {
                if (seq !== datasetPrefetchSeq.value) return;

                const datasetNodeId = String(node.id);
                const id = Number(node.id);
                if (!Number.isFinite(id)) continue;

                const res = await GetOverViewDetail(String(appid), 'dataset', id);
                if (seq !== datasetPrefetchSeq.value) return;

                if (!res.ok || !res.data) continue;

                const dataAny = res.data as any;
                const assets: OverviewDatasetAsset[] = Array.isArray(dataAny?.data) ? dataAny.data : [];

                const assetNodes = assets
                    .filter((a) => a && (a as any).id !== undefined && (a as any).id !== null)
                    .map((a) => {
                        const assetId = String(a.id);
                        const assetType = String(a.atype || 'asset');
                        const name = String(a.name || a.asset_name || assetType || assetId);
                        const path = typeof a.asset_name === 'string' ? a.asset_name : undefined;
                        return {
                            id: `asset-${datasetNodeId}-${assetId}`,
                            parentId: datasetNodeId,
                            name,
                            type: assetType,
                            description: a.description ?? undefined,
                            path,
                            raw: a,
                        };
                    });

                nextMap.set(datasetNodeId, assetNodes);
            }

            if (seq === datasetPrefetchSeq.value) {
                datasetAssetNodesByDatasetId.value = nextMap;
            }
        },
        { immediate: true }
    );

    // 使用 computed 将“主干节点 + dataset 资产节点”暴露为数组，保持响应式
    const allNodes = computed(() => {
        const base = overviewNodes.value;
        const extras: any[] = [];
        datasetAssetNodesByDatasetId.value.forEach((list) => {
            if (Array.isArray(list) && list.length) extras.push(...list);
        });
        return (Array.isArray(base) ? base : []).concat(extras);
    });

    // 从所有节点中动态提取可用类型（去重 + 排序）
    const availableTypes = computed(() => {
        const types = new Set<string>();
        allNodes.value.forEach((n) => {
            const type = String((n as any)?.type || '').trim();
            if (type) types.add(type);
        });
        return Array.from(types).sort();
    });

    // 节点加载完成后，基于全部节点重新生成类型集合
    watch(availableTypes, (types) => {
        if (!typesInitialized.value) {
            filterState.value.types = new Set(types);
            typesInitialized.value = true;
            return;
        }

        // 后续只移除不存在的类型，避免用户筛选被重置
        const next = new Set<string>();
        filterState.value.types.forEach((t) => {
            if (types.includes(t)) next.add(t);
        });
        filterState.value.types = next;
    }, { immediate: true });

    // 记录被折叠的节点 ID
    const collapsedNodeIds = ref<Set<string>>(new Set());

    // 记录当前选中的节点
    const selectedNode = ref<any>(null);

    // 选中节点的详情（来自 OverviewDetail API），仅用于展示，不写入 store
    const selectedNodeOverview = ref<GetOverViewDetailResponse | null>(null);
    const selectedNodeOverviewLoading = ref(false);
    const selectedNodeOverviewError = ref<string>('');
    const overviewRequestSeq = ref(0);

    // 存储计算后的布局信息
    const layoutData = ref<{ positionedNodesMap: Map<string, any>, adj: Map<string, string[]> }>({
        positionedNodesMap: new Map(),
        adj: new Map()
    });

    /**
     * 核心布局计算：计算全量节点的固定位置
     * 无论是否折叠，节点在空间中的位置是预先确定的，以保持布局稳定性
     */
    const getFullLayout = (allNodes: any[], allEdges: any[]) => {
        const nodesMap = new Map(allNodes.map(n => [n.id, { ...n }]));
        const adj = new Map<string, string[]>();
        const reverseAdj = new Map<string, string[]>();

        allEdges.forEach(edge => {
            if (!adj.has(edge.source)) adj.set(edge.source, []);
            adj.get(edge.source)!.push(edge.target);
            if (!reverseAdj.has(edge.target)) reverseAdj.set(edge.target, []);
            reverseAdj.get(edge.target)!.push(edge.source);
        });

        const roots = allNodes.filter(n => !reverseAdj.has(n.id)).map(n => n.id);
        // 如果没有根节点（可能是循环引用或空），取第一个作为根
        if (roots.length === 0 && allNodes.length > 0) roots.push(allNodes[0].id);

        const subtreeHeights = new Map<string, number>();

        // 1. 计算全量状态下的子树高度
        const calculateFullHeight = (id: string): number => {
            const children = adj.get(id) || [];
            if (children.length === 0) {
                subtreeHeights.set(id, 1);
                return 1;
            }
            const height = children.reduce((acc, childId) => acc + calculateFullHeight(childId), 0);
            subtreeHeights.set(id, height);
            return height;
        };
        roots.forEach(rootId => calculateFullHeight(rootId));

        // 2. 分配固定位置
        const positionedNodesMap = new Map<string, any>();
        const visited = new Set<string>();

        const assignPosition = (id: string, x: number, yOffset: number) => {
            if (visited.has(id)) return;
            visited.add(id);

            const node = nodesMap.get(id);
            if (!node) return;

            const height = subtreeHeights.get(id) || 1;
            const y = yOffset + (height * LAYOUT_CONFIG.VERTICAL_SPACING) / 2;

            node.position = { x, y };
            positionedNodesMap.set(id, node);

            let currentY = yOffset;
            const children = adj.get(id) || [];
            children.forEach(childId => {
                const childHeight = subtreeHeights.get(childId) || 1;
                assignPosition(childId, x + LAYOUT_CONFIG.HORIZONTAL_SPACING, currentY);
                currentY += childHeight * LAYOUT_CONFIG.VERTICAL_SPACING;
            });
        };

        let globalY = LAYOUT_CONFIG.START_Y;
        roots.forEach(rootId => {
            assignPosition(rootId, LAYOUT_CONFIG.START_X, globalY);
            globalY += (subtreeHeights.get(rootId) || 1) * LAYOUT_CONFIG.VERTICAL_SPACING + 40;
        });

        return { positionedNodesMap, adj };
    };

    // 监听 allNodes 变化，重新计算布局
    watch(allNodes, (newNodes) => {
        if (!newNodes || newNodes.length === 0) {
            layoutData.value = { positionedNodesMap: new Map(), adj: new Map() };
            graphNodes.value = [];
            graphEdges.value = [];
            return;
        }
        
        // 转换数据格式
        const nodes = newNodes.map(node => {
            return {
                id: String(node.id),
                type: 'custom',
                data: { ...node }, // 将所有原始数据放入 data
                position: { x: 0, y: 0 }, // 初始位置
                selectable: true,
            };
        });

        const edges = newNodes
            .filter(node => node.parentId !== undefined && node.parentId !== null)
            .map(node => ({
                id: `e-${node.parentId}-${node.id}`,
                source: String(node.parentId),
                target: String(node.id)
            }));

        layoutData.value = getFullLayout(nodes, edges);
    }, { immediate: true, deep: true });

    /**
     * 从 layoutData 计算当前可见的元素（不直接暴露给 VueFlow v-model）
     */
    const computedVisibleNodes = computed(() => {
        const { positionedNodesMap, adj } = layoutData.value;
        const visibleNodes: any[] = [];
        const visited = new Set<string>();

        if (positionedNodesMap.size === 0) return [];

        // 递归查找可见节点
        const collectVisible = (id: string) => {
            if (visited.has(id)) return;
            visited.add(id);

            const node = positionedNodesMap.get(id);
            if (!node) return;

            // 更新节点的折叠状态数据
            const isCollapsed = collapsedNodeIds.value.has(id);
            // Post 通常是叶子：保持与旧表现一致，强制隐藏 post 的展开按钮。
            const type = node.data?.type;
            const hasChildren = type === 'post' ? false : (adj.get(id)?.length || 0) > 0;
            
            visibleNodes.push({
                ...node,
                data: { ...node.data, isCollapsed, hasChildren }
            });

            // 如果未折叠，继续收集子节点
            if (!isCollapsed) {
                const children = adj.get(id) || [];
                children.forEach(collectVisible);
            }
        };

        // 从根节点开始收集
        // 根节点是没有父节点的节点，或者在 adj 中作为 source 但从未作为 target 出现的节点
        // 这里我们重新计算根节点，因为 layoutData 中没有直接存储 roots
        // 简单起见，我们可以遍历所有节点，找到那些没有入边的节点
        const allNodeIds = Array.from(positionedNodesMap.keys());
        const allTargets = new Set<string>();
        adj.forEach((targets) => targets.forEach(t => allTargets.add(t)));
        
        const roots = allNodeIds.filter(id => !allTargets.has(id));
        if (roots.length === 0) {
            const firstNodeId = allNodeIds[0];
            if (firstNodeId) roots.push(firstNodeId);
        }
        
        roots.forEach(collectVisible);

        return visibleNodes;
    });

    // 应用过滤（类型 / 关键词 / 保留父链）
    const filteredVisibleNodes = computed(() => {
        const base = computedVisibleNodes.value;
        if (!base.length) return base;

        const keyword = String(filterState.value.keyword || '').trim().toLowerCase();
        const types = filterState.value.types;

        const byId = new Map(base.map(n => [String(n.id), n]));
        const matches = new Set<string>();

        base.forEach((n) => {
            const type = String(n.data?.type || '');
            if (types.size > 0 && !types.has(type)) return;

            if (keyword) {
                const name = String(n.data?.name || '');
                const id = String(n.id || '');
                const hay = `${name} ${id} ${type}`.toLowerCase();
                if (!hay.includes(keyword)) return;
            }

            matches.add(String(n.id));
        });

        if (!filterState.value.keepParents || matches.size === 0) {
            return base.filter(n => matches.has(String(n.id)));
        }

        const include = new Set(matches);
        matches.forEach((id) => {
            let currentId = id;
            while (true) {
                const node = byId.get(currentId);
                const parentId = node?.data?.parentId ?? node?.parentId;
                if (parentId === undefined || parentId === null) break;
                const parentKey = String(parentId);
                if (include.has(parentKey)) break;
                include.add(parentKey);
                currentId = parentKey;
            }
        });

        return base.filter(n => include.has(String(n.id)));
    });

    const computedVisibleEdges = computed(() => {
        const visibleNodeIds = new Set(filteredVisibleNodes.value.map(n => n.id));
        const { adj } = layoutData.value;
        
        const visibleEdges: any[] = [];
        
        adj.forEach((targets, source) => {
            if (visibleNodeIds.has(source)) {
                targets.forEach(target => {
                    if (visibleNodeIds.has(target)) {
                        visibleEdges.push({
                            id: `e-${source}-${target}`,
                            source,
                            target,
                            type: 'bezier',
                            animated: false,
                            style: { stroke: 'color-mix(in srgb, var(--text-color) 18%, transparent)', strokeWidth: 2 },
                        });
                    }
                });
            }
        });
        
        return visibleEdges;
    });

    /**
     * 将计算出来的可见 nodes/edges 同步到 VueFlow 的 v-model
     * 需要尽量保留 VueFlow 内部写入的字段（dimensions/selected/computedPosition 等）。
     */
    function syncGraphModel() {
        const nextNodes = filteredVisibleNodes.value;
        const nextEdges = computedVisibleEdges.value;

        const existingById = new Map(graphNodes.value.map(n => [String(n.id), n]));

        graphNodes.value = nextNodes.map(n => {
            const existing = existingById.get(String(n.id));
            if (!existing) return n;
            return {
                ...existing,
                ...n,
                // data 以新数据为准，但保留 VueFlow 可能注入的其它 data 字段
                data: { ...existing.data, ...n.data },
                // position 以我们布局为准
                position: n.position,
            };
        });

        // edges 不太需要保留内部状态，直接覆盖即可
        graphEdges.value = nextEdges;
    }

    // 当可见节点或边发生变化时同步到 v-model
    watch([filteredVisibleNodes, computedVisibleEdges], () => {
        syncGraphModel();
    }, { immediate: true, deep: true });

    /**
     * 切换折叠状态
     */
    const handleNodeExpand = (nodeId: string) => {
        if (collapsedNodeIds.value.has(nodeId)) {
            // 展开操作
            collapsedNodeIds.value.delete(nodeId);
        } else {
            // 折叠操作
            collapsedNodeIds.value.add(nodeId);
        }

        // 折叠/展开会影响可见集合，主动同步一次以确保 VueFlow 模型即时刷新
        syncGraphModel();
    };

    /**
     * 处理节点点击
     */
    const handleNodeClick = async (node: any) => {
        // 取消选中（点空白区域）则显示统计数据
        // 注意：新版 Overview 数据里“顶层节点”可能没有 parentId，但依然是有效业务节点，不能当成 root。
        if (!node) {
            selectedNode.value = null;
            selectedNodeOverview.value = null;
            selectedNodeOverviewLoading.value = false;
            selectedNodeOverviewError.value = '';
        } else {
            // 从 graphNodes 中取最新引用（避免拿到 VueFlow 事件里的旧快照）
            selectedNode.value = graphNodes.value.find(n => String(n.id) === String(node.id)) || node;

            // 需求：右侧详情信息来自 OverviewDetail API，但不需要存储进组织架构 store
            // 依据节点类型拉取 OverviewDetail
            const appid = store.currentOrganization?.app_id;
            const atype = String(selectedNode.value?.data?.type || '');
            const id = Number(selectedNode.value?.id);

            // dataset 详情注入后会生成 type=view/workflow 的子节点：view 仅打开 InternalBrowser。
            if (atype === 'view') {
                const path = String(selectedNode.value?.data?.path || '');
                if (path) {
                    options?.onOpenInternalBrowser?.({ path });
                }
                // view 节点不拉 OverviewDetail
                selectedNodeOverview.value = null;
                selectedNodeOverviewLoading.value = false;
                selectedNodeOverviewError.value = '';
                return;
            }

            const canFetch = Boolean(appid)
                && (atype === 'department' || atype === 'post' || atype === 'agent' || atype === 'dataset' || atype === 'workflow')
                && Number.isFinite(id);

            if (!canFetch) {
                selectedNodeOverview.value = null;
                selectedNodeOverviewLoading.value = false;
                selectedNodeOverviewError.value = '';
                return;
            }

            const reqId = ++overviewRequestSeq.value;
            selectedNodeOverviewLoading.value = true;
            selectedNodeOverviewError.value = '';

            // dataset：详情返回的 assets 不再进入右侧详情；改为注入图谱子节点（type=asset.atype）。
            if (atype === 'dataset') {
                selectedNodeOverview.value = null;

                const datasetNodeId = String(selectedNode.value?.id);
                const res = await GetOverViewDetail(appid as string, atype, id);
                // 防止快速切换节点导致旧请求覆盖新请求
                if (reqId !== overviewRequestSeq.value) return;

                if (!res.ok || !res.data) {
                    selectedNodeOverviewError.value = '获取节点详情失败';
                    selectedNodeOverviewLoading.value = false;
                    return;
                }

                const dataAny = res.data as any;
                const assets: OverviewDatasetAsset[] = Array.isArray(dataAny?.data) ? dataAny.data : [];

                const assetNodes = assets
                    .filter((a) => a && (a as any).id !== undefined && (a as any).id !== null)
                    .map((a) => {
                        const assetId = String(a.id);
                        const assetType = String(a.atype || 'asset');
                        const name = String(a.name || a.asset_name || assetType || assetId);
                        const path = typeof a.asset_name === 'string' ? a.asset_name : undefined;
                        return {
                            id: `asset-${datasetNodeId}-${assetId}`,
                            parentId: datasetNodeId,
                            name,
                            type: assetType,
                            description: a.description ?? undefined,
                            path,
                            raw: a,
                        };
                    });

                const nextMap = new Map(datasetAssetNodesByDatasetId.value);
                nextMap.set(datasetNodeId, assetNodes);
                datasetAssetNodesByDatasetId.value = nextMap;

                selectedNodeOverviewLoading.value = false;
                return;
            }

            const res = await GetOverViewDetail(appid as string, atype, id);
            // 防止快速切换节点导致旧请求覆盖新请求
            if (reqId !== overviewRequestSeq.value) return;

            if (res.ok) {
                selectedNodeOverview.value = res.data;

                // workflow：详情里可能返回 config.path，打开 InternalBrowser
                if (atype === 'workflow') {
                    const dataAny = res.data as any;
                    const pathFromDetail = String(dataAny?.data?.[0]?.config?.path || '');
                    if (pathFromDetail) {
                        options?.onOpenInternalBrowser?.({ path: pathFromDetail });
                    }
                }
            } else {
                selectedNodeOverview.value = res.data;
                selectedNodeOverviewError.value = '获取节点详情失败';
            }
            selectedNodeOverviewLoading.value = false;
        }
    };

    return {
        nodes: graphNodes,
        edges: graphEdges,
        allNodes, // 导出新的 allNodes
        availableTypes,
        overviewLoading,
        overviewError,
        selectedNode,
        selectedNodeOverview,
        selectedNodeOverviewLoading,
        selectedNodeOverviewError,
        handleNodeExpand,
        handleNodeClick,
        connectionMode: ConnectionMode.Loose,
        nodesDraggable: false, // 禁用节点拖拽
        filterState,
        nodesConnectable: false, // 禁用节点连接
        elementsSelectable: true, // 允许选中节点以触发点击效果
    };
}
