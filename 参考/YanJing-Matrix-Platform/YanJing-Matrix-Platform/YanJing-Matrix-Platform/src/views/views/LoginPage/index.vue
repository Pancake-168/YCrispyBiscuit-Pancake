<template>
  <div class="login-page">
    <div class="left-background">
      <svg class="lingjingsvg" width="288" height="92" viewBox="0 0 527 174" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M207.863 0.559391L185.104 19.9119L183.798 33.0248L183.768 33.3299L174.517 33.3641L169.279 72.7757L182.291 72.7275L182.234 73.1169L179.564 91.4651L179.522 91.7548L167.203 91.8003L159.252 152.322L159.214 152.617L128.404 152.731L128.451 152.348L136.051 91.9161L121.657 91.9689L109.273 152.531L109.244 152.677L109.115 152.754L74.2774 173.598L73.6054 174L73.7657 173.238L90.8338 92.0834L81.6238 92.1175L81.6734 91.7334L84.0026 73.7265L84.0408 73.4308L94.672 73.392L102.602 33.9696L90.646 34.0144L90.6997 33.6264L93.3676 14.5997L93.4085 14.3066H93.7069L179.882 14.3267L207.481 0L207.863 0.559391ZM475.348 149.655H442.096L428.214 45.6446H418.529L399.483 95.9503H426.923L428.86 117.024H391.089L378.499 149.655H294.886L299.405 115.325H291.657L270.673 152.035L226.446 172.769L264.54 115.325H249.044L255.5 64.6792L350.413 65.0191L343.633 115.325H326.523L324.909 131.64H352.349L393.672 31.0288L386.247 22.5315H455.332L475.348 149.655ZM510.213 149.655H477.93L492.457 31.0288L486.001 22.5315H527L510.213 149.655ZM10.5326 15.2936L87.2103 15.689L87.5932 15.691L87.5476 16.0684L85.2238 35.4337L85.1883 35.7321L62.1675 35.8177L49.584 62.352L81.6104 62.2336L81.5587 62.6183L70.2388 148.237L70.2005 148.532L10.6352 148.752L10.6848 148.368L17.2894 97.1099L0 97.1741L0.259542 96.6763L31.9485 35.9295L18.0989 35.981L18.1378 35.605L19.4395 22.8835L10.322 15.9018L9.51991 15.2889L10.5326 15.2936ZM243.273 14.6506L238.483 50.9681H247.531L247.467 51.3656L244.563 69.3959L244.516 69.6843H235.81L229.786 113.014L241.246 110.541L241.721 110.439L241.66 110.919L239.078 131.204L239.048 131.442L238.813 131.495L187.504 143.086L187.021 143.195L187.088 142.706L189.992 121.455L190.025 121.218L190.259 121.167L200.351 118.964L207.042 69.6843H196.397L196.445 69.2989L198.704 51.2686L198.742 50.9681H209.71L212.887 22.4292L207.161 14.8111L206.749 14.2631H243.324L243.273 14.6506ZM45.0403 79.6878L45.0028 79.9855L38.6886 130.947L38.6417 131.329L47.8886 131.295L47.9262 130.998L54.2404 80.0357L54.2873 79.6536L45.0403 79.6878ZM277.776 102.409H318.453L319.098 95.6103H278.421L277.776 102.409ZM280.036 84.3938H320.712L321.68 76.9162H281.004L280.036 84.3938ZM132.859 33.1787L132.806 33.453L125.081 73.2133L125.004 73.6087L125.409 73.6174L139.102 73.9065L139.409 73.9125L139.449 73.6114L144.776 33.52L144.828 33.1345L132.859 33.1787ZM356.374 48.8811L355.687 57.1034H250.615L251.988 43.057H272.247L270.187 34.4922H294.567L296.97 43.057H313.109L316.543 34.4922H342.296L338.519 43.057H354.657L378.35 31.0663L356.374 48.8811ZM380.614 3.92979L358.138 21.2288L356.865 31.3908L356.827 31.6912H258.359L258.404 31.3078L260.018 17.7854L260.054 17.483H293.21L287.519 10.3106L287.079 9.75588H325.595L325.564 10.1266L324.95 17.483H352.247L380.249 3.353L380.614 3.92979Z"
          fill="url(#paint0_linear_1302_2024)" />
        <defs>
          <linearGradient id="paint0_linear_1302_2024" x1="6.21731e-10" y1="87" x2="664.38" y2="87.2527"
            gradientUnits="userSpaceOnUse">

            <stop offset="0%" stop-color="#8D6BEB" /> <!-- 暖亮紫左端 -->
            <stop offset="50%" stop-color="#A58CFF" /> <!-- 中间偏亮 -->
            <stop offset="100%" stop-color="#C8B7FF" /> <!-- 更浅偏亮 -->
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div class="login-container">
      <LoginForm v-if="!isRegisterMode && !isWechat && !isWechatBindMode && !isPhoneLoginMode && !isPhoneRegisterMode" ref="loginFormRef" @login="handleLoginAttempt"
        @auto-login-success="handleAutoLoginSuccess" @switch-to-register="switchToLegacyRegister"
        @switch-to-phone-register="switchToPhoneRegister"
        @switch-to-phone-login="switchToPhoneLogin"
        @wechat-login-result="handleWechatLoginResult" />
      <RegisterForm v-if="showLegacyRegister && isRegisterMode" ref="registerFormRef" @register="handleRegisterAttempt"
        @switch-to-login="switchToLogin" />
      <PhoneAuthForm v-if="isPhoneLoginMode" ref="phoneLoginFormRef" mode="login" :initial-phone="phoneDraft"
        @submit="handlePhoneLoginAttempt" @switch-to-register="switchToPhoneRegister" @switch-to-password-login="switchToLogin" />
      <PhoneAuthForm v-if="isPhoneRegisterMode" ref="phoneRegisterFormRef" mode="register" :initial-phone="phoneDraft"
        @submit="handlePhoneRegisterAttempt" @switch-to-login="switchToPhoneLogin" @switch-to-password-login="switchToLogin" />
      <NewUserWithWechat v-if="isWechatBindMode" ref="wechatBindFormRef" branch="wechat" @bind-success="handleWechatBindSuccess"
        @switch-to-login="switchToLogin" />
    </div>
  </div>
</template>


<script setup lang="ts">
import LoginForm from '@/components/Common/LoginForm'
import RegisterForm from '@/components/Common/RegisterForm'
import PhoneAuthForm from '@/components/Common/PhoneAuthForm/index.vue'
import NewUserWithWechat from '@/components/Common/NewUserWithWechat'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { matrixClient } from '@/services/Matrix/client'
import { LoginTokenToAccessToken, register, smsLogin, smsRegister } from '@/services/Project/SSO/LoginOrRegister'
import type { MatrixLoginConfig, MatrixRegisterConfig, } from '@/types/matrix'
import { wechatSSOService } from '@/services/Project/SSO/WeChatSSO'
import { useWechatStore } from '@/stores/WeChat'
import { SystemStorageManager } from '@/utils/SystemStorage'


// ===== 路由引用 =====
const route = useRoute()
const wechatStore = useWechatStore()

const loginFormRef = ref()
const wechatBindFormRef = ref()
const registerFormRef = ref()
const phoneLoginFormRef = ref()
const phoneRegisterFormRef = ref()

const isRegisterMode = ref(false)
const isWechat = ref(false)
const isWechatBindMode = ref(false)
const isPhoneLoginMode = ref(false)
const isPhoneRegisterMode = ref(false)
const phoneDraft = ref('')
const showLegacyRegister = true

// 是否正在处理SSO回调
const isProcessingSSO = ref(false)

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

const normalizeLoginErrorMessage = (error: unknown): string => {
  const raw = getErrorMessage(error)
  const text = raw.toLowerCase()

  if (text.includes('captcha')) {
    return '图片验证码错误或已过期，请重新输入'
  }

  if (
    text.includes('401') ||
    text.includes('403') ||
    text.includes('invalid_grant') ||
    text.includes('unauthorized') ||
    text.includes('账号') ||
    text.includes('用户名') ||
    text.includes('密码') ||
    text.includes('username') ||
    text.includes('password')
  ) {
    return '输入的账号或密码错误'
  }

  if (
    text.includes('failed to fetch') ||
    text.includes('network') ||
    text.includes('timeout') ||
    text.includes('timed out') ||
    text.includes('econn')
  ) {
    return '网络异常，请检查网络后重试'
  }

  if (
    text.includes('500') ||
    text.includes('502') ||
    text.includes('503') ||
    text.includes('504')
  ) {
    return '服务器开小差了，请稍后再试'
  }

  if (text.includes('429') || text.includes('too many')) {
    return '尝试次数过多，请稍后再试'
  }

  return '登录失败，请稍后重试'
}

const normalizePhoneAuthErrorMessage = (error: unknown, mode: 'login' | 'register'): string => {
  const raw = getErrorMessage(error)
  const detailMatch = raw.match(/"detail"\s*:\s*"([^"]+)"/)
  const detail = (detailMatch?.[1] || raw).toLowerCase()

  if (detail.includes('phone already registered')) return '该手机号已注册，请直接登录'
  if (detail.includes('account not found')) return '该手机号尚未注册，请先注册'
  if (detail.includes('invalid verification code')) return '验证码错误，请重新输入'
  if (detail.includes('verification code expired')) return '验证码已过期，请重新获取'
  if (detail.includes('invalid phone number format')) return '手机号格式不正确'
  if (detail.includes('sms cooldown active') || detail.includes('429')) return '验证码发送过于频繁，请稍后再试'
  if (detail.includes('sms service not configured')) return '短信服务暂不可用，请稍后再试'
  if (detail.includes('network') || detail.includes('failed to fetch')) return '网络异常，请检查网络后重试'
  return mode === 'login' ? '手机号登录失败，请稍后重试' : '手机号注册失败，请稍后重试'
}

const isPhoneAccountNotFoundError = (error: unknown): boolean => {
  const text = getErrorMessage(error).toLowerCase()
  return text.includes('account not found') || text.includes('账户没找到')
}

const shouldCountPasswordLoginFailure = (error: unknown): boolean => {
  const text = getErrorMessage(error).toLowerCase()
  return text.includes('401')
    || text.includes('403')
    || text.includes('invalid_grant')
    || text.includes('unauthorized')
    || text.includes('captcha')
    || text.includes('username')
    || text.includes('password')
    || text.includes('账号')
    || text.includes('密码')
}

const handleWechatLoginResult = async (result: { status: 'login_success' | 'register_required' | 'error', token?: string, message?: string }) => {
  console.log('[LoginPage:LoginPage:handleWechatLoginResult] 收到微信登录结果:', result)

  if (result.status === 'register_required') {
    isWechatBindMode.value = true
    isRegisterMode.value = false
    isWechat.value = false
    return
  }

  if (result.status === 'login_success') {
    if (!result.token) {
      if (loginFormRef.value) {
        loginFormRef.value.showError('微信登录成功，但缺少登录凭证')
      }
      return
    }

    try {
      isProcessingSSO.value = true
      await processLoginToken(result.token)
    } catch (error) {
      console.error('[LoginPage:LoginPage:handleWechatLoginResult] 处理微信登录成功结果失败:', error)
      if (loginFormRef.value) {
        loginFormRef.value.showError(normalizeLoginErrorMessage(error))
      }
    } finally {
      isProcessingSSO.value = false
    }
    return
  }

  if (loginFormRef.value) {
    loginFormRef.value.showError(result.message || '微信登录失败，请稍后重试')
  }
}

const switchToPhoneLogin = () => {
  isRegisterMode.value = false
  isWechat.value = false
  isWechatBindMode.value = false
  isPhoneLoginMode.value = true
  isPhoneRegisterMode.value = false
}



const handleSSOCallback = async (initialToken: string) => {
  console.log('[LoginPage:LoginPage:handleSSOCallback] 处理 SSO 回调，token:', initialToken)
  if (isProcessingSSO.value) return
  isProcessingSSO.value = true

  console.log('[LoginPage:LoginPage:handleSSOCallback] 开始处理 SSO 回调...')

  // 提示登录表单正在处理
  // 这里绑了一个登录表单的ref？？？为什么呢？TODO
  if (loginFormRef.value) {
    loginFormRef.value.showError('正在处理微信登录，请稍候...')
  }
  try {
    const result = await wechatSSOService.handleCallback()
    console.log('[LoginPage:LoginPage:handleSSOCallback] SSO 回调解析结果:', result)

    if (result.status === 'register_required') {
      // 需要绑定账号
      console.log('[LoginPage:LoginPage:handleSSOCallback] 需要绑定账号，切换到绑定注册模式')
      isWechatBindMode.value = true
      isRegisterMode.value = false
      isWechat.value = false
      return
    }
    if (result.status === 'error') {
      throw new Error(result.message || 'SSO Error')
    }


    const token = result.token || initialToken
    if (!token) {
      throw new Error('未获取到有效 Token')
    }

    await processLoginToken(token)

  }
  catch (error) {
    console.error('[LoginPage:LoginPage:handleSSOCallback] 处理 SSO 回调时出错:', error)

    if (loginFormRef.value) {
      loginFormRef.value.showError(normalizeLoginErrorMessage(error))
    }

    // 重置状态
    wechatStore.setMatrixSession(null)
    await wechatStore.setSSOParams({
      state: '',
      sub: '',
      code: '',
      loginToken: undefined,
    })

    // 本地存储清理，避免旧的 SSO 凭证残留（否则可能出现“退出再登录才刷新本地字段”的错觉）
    await SystemStorageManager.clearLoginToken()


  }
  finally {
    isProcessingSSO.value = false
  }
}




/**
 * 统一处理token兑换和登录流程
 * 
 * 在此写一下token兑换是为了什么？
 * 因为如果存在第一次注册或者绑定的话，用户应该在成注册或绑定后，直接登录而非跳转至登录组件重新填写账号密码
 * 为了用户体验，所以在注册或绑定成功后，直接启用matrixClient的自动登录流程而非UserLoginViaSSO流程
 */

const processLoginToken = async (token: string, options?: { username?: string; source?: 'wechat' | 'phone' }) => {

  console.log('[LoginPage:LoginPage:processLoginToken] 使用 token 进行登录:', token)


  await SystemStorageManager.setLoginToken(token)
  if (options?.username) {
    await SystemStorageManager.setUsername(options.username)
  }

  //绑定或直接扫码成功后，后端直接返回LoginToken

  //微信存储store里面同样存一份
  await wechatStore.setSSOParams({
    state: options?.source === 'phone' ? '' : wechatStore.ssoParams.state,
    sub: options?.source === 'phone' ? '' : wechatStore.ssoParams.sub,
    code: options?.source === 'phone' ? '' : wechatStore.ssoParams.code,
    loginToken: token,
  })


  let finalToken = undefined;
  let userId = undefined;
  let deviceId = undefined;
  let homeServer = undefined;

  console.log('[LoginPage:LoginPage:processLoginToken] 开始使用 LoginToken 兑换 AccessToken...')
  const { accessData: data } = await LoginTokenToAccessToken(token)




  //确认这四个字段是否返回的确实是这些字段
  finalToken = data.access_token
  userId = data.user_id
  deviceId = data.device_id
  homeServer = data.home_server



  if (!finalToken) {
    throw new Error('Token 兑换成功但缺少 access_token')
  }
  if (!homeServer) {
    throw new Error('Token 兑换成功但缺少 home_server')
  }

  const homeserverUrl = String(homeServer).startsWith('http')
    ? String(homeServer)
    : `https://${String(homeServer)}`

  console.log('[LoginPage:LoginPage:processLoginToken] Token 兑换成功!')
  console.log('[LoginPage:LoginPage:processLoginToken] Token 兑换结果access_token:', finalToken)
  console.log('[LoginPage:LoginPage:processLoginToken] Token 兑换结果home_server:', homeserverUrl)
  console.log('[LoginPage:LoginPage:processLoginToken] Token 兑换结果user_id:', userId)
  console.log('[LoginPage:LoginPage:processLoginToken] Token 兑换结果device_id:', deviceId)


  //存储到微信store里面
  wechatStore.setMatrixSession({
    accessToken: String(finalToken),
    userId: userId ? String(userId) : undefined,
    deviceId: deviceId ? String(deviceId) : undefined,
    homeServer: String(homeserverUrl),
  })


  // 使用matrixClient的自动登录
  const user = await matrixClient.useAccessTokenLogin(finalToken, homeserverUrl, userId, deviceId);
  if (user) {
    console.log('[LoginPage:LoginPage:processLoginToken] 使用 token 登录成功，用户ID：', user.userId)
  }

  //旧版代码中有一些url的清理工作
  const url = new URL(window.location.href);
  url.searchParams.delete('loginToken');
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('sub');
  window.history.replaceState({}, '', url.pathname);


  // 登录成功后的一些后续处理
  await handleAutoLoginSuccess()

}


const handleAutoLoginSuccess = async () => {
  console.log('[LoginPage:LoginPage:handleAutoLoginSuccess] 处理自动登录成功后的操作...')

  try {

    // 标记自动登录已完成
    await SystemStorageManager.setAutoLoginCompleted(true);


    //跳转到主页面
    console.log('[LoginPage:LoginPage:handleAutoLoginSuccess] 跳转到主页面...')
    const router = await import('@/router')
    router.default.push('/chat')




  } catch (error) {
    console.error('[LoginPage:LoginPage:handleAutoLoginSuccess] 处理自动登录成功后的操作时出错:', error)

    // 标记自动登录未完成，要求用户手动登录
    await SystemStorageManager.setAutoLoginCompleted(false);




    if (loginFormRef.value) {
      loginFormRef.value.resetLoginState('自动登录失败，请手动登录')
    }

  }

}




/**
 * 处理登录尝试
 */
const handleLoginAttempt = async (loginData: MatrixLoginConfig) => {

  console.log('[LoginPage:LoginPage:handleLoginAttempt] 处理登录尝试，数据:', loginData)
  try {

    console.log('[LoginPage:LoginPage:handleLoginAttempt] 使用matrixClient的UserLoginViaSSO进行登录...')
    await matrixClient.UserLoginViaSSO(loginData)

    // 标记手动登录完成后续允许自动登录
    await SystemStorageManager.setAutoLoginCompleted(true);

    // 本地记录username
    await SystemStorageManager.setUsername(loginData.username);


    //跳转到主页面
    console.log('[LoginPage:LoginPage:handleLoginAttempt] 跳转到主页面...')
    const router = await import('@/router')
    const redirect = router.default.currentRoute.value.query.redirect as string
    router.default.push(redirect || '/chat')


  } catch (error) {
    console.error('[LoginPage:LoginPage:handleLoginAttempt] 处理登录尝试时出错:', error)

    await SystemStorageManager.setAutoLoginCompleted(false);

    // 将错误信息传递给登录表单显示
    if (loginFormRef.value) {
      loginFormRef.value.resetLoginState(normalizeLoginErrorMessage(error), {
        countAsFailure: shouldCountPasswordLoginFailure(error),
      })
    }
  }
}




/**
 * 处理注册尝试
 */
const handleRegisterAttempt = async (registerData: MatrixRegisterConfig) => {
  console.log('[LoginPage:LoginPage:handleRegisterAttempt] 处理注册尝试，数据:', registerData)

  try {
    // 只调用自定义注册接口
    await register(registerData.username, registerData.password);
    console.log('[LoginPage:LoginPage:handleRegisterAttempt] 用户注册成功！');
    // openMessageDialog('注册成功，请使用新账户登录');
    switchToLogin();


  } catch (registerError: unknown) {

    console.error('[LoginPage:LoginPage:handleRegisterAttempt] 注册失败:', registerError);
    if (registerFormRef.value && typeof registerFormRef.value.resetRegisterState === 'function') {
      registerFormRef.value.resetRegisterState(registerError);
    } else {
      //TODO: 一个全局的弹窗组件
      // openMessageDialog(`注册失败: ${errorMessage}`);
    }
  }
}

const handlePhoneLoginAttempt = async (payload: { phone: string; code: string; nickname?: string }) => {
  console.log('[LoginPage:LoginPage:handlePhoneLoginAttempt] 处理手机号登录尝试，数据:', payload)

  try {
    const result = await smsLogin(payload.phone, payload.code)
    await processLoginToken(result.token, { username: payload.phone, source: 'phone' })
  } catch (error) {
    console.error('[LoginPage:LoginPage:handlePhoneLoginAttempt] 手机号登录失败:', error)

    if (isPhoneAccountNotFoundError(error)) {
      phoneDraft.value = payload.phone
      isPhoneLoginMode.value = false
      isPhoneRegisterMode.value = true
      if (phoneRegisterFormRef.value && typeof phoneRegisterFormRef.value.resetState === 'function') {
        phoneRegisterFormRef.value.resetState('账户没找到，已切换到注册，请补充昵称后继续')
      }
      return
    }

    if (phoneLoginFormRef.value && typeof phoneLoginFormRef.value.resetState === 'function') {
      phoneLoginFormRef.value.resetState(normalizePhoneAuthErrorMessage(error, 'login'))
    }
  }
}

const handlePhoneRegisterAttempt = async (payload: { phone: string; code: string; nickname?: string }) => {
  console.log('[LoginPage:LoginPage:handlePhoneRegisterAttempt] 处理手机号注册尝试，数据:', payload)

  try {
    const result = await smsRegister(payload.phone, payload.code, payload.nickname || '')
    await processLoginToken(result.token, { username: payload.phone, source: 'phone' })
  } catch (error) {
    console.error('[LoginPage:LoginPage:handlePhoneRegisterAttempt] 手机号注册失败:', error)
    if (phoneRegisterFormRef.value && typeof phoneRegisterFormRef.value.resetState === 'function') {
      phoneRegisterFormRef.value.resetState(normalizePhoneAuthErrorMessage(error, 'register'))
    }
  }
}


const handleWechatBindSuccess = async (payload: { phone: string; code: string; branch: 'wechat' | 'register' }) => {
  console.log('[LoginPage:LoginPage:handleWechatBindSuccess] 微信绑定成功，数据:', payload)

  try {
    const registerResult = await wechatSSOService.register({
      username: '',
      password: payload.phone,
    })
    console.log('[LoginPage:LoginPage:handleWechatBindSuccess] 微信注册接口调用成功，结果:', registerResult)

    const token = registerResult?.token || registerResult?.access_token || (typeof registerResult === 'string' ? registerResult : undefined)
    if (!token) {
      throw new Error('微信注册成功，但缺少 SSO loginToken')
    }

    await wechatSSOService.bindPhone(payload.phone, payload.code, token)

    isProcessingSSO.value = false
    await processLoginToken(token)
  }
  catch (bindError: unknown) {
    console.error('[LoginPage:LoginPage:handleWechatBindSuccess] 绑定后登录失败:', bindError)
    if (wechatBindFormRef.value && typeof wechatBindFormRef.value.resetBindState === 'function') {
      wechatBindFormRef.value.resetBindState(normalizePhoneAuthErrorMessage(bindError, 'register'))
    }
  }
}






/**
 * 切换到普通账号注册模式
 */
const switchToLegacyRegister = () => {
  isRegisterMode.value = true
  isPhoneLoginMode.value = false
  isPhoneRegisterMode.value = false
  isWechatBindMode.value = false
  isWechat.value = false
  console.log('[V2] 切换到普通账号注册模式')
}

/**
 * 切换到手机号注册模式
 */
const switchToPhoneRegister = () => {
  isRegisterMode.value = false
  isPhoneLoginMode.value = false
  isPhoneRegisterMode.value = true
  isWechatBindMode.value = false
  isWechat.value = false
  console.log('[V2] 切换到手机号注册模式')
}

/**
 * 切换到登录模式
 */
const switchToLogin = () => {
  isRegisterMode.value = false
  isWechat.value = false
  isWechatBindMode.value = false
  isPhoneLoginMode.value = false
  isPhoneRegisterMode.value = false
  console.log('[V2] 切换到登录模式')
}




onMounted(() => {
  console.log('[LoginPage:LoginPage:onMounted] LoginPage 组件已加载')


  // 检测 URL 中是否有 token (SSO 回调)
  // TODO: 暂无法确认code为何物
  const token = (route.query.loginToken || route.query.code) as string
  console.log('[LoginPage:LoginPage:onMounted] 检测到 URL 中的 token:', token)

  if (token && !isProcessingSSO.value) {
    console.log('[LoginPage:LoginPage:onMounted] 发现SSO回调token且SSO回调处理tag为true，开始处理...')
    handleSSOCallback(token)
  }

  console.log('[LoginPage:LoginPage:onMounted] 组件初始化完成')
})



</script>

<style scoped>
.login-page {
  flex-direction: row;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;


  box-sizing: border-box;
}

/* 移动端适配 - 768px以下 */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
    padding: 20px;
    height: auto;
    min-height: 100vh;
    background: linear-gradient(135deg, #e3d6ff 0%, #f0e7ff 50%, #b99bff 100%);
  }
}

.left-background {
  flex: 1;
  height: 100%;
  width: 100%;
  background: linear-gradient(45deg, #ffffff 0%, #bdbaff 50%, #a679ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 移动端左侧背景区域 */
@media (max-width: 768px) {
  .left-background {
    display: none;
  }
}


.login-container {


  background: white;


  width: 100%;
  height: 100%;
  max-width: 450px;
  text-align: center;
}

/* 移动端登录容器样式 */
@media (max-width: 768px) {
  .login-container {
    background: transparent;
    /* 透明背景，让渐变色显示出来 */

    width: 100%;
    height: auto;
    max-width: none;
    border-radius: 0;
    padding-top: 0rem;
  }
}

.app-title {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.app-description {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}

/* 登录表单会继承这个容器的样式 */
:deep(.matrix-login) {
  background: transparent;
  padding: 0;
  box-shadow: none;
}

:deep(.login-form) {
  background: transparent;
  padding: 0;
  box-shadow: none;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 12px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
  font-family: monospace;
  font-size: 12px;
}

.input-hint {
  color: #666;
  font-size: 10px;
  margin-top: 4px;
  display: block;
  font-style: italic;
}

.validate-button {
  background: #f8f9fa;
  border: 2px solid #667eea;
  color: #667eea;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 10px;
}

.validate-button:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.validate-button:disabled {
  background: #f5f5f5;
  border-color: #ccc;
  color: #999;
  cursor: not-allowed;
}

.validation-result {
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: pre-line;
  margin-top: 8px;
}

.validation-result.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.validation-result.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 15px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.login-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #fcc;
  margin-top: 15px;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-line;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}

.switch-button {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
  padding: 5px 10px;
}

.switch-button:hover {
  color: #764ba2;
}
</style>
