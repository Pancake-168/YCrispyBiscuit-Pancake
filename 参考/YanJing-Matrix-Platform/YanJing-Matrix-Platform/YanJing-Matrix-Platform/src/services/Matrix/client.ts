import type { MatrixLoginConfig, MatrixUser, MatrixLoginConfigLite } from '@/types/matrix'
import * as sdk from 'matrix-js-sdk'
import type { MatrixClient } from 'matrix-js-sdk'
import type { IStore } from 'matrix-js-sdk/lib/store'
import { login, LoginTokenToAccessToken } from '@/services/Project/SSO/LoginOrRegister'
import { Login_MATRIX_SERVER_URL_ALL } from '@/apiUrls'
import { createMatrixIndexedDBStore } from '@/services/Matrix/indexeddbStore'
import { clearMatrixStoreOrDeleteDb } from '@/services/Matrix/indexeddbStore'
import { SystemStorageManager } from '@/utils/SystemStorage'
import { useWechatStore } from '@/stores/WeChat'
import { base64EncodeUtf8, base64DecodeUtf8 } from '@/utils/Base64'
import { matrixEventManager } from '@/services/Matrix/eventManager'
import { matrixTimelineService } from '@/services/Matrix/timeline'




class MatrixClientClass {

  //基础客户端实例
  private NoAuthenticatedMatrixClient: MatrixClient | null = null

  //已认证客户端实例
  private AuthenticatedMatrixClient: MatrixClient | null = null

  // Matrix 本地数据库（IndexedDBStore）
  private authedStore: IStore | null = null
  private authedStoreDbName: string | null = null





  // 创建基础Matrix客户端
  // 是只具备服务器地址的客户端
  // 同时还能规范一下服务器地址的格式
  CreateNoAuthenticatedClient(homeserverUrl: string): MatrixClient {
    let finalhomeserverUrl = homeserverUrl
    if (!finalhomeserverUrl.startsWith('http://') && !finalhomeserverUrl.startsWith('https://')) {
      finalhomeserverUrl = `https://${finalhomeserverUrl}`
    }
    this.NoAuthenticatedMatrixClient = sdk.createClient({
      baseUrl: finalhomeserverUrl
    })
    return this.NoAuthenticatedMatrixClient
  }


  // 获取已认证客户端
  // 这玩意应该只是登录成功后调用
  getAuthedClient(): MatrixClient | null {
    if (!this.AuthenticatedMatrixClient) {
      console.warn('[System:MatrixClient:getAuthedClient] 尚未登录或客户端未初始化')
      return null
    }
    return this.AuthenticatedMatrixClient
  }


    /**
     * 校验当前已登录 Matrix 会话是否仍然有效。
     * 逻辑：读取当前 access token 与 homeserver，并通过 whoami 做权威校验。
     */
    async validateCurrentSession(): Promise<boolean> {
      const client = this.getAuthedClient()
      if (!client) {
        console.warn('[System:MatrixClient:validateCurrentSession] 无法获取已认证客户端，当前会话无效')
        return false
      }

      const token = client.getAccessToken?.() || await SystemStorageManager.getMatrixAccessToken()
      if (!token) {
        console.warn('[System:MatrixClient:validateCurrentSession] 当前会话缺少 access token')
        return false
      }

      const loginConfig = await this.loadLoginConfigLite()
      const homeserver = loginConfig?.homeserver || client.getHomeserverUrl?.()
      if (!homeserver) {
        console.warn('[System:MatrixClient:validateCurrentSession] 当前会话缺少 homeserver 配置')
        return false
      }

      try {
        await this.validateAccessToken(token, homeserver)
        return true
      } catch (error) {
        console.error('[System:MatrixClient:validateCurrentSession] 当前会话已失效或 token 已过期:', error)
        return false
      }
    }


  // 检查客户端状态
  CheckClientLoginStatus(): boolean {
    return this.AuthenticatedMatrixClient !== null
  }



  // 用户退出
  // 在matrix层面上的退出
  async UserLogout(options?: { clearIndexedDB?: boolean }) {
    if (this.AuthenticatedMatrixClient) {
      try {
        // 1) 先停止同步循环
        try {
          if (typeof this.AuthenticatedMatrixClient.stopClient === 'function') {
            this.AuthenticatedMatrixClient.stopClient()
          }
        } catch (error) {
          console.warn('[System:MatrixClient:UserLogout] stopClient 发生异常:', error)
        }

        // 2) 再做服务端登出（让 access_token 失效）
        try {
          if (typeof this.AuthenticatedMatrixClient.logout === 'function') {
            await this.AuthenticatedMatrixClient.logout()
          }
          console.log('[System:MatrixClient:UserLogout] 用户已成功退出Matrix客户端')
        } catch (err: unknown) {
          console.error('[System:MatrixClient:UserLogout] 用户退出时发生错误:', err)
        }

        // 3) 可选：清理 Matrix 本地数据库（IndexedDB）
        if (options?.clearIndexedDB && this.authedStoreDbName) {
          await clearMatrixStoreOrDeleteDb({
            store: this.authedStore,
            dbName: this.authedStoreDbName,
          })
        }

        // 4) 释放引用
        matrixEventManager.unbindClient()
        matrixTimelineService.unbindClient()
        this.AuthenticatedMatrixClient = null
        this.authedStore = null
        this.authedStoreDbName = null
      } catch (error) {
        console.error('[System:MatrixClient:UserLogout] 用户退出时发生异常:', error)
      }
    }

    if (this.NoAuthenticatedMatrixClient) {
      try {
        this.NoAuthenticatedMatrixClient.stopClient()
      } catch (error) {
        console.error('[System:MatrixClient:UserLogout] 停止未认证客户端时发生异常:', error)
      }
      this.NoAuthenticatedMatrixClient = null
    }
  }




  /**
   * 登录逻辑
   * 这个登录逻辑基本上是第一次登录时调用的，常规登录逻辑还是使用AccessToken登录
   * 
   * matrix的AccessToken是需要通过登录接口获取的，由后端提供
   */
  async UserLoginViaSSO(LoginConfig: MatrixLoginConfig): Promise<MatrixUser> {

    console.log('[System:MatrixClient:UserLoginViaSSO] 正在使用SSO方式登录Matrix服务器...')
    this.NoAuthenticatedMatrixClient = null
    this.AuthenticatedMatrixClient = null

    try {

      // 1.调用后端API获取SSO的LoginToken
      const authData = await login(LoginConfig.username, LoginConfig.password, {
        captchaId: LoginConfig.captchaId || '',
        captchaText: LoginConfig.captchaText || '',
      })
      const LoginToken = authData.token
      console.log('[System:MatrixClient:UserLoginViaSSO] 已获取SSO LoginToken!')

      // 存一下LoginToken
      await SystemStorageManager.setLoginToken(LoginToken)
      // 同步到微信 store，确保后续业务读取到最新 loginToken
      const wechatStore = useWechatStore()
      await wechatStore.refreshLoginToken()


      // 3.使用LoginToken兑换Matrix的AccessToken
      const { accessData: data } = await LoginTokenToAccessToken(LoginToken)
      console.log('[System:MatrixClient:UserLoginViaSSO] 已通过LoginToken兑换到Matrix AccessToken!')

      // 存一下AccessToken
      await SystemStorageManager.setMatrixAccessToken(data.access_token)



      // 4.确定服务器地址
      let homeserverUrl = data.home_server || LoginConfig.homeserver;
      if (!homeserverUrl || !homeserverUrl.startsWith('http')) {
        homeserverUrl = Login_MATRIX_SERVER_URL_ALL;
      }


      // 5.调用AccessToken执行登录
      return await this.useAccessTokenLogin(data.access_token, homeserverUrl, data.user_id, data.device_id);

    } catch (error) {

      await SystemStorageManager.clearLoginToken();
      await SystemStorageManager.clearMatrixAccessToken();

      console.error('[System:MatrixClient:UserLoginViaSSO] SSO登录过程中发生错误:', error)
      throw error
    }


  }




  /**
   * 使用AccessToken登录Matrix服务器
   */
  async useAccessTokenLogin(token: string, homeserver: string, userId?: string, deviceId?: string): Promise<MatrixUser> {

    console.log('[System:MatrixClient] 正在使用AccessToken登录Matrix服务器...')
    console.log('[System:MatrixClient:useAccessTokenLogin] 接受token字段:', token)
    console.log('[System:MatrixClient:useAccessTokenLogin] 接受homeserver字段:', homeserver)
    console.log('[System:MatrixClient:useAccessTokenLogin] 接受userId字段:', userId)
    try {


      // 确保 homeserver URL 格式正确
      if (!homeserver.startsWith('http')) {
        homeserver = 'https://' + homeserver
      }


      // 使用whoami校验token，获取权威的userId（避免手动拼接导致错误）
      const who = await this.validateAccessToken(token, homeserver)
      const actualUserId = who.userId
      console.log('[System:MatrixClient:useAccessTokenLogin] 通过whoami获取到的userId字段:', actualUserId)

      if (!actualUserId) {
        throw new Error('[System:MatrixClient:useAccessTokenLogin]通过whoami接口未能获取到有效的userId')
      }
      if (userId && userId !== actualUserId) {
        throw new Error('[System:MatrixClient:useAccessTokenLogin] 提供的userId与whoami返回的不匹配，将暂停登录！')
      }


      // 初始化 Matrix 本地数据库（IndexedDBStore，适配 Web / Electron renderer）
      // - 暂不启用 E2EE，因此不配置 cryptoStore
      // - dbName 建议包含 homeserver + userId，避免切号串库
      const normalize = (v: string) => v.replace(/[^a-zA-Z0-9._-]+/g, '_')
      const dbNameBase = `YanJing_Matrix_${normalize(homeserver)}_${normalize(actualUserId)}`
      const store = await createMatrixIndexedDBStore({
        dbName: dbNameBase,
        namespace: deviceId ? normalize(deviceId) : undefined,
      })

      // 记录下来，退出时可选清理
      this.authedStore = store
      this.authedStoreDbName = deviceId ? `${dbNameBase}_${normalize(deviceId)}` : dbNameBase

      // 创建客户端实例
      this.AuthenticatedMatrixClient = sdk.createClient({
        baseUrl: homeserver,
        accessToken: token,
        userId: actualUserId,
        deviceId: deviceId,
        store: store ?? undefined,
        timelineSupport: true,
        useAuthorizationHeader: true,
        localTimeoutMs: 60000,
      })

      // IndexedDBStore.startup 必须在 store 被赋值给 client 之后调用
      try {
        const maybeStartup = store as (IStore & { startup?: () => Promise<void> }) | null
        if (maybeStartup && typeof maybeStartup.startup === 'function') {
          await maybeStartup.startup()
          console.log('[System:MatrixClient:useAccessTokenLogin] IndexedDBStore startup 已完成')
        }
      } catch (error) {
        console.error('[System:MatrixClient:useAccessTokenLogin] IndexedDBStore startup 失败:', error)
        throw error
      }



      // 一些登录参数的保存
      await SystemStorageManager.setMatrixLoginConfigRaw({
        homeserver: homeserver,
        matrixId: actualUserId,
        deviceId: deviceId,
      })
      // 这里用 base64(UTF-8) 存储，避免特殊字符/换行导致存储读取不一致
      await SystemStorageManager.setMatrixLoginConfig(
        base64EncodeUtf8(
          JSON.stringify({
            homeserver: homeserver,
            matrixId: actualUserId,
            deviceId: deviceId,
          }),
        ),
      )



      // 启用客户端
      try {
        if (typeof this.AuthenticatedMatrixClient.startClient === 'function') {
          this.AuthenticatedMatrixClient.startClient()
          console.log('[System:MatrixClient:useAccessTokenLogin] startClient 已启动（开始 /sync）')
        } else {
          console.warn('[System:MatrixClient:useAccessTokenLogin] startClient 不存在，无法启动同步')
        }
      } catch (error) {
        console.error('[System:MatrixClient:useAccessTokenLogin] startClient 启动失败:', error)
      }

      // 绑定事件管理器与时间线服务
      matrixEventManager.bindClient(this.AuthenticatedMatrixClient)
      matrixTimelineService.bindClient(this.AuthenticatedMatrixClient)

     
      // 说明：matrix-js-sdk 的 startClient() 会启动 /sync 循环（也就是“客户端同步”）；通常无需再额外调用别的 sync。


      await SystemStorageManager.setMatrixAccessToken(token)


      // 返回用户信息
      const user: MatrixUser = {
        userId: actualUserId,
      }
      console.log('[System:MatrixClient:useAccessTokenLogin] 用户已成功登录Matrix服务器!')
      return user
    }
    catch (error) {

      await SystemStorageManager.clearMatrixLoginConfig()
      await SystemStorageManager.clearMatrixLoginConfigRaw()
      await SystemStorageManager.clearMatrixAccessToken()

      console.error('[System:MatrixClient] 使用AccessToken登录过程中发生错误:', error)
      throw error
    }
  }



  /**
   * 验证AccessToken的有效性
   */
  async validateAccessToken(token: string, homeserver: string): Promise<{ userId: string }> {

    console.log('[System:MatrixClient:validateAccessToken] 正在验证AccessToken的有效性...')
    console.log('[System:MatrixClient:validateAccessToken] 接受token字段:', token)
    console.log('[System:MatrixClient:validateAccessToken] 接受homeserver字段:', homeserver)


    try {
      // 创建临时客户端来验证token
      const tempClient = sdk.createClient({
        baseUrl: homeserver,
        accessToken: token,
        userId: undefined, // userId 可留空，whoami会返回正确的userId
      })
      // 调用whoami接口验证token
      const whoamiResponse = await tempClient.whoami()
      console.log('[System:MatrixClient:validateAccessToken] whoami接口返回:', whoamiResponse)
      const userId: string = whoamiResponse.user_id
      return { userId }
    } catch (error) {
      console.error('[System:MatrixClient:validateAccessToken] 验证AccessToken过程中发生错误:', error)
      throw error
    }
  }






  /**
   * 自动登录
   */
  async autoLogin(): Promise<MatrixUser | null> {
    console.log('[System:MatrixClient:autoLogin] 自动登录中...')
    const MatrixAccessToken = await SystemStorageManager.getMatrixAccessToken() || null
    const LoginToken = await SystemStorageManager.getLoginToken() || null

    if (MatrixAccessToken && LoginToken) {
      try {


        const MatrixLoginConfigLite = await this.loadLoginConfigLite()


        // 自动登录的话，优先使用保存在本地的配置字段
        const savedhomeserver = MatrixLoginConfigLite?.homeserver || Login_MATRIX_SERVER_URL_ALL



        const user = await this.useAccessTokenLogin(MatrixAccessToken, savedhomeserver, MatrixLoginConfigLite?.matrixId, MatrixLoginConfigLite?.deviceId)
        console.log('[System:MatrixClient:autoLogin] 自动登录成功!')
        return user

      } catch (error) {
        console.error('[System:MatrixClient:autoLogin] 自动登录过程中发生错误:', error)
        return null
      }

    }
    console.log('[System:MatrixClient:autoLogin] 未找到有效的MatrixAccessToken和LoginToken，无法自动登录')
    return null

  }



  /**
   * 加载登录参数 MatrixLoginConfigLite,返回非序列化对象
   * 这个函数主要用于登录时加载参数
   * 由于存储时可能是 base64(UTF-8) 或旧的 JSON/plain 文本，这里做兼容反序列化
   * 失败则返回null
   */
  async loadLoginConfigLite(): Promise<MatrixLoginConfigLite | null> {
    console.log('[System:MatrixClient:loadLoginConfigLite] 正在加载登录参数 MatrixLoginConfigLite...')
    try {

      const config = await SystemStorageManager.getMatrixLoginConfig()

      if (!config) return null

      const trimmed = config.trim()
      // 兼容旧实现：曾经直接存 JSON 字符串
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return JSON.parse(trimmed)
      }

      // 新实现：base64/base64url + UTF-8
      const jsonText = base64DecodeUtf8(trimmed)
      return JSON.parse(jsonText)
    } catch (error) {
      console.error('[System:MatrixClient:loadLoginConfigLite] 加载登录参数过程中发生错误:', error)
      return null
    }

  }









}






export const matrixClient = new MatrixClientClass()
