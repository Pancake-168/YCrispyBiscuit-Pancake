<template>
    <div class="dialog-mask create-room-mask" @click="closeDialog">
        <div class="dialog create-room-dialog" @click.stop>
            <div class="dialog-header">
                <div class="dialog-title">创建群聊</div>
                <button class="btn btn-ghost close-btn" @click="closeDialog">×</button>
            </div>

            <div class="dialog-body">
                <div class="section two-columns">
                    <div class="field-block">
                        <label class="label">群聊名称（可选）</label>
                        <input v-model="roomName" class="input" placeholder="" />
                    </div>

                    <div class="field-block">
                        <label class="label">群聊主题（可选）</label>
                        <input v-model="roomTopic" class="input" placeholder="例如：项目群、临时讨论" />
                    </div>
                </div>

                <div class="content-grid">
                    <div class="main-column">
                        <div class="section">
                            <label class="label">搜索用户</label>
                            <div class="input-row search-input-row">
                                <input v-model="userIdInput" class="input" placeholder="输入昵称/用户名" @input="handleInputChange"
                                    @keyup.enter="addToInviteList" />
                            </div>

                            <div v-if="showSearchResults" class="search-results">
                                <div v-if="searching" class="search-loading">搜索中...</div>
                                <div v-else-if="searchResults.length === 0" class="no-results">未找到可邀请成员</div>
                                <div v-else class="result-list">
                                    <div v-for="result in searchResults" :key="getCandidateKey(result)" class="result-item"
                                        @click="selectSearchUser(result)">
                                        <UserSearchResultCore
                                            :avatar-url="result.avatarUrl"
                                            :fallback-text="getAvatarFallback(result)"
                                            :lines="getDisplayValues(result)"
                                            @avatar-error="handleAvatarError(result)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="organizationUsers.length > 0" class="section section-fill">
                            <div class="section-headline">
                                <div class="section-title">当前组织成员</div>
                                <div class="section-subtitle">可直接点选加入邀请列表，已自动排除重复成员</div>
                            </div>

                            <div class="organization-list">
                                <button
                                    v-for="user in filteredOrganizationUsers"
                                    :key="user.username"
                                    class="organization-user"
                                    type="button"
                                    :disabled="isOrganizationUserResolving(user.username)"
                                    @click="selectOrganizationUser(user)"
                                >
                                    <UserSearchResultCore
                                        :avatar-url="user.avatarUrl"
                                        :fallback-text="getOrganizationAvatarFallback(user)"
                                        :lines="getOrganizationDisplayValues(user)"
                                        @avatar-error="handleOrganizationAvatarError(user.username)"
                                    />
                                    <span class="organization-user-action">
                                        {{ isOrganizationUserResolving(user.username) ? '添加中...' : '添加' }}
                                    </span>
                                </button>
                            </div>

                            <div v-if="!filteredOrganizationUsers.length" class="no-results">当前筛选下暂无可添加组织成员</div>
                        </div>
                    </div>

                    <div class="side-column">
                        <div class="section section-fill invite-panel">
                            <div class="section-headline">
                                <div class="section-title">待邀请用户</div>
                                <div class="section-subtitle">{{ inviteList.length }} 人</div>
                            </div>

                            <div v-if="inviteList.length > 0" class="invite-list">
                                <div v-for="user in inviteList" :key="getCandidateKey(user)" class="invite-item">
                                    <UserSearchResultCore
                                        :avatar-url="user.avatarUrl"
                                        :fallback-text="getAvatarFallback(user)"
                                        :lines="getDisplayValues(user)"
                                        @avatar-error="handleAvatarError(user)"
                                    />
                                    <button class="btn btn-ghost invite-remove-btn" @click="removeFromInviteList(getCandidateKey(user))">×</button>
                                </div>
                            </div>

                            <div v-else class="invite-empty">
                                <div class="invite-empty-title">还没有选择成员</div>
                                <div class="invite-empty-text">从左侧搜索结果或组织成员列表中点选用户，右侧会实时汇总待邀请名单。</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dialog-footer">
                <button class="btn btn-ghost" @click="closeDialog">取消</button>
                <button class="btn btn-primary" :disabled="creating" @click="createRoom">
                    {{ creating ? '创建中...' : '创建' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MATRIX_SERVER_URL } from '@/apiUrls'
import { openMessageDialog } from '@/components/MessageDialog/open'
import { CreateRoom } from '@/services/Project/CreateRoom/Createroom'
import { searchUsers } from '@/services/Matrix/search'
import { useOrganizationStore } from '@/stores/Organization'
import { useWechatStore } from '@/stores/WeChat'
import type { UserSearchResult } from '@/types/room-management'
import type { ApplicationUserItem } from '@/types/application'
import { createMatrixAvatarHelper } from '@/utils/matrixAvatar'
import UserSearchResultCore from '@/components/UserSearch/UserSearchResultCore.vue'
import { storeToRefs } from 'pinia'

type InviteCandidate = {
    displayName?: string
    nickname?: string
    username: string
    avatarUrl?: string
}

type OrganizationUserCandidate = {
    id: string
    username: string
    nickname?: string
    displayName: string
    atype: 'user'
    avatarUrl?: string
}

defineProps<{
    defaultSpaceRoomId?: string
}>()

const emit = defineEmits<{
    close: []
    created: [roomId: string]
}>()

const roomName = ref('')
const roomTopic = ref('')
const creating = ref(false)
const userIdInput = ref('')
const inviteList = ref<InviteCandidate[]>([])
const searchResults = ref<InviteCandidate[]>([])
const searching = ref(false)
const showSearchResults = ref(false)
const resolvingOrganizationUsers = ref<string[]>([])
const organizationAvatarMap = ref<Record<string, string | null>>({})
const organizationAvatarLoading = ref<string[]>([])
let searchTimeout: number | null = null
const avatarHelper = createMatrixAvatarHelper(MATRIX_SERVER_URL)
const organizationStore = useOrganizationStore()
const wechatStore = useWechatStore()
const { currentOrganization, currentApplicationUsers } = storeToRefs(organizationStore)

const closeDialog = () => emit('close')

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message
    return '未知错误'
}

const getAvatarFallback = (candidate: InviteCandidate): string => {
    return avatarHelper.getFallbackText(candidate.nickname, candidate.username)
}

const getOrganizationAvatarFallback = (candidate: OrganizationUserCandidate): string => {
    return avatarHelper.getFallbackText(candidate.nickname, candidate.username, candidate.username)
}

const handleAvatarError = (candidate: InviteCandidate) => {
    candidate.avatarUrl = undefined
}

const handleOrganizationAvatarError = (username: string) => {
    organizationAvatarMap.value = {
        ...organizationAvatarMap.value,
        [username]: null,
    }
}

onBeforeUnmount(() => {
    if (searchTimeout) {
        window.clearTimeout(searchTimeout)
        searchTimeout = null
    }
    avatarHelper.dispose()
})

onMounted(() => {
    const appid = currentOrganization.value?.app_id
    if (appid) {
        organizationStore.loadApplicationUsers(String(appid)).catch(() => undefined)
    }
})

const isCandidateInvited = (candidate: { userId?: string; username?: string }): boolean => {
    return inviteList.value.some((item) => {
        if (candidate.username && item.username === candidate.username) return true
        return false
    })
}

const getCandidateKey = (candidate: { username?: string }): string => {
    return candidate.username || ''
}

const organizationUsers = computed<OrganizationUserCandidate[]>(() => {
    const result = currentApplicationUsers.value
    const currentUsername = wechatStore.userProfile?.username || ''
    const list = Array.isArray(result?.data) ? result.data : []

    return list
        .filter((item: ApplicationUserItem) => String(item.type).toLowerCase() !== 'bot')
        .filter((item: ApplicationUserItem) => item.username && item.username !== currentUsername)
        .map((item: ApplicationUserItem) => ({
            id: String(item.id),
            username: item.username,
            nickname: item.nickname || undefined,
            displayName: item.nickname || item.username || '未知成员',
            atype: 'user',
            avatarUrl: organizationAvatarMap.value[item.username] || undefined,
        }))
})

const isOrganizationAvatarLoading = (username: string): boolean => {
    return organizationAvatarLoading.value.includes(username)
}

const preloadOrganizationAvatar = async (user: OrganizationUserCandidate) => {
    if (!user.username || Object.prototype.hasOwnProperty.call(organizationAvatarMap.value, user.username) || isOrganizationAvatarLoading(user.username)) {
        return
    }

    organizationAvatarLoading.value = [...organizationAvatarLoading.value, user.username]
    try {
        const avatarUrl = await avatarHelper.resolveAvatarUrl(user.username)
        organizationAvatarMap.value = {
            ...organizationAvatarMap.value,
            [user.username]: avatarUrl || null,
        }
    } catch {
        organizationAvatarMap.value = {
            ...organizationAvatarMap.value,
            [user.username]: null,
        }
    } finally {
        organizationAvatarLoading.value = organizationAvatarLoading.value.filter((item) => item !== user.username)
    }
}

watch(
    organizationUsers,
    (users) => {
        users.slice(0, 24).forEach((user) => {
            void preloadOrganizationAvatar(user)
        })
    },
    { immediate: true }
)

const filteredOrganizationUsers = computed(() => {
    const keyword = userIdInput.value.trim().toLowerCase()
    return organizationUsers.value.filter((item) => {
        if (isCandidateInvited({ username: item.username })) return false
        if (!keyword) return true
        return [item.displayName, item.nickname, item.username]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword))
    })
})

const isOrganizationUserResolving = (username: string): boolean => {
    return resolvingOrganizationUsers.value.includes(username)
}

const enrichCandidateFromSearch = (item: UserSearchResult): InviteCandidate => {
    return {
        displayName: item.nickname || item.username || undefined,
        nickname: item.nickname || undefined,
        username: item.username || '',
    }
}

const handleInputChange = () => {
    showSearchResults.value = !!userIdInput.value.trim()
    if (searchTimeout) window.clearTimeout(searchTimeout)

    if (!userIdInput.value.trim()) {
        searchResults.value = []
        searching.value = false
        return
    }

    searching.value = true
    searchTimeout = window.setTimeout(async () => {
        const keyword = userIdInput.value.trim()
        try {
            const results = await searchUsers(keyword)
            const baseCandidates = results
                .filter((item) => String(item.atype).toLowerCase() !== 'bot')
                .filter((item) => !!item.username)
                .map(enrichCandidateFromSearch)
            const candidates = await Promise.all(
                baseCandidates.map(async (candidate) => ({
                    ...candidate,
                    avatarUrl: await avatarHelper.resolveAvatarUrl(candidate.username),
                }))
            )

            if (userIdInput.value.trim() === keyword) {
                searchResults.value = candidates
            }
        } catch {
            searchResults.value = []
        } finally {
            searching.value = false
        }
    }, 300)
}

const selectSearchUser = (user: InviteCandidate) => {
    if (!user.username || isCandidateInvited(user)) return
    inviteList.value.push(user)
    userIdInput.value = ''
    searchResults.value = []
    showSearchResults.value = false
}

const selectOrganizationUser = async (user: OrganizationUserCandidate) => {
    if (!user.username || isCandidateInvited({ username: user.username }) || isOrganizationUserResolving(user.username)) return

    resolvingOrganizationUsers.value = [...resolvingOrganizationUsers.value, user.username]
    try {
        const candidate: InviteCandidate = {
            displayName: user.displayName,
            nickname: user.nickname,
            username: user.username,
            avatarUrl: user.avatarUrl || await avatarHelper.resolveAvatarUrl(user.username),
        }

        if (isCandidateInvited(candidate)) {
            return
        }

        inviteList.value.push(candidate)
    } catch (error) {
        console.warn('[System:CreateRoomDialog:selectOrganizationUser] 解析组织成员失败:', error)
        openMessageDialog('添加组织成员失败，请稍后再试')
    } finally {
        resolvingOrganizationUsers.value = resolvingOrganizationUsers.value.filter((item) => item !== user.username)
    }
}

const addToInviteList = () => {
    const value = userIdInput.value.trim()
    if (!value) return

    const matched = searchResults.value.find((item) => {
        return (
            item.username === value ||
            item.nickname === value ||
            item.displayName === value
        )
    })

    if (!matched) {
        openMessageDialog('请先通过搜索结果选择用户，不能手动输入 Matrix ID 邀请')
        return
    }

    if (isCandidateInvited(matched)) {
        openMessageDialog('该用户已在邀请列表中')
        return
    }

    inviteList.value.push(matched)

    userIdInput.value = ''
    searchResults.value = []
    showSearchResults.value = false
}

const removeFromInviteList = (candidateKey: string) => {
    const index = inviteList.value.findIndex((item) => getCandidateKey(item) === candidateKey)
    if (index > -1) inviteList.value.splice(index, 1)
}

const getDisplayFields = (candidate: InviteCandidate) => {
    const fields: Array<{ label: string; value: string }> = []
    if (candidate.nickname) fields.push({ label: '昵称', value: candidate.nickname })
    if (candidate.displayName && !candidate.nickname) fields.push({ label: '昵称', value: candidate.displayName })
    if (candidate.username) fields.push({ label: '用户名', value: candidate.username })
    if (fields.length === 0) fields.push({ label: '昵称', value: '-' })
    return fields
}

const getDisplayValues = (candidate: InviteCandidate): string[] => {
    return getDisplayFields(candidate).map((item) => item.value)
}

const getOrganizationDisplayValues = (candidate: OrganizationUserCandidate): string[] => {
    return [candidate.displayName, candidate.username, '组织成员']
}

const createRoom = async () => {
    if (creating.value) return
    if (inviteList.value.length === 0) {
        openMessageDialog('请至少选择一位成员后再创建群聊')
        return
    }

    creating.value = true
    try {
        const invitees = Array.from(new Set(inviteList.value.map((item) => item.username).filter(Boolean)))
        const result = await CreateRoom(invitees, roomName.value.trim() || '', roomTopic.value.trim())

        if (!result.ok || !result.data?.room_id) {
            throw new Error('后端未返回 room_id')
        }

        emit('created', result.data.room_id)
        emit('close')
        openMessageDialog(`群聊创建成功，共邀请 ${invitees.length} 人`)
    } catch (error: unknown) {
        openMessageDialog(`创建失败: ${getErrorMessage(error)}`)
    } finally {
        creating.value = false
    }
}
</script>

<style scoped>
.dialog-mask {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--bg-color) 88%, transparent);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1002;
}

.create-room-mask {
    background: color-mix(in srgb, var(--bg-color) 92%, transparent);
    backdrop-filter: blur(3px);
    z-index: 1010;
}

.dialog {
    width: min(980px, 94vw);
    max-height: 80vh;
    background: var(--glass-bg);
    border: var(--glass-border);
    border-radius: var(--radius-md);
    box-shadow: var(--glass-shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.create-room-dialog {
    background: var(--panel-bg);
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    box-shadow: 0 20px 48px color-mix(in srgb, var(--bg-color) 72%, transparent);
}

.dialog-header,
.dialog-footer {
    padding: var(--space-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
}

.dialog-title {
    font-size: var(--font-base);
    font-weight: 600;
}

.dialog-body {
    padding: var(--space-md);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-md);
    min-height: 0;
    align-items: start;
}

.main-column,
.side-column {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.section-fill {
    min-height: 0;
}

.invite-panel {
    height: 100%;
    position: sticky;
    top: 0;
}

.section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.two-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
}

.field-block {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.section-title {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.section-headline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    flex-wrap: wrap;
}

.invite-panel > .section-headline {
    position: sticky;
    top: 0;
    z-index: 1;
    margin: calc(var(--space-sm) * -1) calc(var(--space-sm) * -1) 0;
    padding: var(--space-sm);
    background: color-mix(in srgb, var(--panel-bg) 96%, var(--bg-color));
    border-bottom: 1px solid color-mix(in srgb, var(--text-color) 8%, transparent);
}

.section-subtitle {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.label {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.input-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-sm);
}

.search-input-row {
    grid-template-columns: 1fr;
}

.search-results {
    border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
    border-radius: var(--radius-sm);
    max-height: 220px;
    overflow-y: auto;
}

.search-loading,
.no-results {
    padding: var(--space-sm);
    color: var(--text-muted);
    font-size: var(--font-xs);
}

.result-list,
.invite-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.organization-list {
    max-height: 420px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.result-item,
.invite-item {
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--text-color) 8%, transparent);
    background: color-mix(in srgb, var(--panel-bg) 96%, var(--bg-color));
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 0;
}

.result-item {
    cursor: pointer;
}

.result-item:hover {
    background: color-mix(in srgb, var(--panel-bg) 90%, var(--bg-color));
}

.organization-user {
    width: 100%;
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--text-color) 8%, transparent);
    background: color-mix(in srgb, var(--panel-bg) 96%, var(--bg-color));
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    color: var(--text-color);
    cursor: pointer;
    text-align: left;
}

.organization-user:hover:not(:disabled) {
    background: color-mix(in srgb, var(--panel-bg) 90%, var(--bg-color));
}

.organization-user:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.organization-user-action {
    margin-left: auto;
    font-size: var(--font-xs);
    color: var(--primary-color);
    white-space: nowrap;
    flex: 0 0 auto;
}

.invite-item > .btn {
    margin-left: auto;
    align-self: center;
}

.invite-list {
    max-height: 420px;
    overflow-y: auto;
    padding-top: var(--space-xs);
}

.invite-remove-btn {
    flex: 0 0 auto;
}

.invite-empty {
    min-height: 180px;
    border: 1px dashed color-mix(in srgb, var(--text-color) 16%, transparent);
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
    text-align: center;
    padding: var(--space-md);
    gap: var(--space-xs);
    color: var(--text-muted);
}

.invite-empty-title {
    color: var(--text-color);
    font-size: var(--font-sm);
    font-weight: 600;
}

.invite-empty-text {
    font-size: var(--font-xs);
    line-height: 1.6;
}

@media (max-width: 640px) {
    .dialog {
        width: min(96vw, 96vw);
    }

    .two-columns {
        grid-template-columns: 1fr;
    }

    .content-grid {
        grid-template-columns: 1fr;
    }

    .organization-list,
    .invite-list {
        max-height: 240px;
    }
}
</style>
