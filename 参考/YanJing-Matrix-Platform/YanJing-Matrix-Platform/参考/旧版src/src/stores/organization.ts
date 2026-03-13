import { ref ,computed} from 'vue'
import { defineStore } from 'pinia'
import type { OrgNode, ApiDepartment, ApiDeptUser, Application } from '@/types/organization'
import { buildOrgTree, transformMembers } from '@/services/Project/Organization/data/apiOrgAdapter'
import { userInfoManager } from '@/utils/userInfo'

export const useOrganizationStore = defineStore('organization', () => {
    // 状态
    // 新增：组织列表元数据 (从 Project_Start 获取)
    const organizationList = ref<Application[]>([])

    // 改造：多组织树存储 (Key: application_id, Value: OrgNode[])
    // 这就是所谓的“二维”存储，每个 AppId 对应一棵树
    const orgTrees = ref<Map<string, OrgNode[]>>(new Map())
    
    // 改造：多组织扁平索引 (Key: application_id, Value: Map<deptId, OrgNode>)
    const flatDeptMaps = ref<Map<string, Map<string, OrgNode>>>(new Map())

    // 兼容旧代码的计算属性：获取当前选中组织的树
    const orgTree = computed(() => {
        if (!currentOrganization.value?.application_id) return []
        return orgTrees.value.get(currentOrganization.value.application_id) || []
    })

    // 兼容旧代码的计算属性：获取当前选中组织的索引
    const flatDeptMap = computed(() => {
        if (!currentOrganization.value?.application_id) return new Map()
        return flatDeptMaps.value.get(currentOrganization.value.application_id) || new Map()
    })

    // 用户-Bot 映射表 (key: username, value: bot_username)
    const userBotMap = ref<Map<string, string>>(new Map())
    
    // 标记数据是否已加载 (Key: application_id)
    const loadedOrgs = ref<Set<string>>(new Set())
    // 兼容属性
    const isLoaded = computed(() => {
        if (!currentOrganization.value?.application_id) return false
        return loadedOrgs.value.has(currentOrganization.value.application_id)
    })

    // 当前选中的组织（用于左侧显示和全局上下文）
    const currentOrganization = ref<Application | null>(null)

    // 下拉框状态
    const isDropdownOpen = ref(false)
    const dropdownTriggerElement = ref<HTMLElement | null>(null)

    // Actions
    
    /**
     * 设置组织列表元数据
     */
    function setOrganizationList(list: Application[]) {
        organizationList.value = list
    }

    /**
     * 设置当前组织
     */
    function setCurrentOrganization(org: Application | null) {
        currentOrganization.value = org
    }

    /**
     * 切换组织
     * 更新 Store 状态并持久化到 LocalStorage
     */
    function switchOrganization(org: Application) {
        setCurrentOrganization(org)
        userInfoManager.addField('CURRENTORGANIZATION', org)
        closeDropdown()
        console.log('[OrganizationStore] Switched to organization:', org.application_name)
    }

    /**
     * 打开组织切换下拉框
     */
    function openDropdown(trigger: HTMLElement | null) {
        dropdownTriggerElement.value = trigger
        isDropdownOpen.value = true
    }

    /**
     * 关闭组织切换下拉框
     */
    function closeDropdown() {
        isDropdownOpen.value = false
        dropdownTriggerElement.value = null
    }

    /**
     * 初始化组织架构树（骨架）
     * @param appId 应用ID (application_id)
     * @param apiDepts 后端返回的扁平部门列表
     */
    function initOrganizationTree(appId: string, apiDepts: ApiDepartment[]) {
        const { tree, flatMap } = buildOrgTree(apiDepts)
        orgTrees.value.set(appId, tree)
        flatDeptMaps.value.set(appId, flatMap)
        loadedOrgs.value.add(appId)
        console.log(`[OrganizationStore] Tree initialized for ${appId}`, { nodes: flatMap.size, roots: tree.length })
    }

    /**
     * 向指定部门填充成员数据（血肉）
     * @param appId 应用ID
     * @param deptId 部门ID
     * @param apiUsers 后端返回的成员列表
     */
    function fillDepartmentMembers(appId: string, deptId: string, apiUsers: ApiDeptUser[]) {
        const appMap = flatDeptMaps.value.get(appId)
        if (!appMap) {
             console.warn(`[OrganizationStore] App ${appId} not found in maps`)
             return
        }
        
        const deptNode = appMap.get(deptId)
        if (!deptNode) {
            console.warn(`[OrganizationStore] Department ${deptId} not found in tree of ${appId}`)
            return
        }

        // 转换成员数据
        const { members, botMapping } = transformMembers(apiUsers, deptId)

        // 更新 Bot 映射
        botMapping.forEach(({ user, bot }) => {
            userBotMap.value.set(user, bot)
        })

         console.log('当前 userBotMap 数据:', userBotMap.value) 

        // 关键步骤：将成员合并到部门的 children 中
        // 策略：先移除旧的 person 节点（如果有），再添加新的，保留子部门节点
        const existingChildren = deptNode.children || []
        const subDepartments = existingChildren.filter(child => child.type !== 'person')
        
        // 重新组合：子部门 + 新成员
        deptNode.children = [...subDepartments, ...members]
        
        console.log(`[OrganizationStore] Filled ${members.length} members into Dept ${deptId} of App ${appId}`)
    }

    /**
     * 获取用户的 Bot 助手账号
     */
    function getBotUsername(username: string): string | undefined {
        return userBotMap.value.get(username)
    }

    /**
     * 清空数据
     */
    function clear() {
        orgTrees.value.clear()
        flatDeptMaps.value.clear()
        userBotMap.value.clear()
        loadedOrgs.value.clear()
        organizationList.value = []
        currentOrganization.value = null
    }

    return {
        organizationList,
        orgTrees,
        flatDeptMaps,
        orgTree, // 保持兼容
        flatDeptMap, // 保持兼容
        userBotMap,
        isLoaded, // 保持兼容
        currentOrganization,
        isDropdownOpen,
        dropdownTriggerElement,
        setOrganizationList,
        initOrganizationTree,
        fillDepartmentMembers,
        getBotUsername,
        setCurrentOrganization,
        switchOrganization,
        openDropdown,
        closeDropdown,
        clear
    }
})
