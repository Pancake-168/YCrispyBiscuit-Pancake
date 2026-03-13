import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { OrgNodeV2, ApplicationV2 } from '@/types/Organization';
import type { GetApplicationUserResponse } from '@/types/application';
import { FetchAllDepartmentsV2, FetchDepartmentChildrenAllV2 } from '@/services/Project/Organization/department';
import { FetchPostUsersV2 } from '@/services/Project/Organization/Post';
import { ApplicationSync, GetApplicationUser } from '@/services/Project/Organization/Application';
import { buildV2Skeleton, mergeV2Children, mergePostUsers } from '@/services/Project/Organization/adapter';
import { SystemStorageManager } from "@/utils/SystemStorage";
import { useWechatStore } from '@/stores/WeChat';
import { UpdateUserConfig } from '@/services/Project/UserConfig';
import type { UserConfig } from '@/types/UserConfig';

export const useOrganizationStore = defineStore('organizationV2', () => {
    // --- State ---

    // 1. 组织/应用列表
    const organizationList = ref<ApplicationV2[]>([]);

    // 2. 当前选中的应用
    const currentOrganization = ref<ApplicationV2 | null>(null);

    // 3. 组织树 (AppID -> Root Nodes)
    // 存储每个应用的完整树结构
    const orgTrees = ref<Map<string, OrgNodeV2[]>>(new Map());

    // 4. 扁平索引 (AppID -> Map<NodeID, Node>)
    // 包含所有已加载的 Department 和 Post，用于快速查找 (O(1) Access)
    const flatMaps = ref<Map<string, Map<string, OrgNodeV2>>>(new Map());

    // 5. 应用成员列表缓存 (AppID -> GetApplicationUserResponse)
    // 用于按 appid 存储应用下用户列表（接口 GetApplicationUser 的返回）
    const applicationUsersByAppId = ref<Map<string, GetApplicationUserResponse>>(new Map());

    // 状态标记
    const loadingSkeletons = ref<Set<string>>(new Set()); // 正在加载骨架的 AppID

    // UI 辅助：记录展开的节点 ID (Key: AppID, Value: Set<NodeID>)
    // 虽然通常由组件维护，但在 Store 维护可以保持展开状态跨路由持久化
    const expandedKeys = ref<Map<string, Set<string>>>(new Map());

    // UI 辅助：下拉菜单状态
    const dropdownVisible = ref(false);
    const triggerElement = ref<HTMLElement | null>(null);

    // --- Getters ---

    // 获取当前应用的根树
    const currentTree = computed(() => {
        if (!currentOrganization.value?.app_id) return [];
        return orgTrees.value.get(currentOrganization.value.app_id) || [];
    });

    // 获取当前应用的扁平索引
    const currentFlatMap = computed(() => {
        if (!currentOrganization.value?.app_id) return undefined;
        return flatMaps.value.get(currentOrganization.value.app_id);
    });

    // 获取当前应用的用户列表响应
    const currentApplicationUsers = computed(() => {
        const appId = currentOrganization.value?.app_id;
        if (!appId) return undefined;
        return applicationUsersByAppId.value.get(appId);
    });

    // --- Actions ---

    /**
     * 设置应用列表 (通常在登录或初始化时调用)
     */
    function setOrganizationList(list: unknown[]) {
        const v2List: ApplicationV2[] = list
            .filter((item): item is { app_id?: string | number; app_tag?: string; name?: string } => typeof item === 'object' && item !== null)
            .map(item => ({
                app_id: String(item.app_id ?? ''),
                app_tag: item.app_tag ?? '',
                name: item.name
            }));
        organizationList.value = v2List;
        console.log('[System:OrganizationStore:setOrganizationList]组织列表已更新:', v2List.length);
    }

    /**
     * 切换当前组织
     */
    function switchOrganization(org: ApplicationV2) {

        const persistCurrentOrgToUserConfig = async (appId: string) => {
            try {
                const localConfig = await SystemStorageManager.getUserConfig<UserConfig>();
                const nextConfig: UserConfig = {
                    ...(localConfig ?? {}),
                    currentOrg: appId
                };
                await SystemStorageManager.setUserConfig(nextConfig);
                await UpdateUserConfig(nextConfig);
            } catch (e) {
                console.warn('[System:OrganizationStore:switchOrganization] 写入 currentOrg 到用户配置失败', e);
            }
        };

        // 切换组织时触发一次后端同步（不阻塞 UI，失败仅日志）
        if (org.app_id) {
            ApplicationSync(String(org.app_id)).then(r => {
                if (!r.ok) {
                    console.warn('[System:OrganizationStore:switchOrganization] 应用同步失败 for', org.app_id);
                }
            }).catch(e => {
                console.warn('[System:OrganizationStore:switchOrganization] 应用同步异常 for ' + org.app_id, e);
            });

            // 切换组织时自动拉取并缓存该应用下的用户列表（不阻塞 UI，失败仅日志）
            const appId = String(org.app_id)
            const shouldLoadUsers = !applicationUsersByAppId.value.has(appId)
            if (shouldLoadUsers && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('app:globalLoading', {
                    detail: {
                        visible: true,
                        message: '正在加载组织成员...'
                    }
                }))
            }

            loadApplicationUsers(appId)
                .catch(e => {
                    console.warn('[System:OrganizationStore:switchOrganization] 应用用户列表拉取异常 for ' + appId, e);
                })
                .finally(() => {
                    if (shouldLoadUsers && typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('app:globalLoading', {
                            detail: {
                                visible: false,
                                message: '正在加载组织成员...'
                            }
                        }))
                    }
                })

                    persistCurrentOrgToUserConfig(appId)
        }

        currentOrganization.value = org;
        //    userInfoManager.addField('CURRENTORGANIZATION', org); // 与旧版共用 Key
        const wechatStore = useWechatStore();
        if (wechatStore.userProfile?.username) {
            SystemStorageManager.setUserField(wechatStore.userProfile?.username, 'CURRENTORGANIZATION', org);
        }
        else {
            console.log('[System:OrganizationStore:switchOrganization] 当前用户信息未加载完成，无法存储 CURRENTORGANIZATION');
        }


        // 自动触发骨架加载
        if (org.app_id) {
            // 如果树还没有加载过，则加载
            if (!orgTrees.value.has(org.app_id)) {
                loadSkeleton(org.app_id);
            }
        }
    }

    /**
     * 加载骨架 (仅部门)
     * 策略：首先获取所有部门平铺数据，构建初步的树
     */
    async function loadSkeleton(appid: string, force = false) {
        if (!force && orgTrees.value.has(appid)) {
            // 即便树已存在，也要确保列表项的名称已被同步（修复 UserInfo 刷新导致名称丢失的问题）
            const tree = orgTrees.value.get(appid);
            if (tree && tree.length > 0) {
                const rootNode = tree[0];
                const listItem = organizationList.value.find(item => String(item.app_id) === String(appid));
                if (rootNode?.name) {
                    if (listItem && !listItem.name) { // 仅当名称丢失时同步
                        listItem.name = rootNode.name;
                        console.log(`[System:OrganizationStore:loadSkeleton] 从现有骨架恢复名称: ${rootNode.name}`);
                    }
                    // 同步当前选中项
                    if (currentOrganization.value && String(currentOrganization.value.app_id) === String(appid) && !currentOrganization.value.name) {
                        currentOrganization.value.name = rootNode.name;
                    }
                }
            }
            return;
        }




        loadingSkeletons.value.add(appid);
        try {
            const res = await FetchAllDepartmentsV2(appid);
            if (res.ok && res.data?.data) {
                const { tree, flatMap } = buildV2Skeleton(res.data.data);

                orgTrees.value.set(appid, tree);
                flatMaps.value.set(appid, flatMap);

                // 尝试从骨架中获取根节点名称(通常是第一个节点)，更新当前应用名称
                const rootNode = tree[0];
                if (rootNode) {
                    console.log(`[System:OrganizationStore:loadSkeleton] 获取到根节点: ${rootNode.name} (${rootNode.id})`);

                    // 1. 更新列表中的名称
                    // 使用 String 转换确保类型匹配
                    const listItem = organizationList.value.find(item => String(item.app_id) === String(appid));
                    if (listItem) {
                        listItem.name = rootNode.name;
                        console.log(`[System:OrganizationStore:loadSkeleton] 已更新列表项名称: ${listItem.name}`);
                    }

                    // 2. 如果当前选中的组织就是正在加载的这个，也立即更新
                    if (currentOrganization.value && String(currentOrganization.value.app_id) === String(appid)) {
                        currentOrganization.value.name = rootNode.name;
                    }
                }

                console.log(`[System:OrganizationStore:loadSkeleton] 骨架加载完成 for ${appid}. Size: ${flatMap.size}`);

                // [Enhanced] 初始化时，遍历所有部门节点，并发获取其职位信息 (但不获取职位下人员)
                // 仅对 Department 和 Org 类型节点执行 (修正: 根节点 type='org' 也要去获取下面挂的一级职位)
                const deptNodes = Array.from(flatMap.values()).filter(n => n.type === 'department' || n.type === 'org');
                if (deptNodes.length > 0) {
                    console.log(`[System:OrganizationStore:loadSkeleton] 开始预加载 ${deptNodes.length} 个节点的职位信息...`);
                    // 使用 Promise.all 并发请求，注意控制并发量以免堵塞
                    // 简单起见，这里直接全部并发，如果部门过多考虑分批
                    const detailPromises = deptNodes.map(node => loadNodeDetail(appid, String(node.id)));
                    await Promise.all(detailPromises);
                    console.log(`[System:OrganizationStore:loadSkeleton] 所有部门职位预加载完成`);
                }

            } else {
                console.warn(`[System:OrganizationStore:loadSkeleton] 骨架加载失败或为空 for ${appid}`);
            }
        } catch (e) {
            console.error(`[System:OrganizationStore:loadSkeleton] 骨架加载异常 for ${appid}`, e);
        } finally {
            loadingSkeletons.value.delete(appid);
        }
    }

    /**
     * 加载节点详情 (Sub-Depts + Posts)
     * 策略：
     * 1. 只有当用户点击“展开”某个部门时，或者为了获取“血肉”时调用
     * 2. 调用 API 获取子级，包含 Department 和 Post
     * 3. 使用 merge 策略将新数据合并到现有树中
     */
    async function loadNodeDetail(appid: string, nodeId: string) {
        const map = flatMaps.value.get(appid);
        if (!map) return;

        const node = map.get(nodeId);
        if (!node) {
            console.warn(`[System:OrganizationStore:loadNodeDetail] 节点 ${nodeId} 没有在扁平索引中找到，无法加载详情`);
            return;
        }

        node.loadStatus = 'loading'; // 设置加载状态

        try {
            const res = await FetchDepartmentChildrenAllV2(appid, Number(nodeId));
            // 注意：API 返回结构可能是单个对象也可能是数组包裹
            // 修正：根据 department.ts 实现，如果不分页拼接，直接返回的是对象 { id:..., child: { data:[...] } }
            // 所以正确路径通常是 res.data.child.data
            // 为了兼容性，保留原来的尝试路径，但优先取直接路径
            const targetData = res.data?.child?.data || res.data?.data?.[0]?.child?.data;

            if (res.ok && targetData) {
                mergeV2Children(node, targetData, map);
             //   console.log(`[System:OrganizationStore:loadNodeDetail] 节点 ${nodeId} 详情加载完成. 子节点数量: ${node.children?.length}`);

                // 关键：Map 内部变更不会总是触发依赖的响应式更新。
                // 这里通过替换引用，确保列表/面包屑等依赖 flatMaps 的 computed 能刷新。
                flatMaps.value.set(appid, new Map(map));
                flatMaps.value = new Map(flatMaps.value);
            } else {
                // 如果没有数据，可能是一个空部门，但也标记为已加载详情
                node.loadStatus = 'detail';

                // 同样触发一次引用更新，避免外部仍看到旧状态
                flatMaps.value.set(appid, new Map(map));
                flatMaps.value = new Map(flatMaps.value);
            }
        } catch (e) {
            console.warn(`[System:OrganizationStore:loadNodeDetail] 节点 ${nodeId} 详情加载异常`, e);
            node.loadStatus = 'skeleton'; // 异常状态下重置，允许重试
        }
    }

    /**
     * 加载职位详情 (Users)
     */
    async function loadPostDetail(appid: string, nodeId: string) {
        const map = flatMaps.value.get(appid);
        if (!map) return;
        const node = map.get(nodeId);
        if (!node || node.type !== 'post') return;

        node.loadStatus = 'loading'; // 设置加载状态

        try {
            const res = await FetchPostUsersV2(appid, Number(nodeId));
            // 新 API return: { data: { users: [...] }, meta: {...} }
            const usersData = res.data?.data?.users;

            if (res.ok && Array.isArray(usersData)) {
                mergePostUsers(node, usersData);
                // 标记职位节点详情已加载完成（人员已挂载到 children）
                node.loadStatus = 'detail';

                // 关键：Map 内部变更不会总是触发依赖的响应式更新。
                // 这里通过替换引用，确保 SystemMap 等依赖 currentFlatMap 的 computed/watch 能刷新。
                flatMaps.value.set(appid, new Map(map));
                flatMaps.value = new Map(flatMaps.value);

                console.log(`[System:OrganizationStore:loadPostDetail] 职位 ${nodeId} 人员加载完成. 人员数量: ${node.children?.length}`);
            } else {
                node.loadStatus = 'detail'; // 无人

                // 同样触发一次引用更新，避免外部仍看到旧状态
                flatMaps.value.set(appid, new Map(map));
                flatMaps.value = new Map(flatMaps.value);
            }
        } catch (e) {
            console.error(`[System:OrganizationStore:loadPostDetail] 职位 ${nodeId} 详情加载异常`, e);
            node.loadStatus = 'skeleton'; // 异常状态下重置，允许重试
        }
    }

    /**
     * 加载并缓存应用成员列表（按 appid 键值对存储）
     */
    async function loadApplicationUsers(appid: string, force = false) {
        if (!force && applicationUsersByAppId.value.has(appid)) return;

        try {
            const res = await GetApplicationUser(appid);
            if (res.ok && res.data) {
                applicationUsersByAppId.value.set(appid, res.data);
                // Map 内部变更可能不触发响应式更新，替换引用
                applicationUsersByAppId.value = new Map(applicationUsersByAppId.value);
                console.log('[System:OrganizationStore:loadApplicationUsers] GetApplicationUser 加载完成 for', appid);
                console.log('[System:OrganizationStore:loadApplicationUsers] 应用用户数量:', res.data.data.length);
                console.log('[System:OrganizationStore:loadApplicationUsers] 应用用户:', res.data.data);
            } else {
                console.warn('[System:OrganizationStore:loadApplicationUsers] GetApplicationUser 失败或为空 for', appid);
            }
        } catch (e) {
            console.warn('[System:OrganizationStore:loadApplicationUsers] GetApplicationUser 异常 for ' + appid, e);
        }
    }

    /**
     * 从本地缓存中移除一个节点（以及已加载的子树）。
     * 适用于删除部门/职位后，避免因为 loadStatus='detail' 导致 refresh 被短路。
     */
    function removeNodeFromCache(appid: string, nodeId: string) {
        const map = flatMaps.value.get(appid);
        if (!map) return;

        const node = map.get(String(nodeId));
        if (!node) return;

        const idsToRemove: string[] = [];
        const collect = (n: OrgNodeV2 | undefined) => {
            if (!n) return;
            idsToRemove.push(String(n.id));
            for (const child of n.children || []) {
                collect(child);
            }
        };
        collect(node);

        // 1) 从父节点 children 中移除
        const parentId = node.parentId;
        if (parentId) {
            const parent = map.get(String(parentId));
            if (parent?.children?.length) {
                parent.children = parent.children.filter(c => !idsToRemove.includes(String(c.id)));
            }
        } else {
            // 没有 parentId 时（极少数情况），从根树里移除
            const roots = orgTrees.value.get(appid);
            if (roots?.length) {
                orgTrees.value.set(appid, roots.filter(r => !idsToRemove.includes(String(r.id))));
                orgTrees.value = new Map(orgTrees.value);
            }
        }

        // 2) expandedKeys 里也清掉，避免残留展开状态
        const exp = expandedKeys.value.get(appid);
        if (exp) {
            idsToRemove.forEach(id => exp.delete(String(id)));
        }

        // 3) 从 flatMap 中移除（包括已加载的子树）
        for (const id of idsToRemove) {
            map.delete(String(id));
        }

        // 4) 触发响应式刷新（Map 内部变更可能不触发）
        flatMaps.value.set(appid, new Map(map));
        flatMaps.value = new Map(flatMaps.value);
    }

    // --- Helpers ---

    /**
     * 快速获取节点对象
     */
    function getNode(appid: string, nodeId: string) {
        return flatMaps.value.get(appid)?.get(nodeId);
    }

    /**
     * 记录节点展开状态
     */
    function setNodeExpanded(appid: string, nodeId: string, expanded: boolean) {
        if (!expandedKeys.value.has(appid)) {
            expandedKeys.value.set(appid, new Set());
        }
        const set = expandedKeys.value.get(appid)!;
        if (expanded) {
            set.add(nodeId);
            // 展开时自动尝试加载详情（如果还没加载）
            const node = getNode(appid, nodeId);
            if (node && node.loadStatus !== 'detail') {
                if (node.type === 'post') {
                    loadPostDetail(appid, nodeId);
                } else {
                    loadNodeDetail(appid, nodeId);
                }
            }
        } else {
            set.delete(nodeId);
        }
    }

    /**
     * 打开/关闭下拉菜单
     */
    function openDropdown(el: HTMLElement) {
        triggerElement.value = el;
        dropdownVisible.value = true;
    }

    function closeDropdown() {
        dropdownVisible.value = false;
        triggerElement.value = null;
    }

    function toggleDropdown(el: HTMLElement) {
        if (dropdownVisible.value) {
            closeDropdown();
        } else {
            openDropdown(el);
        }
    }

    return {
        // State
        organizationList,
        currentOrganization,
        orgTrees,
        flatMaps,
        applicationUsersByAppId,
        loadingSkeletons,
        expandedKeys, // 暴露给组件使用
        dropdownVisible,
        triggerElement,

        // Getters
        currentTree,
        currentFlatMap,
        currentApplicationUsers,

        // Actions
        setOrganizationList,
        switchOrganization,
        loadSkeleton,
        loadNodeDetail,
        loadPostDetail, // 导出新Action
        loadApplicationUsers,
        removeNodeFromCache,
        getNode,
        setNodeExpanded,
        openDropdown,
        closeDropdown,
        toggleDropdown
    };
});
