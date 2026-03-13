<template>
    <div v-if="visible" class="user-profile-overlay" @click.self="close">
        <div class="user-profile-dialog">
            <div v-if="loading" class="loading-state">
                <div class="loading-spinner"></div>
                <p>正在加载用户信息...</p>
            </div>

            <div v-else-if="error" class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>加载失败</h3>
                <p>{{ error }}</p>
                <button @click="retryLoad" class="retry-btn">重试</button>
            </div>

            <div v-else-if="userInfo" class="user-profile-content">
                <div class="upc-header"></div>

                <div class="user-basic-info">
                    <div class="avatar-section">
                        <img v-if="userInfo.avatarUrl" :src="userInfo.avatarUrl" :alt="userInfo.displayName"
                            class="user-avatar" />
                        <div v-else class="default-avatar">{{ userInfo.displayName?.charAt(0)?.toUpperCase() || '?' }}
                        </div>
                    </div>

                    <div class="user-details">
                        <h4 class="user-name">{{ userInfo.displayName || '未知用户' }}</h4>
                        <p class="user-id">{{ userInfo.userId }}</p>
                        <div class="user-status">
                            <span class="status-indicator" :class="userInfo.presence || 'unknown'">{{
                                getPresenceText(userInfo.presence) }}</span>
                            <span v-if="userInfo.lastSeen" class="last-seen">最后在线: {{ formatLastSeen(userInfo.lastSeen)
                                }}</span>
                        </div>
                    </div>
                </div>

                <div class="user-details-section">
                    <div class="detail-group">
                        <label>服务器</label>
                        <span>{{ userInfo.serverName || '未知' }}</span>
                    </div>

                    <div v-if="userInfo.verified !== undefined" class="detail-group">
                        <label>验证状态</label>
                        <span class="verified-badge" :class="{ verified: userInfo.verified }">{{ userInfo.verified ?
                            '已验证' : '未验证' }}</span>
                    </div>

                    <div v-if="userInfo.bio" class="detail-group">
                        <label>个人简介</label>
                        <span>{{ userInfo.bio }}</span>
                    </div>

                    <div v-if="userInfo.contactInfo" class="detail-group">
                        <label>联系方式</label>
                        <span>{{ userInfo.contactInfo }}</span>
                    </div>
                </div>

                <div class="action-buttons">
                    <button @click="startQuickChat" class="quick-chat-btn">快速对话</button>
                    <button @click="copyUserId" class="copy-id-btn">复制ID</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { matrixClientV2 } from '@/services/matrix/client'
import { resolveUserDisplayName } from '@/utils/displayName'

interface Props {
    visible: boolean
    userId: string
}
const props = defineProps<Props>()

const emit = defineEmits<{ close: []; quickChat: [userId: string, nickname: string] }>()

const loading = ref(false)
const error = ref('')
const userInfo = ref<any>(null)

const close = () => emit('close')
const retryLoad = () => loadUserProfile()

const loadUserProfile = async () => {
    if (!props.userId) return
    loading.value = true
    error.value = ''
    try {
        const client = matrixClientV2.getAuthedClient()
        if (!client) throw new Error('研境AI 客户端未初始化')

        const profile = await client.getProfileInfo(props.userId)
        let presence = 'unknown'
        try {
            const presenceData = await client.getPresence(props.userId)
            presence = presenceData.presence || 'unknown'
        } catch { }

        userInfo.value = {
            userId: props.userId,
            displayName: resolveUserDisplayName({
                matrixId: props.userId,
                matrixDisplayName: profile.displayname || null,
            }),
            avatarUrl: profile.avatar_url ? client.mxcUrlToHttp(profile.avatar_url) : undefined,
            presence,
            serverName: props.userId.split(':')[1] || '未知',
            bio: profile.bio || undefined,
            contactInfo: profile.contact_info || undefined,
            verified: profile.verified,
        }
    } catch (err: any) {
        error.value = err.message || '加载用户信息失败'
    } finally {
        loading.value = false
    }
}

const getPresenceText = (presence?: string) => ({
    online: '在线',
    offline: '离线',
    unavailable: '忙碌',
    unknown: '未知',
}[presence || 'unknown'] || '未知')

const formatLastSeen = (ts: number) => new Date(ts).toLocaleString()

const startQuickChat = () => {
    if (userInfo.value) emit('quickChat', userInfo.value.userId, userInfo.value.displayName)
}

const copyUserId = async () => {
    if (!userInfo.value) return
    try { await navigator.clipboard.writeText(userInfo.value.userId) } catch { }
}

watch(() => props.visible, v => { if (v && props.userId) loadUserProfile() })
watch(() => props.userId, id => { if (id && props.visible) loadUserProfile() })

onMounted(() => { if (props.visible && props.userId) loadUserProfile() })
</script>

<style scoped>
.user-profile-overlay {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: var(--bg-color-mask, rgba(0, 0, 0, 0.45));
 z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.user-profile-dialog {
    background: var(--bg-color-third);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    width: min(360px, 96vw);
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: var(--font-family-base);
}

.loading-state,
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 16px;
    text-align: center;
    background: var(--bg-color-third);
    font-family: var(--font-family-base);
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid var(--bg-color-fourth);
    border-top: 2px solid var(--bg-color-fifth);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg)
    }

    100% {
        transform: rotate(360deg)
    }
}

.error-icon {
    font-size: 40px;
    margin-bottom: 12px;
    color: var(--text-color-secondary);
}

.retry-btn {
    padding: 6px 16px;
    background: var(--bg-color-fifth);
    color: var(--bg-color-third);
    border: none;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-base);
    transition: var(--transition-duration) var(--transition-timing);
}

.retry-btn:hover {
    background: var(--bg-color);
    transform: translateY(-1px);
}

.user-profile-content {
    display: flex;
    flex-direction: column;
    background: var(--bg-color-third);
    font-family: var(--font-family-base);
}

.upc-header {
    height: 96px;
    background: linear-gradient(135deg, var(--bg-color-fourth), var(--bg-color-fifth));
}

.user-basic-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 14px 12px;
    background: var(--bg-color-third);
    margin-top: -32px;
}

.avatar-section {
    flex-shrink: 0;
}

.user-avatar,
.default-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 0 0 3px var(--bg-color-third);
}

.default-avatar {
    background: var(--bg-color-fifth);
    color: var(--bg-color-third);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
}

.user-details {
    flex: 1;
    min-width: 0;
}

.user-name {
    margin: 0 0 2px 0;
    color: var(--text-color);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-base);
    word-break: break-word;
    line-height: 1.2;
}

.user-id {
    margin: 0 0 2px 0;
    color: var(--text-color-secondary);
    font-size: var(--font-size-xs);
    font-family: 'Monaco', 'Consolas', monospace;
    word-break: break-all;
    padding: 1px 4px;
    border-radius: var(--border-radius-sm);
    line-height: 1.2;
}

.user-status {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
}

.status-indicator {
    padding: 2px 6px;
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: .5px;
    line-height: 1.2;
}

.status-indicator.online {
    background: var(--bg-color-fifth);
    color: var(--bg-color-third);
}

.status-indicator.offline,
.status-indicator.unknown {
    background: var(--bg-color-fourth);
    color: var(--text-color-secondary);
}

.status-indicator.unavailable {
    background: var(--bg-color-fourth);
    color: var(--text-color);
}

.last-seen {
    color: var(--text-color-secondary);
    font-size: var(--font-size-xs);
    font-style: italic;
}

.verified-badge {
    padding: 4px 8px;
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: .5px;
}

.verified-badge.verified {
    background: var(--bg-color-fifth);
    color: var(--bg-color-third);
}

.verified-badge:not(.verified) {
    background: var(--bg-color-fourth);
    color: var(--text-color-secondary);
}

.user-details-section {
    padding: 12px 14px 10px;
    background: var(--bg-color-third);
}

.detail-group {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 6px;
    gap: 8px;
    padding: 8px 10px;
    background: var(--bg-color-fourth);
    border-radius: 10px;
}

.detail-group:last-child {
    margin-bottom: 0;
}

.detail-group label {
    color: var(--text-color-secondary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    flex-shrink: 0;
    min-width: 60px;
    font-family: var(--font-family-base);
}

.detail-group span {
    color: var(--text-color);
    font-size: var(--font-size-xs);
    word-break: break-word;
    flex: 1;
    text-align: right;
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-base);
    line-height: 1.2;
}

.action-buttons {
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding: 12px 14px 14px;
    background: var(--bg-color-third);
    justify-content: center;
}

.quick-chat-btn,
.copy-id-btn,
.block-btn {
    padding: 6px 10px;
    border: none;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-base);
    transition: var(--transition-duration) var(--transition-timing);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: .5px;
    line-height: 1.2;
    flex: 1;
    min-width: 0;
}

.quick-chat-btn {
    background: var(--bg-color-fifth);
    color: var(--bg-color-third);
    box-shadow: var(--shadow-sm);
}

.quick-chat-btn:hover {
    background: var(--bg-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.copy-id-btn {
    background: var(--bg-color-fourth);
    color: var(--text-color);
}

.copy-id-btn:hover {
    background: var(--bg-color-fifth);
    transform: translateY(-1px);
}

.block-btn {
    background: var(--bg-color-fourth);
    color: var(--text-color);
}

.block-btn:hover {
    background: var(--bg-color);
    transform: translateY(-1px);
}

.block-btn.blocked {
    background: var(--bg-color-fifth);
    color: var(--bg-color-third);
}

.block-btn.blocked:hover {
    background: var(--bg-color);
}

@media (max-width: 768px) {
    .user-profile-overlay {
        padding: 12px;
    }

    .user-profile-dialog {
        width: 92vw;
        max-width: 360px;
        max-height: 85vh;
        border-radius: 12px;
    }

    .loading-state,
    .error-state {
        padding: 16px 12px;
    }

    .user-basic-info {
        padding: 12px;
        gap: 10px;
    }

    .user-avatar,
    .default-avatar {
        width: 48px;
        height: 48px;
    }

    .user-name {
        font-size: var(--font-size-sm);
    }
}

@media (max-width: 480px) {
    .user-profile-overlay {
        padding: 8px;
    }

    .user-profile-dialog {
        width: 94vw;
        max-width: 340px;
        max-height: 85vh;
        border-radius: 10px;
    }

    .loading-state,
    .error-state {
        padding: 12px 10px;
    }

    .user-basic-info {
        padding: 10px;
        gap: 8px;
    }

    .user-avatar,
    .default-avatar {
        width: 44px;
        height: 44px;
    }
}
</style>
