import type { OrgNode,MenuItem } from '@/types/organization'
import { removePrefixSuffix } from '@/utils/stringUtils'
import { API_URLS,MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import {useOrganizationStore} from '@/stores/organization'
import axios from 'axios'

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { type: 'org', text: '组织架构', prefix: '└ ' },
  { type: 'dept', text: '所在部门名称', prefix: '└ ' },
  { type: 'agent', text: 'Agent助理', prefix: '└ ' }
]

// 获取所有组织架构树（分页版）
export async function fetchAllOrgTrees(force: boolean = false, externalStore?: any): Promise<OrgNode[]> {
  const store = externalStore || useOrganizationStore()
  
  // 如果已经加载过且非强制刷新，直接返回 Store 中的树
  if (!force && store.isLoaded && store.orgTree.length > 0) {
      return store.orgTree
  }

  const currentOrg = store.currentOrganization

  if (!currentOrg || !currentOrg.application_id) {
    console.warn('[fetchAllOrgTreesNew] 未找到当前组织信息，将返回空组织树')
    return []
  }

  const normalizedAppId = removePrefixSuffix(currentOrg.application_id, "!", MATRIX_SERVER_URL_TAIL)
  const pageSize = 200
  let allDepts: any[] = []

  try {
    // 获取第一页数据
    const firstRes = await axios({
      url: API_URLS.DEPARTMENTS_PAGED(normalizedAppId, 1, pageSize),
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    })

    const firstData = firstRes.data
    if (!firstData || !firstData.data) {
      console.warn('[fetchAllOrgTreesNew] 第一页数据为空')
      store.initOrganizationTree(currentOrg.application_id, [])
      return []
    }

    allDepts = allDepts.concat(firstData.data)
    const totalPage = firstData.meta ? firstData.meta.totalPage : 1

    // 循环获取剩余页数据
    if (totalPage > 1) {
      const promises = []
      for (let page = 2; page <= totalPage; page++) {
        promises.push(
          axios({
            url: API_URLS.DEPARTMENTS_PAGED(normalizedAppId, page, pageSize),
            method: 'GET',
            headers: {
              'accept': 'application/json'
            }
          })
        )
      }

      const results = await Promise.all(promises)
      results.forEach(res => {
        if (res.data && res.data.data) {
          allDepts = allDepts.concat(res.data.data)
        }
      })
    }

    console.log(`[fetchAllOrgTreesNew] 共获取 ${allDepts.length} 条部门数据`)
    store.initOrganizationTree(currentOrg.application_id, allDepts)

    

    return store.orgTree

  } catch (e: any) {
    if (axios.isAxiosError(e) && e.response && (e.response.status === 400 || e.response.status === 404)) {
      console.warn(`[fetchAllOrgTreesNew] 组织 ${currentOrg.application_name} (${normalizedAppId}) 获取部门数据失败 (可能是空组织或无权限): ${e.message}`)
      // 即使失败，也要初始化一个空树，防止后续操作报错
      store.initOrganizationTree(currentOrg.application_id, [])
    } else {
      console.error('[fetchAllOrgTreesNew] 获取组织数据失败:', e)
      store.clear()
    }
    // 发生错误时返回空数组，避免前端无限加载或报错，特别是新账号可能没有组织数据导致400/404
    return []
  }
}

/**
 * 获取部门详情（包含人员）并更新到树中
 */
export async function fetchDepartmentDetail(deptId: string): Promise<void> {
    const store = useOrganizationStore()
    const currentOrg = store.currentOrganization
    if (!currentOrg || !currentOrg.application_id) return

    const normalizedAppId = removePrefixSuffix(currentOrg.application_id, "!", MATRIX_SERVER_URL_TAIL)

    try {
        const res = await axios({
            url: API_URLS.DEPARTMENT_DETAIL(normalizedAppId, deptId),
            method: 'GET',
            headers: { 'accept': 'application/json' }
        })
        
        // 假设返回的是数组，取第一个
        const deptData = Array.isArray(res.data) ? res.data[0] : res.data
        
        if (deptData && deptData.du) {
            // 核心改变：调用 Store 填充成员
            store.fillDepartmentMembers(currentOrg.application_id, deptId, deptData.du)
        }
    } catch (e) {
        console.error(`[fetchDepartmentDetail] Failed for ${deptId}`, e)
    }
}

/**
 * 获取用户所在部门
 * 注意：由于初始树不包含人员，此函数可能无法在未加载详情的情况下找到用户
 */
export async function fetchUserDepartments(): Promise<Record<string, OrgNode>> {
    const store = useOrganizationStore()
    if (!store.isLoaded) {
        await fetchAllOrgTrees()
    }
    // 暂时返回空，等待后续明确如何获取“我的部门”
    return {} 
}

export function getBotUsernameByUser(user: string): string | null {
    const store = useOrganizationStore()
    return store.getBotUsername(user) || null
}
