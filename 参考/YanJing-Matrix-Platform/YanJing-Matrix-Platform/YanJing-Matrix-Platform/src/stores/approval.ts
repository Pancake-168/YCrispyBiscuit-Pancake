import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useOrganizationStore } from '@/stores/Organization' // 引入组织 Store

import {
    ApprovalAction,
    ApprovalPositions,
    ApprovalSubmit,
    ApprovalTemplateActive,
    ApprovalTemplatesUpsert,
    ApprovalMySubmissions,
    ApprovalTodos,
    ApprovalTypes,
    ApprovalTypesCreate,
} from '@/services/Project/Approval/data'

import type {
    ApprovalActionInput,
    ApprovalPosition,
    ApprovalSubmitInput,
    ApprovalTemplateActiveResult,
    ApprovalTemplateUpsertInput,
    ApprovalMySubmission,
    ApprovalTodo,
    ApprovalType,
    ApprovalTypeCreateInput,
} from '@/types/approval'

export const useApprovalStore = defineStore('approval', () => {
    const orgStore = useOrganizationStore()
    
    // 获取当前 AppID
    const currentAppId = computed(() => orgStore.currentOrganization?.app_id || '')

    // --- State (按 appid 存储的二维表) ---
    // 职位 Map: { [appid]: ApprovalPosition[] }
    const positionsMap = reactive<Record<string, ApprovalPosition[]>>({})

    // 审批类型 Map: { [appid]: ApprovalType[] }
    const approvalTypesMap = reactive<Record<string, ApprovalType[]>>({})
    
    // 当前激活的审批模板 Map: { [appid]: ApprovalTemplateActiveResult | null }
    const activeTemplateMap = reactive<Record<string, ApprovalTemplateActiveResult | null>>({})
    
    // 待办列表 Map: { [appid]: ApprovalTodo[] }
    const todosMap = reactive<Record<string, ApprovalTodo[]>>({})

    // 我的全部审批 Map: { [appid]: ApprovalMySubmission[] }
    const mySubmissionsMap = reactive<Record<string, ApprovalMySubmission[]>>({})


    // --- Getters (兼容旧代码，自动指向当前 AppID 的数据) ---
    // 职位
    const positions = computed(() => {
        const appId = currentAppId.value
        return appId && positionsMap[appId] ? positionsMap[appId] : []
    })

    // 审批类型
    const approvalTypes = computed(() => {
        const appId = currentAppId.value
        return appId && approvalTypesMap[appId] ? approvalTypesMap[appId] : []
    })
    
    // 当前激活的审批模板
    const activeTemplate = computed(() => {
        const appId = currentAppId.value
        return appId && activeTemplateMap[appId] ? activeTemplateMap[appId] : null
    })
    
    // 待办列表
    const todos = computed(() => {
        const appId = currentAppId.value
        return appId && todosMap[appId] ? todosMap[appId] : []
    })

    // 我的全部审批
    const mySubmissions = computed(() => {
        const appId = currentAppId.value
        return appId && mySubmissionsMap[appId] ? mySubmissionsMap[appId] : []
    })

    const loading = reactive({
        dictionary: false,
        template: false,
        submit: false,
        todos: false,
        mySubmissions: false,
        action: false,
    })

    const error = ref<string | null>(null)

    const hasTemplate = computed(() => !!activeTemplate.value?.template?.id)
    const todoCount = computed(() => todos.value.length)

    function clearError() {
        error.value = null
    }

    function setError(message: string) {
        error.value = message
    }

    async function loadDictionaries() {
        const appId = currentAppId.value
        if (!appId) {
            setError('未选择当前应用，无法加载字典')
            return { ok: false, error: 'No AppID' }
        }

        loading.dictionary = true
        clearError()

        try {
            const [positionsData, typesData] = await Promise.all([
                ApprovalPositions(),
                ApprovalTypes(),
            ])

            // 存入 Map
            positionsMap[appId] = positionsData
            approvalTypesMap[appId] = typesData

            return {
                ok: true,
                data: {
                    positions: positions.value,
                    approvalTypes: approvalTypes.value,
                },
            }
        } catch (e) {
            setError('加载字典失败')
            return { ok: false, error: e }
        } finally {
            loading.dictionary = false
        }
    }

    async function loadActiveTemplate(typeCode: string) {
        const appId = currentAppId.value
        if (!appId) {
            setError('未选择当前应用')
            return { ok: false, error: 'No AppID' }
        }

        loading.template = true
        clearError()

        try {
            const data = await ApprovalTemplateActive(typeCode)
            if (!data) {
                setError('加载激活模板失败')
                // 也要清除 Map 里的旧值
                activeTemplateMap[appId] = null
                return { ok: false, data: null }
            }

            activeTemplateMap[appId] = data
            return { ok: true, data }
        } catch (e) {
            setError('加载激活模板异常')
            return { ok: false, error: e }
        } finally {
            loading.template = false
        }
    }

    async function saveTemplate(payload: ApprovalTemplateUpsertInput) {
        const appId = currentAppId.value
        if (!appId) {
            setError('未选择当前应用')
            return { ok: false, error: 'No AppID' }
        }

        loading.template = true
        clearError()

        try {
            const data = await ApprovalTemplatesUpsert(payload)
            if (!data) {
                setError('保存模板失败')
                return { ok: false, data: null }
            }

            activeTemplateMap[appId] = data
            return { ok: true, data }
        } catch (e) {
            setError('保存模板异常')
            return { ok: false, error: e }
        } finally {
            loading.template = false
        }
    }

    async function submitApproval(payload: Omit<ApprovalSubmitInput, 'submitter'>) {
        // 提交不需要存结果到特定的 Map，只需返回成功即可
        // (如果想做得更好，可以在这里存一下历史提交记录，但目前需求没提)
        loading.submit = true
        clearError()

        try {
            const data = await ApprovalSubmit(payload)
            if (!data) {
                setError('提交审批失败')
                return { ok: false, data: null }
            }

            return { ok: true, data }
        } catch (e) {
            setError('提交审批异常')
            return { ok: false, error: e }
        } finally {
            loading.submit = false
        }
    }

    async function loadTodos() {
        const appId = currentAppId.value
        if (!appId) {
            // 如果没有 AppID，清空当前视图并返回
            // 虽然 todosMap 里可能没有这一项，但 todos computed 会返回 []
            return { ok: false, error: 'No AppID' }
        }

        loading.todos = true
        clearError()

        try {
            const data = await ApprovalTodos()
            // ApprovalTodos always returns an array, empty if failed internally in service
            todosMap[appId] = data
            return { ok: true, data }
        } catch (e) {
             // This catch block might not be reached if service catches all, but good for safety
            setError('加载待办异常')
            todosMap[appId] = []
            return { ok: false, error: e }
        } finally {
            loading.todos = false
        }
    }

    async function loadMySubmissions() {
        const appId = currentAppId.value
        if (!appId) {
            return { ok: false, error: 'No AppID' }
        }

        loading.mySubmissions = true
        clearError()

        try {
            const data = await ApprovalMySubmissions()
            mySubmissionsMap[appId] = data
            return { ok: true, data }
        } catch (e) {
            setError('加载全部审批异常')
            mySubmissionsMap[appId] = []
            return { ok: false, error: e }
        } finally {
            loading.mySubmissions = false
        }
    }

    async function actionApproval(payload: Omit<ApprovalActionInput, 'actor'>) {
        const appId = currentAppId.value
        // 虽然操作不需要存 Map，但需要从 todosMap 中移除处理掉的项
        
        loading.action = true
        clearError()

        try {
            const data = await ApprovalAction(payload)
            if (!data) {
                setError('审批操作失败')
                return { ok: false, data: null }
            }

            // Remove processed todo from list (in memory)
            if (appId && todosMap[appId]) {
                 todosMap[appId] = todosMap[appId].filter((item) => item.instanceId !== payload.instanceId)
            }
            
            return { ok: true, data }
        } catch (e) {
            setError('审批操作异常')
            return { ok: false, error: e }
        } finally {
            loading.action = false
        }
    }

    function resetApprovalState() {
        // 重置当前应用的 State
        const appId = currentAppId.value
        if (appId) {
            delete positionsMap[appId]
            delete approvalTypesMap[appId]
            delete activeTemplateMap[appId]
            delete todosMap[appId]
            delete mySubmissionsMap[appId]
        }
        // 或者是否要清空所有？根据语义 Usually reset logic is for current context.
        clearError()
    }

    async function createApprovalType(payload: ApprovalTypeCreateInput) {
        const appId = currentAppId.value
        if (!appId) {
            setError('未选择当前应用')
            return { ok: false, error: 'No AppID' }
        }

        loading.dictionary = true // Reuse dictionary loading state or create a new one
        clearError()

        try {
            const success = await ApprovalTypesCreate(payload)
            if (success) {
                // Refresh types
                const typesData = await ApprovalTypes()
                approvalTypesMap[appId] = typesData
                return { ok: true }
            } else {
                setError('创建审批类型失败')
                return { ok: false, error: 'Failed' }
            }
        } catch (e) {
            setError('创建审批类型异常')
            return { ok: false, error: e }
        } finally {
            loading.dictionary = false
        }
    }

    return {
        // State
        positions,
        approvalTypes,
        activeTemplate,
        todos,
        mySubmissions,
        loading,
        error,

        // Getters
        hasTemplate,
        todoCount,

        // Actions
        clearError,
        loadDictionaries,
        loadActiveTemplate,
        saveTemplate, // Keep this name or rename to upsertTemplate based on preference
        submitApproval,
        loadTodos,
        loadMySubmissions,
        actionApproval,
        resetApprovalState,
        createApprovalType,
    }
})
