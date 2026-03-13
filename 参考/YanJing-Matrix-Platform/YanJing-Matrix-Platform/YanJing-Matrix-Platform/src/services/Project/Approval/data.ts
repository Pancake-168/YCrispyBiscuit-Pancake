import { API_URLS } from '@/apiUrls'
import { useWechatStore } from '@/stores/WeChat'
import { useOrganizationStore } from '@/stores/Organization'
import type {
    ApprovalPosition,
    ApprovalType,
    ApprovalTemplateActiveResult,
    ApprovalTodo,
    ApprovalTemplateUpsertInput,
    ApprovalSubmitInput,
    ApprovalActionInput,
    ApprovalTypeCreateInput,
    ApprovalMySubmission
} from '@/types/approval'



/**
 * 获取职位信息
 */
export async function ApprovalPositions(): Promise<ApprovalPosition[]> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    if (!token) {
        console.log('[System:Approval:ApprovalPositions] 没有 SSO loginToken，无法获取审批职位列表')
        return []
    }

    const organizationStore = useOrganizationStore();
    const appid = organizationStore.currentOrganization?.app_id || '';

    if (!appid) {
        console.log('[System:Approval:ApprovalPositions] 没有 app_id，无法获取审批职位列表')
        return []
    }


    try {
        const response = await fetch(API_URLS.ApprovalPositions(appid), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        if (response.ok) {
            const data = await response.json()
            console.log('[--------------------------------------System:Approval:ApprovalPositions] 成功获取审批职位列表', data)
            return (data || []) as ApprovalPosition[]
        } else {
            console.warn('[System:Approval:ApprovalPositions] 获取审批职位列表失败，状态码:', response.status)
            return []
        }
    } catch (error) {
        console.warn('[System:Approval:ApprovalPositions] 获取审批职位列表异常:', error)
        return []
    }
}


/**
 * 获取审批类型
 */
export async function ApprovalTypes(): Promise<ApprovalType[]> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    if (!token) {
        console.log('[System:Approval:ApprovalTypes] 没有 SSO loginToken，无法获取审批类型列表')
        return []
    }
    const organizationStore = useOrganizationStore();
    const appid = organizationStore.currentOrganization?.app_id || '';

    if (!appid) {
        console.log('[System:Approval:ApprovalTypes] 没有 app_id，无法获取审批职位列表')
        return []
    }

    try {
        const response = await fetch(API_URLS.ApprovalTypes(appid), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        if (response.ok) {
            const data = await response.json()
            return (data || []) as ApprovalType[]
        } else {
            console.warn('[System:Approval:ApprovalTypes] 获取审批类型列表失败，状态码:', response.status)
            return []
        }
    } catch (error) {
        console.warn('[System:Approval:ApprovalTypes] 获取审批类型列表异常:', error)
        return []
    }
}

/**
 * 获取模板详情，传递id
 */
export async function ApprovalTemplateDetail(id: number | string): Promise<ApprovalTemplateActiveResult | null> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    if (!token) {
        console.log('[System:Approval:ApprovalTemplateDetail] 没有 SSO loginToken，无法获取审批模板详情')
        return null
    }
    const organizationStore = useOrganizationStore();
    const appid = organizationStore.currentOrganization?.app_id || '';

    if (!appid) {
        console.log('[System:Approval:ApprovalTemplateDetail] 没有 app_id，无法获取审批职位列表')
        return null
    }
    try {
        const response = await fetch(API_URLS.ApprovalTemplateDetail(appid, id), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        if (response.ok) {
            const data = await response.json()
            return (data || null) as ApprovalTemplateActiveResult
        } else {
            console.warn('[System:Approval:ApprovalTemplateDetail] 获取审批模板详情失败，状态码:', response.status)
            return null
        }
    } catch (error) {
        console.warn('[System:Approval:ApprovalTemplateDetail] 获取审批模板详情异常:', error)
        return null
    }
}

/**
 * 获取已激活模板详情
 */
export async function ApprovalTemplateActive(typeCode: string = "purchase"): Promise<ApprovalTemplateActiveResult | null> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    if (!token) {
        console.log('[System:Approval:ApprovalTemplateActive] 没有 SSO loginToken，无法获取激活的审批模板')
        return null
    }
    const organizationStore = useOrganizationStore();
    const appid = organizationStore.currentOrganization?.app_id || '';

    if (!appid) {
        console.log('[System:Approval:ApprovalTemplateActive] 没有 app_id，无法获取激活的审批模板')
        return null
    }
    try {
        const response = await fetch(API_URLS.ApprovalTemplateActive(appid, typeCode), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        if (response.ok) {
            const data = await response.json()
            return (data || null) as ApprovalTemplateActiveResult
        } else {
            console.warn('[System:Approval:ApprovalTemplateActive] 获取激活的审批模板失败，状态码:', response.status)
            return null
        }
    } catch (error) {
        console.warn('[System:Approval:ApprovalTemplateActive] 获取激活的审批模板异常:', error)
        return null
    }
}


/**
 * 获取指定人员的todo列表
 */
export async function ApprovalTodos(): Promise<ApprovalTodo[]> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    const username = wechatStore.userProfile?.username || '';

    if (!token) {
        console.log('[System:Approval:ApprovalTodos] 没有 SSO loginToken，无法获取待办列表')
        return []
    }

    if (!username) {
        console.log('[System:Approval:ApprovalTodos] 没有用户名，无法获取待办列表')
        return []
    }

    const organizationStore = useOrganizationStore();
    const appid = organizationStore.currentOrganization?.app_id || '';

    if (!appid) {
        console.log('[System:Approval:ApprovalTodos] 没有 app_id，无法获取审批职位列表')
        return []
    }
    try {
        const response = await fetch(API_URLS.ApprovalTodos(appid, username), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        if (response.ok) {
            const data = await response.json()
            console.log('[System:Approval:ApprovalTodos] 成功获取待办列表', data)

            // 适配后端返回的数据结构 (snake_case -> camelCase)
            const mappedData = (data || []).map((item: any) => ({
                ...item,
                dataJson: item.data_json || item.dataJson || {}, 
                submitter: item.submitter_name || item.submitter,
                // 如果后端没有返回实例 createdAt，尝试使用当前节点的 createdAt 作为近似值
                createdAt: item.createdAt || item.created_at || item.currentNode?.createdAt
            }))

            return mappedData as ApprovalTodo[]
        } else {
            console.warn('[System:Approval:ApprovalTodos] 获取待办列表失败，状态码:', response.status)
            return []
        }
    } catch (error) {
        console.warn('[System:Approval:ApprovalTodos] 获取待办列表异常:', error)
        return []
    }
}

/**
 * 获取当前用户的全部审批提交列表
 */
export async function ApprovalMySubmissions(): Promise<ApprovalMySubmission[]> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';
    const username = wechatStore.userProfile?.username || '';

    if (!token) {
        console.log('[System:Approval:ApprovalMySubmissions] 没有 SSO loginToken，无法获取全部审批列表')
        return []
    }

    if (!username) {
        console.log('[System:Approval:ApprovalMySubmissions] 没有用户名，无法获取全部审批列表')
        return []
    }

    const organizationStore = useOrganizationStore();
    const appid = organizationStore.currentOrganization?.app_id || '';

    if (!appid) {
        console.log('[System:Approval:ApprovalMySubmissions] 没有 app_id，无法获取全部审批列表')
        return []
    }

    try {
        const response = await fetch(API_URLS.ListMySubmissions(appid, username), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })

        if (response.ok) {
            const data = await response.json()
            return (data || []) as ApprovalMySubmission[]
        } else {
            console.warn('[System:Approval:ApprovalMySubmissions] 获取全部审批列表失败，状态码:', response.status)
            return []
        }
    } catch (error) {
        console.warn('[System:Approval:ApprovalMySubmissions] 获取全部审批列表异常:', error)
        return []
    }
}


/**
 * 创建/更新审批模板
 */
export async function ApprovalTemplatesUpsert(input: ApprovalTemplateUpsertInput): Promise<ApprovalTemplateActiveResult | null> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    if (!token) {
        console.log('[System:Approval:ApprovalTemplatesUpsert] 没有 SSO loginToken，无法创建/更新模板')
        return null
    }
    const organizationStore = useOrganizationStore();
    const appid = organizationStore.currentOrganization?.app_id || '';

    if (!appid) {
        console.log('[System:Approval:ApprovalTemplatesUpsert] 没有 app_id，无法获取审批职位列表')
        return null
    }

    console.log('[System:Approval:ApprovalTemplatesUpsert] 创建/更新模板 Input:', JSON.stringify(input, null, 2))
    try {
        const response = await fetch(API_URLS.ApprovalTemplatesUpsert(appid), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(input)
        })
        console.log('[System:Approval:ApprovalTemplatesUpsert] 创建/更新模板 Response:', response)
        if (response.ok) {
            const data = await response.json()
            return (data || null) as ApprovalTemplateActiveResult
        } else {
            console.warn('[System:Approval:ApprovalTemplatesUpsert] 创建/更新模板失败，状态码:', response.status)
            return null
        }
    } catch (error) {
        console.warn('[System:Approval:ApprovalTemplatesUpsert] 创建/更新模板异常:', error)
        return null
    }
}


/**
 * 提交审批申请
 */
export async function ApprovalSubmit(input: Omit<ApprovalSubmitInput, 'submitter'>): Promise<any> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';
    const username = wechatStore.userProfile?.username || '';

    if (!token) {
        console.log('[System:Approval:ApprovalSubmit] 没有 SSO loginToken，无法提交审批')
        return null
    }
    
    if (!username) {
        console.log('[System:Approval:ApprovalSubmit] 没有用户名，无法提交审批')
        return null
    }

    const organizationStore = useOrganizationStore();
    const appid = organizationStore.currentOrganization?.app_id || '';

    if (!appid) {
        console.log('[System:Approval:ApprovalSubmit] 没有 app_id，无法获取审批职位列表')
        return []
    }
    try {
        const payload: ApprovalSubmitInput = {
            ...input,
            submitterName: username
        };
        
        console.log('[System:Approval:ApprovalSubmit] 提交审批 Payload:', JSON.stringify(payload, null, 2))

        const response = await fetch(API_URLS.ApprovalSubmit(appid), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        if (response.ok) {
            return await response.json()
        } else {
            console.warn('[System:Approval:ApprovalSubmit] 提交审批失败，状态码:', response.status)
            return null
        }
    } catch (error) {
        console.warn('[System:Approval:ApprovalSubmit] 提交审批异常:', error)
        return null
    }
}

/**
 * 执行审批动作
 */
export async function ApprovalAction(input: Omit<ApprovalActionInput, 'actor'>): Promise<any> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';
    const username = wechatStore.userProfile?.username || '';

    if (!token) {
        console.log('[System:Approval:ApprovalAction] 没有 SSO loginToken，无法执行审批动作')
        return null
    }
    
    if (!username) {
        console.log('[System:Approval:ApprovalAction] 没有用户名，无法执行审批动作')
        return null
    }

    const organizationStore = useOrganizationStore();
    const appid = organizationStore.currentOrganization?.app_id || '';

    if (!appid) {
        console.log('[System:Approval:ApprovalAction] 没有 app_id，无法获取审批职位列表')
        return []
    }
    try {
        const payload: ApprovalActionInput = {
            ...input,
            actorUsername: username
        };
console.log('[System:Approval:ApprovalAction] 执行审批动作 Payload:', JSON.stringify(payload, null, 2))
        const response = await fetch(API_URLS.ApprovalAction(appid), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        if (response.ok) {
            return await response.json()
        } else {
            console.warn('[System:Approval:ApprovalAction] 执行审批动作失败，状态码:', response.status)
            try {
                const errData = await response.json();
                console.warn('Error details:', errData);
            } catch {
                // ignore JSON parse error
            }
            return null
        }
    } catch (error) {
        console.warn('[System:Approval:ApprovalAction] 执行审批动作异常:', error)
        return null
    }
}

/**
 * 创建新的审批类型
 */
export async function ApprovalTypesCreate(payload: ApprovalTypeCreateInput): Promise<boolean> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    if (!token) {
        console.log('[System:Approval:ApprovalTypesCreate] 没有 SSO loginToken，无法创建审批类型')
        return false
    }

    const organizationStore = useOrganizationStore();
    const appid = organizationStore.currentOrganization?.app_id || '';

    if (!appid) {
        console.log('[System:Approval:ApprovalTypesCreate] 没有 app_id，无法创建审批类型')
        return false
    }

    try {
        const response = await fetch(API_URLS.CreateApprovalType(appid), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })

        if (response.ok) {
            console.log('[System:Approval:ApprovalTypesCreate] 创建审批类型成功')
            return true
        } else {
            console.warn('[System:Approval:ApprovalTypesCreate] 创建审批类型失败，状态码:', response.status)
            return false
        }
    } catch (error) {
        console.error('[System:Approval:ApprovalTypesCreate] 创建审批类型异常:', error)
        return false
    }
}




