import type { ApiV2Department, ApiV2Post, OrgNodeV2, ApiV2PostUserRelation } from '@/types/organizationV2';

/**
 * 将 V2 版的 API 节点转换为前端 OrgNodeV2 节点
 */
function convertToOrgNode(apiNode: ApiV2Department | ApiV2Post): OrgNodeV2 {
    let nodeType: 'department' | 'post' | 'org' | 'person' = apiNode.atype;

    // 特殊逻辑：如果是根节点（通常 id=1 或 name=organization），转为 org
    // 注意：具体判断条件可能需要根据业务调整，这里暂定 parentId 为空或 0 即为根
    if (apiNode.atype === 'department' && (!apiNode.parentId || apiNode.parentId === 0)) {
        nodeType = 'org';
    }

    return {
        id: String(apiNode.id),
        name: apiNode.name,
        type: nodeType,
        parentId: apiNode.parentId ? String(apiNode.parentId) : undefined,
        description: apiNode.description,
        path: apiNode.path,
        children: [],
        loadStatus: 'skeleton' // 初始状态默认为骨架
    };
}

/**
 * 构建骨架树
 * 将平铺的 ApiV2Department[] 转换为层级树和扁平索引
 */
export function buildV2Skeleton(apiDepts: ApiV2Department[]): { tree: OrgNodeV2[], flatMap: Map<string, OrgNodeV2> } {
    const tree: OrgNodeV2[] = [];
    const flatMap = new Map<string, OrgNodeV2>();

    // 1. 实例化所有节点
    apiDepts.forEach(dept => {
        // 其实 skeleton 阶段只会有 department，但为了类型安全
        const node = convertToOrgNode(dept);
        node.loadStatus = 'skeleton'; // 明确标记
        flatMap.set(node.id, node);
    });

    // 2. 组装树关系
    flatMap.forEach(node => {
        if (node.parentId && flatMap.has(node.parentId)) {
            const parent = flatMap.get(node.parentId)!;
            // 务必初始化 children
            if (!parent.children) parent.children = [];
            parent.children.push(node);
        } else {
            // 没有父级，视为根节点
            tree.push(node);
        }
    });

    return { tree, flatMap };
}

/**
 * 合并子级详情
 * 将 GetDepartmentChildrenV2 返回的子级列表（SubDepts + Posts）合并到指定节点中
 * @param parentNode 待填充的父节点
 * @param apiChildren API 返回的子级数组
 * @param flatMap 全局的扁平索引（用于更新引用）
 */
export function mergeV2Children(
    parentNode: OrgNodeV2, 
    apiChildren: (ApiV2Department | ApiV2Post)[],
    flatMap: Map<string, OrgNodeV2>
): void {
    if (!parentNode) return;

    // 1. 将 API 数据转为节点
    const newNodes = apiChildren.map(item => {
        // 如果是 Post，直接转换
        // 如果是 Dept，可能已经在 flatMap 里了，也可能是新出现的
        return convertToOrgNode(item);
    });

    // 2. 合并逻辑
    // 策略：
    // - 只要是 Post (职位)，无条件信任 API 返回的列表（替换或更新）。
    // - 如果是 Department (部门)，优先使用 flatMap 中已存在的对象（因为那上面可能已经挂载了它自己的子部门），
    //   如果 flatMap 中没有，则视为新增部门，加入 Map。

    // 使用 Map 暂存合并后的 children，Key 为 ID
    const mergedChildrenMap = new Map<string, OrgNodeV2>();

    // 先把现有的 children 放入暂存区 (防止丢失那些 API 没返回但我们本地已有的孙子节点结构？)
    // 但注意：GetDepartmentChildrenV2 理论上返回的是该部门下 *完整* 的直属子级。
    // 如果我们完全信任 API，应该以 API 为准。
    // 唯一需要保留的是：如果某个子部门对象已经在内存中并且被用户展开过（有了 children），我们需要保留那个 *对象引用*，而不是用新的空对象覆盖它。
    
    if (parentNode.children) {
        parentNode.children.forEach(child => mergedChildrenMap.set(child.id, child));
    }

    // 遍历新数据进行更新
    newNodes.forEach(newNode => {
        if (newNode.type === 'department' || newNode.type === 'org') {
             // 部门类型：查重
             if (flatMap.has(newNode.id)) {
                 // 内存中已有此部门，我们保留内存中的对象（它可能已经有了自己的 children）
                 // 但我们可以更新它的一些基础属性（如名字变更）
                 const existingNode = flatMap.get(newNode.id)!;
                 existingNode.name = newNode.name;
                 existingNode.description = newNode.description;
                 existingNode.path = newNode.path;
                 // 不触碰 existingNode.children
                 mergedChildrenMap.set(newNode.id, existingNode);
             } else {
                 // 内存中没有，是新部门
                 flatMap.set(newNode.id, newNode); // 加入全局索引
                 mergedChildrenMap.set(newNode.id, newNode);
             }
        } else {
            // 职位类型 (Post)：通常没有子级，直接覆盖或添加
            // 职位也加入 flatMap 吗？建议加入，方便全局查找
            flatMap.set(newNode.id, newNode);
            mergedChildrenMap.set(newNode.id, newNode);
        }
    });

    // 虽然 map 里去重了，但我们最终的顺序应该以 API 返回的顺序优先？
    // 或者按类型排序（部门在前，职位在后）
    // 这里简单地重置 children 列表
    parentNode.children = Array.from(mergedChildrenMap.values());
    
    // 标记状态
    parentNode.loadStatus = 'detail';
}

/**
 * 将 API 返回的 User 关系转换为 OrgNodeV2 (type='person')
 * 为了兼容旧版 UI，使用 'person' 类型
 */
function convertUserToOrgNode(relationResult: ApiV2PostUserRelation, parentPostId: string): OrgNodeV2 {
    const user = relationResult.user;
    // 构造唯一的 ID，防止 User 在不同 Post 下重复导致 key 冲突（如果有要求全局唯一）
    // 但通常 node.id 在树里应该是唯一的。如果是同一个 User 在不同 Post 兼职，
    // 他们的 ID 可能会重复。为了安全，可以使用 relationResult.id (关系ID) 作为节点ID，
    // 或者组合 ID "post-6-user-2"。
    // 鉴于旧版可能依赖 id 去查用户详情，我们最好保留 user.id 或 relationResult.id。
    // 旧版逻辑里 id 是用户的 id。如果同一个用户出现多次，Vue 的 :key 可能会报错。
    // 建议使用 relationResult.id (这是唯一的)。
    
    return {
        id: String(user.id), // 暂时还是用 user.id，因为业务逻辑可能需要拿着这个 id 去调 API
        // 实际上如果同一个用户在两个部门，Tree 组件可能会报 duplicate key。
        // 如果报错，需要改为 `${parentPostId}-${user.id}` 并修改 UI 里的点击事件处理。
        // 先假设用 relationResult.id (自增主键，绝对唯一) 作为树节点 ID ? 
        // 不，旧 UI 点击 Person 会直接拿 item.id 去跳转详情。必须是 UserId。
        // 如果 key 冲突，再说。
        
        name: user.nickname || user.username,
        type: 'person', // 关键：伪装成旧版 Person，让 UI 渲染头像
        parentId: parentPostId,
        description: `@${user.username}`, // 暂时把账号放在描述里

        // 让 UI 可以直接访问 item.username / item.avatar 等
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        
        // 扩展字段适配
        // username, role, avatar 等可能需要扩展 OrgNodeV2 接口或者用 as any
        // 但为了 TS 类型安全，最好只用标准字段。
        // 如果 UI 强依赖 avatar，OrgNodeV2 可能需要加 avatar? 字段。
    } as OrgNodeV2; 
}


/**
 * 合并职位下的人员
 * 将 FetchPostUsersV2 返回的 Users 数据挂载到对应的 Post 节点下
 */
export function mergePostUsers(
    postNode: OrgNodeV2,
    apiUsers: ApiV2PostUserRelation[],
    flatMap: Map<string, OrgNodeV2>
): void {
    if (!postNode || postNode.type !== 'post') return;

    // 1. 转换
    const personNodes = apiUsers.map(u => convertUserToOrgNode(u, postNode.id));

    // 2. 挂载
    // 因为是人员列表，我们假设每次都是全量刷新该 Post 下的人员
    postNode.children = personNodes;
    
    // 3. 将人员也加入 flatMap 吗？
    // 如果加入 flatMap，可能导致 id 冲突（如果一个人兼职多岗）。
    // 策略：人员作为叶子节点，纯展示用，暂时不加入 flatMap，以免污染索引。
    // 或者：如果必须加入，使用 composite key。
    // 这里暂时不加入 flatMap。
}
