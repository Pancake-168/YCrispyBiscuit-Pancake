<template>
  <div class="single-room-manager">
    <div class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>管理 - {{ roomInfo?.name || effectiveRoomId }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="tabs">
            <button v-for="tab in tabs" :key="tab.key" :class="['tab-btn', { active: activeTab === tab.key }]"
              @click="activeTab = tab.key">
              {{ tab.label }}
            </button>
          </div>

          <div class="tab-content">
            <!-- 房间信息 -->
            <div v-if="activeTab === 'info'" class="tab-panel">
              <div class="room-info-panel">
                <div class="info-group">
                  <label>名称</label>
                  <input v-model="editableRoomInfo.name" :disabled="!permissions.canModifyRoom" placeholder="输入名称" />
                </div>

                <div class="info-group">
                  <label>主题</label>
                  <textarea v-model="editableRoomInfo.topic" :disabled="!permissions.canModifyRoom"
                    placeholder="输入主题或描述" rows="3"></textarea>
                </div>

                <div class="info-group">
                  <label>ID</label>
                  <input :value="effectiveRoomId" disabled />
                </div>

                <!--div class="info-group">
                  <label>加密状态</label>
                  <div class="encryption-status">
                    <span :class="['status-badge', roomInfo?.encrypted ? 'encrypted' : 'unencrypted']">
                      {{ roomInfo?.encrypted ? '🔒 已加密' : '🔓 未加密' }}
                    </span>
                  </div>
                </div-->

                <div class="info-group" v-if="permissions.canModifyRoom">
                  <button @click="updateRoomInfo" :disabled="updating" class="update-btn">
                    {{ updating ? '更新中...' : '更新信息' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 成员管理 -->
            <div v-if="activeTab === 'members'" class="tab-panel">
              <div class="members-panel">
                <div class="members-header">
                  <div class="member-stats">
                    <h4>成员</h4>
                    <div class="stats-badges">
                      <span class="stat-badge joined">已加入: {{ joinedMembers.length }}</span>
                      <span class="stat-badge invited" v-if="members.filter(m => m.membership === 'invite').length > 0">
                        邀请中: {{members.filter(m => m.membership === 'invite').length}}
                      </span>
                      <span class="stat-badge banned" v-if="members.filter(m => m.membership === 'ban').length > 0">
                        已封禁: {{members.filter(m => m.membership === 'ban').length}}
                      </span>
                      <span class="stat-badge total">总计: {{ members.length }}</span>
                    </div>
                  </div>
                  <!--button v-if="permissions.canInvite" @click="showInviteDialog = true" class="invite-btn">
                    邀请成员
                  </button-->
                </div>

                <div class="members-list">
                  <div v-for="member in members" :key="member.userId" class="member-item">
                    <div class="member-info">
                      <div class="member-avatar">
                        <img v-if="member.avatarUrl" :src="member.avatarUrl" :alt="member.displayName" />
                        <div v-else class="avatar-placeholder">{{ getInitials(member.displayName) }}</div>
                      </div>
                      <div class="member-details">
                        <span class="member-name">{{ member.displayName }}</span>
                        <span class="member-id">{{ getDisplayUserId(member.userId) }}</span>
                      </div>
                    </div>

                    <div class="member-status">
                      <span :class="['membership-badge', member.membership]">
                        {{ getMembershipText(member.membership) }}
                      </span>
                      <span class="power-level">权限: {{ member.powerLevel }}</span>
                    </div>

                    <div class="member-actions" v-if="canManageMember(member)">
                      <button v-if="member.membership === 'invite'" @click="cancelInvite(member.userId)"
                        class="action-btn cancel">
                        取消邀请
                      </button>
                      <button v-if="member.membership === 'join' && !member.isCurrentUser"
                        @click="kickMember(member.userId)" class="action-btn kick">
                        踢出
                      </button>
                      <button v-if="member.membership === 'join' && !member.isCurrentUser && permissions.canBan"
                        @click="banMember(member.userId)" class="action-btn ban">
                        封禁
                      </button>
                      <button v-if="member.membership === 'ban' && permissions.canBan"
                        @click="unbanMember(member.userId)" class="action-btn unban">
                        解封
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 权限管理 -->
            <div v-if="activeTab === 'permissions'" class="tab-panel">
              <div class="permissions-panel">
                <h4>权限设置</h4>
                <div class="permission-item" v-for="member in joinedMembers" :key="member.userId">
                  <div class="member-info">
                    <span class="member-name">{{ member.displayName }}</span>
                    <span class="member-id">{{ getDisplayUserId(member.userId) }}</span>
                  </div>
                  <div class="power-control" v-if="canModifyPowerLevel(member)">
                    <select :value="member.powerLevel" @change="updatePowerLevel(member.userId, $event)">
                      <option value="0">普通成员 (0)</option>
                      <option value="25">版主 (25)</option>
                      <option value="50">管理员 (50)</option>
                      <option value="100" v-if="permissions.isOwner">所有者 (100)</option>
                    </select>
                  </div>
                  <div v-else class="power-display">
                    权限等级: {{ member.powerLevel }} - {{ getPowerLevelText(member.powerLevel) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 房间设置 -->
          <div v-if="activeTab === 'settings'" class="tab-panel">
            <div class="settings-panel">
              <h4>危险操作</h4>
              <div class="danger-zone">
                <button @click="leaveRoom" class="danger-btn" :disabled="leaving">
                  {{ leaving ? '离开中...' : '离开' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 邀请对话框 -->
  <InviteDialog v-if="showInviteDialog" :roomId="effectiveRoomId" :inviteType="'room'" @close="showInviteDialog = false"
    @invited="handleMemberInvited" />

</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, inject } from 'vue'
import { memberManagementServiceV2 } from '@/services/members/member.service'
import { inviteManagementServiceV2 } from '@/services/members/invite.service'
import { roomServiceV2 } from '@/services/matrix/rooms'
import type { RoomMemberInfo, RoomPermissions } from '@/types/room-management.types'
import InviteDialog from '../InviteDialog.vue'
import { openConfirmDialog, openMessageDialog } from '@/components/MessageDialog/open'
import { resolveUserDisplayName } from '@/utils/displayName'
import { useIDmapStore } from '@/stores/IDmap'

// 支持可选覆盖 roomId；不传则使用 chatContext.currentRoomId
interface Props { roomId?: string }
const props = defineProps<Props>()
const emit = defineEmits<{ close: []; roomUpdated: [roomId: string] }>()

const idmapStore = useIDmapStore()

const chatContext = inject('chatContext') as any
const effectiveRoomId = computed<string>(() => props.roomId || chatContext?.currentRoomId?.value || '')

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

const roomInfo = ref<any>(null)
const editableRoomInfo = ref({ name: '', topic: '' })
const updating = ref(false)
const leaving = ref(false)
const showInviteDialog = ref(false)

const tabs = [
  { key: 'info', label: '信息' },
  { key: 'members', label: '成员管理' },
  { key: 'permissions', label: '权限管理' },
  { key: 'settings', label: '设置' },
]

const joinedMembers = computed(() => members.value.filter(m => m.membership === 'join'))

const closeModal = () => emit('close')

const loadRoomData = async () => {
  const rid = effectiveRoomId.value
  if (!rid) return
  try {
    console.log(`[V2] 开始加载房间 ${rid} 数据`)
    await memberManagementServiceV2.强制刷新房间成员(rid)
    await memberManagementServiceV2.诊断成员同步问题(rid)
    const roomsList = roomServiceV2.获取房间列表()
    const currentRoom = roomsList.find(r => r.roomId === rid)
    roomInfo.value = currentRoom
    if (roomInfo.value) {
      editableRoomInfo.value = {
        name: roomInfo.value.name || '',
        topic: roomInfo.value.topic || '',
      }
    }
    members.value = memberManagementServiceV2.获取房间成员列表(rid, true)
    const stats = memberManagementServiceV2.获取成员统计(rid)
    console.log(`[V2] 房间 ${rid} 成员统计:`, stats)
    permissions.value = memberManagementServiceV2.获取当前用户权限(rid)
    console.log(`[V2] 房间 ${rid} 数据加载完成`)
  } catch (e) {
    console.error('[V2] 加载房间数据失败:', e)
  }
}

const updateRoomInfo = async () => {
  const rid = effectiveRoomId.value
  if (!rid || updating.value) return
  updating.value = true
  try {
    const client = roomServiceV2.获取客户端实例()
    if (!client) throw new Error('客户端未初始化')
    if (editableRoomInfo.value.name !== roomInfo.value?.name) {
      await client.setRoomName(rid, editableRoomInfo.value.name)
    }
    const currentTopic = roomInfo.value?.topic || ''
    if (editableRoomInfo.value.topic !== currentTopic) {
      await client.setRoomTopic(rid, editableRoomInfo.value.topic)
    }
    emit('roomUpdated', rid)
    openMessageDialog('信息更新成功')
    await loadRoomData()
  } catch (e: any) {
    console.error('[V2] 更新房间信息失败:', e)
    openMessageDialog(`更新失败: ${e.message}`)
  } finally {
    updating.value = false
  }
}

const cancelInvite = async (userId: string) => {
  try {
    await inviteManagementServiceV2.取消邀请(effectiveRoomId.value, userId)
    await loadRoomData()
    openMessageDialog('邀请已取消')
  } catch (e: any) {
    openMessageDialog(`取消邀请失败: ${e.message}`)
  }
}

const kickMember = async (userId: string) => {
  if (!await openConfirmDialog('确定要踢出此成员吗？', { title: '确认操作', confirmText: '踢出', cancelText: '取消' })) return
  try {
    await memberManagementServiceV2.踢出成员(effectiveRoomId.value, userId, '被管理员踢出')
    await loadRoomData()
    openMessageDialog('成员已被踢出')
  } catch (e: any) {
    openMessageDialog(`踢出成员失败: ${e.message}`)
  }
}

const banMember = async (userId: string) => {
  if (!await openConfirmDialog('确定要封禁此成员吗？', { title: '确认操作', confirmText: '封禁', cancelText: '取消' })) return
  try {
    await memberManagementServiceV2.封禁成员(effectiveRoomId.value, userId, '被管理员封禁')
    await loadRoomData()
    openMessageDialog('成员已被封禁')
  } catch (e: any) {
    openMessageDialog(`封禁成员失败: ${e.message}`)
  }
}

const unbanMember = async (userId: string) => {
  const member = members.value.find(m => m.userId === userId)
  const memberName = resolveUserDisplayName({ matrixId: userId, matrixDisplayName: member?.displayName || null })
  if (!await openConfirmDialog(`确定要解封 ${memberName} 吗？`, { title: '确认操作', confirmText: '解封', cancelText: '取消' })) return
  try {
    await memberManagementServiceV2.解除封禁(effectiveRoomId.value, userId)
    await loadRoomData()
    openMessageDialog(`${memberName} 已解封`)
  } catch (e: any) {
    openMessageDialog(`解封 ${memberName} 失败: ${e.message || '未知错误'}`)
  }
}

const updatePowerLevel = async (userId: string, event: Event) => {
  const newLevel = parseInt((event.target as HTMLSelectElement).value)
  const member = members.value.find(m => m.userId === userId)
  const oldLevel = member?.powerLevel || 0
  const levelText = getPowerLevelText(newLevel)
  const memberName = resolveUserDisplayName({ matrixId: userId, matrixDisplayName: member?.displayName || null })
  const ok = await openConfirmDialog(`确定要将 ${memberName} 的权限设置为 ${levelText} (${newLevel}) 吗？`, {
    title: '确认操作',
    confirmText: '确定',
    cancelText: '取消',
  })
  if (!ok) {
    if (member) (event.target as HTMLSelectElement).value = oldLevel.toString()
    return
  }
  try {
    const maxLevel = permissions.value.isOwner ? 100 : 50
    if (newLevel > maxLevel) {
      openMessageDialog('权限不足，无法设置此权限等级')
      return
    }
    if (newLevel > oldLevel) {
      await memberManagementServiceV2.提升成员权限(effectiveRoomId.value, userId, newLevel)
    } else {
      await memberManagementServiceV2.降低成员权限(effectiveRoomId.value, userId, newLevel)
    }
    await loadRoomData()
    openMessageDialog(`已成功将 ${memberName} 的权限更新为 ${levelText}`)
  } catch (e: any) {
    openMessageDialog(`更新权限失败: ${e.message}`)
    await loadRoomData()
  }
}

const leaveRoom = async () => {
  if (!await openConfirmDialog('确定要离开吗？离开后需要重新邀请才能加入。', { title: '确认离开', confirmText: '离开', cancelText: '取消' })) return
  leaving.value = true
  try {
    await roomServiceV2.离开房间(effectiveRoomId.value)
    openMessageDialog('已离开')
    emit('roomUpdated', effectiveRoomId.value)
    closeModal()
  } catch (e: any) {
    openMessageDialog(`离开失败: ${e.message}`)
  } finally {
    leaving.value = false
  }
}

const handleMemberInvited = async (userIds: string[], _inviteType: 'room' | 'space', _roomId: string) => {
  console.log('[SingleRoomManager] 邀请成功:', { userIds, roomId: effectiveRoomId.value })
  await loadRoomData()
}

const getInitials = (name?: string) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
const getMembershipText = (membership: string) => {
  const texts: Record<string, string> = { join: '已加入', invite: '待接受', leave: '已离开', ban: '已封禁', knock: '请求加入' }
  return texts[membership] || membership
}
const canManageMember = (member: RoomMemberInfo) => {
  if (member.isCurrentUser) return false
  return (
    (member.membership === 'invite' && permissions.value.canInvite) ||
    (member.membership === 'join' && (permissions.value.canKick || permissions.value.canBan)) ||
    (member.membership === 'ban' && permissions.value.canBan)
  )
}
const canModifyPowerLevel = (member: RoomMemberInfo) => {
  if (member.isCurrentUser && !permissions.value.isOwner) return false
  return permissions.value.canModifyPowerLevels && member.powerLevel < (permissions.value.isOwner ? 100 : 50)
}
const getPowerLevelText = (powerLevel: number): string => {
  if (powerLevel >= 100) return '所有者'
  if (powerLevel >= 50) return '管理员'
  if (powerLevel >= 25) return '版主'
  return '普通成员'
}

const getDisplayUserId = (userId: string) => {
  const user = idmapStore.getByMatrixId(userId)
  return user?.username || ''
}

let refreshTimeout: number | null = null
const debouncedRefresh = () => {
  if (refreshTimeout) clearTimeout(refreshTimeout)
  refreshTimeout = setTimeout(() => {
    console.log(`防抖刷新房间 ${effectiveRoomId.value} 数据`)
    loadRoomData()
    refreshTimeout = null
  }, 1000)
}
const setupMatrixEventListeners = (): (() => void) | null => {
  const client = roomServiceV2.获取客户端实例()
  if (!client) return null
  console.log('[V2] 设置研境AI事件监听器')
  const handleRoomMemberUpdate = (_event: any, member: any) => {
    if (member.roomId === effectiveRoomId.value) {
      console.log(`[V2] 房间 ${effectiveRoomId.value} 成员状态变化:`, member.userId, member.membership)
      debouncedRefresh()
    }
  }
  const handleRoomStateUpdate = (event: any) => {
    if (event.getRoomId() === effectiveRoomId.value) {
      console.log(`[V2] 房间 ${effectiveRoomId.value} 状态变化:`, event.getType())
      if (event.getType() === 'm.room.member' || event.getType() === 'm.room.power_levels') debouncedRefresh()
    }
  }
  const handlePowerLevelUpdate = (event: any) => {
    if (event.getRoomId() === effectiveRoomId.value && event.getType() === 'm.room.power_levels') {
      console.log(`[V2] 房间 ${effectiveRoomId.value} 权限等级变化`)
      debouncedRefresh()
    }
  }
  client.on('RoomMember.membership', handleRoomMemberUpdate)
  client.on('RoomMember.powerLevel', handleRoomMemberUpdate)
  client.on('RoomState.events', handleRoomStateUpdate)
  client.on('Event', handlePowerLevelUpdate)
  return () => {
    client.off('RoomMember.membership', handleRoomMemberUpdate)
    client.off('RoomMember.powerLevel', handleRoomMemberUpdate)
    client.off('RoomState.events', handleRoomStateUpdate)
    client.off('Event', handlePowerLevelUpdate)
  }
}
let cleanupMatrixListeners: (() => void) | null = null
onMounted(() => {
  if (effectiveRoomId.value) {
    loadRoomData()
    cleanupMatrixListeners = setupMatrixEventListeners()
  }
})
onUnmounted(() => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
  if (cleanupMatrixListeners) {
    cleanupMatrixListeners()
    cleanupMatrixListeners = null
  }
})
watch(() => effectiveRoomId.value, (rid) => {
  if (rid) {
    loadRoomData()
    if (cleanupMatrixListeners) cleanupMatrixListeners()
    cleanupMatrixListeners = setupMatrixEventListeners()
  }
})
</script>

<style scoped>
.single-room-manager {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  background: var(--bg-color-third);
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--border-color);
  color: var(--text-color);
}

.modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  padding: 12px 20px;
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: var(--text-color);
  background: var(--bg-color-secondary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

.tab-panel {
  padding: 24px;
}

/* 房间信息面板 */
.room-info-panel .info-group {
  margin-bottom: 20px;
}

.room-info-panel label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-color);
  font-weight: 500;
  font-size: 14px;
}

.room-info-panel input,
.room-info-panel textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-color);
  font-size: 14px;
  resize: vertical;
}

.room-info-panel input:focus,
.room-info-panel textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.room-info-panel input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.encryption-status {
  padding: 8px 0;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.encrypted {
  background: #16a34a;
  color: white;
  border: 1px solid #16a34a;
}

.status-badge.unencrypted {
  background: #ea580c;
  color: white;
  border: 1px solid #ea580c;
}

.update-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.update-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 成员管理面板 */
.members-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 20px;
}

.member-stats h4 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.stats-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.stat-badge.joined {
  background: #16a34a;
  color: white;
  border: 1px solid #16a34a;
}

.stat-badge.invited {
  background: #2563eb;
  color: white;
  border: 1px solid #2563eb;
}

.stat-badge.banned {
  background: #dc2626;
  color: white;
  border: 1px solid #dc2626;
}

.stat-badge.total {
  background: var(--bg-color-secondary);
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color);
}

.invite-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.invite-btn:hover {
  background: var(--color-primary-hover);
}

.members-list {
  max-height: 400px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
  margin-bottom: 8px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.member-details {
  display: flex;
  flex-direction: column;
}

.member-name {
  color: var(--text-color);
  font-weight: 500;
  font-size: 14px;
}

.member-id {
  color: var(--text-color-secondary);
  font-size: 12px;
}

.member-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.membership-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.membership-badge.join {
  background: #22c55e;
  color: white;
}

.membership-badge.invite {
  background: #3b82f6;
  color: white;
}

.membership-badge.leave {
  background: #6b7280;
  color: white;
}

.membership-badge.ban {
  background: #ef4444;
  color: white;
}

.power-level {
  color: var(--text-color-secondary);
  font-size: 11px;
}

.member-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-btn.cancel {
  background: #6b7280;
  color: white;
}

.action-btn.kick {
  background: #fb923c;
  color: white;
}

.action-btn.ban {
  background: #ef4444;
  color: white;
}

.action-btn.unban {
  background: #22c55e;
  color: white;
}

.action-btn:hover {
  opacity: 0.8;
}

/* 权限管理面板 */
.permissions-panel h4 {
  margin: 0 0 20px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
  margin-bottom: 8px;
}

.power-control select {
  padding: 6px 10px;
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.power-control select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.power-control select option {
  background: var(--bg-color-secondary);
  color: var(--text-color);
  padding: 8px;
}

/* 针对不同浏览器的 option 样式优化 */
.power-control select option:hover,
.power-control select option:checked {
  background: var(--color-primary);
  color: white;
}

.power-display {
  color: var(--text-color-secondary);
  font-size: 13px;
}

/* 设置面板 */
.settings-panel h4 {
  margin: 0 0 20px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.danger-zone {
  padding: 20px;

  border: 1px solid #dc2626;
  border-radius: 8px;
  color: white;
}

.danger-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.danger-btn:hover:not(:disabled) {
  background: #dc2626;
}

.danger-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-sm);
    align-items: center;
    justify-content: center;
  }

  .modal-content {
    width: 95vw;
    max-width: none;
    max-height: 90vh;
    border-radius: var(--border-radius-lg);
  }

  .modal-header {
    padding: var(--space-sm) var(--space-md);
  }

  .modal-header h3 {
    font-size: var(--font-size-base);
    font-family: var(--font-family-base);
  }

  .close-btn {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .modal-body {
    overflow: hidden;
  }

  .tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-btn {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-base);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tab-content {
    padding: 0;
  }

  .tab-panel {
    padding: var(--space-md);
  }

  .room-info-panel .info-group {
    margin-bottom: var(--space-md);
  }

  .room-info-panel label {
    font-size: var(--font-size-sm);
    font-family: var(--font-family-base);
  }

  .room-info-panel input,
  .room-info-panel textarea {
    padding: var(--space-sm);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-base);
  }

  .status-badge {
    font-size: var(--font-size-xs);
    font-family: var(--font-family-base);
  }

  .update-btn {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-base);
  }

  .members-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  .member-stats h4 {
    font-size: var(--font-size-base);
    font-family: var(--font-family-base);
  }

  .stats-badges {
    width: 100%;
    justify-content: flex-start;
  }

  .stat-badge {
    font-size: var(--font-size-xs);
    font-family: var(--font-family-base);
  }

  .invite-btn {
    width: 100%;
    padding: var(--space-sm);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-base);
  }

  .members-list {
    max-height: none;
    overflow-y: visible;
  }

  .member-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: var(--space-md);
  }

  .member-info {
    width: 100%;
  }

  .member-status {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .member-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-xs);
    font-family: var(--font-family-base);
    min-width: 60px;
  }

  .permissions-panel h4 {
    font-size: var(--font-size-base);
    font-family: var(--font-family-base);
  }

  .permission-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: var(--space-md);
  }

  .power-control select {
    width: 100%;
    padding: var(--space-sm);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-base);
  }

  .power-display {
    font-size: var(--font-size-sm);
    font-family: var(--font-family-base);
  }

  .settings-panel h4 {
    font-size: var(--font-size-base);
    font-family: var(--font-family-base);
  }

  .danger-zone {
    padding: var(--space-md);
  }

  .danger-btn {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-base);
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: var(--space-xs);
  }

  .modal-content {
    width: 98vw;
    max-height: 95vh;
    border-radius: var(--border-radius-md);
  }

  .modal-header {
    padding: var(--space-sm);
  }

  .modal-header h3 {
    font-size: var(--font-size-sm);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .tab-panel {
    padding: var(--space-sm);
  }

  .room-info-panel .info-group {
    margin-bottom: var(--space-sm);
  }

  .room-info-panel label {
    font-size: var(--font-size-xs);
  }

  .room-info-panel input,
  .room-info-panel textarea {
    padding: var(--space-xs);
    font-size: var(--font-size-xs);
  }

  .status-badge {
    font-size: var(--font-size-xs);
  }

  .update-btn {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-xs);
  }

  .member-stats h4 {
    font-size: var(--font-size-sm);
  }

  .stat-badge {
    font-size: var(--font-size-xs);
  }

  .invite-btn {
    padding: var(--space-xs);
    font-size: var(--font-size-xs);
  }

  .member-item {
    padding: var(--space-sm);
  }

  .action-btn {
    padding: var(--space-xs) var(--space-xs);
    font-size: var(--font-size-xs);
    min-width: 50px;
  }

  .permissions-panel h4 {
    font-size: var(--font-size-sm);
  }

  .permission-item {
    padding: var(--space-sm);
  }

  .power-control select {
    padding: var(--space-xs);
    font-size: var(--font-size-xs);
  }

  .power-display {
    font-size: var(--font-size-xs);
  }

  .settings-panel h4 {
    font-size: var(--font-size-sm);
  }

  .danger-zone {
    padding: var(--space-sm);
  }

  .danger-btn {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-xs);
  }
}
</style>
