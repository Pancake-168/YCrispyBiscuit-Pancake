<template>
    <div class="PageContainer">
        <transition name="sidebar-slide-left">
            <div class="LeftContent" v-show="sidebarStore.sidebars.sidebar2.left">
                <div class="PanelHeader">
                    <div class="PanelTitle">多应用管理</div>
                    <div class="PanelSub">Applications</div>
                </div>
                <div class="ListContainer">
                    <div v-if="!isLoggedIn" class="EmptyState">
                        请先在右侧完成登录
                    </div>
                    <div v-else-if="applicationsLoading" class="LoadingState">加载中...</div>
                    <button v-else class="ListItem glass-card" v-for="app in applications" :key="getRecordKey(app)"
                        @click="handleSelectApplication(app)" :class="{ active: isSelectedApplication(app) }">
                        <div class="ItemTitle">{{ getApplicationTitle(app) }}</div>
                        <div class="ItemMeta">
                            <span class="ItemName">{{ getApplicationName(app) }}</span>
                            <span class="ItemStatus" :class="getApplicationStatusClass(app)">
                                {{ getApplicationStatusLabel(app) }}
                            </span>
                        </div>
                    </button>
                </div>

                <div class="PanelHeader secondary">
                    <div class="PanelTitle">Collections</div>
                    <div class="PanelSub">主应用数据表</div>
                </div>
                <div class="ListContainer">
                    <div v-if="!isLoggedIn" class="EmptyState">
                        请先在右侧完成登录
                    </div>
                    <div v-else-if="collectionsLoading" class="LoadingState">加载中...</div>
                    <button v-else class="ListItem glass-card" v-for="col in collections" :key="getRecordKey(col)"
                        @click="handleSelectCollection(col)" :class="{ active: isSelectedCollection(col) }">
                        <div class="ItemTitle">{{ getCollectionTitle(col) }}</div>
                        <div class="ItemMeta">
                            <span class="ItemName">{{ getCollectionName(col) }}</span>
                        </div>
                    </button>
                </div>
            </div>
        </transition>
        <div class="MiddleContent">
            <div class="PanelHeader">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div class="PanelTitle">数据预览</div>
                        <div class="PanelSub">{{ getMiddleSubtitle() }}</div>
                    </div>
                    <div v-if="isSSOApp()">
                        <button class="btn btn-sm" :class="showSSOCustomView ? 'btn-primary' : 'btn-ghost'"
                            @click="() => { showSSOCustomView = !showSSOCustomView; if(showSSOCustomView) refreshSSOData(); }">
                            {{ showSSOCustomView ? '返回默认视图' : 'SSO 合并视图' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="!isLoggedIn" class="EmptyState large">
                请先登录以查看数据
            </div>

            <div v-else-if="showSSOCustomView" class="MiddleBody">
                <div class="SubAppSection">
                    <div class="SubAppHeader">
                        <div class="SubAppTitle">SSO 账户与会话合并</div>
                        <div style="display: flex; gap: 0.5rem;">
                            <select class="input SelectInput" v-model="ssoFilterType" style="width: 120px;">
                                <option value="all">全部类型</option>
                                <option value="user">User</option>
                                <option value="bot">Bot</option>
                            </select>
                            <button class="btn btn-ghost btn-sm" @click="refreshSSOData">刷新</button>
                        </div>
                    </div>
                    
                    <div v-if="ssoLoading" class="LoadingState">正在合并数据...</div>
                    <div v-else-if="filteredSsoRecords.length === 0" class="EmptyState">
                        暂无合并数据
                    </div>
                    <div v-else class="TableWrapper">
                         <table class="DataTable">
                            <thead>
                                <tr>
                                    <th style="width: 140px;">操作</th>
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
                                <tr v-for="row in filteredSsoRecords" :key="row.openid as string">
                                    <td>
                                        <div style="display: flex; gap: 0.5rem;">
                                            <button class="btn btn-sm" @click="copyText(row.token, $event)" title="复制 Token">Token</button>
                                            <button class="btn btn-sm" @click="copyText(row.matrix_token, $event)" title="复制 Matrix Token">Matrix</button>
                                        </div>
                                    </td>

                                    <td>{{ row.username }}</td>
                                    <td>{{ row.atype }}</td>
                                    <td><span class="CellValue" :title="String(row.openid)">{{ row.openid }}</span></td>
                                    <td><span class="CellValue" :title="String(row.wx_unionid)">{{ row.wx_unionid }}</span></td>
                                    <td>{{ row.password }}</td>
                                    <td><span class="CellValue" :title="String(row.token)">{{ row.token }}</span></td>
                                    <td><span class="CellValue" :title="String(row.matrix_token)">{{ row.matrix_token }}</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div v-else class="MiddleBody">
                <div v-if="selectedType === 'application'" class="SubAppSection">
                    <div class="SubAppHeader">
                        <div class="SubAppTitle">子应用数据表</div>
                        <div class="SubAppName">{{ getSelectedApplicationName() }}</div>
                    </div>
                    <div class="SubAppControls">
                        <select class="input SelectInput" v-model="selectedSubCollectionName"
                            @change="handleSubCollectionChange">
                            <option value="">请选择数据表</option>
                            <option v-for="item in subCollections" :key="getRecordKey(item)"
                                :value="getCollectionName(item)">
                                {{ getCollectionTitle(item) }} ({{ getCollectionName(item) }})
                            </option>
                        </select>
                        <button class="btn btn-ghost" @click="refreshSubCollections">
                            刷新
                        </button>
                    </div>
                    <div v-if="subCollectionsLoading" class="LoadingState">子应用表加载中...</div>
                    <div v-else-if="subCollections.length === 0" class="EmptyState">
                        未获取到子应用数据表
                    </div>
                </div>

                <div v-if="recordsLoading" class="LoadingState">正在加载数据...</div>
                <div v-else-if="records.length === 0" class="EmptyState">
                    暂无数据
                </div>
                <div v-else class="TableWrapper">
                    <table class="DataTable">
                        <thead>
                            <tr>
                                <th v-for="col in recordColumns" :key="col">
                                    {{ col }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in records" :key="getRecordKey(row)">
                                <td v-for="col in recordColumns" :key="col">
                                    <span class="CellValue">{{ formatCellValue(row[col]) }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <transition name="sidebar-slide-right">
            <div class="RightContent" v-show="sidebarStore.sidebars.sidebar2.right">
                <div class="PanelHeader">
                    <div class="PanelTitle">登录</div>
                    <div class="PanelSub">NocoBase</div>
                </div>

                <div class="LoginCard glass-card">
                    <div class="LoginTabs">
                        <button class="TabButton" :class="{ active: loginMode === 'token' }"
                            @click="setLoginMode('token')">
                            Token 登录
                        </button>
                        <button class="TabButton" :class="{ active: loginMode === 'account' }"
                            @click="setLoginMode('account')">
                            账号密码登录
                        </button>
                    </div>

                    <div v-if="loginMode === 'token'" class="LoginForm">
                        <label class="FormLabel">Token</label>
                        <textarea class="input TextArea" v-model="tokenInput" placeholder="粘贴 Access Token"></textarea>
                        <button class="btn btn-primary" @click="handleTokenLogin" :disabled="loginBusy">
                            {{ loginBusy ? '登录中...' : '登录' }}
                        </button>
                    </div>

                    <div v-else class="LoginForm">
                        <label class="FormLabel">账号</label>
                        <input class="input" v-model="accountInput" placeholder="账号" />
                        <label class="FormLabel">密码</label>
                        <input class="input" type="password" v-model="passwordInput" placeholder="密码" />
                        <button class="btn btn-primary" @click="handleAccountLogin" :disabled="loginBusy">
                            {{ loginBusy ? '登录中...' : '登录' }}
                        </button>
                    </div>

                    <div v-if="loginError" class="ErrorText">{{ loginError }}</div>
                </div>

                <div class="LoginCard glass-card" v-if="isLoggedIn">
                    <div class="PanelHeader small">
                        <div class="PanelTitle">已登录</div>
                        <div class="PanelSub">Token</div>
                    </div>
                    <div class="TokenBox">
                        <textarea class="input TextArea readOnly" readonly :value="authedToken"></textarea>
                        <button class="btn btn-ghost" @click="copyToken">复制 Token</button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>


<script setup lang="ts">
import { useSidebarStore } from '@/stores/sidebar'
import { nocobaseService } from '@/services/Nocobase/client'
import { APIClient } from '@nocobase/sdk'
import { onMounted, ref, watch, computed } from 'vue'


const sidebarStore = useSidebarStore()

type NocoRecord = Record<string, unknown>

/**
 * 登录部分
 */
const loginMode = ref<'token' | 'account'>('account')
const tokenInput = ref('')
const accountInput = ref('zkzs')
const passwordInput = ref('Zkzs@123')
const authedToken = ref('')
const loginBusy = ref(false)
const loginError = ref('')
const isLoggedIn = ref(false)



/**
 * 主内容部分
 */
//多应用
const applications = ref<NocoRecord[]>([])
//主应用数据
const collections = ref<NocoRecord[]>([])
const applicationsLoading = ref(false)
const collectionsLoading = ref(false)

const selectedType = ref<'application' | 'collection' | null>(null)
const selectedApplication = ref<NocoRecord | null>(null)
const selectedCollection = ref<NocoRecord | null>(null)

const subCollections = ref<NocoRecord[]>([])
const subCollectionsLoading = ref(false)
const selectedSubCollectionName = ref('')

// SSO System Specific
const showSSOCustomView = ref(false)
const ssoMergedRecords = ref<Record<string, unknown>[]>([])
const ssoLoading = ref(false)
const ssoFilterType = ref<'all' | 'user' | 'bot'>('all')

const filteredSsoRecords = computed(() => {
    if (ssoFilterType.value === 'all') return ssoMergedRecords.value
    return ssoMergedRecords.value.filter(item => item.atype === ssoFilterType.value)
})

const records = ref<NocoRecord[]>([])
const recordColumns = ref<string[]>([])
const recordsLoading = ref(false)


/**
 * 
 * 登录部分
 */
function setLoginMode(mode: 'token' | 'account') {
    loginMode.value = mode
    loginError.value = ''
}

function getAuthedClient(): APIClient | null {
    return nocobaseService.getAuthedClient()
}

function handleTokenLogin() {
    if (!tokenInput.value.trim()) {
        loginError.value = '请输入 Token'
        return
    }
    loginBusy.value = true
    loginError.value = ''
    try {
        nocobaseService.setToken(tokenInput.value.trim())
        authedToken.value = tokenInput.value.trim()
        isLoggedIn.value = true
        refreshMainLists()
    } catch (error) {
        loginError.value = 'Token 登录失败'
        console.error(error)
    } finally {
        loginBusy.value = false
    }
}

async function handleAccountLogin() {
    if (!accountInput.value.trim() || !passwordInput.value.trim()) {
        loginError.value = '请输入账号与密码'
        return
    }
    loginBusy.value = true
    loginError.value = ''
    try {
        const client = nocobaseService.createNoAuthenticatedClient('/nocobase-proxy/api')
        const response = await client.auth.signIn({
            account: accountInput.value.trim(),
            password: passwordInput.value.trim()
        })
        const data = response && response.data ? response.data.data : null
        const token = data && data.token ? String(data.token) : client.auth.getToken()
        if (!token) {
            throw new Error('无法获取 token')
        }
        nocobaseService.setToken(token)
        authedToken.value = token
        isLoggedIn.value = true
        refreshMainLists()
    } catch (error) {
        loginError.value = '账号密码登录失败'
        console.error(error)
    } finally {
        loginBusy.value = false
    }
}

function copyToken() {
    if (!authedToken.value) return
    copyToClipboard(authedToken.value)
}

function copyText(text: unknown, event?: Event) {
    if (!text || text === '-') return
    const btn = event?.target as HTMLButtonElement
    const originalText = btn?.innerText
    
    copyToClipboard(String(text)).then(() => {
        if (btn && originalText) {
            btn.innerText = '已复制'
            setTimeout(() => {
                btn.innerText = originalText
            }, 1000)
        }
    })
}

function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).catch(err => {
            console.error('Clipboard API failed', err)
            return fallbackCopy(text)
        })
    } else {
        return fallbackCopy(text)
    }
}

function fallbackCopy(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-9999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
            document.execCommand('copy')
            resolve()
        } catch (err) {
            console.error('Fallback copy failed', err)
            reject(err)
        }
        document.body.removeChild(textArea)
    })
}















function getListData(response: unknown): NocoRecord[] {
    const anyResponse = response as { data?: { data?: NocoRecord[] } }
    if (anyResponse && anyResponse.data && Array.isArray(anyResponse.data.data)) {
        return anyResponse.data.data
    }
    return []
}

function getRecordKey(record: NocoRecord): string {
    if (record.id) return String(record.id)
    if (record.name) return String(record.name)
    if (record.title) return String(record.title)
    return JSON.stringify(record)
}

function getCollectionName(record: NocoRecord): string {
    return String(record.name || '')
}

function getCollectionTitle(record: NocoRecord): string {
    return String(record.title || record.displayName || record.name || '')
}

function getApplicationName(record: NocoRecord): string {
    const name = record.name || record.appName || record.key || record.slug
    return String(name || '')
}

function getApplicationTitle(record: NocoRecord): string {
    return String(record.displayName || record.title || record.name || record.appName || '')
}

function getApplicationStatusLabel(record: NocoRecord): string {
    if (record.enabled === true) return '启用'
    if (record.enabled === false) return '停用'
    if (record.status) return String(record.status)
    return '未知'
}

function getApplicationStatusClass(record: NocoRecord): string {
    if (record.enabled === true) return 'status-success'
    if (record.enabled === false) return 'status-danger'
    return 'status-muted'
}

function refreshMainLists() {
    refreshApplications()
    refreshCollections()
    console.log('得到的数据',applications)
}

async function refreshApplications() {
    const client = getAuthedClient()
    if (!client) return
    applicationsLoading.value = true
    try {
        const action = (client.resource('applications') as Record<string, (params?: unknown) => Promise<unknown>>).list
        if (!action) throw new Error('applications:list 不存在')
        const response = await action({ pageSize: 200 })
        applications.value = getListData(response)
    } catch (error) {
        console.error(error)
        applications.value = []
    } finally {
        applicationsLoading.value = false
    }
}

async function refreshCollections() {
    const client = getAuthedClient()
    if (!client) return
    collectionsLoading.value = true
    try {
        const action = (client.resource('collections') as Record<string, (params?: unknown) => Promise<unknown>>).list
        if (!action) throw new Error('collections:list 不存在')
        const response = await action({ pageSize: 200 })
        collections.value = getListData(response)
    } catch (error) {
        console.error(error)
        collections.value = []
    } finally {
        collectionsLoading.value = false
    }
}

function isSelectedApplication(record: NocoRecord): boolean {
    return selectedType.value === 'application' && getRecordKey(record) === getRecordKey(selectedApplication.value || {})
}

function isSelectedCollection(record: NocoRecord): boolean {
    return selectedType.value === 'collection' && getRecordKey(record) === getRecordKey(selectedCollection.value || {})
}

function handleSelectApplication(record: NocoRecord) {
    selectedType.value = 'application'
    selectedApplication.value = record
    selectedCollection.value = null
    selectedSubCollectionName.value = ''
    records.value = []
    recordColumns.value = []
    refreshSubCollections()
}

function handleSelectCollection(record: NocoRecord) {
    selectedType.value = 'collection'
    selectedCollection.value = record
    selectedApplication.value = null
    selectedSubCollectionName.value = ''
    subCollections.value = []
    refreshCollectionRecords(getCollectionName(record), false)
}

function getMiddleSubtitle(): string {
    if (showSSOCustomView.value) return '账号/Session 合并视图'
    if (selectedType.value === 'collection' && selectedCollection.value) {
        return `主应用 · ${getCollectionName(selectedCollection.value)}`
    }
    if (selectedType.value === 'application' && selectedApplication.value) {
        return `子应用 · ${getApplicationName(selectedApplication.value)}`
    }
    return '请选择左侧条目'
}

function isSSOApp(): boolean {
    const app = selectedApplication.value
    if (!app) return false
    return app.name === 'A_SYSTEM_SSO'
}

async function refreshSSOData() {
    if (!isSSOApp()) return
    ssoLoading.value = true
    ssoMergedRecords.value = []
    try {
        const appName = getApplicationName(selectedApplication.value || {})
        if (!appName) return
        const client = createSubAppClient(appName)
        if (!client) return

        const fetchList = async (collection: string) => {
             const action = (client.resource(collection) as any).list
             let list: NocoRecord[] = []
             if (action) {
                 try {
                     const res = await action({ pageSize: 200 }) 
                     list = getListData(res)
                 } catch (e) {
                     console.warn(`Standard fetch failed for ${collection}, trying fallback`, e)
                 }
             }

             if (list.length === 0) {
                 try {
                     const mainClient = getAuthedClient()
                     if (mainClient) {
                         const rawRes = await mainClient.request({
                             url: `${collection}:list`,
                             params: { pageSize: 200, __appName: appName }
                         })
                         list = getListData(rawRes)
                     }
                 } catch (e2) {
                     console.error(`Fallback fetch failed for ${collection}`, e2)
                 }
             }
             return list
        }

        const [accounts, sessions] = await Promise.all([
            fetchList('a_account'),
            fetchList('a_login_session')
        ])

        const merged = accounts.map(acc => {
            const openid = acc.openid as string
            const sess = sessions.find(s => s.openid === openid) || {}
            return {
                openid: acc.openid,
                wx_unionid: acc.wx_unionid,
                atype: acc.atype,
                username: acc.username,
                password: acc.password,
                token: sess.token || '-',
                matrix_token: sess.matrix_token || '-'
            }
        })
        
        ssoMergedRecords.value = merged

    } catch (error) {
        console.error('SSO Data fetch error', error)
    } finally {
        ssoLoading.value = false
    }
}


function getSelectedApplicationName(): string {
    if (!selectedApplication.value) return ''
    return getApplicationName(selectedApplication.value)
}

async function refreshSubCollections() {
    if (!selectedApplication.value) return
    const appName = getApplicationName(selectedApplication.value)
    if (!appName || !authedToken.value) return
    subCollectionsLoading.value = true
    try {
        const client = createSubAppClient(appName)
        const action = (client.resource('collections') as Record<string, (params?: unknown) => Promise<unknown>>).list
        if (!action) throw new Error('collections:list 不存在')
        const response = await action({ pageSize: 200 })
        const list = getListData(response)
        subCollections.value = list
        if (!list.length) {
            await refreshSubCollectionsFallback(appName)
        }
    } catch (error) {
        console.error(error)
        await refreshSubCollectionsFallback(appName)
    } finally {
        subCollectionsLoading.value = false
    }
}

async function refreshSubCollectionsFallback(appName: string) {
    const client = getAuthedClient()
    if (!client) return
    try {
        const response = await client.request({
            url: 'collections:list',
            params: { pageSize: 200, __appName: appName }
        })
        subCollections.value = getListData(response)
    } catch (error) {
        console.error(error)
        subCollections.value = []
    }
}

function handleSubCollectionChange() {
    if (!selectedSubCollectionName.value) return
    refreshCollectionRecords(selectedSubCollectionName.value, true)
}

function createSubAppClient(appName: string): APIClient {
    const encodedAppName = encodeURIComponent(appName)
    const baseURL = `/nocobase-proxy/apps/${encodedAppName}/api`
    const client = new APIClient({ baseURL: baseURL })
    client.auth.setToken(authedToken.value)
    return client
}

async function refreshCollectionRecords(collectionName: string, isSubApp: boolean) {
    if (!collectionName) return
    recordsLoading.value = true
    try {
        let client: APIClient | null = null
        if (isSubApp) {
            const appName = getApplicationName(selectedApplication.value || {})
            if (!appName) return
            client = createSubAppClient(appName)
        } else {
            client = getAuthedClient()
        }
        if (!client) return
        const action = (client.resource(collectionName) as Record<string, (params?: unknown) => Promise<unknown>>).list
        if (!action) throw new Error(`${collectionName}:list 不存在`)
        const response = await action({ pageSize: 50 })
        const list = getListData(response)
        records.value = list
        recordColumns.value = getRecordColumns(list)
        if (isSubApp && list.length === 0) {
            await refreshSubAppCollectionRecordsFallback(collectionName)
        }
    } catch (error) {
        console.error(error)
        if (isSubApp) {
            await refreshSubAppCollectionRecordsFallback(collectionName)
        }
        records.value = []
        recordColumns.value = []
    } finally {
        recordsLoading.value = false
    }
}

async function refreshSubAppCollectionRecordsFallback(collectionName: string) {
    const appName = getApplicationName(selectedApplication.value || {})
    const client = getAuthedClient()
    if (!client || !appName) return
    try {
        const response = await client.request({
            url: `${collectionName}:list`,
            params: { pageSize: 50, __appName: appName }
        })
        const list = getListData(response)
        records.value = list
        recordColumns.value = getRecordColumns(list)
    } catch (error) {
        console.error(error)
    }
}

function getRecordColumns(list: NocoRecord[]): string[] {
    if (!list.length) return []
    const columns: string[] = []
    const first = list[0]
    if (!first) return []
    const ignoredFields = ['createdAt', 'updatedAt', 'issued_at', 'expires_at','disabled_at','disabled_reason']
    Object.keys(first).forEach(function (key) {
        if (!columns.includes(key) && !ignoredFields.includes(key)) {
            columns.push(key)
        }
    })
    return columns
}

function formatCellValue(value: unknown): string {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') {
        return JSON.stringify(value)
    }
    return String(value)
}

onMounted(function () {
    if (authedToken.value) {
        nocobaseService.setToken(authedToken.value)
        isLoggedIn.value = true
        refreshMainLists()
    }
})





</script>

<style scoped>
.btn-sm {
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
    height: auto;
}

.PageContainer {
    width: 100%;
    height: 100%;
    display: flex;
    min-height: 0;
    flex-direction: row;
    gap: 0.5rem;
    overflow: hidden;
    /* Avoid scroll on container, rely on inner scroll */
}

/* Response Layout */
@media (max-width: 768px) {
    .PageContainer {
        flex-direction: column;
    }

    .LeftContent,
    .RightContent {
        max-width: 100% !important;
        height: auto !important;
        flex: none;
    }

    .MiddleContent {
        flex: 1;
        min-height: 0;
    }
}

.LeftContent,
.MiddleContent,
.RightContent {
    height: 100%;
    background: var(--glass-bg);
    border: var(--glass-border);
    backdrop-filter: var(--glass-blur);
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}


.LeftContent {
    width: 280px;
    flex-shrink: 0;
}

.MiddleContent {
    flex: 1;
    min-width: 0;
    /* Important for text overflow */
}

.RightContent {
    width: 320px;
    flex-shrink: 0;
}

.PanelHeader {
    padding: 1rem 1rem 0.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex-shrink: 0;
}

.PanelHeader.secondary {
    border-top: 1px solid var(--glass-border);
    margin-top: 0.5rem;
}

.PanelHeader.small {
    padding: 0.5rem 0.5rem 0.25rem 0.5rem;
}

.PanelTitle {
    font-size: var(--font-md);
    font-weight: 600;
    color: var(--text-color);
}

.PanelSub {
    font-size: var(--font-sm);
    color: var(--text-muted);
}

.ListContainer {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem 1rem 0.75rem;
    overflow-y: auto;
    flex: 1;
    /* Allow list to grow/shrink */
    min-height: 0;
}

/* Limit the first list container in LeftContent if there are two? 
   No, structure is vertical. We might want max-height on the first one or flex-basis.
*/

.ListItem {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.6rem 0.75rem;
    color: var(--text-color);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    background: transparent;
}

.ListItem:hover {
    border-color: var(--primary-color);
    background: var(--hover-bg);
}

.ListItem.active {
    border-color: var(--primary-color);
    background: var(--active-bg);
}

.ItemTitle {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-color);
}

.ItemMeta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-muted);
}

.ItemStatus {
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    font-size: 0.7rem;
}

.status-success {
    background: rgba(46, 204, 113, 0.2);
    color: #2ecc71;
}

.status-danger {
    background: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
}

.status-muted {
    background: rgba(149, 165, 166, 0.2);
    color: var(--text-muted);
}

.LoginCard {
    margin: 0.75rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    /* Use glass card styles from global if needed, but here we just layout */
}

.LoginTabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.TabButton {
    flex: 1;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--glass-border);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
}

.TabButton.active {
    background: var(--active-bg);
    color: var(--text-color);
    border-color: var(--primary-color);
}

.LoginForm {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.FormLabel {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin-bottom: 0.25rem;
    display: block;
}

/* Inputs are styled globally optionally, but let's ensure */
input.glass-card,
textarea.glass-card {
    background: var(--input-bg);
    color: var(--text-color);
    border: var(--glass-border);
    width: 100%;
    padding: 0.5rem;
    outline: none;
}

input.glass-card:focus,
textarea.glass-card:focus {
    border-color: var(--primary-color);
}

.TextArea {
    min-height: 90px;
    resize: vertical;
}

.TextArea.readOnly {
    min-height: 110px;
    background: rgba(0, 0, 0, 0.1);
}

.ErrorText {
    color: var(--danger-color);
    font-size: var(--font-sm);
}

.EmptyState {
    padding: 2rem;
    text-align: center;
    color: var(--text-muted);
    font-size: var(--font-base);
}

.EmptyState.large {
    margin-top: 3rem;
    font-size: var(--font-md);
}

.LoadingState {
    padding: 1rem;
    color: var(--text-muted);
    text-align: center;
}

.MiddleBody {
    padding: 0.5rem 1rem 1rem 1rem;
    flex: 1;
    overflow: auto;
    /* Ensure content scrolls */
}

.SubAppSection {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.SubAppHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.SubAppTitle {
    font-weight: 600;
    color: var(--text-color);
}

.SubAppName {
    font-size: 0.8rem;
    color: var(--text-muted);
}

.SubAppControls {
    display: flex;
    gap: 0.6rem;
    align-items: center;
}

.TableWrapper {
    width: 100%;
    overflow-x: auto;
    border: var(--glass-border);
    border-radius: var(--radius-sm);
}

.DataTable {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-sm);
}

.DataTable th,
.DataTable td {
    border-bottom: 1px solid var(--glass-border);
    padding: 0.75rem;
    text-align: left;
    white-space: nowrap;
    color: var(--text-color);
}

.DataTable th {
    background: rgba(var(--primary-color), 0.05); /* Fallback or slight tint if supported */
    background: var(--hover-bg);
    color: var(--text-color);
    font-weight: 600;
}

.CellValue {
    display: inline-block;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
}

.TokenBox {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* Animations */
.sidebar-slide-left-enter-active,
.sidebar-slide-left-leave-active,
.sidebar-slide-right-enter-active,
.sidebar-slide-right-leave-active {
    transition: transform 0.25s ease, opacity 0.25s ease, width 0.25s ease;
}

.sidebar-slide-left-enter-from,
.sidebar-slide-left-leave-to {
    transform: translateX(-12px);
    opacity: 0;
}

.sidebar-slide-right-enter-from,
.sidebar-slide-right-leave-to {
    transform: translateX(12px);
    opacity: 0;
}
</style>