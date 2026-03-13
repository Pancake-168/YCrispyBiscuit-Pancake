import type { ApiDepartment, ApiDeptUser, OrgNode } from '@/types/organization'
import { userInfoManager } from '@/utils/userInfo'

/**
 * 将扁平的部门列表转换为树结构，并返回扁平化索引
 * @param apiDepts 后端返回的部门列表
 */
export function buildOrgTree(apiDepts: ApiDepartment[]): { tree: OrgNode[], flatMap: Map<string, OrgNode> } {
    const tree: OrgNode[] = []
    const flatMap = new Map<string, OrgNode>()

    // 1. 创建所有节点并存入 Map
    apiDepts.forEach(dept => {
        const node: OrgNode = {
            id: String(dept.id),
            name: dept.name,
            type: (dept.parentId === null || dept.parentId === 0) ? 'org' : 'department',
            parentId: (dept.parentId !== null && dept.parentId !== 0) ? String(dept.parentId) : undefined,
            children: [] // 初始为空，等待构建树关系或后续填充人员
        }
        flatMap.set(node.id, node)
    })

    // 2. 构建树结构
    flatMap.forEach(node => {
        if (node.parentId && flatMap.has(node.parentId)) {
            const parent = flatMap.get(node.parentId)!
            parent.children?.push(node)
        } else {
            // 没有父节点或父节点不在数据中，视为根节点（通常是 Org）
            tree.push(node)
        }
    })

    return { tree, flatMap }
}

/**
 * 将 API 返回的成员列表转换为 OrgNode 节点
 * @param apiUsers 成员列表
 * @param parentId 父级部门ID
 */
export function transformMembers(apiUsers: ApiDeptUser[], parentId: string): { members: OrgNode[], botMapping: { user: string, bot: string }[] } {
    const members: OrgNode[] = []
    const botMapping: { user: string, bot: string }[] = []
    
    const currentUsername = userInfoManager.getLoginField("username")

    apiUsers.forEach(du => {
        // 兼容处理：API 返回的是 user_id 和 role_id，但旧类型定义可能是 userId 和 roleId
        // 这里优先取 user 对象中的信息
        if (!du || !du.user) {
            console.warn('[transformMembers] Skipping invalid member data:', du);
            return;
        }
        const { id, nickname, username, atype, assistant } = du.user
        const roleId = du.role_id || du.roleId
        
        // 更新本地用户信息逻辑 (保留原有逻辑)
        if (username === currentUsername) {
             const nickname1 = userInfoManager.getPersonalInfo('nickname')
             const NocobaseID1 = userInfoManager.getPersonalInfo('NocobaseID')
             if (!nickname1 || !NocobaseID1) {
                 userInfoManager.addField('NocobaseID', String(id));
                 userInfoManager.addField('nickname', nickname);
             }
        }

        // 收集 Bot 映射
        if (atype === 'user' && username && assistant) {
            botMapping.push({ user: username, bot: assistant })
        }

        const memberNode: OrgNode = {
            id: `user_${id}`,
            name: username || nickname || '',
            username,
            nickname,
            nocobaseID: String(id),
            type: 'person',
            parentId: parentId,
            role: roleId === 'admin' ? '主管' : '成员',
            children: [],
            atype: atype as 'user' | 'bot',
            assistant
        }
        members.push(memberNode)
    })

    return { members, botMapping }
}
