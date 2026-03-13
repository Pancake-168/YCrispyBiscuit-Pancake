<template>
    <div class="matrix-register-form">
        <form @submit.prevent="handleSubmit" class="register-form">
            <h1 class="login-title">立即注册</h1>
            <div class="login-underline"></div>
            <div class="svg">
                <svg class="lingjingsvg" width="130" height="40" viewBox="0 0 527 174" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M207.863 0.559391L185.104 19.9119L183.798 33.0248L183.768 33.3299L174.517 33.3641L169.279 72.7757L182.291 72.7275L182.234 73.1169L179.564 91.4651L179.522 91.7548L167.203 91.8003L159.252 152.322L159.214 152.617L128.404 152.731L128.451 152.348L136.051 91.9161L121.657 91.9689L109.273 152.531L109.244 152.677L109.115 152.754L74.2774 173.598L73.6054 174L73.7657 173.238L90.8338 92.0834L81.6238 92.1175L81.6734 91.7334L84.0026 73.7265L84.0408 73.4308L94.672 73.392L102.602 33.9696L90.646 34.0144L90.6997 33.6264L93.3676 14.5997L93.4085 14.3066H93.7069L179.882 14.3267L207.481 0L207.863 0.559391ZM475.348 149.655H442.096L428.214 45.6446H418.529L399.483 95.9503H426.923L428.86 117.024H391.089L378.499 149.655H294.886L299.405 115.325H291.657L270.673 152.035L226.446 172.769L264.54 115.325H249.044L255.5 64.6792L350.413 65.0191L343.633 115.325H326.523L324.909 131.64H352.349L393.672 31.0288L386.247 22.5315H455.332L475.348 149.655ZM510.213 149.655H477.93L492.457 31.0288L486.001 22.5315H527L510.213 149.655ZM10.5326 15.2936L87.2103 15.689L87.5932 15.691L87.5476 16.0684L85.2238 35.4337L85.1883 35.7321L62.1675 35.8177L49.584 62.352L81.6104 62.2336L81.5587 62.6183L70.2388 148.237L70.2005 148.532L10.6352 148.752L10.6848 148.368L17.2894 97.1099L0 97.1741L0.259542 96.6763L31.9485 35.9295L18.0989 35.981L18.1378 35.605L19.4395 22.8835L10.322 15.9018L9.51991 15.2889L10.5326 15.2936ZM243.273 14.6506L238.483 50.9681H247.531L247.467 51.3656L244.563 69.3959L244.516 69.6843H235.81L229.786 113.014L241.246 110.541L241.721 110.439L241.66 110.919L239.078 131.204L239.048 131.442L238.813 131.495L187.504 143.086L187.021 143.195L187.088 142.706L189.992 121.455L190.025 121.218L190.259 121.167L200.351 118.964L207.042 69.6843H196.397L196.445 69.2989L198.704 51.2686L198.742 50.9681H209.71L212.887 22.4292L207.161 14.8111L206.749 14.2631H243.324L243.273 14.6506ZM45.0403 79.6878L45.0028 79.9855L38.6886 130.947L38.6417 131.329L47.8886 131.295L47.9262 130.998L54.2404 80.0357L54.2873 79.6536L45.0403 79.6878ZM277.776 102.409H318.453L319.098 95.6103H278.421L277.776 102.409ZM280.036 84.3938H320.712L321.68 76.9162H281.004L280.036 84.3938ZM132.859 33.1787L132.806 33.453L125.081 73.2133L125.004 73.6087L125.409 73.6174L139.102 73.9065L139.409 73.9125L139.449 73.6114L144.776 33.52L144.828 33.1345L132.859 33.1787ZM356.374 48.8811L355.687 57.1034H250.615L251.988 43.057H272.247L270.187 34.4922H294.567L296.97 43.057H313.109L316.543 34.4922H342.296L338.519 43.057H354.657L378.35 31.0663L356.374 48.8811ZM380.614 3.92979L358.138 21.2288L356.865 31.3908L356.827 31.6912H258.359L258.404 31.3078L260.018 17.7854L260.054 17.483H293.21L287.519 10.3106L287.079 9.75588H325.595L325.564 10.1266L324.95 17.483H352.247L380.249 3.353L380.614 3.92979Z"
                        fill="url(#paint0_linear_register_form)" />
                    <defs>
                        <linearGradient id="paint0_linear_register_form" x1="6.21731e-10" y1="87" x2="664.38"
                            y2="87.2527" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="#8D6BEB" />
                            <stop offset="50%" stop-color="#A58CFF" />
                            <stop offset="100%" stop-color="#C8B7FF" />
                        </linearGradient>
                    </defs>
                </svg>
                <div class="ljai-divider"></div>
            </div>
            <!-- 用户名 -->
            <div class="form-group">
                <label for="reg-username"></label>

                <div class="input-icon-wrapper">
                    <svg class="input-icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z"
                            stroke="#C7C7C7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path
                            d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z"
                            stroke="#C7C7C7" stroke-width="1.5" />
                    </svg>
                    <input id="reg-username" v-model="formData.username" :disabled="isRegistering" type="text"
                        placeholder="用户名" required class="form-input" />

                </div>


            </div>
            <small class="form-hint">*用户名只能包含: 小写字母、数字、下划线</small>

            <!-- 密码 -->
            <div class="form-group">
                <label for="reg-password"></label>


                <div class="input-icon-wrapper">
                    <svg class="input-icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M4.26781 18.8447C4.49269 20.515 5.87613 21.8235 7.55966 21.9009C8.97627 21.966 10.4153 22 12 22C13.5847 22 15.0237 21.966 16.4403 21.9009C18.1239 21.8235 19.5073 20.515 19.7322 18.8447C19.879 17.7547 20 16.6376 20 15.5C20 14.3624 19.879 13.2453 19.7322 12.1553C19.5073 10.485 18.1239 9.17649 16.4403 9.09909C15.0237 9.03397 13.5847 9 12 9C10.4153 9 8.97627 9.03397 7.55966 9.09909C5.87613 9.17649 4.49269 10.485 4.26781 12.1553C4.12104 13.2453 4 14.3624 4 15.5C4 16.6376 4.12104 17.7547 4.26781 18.8447Z"
                            stroke="#C7C7C7" stroke-width="1.5" />
                        <path d="M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5V9"
                            stroke="#C7C7C7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M11.9961 15.5H12.0051" stroke="#C7C7C7" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    <input id="reg-password" v-model="formData.password" :disabled="isRegistering" type="password"
                        placeholder="请输入密码" required class="form-input" />
                </div>
            </div>

            <!-- 确认密码 -->
            <div class="form-group">
                <label for="reg-confirm-password"></label>

                <div class="input-icon-wrapper">

                    <svg class="input-icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M4.26781 18.8447C4.49269 20.515 5.87613 21.8235 7.55966 21.9009C8.97627 21.966 10.4153 22 12 22C13.5847 22 15.0237 21.966 16.4403 21.9009C18.1239 21.8235 19.5073 20.515 19.7322 18.8447C19.879 17.7547 20 16.6376 20 15.5C20 14.3624 19.879 13.2453 19.7322 12.1553C19.5073 10.485 18.1239 9.17649 16.4403 9.09909C15.0237 9.03397 13.5847 9 12 9C10.4153 9 8.97627 9.03397 7.55966 9.09909C5.87613 9.17649 4.49269 10.485 4.26781 12.1553C4.12104 13.2453 4 14.3624 4 15.5C4 16.6376 4.12104 17.7547 4.26781 18.8447Z"
                            stroke="#C7C7C7" stroke-width="1.5" />
                        <path d="M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5V9"
                            stroke="#C7C7C7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M11.9961 15.5H12.0051" stroke="#C7C7C7" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    <input id="reg-confirm-password" v-model="formData.confirmPassword" :disabled="isRegistering"
                        type="password" placeholder="请再次输入密码" required class="form-input" />
                </div>
            </div>
            <small class="form-hint">*密码要求最短8位</small>

            <!-- 错误信息显示 -->
            <div v-if="errorMessage" class="error-message">
                {{ errorMessage }}
            </div>

            <!-- 注册按钮 -->
            <button type="submit" :disabled="isRegistering || !isFormValid" class="register-button">
                {{ isRegistering ? '注册中...' : '注册账户' }}
            </button>

            <!-- 加载指示器 -->
            <div v-if="isRegistering" class="loading-indicator">
                <div class="spinner"></div>
                <p>正在向服务器注册账户...</p>
            </div>

            <!-- 切换到登录链接 -->
            <div class="switch-form">
                <p>已有账户？ <button type="button" @click="switchToLogin" class="link-button">立即登录</button></p>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { MatrixRegisterConfig } from '@/types'
import { Login_MATRIX_SERVER_URL, Login_MATRIX_SERVER_URL_ALL, Login_MATRIX_SERVER_URL_TAIL, MATRIX_SERVER_URL, MATRIX_SERVER_URL_ALL, MATRIX_SERVER_URL_TAIL } from '@/apiUrls'

/**
 * Matrix注册表单组件 V2 - 适配标准服务
 * 提供用户注册界面，收集注册信息并验证
 * 
 * @author YCrispBiscuit
 * @created 2025-08-14
 * @version V2 - 适配Matrix标准服务
 */

// ===== 组件事件定义 =====
const emit = defineEmits<{
    /** 用户提交注册信息时触发 */
    register: [registerData: MatrixRegisterConfig]
    /** 用户要求切换到登录界面时触发 */
    'switch-to-login': []
}>()

// ===== 响应式数据 =====

/** 表单数据 */
const formData = reactive<MatrixRegisterConfig>({
    homeserver: Login_MATRIX_SERVER_URL_ALL,
    username: '',
    password: '',
    confirmPassword: ''
})

/** 注册状态 */
const isRegistering = ref(false)

/** 错误信息 */
const errorMessage = ref('')

// ===== 计算属性 =====

/** 表单验证状态 - V2优化验证逻辑 */
const isFormValid = computed(() => {
    return formData.username.trim() !== '' &&
        formData.password.trim() !== '' &&
        formData.confirmPassword.trim() !== '' &&
        validateUsername(formData.username) &&
        validatePassword(formData.password)
})

// ===== 方法定义 =====

/**
 * 验证用户名格式 - V2增强验证
 */
const validateUsername = (username: string): boolean => {
    // 用户名只能包含字母、数字和下划线，长度3-32
    const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/
    return usernameRegex.test(username)
}

/**
 * 验证密码强度 - V2增强验证
 */
const validatePassword = (password: string): boolean => {
    // 密码至少8个字符
    return password.length >= 8
}

/**
 * 处理表单提交 - V2增强验证
 * 验证表单数据并触发注册事件
 */
const handleSubmit = () => {
    if (!isFormValid.value) {
        showError('请填写完整的注册信息且确保两次密码输入一致')
        return
    }

    // 额外的密码验证
    if (formData.password !== formData.confirmPassword) {
        showError('密码和确认密码不匹配')
        return
    }

    // 用户名格式验证
    if (!validateUsername(formData.username)) {
        showError('用户名只能包含字母、数字和下划线，长度3-32个字符')
        return
    }

    // 密码强度验证
    if (!validatePassword(formData.password)) {
        showError('密码长度至少需要8个字符')
        return
    }

    // 服务器地址验证
    if (!isValidUrl(formData.homeserver)) {
        showError('请输入有效的服务器地址')
        return
    }

    // 清除之前的错误信息
    errorMessage.value = ''

    // 设置注册状态
    isRegistering.value = true

    // 发送注册数据到父组件
    emit('register', { ...formData })
}

/**
 * 验证URL格式
 */
const isValidUrl = (url: string): boolean => {
    try {
        new URL(url)
        return url.startsWith('http://') || url.startsWith('https://')
    } catch {
        return false
    }
}

/**
 * 切换到登录界面
 */
const switchToLogin = () => {
    emit('switch-to-login')
}

/**
 * 显示错误信息
 * @param message - 错误信息
 */
const showError = (message: string) => {
    errorMessage.value = message
}

/**
 * 重置注册状态 - V2适配
 * 供父组件调用，用于处理注册失败后的状态重置
 * @param error - 可选的错误信息
 */
const resetRegisterState = (error?: string) => {
    isRegistering.value = false
    if (error) {
        errorMessage.value = error
    }
}

// ===== 暴露给父组件的方法 =====
defineExpose({
    resetRegisterState,
    showError
})

// ===== 组件初始化 =====
console.log('[V2] RegisterForm 组件已加载')
</script>

<style scoped>
.matrix-register-form {
    height: 100%;
    text-align: left;
    background: white;
    padding: 40% 0px 20px 0px;
    padding-top: 30%;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
    .matrix-register-form {
        padding: 0;
        background: transparent;
        box-shadow: none;
    }
}

.register-form {
    max-width: 250px;
    margin: 0 auto;
}

.login-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 4px;
    text-align: left;
}

.login-underline {
    width: 60px;
    height: 3px;
    background: linear-gradient(45deg, #9b7cff 0%, #d6b6ff 100%);
    margin-bottom: 8px;
}

.svg {
    text-align: left;
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.svg img {
    max-width: 120px;
    height: auto;
    filter: none;
}

.ljai-divider {
    width: 100%;
    height: 1px;
    background: #f0e5dc;
    margin-top: 10px;
}

.form-group {
    margin-top: 20px;

}

.input-icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 6px;
    width: 18px;
    height: 18px;
    color: #c7c7c7;
}

.form-input {
    width: 100%;
    padding: 8px 8px 8px 30px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 12px;
    background: #fff;
    transition: border-color 0.3s;
}

.form-input:focus {
    outline: none;
    border-color: #9b7cff;
}

.form-hint {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
    display: block;
}

.error-message {
    color: #e74c3c;
    font-size: 14px;
    margin-bottom: 15px;
    padding: 8px;
    background: #fdf2f2;
    border-radius: 4px;
    border-left: 4px solid #e74c3c;
}

.register-button {
    width: 100%;
    padding: 8px;
    background: linear-gradient(45deg, #9b7cff 0%, #d6b6ff 100%);
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
    margin-top: 20px;
}

.register-button:hover:not(:disabled) {
    background: linear-gradient(45deg, #8b6df2 0%, #c7a4ff 100%);
}

.register-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.loading-indicator {
    text-align: center;
    margin-bottom: 20px;
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #b7aff0;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.loading-indicator p {
    font-size: 14px;
    color: #666;
    margin: 0;
}

.switch-form {
    text-align: center;
    margin-top: 15px;
}

.switch-form p {
    font-size: 14px;
    color: #666;
    margin: 0;
}

.link-button {
    background: none;
    border: none;
    color: #9b7cff;
    cursor: pointer;
    font-size: 14px;
    text-decoration: underline;
}

.link-button:hover {
    color: #7d5fe0;
}
</style>