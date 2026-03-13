<template>
    <div class="matrix-register-form">
        <form @submit.prevent="handleSubmit" class="register-form">
            <h1 class="login-title">{{ titleText }}</h1>
            <div class="login-underline"></div>
            <p class="bind-hint">{{ hintText }}</p>

            <div class="form-group">
                <label for="phone"></label>
                <div class="input-icon-wrapper">
                    <svg class="input-icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M7 4H17C18.1046 4 19 4.89543 19 6V18C19 19.1046 18.1046 20 17 20H7C5.89543 20 5 19.1046 5 18V6C5 4.89543 5.89543 4 7 4Z"
                            stroke="#C7C7C7" stroke-width="1.5" />
                        <path d="M9 7H15" stroke="#C7C7C7" stroke-width="1.5" stroke-linecap="round" />
                        <path d="M12 17H12.01" stroke="#C7C7C7" stroke-width="2" stroke-linecap="round" />
                    </svg>
                    <input id="phone" v-model="formData.phone" :disabled="isSubmitting" type="text"
                        placeholder="请输入手机号" required class="form-input" />
                </div>
            </div>

            <div v-if="mode === 'register'" class="form-group">
                <label for="nickname"></label>
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
                    <input id="nickname" v-model="formData.nickname" :disabled="isSubmitting" type="text"
                        placeholder="请输入昵称" required class="form-input" />
                </div>
            </div>

            <div v-if="isCaptchaStepVisible" class="form-group">
                <label for="phone-auth-captcha"></label>
                <div class="captcha-row">
                    <div class="captcha-image-wrapper" @click="refreshCaptcha" title="点击刷新验证码">
                        <img v-if="captcha.image" :src="captcha.image" alt="图片验证码" class="captcha-image" />
                        <div v-else class="captcha-placeholder">{{ isLoadingCaptcha ? '加载中...' : '加载失败' }}</div>
                    </div>
                    <button type="button" class="refresh-captcha-button"
                        :disabled="isLoadingCaptcha || isSubmitting || isSendingCode" @click="refreshCaptcha">
                        换一张
                    </button>
                </div>
                <div class="input-icon-wrapper">
                    <svg class="input-icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 8.5H17M7 12H14M9 3H15C18 3 20 5 20 8V16C20 19 18 21 15 21H9C6 21 4 19 4 16V8C4 5 6 3 9 3Z"
                            stroke="#C7C7C7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <input id="phone-auth-captcha" v-model="captcha.text" :disabled="isSubmitting || isSendingCode || isLoadingCaptcha"
                        type="text" placeholder="请输入图片验证码" required class="form-input" />
                </div>
            </div>

            <div class="form-group">
                <label for="code"></label>
                <div class="verify-row">
                    <div class="input-icon-wrapper verify-input-wrapper">
                        <svg class="input-icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 8.5H17M7 12H14M9 3H15C18 3 20 5 20 8V16C20 19 18 21 15 21H9C6 21 4 19 4 16V8C4 5 6 3 9 3Z"
                                stroke="#C7C7C7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <input id="code" v-model="formData.code" :disabled="isSubmitting" type="text"
                            placeholder="请输入短信验证码" required class="form-input" />
                    </div>
                    <button type="button" class="send-code-button"
                        :disabled="!isPhoneValid || isSendingCode || cooldownSeconds > 0 || isSubmitting"
                        @click="handleSendCode">
                        {{ sendCodeText }}
                    </button>
                </div>
            </div>

            <div v-if="errorMessage" class="error-message">
                {{ errorMessage }}
            </div>

            <button type="submit" :disabled="isSubmitting || !isFormValid" class="register-button">
                {{ submitText }}
            </button>

            <div v-if="isSubmitting" class="loading-indicator">
                <div class="spinner"></div>
                <p>{{ loadingText }}</p>
            </div>

            <div class="switch-form">
                <p v-if="mode === 'login'">没有账户？ <button type="button" @click="emit('switch-to-register')" class="link-button">手机号注册</button></p>
                <p v-else>已有账户？ <button type="button" @click="emit('switch-to-login')" class="link-button">手机号登录</button></p>
            </div>

            <div class="switch-form">
                <button type="button" @click="emit('switch-to-password-login')" class="link-button">返回账号密码登录</button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { generateCaptcha, sendSmsCode } from '@/services/Project/SSO/LoginOrRegister'
import type { SmsCodeScene } from '@/services/Project/SSO/LoginOrRegister'

type PhoneAuthMode = 'login' | 'register'

const props = withDefaults(defineProps<{
    mode: PhoneAuthMode
    initialPhone?: string
}>(), {
    initialPhone: ''
})

const emit = defineEmits<{
    submit: [payload: { phone: string; code: string; nickname?: string }]
    'switch-to-login': []
    'switch-to-register': []
    'switch-to-password-login': []
}>()

const formData = reactive({
    phone: props.initialPhone,
    code: '',
    nickname: '',
})

const isSubmitting = ref(false)
const isSendingCode = ref(false)
const cooldownSeconds = ref(0)
const errorMessage = ref('')
const isLoadingCaptcha = ref(false)
const isCaptchaStepVisible = ref(false)
let cooldownTimer: ReturnType<typeof setInterval> | null = null
const captcha = reactive({
    id: '',
    image: '',
    text: '',
})

watch(() => props.initialPhone, (value) => {
    formData.phone = value || ''
})

const titleText = computed(() => props.mode === 'login' ? '手机号登录' : '手机号注册')
const hintText = computed(() => props.mode === 'login'
    ? '短信验证码登录。'
    : '请完成注册。')
const submitText = computed(() => {
    if (isSubmitting.value) return props.mode === 'login' ? '登录中...' : '注册中...'
    return props.mode === 'login' ? '手机号登录' : '手机号注册'
})
const loadingText = computed(() => props.mode === 'login' ? '正在登录...' : '正在注册...')
const isPhoneValid = computed(() => /^1\d{10}$/.test(formData.phone))
const isCodeValid = computed(() => /^\d{4,8}$/.test(formData.code))
const isNicknameValid = computed(() => props.mode === 'login' || formData.nickname.trim().length > 0)
const isFormValid = computed(() => isPhoneValid.value && isCodeValid.value && isNicknameValid.value)
const isCaptchaValid = computed(() => captcha.id.trim() !== '' && captcha.text.trim() !== '')
const scene = computed<SmsCodeScene>(() => props.mode === 'login' ? 'login' : 'register')
const sendCodeText = computed(() => {
    if (isSendingCode.value) return '发送中...'
    if (cooldownSeconds.value > 0) return `${cooldownSeconds.value}s后重发`
    return '发送验证码'
})

const normalizePhoneAuthErrorMessage = (error: unknown): string => {
    const raw = error instanceof Error ? error.message : String(error)
    const detailMatch = raw.match(/"detail"\s*:\s*"([^"]+)"/)
    const detail = (detailMatch?.[1] || raw).toLowerCase()

    if (detail.includes('phone already registered')) return '该手机号已注册，请直接登录'
    if (detail.includes('account not found')) return '该手机号尚未注册，请先注册'
    if (detail.includes('invalid verification code')) return '验证码错误，请重新输入'
    if (detail.includes('verification code expired')) return '验证码已过期，请重新获取'
    if (detail.includes('invalid phone number format')) return '手机号格式不正确'
    if (detail.includes('sms cooldown active') || detail.includes('429')) return '验证码发送过于频繁，请稍后再试'
    if (detail.includes('captcha verification failed')) return '验证码校验失败，请稍后重试'
    if (detail.includes('captcha verification required')) return '当前需要额外验证，请稍后重试'
    if (detail.includes('captcha')) return '图片验证码错误或已过期，请重新输入'
    if (detail.includes('sms service not configured')) return '短信服务暂不可用，请稍后再试'
    if (detail.includes('network') || detail.includes('failed to fetch')) return '网络异常，请检查网络后重试'
    return props.mode === 'login' ? '手机号登录失败，请稍后重试' : '手机号注册失败，请稍后重试'
}

const loadCaptcha = async () => {
    isLoadingCaptcha.value = true
    try {
        const result = await generateCaptcha()
        captcha.id = result.captchaId
        captcha.image = result.image
        captcha.text = ''
    } catch (error) {
        captcha.id = ''
        captcha.image = ''
        errorMessage.value = normalizePhoneAuthErrorMessage(error)
    } finally {
        isLoadingCaptcha.value = false
    }
}

const refreshCaptcha = async () => {
    await loadCaptcha()
}

const clearCaptchaState = () => {
    isCaptchaStepVisible.value = false
    captcha.id = ''
    captcha.image = ''
    captcha.text = ''
}

const clearCooldownTimer = () => {
    if (cooldownTimer) {
        clearInterval(cooldownTimer)
        cooldownTimer = null
    }
}

const startCooldown = (seconds: number) => {
    clearCooldownTimer()
    cooldownSeconds.value = seconds
    cooldownTimer = setInterval(() => {
        if (cooldownSeconds.value <= 1) {
            cooldownSeconds.value = 0
            clearCooldownTimer()
            return
        }
        cooldownSeconds.value -= 1
    }, 1000)
}

const handleSendCode = async () => {
    if (!isPhoneValid.value) {
        errorMessage.value = '请填写有效的 11 位手机号'
        return
    }

    if (!isCaptchaStepVisible.value) {
        errorMessage.value = ''
        isCaptchaStepVisible.value = true
        await loadCaptcha()
        if (captcha.id) {
            errorMessage.value = '请先完成图片验证码校验，再发送短信验证码'
        }
        return
    }

    if (!isCaptchaValid.value) {
        if (!captcha.id && !isLoadingCaptcha.value) {
            await loadCaptcha()
            if (captcha.id) {
                errorMessage.value = '请填写图片验证码后再发送短信验证码'
                return
            }
        }
        errorMessage.value = '请先填写图片验证码'
        return
    }

    isSendingCode.value = true
    errorMessage.value = ''

    try {
        const result = await sendSmsCode(formData.phone, scene.value, {
            captchaId: captcha.id,
            captchaText: captcha.text.trim(),
        })
        startCooldown(result.cooldown_seconds || 60)
        clearCaptchaState()
    } catch (error) {
        errorMessage.value = normalizePhoneAuthErrorMessage(error)
        await loadCaptcha()
    } finally {
        isSendingCode.value = false
    }
}

const handleSubmit = () => {
    if (!isFormValid.value) {
        errorMessage.value = props.mode === 'login' ? '请填写有效的手机号和验证码' : '请填写完整的手机号、验证码和昵称'
        return
    }

    isSubmitting.value = true
    errorMessage.value = ''
    emit('submit', {
        phone: formData.phone,
        code: formData.code,
        nickname: props.mode === 'register' ? formData.nickname.trim() : undefined,
    })
}

const resetState = (message?: string) => {
    isSubmitting.value = false
    clearCaptchaState()
    if (message) {
        errorMessage.value = message
    }
}

defineExpose({
    resetState,
    resetLoginState: resetState,
    resetRegisterState: resetState,
})

onBeforeUnmount(() => {
    clearCooldownTimer()
})

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

.bind-hint {
    font-size: 14px;
    color: #666;
    margin-bottom: 20px;
    padding: 5px;
    background: #f9f9f9;
    border-radius: 4px;
    border-left: 4px solid #9b7cff;
}

.form-group {
    margin-top: 20px;
}

.input-icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.verify-row {
    display: flex;
    gap: 10px;
}

.verify-input-wrapper {
    flex: 1;
}

.captcha-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.captcha-image-wrapper {
    width: 140px;
    height: 52px;
    border: 1px solid #ddd;
    border-radius: 6px;
    overflow: hidden;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.captcha-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.captcha-placeholder {
    font-size: 12px;
    color: #999;
}

.refresh-captcha-button {
    padding: 8px 12px;
    border: 1px solid #d6b6ff;
    background: #fff;
    color: #7f56d9;
    border-radius: 16px;
    cursor: pointer;
    font-size: 12px;
}

.refresh-captcha-button:disabled {
    cursor: not-allowed;
    color: #aaa;
    border-color: #ddd;
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

.error-message {
    margin-top: 1rem;
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

.register-button:disabled,
.send-code-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.send-code-button {
    min-width: 96px;
    padding: 0 12px;
    border: none;
    border-radius: 6px;
    background: #f2ebff;
    color: #7d5fe0;
    font-size: 12px;
    cursor: pointer;
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

.loading-indicator p,
.switch-form p {
    font-size: 14px;
    color: #666;
    margin: 0;
}

.switch-form {
    text-align: center;
    margin-top: 15px;
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