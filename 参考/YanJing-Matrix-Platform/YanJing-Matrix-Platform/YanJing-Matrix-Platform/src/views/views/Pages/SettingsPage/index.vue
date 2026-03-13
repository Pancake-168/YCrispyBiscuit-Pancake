<template>
    <div class="PageContainer">
        <div class="LeftContent" v-show="sidebarStore.sidebars.sidebar6.left">
            <div class="module-list">
                <button class="module-item" :class="{ 'is-active': activeModule === 'system' }" @click="activeModule = 'system'">
                    系统设置
                </button>
                <button class="module-item" :class="{ 'is-active': activeModule === 'profile' }" @click="activeModule = 'profile'">
                    个人信息设置
                </button>
            </div>
        </div>

        <div class="MiddleContent">
            <div class="module-list mobile-module-list">
                <button class="module-item" :class="{ 'is-active': activeModule === 'system' }" @click="activeModule = 'system'">
                    系统设置
                </button>
                <button class="module-item" :class="{ 'is-active': activeModule === 'profile' }" @click="activeModule = 'profile'">
                    个人信息设置
                </button>
            </div>

            <section v-if="activeModule === 'system'" class="SettingsCard">
                <div class="CardHeader">
                    <h3>系统设置</h3>
                </div>
                <div class="CardBody">
                    <div class="SettingRow"  v-if="appStore.theme === 'dark'" @click="appStore.setTheme('light')">
                        <div class="SettingLabel">主题切换</div>
                        <div class="ThemeSwitch">
                            <div class="icon" >
                                <img src="@/assets/Project/components/PageHeader/太阳.svg" alt="切换浅色主题" />
                            </div>
                            <span class="ThemeText">当前：{{ appStore.theme === 'dark' ? '深色' : '浅色' }}</span>
                        </div>
                    </div>
                    <div class="SettingRow"  v-if="appStore.theme === 'light'" @click="appStore.setTheme('dark')">
                        <div class="SettingLabel">主题切换</div>
                        <div class="ThemeSwitch">
                            <div  class="icon icon-sm" >
                                <img src="@/assets/Project/components/PageHeader/月亮.svg" alt="切换深色主题" />
                            </div>
                            <span class="ThemeText">当前：{{ appStore.theme === 'light' ? '浅色' : '深色' }}</span>
                        </div>
                    </div>
                    <div class="SettingRow nav-mode-row">
                        <div class="SettingLabel">功能导航样式</div>
                        <div class="ModeSwitch">
                            <button class="mode-btn" :class="{ 'is-active': appStore.functionListMode === 'drawer' }"
                                @click="appStore.setFunctionListMode('drawer')">
                                抽屉
                            </button>
                            <button class="mode-btn" :class="{ 'is-active': appStore.functionListMode === 'fixed' }"
                                @click="appStore.setFunctionListMode('fixed')">
                                固定侧栏
                            </button>
                        </div>
                    </div>

                    <div class="SettingRow nav-mode-row">
                        <div class="SettingLabel">消息提示音</div>
                        <div class="ModeSwitch">
                            <button class="mode-btn" :class="{ 'is-active': appStore.notificationSoundEnabled }"
                                @click="appStore.setNotificationSoundEnabled(true)">
                                开启
                            </button>
                            <button class="mode-btn" :class="{ 'is-active': !appStore.notificationSoundEnabled }"
                                @click="appStore.setNotificationSoundEnabled(false)">
                                关闭
                            </button>
                        </div>
                    </div>

                    <div class="SettingRow logout-row">
                        <div class="SettingLabel">登录状态</div>
                        <button class="logout-btn" :disabled="isLoggingOut" @click="handleLogout">
                            {{ isLoggingOut ? '退出中...' : '退出登录' }}
                        </button>
                    </div>
                </div>
            </section>

            <section v-else class="SettingsCard profile-card">
                <div class="CardHeader">
                    <h3>个人信息设置</h3>
                </div>
                <div class="CardBody profile-body">
                    <ProfileSettingsDialog embedded />
                </div>
            </section>
        </div>

        <div class="RightContent" v-show="sidebarStore.sidebars.sidebar6.right">
            <div class="help-card">
               
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useSidebarStore } from '@/stores/sidebar'
import { ProfileSettingsDialog } from '@/components/UserProfile'
import { openConfirmDialog, openMessageDialog } from '@/components/MessageDialog/open'
import { cleanupOnLogout } from '@/services/Project/BeforeAndAfter2'

const appStore = useAppStore()
const sidebarStore = useSidebarStore()
const activeModule = ref<'system' | 'profile'>('system')
const isLoggingOut = ref(false)

const handleLogout = async () => {
    if (isLoggingOut.value) return

    const confirmed = await openConfirmDialog('确认退出当前账号？', {
        title: '退出登录',
        confirmText: '退出',
        cancelText: '取消',
    })
    if (!confirmed) return

    isLoggingOut.value = true
    appStore.setLoading(true, '正在退出登录...')
    try {
        await cleanupOnLogout({
            clearIndexedDB: false,
            redirectToLogin: true,
        })
    } catch (error) {
        console.error('[System:SettingsPage:handleLogout] 退出登录失败', error)
        openMessageDialog('退出失败，请稍后重试')
        appStore.setLoading(false)
    } finally {
        isLoggingOut.value = false
    }
}
</script>

<style scoped>
.PageContainer {
    width: 100%;
    height: 100%;
    display: flex;
    min-height: 0;
    flex-direction: row;
    gap: 0.2rem;
}

.LeftContent,
.MiddleContent,
.RightContent {
    height: 100%;
    width: 100%;
    background: var(--glass-bg);
    border: var(--glass-border);
    overflow: hidden;
    padding: var(--space-md);
    box-sizing: border-box;
}

.LeftContent {
    max-width: 18%;
    min-width: 180px;
}

.MiddleContent {
    display: flex;
    flex-direction: column;
    overflow: auto;
}

.RightContent {
    max-width: 25%;
    min-width: 200px;
}

.module-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.mobile-module-list {
    display: none;
    margin-bottom: var(--space-sm);
}

.module-item {
    width: 100%;
    min-height: 42px;
    border: 1px solid color-mix(in srgb, var(--text-color) 12%, transparent);
    border-radius: var(--radius-sm);
    background: var(--panel-bg);
    color: var(--text-color);
    cursor: pointer;
    text-align: left;
    padding: 0 var(--space-sm);
}

.module-item:hover {
    background: var(--hover-bg);
}

.module-item.is-active {
    background: var(--active-bg);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
}

.SettingsCard {
    width: 100%;
    background: var(--panel-bg);
    border: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
    border-radius: var(--radius-md);
    box-shadow: var(--glass-shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.CardHeader {
    padding: var(--space-md);
    border-bottom: 1px solid color-mix(in srgb, var(--text-color) 12%, transparent);
}

.CardHeader h3 {
    margin: 0;
    font-size: var(--font-base);
    color: var(--text-color);
}

.CardBody {
    padding: var(--space-md);
}

.SettingRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
}

.SettingLabel {
    color: var(--text-color);
    font-size: var(--font-sm);
}

.ThemeSwitch {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
}

.icon {
    width: 24px;
    height: 24px;
    color: var(--text-color);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: background-color 0.2s ease, transform 0.2s ease;
    cursor: pointer;
}

.icon.icon-sm {
    width: 24px;
    height: 24px;
}

.icon.icon-sm img {
    width: 20px;
    height: 20px;
}

.icon:active {
    transform: translateY(1px);
}

.icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: var(--icon-filter);
}

.ThemeText {
    color: var(--text-muted);
    font-size: var(--font-xs);
}

.nav-mode-row {
    margin-top: var(--space-md);
    padding-top: var(--space-md);
    border-top: 1px solid color-mix(in srgb, var(--text-color) 12%, transparent);
}

.logout-row {
    margin-top: var(--space-md);
    padding-top: var(--space-md);
    border-top: 1px solid color-mix(in srgb, var(--text-color) 12%, transparent);
}

.ModeSwitch {
    display: inline-flex;
    gap: var(--space-sm);
}

.mode-btn {
    min-width: 84px;
    min-height: 34px;
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    background: var(--panel-bg);
    color: var(--text-color);
    cursor: pointer;
    padding: 0 var(--space-sm);
}

.mode-btn:hover {
    background: var(--hover-bg);
}

.mode-btn.is-active {
    background: var(--active-bg);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
}

.logout-btn {
    min-width: 104px;
    min-height: 34px;
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--danger-color) 44%, transparent);
    background: color-mix(in srgb, var(--danger-color) 14%, var(--panel-bg));
    color: var(--danger-color);
    cursor: pointer;
    padding: 0 var(--space-sm);
    transition: background-color 0.2s ease, opacity 0.2s ease;
}

.logout-btn:hover {
    background: color-mix(in srgb, var(--danger-color) 20%, var(--panel-bg));
}

.logout-btn:disabled {
    cursor: not-allowed;
    opacity: 0.65;
}

.profile-card {
    min-height: 420px;
}

.profile-body {
    height: 100%;
}

.profile-body :deep(.embedded-root) {
    min-height: 340px;
}

.help-card {
    background: var(--panel-bg);
    border: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
    border-radius: var(--radius-md);
    padding: var(--space-md);
}

.help-title {
    font-size: var(--font-sm);
    color: var(--text-color);
    font-weight: 600;
    margin-bottom: var(--space-xs);
}

.help-text {
    color: var(--text-muted);
    font-size: var(--font-xs);
    line-height: 1.5;
}

@media (max-width: 768px) {
    .LeftContent,
    .RightContent {
        display: none;
    }

    .mobile-module-list {
        display: flex;
    }

    .MiddleContent {
        padding: var(--space-sm);
    }

    .SettingRow {
        flex-direction: column;
        align-items: flex-start;
    }

    .ModeSwitch,
    .logout-btn {
        width: 100%;
    }

    .mode-btn {
        flex: 1;
    }
}
</style>
