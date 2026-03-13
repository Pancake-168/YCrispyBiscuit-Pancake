<template>
    <div class="dialog-mask invite-mask" @click="closeDialog">
        <div class="dialog invite-dialog" @click.stop>
            <div class="dialog-header">
                <div class="dialog-title">邀请成员加入</div>
                <button class="btn btn-ghost close-btn" @click="closeDialog">×</button>
            </div>

            <div class="dialog-body">
                <div class="section">
                    <label class="label">搜索用户</label>
                    <div class="input-row">
                        <input v-model="userIdInput" class="input" placeholder="输入昵称/用户名" @input="handleInputChange"
                            @keyup.enter="addToInviteList" />
                        <button class="btn btn-primary" :disabled="!userIdInput.trim()"
                            @click="addToInviteList">添加</button>
                    </div>

                    <div v-if="showSearchResults" class="search-results">
                        <div v-if="searching" class="search-loading">搜索中...</div>
                        <div v-else-if="searchResults.length === 0" class="no-results">
                            未找到用户
                        </div>
                        <div v-else class="result-list">
                            <div v-for="result in searchResults" :key="result.username" class="result-item"
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

                <div v-if="inviteList.length > 0" class="section">
                    <div class="section-title">待邀请用户</div>
                    <div class="invite-list">
                        <div v-for="user in inviteList" :key="user.username" class="invite-item">
                            <UserSearchResultCore
                                :avatar-url="user.avatarUrl"
                                :fallback-text="getAvatarFallback(user)"
                                :lines="getDisplayValues(user)"
                                @avatar-error="handleAvatarError(user)"
                            />
                            <button class="btn btn-ghost" @click="removeFromInviteList(user.username)">×</button>
                        </div>
                    </div>
                </div>

            </div>

            <div class="dialog-footer">
                <button class="btn btn-ghost" @click="closeDialog">取消</button>
                <button class="btn btn-primary" :disabled="inviteList.length === 0 || sending" @click="sendInvites">
                    {{ sending ? `邀请中... (${currentInviteIndex}/${inviteList.length})` : `邀请 ${inviteList.length} 人` }}
                </button>
            </div>

            <div v-if="inviteResult" class="invite-result">
                <div v-if="inviteResult.succeeded.length > 0" class="result-block success">
                    成功邀请 {{ inviteResult.succeeded.length }} 人
                    <div class="result-list">
                        <div v-for="username in inviteResult.succeeded" :key="username" class="result-item">
                            <div class="candidate-fields">
                                <div class="candidate-field">
                                    <span class="field-label">用户名</span>
                                    <span class="field-value">{{ username }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="inviteResult.failed.length > 0" class="result-block failure">
                    邀请失败 {{ inviteResult.failed.length }} 人
                    <div class="result-list">
                        <div v-for="item in inviteResult.failed" :key="item.username" class="result-item">
                            {{ item.username }}: {{ item.error }}
                        </div>
                    </div>
                </div>
                <button class="btn btn-ghost" @click="resetDialog">继续邀请</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { MATRIX_SERVER_URL } from '@/apiUrls'
import { openMessageDialog } from '@/components/MessageDialog/open'
import { searchUsers } from '@/services/Matrix/search'
import { InviteUsers } from '@/services/Project/CreateRoom/Createroom'
import type { UserSearchResult } from '@/types/room-management'
import { createMatrixAvatarHelper } from '@/utils/matrixAvatar'
import UserSearchResultCore from '@/components/UserSearch/UserSearchResultCore.vue'

interface Props {
    roomId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
    close: []
    invited: [usernames: string[], roomId: string]
}>()

type InviteCandidate = {
    displayName?: string
    nickname?: string
    username: string
    avatarUrl?: string
}

const userIdInput = ref('')
const inviteList = ref<InviteCandidate[]>([])
const sending = ref(false)
const currentInviteIndex = ref(0)
const inviteResult = ref<{
    succeeded: string[]
    failed: Array<{ username: string; error: string }>
} | null>(null)

const searchResults = ref<InviteCandidate[]>([])
const searching = ref(false)
const showSearchResults = ref(false)
let searchTimeout: number | null = null
const avatarHelper = createMatrixAvatarHelper(MATRIX_SERVER_URL)

const closeDialog = () => emit('close')

onBeforeUnmount(() => {
    if (searchTimeout) {
        window.clearTimeout(searchTimeout)
        searchTimeout = null
    }
    avatarHelper.dispose()
})

const getAvatarFallback = (candidate: InviteCandidate): string => {
    return avatarHelper.getFallbackText(candidate.nickname, candidate.username)
}

const handleAvatarError = (candidate: InviteCandidate) => {
    candidate.avatarUrl = undefined
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
    if (!user.username || inviteList.value.some((item) => item.username === user.username)) return
    inviteList.value.push(user)
    userIdInput.value = ''
    searchResults.value = []
    showSearchResults.value = false
}

const enrichCandidateFromSearch = (item: UserSearchResult): InviteCandidate => {
    return {
        displayName: item.nickname || item.username || undefined,
        nickname: item.nickname || undefined,
        username: item.username,
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
        openMessageDialog('请先通过搜索结果选择用户')
        return
    }

    if (inviteList.value.some((item) => item.username === matched.username)) {
        openMessageDialog('该用户已在邀请列表中')
        return
    }

    inviteList.value.push(matched)
    userIdInput.value = ''
    searchResults.value = []
    showSearchResults.value = false
}

const removeFromInviteList = (username: string) => {
    const index = inviteList.value.findIndex((item) => item.username === username)
    if (index > -1) inviteList.value.splice(index, 1)
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message
    return '未知错误'
}

const sendInvites = async () => {
    if (inviteList.value.length === 0 || sending.value) return

    sending.value = true
    currentInviteIndex.value = 0

    const succeeded: string[] = []
    const failed: Array<{ username: string; error: string }> = []

    try {
        const invitees = Array.from(new Set(inviteList.value.map((item) => item.username).filter(Boolean)))
        currentInviteIndex.value = invitees.length

        const result = await InviteUsers(props.roomId, invitees)
        if (!result.ok || !result.data?.room_id) {
            throw new Error('邀请接口调用失败')
        }

        const invitedCount = Number(result.data.invited || 0)
        succeeded.push(...invitees.slice(0, invitedCount))
        failed.push(...invitees.slice(invitedCount).map((username) => ({
            username,
            error: '邀请失败',
        })))

        inviteResult.value = { succeeded, failed }
        if (succeeded.length > 0) emit('invited', succeeded, props.roomId)
    } catch (error: unknown) {
        openMessageDialog(`邀请过程中发生错误: ${getErrorMessage(error)}`)
    } finally {
        sending.value = false
    }
}

const resetDialog = () => {
    inviteList.value = []
    inviteResult.value = null
    currentInviteIndex.value = 0
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

.invite-mask {
    background: color-mix(in srgb, var(--bg-color) 92%, transparent);
    backdrop-filter: blur(3px);
    z-index: 1010;
}

.dialog {
    width: min(560px, 90vw);
    max-height: 80vh;
    background: var(--glass-bg);
    border: var(--glass-border);
    border-radius: var(--radius-md);
    box-shadow: var(--glass-shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.invite-dialog {
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

.section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
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

.textarea {
    min-height: 88px;
    resize: vertical;
}

.search-results {
    background: color-mix(in srgb, var(--panel-bg) 94%, var(--bg-color));
    border-radius: var(--radius-sm);
    padding: var(--space-sm);
}

.result-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.result-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0;
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    cursor: pointer;
    background: color-mix(in srgb, var(--text-color) 6%, transparent);
}

.result-item:hover {
    background: var(--hover-bg);
}

.candidate-fields {
    display: grid;
    gap: 6px;
    flex: 1;
}

.candidate-field {
    display: flex;
    gap: 8px;
    align-items: baseline;
    font-size: var(--font-xs);
}

.field-label {
    min-width: 78px;
    color: var(--text-muted);
}

.field-value {
    color: var(--text-color);
    word-break: break-all;
}

.invite-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.invite-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0;
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--text-color) 6%, transparent);
}

.invite-item > .btn {
    margin-left: auto;
    align-self: center;
}

.invite-result {
    padding: var(--space-md);
    border-top: var(--glass-border);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.invite-result .result-item {
    cursor: default;
}

.result-block {
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--text-color) 6%, transparent);
}

.result-block.success {
    border-left: 3px solid var(--primary-color);
}

.result-block.failure {
    border-left: 3px solid var(--danger-color);
}

.close-btn {
    min-width: 32px;
    height: 32px;
    padding: 0;
    font-size: var(--font-md);
}
</style>
