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
      <!-- 登录表单组件 V2 -->
      <LoginFormV2 v-if="!isRegisterMode && !isWechat && !isWechatBindMode" ref="loginFormRef" @login="handleLoginAttempt"
        @auto-login-success="handleAutoLoginSuccess" @switch-to-register="switchToRegister"
        @switch-to-wechat="switchToWechat" />
      <!-- 注册表单组件 V2 -->
      <RegisterFormV2 v-else-if="isRegisterMode" ref="registerFormRef" @register="handleRegisterAttempt"
        @switch-to-login="switchToLogin" />
        <!--微信登录的绑定帐号页面-->
        <NewUserWithWechat v-else-if="isWechatBindMode" ref="wechatBindFormRef" @register="handleWechatBindAttempt"
        @switch-to-login="switchToLogin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LoginFormV2 from '@/components/Common/LoginForm'
import RegisterFormV2 from '@/components/Common/RegisterForm'
import NewUserWithWechat from '@/components/Common/NewUserWithWechat'
import { matrixClientV2 } from '@/services/matrix/client'
import { wechatSSOService } from '@/services/SSO/wechatSSO'
import type { MatrixLoginConfig, MatrixRegisterConfig } from '@/types'
import { register } from '@/services/SSO/LoginOrRegister'
import { API_URLS } from '@/apiUrls'
import { useWechatStore } from '@/stores/wechat'
import { openMessageDialog } from '@/components/MessageDialog/open';
import { userInfoManager } from '@/utils/userInfo'


// ===== 路由引用 =====
const route = useRoute()

// ===== store 引用 =====
const wechatStore = useWechatStore()

// ===== 组件引用 =====
const loginFormRef = ref()
const wechatBindFormRef = ref()
const registerFormRef = ref()

// ===== 页面状态 =====
/** 是否显示注册模式 */
const isRegisterMode = ref(false)
/** 是否显示微信登录模式 */
const isWechat = ref(false)
/** 是否显示微信绑定模式 */
const isWechatBindMode = ref(false)
/** 是否正在处理 SSO 回调 */
const isProcessingSSO = ref(false)

// ===== 登录限制状态 =====
const 上次登录尝试时间 = ref<number>(0)
const 登录冷却时间 = 5 * 1000 // 5秒冷却时间
const 最大重试次数 = 3
let 当前重试次数 = 0

// ===== 生命周期 =====
onMounted(async () => {

  // 检测 URL 中是否有 token (SSO 回调)
  const token = (route.query.loginToken || route.query.code) as string

  if (token && !isProcessingSSO.value) {
    handleSSOCallback(token)
  }


})

// ===== 事件处理函数 =====


/**
 * 统一处理 Token 兑换和登录流程
 */
const processLoginToken = async (token: string) => {
    // 绑定/注册成功后，后端可能直接返回 loginToken。
    // 这里统一先持久化到 userInfoManager（由 wechatStore 负责写入 lingjing_sso_data），
    // 避免必须“退出再登录”才能在 localStorage 看到该字段。
    wechatStore.setSSOParams({
      state: wechatStore.ssoParams.state,
      sub: wechatStore.ssoParams.sub,
      code: wechatStore.ssoParams.code,
      loginToken: token,
    })

    let finalToken = undefined;
    let userId = undefined;
    let deviceId = undefined;
    let homeServer = undefined;

    // curl -X POST 'https://t8962.zheshu.tech/api/auth/msyanc' -H 'accept: application/json' -H 'Authorization: Bearer <token>' -d ''
    console.log('[SSO] 正在通过后端兑换 Matrix access_token...')

    const exchangeApiUrl = (() => {
      const fullUrl = API_URLS.GenerateMatrixToken()
      try {
        return new URL(fullUrl).pathname
      } catch {
        return '/api/auth/msyanc'
      }
    })()

    const response = await fetch(exchangeApiUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: ''
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Token 兑换失败 (${response.status}) ${errorText}`.trim())
    }

    const raw = await response.json().catch(() => ({} as any))
    const data = (raw && (raw.data || raw.result || raw)) as any

    finalToken = data.access_token || data.accessToken || data.matrix_access_token
    userId = data.user_id || data.userId
    deviceId = data.device_id || data.deviceId
    homeServer = data.home_server || data.homeServer || data.homeserver

    if (!finalToken) {
      throw new Error('Token 兑换成功但缺少 access_token')
    }

    if (!homeServer) {
      throw new Error('Token 兑换成功但缺少 home_server')
    }

    const homeserverUrl = String(homeServer).startsWith('http')
      ? String(homeServer)
      : `https://${String(homeServer)}`

    console.log('[SSO] 后端兑换 Matrix AccessToken 成功')

    // 将兑换结果存入 store（同时 matrixClientV2 仍会把 access_token 存 localStorage）
    wechatStore.setMatrixSession({
      accessToken: String(finalToken),
      userId: userId ? String(userId) : undefined,
      deviceId: deviceId ? String(deviceId) : undefined,
      homeServer: String(homeserverUrl),
    })
    
    // 3. 使用 access_token 初始化客户端
    const userInfo = await matrixClientV2.useAccessTokenLogin(
      finalToken,
      homeserverUrl.replace(/\/$/, '') + '/',
      userId,
      deviceId
    );

    console.log('[SSO] 登录成功，用户信息:', userInfo);

    const url = new URL(window.location.href);
    url.searchParams.delete('loginToken');
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('sub');
    window.history.replaceState({}, '', url.pathname);

    await handleAutoLoginSuccess();
}

/**
 * 处理 SSO 回调
 */
const handleSSOCallback = async (initialToken: string) => {
  if (isProcessingSSO.value) return
  isProcessingSSO.value = true

  console.log('[SSO] 开始处理 SSO 回调...')
  
  if (loginFormRef.value) {
    loginFormRef.value.showError('正在处理微信登录，请稍候...')
  }

  try {

    const result = await wechatSSOService.handleCallback()
    
    console.log('[SSO] 解析结果:', result)

    if (result.status === 'register_required') {
      // 需要绑定账号
      console.log('[SSO] 用户未注册/未绑定，切换到绑定页面')
      isWechatBindMode.value = true
      isRegisterMode.value = false
      isWechat.value = false
      return
    }

    if (result.status === 'error') {
      throw new Error(result.message || 'SSO Error')
    }

    // 2. 登录成功，处理 Token
    const token = result.token || initialToken
    if (!token) {
      throw new Error('未获取到有效 Token')
    }

    await processLoginToken(token)

  } catch (error: any) {
    console.error('[SSO] 登录流程出错:', error);
    if (loginFormRef.value) {
      loginFormRef.value.resetLoginState(`微信登录败: ${error.message || '未知错误'}`);
    }
    // 避免失败后 store 残留上一次的 token/session
    wechatStore.setMatrixSession(null)
    wechatStore.setSSOParams({
      state: '',
      sub: '',
      code: '',
      loginToken: undefined,
    })

    // 避免旧的 SSO 凭证残留（否则可能出现“退出再登录才刷新本地字段”的错觉）
    userInfoManager.clearSSOStorage()
  } finally {
    isProcessingSSO.value = false
  }
}

/**
 * 处理自动登录成功 - V2适配
 * 当组件加载时自动登录成功时调用
 */
const handleAutoLoginSuccess = async () => {
  console.log('[V2] 处理自动登录成功...')

  try {
    // 第1步：执行登录后标准操作
    console.log('[V2] 步骤1: 执行登录后标准操作...')
    await matrixClientV2.ExecutePostLoginActions()

    // 第2步：标记自动登录已完成
    console.log('[V2] 步骤2: 标记自动登录完成')
    sessionStorage.setItem('auto_login_completed', 'true')

    // 第3步：跳转到聊天页面（token已在登录时自动保存到localStorage）
    console.log('[V2]  自动登录流程完成，跳转到聊天页面')
    const router = await import('@/router')
    router.default.push('/chat')

  } catch (错误: any) {
    console.error('[V2]  自动登录后续流程失败:', 错误)

    // 自动登录失败时清理令牌和标识，让用户手动登录
    matrixClientV2.clearLoginToken()
    sessionStorage.removeItem('auto_login_completed')

    if (loginFormRef.value) {
      loginFormRef.value.resetLoginState('自动登录失败，请手动登录')
    }
  }
}

/**
 * 处理用户登录尝试 - V2适配
 * 这个函数包含完整的登录流程：认证、加密初始化、客户端启动
 * @param loginData - 用户输入的登录信息
 */
const handleLoginAttempt = async (loginData: MatrixLoginConfig) => {
  console.log('[V2] 开始处理用户登录请求...')
  console.log('[V2] 收到的登录数据:', JSON.stringify(loginData, null, 2))

  // 检查是否在冷却期内
  const 当前时间 = Date.now()
  const 距离上次尝试时间 = 当前时间 - 上次登录尝试时间.value

  if (距离上次尝试时间 < 登录冷却时间) {
    const 剩余冷却时间 = Math.ceil((登录冷却时间 - 距离上次尝试时间) / 1000)
    const errorMessage = `请等待 ${剩余冷却时间} 秒后再次尝试登录`

    if (loginFormRef.value) {
      loginFormRef.value.resetLoginState(errorMessage)
    }
    return
  }

  // 更新尝试时间
  上次登录尝试时间.value = 当前时间

  try {
    // 第1步：用户认证
    console.log('[V2] 步骤1: 进行用户认证...')

    // [NEW] 2025-12-15: 切换到新的 SSO 登录模式
    // 原有代码: await matrixClientV2.UserLogin(loginData)
    await matrixClientV2.UserLoginViaSSO(loginData)

    // 登录成功，重置重试计数
    当前重试次数 = 0

    // 第2步：执行登录后标准操作
    console.log('[V2] 步骤2: 执行登录后标准操作...')
    await matrixClientV2.ExecutePostLoginActions()

    // 第3步：标记登录已完成（手动登录）
    console.log('[V2] 步骤3: 标记登录完成')
    sessionStorage.setItem('auto_login_completed', 'true')

    // 第4步：跳转到聊天页面（token已在登录时自动保存到localStorage）
    console.log('[V2]  登录流程完成，跳转到聊天页面')
    const router = await import('@/router')
    const redirect = router.default.currentRoute.value.query.redirect as string
    router.default.push(redirect || '/chat')

  } catch (loginError: any) {
    // 登录失败处理
    console.error('[V2]  登录失败:', loginError)

    当前重试次数++

    // 构建错误信息
    let errorMessage = loginError.message || '登录失败，请重试'

    // 如果是429错误，建议用户等待更长时间
    if (errorMessage.includes('过于频繁') || errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      errorMessage += '\n建议等待几分钟后再试'
    }

    // 如果重试次数过多，建议使用Token登录
    if (当前重试次数 >= 最大重试次数) {
      errorMessage += `\n已尝试 ${当前重试次数} 次，建议稍后再试`
    }

    // 将错误信息传递给登录表单显示
    if (loginFormRef.value) {
      loginFormRef.value.resetLoginState(errorMessage)
    }
  }
}

/**
 * 处理微信绑定注册尝试
 * @param registerData - 用户输入的注册信息
 */
const handleWechatBindAttempt = async (registerData: { username: string; password: string }) => {
  console.log('[SSO] 开始处理微信绑定/注册请求...');
  try {
     const result = await wechatSSOService.register({
       username: registerData.username,
       password: registerData.password,
     });
     console.log('[SSO]  微信绑定注册成功！', result);
     
     // 尝试获取 Token
     let token = result.token || result.access_token || (typeof result === 'string' ? result : undefined);
     
     if (token) {
        isProcessingSSO.value = false;
        await processLoginToken(token);
     } else {
        // 绑定成功但未返回 token：清理残留 SSO 数据，避免后续误用旧 token
        userInfoManager.clearSSOStorage()
        openMessageDialog('绑定成功，请使用新账户登录');
        switchToLogin();
     }

  } catch (error: any) {
    console.error(`[SSO] 绑定失败:`, error);

    // 绑定失败时清理旧的 SSO 凭证，避免残留旧 token 影响重试
    userInfoManager.clearSSOStorage()

    const errorMessage = error.message === 'M_USER_IN_USE'
      ? '该用户名已被占用，请更换一个。'
      : (error.message || '绑定失败，请重试');
      
    if (wechatBindFormRef.value && typeof wechatBindFormRef.value.resetRegisterState === 'function') {
         wechatBindFormRef.value.resetRegisterState(errorMessage); // 注意可能是 resetLoginState 或 resetRegisterState
    } else {
         openMessageDialog(errorMessage);
    }
  }
}

/**
 * 处理用户注册尝试 - V2适配（支持多步骤）
 * @param registerData - 用户输入的初始注册信息
 */
const handleRegisterAttempt = async (registerData: MatrixRegisterConfig) => {
  console.log('[V2] 开始处理用户注册请求...');
  try {
    // 只调用自定义注册接口
    await register(registerData.username, registerData.password);
    console.log('[V2]  用户注册成功！');
    openMessageDialog('注册成功，请使用新账户登录');
    switchToLogin();
  } catch (registerError: any) {
    console.error(`[V2] 注册失败:`, registerError);
    // 处理错误信息
    const errorMessage = registerError.message === 'M_USER_IN_USE'
      ? '该用户名已被占用，请更换一个。'
      : (registerError.message || '注册失败，请重试');
    if (registerFormRef.value && typeof registerFormRef.value.resetRegisterState === 'function') {
      registerFormRef.value.resetRegisterState(errorMessage);
    } else {
      openMessageDialog(`注册失败: ${errorMessage}`);
    }
  }
}

/**
 * 切换到注册模式
 */
const switchToRegister = () => {
  isRegisterMode.value = true
  isWechatBindMode.value = false
  console.log('[V2] 切换到注册模式')
}

/**
 * 切换到登录模式
 */
const switchToLogin = () => {
  isRegisterMode.value = false
  isWechat.value = false
  isWechatBindMode.value = false
  console.log('[V2] 切换到登录模式')
}


/**
 * 切换到微信登录模式
 */
const switchToWechat = () => {
  isWechat.value = true
  isRegisterMode.value = false
  isWechatBindMode.value = false
  console.log('[V2] 切换微信登录模式')
}


console.log('[V2] 登录页面已加载')
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
    background: linear-gradient(45deg, #ffffff 0%,#bdbaff 50%, #a679ff 100%);
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
  font-size: 28px;
  font-weight: 600;
}

.app-description {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 14px;
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
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
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
  font-size: 14px;
}

.input-hint {
  color: #666;
  font-size: 12px;
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
  font-size: 14px;
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
  font-size: 13px;
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
  font-size: 16px;
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
  font-size: 14px;
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
  font-size: 14px;
  text-decoration: underline;
  padding: 5px 10px;
}

.switch-button:hover {
  color: #764ba2;
}


</style>
