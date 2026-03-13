<template>
    <div class="dialog-mask" @click="closeModal">
        <div class="dialog room-manager" @click.stop>
            <div class="dialog-header">
                <div class="dialog-title">管理 - {{ roomInfo.name || roomInfo.roomId }}</div>
                <button class="btn btn-ghost close-btn" @click="closeModal">×</button>
            </div>

            <div class="dialog-body">
                <div class="tabs">
                    <button v-for="tab in tabs" :key="tab.key" class="btn tab-btn"
                        :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
                        {{ tab.label }}
                    </button>
                </div>

                <div class="tab-panel" v-if="activeTab === 'info'">
                    <div class="panel">
                        <div class="field">
                            <label class="label">名称</label>
                            <input v-model="editableRoomInfo.name" class="input"
                                :disabled="!permissions.canModifyRoom" />
                        </div>
                        <div class="field">
                            <label class="label">主题</label>
                            <textarea v-model="editableRoomInfo.topic" class="input textarea" rows="3"
                                :disabled="!permissions.canModifyRoom"></textarea>
                        </div>
                        <!--div class="field">
                            <label class="label">ID</label>
                            <input :value="roomInfo.roomId" class="input" disabled />
                        </div-->
                        <div class="field" v-if="permissions.canModifyRoom">
                            <button class="btn btn-primary" :disabled="updating" @click="updateRoomInfo">
                                {{ updating ? '更新中...' : '更新信息' }}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="tab-panel" v-if="activeTab === 'members'">
                    <div class="panel">
                        <div class="panel-header">
                            <div class="panel-title">
                                成员
                                <span class="badge">{{ joinedMembers.length }}</span>
                                <span v-if="invitedMembers.length" class="badge warning">邀请中 {{ invitedMembers.length
                                }}</span>
                                <span v-if="bannedMembers.length" class="badge danger">封禁 {{ bannedMembers.length
                                }}</span>
                            </div>
                            <!--button v-if="permissions.canInvite" class="btn btn-primary"
                                @click="showInviteDialog = true">
                                邀请成员
                            </button-->
                        </div>

                        <div class="member-list">
                            <div v-for="member in members" :key="member.userId" class="member-item">
                                <div class="member-info">
                                    <div class="avatar">
                                        <img v-if="memberAvatarBlobMap[member.userId]"
                                            :src="memberAvatarBlobMap[member.userId]" :alt="member.displayName" />
                                        <span v-else class="avatar-text">{{ getInitials(member.displayName) }}</span>
                                    </div>
                                    <div class="member-meta">
                                        <div class="member-name">{{ member.displayName || member.userId }}</div>
                                        <!--div class="member-id">{{ member.userId }}</div-->
                                    </div>
                                </div>

                                <div class="member-status">
                                    <span class="status">{{ getMembershipText(member.membership) }}</span>
                                    <span class="power">权限 {{ member.powerLevel }}</span>
                                </div>

                                <!--div class="member-actions" v-if="canManageMember(member)">
                                    <button v-if="member.membership === 'invite'" class="btn btn-ghost"
                                        @click="cancelInvite(member.userId)">
                                        取消邀请
                                    </button>
                                    <button v-if="member.membership === 'join' && !member.isCurrentUser"
                                        class="btn btn-ghost" @click="kickMember(member.userId)">
                                        踢出
                                    </button>
                                    <button
                                        v-if="member.membership === 'join' && !member.isCurrentUser && permissions.canBan"
                                        class="btn btn-danger" @click="banMember(member.userId)">
                                        封禁
                                    </button>
                                    <button v-if="member.membership === 'ban' && permissions.canBan"
                                        class="btn btn-ghost" @click="unbanMember(member.userId)">
                                        解封
                                    </button>
                                </div-->
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tab-panel" v-if="activeTab === 'permissions'">
                    <div class="panel">
                        <div class="panel-title">权限设置</div>
                        <div class="permission-list">
                            <div v-for="member in joinedMembers" :key="member.userId" class="permission-item">
                                <div class="member-meta">
                                    <div class="member-name">{{ member.displayName || member.userId }}</div>
                                    <!--div class="member-id">{{ member.userId }}</div-->
                                </div>
                                <div class="power-control">
                                    <select v-if="canModifyPowerLevel(member)" class="input select"
                                        :value="member.powerLevel" @change="updatePowerLevel(member.userId, $event)">
                                        <option value="0">普通成员</option>
                                        <!--option value="25">版主 (25)</option>
                                        <option value="50">管理员 (50)</option-->
                                        <option v-if="permissions.isOwner" value="100">管理员</option>
                                    </select>
                                    <div v-else class="power-readonly">权限等级: {{ getPowerLevelLabel(member.powerLevel) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tab-panel" v-if="activeTab === 'settings'">
                    <div class="panel">
                        <div class="panel-title">危险操作</div>
                        <button class="btn btn-danger" :disabled="leaving" @click="leaveRoom">
                            {{ leaving ? '离开中...' : '离开' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <InviteDialog v-if="showInviteDialog" :roomId="roomId" @close="showInviteDialog = false" @invited="handleInvited" />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { MATRIX_SERVER_URL } from '@/apiUrls'
import { openConfirmDialog, openMessageDialog } from '@/components/MessageDialog/open'
import { roomManagementService } from '@/services/Matrix/roomManagement'
import { getRoomMembersBe } from '@/services/Project/IM/Room'
import InviteDialog from './InviteDialog.vue'
import type { RoomMemberInfo, RoomPermissions } from '@/types/room-management'
import type { GetSSOUserInfoApiResponse } from '@/types/WeChat'
import { createMatrixAvatarHelper } from '@/utils/matrixAvatar'
import { buildMediaCandidates, fetchWithAuthToBlobUrl } from '@/utils/media'

interface Props {
    roomId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: []; roomUpdated: [roomId: string] }>()

const tabs = [
    { key: 'info', label: '信息' },
    { key: 'members', label: '成员管理' },
   // { key: 'permissions', label: '权限管理' },
   // { key: 'settings', label: '设置' },
]

const activeTab = ref('info')
const members = ref<RoomMemberInfo[]>([])
const permissions = ref<RoomPermissions>({
    canInvite: false,
    canKick: false,
    canBan: false,
    canSendMessages: false,
    canSendStateEvents: false,
    canRedact: false,
    canModifyRoom: false,
    canModifyPowerLevels: false,
    isAdmin: false,
    isOwner: false,
})

const roomInfo = ref({ roomId: props.roomId, name: '', topic: '' })
const editableRoomInfo = ref({ name: '', topic: '' })
const updating = ref(false)
const leaving = ref(false)
const showInviteDialog = ref(false)
const memberAvatarBlobMap = ref<Record<string, string>>({})
const avatarHelper = createMatrixAvatarHelper(MATRIX_SERVER_URL)

const joinedMembers = computed(() => members.value.filter((m) => m.membership === 'join'))
const invitedMembers = computed(() => members.value.filter((m) => m.membership === 'invite'))
const bannedMembers = computed(() => members.value.filter((m) => m.membership === 'ban'))

const closeModal = () => emit('close')

const revokeAllMemberAvatarBlobs = () => {
    for (const url of Object.values(memberAvatarBlobMap.value)) {
        if (url?.startsWith('blob:')) {
            URL.revokeObjectURL(url)
        }
    }
}

const loadMemberAvatarBlobs = async () => {
    const nextMap: Record<string, string> = {}

    for (const member of members.value) {
        const rawUrl = member.avatarUrl?.trim()

        if (rawUrl?.startsWith('mxc://')) {
            const blobUrl = await avatarHelper.resolveAvatarByMxc(rawUrl)
            if (blobUrl) {
                nextMap[member.userId] = blobUrl
                continue
            }
        }

        if (rawUrl) {
            const candidates = buildMediaCandidates(rawUrl)
            for (const candidate of candidates) {
                try {
                    const blobUrl = await fetchWithAuthToBlobUrl(candidate)
                    nextMap[member.userId] = blobUrl
                    break
                } catch {
                    // try next candidate
                }
            }
        }

        if (!nextMap[member.userId]) {
            try {
                const blobUrl = await avatarHelper.resolveAvatarUrl(member.userId)
                if (blobUrl) {
                    nextMap[member.userId] = blobUrl
                }
            } catch {
                // fallback noop
            }
        }
    }

    revokeAllMemberAvatarBlobs()
    memberAvatarBlobMap.value = nextMap
}

const mergeMemberProfiles = (
    baseMembers: RoomMemberInfo[],
    backendMembers: GetSSOUserInfoApiResponse[]
) => {
    const backendMemberMap = new Map(
        backendMembers
            .filter((member) => !!member.im)
            .map((member) => [member.im, member])
    )

    return baseMembers.map((member) => {
        const backendMember = backendMemberMap.get(member.userId)
        const preferredDisplayName = backendMember?.nickname
            || backendMember?.display_name
            || backendMember?.username

        return {
            ...member,
            displayName: preferredDisplayName || member.displayName,
            avatarUrl: backendMember?.avatar_url || member.avatarUrl,
        }
    })
}

const loadRoomData = async () => {
    const info = roomManagementService.getRoomInfo(props.roomId)
    roomInfo.value = info
    editableRoomInfo.value = { name: info.name || '', topic: info.topic || '' }

    const baseMembers = roomManagementService.getRoomMembers(props.roomId, true)
    const roomMembersResult = await getRoomMembersBe(props.roomId)

    if (roomMembersResult.ok && roomMembersResult.data) {
        members.value = mergeMemberProfiles(baseMembers, roomMembersResult.data)
    } else {
        members.value = baseMembers
    }

    permissions.value = roomManagementService.getCurrentUserPermissions(props.roomId)
    void loadMemberAvatarBlobs()
}

onMounted(() => {
    void loadRoomData()
})
watch(() => props.roomId, () => {
    void loadRoomData()
})
onBeforeUnmount(() => {
    revokeAllMemberAvatarBlobs()
    avatarHelper.dispose()
})

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message
    return '未知错误'
}

const updateRoomInfo = async () => {
    if (updating.value) return
    updating.value = true
    try {
        await roomManagementService.updateRoomInfo(props.roomId, {
            name: editableRoomInfo.value.name,
            topic: editableRoomInfo.value.topic,
        })
        openMessageDialog('信息更新成功')
        emit('roomUpdated', props.roomId)
        loadRoomData()
    } catch (error: unknown) {
        openMessageDialog(`更新失败: ${getErrorMessage(error)}`)
    } finally {
        updating.value = false
    }
}
/*
const cancelInvite = async (userId: string) => {
    try {
        await roomManagementService.cancelInvite(props.roomId, userId)
        openMessageDialog('邀请已取消')
        emit('roomUpdated', props.roomId)
        loadRoomData()
    } catch (error: unknown) {
        openMessageDialog(`取消邀请失败: ${getErrorMessage(error)}`)
    }
}

const kickMember = async (userId: string) => {
    const ok = await openConfirmDialog('确定要踢出此成员吗？', {
        title: '确认操作',
        confirmText: '踢出',
        cancelText: '取消',
    })
    if (!ok) return
    try {
        await roomManagementService.kickMember(props.roomId, userId, '被管理员踢出')
        openMessageDialog('成员已被踢出')
        emit('roomUpdated', props.roomId)
        loadRoomData()
    } catch (error: unknown) {
        openMessageDialog(`踢出失败: ${getErrorMessage(error)}`)
    }
}

const banMember = async (userId: string) => {
    const ok = await openConfirmDialog('确定要封禁此成员吗？', {
        title: '确认操作',
        confirmText: '封禁',
        cancelText: '取消',
    })
    if (!ok) return
    try {
        await roomManagementService.banMember(props.roomId, userId, '被管理员封禁')
        openMessageDialog('成员已被封禁')
        emit('roomUpdated', props.roomId)
        loadRoomData()
    } catch (error: unknown) {
        openMessageDialog(`封禁失败: ${getErrorMessage(error)}`)
    }
}

const unbanMember = async (userId: string) => {
    const ok = await openConfirmDialog('确定要解封该成员吗？', {
        title: '确认操作',
        confirmText: '解封',
        cancelText: '取消',
    })
    if (!ok) return
    try {
        await roomManagementService.unbanMember(props.roomId, userId)
        openMessageDialog('成员已解封')
        emit('roomUpdated', props.roomId)
        loadRoomData()
    } catch (error: unknown) {
        openMessageDialog(`解封失败: ${getErrorMessage(error)}`)
    }
}
*/
const updatePowerLevel = async (userId: string, event: Event) => {
    const newLevel = Number((event.target as HTMLSelectElement).value)
    const member = members.value.find((m) => m.userId === userId)
    const oldLevel = member?.powerLevel || 0

    const ok = await openConfirmDialog(`确定要将权限设置为 ${newLevel} 吗？`, {
        title: '确认操作',
        confirmText: '确定',
        cancelText: '取消',
    })
    if (!ok) {
        if (event.target && member) {
            ; (event.target as HTMLSelectElement).value = String(oldLevel)
        }
        return
    }

    try {
        await roomManagementService.updatePowerLevel(props.roomId, userId, newLevel)
        openMessageDialog('权限已更新')
        emit('roomUpdated', props.roomId)
        loadRoomData()
    } catch (error: unknown) {
        openMessageDialog(`更新权限失败: ${getErrorMessage(error)}`)
        loadRoomData()
    }
}

const leaveRoom = async () => {
    const ok = await openConfirmDialog('确定要离开吗？离开后需要重新邀请才能加入。', {
        title: '确认离开',
        confirmText: '离开',
        cancelText: '取消',
    })
    if (!ok) return

    leaving.value = true
    try {
        await roomManagementService.leaveRoom(props.roomId)
        openMessageDialog('已离')
        emit('roomUpdated', props.roomId)
        closeModal()
    } catch (error: unknown) {
        openMessageDialog(`离开失败: ${getErrorMessage(error)}`)
    } finally {
        leaving.value = false
    }
}

const handleInvited = async () => {
    showInviteDialog.value = false
    emit('roomUpdated', props.roomId)
    loadRoomData()
}
/*
const canManageMember = (member: RoomMemberInfo) => {
    if (member.isCurrentUser) return false
    return (
        (member.membership === 'invite' && permissions.value.canInvite) ||
        (member.membership === 'join' && (permissions.value.canKick || permissions.value.canBan)) ||
        (member.membership === 'ban' && permissions.value.canBan)
    )
}
*/
const canModifyPowerLevel = (member: RoomMemberInfo) => {
    if (member.isCurrentUser && !permissions.value.isOwner) return false
    return permissions.value.canModifyPowerLevels && member.powerLevel < (permissions.value.isOwner ? 100 : 50)
}

const getInitials = (name?: string) => {
    if (!name) return '?'
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

const getMembershipText = (membership: string) => {
    const map: Record<string, string> = {
        join: '已加入',
        invite: '待接受',
        leave: '已离开',
        ban: '已封禁',
        knock: '请求加入',
    }
    return map[membership] || membership
}

const getPowerLevelLabel = (powerLevel: number) => {
    if (powerLevel >= 100) return '管理员'
    if (powerLevel >= 25) return '管理员'
    return '普通成员'
}
</script>

<style scoped>
.dialog-mask {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--bg-color) 90%, transparent);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
}

.dialog {
    width: min(760px, 92vw);
    max-height: 88vh;
    background: var(--panel-bg);
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    border-radius: var(--radius-md);
    box-shadow: 0 20px 48px color-mix(in srgb, var(--bg-color) 72%, transparent);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.dialog-header {
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

.tabs {
    display: flex;
    gap: var(--space-sm);
    flex-wrap: wrap;
}

.tab-btn {
    padding: 0.4rem 0.75rem;
}

.tab-btn.active {
    background: var(--primary-color);
    color: var(--btn-text);
}

.tab-panel {
    margin-top: var(--space-sm);
}

.panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
}

.panel-title {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.label {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.textarea {
    min-height: 80px;
    resize: vertical;
}

.member-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.member-item {
    display: grid;
    grid-template-columns: minmax(240px, 1.6fr) minmax(140px, 0.8fr) auto;
    gap: var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--text-color) 6%, transparent);
    align-items: center;
}

.member-info {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
    min-width: 0;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: color-mix(in srgb, var(--text-color) 10%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-text {
    font-weight: 700;
}

.member-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.member-name {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-id {
    font-size: var(--font-xs);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-status {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--font-xs);
    color: var(--text-muted);
    justify-self: end;
    text-align: right;
}

.member-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    justify-self: end;
}

.permission-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.permission-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--text-color) 6%, transparent);
    align-items: center;
}

.power-control {
    min-width: 160px;
}

.select {
    padding: 0.5rem 0.6rem;
}

.power-readonly {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.badge {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: var(--font-xs);
    background: color-mix(in srgb, var(--text-color) 10%, transparent);
    color: var(--text-color);
}

.badge.warning {
    background: color-mix(in srgb, var(--warning-color) 28%, transparent);
    color: var(--warning-color);
}

.badge.danger {
    background: color-mix(in srgb, var(--danger-color) 28%, transparent);
    color: var(--danger-color);
}

.close-btn {
    min-width: 32px;
    height: 32px;
    padding: 0;
    font-size: var(--font-md);
}

@media (max-width: 768px) {
    .member-item {
        grid-template-columns: 1fr;
    }

    .member-actions {
        justify-content: flex-start;
        flex-wrap: wrap;
    }
}
</style>
