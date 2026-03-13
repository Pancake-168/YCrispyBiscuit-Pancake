/**
 * 用户信息管理器
 * 负责同步核心登录参数，并管理额外的、可自由读写的个人信息。
 */
class UserInfoManager {
  // 内部数据结构，清晰地分离了登录信息和个人信息
  private data: {
    loginInfo: Record<string, any>;
    personalInfo: Record<string, any>;
  } = {
    loginInfo: {},
    personalInfo: {},
  };

  private storageKey: string | null = null;
  private readonly loginParamsKey = 'matrix_login_params'; // 这是要读取的源头
  private readonly ssoStorageKey = 'lingjing_sso_data'; // 统一存储 SSO 相关重要凭证

  constructor() {
    // 构造时不再自动加载，等待外部指令
    console.log('[UserInfoManager] 实例已创建，等待同步指令...');
  }

  // --- SSO 统一存储服务 ---

  private getSSOStorage(): Record<string, any> {
    try {
      const raw = localStorage.getItem(this.ssoStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  public getSSOField(fieldName: string): any {
    return this.getSSOStorage()[fieldName];
  }

  public setSSOField(fieldName: string, content: any): void {
    const data = this.getSSOStorage();
    data[fieldName] = content;
    localStorage.setItem(this.ssoStorageKey, JSON.stringify(data));
  }

  /**
   * 仅清理 SSO 统一存储（不会影响 matrix_login_params 或个人信息）。
   * 适用于 SSO 失败/取消/绑定失败等场景，避免残留旧 token 影响后续流程。
   */
  public clearSSOStorage(): void {
    try {
      localStorage.removeItem(this.ssoStorageKey);
    } catch (e) {
      console.warn('[UserInfoManager] 清理 SSO 存储失败:', e);
    }
  }

  /**
   * 【核心方法】同步数据
   * 在登录成功后必须调用此方法。
   * 它会读取 master 的 `matrix_login_params`，并与当前持有的登录信息比较。
   * 如果信息不一致（用户切换），则强制覆盖登录信息并清空所有个人信息。
   */
  public sync(): void {
    try {
      const loginParamsRaw = localStorage.getItem(this.loginParamsKey);
      const ssoDataRaw = localStorage.getItem(this.ssoStorageKey);

      // 如果源数据不存在，且也没有 SSO 凭证（loginToken 等），则认为彻底登出，清空所有内容
      if (!loginParamsRaw && !ssoDataRaw) {
        console.warn(`[UserInfoManager] 同步失败：未找到源数据且无 SSO 凭证，将清空本地数据。`);
        this.clear();
        return;
      }

      // 如果有 SSO 凭证但主登录参数暂时缺失（如微信登录中转状态），则跳过同步，不执行后续逻辑也不清理
      if (!loginParamsRaw) {
        return;
      }

      const decodedLoginParams = atob(loginParamsRaw); // 第1步：先用 atob() 解码
      const newLoginParams = JSON.parse(decodedLoginParams); // 第2步：再解析解码后的字符串

      // 使用 JSON.stringify 对比新旧登录信息是否完全一致
      const isUserChanged = JSON.stringify(this.data.loginInfo) !== JSON.stringify(newLoginParams);

      // 如果用户未改变，则无需任何操作，直接返回
      if (!isUserChanged) {
        console.log('[UserInfoManager] 登录信息未变更，无需同步。');
        return;
      }

      // --- 检测到用户变更，执行强制覆盖和清理 ---
      console.log('[UserInfoManager] 检测到登录信息变更，执行强制同步...');
      
      // 1. 强制覆盖 loginInfo 部分
      this.data.loginInfo = newLoginParams;

      // 2. 【关键步骤】清空旧用户的个人信息
      this.data.personalInfo = {};
      console.log('[UserInfoManager] 旧用户的个人信息已被清空。');

      // 3. 基于新用户信息，生成新的存储键
      const username = newLoginParams.username;
      if (username) {
        this.storageKey = `lingjing_user_profile_${username}`;
        // 尝试为新用户加载他之前存储的个人信息
        this.load(); 
      } else {
         console.error('[UserInfoManager] 同步异常：源数据中缺少 username，无法生成存储键。');
         this.storageKey = null;
      }

      // 4. 将同步后的最新数据（包含新的loginInfo和空的或新加载的personalInfo）保存
      this.save();
      console.log('[UserInfoManager] 数据同步完成。当前数据:', this.data);

    } catch (e) {
      console.error('[UserInfoManager] 同步或解析源数据时出错:', e);
    }
  }

  /**
   * 加载个人信息（personalInfo）
   * 在 sync 确定了 storageKey 后被调用。
   */
  private load(): void {
    if (!this.storageKey) return;
    try {
      const storedDataRaw = localStorage.getItem(this.storageKey);
      if (storedDataRaw) {
        const storedData = JSON.parse(storedDataRaw);
        // 只加载 personalInfo，loginInfo 总是通过 sync 获取最新
        this.data.personalInfo = storedData.personalInfo || {};
        console.log(`[UserInfoManager] 用户 ${this.getLoginField('username')} 的个人信息已加载。`);
      }
    } catch (e) {
      console.error('[UserInfoManager] 加载个人信息失败:', e);
    }
  }

  /**
   * 保存当前所有数据到自己的存储键下
   */
  private save(): void {
    if (!this.storageKey) {
      console.warn('[UserInfoManager] 保存失败：storageKey 未设置，请先执行 sync()。');
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  // --- 公共 API ---

  /**
   * 获取只读的登录信息字段。
   * @param fieldName - 字段名 (e.g., 'username', 'homeserver')
   * @returns 字段值
   */
  public getLoginField(fieldName: string): any {
    return this.data.loginInfo[fieldName];
  }

  /**
   * 获取个人信息字段。
   * @param fieldName - 字段名
   * @returns 字段值
   */
  public getPersonalInfo(fieldName: string): any {
    return this.data.personalInfo[fieldName];
  }

  /**
   * 获取 APPLICATION 数据的便捷方法
   * @returns APPLICATION 数组数据
   */
  public getApplication(): any[] {
    return this.data.personalInfo['APPLICATION'] || [];
  }

  /**
   * 获取 application_id 的便捷方法
   * @returns application_id 字符串
   */
  public getApplicationId(): string | null {
    const applications = this.getApplication();
    if (applications.length > 0 && applications[0].application_id) {
      return applications[0].application_id;
    }
    return this.data.personalInfo['APPLICATION_ID'] || null;
  }

  /**
   * 添加或更新一个个人信息字段。
   * @param fieldName - 字段名
   * @param content - 字段内容 (任何可JSON化的类型)
   */
  public addField(fieldName: string, content: any): void {
    this.data.personalInfo[fieldName] = content;
    this.save();
    console.log(`[UserInfoManager] 个人信息字段 '${fieldName}' 已更新。`);
  }

  /**
   * 清除当前用户的所有数据（loginInfo, personalInfo 和 localStorage）。
   * 在登出时调用。
   */
  public async clear(): Promise<void> {
    try {
      if (this.storageKey) {
        await localStorage.removeItem(this.storageKey);
      }
      // 同步清理 SSO 统一存储
      localStorage.removeItem(this.ssoStorageKey);
      
      this.data = { loginInfo: {}, personalInfo: {} };
      this.storageKey = null;
    } catch (error) {
      console.error('[UserInfoManager] 清除用户数据时出错:', error);
    }
    console.log('[UserInfoManager] 用户数据已清除。');
  }
}

// 导出 UserInfoManager 的单例
export const userInfoManager = new UserInfoManager();