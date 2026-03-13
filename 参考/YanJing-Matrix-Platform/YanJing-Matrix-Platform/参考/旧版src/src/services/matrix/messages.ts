// Matrix 消息相关服务 V2 - 按照Matrix标准重写
// 负责处理所有与消息相关的操作：发送消息、获取历史消息、监听新消息等
import type { MatrixMessage, RoomEventSummary } from '../../types'
import { matrixClientV2 } from './client'
import { matrixEventManager } from './eventManager'
import { MatrixEventType, type MessageEventData } from '../../types'
import { addReplyRelationToContent } from '@/services/Operations/MsgReply'
import { resolveUserDisplayName } from '@/utils/displayName'

interface SendOptions {
  replyToEventId?: string
}

/**
 * 消息服务类 V2 - 标准实现
 * 按照Matrix标准实现消息功能，确保加密和解密的正确性
 */
class 消息服务类_V2 {

  // 消息监听器回调
  private 消息监听回调?: (message: MatrixMessage) => void
  private 消息事件订阅ID: string | null = null

  // 解密监听回调 - 暂不需要，保留声明以保持接口兼容性
  // private 解密监听回调?: (房间ID: string, 消息事件: any) => void

  /**
   * 发送文本消息到指定房间 - 标准实现
   */
  async 发送文本消息(
    房间ID: string,
    消息内容: string | { plainText: string; htmlText: string; hasMentions: boolean },
    额外内容?: Record<string, any>,
    选项?: SendOptions,
  ): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      const error = new Error('[V2] Matrix客户端未初始化，请先登录')
      console.error('[V2] Matrix客户端未初始化')
      throw error
    }

    console.log('[V2] Matrix客户端状态:', {
      isConnected: client.isInitialSyncComplete(),
      userId: client.getUserId(),
      roomId: 房间ID
    })

    try {
      console.log(`[V2] 发送文本消息到房间 ${房间ID}: ${typeof 消息内容 === 'string' ? 消息内容.substring(0, 50) : 消息内容.plainText.substring(0, 50)}...`)
      
      // 处理消息内容
      let plainText: string
      let htmlText: string | undefined
      let mentions: { user_ids: string[] } | undefined
      
      if (typeof 消息内容 === 'string') {
        plainText = 消息内容
      } else {
        plainText = 消息内容.plainText
        if (消息内容.hasMentions) {
          htmlText = 消息内容.htmlText
          // 从HTML内容中提取mentions
          mentions = this.提取Mentions从HTML(htmlText)
        }
      }
      
      // 构建消息内容
      let content: any
      if (htmlText) {
        content = {
          msgtype: 'm.text',
          body: plainText,
          format: 'org.matrix.custom.html',
          formatted_body: htmlText
        }
      } else {
        content = {
          msgtype: 'm.text',
          body: plainText
        }
      }
      
      // 如果有mentions，添加m.mentions字段
      if (mentions && mentions.user_ids.length > 0) {
        content['m.mentions'] = mentions
      }
      
      // 合并额外内容（如 bundle_id 等自定义标记）
      if (额外内容) {
        content = { ...content, ...额外内容 }
      }

      if (选项?.replyToEventId) {
        addReplyRelationToContent(content, 选项.replyToEventId)
      }

      // 使用标准API发送消息
      const result = await client.sendMessage(房间ID, content)
      
      console.log(`[V2]  消息发送成功，事件ID: ${result.event_id}`)

    } catch (error: any) {
      console.error('Error details:', {
        message: error.message,
        code: error.errcode,
        httpStatus: error.httpStatus,
        data: error.data
      })
      throw this.处理发送错误(error)
    }
  }

  /**
   * 发送HTML消息 - 标准实现
   */
  async 发送HTML消息(房间ID: string, 纯文本内容: string, HTML内容: string): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 发送HTML消息到房间 ${房间ID}`)
      
      const result = await client.sendHtmlMessage(房间ID, 纯文本内容, HTML内容)
      
      console.log(`[V2]  HTML消息发送成功，事件ID: ${result.event_id}`)

    } catch (error: any) {
      console.error('[V2] 发送HTML消息失败:', error)
      throw this.处理发送错误(error)
    }
  }

  /**
   * 发送文件消息 - 标准实现，支持加密房间
   */
  async 发送文件消息(房间ID: string, 文件: File, 额外内容?: Record<string, any>, 选项?: SendOptions): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    try {
      console.log(`[V2] 开始处理文件上传: ${文件.name} (${文件.size} bytes, type: ${文件.type})`)

      // 步骤1: 检查房间是否启用加密
      const room = client.getRoom(房间ID)
      const isEncryptedRoom = room ? this.检查房间是否加密(room) : false
      
      console.log(`[V2] 房间 ${房间ID} 加密状态: ${isEncryptedRoom ? '已加密' : '未加密'}`)

      // 步骤2: 上传文件
      const uploadResult = await client.uploadContent(文件, {
        name: 文件.name,
        type: 文件.type,
        onlyContentUri: true
      })

      console.log(`[V2]  文件上传成功，MXC URI: ${uploadResult.content_uri}`)

      // 步骤3: 构建消息内容
      let 消息内容 = await this.构建文件消息内容(文件, uploadResult.content_uri)
      if (额外内容) {
        消息内容 = { ...消息内容, ...额外内容 }
      }

      if (选项?.replyToEventId) {
        addReplyRelationToContent(消息内容, 选项.replyToEventId)
      }

      // 步骤4: 发送消息
      const result = await client.sendMessage(房间ID, 消息内容)
      
      console.log(`[V2]  文件消息发送成功，事件ID: ${result.event_id}`)

    } catch (error: any) {
      console.error('[V2] 发送文件消息失败:', error)
      throw this.处理发送错误(error)
    }
  }

  /**
   * 发送复合消息（多事件）：将文本与多个文件作为一次用户动作发送。
   * - 仍是多条 Matrix 事件，但用同一个 bundle_id 便于前端分组
   */
  async 发送复合消息(
    房间ID: string,
    文本: string | { plainText: string; htmlText: string; hasMentions: boolean } | null,
    文件列表: File[],
    选项?: { textFirst?: boolean; replyToEventId?: string }
  ): Promise<{ bundleId: string; eventIds: string[] }> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('[V2] Matrix客户端未初始化，请先登录')
    }

    const bundleId = `com.yanjing.bundle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const eventIds: string[] = []

    // 约定：默认图片/文件在前、文本在后；可通过选项覆盖
    const textFirst = 选项?.textFirst ?? false

    // 1) 预上传所有文件，并并行构建消息内容，避免发送阶段出现长阻塞
    let fileContents: any[] = []
    if (文件列表 && 文件列表.length > 0) {
      try {
        fileContents = await Promise.all(
          文件列表.map(async (f) => {
            const res = await client.uploadContent(f, { name: f.name, type: f.type, onlyContentUri: true })
            const content = await this.构建文件消息内容(f, res.content_uri)
            return content
          })
        )
      } catch (e) {
        console.warn('[V2] 复合消息-文件预上传/构建内容出错:', e)
      }
    }

    // 2) 计算bundle元信息（index/total），并准备文本内容（不发送，仅准备）
    const totalCount = fileContents.length + (文本 ? 1 : 0)
    const baseExtra = { 'com.yanjing.bundle_id': bundleId, 'com.yanjing.bundle_total': totalCount }

    let preparedTextContent: { extra: Record<string, any>; text: typeof 文本 } | null = null
    if (文本) {
      // 文本的 index 在文件之后（当 textFirst=false）或之前（textFirst=true）
      const textIndex = textFirst ? 1 : fileContents.length + 1
      preparedTextContent = {
        extra: { ...baseExtra, 'com.yanjing.bundle_index': textIndex },
        text: 文本,
      }
    }

    // 将 index 标注到每个文件内容上（保留原始顺序）
    const preparedFileContents = fileContents.map((c, i) => {
      const payload = {
        ...c,
        ...baseExtra,
        'com.yanjing.bundle_index': textFirst ? i + 2 : i + 1,
      }
      if (选项?.replyToEventId) {
        addReplyRelationToContent(payload, 选项.replyToEventId)
      }
      return payload
    })

    // 3) 发送阶段：仅做快速 sendMessage，保证顺序但尽量减少间隔
    console.log('[V2] 发送复合消息：bundle', {
      bundleId,
      textFirst,
      fileCount: preparedFileContents.length,
      hasText: !!preparedTextContent,
    })
    if (textFirst && preparedTextContent) {
      try {
        console.log('[V2] 发送复合消息：先发文本 (index=', preparedTextContent.extra['com.yanjing.bundle_index'], '/', baseExtra['com.yanjing.bundle_total'], ')')
        await this.发送文本消息(房间ID, preparedTextContent.text!, preparedTextContent.extra, {
          replyToEventId: 选项?.replyToEventId,
        })
      } catch (e) {
        console.warn('[V2] 复合消息-文本发送失败:', e)
      }
    }

    for (const content of preparedFileContents) {
      try {
        console.log('[V2] 发送复合消息：发送文件 (index=', content['com.yanjing.bundle_index'], '/', baseExtra['com.yanjing.bundle_total'], ')', content.msgtype, content.body)
  const r = await client.sendMessage(房间ID, content)
        if (r?.event_id) eventIds.push(r.event_id)
      } catch (e) {
        console.warn('[V2] 复合消息-文件发送失败:', e)
      }
    }

    if (!textFirst && preparedTextContent) {
      try {
        console.log('[V2] 发送复合消息：最后发文本 (index=', preparedTextContent.extra['com.yanjing.bundle_index'], '/', baseExtra['com.yanjing.bundle_total'], ')')
        await this.发送文本消息(房间ID, preparedTextContent.text!, preparedTextContent.extra, {
          replyToEventId: 选项?.replyToEventId,
        })
      } catch (e) {
        console.warn('[V2] 复合消息-文本发送失败:', e)
      }
    }

    return { bundleId, eventIds }
  }

  /**
   * 获取房间历史消息 - 标准实现，正确处理加密消息
   */
  async 获取房间历史消息(房间ID: string): Promise<MatrixMessage[]> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      console.warn('[V2] Matrix客户端未初始化，无法获取历史消息')
      return []
    }

    try {
    //  console.log(`[V2] 开始获取房间 ${房间ID} 的历史消息...`)

      // 获取房间对象
      const room = client.getRoom(房间ID)
      if (!room) {
        console.warn(`[V2] 找不到房间: ${房间ID}`)
        return []
      }

      // 获取时间线事件
  const liveTimeline = room.getLiveTimeline()
  const events = liveTimeline.getEvents()
        console.log(`[V2] 找到 ${events.length} 个时间线事件`)

        const processedEvents = await Promise.all(
          events.map(async (event: any) => {
            const eventType = event.getType()

            if (eventType === 'm.room.message' || eventType === 'm.room.encrypted') {
              return await this.处理消息事件(event, 房间ID)
            }

            const summary = matrixEventManager.createEventSummary(event, room)
            if (summary && summary.isSystemEvent && summary.description) {
              return this.构建系统事件消息(summary, room)
            }

            return null
          })
        )

        // 过滤掉null值
        const rawValidMessages = processedEvents.filter(msg => msg !== null) as MatrixMessage[]

        // 合并事件管理器维护的时间线（包含我们注入的系统消息，如撤回提示）
  const cachedTimeline = matrixEventManager.getRoomTimeline(房间ID)
        let merged: MatrixMessage[]
        if (cachedTimeline && cachedTimeline.messages.length > 0) {
          const map = new Map<string, MatrixMessage>()
          // 先放入事件管理器的版本（可能更及时包含系统提示）
          for (const m of cachedTimeline.messages) {
            map.set(m.eventId, m)
          }
          // 再合并当前处理出的原始消息，避免覆盖系统提示
          for (const m of rawValidMessages) {
            if (!map.has(m.eventId)) {
              map.set(m.eventId, m)
            }
          }
          merged = Array.from(map.values())
        } else {
          merged = rawValidMessages
        }

        // 排序（按时间升序）
        merged.sort((a, b) => a.timestamp - b.timestamp)

      console.log(`[V2]  成功处理 ${merged.length} 条历史消息（含系统事件合并）`)
      return merged

    } catch (error) {
      console.error('[V2] 获取房间历史消息失败:', error)
      return []
    }
  }

  /**
   * 设置实时消息监听器 - 标准实现
   */
  设置消息监听器(消息回调函数: (message: MatrixMessage) => void): void {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      console.warn('[V2] Matrix客户端未初始化，无法设置消息监听器')
      return
    }

    // 取消之前的事件订阅
    if (this.消息事件订阅ID) {
      matrixEventManager.unsubscribe(this.消息事件订阅ID)
      this.消息事件订阅ID = null
    }

    this.消息监听回调 = 消息回调函数

    this.消息事件订阅ID = matrixEventManager.subscribe(
      MatrixEventType.MESSAGE_RECEIVED,
      async (eventData: MessageEventData) => {
        if (!this.消息监听回调 || !eventData?.content) {
          return
        }

        try {
          // 使用事件管理器提供的数据，必要时补充显示名称等信息
          const enrichedMessage = await this.补充消息显示名称(eventData.content)
          this.消息监听回调(enrichedMessage)
        } catch (error) {
          console.warn('[V2] 处理事件中心消息失败:', error)
        }
      }
    )

    console.log('[V2]  已通过事件管理器订阅消息事件')
  }

  /**
   * 设置解密监听回调
   * 暂不需要解密监听功能，方法保留但内部实现为空
   */
  设置解密监听器(_回调函数: (房间ID: string, 消息事件: any) => void): void {
    // 暂不需要解密监听功能，保留方法结构以保持接口兼容性
    return
  }

  /**
   * 重试解密消息 - 标准实现
   * 暂不需要复杂的解密重试逻辑，简化为空实现
   */
  async 重试解密消息(房间ID: string): Promise<void> {
    // 暂不需要复杂的解密重试逻辑，保留方法结构以保持接口兼容性
    console.log(`[V2] 跳过房间 ${房间ID} 的解密重试`)
    return Promise.resolve()
  }

  /**
   * 检查房间是否启用加密
   */
  private 检查房间是否加密(room: any): boolean {
    try {
      const encryptionEvent = room.currentState?.getStateEvents('m.room.encryption', '')
      return !!(encryptionEvent && encryptionEvent.getContent()?.algorithm)
    } catch (error) {
      return false
    }
  }

  /**
   * 从HTML内容中提取mentions
   */
  private 提取Mentions从HTML(htmlText: string): { user_ids: string[] } | undefined {
    const userIds: string[] = []
    // 匹配 matrix.to 链接中的用户ID
    const matrixToRegex = /https:\/\/matrix\.to\/#\/(@[^"']+)/g
    let match
    
    while ((match = matrixToRegex.exec(htmlText)) !== null) {
      userIds.push(match[1])
    }
    
    return userIds.length > 0 ? { user_ids: userIds } : undefined
  }

  /**
   * 构建文件消息内容
   */
  private async 构建文件消息内容(文件: File, mxcUrl: string): Promise<any> {
    const 消息内容: any = {
      body: 文件.name,
      info: {
        mimetype: 文件.type,
        size: 文件.size,
      },
      url: mxcUrl,
    }

    // 根据文件类型设置消息类型和元数据
    const fileType = 文件.type.split('/')[0]

    switch (fileType) {
      case 'image':
        消息内容.msgtype = 'm.image'
        try {
          const dimensions = await this.获取图片尺寸(文件)
          消息内容.info.w = dimensions.width
          消息内容.info.h = dimensions.height
        } catch (error) {
          console.warn('[V2] 无法获取图片尺寸:', error)
        }
        break

      case 'video':
        消息内容.msgtype = 'm.video'
        try {
          const metadata = await this.获取视频元数据(文件)
          消息内容.info.w = metadata.width
          消息内容.info.h = metadata.height
          消息内容.info.duration = metadata.duration
        } catch (error) {
          console.warn('[V2] 无法获取视频元数据:', error)
        }
        break

      case 'audio':
        消息内容.msgtype = 'm.audio'
        try {
          const metadata = await this.获取音频元数据(文件)
          消息内容.info.duration = metadata.duration
        } catch (error) {
          console.warn('[V2] 无法获取音频元数据:', error)
        }
        break

      default:
        消息内容.msgtype = 'm.file'
    }

    return 消息内容
  }

  /**
   * 处理消息事件 - 标准实现
   */
  private async 处理消息事件(event: any, roomId: string): Promise<MatrixMessage | null> {
    try {
      const eventType = event.getType()
      // 如果事件已被撤回，直接忽略
      if (typeof event.isRedacted === 'function' && event.isRedacted()) {
        return null
      }
      // 撤回事件本身不当作一条消息展示
      if (eventType === 'm.room.redaction') {
        return null
      }
      let content: any
      let isEncrypted = false

      // 处理加密消息
      if (eventType === 'm.room.encrypted') {
        isEncrypted = true
        try {
          // 尝试获取解密后的内容
          await this.尝试解密事件(event)
          content = event.getClearContent() || event.getContent()
        } catch (error) {
          console.warn(`[V2] 解密事件 ${event.getId()} 失败:`, error)
          content = { body: '[无法解密的消息]', msgtype: 'm.text' }
        }
      } else {
        content = event.getContent()
      }

      // 读取组合消息元数据（如存在）
      const bundleId: string | undefined = content?.['com.yanjing.bundle_id']
      const bundleIndex: number | undefined = content?.['com.yanjing.bundle_index']
      const bundleTotal: number | undefined = content?.['com.yanjing.bundle_total']

      // 构建标准化消息对象
      const displayName = await this.获取用户显示名称(event.getSender())
      const message: MatrixMessage = {
        eventId: event.getId(),
        sender: event.getSender(),
        displayName: displayName,
        content: content.body || '[无内容]',
        roomId: roomId,
        timestamp: event.getTs(),
        encrypted: isEncrypted,
        messageType: this.获取消息类型(content),
        messageInfo: this.解析消息信息(event, content),
        formattedBody: content.formatted_body || '',
        format: content.format || '',
        bundleId,
        bundleIndex,
        bundleTotal,
        isSystemEvent: false,
        eventType: eventType
      }

      return message

    } catch (error) {
      console.warn(`[V2] 处理消息事件失败:`, error)
      return null
    }
  }

  /**
   * 构建系统事件对应的时间线消息
   */
  private 构建系统事件消息(summary: RoomEventSummary, room: any): MatrixMessage {
    const displayName = summary.senderName || room?.getMember?.(summary.sender)?.name || summary.sender
    const roomId = room?.roomId || summary.metadata?.roomId || ''

    return {
      eventId: summary.eventId,
      sender: summary.sender,
      displayName,
      content: summary.description || '',
      roomId,
      timestamp: summary.timestamp,
      encrypted: false,
      messageType: 'm.system',
      formattedBody: '',
      format: '',
      isSystemEvent: true,
      eventType: summary.type,
      systemEvent: summary
    }
  }

  /**
   * 补充消息的显示名称等字段
   */
  private async 补充消息显示名称(message: MatrixMessage): Promise<MatrixMessage> {
    if (message.displayName && message.displayName.trim().length > 0) {
      return message
    }

    try {
      const displayName = await this.获取用户显示名称(message.sender)
      return {
        ...message,
        displayName: displayName || message.sender
      }
    } catch (error) {
      console.warn('[V2] 获取消息显示名称失败:', error)
      return {
        ...message,
        displayName: message.sender
      }
    }
  }

  /**
   * 尝试解密事件
   */
  private async 尝试解密事件(event: any): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) return

    try {
      await client.decryptEventIfNeeded(event)
    } catch (error) {
      // 如果解密失败，尝试请求密钥
      await this.请求缺失密钥(event)
      throw error
    }
  }

  /**
   * 请求缺失的密钥
   */
  private async 请求缺失密钥(event: any): Promise<void> {
    const client = matrixClientV2.getAuthedClient()
    if (!client) return

    try {
      const crypto = client.getCrypto()
      if (!crypto) return

      const content = event.getWireContent()
      if (!content?.session_id) return

      console.log(`[V2]  请求缺失密钥: 会话 ${content.session_id}`)

      // 这里可以实现密钥请求逻辑
      // 具体实现取决于SDK版本和API

    } catch (error) {
      console.warn('[V2] 请求缺失密钥失败:', error)
    }
  }

  /**
   * 获取消息类型
   */
  private 获取消息类型(content: any): MatrixMessage['messageType'] {
    const msgtype = content?.msgtype
    
    switch (msgtype) {
      case 'm.image': return 'm.image'
      case 'm.file': return 'm.file'
      case 'm.audio': return 'm.audio'
      case 'm.video': return 'm.video'
      default: return 'm.text'
    }
  }

  /**
   * 解析消息信息
   */
  private 解析消息信息(_event: any, content: any): MatrixMessage['messageInfo'] {
    const msgtype = content?.msgtype
    const messageInfo: any = {}
    const client = matrixClientV2.getAuthedClient()

    // 获取MXC URL（支持加密和非加密文件）
    const mxcUrl = content?.file?.url || content?.url

    if (!mxcUrl) return undefined

    // 根据消息类型解析信息
    switch (msgtype) {
      case 'm.image':
        if (content.info) {
          messageInfo.width = content.info.w
          messageInfo.height = content.info.h
          messageInfo.size = content.info.size
          messageInfo.mimetype = content.info.mimetype
        }
        break

      case 'm.file':
      case 'm.audio':
      case 'm.video':
        messageInfo.filename = content.body
        if (content.info) {
          messageInfo.size = content.info.size
          messageInfo.mimetype = content.info.mimetype
          if (content.info.duration) {
            messageInfo.duration = content.info.duration
          }
          if (content.info.w && content.info.h) {
            messageInfo.width = content.info.w
            messageInfo.height = content.info.h
          }
        }
        break
    }

    // 设置URL信息
    if (client) {
      try {
        const httpUrl = client.mxcUrlToHttp(mxcUrl, null, null, null, true)
        if (httpUrl) {
          // 与 element-web 对齐：不在 URL 上附加 access_token，统一使用 Authorization 头
          messageInfo.url = httpUrl
        } else {
          console.warn('[V2] 无法将MXC URL转换为HTTP URL:', mxcUrl)
        }
      } catch (error) {
        console.warn('[V2] 处理媒体URL时发生错误:', error)
      }

      messageInfo.mxcUrl = mxcUrl
    }

    // 处理加密文件的解密信息
    if (content.file && content.file.key) {
      messageInfo.encryptionInfo = content.file
    }

    return Object.keys(messageInfo).length > 0 ? messageInfo : undefined
  }

  // 已弃用：不再向 URL 附加访问令牌，统一使用 Authorization 头
  // private 附加访问令牌(url: string): string { return url }

  /**
   * 处理发送错误
   */
  private 处理发送错误(error: any): Error {
    const errorMessage = error.message || error.toString()
    
    if (errorMessage.includes('M_FORBIDDEN')) {
      return new Error('没有权限发送消息到此房间，可能需要管理员邀请或房间是私有的')
    } else if (errorMessage.includes('M_LIMIT_EXCEEDED')) {
      return new Error('发送消息过于频繁，请稍后再试')
    } else if (errorMessage.includes('encryption') || errorMessage.includes('crypto')) {
      return new Error('加密消息发送失败，请检查加密设置')
    } else {
      return new Error(`发送消息失败: ${errorMessage}`)
    }
  }

  /**
   * 获取用户显示名称
   */
  private async 获取用户显示名称(userId: string): Promise<string | undefined> {
    try {
      const client = matrixClientV2.getAuthedClient()
      if (!client) return undefined

      const matrixDisplayName = client.getUser(userId)?.displayName
      return resolveUserDisplayName({ matrixId: userId, matrixDisplayName })
    } catch (error) {
      console.warn(`[V2] 获取用户 ${userId} 显示名称失败:`, error)
      return resolveUserDisplayName({ matrixId: userId })
    }
  }

  /**
   * 获取图片尺寸
   */
  private 获取图片尺寸(文件: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(文件)
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
        URL.revokeObjectURL(objectUrl)
      }
      
      img.onerror = (err) => {
        reject(err)
        URL.revokeObjectURL(objectUrl)
      }
      
      img.src = objectUrl
    })
  }

  /**
   * 获取视频元数据
   */
  private 获取视频元数据(文件: File): Promise<{ width: number; height: number; duration: number }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      const objectUrl = URL.createObjectURL(文件)
      
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Math.round(video.duration * 1000)
        })
        URL.revokeObjectURL(objectUrl)
      }
      
      video.onerror = (err) => {
        reject(err)
        URL.revokeObjectURL(objectUrl)
      }
      
      video.src = objectUrl
    })
  }

  /**
   * 获取音频元数据
   */
  private 获取音频元数据(文件: File): Promise<{ duration: number }> {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio')
      audio.preload = 'metadata'
      const objectUrl = URL.createObjectURL(文件)
      
      audio.onloadedmetadata = () => {
        resolve({
          duration: Math.round(audio.duration * 1000)
        })
        URL.revokeObjectURL(objectUrl)
      }
      
      audio.onerror = (err) => {
        reject(err)
        URL.revokeObjectURL(objectUrl)
      }
      
      audio.src = objectUrl
    })
  }
}

// 导出消息服务V2实例
export const messageServiceV2 = new 消息服务类_V2()
export const 消息服务V2 = messageServiceV2
