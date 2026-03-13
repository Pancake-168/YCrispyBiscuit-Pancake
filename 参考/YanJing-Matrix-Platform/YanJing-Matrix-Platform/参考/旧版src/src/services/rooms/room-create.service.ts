// 房间创建服务 V2 - 按照Matrix标准重写
// 负责处理房间的创建、配置和初始化
import type { MatrixRoom } from '../../types/matrix'
import type { 
  RoomCreateOptions, 
  RoomManagementError
} from '../../types/room-management.types'
import { matrixClientV2 } from '../matrix/client'

/**
 * 房间创建服务类 V2 - 标准实现
 * 按照Matrix标准实现房间创建功能
 */
class 房间创建服务类_V2 {
  
  /**
   * 创建新房间 - 标准实现
   * @param options 房间创建选项
   * @returns 创建的房间对象
   */
  async 创建房间(options: RoomCreateOptions): Promise<MatrixRoom> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw this.创建错误对象('PERMISSION_DENIED', '[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log('[V2] 开始创建房间:', options)

      // 构建Matrix SDK的房间创建选项 - 标准方式
      const createRoomOptions: any = {
        topic: options.topic,
        visibility: options.visibility,
        preset: this.获取预设类型(options),
        room_alias_name: options.alias, // 不包含#和服务器部分
        invite: options.invites || [],
        is_direct: false, // 暂时不支持直接消息房间
        room_version: options.roomVersion
      }

      if (options.name && options.name.trim()) {
        createRoomOptions.name = options.name
      }

      // 设置历史可见性
      if (options.historyVisibility) {
        createRoomOptions.initial_state = createRoomOptions.initial_state || []
        createRoomOptions.initial_state.push({
          type: 'm.room.history_visibility',
          content: {
            history_visibility: options.historyVisibility
          }
        })
      }

      // 设置加入规则
      if (options.joinRule) {
        createRoomOptions.initial_state = createRoomOptions.initial_state || []
        createRoomOptions.initial_state.push({
          type: 'm.room.join_rules',
          content: {
            join_rule: options.joinRule
          }
        })
      }

      // 设置访客访问权限
      if (options.guestAccess) {
        createRoomOptions.initial_state = createRoomOptions.initial_state || []
        createRoomOptions.initial_state.push({
          type: 'm.room.guest_access',
          content: {
            guest_access: options.guestAccess
          }
        })
      }

      // 启用端到端加密 - 标准配置
      if (options.encryption) {
        createRoomOptions.initial_state = createRoomOptions.initial_state || []
        createRoomOptions.initial_state.push({
          type: 'm.room.encryption',
          content: {
            algorithm: 'm.megolm.v1.aes-sha2',
            rotation_period_ms: 604800000, // 7天
            rotation_period_msgs: 100
          }
        })
      }

      // 设置权限等级
      if (options.powerLevels) {
        createRoomOptions.power_level_content_override = options.powerLevels
      }

      // 调用Matrix SDK创建房间
      const response = await client.createRoom(createRoomOptions)
      const roomId = response.room_id

      console.log('[V2] 房间创建成功:', roomId)

      // 等待房间状态同步
      await this.等待房间同步(roomId)

      // 设置房间头像（如果提供）
      if (options.avatarUrl) {
        await this.设置房间头像(roomId, options.avatarUrl)
      }

      // 如果指定了所属空间，将房间添加到空间中
      if (options.belongSpace && options.belongSpace !== 'default') {
        await this.将房间添加到空间(roomId, options.belongSpace)
      }

      // 获取创建的房间对象
      const room = this.获取创建的房间(roomId)
      if (!room) {
        throw this.创建错误对象('ROOM_CREATION_FAILED', '房间创建后无法获取房间对象')
      }

      console.log('[V2]  房间初始化完成:', room)
      return room

    } catch (error: any) {
      console.error('[V2] 创建房间失败:', error)
      throw this.处理创建房间错误(error)
    }
  }

  /**
   * 创建一个不加密的新房间 - 独立实现
   * @param options 房间创建选项，将忽略其中的 'encryption' 属性
   * @returns 创建的房间对象
   */
  async 创建不加密的房间(options: Omit<RoomCreateOptions, 'encryption'>): Promise<MatrixRoom> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw this.创建错误对象('PERMISSION_DENIED', '[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log('[V2] 开始创建不加密的房间:', options)

      // 构建Matrix SDK的房间创建选项 - 明确不加密
      const createRoomOptions: any = {
        topic: options.topic,
        visibility: options.visibility,
        preset: options.visibility === 'public' ? 'public_chat' : 'private_chat',
        room_alias_name: options.alias,
        invite: options.invites || [],
        is_direct: false,
        room_version: options.roomVersion,
        initial_state: [] // 确保不包含加密事件
      }

      if (options.name && options.name.trim()) {
        createRoomOptions.name = options.name
      }

      // 设置历史可见性
      if (options.historyVisibility) {
        createRoomOptions.initial_state.push({
          type: 'm.room.history_visibility',
          content: {
            history_visibility: options.historyVisibility
          }
        })
      }

      // 设置加入规则
      if (options.joinRule) {
        createRoomOptions.initial_state.push({
          type: 'm.room.join_rules',
          content: {
            join_rule: options.joinRule
          }
        })
      }

      // 设置访客访问权限
      if (options.guestAccess) {
        createRoomOptions.initial_state.push({
          type: 'm.room.guest_access',
          content: {
            guest_access: options.guestAccess
          }
        })
      }

      // 设置权限等级
      if (options.powerLevels) {
        createRoomOptions.power_level_content_override = options.powerLevels
      }

      // 调用Matrix SDK创建房间
      const response = await client.createRoom(createRoomOptions)
      const roomId = response.room_id

      console.log('[V2] 不加密的房间创建成功:', roomId)

      // 等待房间状态同步
      await this.等待房间同步(roomId)

      // 设置房间头像（如果提供）
      if (options.avatarUrl) {
        await this.设置房间头像(roomId, options.avatarUrl)
      }

      // 如果指定了所属空间，将房间添加到空间中
      if (options.belongSpace && options.belongSpace !== 'default') {
        await this.将房间添加到空间(roomId, options.belongSpace)
      }

      // 获取创建的房间对象
      const room = this.获取创建的房间(roomId)
      if (!room) {
        throw this.创建错误对象('ROOM_CREATION_FAILED', '房间创建后无法获取房间对象')
      }

      console.log('[V2]  不加密的房间初始化完成:', room)
      return room

    } catch (error: any) {
      console.error('[V2] 创建不加密的房间失败:', error)
      throw this.处理创建房间错误(error)
    }
  }

  /**
   * 创建私人聊天房间（直接消息）- 标准实现
   * @param userId 目标用户ID
   * @param encrypted 是否启用端到端加密。默认为 `false`（不加密）。
   * @param options 可选的房间选项
   * @returns 创建的房间对象
   */
  async 创建私人聊天房间(
    userId: string,
    encrypted: boolean = false, // 默认不加密
    options?: Partial<RoomCreateOptions>
  ): Promise<MatrixRoom> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw this.创建错误对象('PERMISSION_DENIED', '[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      const logPrefix = encrypted ? '加密' : '不加密'
      console.log(`[V2] 创建${logPrefix}的私人聊天房间:`, userId)

      const createRoomOptions: any = {
        is_direct: true,
        invite: [userId],
        visibility: 'private',
        // 根据是否加密选择合适的预设
        preset: encrypted ? 'trusted_private_chat' : 'private_chat',
        initial_state: [],
        ...options
      }

      // 仅在明确要求时才添加加密事件
      if (encrypted) {
        createRoomOptions.initial_state.push({
          type: 'm.room.encryption',
          content: {
            algorithm: 'm.megolm.v1.aes-sha2'
          }
        })
      }

      const response = await client.createRoom(createRoomOptions)
      const roomId = response.room_id

      console.log(`[V2] ${logPrefix}私人聊天房间创建成功，开始设置 m.direct 标记:`, roomId)

      // 手动设置 m.direct 账户数据，确保所有Matrix客户端都能识别为直接消息
      try {
        const currentDirectRooms = client.getAccountData('m.direct')?.getContent() || {}
        const updatedDirectRooms = { ...currentDirectRooms }
        
        // 确保用户有直接消息房间列表
        if (!updatedDirectRooms[userId]) {
          updatedDirectRooms[userId] = []
        }
        
        // 添加新的房间ID到该用户的直接消息列表中
        if (!updatedDirectRooms[userId].includes(roomId)) {
          updatedDirectRooms[userId].push(roomId)
        }
        
        // 更新账户数据
        await client.setAccountData('m.direct', updatedDirectRooms)
        console.log(`[V2]  m.direct 账户数据已更新:`, updatedDirectRooms)
      } catch (directError: any) {
        console.warn(`[V2] 设置 m.direct 失败，但${logPrefix}房间已创建:`, directError.message)
        // 不抛出错误，因为房间已经创建成功
      }

      await this.等待房间同步(roomId)

      const room = this.获取创建的房间(roomId)
      if (!room) {
        throw this.创建错误对象('ROOM_CREATION_FAILED', '私人聊天房间创建后无法获取房间对象')
      }

      console.log(`[V2]  ${logPrefix}的私人聊天房间创建完成:`, room)
      return room

    } catch (error: any) {
      console.error('[V2] 创建私人聊天房间失败:', error)
      throw this.处理创建房间错误(error)
    }
  }

  /**
   * 创建一个不加密的私人聊天房间 - 专用于此目的
   * @param userId 目标用户ID
   * @param options 可选的房间选项
   * @returns 创建的房间对象
   */
  async 创建不加密的私人聊天房间(userId: string, options?: Partial<RoomCreateOptions>): Promise<MatrixRoom> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw this.创建错误对象('PERMISSION_DENIED', '[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log('[V2] 创建一个不加密的私人聊天房间:', userId)

      const createRoomOptions: any = {
        is_direct: true,
        invite: [userId],
        visibility: 'private',
        preset: 'private_chat', // 'private_chat' is suitable for non-e2ee DMs
        initial_state: [], // 确保不包含加密事件
        ...options
      }

      const response = await client.createRoom(createRoomOptions)
      const roomId = response.room_id

      console.log('[V2] 私人聊天房间创建成功，开始设置 m.direct 标记:', roomId)

      // 手动设置 m.direct 账户数据，确保所有Matrix客户端都能识别为直接消息
      try {
        const currentDirectRooms = client.getAccountData('m.direct')?.getContent() || {}
        const updatedDirectRooms = { ...currentDirectRooms }
        
        // 确保用户有直接消息房间列表
        if (!updatedDirectRooms[userId]) {
          updatedDirectRooms[userId] = []
        }
        
        // 添加新的房间ID到该用户的直接消息列表中
        if (!updatedDirectRooms[userId].includes(roomId)) {
          updatedDirectRooms[userId].push(roomId)
        }
        
        // 更新账户数据
        await client.setAccountData('m.direct', updatedDirectRooms)
        console.log('[V2]  m.direct 账户数据已更新:', updatedDirectRooms)
      } catch (directError: any) {
        console.warn('[V2] 设置 m.direct 失败，但房间已创建:', directError.message)
        // 不抛出错误，因为房间已经创建成功
      }

      await this.等待房间同步(roomId)

      const room = this.获取创建的房间(roomId)
      if (!room) {
        throw this.创建错误对象('ROOM_CREATION_FAILED', '私人聊天房间创建后无法获取房间对象')
      }

      console.log('[V2]  不加密的私人聊天房间创建完成:', room)
      return room

    } catch (error: any) {
      console.error('[V2] 创建不加密的私人聊天房间失败:', error)
      throw this.处理创建房间错误(error)
    }
  }

  /**
   * 克隆现有房间（复制设置创建新房间）- 标准实现
   * @param sourceRoomId 源房间ID
   * @param newRoomOptions 新房间的选项（覆盖源房间设置）
   * @returns 创建的房间对象
   */
  async 克隆房间(sourceRoomId: string, newRoomOptions: Partial<RoomCreateOptions>): Promise<MatrixRoom> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw this.创建错误对象('PERMISSION_DENIED', '[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log('[V2] 克隆房间:', sourceRoomId)

      const sourceRoom = client.getRoom(sourceRoomId)
      if (!sourceRoom) {
        throw this.创建错误对象('ROOM_NOT_FOUND', `找不到源房间: ${sourceRoomId}`)
      }

      // 获取源房间的设置
      const sourceSettings = this.提取房间设置(sourceRoom)
      
      // 合并设置
      const cloneOptions: RoomCreateOptions = {
        name: newRoomOptions.name || `${sourceSettings.name} (副本)`,
        topic: newRoomOptions.topic || sourceSettings.topic,
        visibility: newRoomOptions.visibility || 'private', // 默认私有
        encryption: newRoomOptions.encryption ?? sourceSettings.encryption,
        historyVisibility: newRoomOptions.historyVisibility || sourceSettings.historyVisibility,
        joinRule: newRoomOptions.joinRule || sourceSettings.joinRule,
        guestAccess: newRoomOptions.guestAccess || sourceSettings.guestAccess,
        powerLevels: newRoomOptions.powerLevels || sourceSettings.powerLevels,
        ...newRoomOptions
      }

      return await this.创建房间(cloneOptions)

    } catch (error: any) {
      console.error('[V2] 克隆房间失败:', error)
      throw this.处理创建房间错误(error)
    }
  }

  /**
   * 从模板创建房间 - 标准实现
   * @param templateName 模板名称
   * @param customOptions 自定义选项
   * @returns 创建的房间对象
   */
  async 从模板创建房间(templateName: string, customOptions: Partial<RoomCreateOptions>): Promise<MatrixRoom> {
    const template = this.获取房间模板(templateName)
    if (!template) {
      throw this.创建错误对象('ROOM_NOT_FOUND', `找不到房间模板: ${templateName}`)
    }

    const options: RoomCreateOptions = {
      ...template,
      ...customOptions
    }

    return await this.创建房间(options)
  }

  /**
   * 验证房间别名是否可用 - 标准实现
   * @param alias 房间别名（不包含#和服务器部分）
   * @returns 是否可用
   */
  async 验证房间别名(alias: string): Promise<boolean> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      return false
    }

    try {
      const domain = client.getDomain()
      const fullAlias = `#${alias}:${domain}`
      
      console.log(`[V2] 验证房间别名: ${fullAlias}`)
      
      // 尝试解析别名，如果成功则说明已被使用
      await client.getRoomIdForAlias(fullAlias)
      console.log(`[V2] 房间别名 ${fullAlias} 已被使用`)
      return false // 别名已存在
    } catch (error: any) {
      if (error.errcode === 'M_NOT_FOUND') {
        console.log(`[V2] 房间别名 ${alias} 可用 (404是预期的)`)
        return true // 别名可用（404是正常的）
      }
      console.warn('[V2] 验证房间别名时出错:', error.errcode || error.message)
      return false
    }
  }

  /**
   * 获取建议的房间别名 - 标准实现
   * @param baseName 基础名称
   * @returns 建议的别名
   */
  async 获取建议别名(baseName: string): Promise<string> {
    // 生成基础别名（移除特殊字符，转换为小写）
    const baseAlias = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20)

    // 检查基础别名是否可用
    if (await this.验证房间别名(baseAlias)) {
      return baseAlias
    }

    // 尝试添加数字后缀
    for (let i = 1; i <= 99; i++) {
      const alias = `${baseAlias}${i}`
      if (await this.验证房间别名(alias)) {
        return alias
      }
    }

    // 如果前面都不可用，生成随机后缀
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    return `${baseAlias}_${randomSuffix}`
  }

  /**
   * 批量创建房间 - 标准实现
   * @param roomOptionsArray 房间配置数组
   * @returns 创建结果
   */
  async 批量创建房间(roomOptionsArray: RoomCreateOptions[]): Promise<{
    succeeded: MatrixRoom[]
    failed: Array<{ options: RoomCreateOptions; error: string }>
  }> {
    const succeeded: MatrixRoom[] = []
    const failed: Array<{ options: RoomCreateOptions; error: string }> = []

    console.log(`[V2] 开始批量创建 ${roomOptionsArray.length} 个房间`)

    for (const options of roomOptionsArray) {
      try {
        const room = await this.创建房间(options)
        succeeded.push(room)
      } catch (error: any) {
        failed.push({
          options,
          error: error.message || '创建失败'
        })
      }
    }

    console.log(`[V2]  批量创建完成: 成功 ${succeeded.length} 个，失败 ${failed.length} 个`)
    return { succeeded, failed }
  }

  // 私有方法

  /**
   * 获取预设类型
   */
  private 获取预设类型(options: RoomCreateOptions): string {
    if (options.visibility === 'public') {
      return 'public_chat'
    } else if (options.encryption) {
      return 'private_chat'
    } else {
      return 'trusted_private_chat'
    }
  }

  /**
   * 等待房间同步 - 增强版，确保所有组件都能识别房间
   */
  private async 等待房间同步(roomId: string, timeoutMs: number = 15000): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) return

    const startTime = Date.now()
    
    // 阶段1：等待房间对象存在
    while (Date.now() - startTime < timeoutMs) {
      const room = client.getRoom(roomId)
      if (room) {
        console.log('[V2] 房间对象已创建:', roomId)
        break
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // 阶段2：等待房间状态完全加载
    let syncCheckCount = 0
    const maxSyncChecks = 30 // 最多检查30次，每次200ms
    
    while (syncCheckCount < maxSyncChecks && Date.now() - startTime < timeoutMs) {
      const room = client.getRoom(roomId)
      if (room && room.currentState && room.timeline) {
        // 检查房间是否有基本的状态事件
        const hasBasicState = room.currentState.getStateEvents('m.room.create', '') !== null
        if (hasBasicState) {
          console.log('[V2] 房间同步完成:', roomId)
          // 额外等待200ms确保所有组件都能识别
          await new Promise(resolve => setTimeout(resolve, 200))
          return
        }
      }
      syncCheckCount++
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.warn('[V2] 等待房间同步超时:', roomId, '但房间可能已创建成功')
  }

  /**
   * 设置房间头像
   */
  private async 设置房间头像(roomId: string, avatarUrl: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) return

    try {
      await client.setRoomAvatar(roomId, avatarUrl)
      console.log('[V2] 房间头像设置成功:', roomId, avatarUrl)
    } catch (error) {
      console.warn('[V2] 设置房间头像失败:', error)
    }
  }

  /**
   * 获取创建的房间
   */
  private 获取创建的房间(roomId: string): MatrixRoom | null {
    const client = matrixClientV2.getAuthedClient()
    if (!client) return null

    const room = client.getRoom(roomId)
    if (!room) return null

    try {
      return {
        roomId: room.roomId,
        name: room.name || room.roomId,
        lastActivity: room.getLastActiveTimestamp ? room.getLastActiveTimestamp() : 0,
        encrypted: this.检查房间加密状态(room),
        topic: this.获取房间主题(room),
        membership: room.getMyMembership ? room.getMyMembership() : 'join',
        unreadCount: 0
      }
    } catch (error) {
      console.error('[V2] 获取创建的房间失败:', error)
      return null
    }
  }

  /**
   * 检查房间加密状态
   */
  private 检查房间加密状态(room: any): boolean {
    try {
      if (room.hasEncryptionStateEvent && typeof room.hasEncryptionStateEvent === 'function') {
        return room.hasEncryptionStateEvent()
      }

      const encryptionEvent = room.currentState?.getStateEvents('m.room.encryption', '')
      return encryptionEvent && encryptionEvent.getContent()
    } catch (error) {
      return false
    }
  }

  /**
   * 获取房间主题
   */
  private 获取房间主题(room: any): string {
    try {
      const topicEvent = room.currentState?.getStateEvents('m.room.topic', '')
      return topicEvent?.getContent()?.topic || ''
    } catch (error) {
      return ''
    }
  }

  /**
   * 提取房间设置
   */
  private 提取房间设置(room: any): any {
    try {
      return {
        name: room.name,
        topic: this.获取房间主题(room),
        encryption: this.检查房间加密状态(room),
        historyVisibility: room.getHistoryVisibility ? room.getHistoryVisibility() : 'shared',
        joinRule: room.getJoinRule ? room.getJoinRule() : 'invite',
        guestAccess: room.getGuestAccess ? room.getGuestAccess() : 'forbidden',
        powerLevels: room.currentState?.getStateEvents('m.room.power_levels', '')?.getContent()
      }
    } catch (error) {
      console.error('[V2] 提取房间设置失败:', error)
      return {}
    }
  }

  /**
   * 获取房间模板
   */
  private 获取房间模板(templateName: string): RoomCreateOptions | null {
    const templates: Record<string, RoomCreateOptions> = {
      'team': {
        name: '团队讨论',
        topic: '团队内部讨论和协作',
        visibility: 'private',
        encryption: true,
        historyVisibility: 'invited',
        joinRule: 'invite',
        guestAccess: 'forbidden'
      },
      'project': {
        name: '项目管理',
        topic: '项目相关的讨论和文件分享',
        visibility: 'private',
        encryption: true,
        historyVisibility: 'joined',
        joinRule: 'invite',
        guestAccess: 'forbidden'
      },
      'public': {
        name: '公开讨论',
        topic: '公开的讨论频道',
        visibility: 'public',
        encryption: false,
        historyVisibility: 'shared',
        joinRule: 'public',
        guestAccess: 'can_join'
      },
      'announcement': {
        name: '公告频道',
        topic: '重要公告和通知',
        visibility: 'private',
        encryption: true,
        historyVisibility: 'invited',
        joinRule: 'invite',
        guestAccess: 'forbidden',
        powerLevels: {
          users_default: 0,
          events_default: 50, // 普通用户不能发消息
          state_default: 50,
          invite: 50,
          kick: 50,
          ban: 50,
          redact: 50
        }
      },
      'encrypted': {
        name: '加密聊天',
        topic: '端到端加密的安全聊天',
        visibility: 'private',
        encryption: true,
        historyVisibility: 'invited',
        joinRule: 'invite',
        guestAccess: 'forbidden'
      }
    }

    return templates[templateName] || null
  }

  /**
   * 处理创建房间错误
   */
  private 处理创建房间错误(error: any): RoomManagementError {
    if (error.errcode) {
      switch (error.errcode) {
        case 'M_ROOM_IN_USE':
          return this.创建错误对象('INVALID_ROOM_ALIAS', '房间别名已被使用，请选择其他别名')
        case 'M_FORBIDDEN':
          return this.创建错误对象('PERMISSION_DENIED', '没有权限创建房间')
        case 'M_LIMIT_EXCEEDED':
          return this.创建错误对象('ROOM_CREATION_FAILED', '创建房间过于频繁，请稍后再试')
        case 'M_INVALID_ROOM_ALIAS':
          return this.创建错误对象('INVALID_ROOM_ALIAS', '房间别名格式无效')
        default:
          return this.创建错误对象('ROOM_CREATION_FAILED', `创建房间失败: ${error.message}`)
      }
    }
    
    if (error.code) {
      return error // 已经是我们的错误格式
    }
    
    return this.创建错误对象('UNKNOWN_ERROR', error.message || '创建房间时发生未知错误')
  }

  /**
   * 创建错误对象
   */
  private 创建错误对象(code: string, message: string, details?: any): RoomManagementError {
    return {
      code,
      message,
      details
    }
  }

  /**
   * 将房间添加到空间中
   * @param roomId 房间ID
   * @param spaceId 空间ID
   */
  private async 将房间添加到空间(roomId: string, spaceId: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw this.创建错误对象('PERMISSION_DENIED', 'Matrix客户端未初始化')
    }

    try {
      console.log(`[V2] 将房间 ${roomId} 添加到空间 ${spaceId}`)
      console.log(`[V2] 参数类型检查: roomId=${typeof roomId}, spaceId=${typeof spaceId}`)
      console.log(`[V2] roomId值:`, roomId)
      console.log(`[V2] spaceId值:`, spaceId)
      
      // 使用Matrix SDK将房间添加到空间
      // 正确的参数顺序：sendStateEvent(roomId, eventType, content, stateKey)
      await client.sendStateEvent(spaceId, 'm.space.child', {
        via: [client.getDomain()],
        suggested: false
      }, roomId)

      console.log(`[V2]  房间已成功添加到空间`)
    } catch (error: any) {
      console.warn('[V2] 将房间添加到空间失败:', error)
      // 不抛出错误，因为房间已经创建成功，空间关联失败不应该影响整个流程
    }
  }
}

// 导出房间创建服务V2实例
export const roomCreateServiceV2 = new 房间创建服务类_V2()
export const 房间创建服务V2 = roomCreateServiceV2
