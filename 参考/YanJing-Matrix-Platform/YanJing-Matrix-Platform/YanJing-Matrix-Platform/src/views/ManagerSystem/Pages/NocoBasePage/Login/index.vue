<template>
    <div>
        <div class="PanelHeader">
            <div class="PanelTitle">登录</div>
            <div class="PanelSub">NocoBase</div>
        </div>

        <div class="LoginCard glass-card">
            <div class="LoginForm compact">
                <label class="FormLabel">服务器地址</label>
                <select class="input" v-model="selectedServerUrl">
                    <option v-for="server in serverOptions" :key="server.key" :value="server.baseURL">
                        {{ server.label }}
                    </option>
                </select>
            </div>

            <div class="LoginTabs">
                <button class="TabButton" :class="{ active: loginMode === 'token' }" @click="setLoginMode('token')">
                    Token 登录
                </button>
                <button class="TabButton" :class="{ active: loginMode === 'account' }" @click="setLoginMode('account')">
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { nocoBaseService } from '@/services/NocoBase/client'
import { loginByAccount, loginByToken } from '@/services/NocoBase/Login/login'
import { NOCOBASE_SERVER_OPTIONS } from '@/services/NocoBase/url'

const emit = defineEmits<{ (event: 'login-success'): void }>()

const serverOptions = NOCOBASE_SERVER_OPTIONS
const selectedServerUrl = ref(serverOptions[0]?.baseURL || '')

const loginMode = ref<'token' | 'account'>('token')
const tokenInput = ref('')
const accountInput = ref('')
const passwordInput = ref('')

const loginBusy = ref(false)
const loginError = ref('')

const authedToken = ref('')
const isLoggedIn = ref(false)

function syncAuthedToken() {
    const token = nocoBaseService.getAuthedToken()
    authedToken.value = token || ''
    isLoggedIn.value = Boolean(token)
}

function setLoginMode(mode: 'token' | 'account') {
    loginMode.value = mode
    loginError.value = ''
}

async function handleTokenLogin() {
    if (!selectedServerUrl.value) {
        loginError.value = '请选择服务器地址'
        return
    }
    if (!tokenInput.value.trim()) {
        loginError.value = '请输入 Token'
        return
    }

    loginBusy.value = true
    loginError.value = ''
    try {
        const client = await loginByToken(selectedServerUrl.value, tokenInput.value.trim())
        if (!client) {
            throw new Error('Token 登录失败')
        }
        syncAuthedToken()
        emit('login-success')
    } catch (error) {
        loginError.value = 'Token 登录失败'
        console.warn('[System:NocoBaseLogin:handleTokenLogin] 登录失败:', error)
    } finally {
        loginBusy.value = false
    }
}

async function handleAccountLogin() {
    if (!selectedServerUrl.value) {
        loginError.value = '请选择服务器地址'
        return
    }
    if (!accountInput.value.trim() || !passwordInput.value.trim()) {
        loginError.value = '请输入账号和密码'
        return
    }

    loginBusy.value = true
    loginError.value = ''
    try {
        const client = await loginByAccount(
            selectedServerUrl.value,
            accountInput.value.trim(),
            passwordInput.value,
        )
        if (!client) {
            throw new Error('账号密码登录失败')
        }
        syncAuthedToken()
        emit('login-success')
    } catch (error) {
        loginError.value = '账号密码登录失败'
        console.warn('[System:NocoBaseLogin:handleAccountLogin] 登录失败:', error)
    } finally {
        loginBusy.value = false
    }
}

async function copyToken() {
    const token = nocoBaseService.getAuthedToken() || authedToken.value
    if (!token) {
        loginError.value = '当前没有可复制的 Token'
        return
    }
    try {
        await navigator.clipboard.writeText(token)
        authedToken.value = token
    } catch (error) {
        loginError.value = '复制失败，请检查浏览器权限'
        console.warn('[System:NocoBaseLogin:copyToken] 复制失败:', error)
    }
}

syncAuthedToken()
</script>

<style scoped>
.PanelHeader {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: var(--space-sm);
}

.PanelHeader.small {
    margin-bottom: var(--space-xs);
}

.PanelTitle {
    font-size: var(--font-md);
    color: var(--text-color);
    font-weight: 600;
}

.PanelSub {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.LoginCard {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
    margin-bottom: var(--space-sm);
}

.LoginTabs {
    display: flex;
    gap: var(--space-xs);
}

.TabButton {
    flex: 1;
    min-height: 34px;
    border-radius: var(--radius-sm);
    border: var(--glass-border);
    background: var(--input-bg);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease;
}

.TabButton.active {
    background: var(--active-bg);
}

.LoginForm {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.LoginForm.compact {
    margin-bottom: var(--space-xs);
}

.FormLabel {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.TextArea {
    min-height: 88px;
    resize: vertical;
}

.TextArea.readOnly {
    opacity: 0.9;
}

.ErrorText {
    color: var(--danger-color, #ff5d5d);
    font-size: var(--font-xs);
}

.TokenBox {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}
</style>
