// Matrix 客户端管理服务 V2.1 - 主要解决build报错问题
// 负责处理Matrix客户端的创建、登录、认证、加密初始化等核心功能
// 基于 matrix-js-sdk v37.11.0 的标准实践

import { userInfoManager } from '@/utils/userInfo';
import { useWechatStore } from '@/stores/wechat';
import * as sdk from "matrix-js-sdk";
import type { MatrixLoginConfig, MatrixUser, MatrixRegisterConfig } from '@/types'
import { removePrefixSuffix } from '@/utils/stringUtils'
import { API_URLS } from '@/apiUrls';
import { matrixEventManager } from './eventManager'
import { Login_MATRIX_SERVER_URL_ALL, MATRIX_SERVER_URL } from '@/apiUrls'
import { login, updateAccountData } from '@/services/SSO/LoginOrRegister'



class MatrixClientClass_V2 {

  //基础客户端实例
  private NoAuthenticatedMatrixClient: any = null

  //已认证客户端实例
  private AuthenticatedMatrixClient: any = null

  //设备ID（固定策略）
  private DeviceId: string | null = null





  //创建基础Matrix客户端
  CreateNoAuthenticatedClient(homeserverUrl: string): any {
    let finalhomeserverUrl = homeserverUrl
    if (!finalhomeserverUrl.startsWith('http://') && !finalhomeserverUrl.startsWith('https://')) {
      finalhomeserverUrl = `https://${finalhomeserverUrl}`
    }

    this.NoAuthenticatedMatrixClient = sdk.createClient({
      baseUrl: finalhomeserverUrl
    })

    return this.NoAuthenticatedMatrixClient
  }

  //清理账户相关存储
  private async ClearAccountStorage(userId: string): Promise<void> {
    try {

      //更全面的数据库名称列表，包括可能的实体
      const username = userId.split(':')[0].replace('@', '')
      const homeservername = userId.split(':')[1]
      const dbNames = [

        'matrix-js-sdk:default',
        'matrix-js-sdk:crypto',
        `matrix-js-sdk:riot-web-sync:${userId}`,
        `matrix-js-sdk:riot-web-crypto:${userId}`,
        `matrix-rust-sdk-crypto:${userId}`,
        `matrix-rust-sdk-crypto:${username}:${homeservername}`,
        `matrix-rust-sdk-crypto-${username}`,
        `matrix-rust-sdk-crypto-${userId}`,
        `matrix-store-${userId}`,
        // 通用的Matrix相关数据库
        'matrix-js-sdk',
        'matrix-crypto-store',
        'matrix-sdk-crypto',
        'riot-web-sync',
        'riot-web-crypto',
        // 可能的用户特定数据库
        `matrix-${username}`,
        `crypto-${username}`,
        // 清理所有可能的Matrix数据库
        'matrix-client-store',
        'matrix-indexeddb-store'
      ]

      // 先尝试更激进的清理：清理所有Matrix相关的数据库
      try {
        const allDatabases = await indexedDB.databases?.() || []
        for (const db of allDatabases) {
          if (db.name && (
            db.name.includes('matrix') ||
            db.name.includes('crypto') ||
            db.name.includes('riot') ||
            db.name.includes(username)
          )) {
            dbNames.push(db.name)
          }
        }
      } catch (e) {
        // 无法枚举数据库，使用预定义列表
      }

      // 去重
      const uniqueDbNames = [...new Set(dbNames)]

      for (const dbName of uniqueDbNames) {
        try {
          // 尝试删除IndexedDB数据库
          const deleteRequest = indexedDB.deleteDatabase(dbName)
          await new Promise((resolve) => {
            deleteRequest.onsuccess = () => resolve(undefined)
            deleteRequest.onerror = () => resolve(undefined)
            deleteRequest.onblocked = () => resolve(undefined)

            // 设置超时
            setTimeout(() => resolve(undefined), 1000)
          })
        } catch (error) {
          // 继续清理其他数据库
        }
      }

      // 同时清理localStorage中可能的Matrix相关数据
      try {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (
            key.includes('matrix') ||
            key.includes('crypto') ||
            key.includes('mx_') ||
            key.includes(username)
          )) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            // 静默失败
          }
        })
      } catch (error) {
        // 静默失败
      }

    } catch (error) {
      console.warn(`[V2] 存储清理失败:`, error)
    }
  }



  /**
 * 为用户生成唯一的设备ID
 * 基于用户ID和浏览器指纹生成一致的设备ID，确保同一浏览器不同环境下使用相同设备ID
 * @param userId - Matrix用户ID，如 @user:server.com
 * @returns 该用户的唯一设备ID
 */

  private GenerateUserDeviceId(userId: string): string {
    // 提取用户名部分，去掉@和服务器部分
    const username = userId.split(':')[0].replace('@', '')

    // 生成浏览器指纹确保跨环境一致性
    const browserFingerprint = this.GenerateBrowserFingerprint()

    // 生成格式：LingJing_用户名_指纹_CLIENT
    return `LingJing_${username}_${browserFingerprint}_CLIENT`
  }

  /**
   * 生成浏览器指纹
   * 基于浏览器特征生成稳定的指纹，确保跨环境一致性
   */
  private GenerateBrowserFingerprint(): string {
    const Fingerprint = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height,
      navigator.hardwareConcurrency || 4,
      new Date().getTimezoneOffset()
    ].join('|')

    // 简单哈希生成8位指纹
    let hash = 0
    for (let i = 0; i < Fingerprint.length; i++) {
      const char = Fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }

    return Math.abs(hash).toString(16).substring(0, 8).toUpperCase()
  }

  /**
   * 标准用户登录流程
   * 按照Matrix规范实现完整的登录后自动化操作
   */
  async UserLogin(LoginConfig: MatrixLoginConfig): Promise<MatrixUser> {
    this.NoAuthenticatedMatrixClient = null
    this.AuthenticatedMatrixClient = null


    //生成完整的Matrix用户ID
    const finalUserID = this.GenerateUserID(LoginConfig.username, LoginConfig.homeserver)

    // 为新账户清理可能冲突的IndexedDB存储数据
    await this.ClearAccountStorage(finalUserID)

    //生成设备ID（使用浏览器指纹，与V1完全一致)
    this.DeviceId = this.GenerateUserDeviceId(finalUserID)

    //创建基础客户端实例
    this.CreateNoAuthenticatedClient(LoginConfig.homeserver)

    try {
      //执行结果
      // 登录时只应使用本地用户名(localpart)，而不是完整的 Matrix user ID (@user:server)
      const localUsername = String(LoginConfig.username || '').replace(/^@/, '').split(':')[0]

      const LoginResult = await this.NoAuthenticatedMatrixClient.login("m.login.password", {
        identifier: {
          type: "m.id.user",
          user: localUsername
        },
        password: LoginConfig.password,
        device_id: this.DeviceId,
        initial_device_display_name: `LingJing 客户端 V2 - ${LoginConfig.username}`
      })

      console.log(`[V2] 登录成功: ${LoginResult.user_id}`)

      try {
        console.log('[V2] 准备将账户数据同步到后端...');
        const accountData = {
          username: LoginConfig.username,
          password: LoginConfig.password,
          access_token: LoginResult.access_token,
          home_server: MATRIX_SERVER_URL,
          device_id: this.DeviceId
        };

        console.log('[V2] 同步到后端的账户数据:', accountData);

        // 使用封装好的服务更新账户数据
        await updateAccountData(accountData);
        console.log('[V2]  账户数据成功同步到后端');

      } catch (error) {
        // ❗ 静默失败：只在控制台打印错误，不影响用户
        console.error('[V2]  调用 updateAccountData API 时发生严重错误 (不影响登录):', error);
      }




      // 强制使用自定义设备ID格式
      const customDeviceId = this.GenerateUserDeviceId(LoginResult.user_id)

      // 初始化 IndexedDB 存储 (非加密)
      const store = new sdk.IndexedDBStore({
        indexedDB: window.indexedDB,
        localStorage: window.localStorage,
        dbName: `matrix-store-${LoginResult.user_id}`
      })

      // 创建已认证客户端，添加完整的存储配置
      this.AuthenticatedMatrixClient = sdk.createClient({
        baseUrl: this.NoAuthenticatedMatrixClient.baseUrl,
        accessToken: LoginResult.access_token,
        userId: LoginResult.user_id,
        deviceId: customDeviceId,
        store: store,
        useAuthorizationHeader: true,
        // 启用时间线支持
        timelineSupport: true
      })

      // 保存登录参数
      this.SaveLoginConfig(LoginConfig, LoginResult.access_token, customDeviceId)
      userInfoManager.sync()

      // 启动客户端同步
      await this.StartStandardSync()


      return {
        userId: LoginResult.user_id,
        displayName: LoginResult.user_id
      }

    } catch (LoginError: any) {
      console.error('[V2] 登录失败:', LoginError)
      throw this.HandleLoginError(LoginError)
    }
  }

  // =================================================================================
  // [NEW] 新版登录逻辑 (2025-12-15)
  // 使用后端 SSO API 直接获取 Token，替代原有的密码登录流程
  // =================================================================================

  /**
   * 新版 SSO 登录方法
   * 直接调用 createNocobaseUser 接口获取 access_token 和 device_id
   */
  async UserLoginViaSSO(LoginConfig: MatrixLoginConfig): Promise<MatrixUser> {
    console.log('[V2] [NEW] 启动 SSO API 登录流程...');
    this.NoAuthenticatedMatrixClient = null
    this.AuthenticatedMatrixClient = null

    try {
      // 1. 调用后端 API 获取 SSO JWT Token
      console.log('[V2] [NEW] 请求 SSO 接口 (via LoginAndRegister/login)...');
      const authData = await login(LoginConfig.username, LoginConfig.password);
      const loginToken = authData.token;

      console.log('[V2] [NEW] SSO 登录成功，获取到 LoginToken');

      // [新增] 将 LoginToken 存入 userInfoManager，供 Project_Start 等后续流程使用
      userInfoManager.setSSOField('loginToken', loginToken);

      // [新增] 同步 LoginToken 到 wechatStore，确保 UserInfo/Project_Start 能立即读取到
      try {
        const wechatStore = useWechatStore();
        // 更新 store 中的 token，但不覆盖其他 SSO 参数（因为本次是 API 登录，没有 OAuth2 参数）
        if (wechatStore.ssoParams) {
          wechatStore.ssoParams.loginToken = loginToken;
        } else {
          wechatStore.setSSOParams({
            state: '',
            sub: '',
            code: '',
            loginToken: loginToken
          })
        }
        console.log('[V2] [NEW] LoginToken 已同步到 wechatStore');
      } catch (e) {
        console.warn('[V2] [NEW] wechatStore 更新失败 (非致命):', e);
      }

      // 1.5 使用 LoginToken 兑换 Matrix AccessToken
      console.log('[V2] [NEW] 正在兑换 Matrix access_token...');
      const exchangeUrl = API_URLS.GenerateMatrixToken();
      const exchangeResponse = await fetch(exchangeUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${loginToken}`
        },
        body: '' // POST 请求通常需要 body，即使为空
      });

      if (!exchangeResponse.ok) {
        const errorText = await exchangeResponse.text().catch(() => '');
        throw new Error(`Matrix Token 兑换失败 (${exchangeResponse.status}) ${errorText}`);
      }

      const rawExchangeData = await exchangeResponse.json().catch(() => ({}));
      const data = (rawExchangeData.data || rawExchangeData.result || rawExchangeData) as any;

      if (!data.access_token) {
        throw new Error('兑换成功但结果中缺少 access_token');
      }

      // [新增] 同步账户数据到后端 (用于兼容旧逻辑/维持后端记录)
      try {
        console.log('[V2] [NEW] 准备将账户数据同步到后端...');
        const accountData = {
          username: LoginConfig.username,
          password: LoginConfig.password,
          access_token: data.access_token,
          home_server: MATRIX_SERVER_URL,
          device_id: data.device_id
        };

        await updateAccountData(accountData);
        console.log('[V2] [NEW]  账户数据成功同步到后端');
      } catch (error) {
        console.error('[V2] [NEW]  同步账户数据失败:', error);
      }

      // 2. 确定 Homeserver URL
      let homeserverUrl = LoginConfig.homeserver || data.home_server;
      if (!homeserverUrl || !homeserverUrl.startsWith('http')) {
        homeserverUrl = Login_MATRIX_SERVER_URL_ALL;
      }

      // 2.5 清理旧存储
      const localpart = data.username || LoginConfig.username;
      const finalUserID = this.GenerateUserID(localpart, homeserverUrl);
      await this.ClearAccountStorage(finalUserID);

      // 3. 执行最终登录
      return await this.useAccessTokenLogin(data.access_token, homeserverUrl, data.user_id, data.device_id);

    } catch (error) {
      console.error('[V2] [NEW] SSO 登录流程异常:', error);
      throw this.HandleLoginError(error);
    }
  }
  // =================================================================================
  // [NEW] 新版登录逻辑结束
  // =================================================================================


  /**
* 启动标准同步流程 - 基于 element-web 的最佳实践
*/
  private async StartStandardSync(): Promise<void> {
    if (!this.AuthenticatedMatrixClient) {
      throw new Error('客户端未认证')
    }

    console.log('[V2] 启动标准同步流程...')



    // 配置同步选项 - 参考 element-web 的标准配置
    const syncOptions = {
      initialSyncLimit: 20,        // element-web 默认值
      lazyLoadMembers: true,       // � element-web 标准：延迟加载成员
      filter: undefined,           // 使用默认过滤器
      includeArchivedRooms: false, // 不包含归档房间
      resolveInvitesToProfiles: true, // 解析邀请为用户资料
      pendingEventOrdering: "detached" // element-web 标准
    }

    // 🔧 先初始化存储（仿照 element-web）
    try {
      if (typeof this.AuthenticatedMatrixClient.store?.startup === 'function') {
        await this.AuthenticatedMatrixClient.store.startup()
      }
    } catch (error) {
      console.warn('[V2] 存储初始化失败:', error)
    }



    // 启动客户端同步
    this.AuthenticatedMatrixClient.startClient(syncOptions)

    // 🔧 不等待同步完成，立即返回（仿照 element-web）

  }










  /**
   * 处理登录错误
   */
  private HandleLoginError(error: any): Error {
    const errormessage = error.message || error.toString()

    if (errormessage.includes('M_FORBIDDEN') || errormessage.includes('Invalid password')) {
      return new Error('用户名或密码错误，请重新输入')
    } else if (errormessage.includes('M_USER_DEACTIVATED')) {
      return new Error('此账户已被停用，请联系管理员')
    } else if (errormessage.includes('M_LIMIT_EXCEEDED') || errormessage.includes('429')) {
      return new Error('登录尝试过于频繁，请等待30秒后再试')
    } else if (errormessage.includes('Network')) {
      return new Error('网络连接失败，请检查网络设置或服务器地址')
    } else if (errormessage.includes('SSO 登录失败')) {
      // [NEW] 适配 SSO 错误
      if (errormessage.includes('401') || errormessage.includes('Unauthorized')) {
        return new Error('登录验证失败，请检查用户名或密码')
      }
      return new Error(errormessage) // 保持原始 SSO 错误信息
    } else {
      return new Error(`登录失败: ${errormessage}`)
    }
  }


  /**
 * 生成完整用户ID
 */
  private GenerateUserID(username: string, homeserver: string): string {
    const servername = homeserver
      .replace('https://', '')
      .replace('http://', '')
      .replace(/\/$/, '')

    return `@${username}:${servername}`
  }


  /**
   * 保存登录参数
   */
  private SaveLoginConfig(LoginConfig: MatrixLoginConfig, AccessToken?: string, DeviceId?: string): void {
    try {
      const safelogindata = {
        homeserver: LoginConfig.homeserver,
        username: LoginConfig.username,
        deviceId: DeviceId,
        lastLoginTime: Date.now()
      }

      if (AccessToken) {
        localStorage.setItem('matrix_access_token', AccessToken)
      }

      const codedata = btoa(JSON.stringify(safelogindata))
      localStorage.setItem('matrix_login_params', codedata)
      console.log('[V2] 登录参数已保存')
    } catch (error) {
      console.warn('[V2] 保存登录参数失败:', error)
    }
  }


  /**
   * 获取已认证客户端实例
   */
  getAuthedClient() {
    if (!this.AuthenticatedMatrixClient) {
      console.warn('[V2] 尚未登录或客户端未初始化')
      return null
    }
    return this.AuthenticatedMatrixClient
  }


  /**
   * 检查登录状态
   */
  CheckLoginStatus(): boolean {
    return this.AuthenticatedMatrixClient !== null
  }



  /**
   * 用户登出
   */
  UserLoginOut(saveusername: boolean = true): void {
    if (this.AuthenticatedMatrixClient) {
      try {
        this.AuthenticatedMatrixClient.stopClient()
        console.log('[V2] 🔧 跳过服务器logout调用，保持access token有效')
      } catch (error) {
        console.warn('[V2] 登出过程中出现错误:', error)
      }
      this.AuthenticatedMatrixClient = null
    }
    if (this.NoAuthenticatedMatrixClient) {
      try {
        this.NoAuthenticatedMatrixClient.stopClient()
      } catch (error) {
        console.warn('[V2] 停止基础客户端时出现错误:', error)
      }
      this.NoAuthenticatedMatrixClient = null
    }

    userInfoManager.clear()

    if (!saveusername) {
      localStorage.removeItem('matrix_login_params')
      localStorage.removeItem('matrix_access_token')
      this.clearSyncStorageData()
    }
    else {
      localStorage.removeItem('matrix_access_token')
    }
  }








  clearLoginToken(): void {
    localStorage.removeItem('matrix_access_token')
    console.log('[V2] 登录令牌已清除')
  }

  /**
   * 🔧 清除同步存储数据 - 修复同步存储问题
   */
  clearSyncStorageData(): void {
    try {
      // 清除Matrix相关的localStorage数据
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('matrix_') ||
          key.startsWith('mx_') ||
          key.includes('crypto') ||
          key.includes('device') ||
          key.includes('sync')
        )) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`[V2] 已清除存储键: ${key}`)
      })

      // 清除IndexedDB数据 - 使用eval避免构建工具解析问题
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          // 使用eval来执行IndexedDB清理代码，避免构建时的语法解析问题
          const cleanupCode = `
            const dbNames = ['matrix-js-sdk', 'matrix-crypto', 'matrix-sync'];
            dbNames.forEach(dbName => {
              try {
                const deleteReq = indexedDB.deleteDatabase(dbName);
                deleteReq.onsuccess = () => console.log('[V2] 已清除IndexedDB:', dbName);
                deleteReq.onerror = () => console.warn('[V2] 清除IndexedDB失败:', dbName);
              } catch (dbError) {
                console.warn('[V2] 删除数据库时出错:', dbName, dbError);
              }
            });
          `;
          eval(cleanupCode);
          console.log('[V2]  IndexedDB清理已执行');
        } catch (error) {
          console.warn('[V2] 清除IndexedDB时出错:', error);
        }
      }

    } catch (error) {
      console.warn('[V2] 清除同步存储数据时出错:', error)
    }
  }

  /**
  * 加载登录参数
  */
  loadLoginParams(): any {
    try {
      const savedParams = localStorage.getItem('matrix_login_params')
      // ❗ 关键修复：添加 atob() 解码
      return savedParams ? JSON.parse(atob(savedParams)) : null
    } catch {
      return null
    }
  }


  /**
   * 自动登录
   */
  async autoLogin(): Promise<MatrixUser | null> {
    console.log('[V2] 尝试自动登录...')
    const token = localStorage.getItem('matrix_access_token')
    const params = this.loadLoginParams()

    if (token) {
      try {
        // 修复：自动登录时，优先使用保存的 homeserver 地址，而不是强制生产环境
        // 这样本地开发时 (localhost:8009) 才能正确验证本地发的 Token
        const savedHomeserver = params?.homeserver;
        const forcedHomeserver = savedHomeserver || Login_MATRIX_SERVER_URL_ALL || 'https://zheshu.tech/'

        console.log(`[V2] Token 自动登录：使用服务器 ${forcedHomeserver}`)

        // 将存储的用户名(username)作为 userId 传递给 AccessToken 登录函数
        const userInfo = await this.useAccessTokenLogin(token, forcedHomeserver, params?.username, params?.deviceId)
        console.log('[V2]  自动登录成功')
        return userInfo
      } catch (error: any) {
        console.error('[V2] 自动登录失败:', error)
        localStorage.removeItem('matrix_access_token')
        return null
      }
    }

    // 如果没有token或参数，也返回null
    return null
  }

  /**
     * 验证Access Token是否有效
     */
  async validateAccessToken(token: string, homeserver: string): Promise<{ userId: string; homeServer?: string }> {
    try {
      console.log('【MatrixClientV2】进入 验证AccessToken 函数')
      console.log(`【MatrixClientV2】验证参数 - homeserver: "${homeserver}"`)
      console.log(`【MatrixClientV2】验证参数 - token: "${token}"`)

      // 创建临时客户端来验证token
      console.log('【MatrixClientV2】准备创建临时SDK客户端进行验证...')
      const tempClient = sdk.createClient({
        baseUrl: homeserver,
        accessToken: token,
        userId: undefined // 让SDK自动获取
      })
      console.log('【MatrixClientV2】临时SDK客户端已创建，准备调用 whoami...')

      // 调用whoami接口验证token
      const result = await tempClient.whoami()
      console.log('【MatrixClientV2】whoami 调用成功，验证通过。结果:', result)

      return {
        userId: result.user_id,
        homeServer: homeserver
      }
    } catch (error: any) {
      console.error('【MatrixClientV2】 Token验证失败:', error)
      // 增加更详细的错误日志
      if (error && typeof error === 'object' && 'errcode' in error) {
        console.error(`【MatrixClientV2】错误码: ${error.errcode}, 错误信息: ${error.message}`)
      }
      throw new Error(error.message || 'Token验证失败')
    }
  }


  /**
    * 使用Access Token登录
    */
  async useAccessTokenLogin(token: string, homeserver: string, userId?: string, deviceId?: string): Promise<MatrixUser> {
    try {
      console.log(
        '【MatrixClientV2】使用AccessToken登录接收到的参数:',
        `Token: "${token}"`,
        `Homeserver: "${homeserver}"`,
        `UserID: "${userId}"`,
        `DeviceId: "${deviceId}"`
      )
      // 确保 homeserver URL 格式正确
      if (!homeserver.startsWith('http')) {
        homeserver = 'https://' + homeserver
      }
      // 使用 whoami 校验 token，获取权威 user_id（避免手工拼接导致域名不一致）
      const who = await this.validateAccessToken(token, homeserver)
      const actualUserId = who.userId
      console.log(`【MatrixClientV2】whoami 验证成功，权威 user_id = ${actualUserId}`)

      // 为Access Token登录流程生成并提供设备ID
      const finalDeviceId = deviceId || this.GenerateUserDeviceId(actualUserId!)
      console.log(`[V2] 🔧 Access Token登录时强制使用自定义设备ID: ${finalDeviceId}`)

      // 初始化 IndexedDB 存储 (非加密)
      const store = new sdk.IndexedDBStore({
        indexedDB: window.indexedDB,
        localStorage: window.localStorage,
        dbName: `matrix-store-${actualUserId}`
      })

      // 创建客户端实例
      this.AuthenticatedMatrixClient = sdk.createClient({
        baseUrl: homeserver,
        accessToken: token,
        userId: actualUserId,
        deviceId: finalDeviceId,
        store: store,
        timelineSupport: true,
        useAuthorizationHeader: true
      })

      // 保存登录参数并同步
      const local = (actualUserId.split(':')[0] || '').replace('@', '')
      this.SaveLoginConfig({
        homeserver: homeserver,
        username: local,
        password: ''
      }, token, finalDeviceId)
      userInfoManager.sync()

      // 启动同步并执行登录后操作
      await this.StartStandardSync();


      const userInfo: MatrixUser = {
        userId: actualUserId!,
        displayName: actualUserId!
      }

      return userInfo
    } catch (error: any) {
      console.error('[V2] Access Token登录失败:', error)
      throw new Error(error.message || 'Access Token登录失败')
    }
  }

































  // ===== 事件系统方法 =====

  /**
   * 订阅事件
   */
  subscribe(eventType: string, callback: any, options: {
    once?: boolean
    priority?: number
  } = {}): string {
    return matrixEventManager.subscribe(eventType, callback, options)
  }

  /**
   * 取消订阅事件
   */
  unsubscribe(subscriptionId: string): boolean {
    return matrixEventManager.unsubscribe(subscriptionId)
  }

  /**
   * 触发事件
   */
  emit(eventType: string, data?: any): void {
    matrixEventManager.emit(eventType, data)
  }

  /**
   * 获取事件监听器
   */
  getListeners(eventType?: string): any[] {
    return matrixEventManager.getListeners(eventType)
  }

  /**
   * 清除所有事件监听器
   */
  clearEventListeners(): void {
    matrixEventManager.clearEventListeners()
  }

  // ===== 消息管理方法 =====

  /**
   * 获取房间时间线
   */
  getRoomTimeline(roomId: string): any | null {
    return matrixEventManager.getRoomTimeline(roomId)
  }

  /**
   * 发送消息
   */
  async sendMessage(roomId: string, content: string, msgtype: string = 'm.text'): Promise<string> {
    return matrixEventManager.sendMessage(roomId, content, msgtype)
  }

  /**
   * 标记已读
   */
  async markAsRead(roomId: string, eventId?: string): Promise<void> {
    return matrixEventManager.markAsRead(roomId, eventId)
  }

  /**
   * 加载更多历史消息
   */
  async loadMoreHistory(roomId: string, limit: number = 20): Promise<boolean> {
    return matrixEventManager.loadMoreHistory(roomId, limit)
  }

  /**
   * 获取房间摘要列表
   */
  getRoomSummaries(): any[] {
    return matrixEventManager.getRoomSummaries()
  }

  // ===== 事件监听器设置 =====

  /**
   * 设置Matrix事件监听器
   */
  private setupEventListeners(): void {
    matrixEventManager.setMatrixClient(this.AuthenticatedMatrixClient)
    matrixEventManager.setupEventListeners()
  }

  // ===== 辅助方法 =====

  // ===== 重写现有方法以集成事件系统 =====

  /**
   * 执行登录后标准操作（增强版）
   */
  async ExecutePostLoginActions(): Promise<void> {
    console.log('[V2] 执行登录后标准操作...')
    try {
      // 启动客户端同步
      if (this.AuthenticatedMatrixClient) {
        await this.AuthenticatedMatrixClient.startClient({ initialSyncLimit: 10 })

        // 设置事件监听器
        this.setupEventListeners()
      }

      // 初始化加密（如果启用）
      // await this.InitializeCrossSigning()

      console.log('[V2] 登录后操作完成')
    } catch (error) {
      console.warn('[V2] 执行登录后操作时出错:', error)
    }
  }
}






export const matrixClientV2 = new MatrixClientClass_V2()
export const Matrix客户端V2 = matrixClientV2