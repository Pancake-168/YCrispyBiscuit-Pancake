<template>
    <div class="PanelHeader">
        <div class="info">
            当前应用：<span v-if="selectedApp">{{ selectedApp.name }}</span>

        </div>
        <button class="btn btn-primary" @click="handleOpenCreateBotDialog">创建bot</button>
        <button class="btn btn-primary" @click="refresh">刷新数据</button>
        <button v-if="isSSOApp" class="btn btn-ghost" @click="toggleSSOView">
            {{ showSSOView ? '返回默认视图' : 'SSO合并视图' }}
        </button>
    </div>

    <div v-if="selectedApp && !showSSOView" class="PanelHeader secondary">
        <select class="input" v-model="selectedCollection">
            <option value="">选择数据表</option>
            <option v-for="collection in appCollections" :key="collection.name" :value="collection.name">
                {{ collection.name }}
            </option>
        </select>
    </div>

    <div v-if="showSSOView" class="SsoSection">
        <div class="SsoToolbar">
            <div class="SsoTitle">SSO 账户与会话合并</div>
            <div class="SsoControls">
                <select class="input SelectInput" v-model="ssoFilterType">
                    <option value="all">全部类型</option>
                    <option value="user">User</option>
                    <option value="bot">Bot</option>
                </select>
                <button class="btn btn-ghost BtnSmall" @click="refreshSSOData">刷新</button>
            </div>
        </div>

        <div class="TableWrap">
            <div v-if="ssoLoading" class="LoadingState">正在合并数据...</div>
            <div v-else-if="filteredSsoRecords.length === 0" class="EmptyState">暂无合并数据</div>
            <table v-else class="DataTable">
                <thead>
                    <tr>
                        <th>操作</th>
                        <th>用户名</th>
                        <th>类型</th>
                        <th>OpenID</th>
                        <th>UnionID</th>
                        <th>密码</th>
                        <th>登录 Token</th>
                        <th>Matrix Token</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in filteredSsoRecords" :key="row.openid">
                        <td>
                            <div class="SsoActions">
                                <button class="btn btn-ghost BtnSmall" @click="copyText(row.token)">复制LoginToken</button>
                                <button class="btn btn-ghost BtnSmall" @click="copyText(row.matrix_token)">复制MatrixToken</button>
                            </div>
                        </td>
                        <td>{{ row.username }}</td>
                        <td>{{ row.atype }}</td>
                        <td>
                            <div class="CellContent">{{ row.openid }}</div>
                        </td>
                        <td>
                            <div class="CellContent">{{ row.wx_unionid }}</div>
                        </td>
                        <td>
                            <div class="CellContent">{{ row.password }}</div>
                        </td>
                        <td>
                            <div class="CellContent">{{ row.token }}</div>
                        </td>
                        <td>
                            <div class="CellContent">{{ row.matrix_token }}</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <div v-else-if="selectedBaseKey && selectedBaseKey === 'workflows'" class="JsonViewer">
        {{ jsonText(baseData[selectedBaseKey] ?? []) }}
    </div>

    <div v-else-if="rows.length" class="TableWrap">
        <table class="DataTable">
            <thead>
                <tr>
                    <th v-for="col in columns" :key="col">{{ col }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, rowIndex) in rows" :key="rowKey(row, rowIndex)">
                    <td v-for="col in columns" :key="col">
                        <div class="CellContent">{{ formatCell(row[col]) }}</div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div v-else-if="selectedBaseKey" class="JsonViewer">
        {{ jsonText(baseData[selectedBaseKey]) }}
    </div>

    <div v-else-if="tableLoading" class="LoadingState">正在加载数据...</div>
    <div v-else-if="appLoading" class="LoadingState">正在加载子应用...</div>
    <div v-else class="EmptyState">请选择数据项查看详情</div>

</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getAllAvailableNocoBaseInfoByApplication, getCollectionDataByApplication } from '@/services/NocoBase/data/info'
import { ApplicationRegisterBotInNocobaseSystemManager } from '@/services/Project/Organization/Application'
import { sleep } from '@/utils/sleep'
import { openMessageDialog } from '@/components/MessageDialog/open'
import { openCreateBotDialog } from '@/components/CreateBot/open'

type InfoPayload = { data?: Record<string, any>; attempts?: Record<string, any> }

const props = defineProps<{
    info: InfoPayload | null
    selectedBaseKey: string | null
    selectedApp: any | null
}>()

const emit = defineEmits<{ (event: 'refresh'): void }>()

const selectedCollection = ref('')
const appInfo = ref<InfoPayload | null>(null)
const showSSOView = ref(false)
const ssoMergedRecords = ref<Array<Record<string, any>>>([])
const appLoading = ref(false)
const tableLoading = ref(false)
const ssoLoading = ref(false)
const ssoFilterType = ref<'all' | 'user' | 'bot'>('all')
const createBotLoading = ref(false)
const createBotError = ref('')






const appInfoCache = new Map<string, InfoPayload>()
const tableCache = new Map<string, Array<Record<string, any>>>()
const ssoCache = new Map<string, Array<Record<string, any>>>()
const appInfoInFlight = new Map<string, Promise<InfoPayload | null>>()
const tableInFlight = new Map<string, Promise<Array<Record<string, any>>>>()
const ssoInFlight = new Map<string, Promise<Array<Record<string, any>>>>()
const appCollections = computed(() => {
    const data = pickPreferredAttempts(appInfo.value?.attempts)
    return Array.isArray(data?.collections) ? data.collections : []
})

const filteredSsoRecords = computed(() => {
    if (ssoFilterType.value === 'all') return ssoMergedRecords.value
    return ssoMergedRecords.value.filter((row) => {
        const type = String(row?.atype ?? '').toLowerCase()
        return type === ssoFilterType.value
    })
})

const baseData = computed<Record<string, any>>(() => props.info?.data ?? {})

const rows = computed<Array<Record<string, any>>>(() => {
    if (selectedApp.value) {
        return Array.isArray(appTableRows.value) ? appTableRows.value : []
    }
    if (!props.selectedBaseKey) return []
    const data = baseData.value[props.selectedBaseKey]
    return Array.isArray(data) ? data : []
})

const columns = computed(() => {
    if (!rows.value.length) return []
    const colSet = new Set<string>()
    rows.value.forEach((row) => {
        Object.keys(row || {}).forEach((key) => colSet.add(key))
    })
    return Array.from(colSet)
})

const appTableRows = ref<Array<Record<string, any>>>([])

const pickPreferredAttempts = (attempts: any) =>
    attempts?.appHeader?.data ?? attempts?.appParam?.data ?? attempts?.appPath?.data ?? {}

const getListData = (payload: any): Array<Record<string, any>> => {
    if (Array.isArray(payload)) return payload
    if (payload && typeof payload === 'object' && Array.isArray(payload.data)) return payload.data
    return []
}

const refresh = () => {
    emit('refresh')
}

const handleOpenCreateBotDialog = async () => {
    const apps = Array.isArray(baseData.value?.applications) ? baseData.value.applications : []
    const payload = await openCreateBotDialog({ applications: apps })
    if (!payload) return
    createBotLoading.value = true
    createBotError.value = ''
    try {
        const result = await ApplicationRegisterBotInNocobaseSystemManager(
            payload.appName,
            payload.nickname,
            payload.token,
        )
        if (!result?.ok) {
            createBotError.value = '创建失败'
            openMessageDialog('创建失败')
            return
        }
        await sleep(3500)
        refresh()
    } catch (error) {
        createBotError.value = '创建失败'
        openMessageDialog('创建失败')
        console.warn('[System:NocoBasePage:submitCreateBot] 创建 bot 失败:', error)
    } finally {
        createBotLoading.value = false
    }
}




const jsonText = (value: any) => {
    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return String(value)
    }
}

const formatCell = (value: any) => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') return jsonText(value)
    return String(value)
}

const rowKey = (row: Record<string, any>, index: number) => row?.id ?? row?.key ?? index

const isSSOApp = computed(() => props.selectedApp?.name === 'A_SYSTEM_SSO')

const toggleSSOView = async () => {
    showSSOView.value = !showSSOView.value
    if (showSSOView.value) {
        await refreshSSOData()
    }
}

const refreshSSOData = async () => {
    ssoMergedRecords.value = []
    if (!props.selectedApp?.name) return
    const appName = props.selectedApp.name
    const cached = ssoCache.get(appName)
    if (cached) {
        ssoMergedRecords.value = cached
        return
    }
    if (ssoInFlight.has(appName)) {
        ssoMergedRecords.value = await ssoInFlight.get(appName)!
        return
    }
    ssoLoading.value = true
    const task = (async () => {
        const fetchList = async (collection: string) => {
            const cacheKey = `${appName}:${collection}`
            const cachedTable = tableCache.get(cacheKey)
            if (cachedTable) return cachedTable
            const response = await getCollectionDataByApplication(appName, collection, { pageSize: 200 })
            const data = pickPreferredAttempts(response?.attempts)
            const list = getListData(data)
            tableCache.set(cacheKey, list)
            return list
        }
        const [accounts, sessions] = await Promise.all([
            fetchList('a_account'),
            fetchList('a_login_session'),
        ])
        return accounts.map((acc) => {
            const openid = acc.openid as string
            const sess = sessions.find((s) => s.openid === openid) || {}
            return {
                openid: acc.openid,
                wx_unionid: acc.wx_unionid,
                atype: acc.atype,
                username: acc.username,
                password: acc.password,
                token: sess.token || '-',
                matrix_token: sess.matrix_token || '-',
            }
        })
    })()
    ssoInFlight.set(appName, task)
    const merged = await task
    ssoInFlight.delete(appName)
    ssoCache.set(appName, merged)
    ssoMergedRecords.value = merged
    ssoLoading.value = false
}

const copyText = async (value: any) => {
    const payload = value === null || value === undefined ? '' : String(value)
    if (!payload) return
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(payload)
        } else {
            const textarea = document.createElement('textarea')
            textarea.value = payload
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.focus()
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
        }
    } catch {
        return
    }
}

watch(
    () => props.selectedApp,
    async (app) => {
        selectedCollection.value = ''
        appTableRows.value = []
        showSSOView.value = false
        ssoMergedRecords.value = []
        if (!app?.name) {
            appInfo.value = null
            return
        }
        const appName = app.name
        const cached = appInfoCache.get(appName)
        if (cached) {
            appInfo.value = cached
            return
        }
        if (appInfoInFlight.has(appName)) {
            appInfo.value = await appInfoInFlight.get(appName)!
            return
        }
        appLoading.value = true
        const task = getAllAvailableNocoBaseInfoByApplication(appName)
        appInfoInFlight.set(appName, task)
        const result = await task
        appInfoInFlight.delete(appName)
        appLoading.value = false
        if (result) {
            appInfoCache.set(appName, result)
        }
        appInfo.value = result
    },
    { immediate: true },
)

watch(
    () => selectedCollection.value,
    async (collection) => {
        appTableRows.value = []
        if (!collection || !props.selectedApp?.name) return
        const appName = props.selectedApp.name
        const cacheKey = `${appName}:${collection}`
        const cached = tableCache.get(cacheKey)
        if (cached) {
            appTableRows.value = cached
            return
        }
        if (tableInFlight.has(cacheKey)) {
            appTableRows.value = await tableInFlight.get(cacheKey)!
            return
        }
        tableLoading.value = true
        const task = (async () => {
            const response = await getCollectionDataByApplication(appName, collection, {
                page: 1,
                pageSize: 50,
            })
            const data = pickPreferredAttempts(response?.attempts)
            const list = Array.isArray(data) ? data : data?.data ?? []
            tableCache.set(cacheKey, list)
            return list
        })()
        tableInFlight.set(cacheKey, task)
        const list = await task
        tableInFlight.delete(cacheKey)
        tableLoading.value = false
        appTableRows.value = list
    },
)

const selectedApp = computed(() => props.selectedApp)
</script>

<style scoped>
.PanelHeader {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-bottom: 1px solid var(--glass-border);
}

.PanelHeader.secondary {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--glass-border);
}

.info {
    width: 100%;
    display: flex;
}

.btn {
    display: flex;
    word-break: keep-all;
}

.TableWrap {

    overflow: auto;
    border-radius: 12px;
    border: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.02);
    max-height: calc(100vh - 260px);
    margin: 1rem;
}

.DataTable {
    width: max-content;
    min-width: 100%;
    border-collapse: collapse;
    min-width: 680px;
    table-layout: auto;
}

.DataTable th,
.DataTable td {
    padding: 0.65rem 0.9rem;
    border-bottom: 1px solid var(--glass-border);
    text-align: left;
    font-size: 0.75rem;
    color: var(--text-color);
    vertical-align: top;
}

.DataTable th {
    background: var(--input-bg);
    position: sticky;
    top: 0;
    z-index: 1;
    white-space: nowrap;
}

.DataTable tbody tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.02);
}

.CellContent {
    display: block;
    max-width: 360px;
    white-space: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
}

.SsoActions {
    display: flex;
    gap: 0.5rem;
}

.SsoSection {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.SsoToolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
}

.SsoTitle {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-color);
}

.SsoControls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.SelectInput {
    width: 120px;
}

.BtnSmall {
    padding: 0.25rem 0.5rem;
    font-size: 0.625rem;
}

.JsonViewer {
    margin: 1rem;
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.02);
    color: var(--text-color);
    font-size: 0.75rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
}

.EmptyState,
.LoadingState {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.75rem;
}
</style>
