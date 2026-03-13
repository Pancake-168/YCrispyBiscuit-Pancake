import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WechatMatrixSession, WechatNocobaseSession, WechatSSOParams, WechatUserProfile } from '@/types/WeChat.d'
import { SystemStorageManager } from '@/utils/SystemStorage'



/**
 * 全局微信 SSO 与会话管理
 */





export const useWechatStore = defineStore('wechat', () => {



  /** 微信 SSO 参数 (sub, code, state) */
  const ssoParams = ref<WechatSSOParams>({
    state: '',
    sub: '',
    code: '',
    // loginToken 由 refreshLoginToken() 异步回填
    loginToken: undefined,
  })

  // 初始化：异步回填本地持久化的 loginToken（如果存在）
  async function refreshLoginToken() {
    const token = await SystemStorageManager.getLoginToken()
    if (token) ssoParams.value.loginToken = token
  }

  void refreshLoginToken()

  /** 通过后端兑换得到的 Matrix 会话信息 */
  const matrixSession = ref<WechatMatrixSession | null>(null)

  /** 通过后端兑换得到的 NocoBase 会话信息 (多应用支持：scope -> session) */
  const nocobaseSessions = ref<Record<string, WechatNocobaseSession>>({})

  /** 用户个人信息及拥有的应用列表 */
  const userProfile = ref<WechatUserProfile | null>(null)



  /** 保存 SSO 参数 */
  async function setSSOParams(params: WechatSSOParams) {
    ssoParams.value = params

    // 只有登录核心凭证存入 userInfoManager
    if (params.loginToken) {
      await SystemStorageManager.setLoginToken(params.loginToken);
    }
  }

  /** 保存 Matrix 会话信息（access_token 等） */
  function setMatrixSession(session: WechatMatrixSession | null) {
    matrixSession.value = session
  }

  /** 保存 NocoBase token (多应用支持，仅存内存) */
  function setNocobaseSession(scope: string, session: WechatNocobaseSession | null) {
    if (!session) {
      delete nocobaseSessions.value[scope]
    } else {
      nocobaseSessions.value[scope] = session
      console.log("[System:WechatStore:setNocobaseSession] 当前的全部nocobaseToken展示：",nocobaseSessions.value)
    }
  }

  /** 保存用户个人信息 */
  function setUserProfile(profile: WechatUserProfile | null) {
    userProfile.value = profile
    console.log('[System:WechatStore:setUserProfile] 用户信息已更新', profile);
  }





  return {
    ssoParams,
    setSSOParams,
    refreshLoginToken,
    matrixSession,
    setMatrixSession,
    nocobaseSessions,
    setNocobaseSession,
    userProfile,
    setUserProfile,
  }
})
