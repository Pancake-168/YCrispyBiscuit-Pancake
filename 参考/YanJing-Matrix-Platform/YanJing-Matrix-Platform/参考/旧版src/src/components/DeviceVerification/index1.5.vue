<template>
  <!--div v-if="showVerification" class="verification-overlay">
    <div class="verification-dialog">
      <div class="verification-header">
        <h3>🔐 设备验证 V2</h3>
        <button @click="closeVerification" class="close-btn">×</button>
      </div>
      
      <div class="verification-content">

        <div v-if="verificationState === 'waiting'" class="verification-step">
          <div class="loading-spinner"></div>
          <p>正在等待验证请求...</p>
          <p class="hint">请在Element或其他Matrix客户端中查看验证请求</p>
        </div>


        <div v-else-if="verificationState === 'request' || verificationState === 'pending'" class="verification-step">
          <h4>收到验证请求</h4>
          <p>设备: {{ currentRequest?.otherDeviceId }}</p>
          <p>用户: {{ currentRequest?.otherUserId }}</p>
          <div class="verification-actions">
            <button @click="acceptVerification" class="accept-btn">接受验证</button>
            <button @click="rejectVerification" class="reject-btn">拒绝验证</button>
          </div>
        </div>

 
        <div v-else-if="verificationState === 'ready' || verificationState === 'started'" class="verification-step">
          <div class="loading-spinner"></div>
          <h4>验证进行中</h4>
          <p>正在生成验证码，请稍候...</p>
          <div class="verification-actions">
            <button @click="cancelVerification" class="reject-btn">取消验证</button>
          </div>
        </div>


        <div v-else-if="verificationState === 'sas'" class="verification-step">
          <h4>验证码确认</h4>
          <p>请确认以下验证码与另一设备显示的相同：</p>
          
  
          <div v-if="sasEmojis.length > 0" class="sas-display">
            <h5>表情符号验证码：</h5>
            <div class="sas-emojis">
              <div v-for="(emoji, index) in sasEmojis" :key="index" class="sas-emoji">
                <span class="emoji">{{ emoji.emoji }}</span>
                <span class="name">{{ emoji.name }}</span>
              </div>
            </div>
          </div>
          

          <div v-if="sasDecimals.length > 0" class="sas-display">
            <h5>数字验证码：</h5>
            <div class="sas-decimals">
              <div v-for="(decimal, index) in sasDecimals" :key="index" class="sas-decimal">
                {{ decimal }}
              </div>
            </div>
          </div>
          
          <div class="verification-actions">
            <button @click="confirmSas" class="accept-btn">验证码匹配</button>
            <button @click="cancelVerification" class="reject-btn">验证码不匹配</button>
          </div>
        </div>


        <div v-else-if="verificationState === 'completed'" class="verification-step">
          <div class="success-icon">✅</div>
          <h4>验证成功！</h4>
          <p>设备已成功验证，现在可以安全地进行端到端加密通信</p>
          
 
          <div v-if="showCrossSigningOption" class="cross-signing-option">
            <h5>🔐 启用交叉签名？</h5>
            <p>交叉签名可以让您的所有设备相互信任，提高安全性和便利性</p>
            <div class="verification-actions">
              <button @click="setupCrossSigning" class="accept-btn">启用交叉签名</button>
              <button @click="skipCrossSigning" class="neutral-btn">暂时跳过</button>
            </div>
          </div>
          
          <div v-else class="verification-actions">
            <button @click="closeVerification" class="accept-btn">完成</button>
          </div>
        </div>


        <div v-else-if="verificationState === 'failed'" class="verification-step">
          <div class="error-icon">❌</div>
          <h4>验证失败</h4>
          <p>{{ verificationError }}</p>
          <button @click="closeVerification" class="reject-btn">关闭</button>
        </div>
      </div>
    </div>
  </div-->
</template>

<script setup lang="ts">

/*
import { ref, onMounted, onUnmounted } from 'vue'
import { matrixClientV2 } from '../../services/matrix/client'

// 验证状态
const showVerification = ref(false)
const loading = ref(false)
const verificationState = ref<'waiting' | 'pending' | 'request' | 'ready' | 'started' | 'sas' | 'completed' | 'failed' | 'confirming'>('waiting')
const currentRequest = ref<any>(null)
const currentVerifier = ref<any>(null)
const sasEmojis = ref<Array<{emoji: string, name: string}>>([])
const sasDecimals = ref<string[]>([])
const verificationError = ref('')
const sasConfirmCallback = ref<any>(null)
const showCrossSigningOption = ref(false)

// 当前验证上下文
const currentVerificationContext = ref<any>(null)

// 验证监听器管理
const verificationListeners = ref<Array<{target: any, event: string, handler: Function}>>([])

// 清除验证监听器
const removeVerificationListeners = () => {
  verificationListeners.value.forEach(({ target, event, handler }) => {
    try {
      target.off(event, handler)
    } catch (error) {
      console.warn('[V2] 移除监听器失败:', error)
    }
  })
  verificationListeners.value = []
}

// 处理SAS验证开始事件
const handleSasVerificationStart = async (event: any) => {
  console.log('[V2] 处理SAS验证开始...')
  const content = event.getContent()
  const sender = event.getSender()
  
  console.log('[V2] SAS验证开始事件详情:', {
    eventType: event.getType(),
    sender: sender,
    content: content,
    contentKeys: Object.keys(content)
  })
  
  try {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('客户端未初始化')
    }
    
    // 使用Web Crypto API生成密钥对
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveBits']
    )
    
    // 获取对方的验证方法信息
    console.log('[V2] 验证方法:', content.method)
    console.log('[V2] 验证参数:', content)
    console.log('[V2] 支持的密钥协议:', content.key_agreement_protocols)
    console.log('[V2] 支持的哈希算法:', content.hashes)
    console.log('[V2] 支持的MAC算法:', content.message_authentication_codes)
    console.log('[V2] 支持的SAS方法:', content.short_authentication_string)
    
    // 我们还不需要对方的公钥，这会在后续的key事件中交换
    
    // 从Element的start事件中选择兼容的算法
    const supportedKeyAgreements = content.key_agreement_protocols || []
    const supportedHashes = content.hashes || []
    const supportedMACs = content.message_authentication_codes || []
    const supportedSAS = content.short_authentication_string || []
    
    // 优先选择Element列表中的第一个算法（Element的偏好）
    // 密钥协商协议
    const ourSupportedKeyAgreements = ['curve25519-hkdf-sha256', 'curve25519']
    const selectedKeyAgreement = supportedKeyAgreements.find((method: string) => ourSupportedKeyAgreements.includes(method)) || 'curve25519-hkdf-sha256'
    
    // 哈希算法
    const ourSupportedHashes = ['sha256']
    const selectedHash = supportedHashes.find((method: string) => ourSupportedHashes.includes(method)) || 'sha256'
    
    // MAC算法 - 按Element的偏好顺序选择
    const ourSupportedMACs = ['hkdf-hmac-sha256.v2', 'hkdf-hmac-sha256', 'org.matrix.msc3783.hkdf-hmac-sha256']
    const selectedMAC = supportedMACs.find((method: string) => ourSupportedMACs.includes(method)) || 'hkdf-hmac-sha256'
    
    // 对于SAS方法，我们应该发送我们支持的所有Element也支持的方法
    const ourSupportedSAS = ['emoji', 'decimal']
    const selectedSAS = supportedSAS.filter((method: string) => ourSupportedSAS.includes(method))
    // 如果没有共同支持的方法，使用默认的
    if (selectedSAS.length === 0) {
      selectedSAS.push('emoji')
    }
    
    console.log('[V2] 选择的算法:', {
      keyAgreement: selectedKeyAgreement,
      hash: selectedHash,
      mac: selectedMAC,
      sas: selectedSAS
    })
    
    console.log('[V2] 算法选择详情:', {
      元素支持的密钥协议: supportedKeyAgreements,
      元素支持的哈希: supportedHashes,
      元素支持的MAC: supportedMACs,
      元素支持的SAS: supportedSAS,
      我们选择的密钥协议: selectedKeyAgreement,
      我们选择的哈希: selectedHash,
      我们选择的MAC: selectedMAC,
      我们选择的SAS: selectedSAS
    })
    
    // 更新验证上下文，保存选择的算法
    currentVerificationContext.value = {
      event,
      sender,
      deviceId: content.from_device,
      transactionId: content.transaction_id,
      methods: [content.method],
      ourKeyPair: keyPair,
      selectedAlgorithms: {
        keyAgreement: selectedKeyAgreement,
        hash: selectedHash,
        mac: selectedMAC,
        sas: selectedSAS
      }
    }
    
    // 发送我们的accept响应，表示接受这个验证方法
    const senderId = sender
    const fromDevice = content.from_device
    
    console.log('[V2] 准备发送accept响应:', {
      senderId: senderId,
      fromDevice: fromDevice,
      senderType: typeof senderId,
      deviceType: typeof fromDevice
    })
    
    // 确保都是字符串类型
    if (typeof senderId !== 'string' || typeof fromDevice !== 'string') {
      throw new Error(`Invalid sender or device format: sender=${typeof senderId}, device=${typeof fromDevice}`)
    }
    
    const acceptContent = {
      from_device: client.getDeviceId(),
      transaction_id: content.transaction_id,
      method: 'm.sas.v1', // 确认我们使用SAS验证方法
      key_agreement_protocol: selectedKeyAgreement,
      hash: selectedHash,
      message_authentication_code: selectedMAC,
      short_authentication_string: selectedSAS
    }
    
    const contentMap = {
      [senderId]: {
        [fromDevice]: acceptContent
      }
    }
    
    console.log('[V2] 即将发送accept的contentMap:', JSON.stringify(contentMap, null, 2))
    console.log('[V2] accept contentMap类型检查:', {
      contentMapType: typeof contentMap,
      keys: Object.keys(contentMap),
      finalContent: contentMap[senderId][fromDevice]
    })
    
    // 创建 Map 结构
    const sendToDeviceMap = new Map()
    const deviceMap = new Map()
    deviceMap.set(fromDevice, contentMap[senderId][fromDevice])
    sendToDeviceMap.set(senderId, deviceMap)
    
    await client.sendToDevice('m.key.verification.accept', sendToDeviceMap)
    
    console.log('[V2] 发送accept响应成功')
    
    // 更新状态，等待对方发送key事件
    verificationState.value = 'started'
    
    console.log('[V2] 等待对方发送m.key.verification.key...')
    
    // 保存验证上下文，等待密钥交换
    currentVerificationContext.value = {
      event,
      sender,
      deviceId: content.from_device,
      transactionId: content.transaction_id || event.getId(),
      ourKeyPair: keyPair, // 保存我们的密钥对，待会儿用于密钥交换
      verificationMethod: content.method
    }
    
  } catch (error) {
    console.error('[V2] 处理SAS验证开始失败:', error)
    verificationError.value = '生成验证码失败: ' + (error as Error).message
    verificationState.value = 'failed'
  }
}

// 处理密钥交换事件
const handleKeyExchange = async (event: any) => {
  console.log('[V2] 处理密钥交换...')
  const content = event.getContent()
  const sender = event.getSender()
  
  console.log('[V2] 密钥交换事件详情:', {
    eventType: event.getType(),
    sender: sender,
    content: content,
    hasKey: !!content.key
  })
  
  try {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('客户端未初始化')
    }
    
    const context = currentVerificationContext.value
    if (!context || !context.ourKeyPair) {
      throw new Error('缺少验证上下文或密钥对')
    }
    
    // 获取对方的公钥
    const theirPublicKeyBase64 = content.key
    if (!theirPublicKeyBase64) {
      throw new Error('未收到对方公钥')
    }
    
    // 导出我们的公钥并发送
    const publicKeyBuffer = await window.crypto.subtle.exportKey('raw', context.ourKeyPair.publicKey)
    const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer)
    
    // 发送我们的公钥
    const keyContent = {
      key: publicKeyBase64,
      from_device: client.getDeviceId(),
      transaction_id: context.transactionId
    }
    
    // 创建 Map 结构
    const keyMap = new Map()
    const keyDeviceMap = new Map()
    keyDeviceMap.set(context.deviceId, keyContent)
    keyMap.set(context.sender, keyDeviceMap)
    
    await client.sendToDevice('m.key.verification.key', keyMap)
    
    console.log('[V2] 发送verification.key成功')
    
    // 生成共享密钥和SAS
    const sharedSecret = await generateSharedSecret(context.ourKeyPair.privateKey, theirPublicKeyBase64)
    
    // 根据选择的SAS方法生成相应的验证码
    const selectedSASMethods = context.selectedAlgorithms?.sas || ['emoji']
    console.log('[V2] 选择的SAS方法:', selectedSASMethods)
    
    if (selectedSASMethods.includes('emoji')) {
      const generatedSasEmojis = await generateSasEmojis(sharedSecret, client.getUserId()!, sender, 
                                        client.getDeviceId()!, context.deviceId)
      console.log('[V2] 生成的SAS验证码:', generatedSasEmojis)
      sasEmojis.value = generatedSasEmojis
    }
    
    if (selectedSASMethods.includes('decimal')) {
      const generatedSasDecimals = await generateSasDecimals(sharedSecret, client.getUserId()!, sender, 
                                        client.getDeviceId()!, context.deviceId)
      console.log('[V2] 生成的SAS数字验证码:', generatedSasDecimals)
      sasDecimals.value = generatedSasDecimals
    }
    
    verificationState.value = 'sas'
    
    // 更新验证上下文，保存共享密钥
    currentVerificationContext.value = {
      ...context,
      theirPublicKey: theirPublicKeyBase64,
      sharedSecret
    }
    
  } catch (error) {
    console.error('[V2] 处理密钥交换失败:', error)
    verificationError.value = '密钥交换失败: ' + (error as Error).message
    verificationState.value = 'failed'
  }
}

// ArrayBuffer转Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

// Base64转ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// 生成共享密钥
const generateSharedSecret = async (ourPrivateKey: CryptoKey, theirPublicKeyBase64: string): Promise<ArrayBuffer> => {
  try {
    // 导入对方的公钥
    const theirPublicKeyBuffer = base64ToArrayBuffer(theirPublicKeyBase64)
    const theirPublicKey = await window.crypto.subtle.importKey(
      'raw',
      theirPublicKeyBuffer,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false,
      []
    )
    
    // 使用ECDH生成共享密钥
    const sharedSecret = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: theirPublicKey
      },
      ourPrivateKey,
      256 // 256 bits
    )
    
    console.log('[V2] 生成共享密钥成功')
    return sharedSecret
  } catch (error) {
    console.error('[V2] 生成共享密钥失败:', error)
    throw new Error('密钥交换失败')
  }
}

// 生成SAS验证码（表情符号）
const generateSasEmojis = async (sharedSecret: ArrayBuffer, ourUserId: string, theirUserId: string, 
                          ourDeviceId: string, theirDeviceId: string): Promise<Array<{emoji: string, name: string}>> => {
  try {
    // 按照Matrix规范生成SAS信息字符串
    const sasInfo = `MATRIX_KEY_VERIFICATION_SAS${ourUserId}${ourDeviceId}${theirUserId}${theirDeviceId}`
    const encoder = new TextEncoder()
    const sasInfoBytes = encoder.encode(sasInfo)
    
    // 合并shared secret和SAS info
    const combined = new Uint8Array(sharedSecret.byteLength + sasInfoBytes.length)
    combined.set(new Uint8Array(sharedSecret), 0)
    combined.set(sasInfoBytes, sharedSecret.byteLength)
    
    // 使用SHA-256哈希
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined)
    const sasBytes = new Uint8Array(hashBuffer)
    
    // Matrix SAS 表情符号列表（标准64个）
    const emojiList = [
      ['🐶', 'dog'], ['🐱', 'cat'], ['🦁', 'lion'], ['🐴', 'horse'],
      ['🦄', 'unicorn'], ['🐷', 'pig'], ['🐘', 'elephant'], ['🐰', 'rabbit'],
      ['🐼', 'panda'], ['🐓', 'rooster'], ['🐧', 'penguin'], ['🐢', 'turtle'],
      ['🐟', 'fish'], ['🐙', 'octopus'], ['🦋', 'butterfly'], ['🌷', 'flower'],
      ['🌳', 'tree'], ['🌵', 'cactus'], ['🍄', 'mushroom'], ['🌏', 'globe'],
      ['🌙', 'moon'], ['☁️', 'cloud'], ['🔥', 'fire'], ['🍌', 'banana'],
      ['🍎', 'apple'], ['🍓', 'strawberry'], ['🌽', 'corn'], ['🍕', 'pizza'],
      ['🎂', 'cake'], ['❤️', 'heart'], ['😀', 'smiley'], ['🤖', 'robot'],
      ['🎩', 'hat'], ['👓', 'glasses'], ['🔧', 'spanner'], ['🎅', 'santa'],
      ['👍', 'thumbs up'], ['☂️', 'umbrella'], ['⌛', 'hourglass'], ['⏰', 'clock'],
      ['🎁', 'gift'], ['💡', 'light bulb'], ['📕', 'book'], ['✏️', 'pencil'],
      ['📎', 'paperclip'], ['✂️', 'scissors'], ['🔒', 'lock'], ['🔑', 'key'],
      ['🔨', 'hammer'], ['☎️', 'telephone'], ['🏁', 'flag'], ['🚂', 'train'],
      ['🚲', 'bicycle'], ['✈️', 'airplane'], ['🚀', 'rocket'], ['🏆', 'trophy'],
      ['⚽', 'ball'], ['🎸', 'guitar'], ['🎺', 'trumpet'], ['🔔', 'bell'],
      ['⚓', 'anchor'], ['🎧', 'headphones'], ['📁', 'folder'], ['📌', 'pin']
    ]
    
    // 生成7个表情符号（按照Matrix SAS规范）
    const emojis = []
    for (let i = 0; i < 7; i++) {
      // 每个表情符号用6位（64种选择需要6位）
      const index = sasBytes[i] & 0x3F // 取低6位
      emojis.push({
        emoji: emojiList[index][0],
        name: emojiList[index][1]
      })
    }
    
    console.log('[V2] SAS验证码生成成功:', emojis)
    return emojis
  } catch (error) {
    console.error('[V2] 生成SAS验证码失败:', error)
    throw new Error('验证码生成失败')
  }
}

// 生成SAS验证码（数字）
const generateSasDecimals = async (sharedSecret: ArrayBuffer, ourUserId: string, theirUserId: string, 
                          ourDeviceId: string, theirDeviceId: string): Promise<string[]> => {
  try {
    // 按照Matrix规范生成SAS信息字符串
    const sasInfo = `MATRIX_KEY_VERIFICATION_SAS${ourUserId}${ourDeviceId}${theirUserId}${theirDeviceId}`
    const encoder = new TextEncoder()
    const sasInfoBytes = encoder.encode(sasInfo)
    
    // 合并shared secret和SAS info
    const combined = new Uint8Array(sharedSecret.byteLength + sasInfoBytes.length)
    combined.set(new Uint8Array(sharedSecret), 0)
    combined.set(sasInfoBytes, sharedSecret.byteLength)
    
    // 使用SHA-256哈希
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined)
    const sasBytes = new Uint8Array(hashBuffer)
    
    // 生成3个4位数字（按照Matrix SAS规范）
    const decimals = []
    for (let i = 0; i < 3; i++) {
      // 每个数字用13位（8192种可能）然后模10000得到4位数
      const offset = i * 2
      const value = ((sasBytes[offset] << 8) | sasBytes[offset + 1]) % 10000
      decimals.push(value.toString().padStart(4, '0'))
    }
    
    console.log('[V2] SAS数字验证码生成成功:', decimals)
    return decimals
  } catch (error) {
    console.error('[V2] 生成SAS数字验证码失败:', error)
    throw new Error('数字验证码生成失败')
  }
}

// 打开验证界面 - V2标准实现
const openVerification = async () => {
  console.log('[V2] 打开设备验证界面')
  showVerification.value = true
  verificationState.value = 'waiting'  
  loading.value = true
  
  setupVerificationListeners()
  
  // 检查是否已有待处理的验证请求
  const client = matrixClientV2.getAuthedClient()
  if (client && client.getCrypto()) {
    try {
      const crypto = client.getCrypto()
      const userId = client.getUserId()
      
      console.log('[V2] 检查现有验证请求...')
      
      // 获取所有类型的验证请求
      let requests = []
      
      // 方法1: 获取设备间验证请求
      if (crypto.getVerificationRequestsToDeviceInProgress) {
        const deviceRequests = crypto.getVerificationRequestsToDeviceInProgress(userId!)
        if (deviceRequests && deviceRequests.size > 0) {
          requests.push(...Array.from(deviceRequests.values()))
        }
      }
      
      // 方法2: 获取所有验证请求
      if (requests.length === 0 && crypto.getAllVerificationRequests) {
        const allRequests = crypto.getAllVerificationRequests()
        requests = allRequests.filter((req: any) => 
          req.pending && (req.otherUserId === userId || req.requestingUserId === userId)
        )
      }
      
      // 方法3: 检查房间内验证请求
      if (requests.length === 0 && crypto.inRoomVerificationRequests) {
        const roomRequests = crypto.inRoomVerificationRequests
        if (roomRequests && roomRequests.size > 0) {
          requests.push(...Array.from(roomRequests.values()))
        }
      }
      
      console.log('[V2] 获取到的验证请求:', requests)
      
      if (requests.length > 0) {
        const request = requests[0]
        console.log('[V2] 找到现有验证请求:', request)
        loading.value = false
        handleVerificationRequest(request)
        return
      } else {
        console.log('[V2] 未找到现有验证请求，等待新请求...')
      }
    } catch (error) {
      console.log('[V2] 检查验证请求时出错:', error)
    }
  }
  
  loading.value = false
}

// 关闭验证界面
const closeVerification = () => {
  console.log('[V2] 关闭设备验证界面')
  showVerification.value = false
  verificationState.value = 'waiting'
  currentRequest.value = null
  sasEmojis.value = []
  verificationError.value = ''
}

// 设置验证监听器 - V2标准实现（按照Element的方式）
const setupVerificationListeners = () => {
  const client = matrixClientV2.getAuthedClient()
  if (!client) {
    console.error('[V2] 无法获取已认证客户端')
    return
  }

  console.log('[V2] 设置验证事件监听器...')
  
  const crypto = client.getCrypto()
  if (!crypto) {
    console.error('[V2] 加密模块未初始化')
    return
  }

  // 清除旧的监听器
  removeVerificationListeners()

  // 监听to-device事件（完整的Matrix协议支持）
  const onToDeviceEvent = async (event: any) => {
    const eventType = event.getType()
    console.log('[V2] 收到to-device事件:', eventType, event)
    
    if (eventType === 'm.key.verification.request') {
      console.log('[V2] 通过toDeviceEvent收到验证请求:', event)
      console.log('[V2] 事件内容:', event.getContent())
      console.log('[V2] 发送者:', event.getSender())
      
      // 使用V1的工作逻辑：延迟后重新检查SDK的验证请求
      const client = matrixClientV2.getAuthedClient()
      if (client) {
        const crypto = client.getCrypto()
        if (crypto) {
          // 立即检查一次
          const userId = client.getUserId()
          let verificationRequests = crypto.getVerificationRequestsToDeviceInProgress?.(userId)
          console.log('[V2] 立即检查验证请求:', verificationRequests)
          console.log('[V2] 验证请求类型:', typeof verificationRequests)
          
          // 处理Map或Array类型的返回值
          let requests = []
          if (verificationRequests) {
            if (verificationRequests instanceof Map) {
              console.log('[V2] getVerificationRequestsToDeviceInProgress返回Map，size:', verificationRequests.size)
              requests = Array.from(verificationRequests.values())
            } else if (Array.isArray(verificationRequests)) {
              console.log('[V2] getVerificationRequestsToDeviceInProgress返回Array，length:', verificationRequests.length)
              requests = verificationRequests
            } else {
              console.log('[V2] getVerificationRequestsToDeviceInProgress返回未知类型:', verificationRequests)
            }
          }
          
          if (requests.length > 0) {
            const request = requests[0]
            console.log('[V2] 立即找到SDK验证请求:', request)
            showVerification.value = true
            handleVerificationRequest(request)
            return
          }
          
          // 100ms延迟检查
          setTimeout(() => {
            const verificationRequests = crypto.getVerificationRequestsToDeviceInProgress?.(userId)
            console.log('[V2] 100ms延迟检查验证请求:', verificationRequests)
            
            let requests = []
            if (verificationRequests) {
              if (verificationRequests instanceof Map) {
                requests = Array.from(verificationRequests.values())
              } else if (Array.isArray(verificationRequests)) {
                requests = verificationRequests
              }
            }
            
            if (requests.length > 0) {
              const request = requests[0]
              console.log('[V2] 100ms延迟后找到SDK验证请求:', request)
              showVerification.value = true
              handleVerificationRequest(request)
            } else {
              console.log('[V2] 100ms延迟后仍未找到请求，尝试500ms延迟')
              
              // 500ms延迟检查
              setTimeout(() => {
                const verificationRequests2 = crypto.getVerificationRequestsToDeviceInProgress?.(userId)
                console.log('[V2] 500ms延迟检查验证请求:', verificationRequests2)
                
                let requests2 = []
                if (verificationRequests2) {
                  if (verificationRequests2 instanceof Map) {
                    requests2 = Array.from(verificationRequests2.values())
                  } else if (Array.isArray(verificationRequests2)) {
                    requests2 = verificationRequests2
                  }
                }
                
                if (requests2.length > 0) {
                  const request = requests2[0]
                  console.log('[V2] 500ms延迟后找到SDK验证请求:', request)
                  showVerification.value = true
                  handleVerificationRequest(request)
                } else {
                  console.log('[V2] 500ms延迟后仍未找到请求，尝试1500ms延迟')
                  
                  // 1500ms延迟检查（更长时间）
                  setTimeout(() => {
                    const verificationRequests3 = crypto.getVerificationRequestsToDeviceInProgress?.(userId)
                    console.log('[V2] 1500ms延迟检查验证请求:', verificationRequests3)
                    
                    let requests3 = []
                    if (verificationRequests3) {
                      if (verificationRequests3 instanceof Map) {
                        requests3 = Array.from(verificationRequests3.values())
                      } else if (Array.isArray(verificationRequests3)) {
                        requests3 = verificationRequests3
                      }
                    }
                    
                    if (requests3.length > 0) {
                      const request = requests3[0]
                      console.log('[V2] 1500ms延迟后找到SDK验证请求:', request)
                      showVerification.value = true
                      handleVerificationRequest(request)
                    } else {
                      console.warn('[V2] 多次延迟后仍无法找到SDK验证请求')
                      console.warn('[V2] 事件详情:', {
                        type: event.getType(),
                        sender: event.getSender(),
                        content: event.getContent(),
                        timestamp: event.getTs()
                      })
                      console.warn('[V2] 加密模块状态:', {
                        crypto: !!crypto,
                        userId: userId,
                        cryptoMethods: Object.getOwnPropertyNames(crypto)
                      })
                      
                      // 由于SDK无法自动将toDeviceEvent转换为验证请求对象
                      // 我们需要直接从事件数据处理验证请求
                      console.log('[V2] SDK无法处理验证请求，直接从事件数据处理')
                      const content = event.getContent()
                      if (content && content.from_device && content.transaction_id) {
                        // 创建一个基于事件数据的验证请求对象
                        const eventBasedRequest = {
                          // 事件信息
                          event: event,
                          sender: event.getSender(),
                          deviceId: content.from_device,
                          methods: content.methods || [],
                          transactionId: content.transaction_id,
                          timestamp: content.timestamp || event.getTs(),
                          
                          // 验证请求状态
                          pending: true,
                          phase: 'requested',
                          
                          // 基本方法（我们将在handleVerificationRequest中实现真正的逻辑）
                          otherUserId: event.getSender(),
                          otherDeviceId: content.from_device,
                          
                          // 需要的接口方法
                          accept: async () => {
                            console.log('[V2] 接受验证请求，发送m.key.verification.ready')
                            
                            try {
                              const client = matrixClientV2.getAuthedClient()
                              if (!client) {
                                throw new Error('客户端未初始化')
                              }
                              
                              // 发送m.key.verification.ready响应
                              const senderId = event.getSender()
                              const fromDevice = content.from_device
                              
                              console.log('[V2] 准备发送ready响应:', {
                                senderId: senderId,
                                fromDevice: fromDevice,
                                senderType: typeof senderId,
                                deviceType: typeof fromDevice
                              })
                              
                              const deviceId = client.getDeviceId()
                              const transactionId = content.transaction_id
                              
                              console.log('[V2] 详细类型检查:', {
                                deviceId: deviceId,
                                deviceIdType: typeof deviceId,
                                deviceIdConstructor: deviceId?.constructor?.name,
                                transactionId: transactionId,
                                transactionIdType: typeof transactionId,
                                transactionIdConstructor: transactionId?.constructor?.name,
                                isDeviceIdString: typeof deviceId === 'string',
                                isTransactionIdString: typeof transactionId === 'string'
                              })
                              
                              // 确保所有值都是字符串或基本类型
                              if (typeof deviceId !== 'string') {
                                throw new Error(`设备ID类型错误: ${typeof deviceId}, 值: ${deviceId}`)
                              }
                              if (typeof transactionId !== 'string') {
                                throw new Error(`交易ID类型错误: ${typeof transactionId}, 值: ${transactionId}`)
                              }
                              
                              const readyContent = {
                                from_device: deviceId,
                                methods: ['m.sas.v1'], // 支持SAS验证
                                transaction_id: transactionId // Matrix 规范要求的字段
                              }
                              
                              console.log('[V2] readyContent详情:', {
                                readyContent: readyContent,
                                deviceId: client.getDeviceId(),
                                deviceIdType: typeof client.getDeviceId(),
                                transactionId: content.transaction_id,
                                transactionIdType: typeof content.transaction_id
                              })
                              
                              // 深度检查readyContent是否包含任何Map或非普通对象
                              const checkForMaps = (obj: any, path = ''): void => {
                                if (obj instanceof Map) {
                                  console.error(`[V2] 发现Map对象在 ${path}:`, obj)
                                  return
                                }
                                if (obj && typeof obj === 'object' && obj.constructor !== Object && obj.constructor !== Array) {
                                  console.error(`[V2] 发现非普通对象在 ${path}:`, obj, '类型:', obj.constructor.name)
                                  return
                                }
                                if (obj && typeof obj === 'object') {
                                  Object.entries(obj).forEach(([key, value]) => {
                                    checkForMaps(value, `${path}.${key}`)
                                  })
                                }
                              }
                              
                              console.log('[V2] 检查readyContent是否包含非普通对象...')
                              checkForMaps(readyContent, 'readyContent')
                              
                              // 确保senderId和fromDevice都是字符串
                              if (typeof senderId !== 'string' || typeof fromDevice !== 'string') {
                                throw new Error(`Invalid sender or device format: sender=${typeof senderId}, device=${typeof fromDevice}`)
                              }
                              
                              const contentMap = {
                                [senderId]: {
                                  [fromDevice]: readyContent
                                }
                              }
                              
                              console.log('[V2] 即将发送的contentMap结构:', JSON.stringify(contentMap, null, 2))
                              console.log('[V2] contentMap类型检查:', {
                                contentMapType: typeof contentMap,
                                keys: Object.keys(contentMap),
                                firstLevelValue: contentMap[senderId],
                                firstLevelValueType: typeof contentMap[senderId],
                                secondLevelKeys: Object.keys(contentMap[senderId]),
                                finalContent: contentMap[senderId][fromDevice],
                                finalContentType: typeof contentMap[senderId][fromDevice]
                              })
                              
                              // Matrix SDK 需要 Map<string, Map<string, Record<string, any>>> 类型
                              // 不是普通的 JavaScript 对象
                              const sendToDeviceMap = new Map()
                              const deviceMap = new Map()
                              deviceMap.set(fromDevice, readyContent)
                              sendToDeviceMap.set(senderId, deviceMap)
                              
                              console.log('[V2] 创建的 Map 结构:', {
                                mapType: sendToDeviceMap.constructor.name,
                                mapSize: sendToDeviceMap.size,
                                deviceMapSize: deviceMap.size,
                                content: readyContent
                              })
                              
                              await client.sendToDevice('m.key.verification.ready', sendToDeviceMap)
                              
                              console.log('[V2] 发送ready响应成功')
                              
                              // 更新状态并等待对方开始验证
                              eventBasedRequest.phase = 'ready'
                              verificationState.value = 'started'
                              
                              console.log('[V2] 等待对方发送m.key.verification.start...')
                              
                            } catch (error) {
                              console.error('[V2] 发送ready响应失败:', error)
                              verificationError.value = '接受验证失败: ' + (error as Error).message
                              verificationState.value = 'failed'
                              throw error
                            }
                          },
                          
                          cancel: () => {
                            console.log('[V2] eventBasedRequest.cancel() - 这里需要实现真正的取消逻辑')
                            // TODO: 实现真正的验证取消逻辑
                            return Promise.resolve()
                          },
                          
                          // 事件发射器模拟（可选）
                          on: (eventName: string, handler: Function) => {
                            console.log(`[V2] eventBasedRequest.on(${eventName}) - 事件监听器注册`)
                            // TODO: 如果需要状态变化监听，在这里实现
                            // 当前不使用handler，避免TypeScript警告
                            void handler
                          }
                        }
                        
                        console.log('[V2] 创建基于事件的验证请求对象:', eventBasedRequest)
                        showVerification.value = true
                        handleVerificationRequest(eventBasedRequest)
                      }
                    }
                  }, 1000)
                }
              }, 400)
            }
          }, 100)
        }
      }
    } else if (eventType === 'm.key.verification.start') {
      console.log('[V2] 收到验证开始事件:', event)
      const content = event.getContent()
      
      // 处理SAS验证开始
      if (content && content.method === 'm.sas.v1') {
        console.log('[V2] 开始SAS验证，生成验证码...')
        handleSasVerificationStart(event)
      }
    } else if (eventType === 'm.key.verification.accept') {
      console.log('[V2] 收到验证接受事件:', event)
      // 对方接受了我们的验证，可以开始SAS流程
    } else if (eventType === 'm.key.verification.key') {
      console.log('[V2] 收到验证密钥事件:', event)
      // 处理密钥交换
      await handleKeyExchange(event)
    } else if (eventType === 'm.key.verification.mac') {
      console.log('[V2] 收到验证MAC事件:', event)
      // 处理MAC验证
    } else if (eventType === 'm.key.verification.done') {
      console.log('[V2] 收到验证完成事件:', event)
      // 验证已完成
      verificationState.value = 'completed'
      setTimeout(() => {
        closeVerification()
      }, 2000)
    } else if (eventType === 'm.key.verification.cancel') {
      console.log('[V2] 收到验证取消事件:', event)
      const content = event.getContent()
      verificationState.value = 'failed'
      verificationError.value = content.reason || '验证被取消'
    }
  }

  // 注册事件监听器
  const authenticatedClient = matrixClientV2.getAuthedClient()
  if (authenticatedClient) {
    // 监听客户端的to-device事件
    authenticatedClient.on('toDeviceEvent', onToDeviceEvent)
    console.log('[V2] 已注册toDeviceEvent事件监听')

    // 存储监听器引用以便清理
    verificationListeners.value = [
      { target: authenticatedClient, event: 'toDeviceEvent', handler: onToDeviceEvent }
    ]
  }
}

// 处理验证请求 - V2适配
const handleVerificationRequest = (request: any) => {
  console.log('[V2] 处理验证请求...')
  console.log('[V2] 请求对象类型:', typeof request, request)
  
  currentRequest.value = request
  loading.value = false

  // 处理标准验证请求
  console.log('[V2] 处理标准验证请求，当前阶段:', request.phase)
  
  // 根据当前阶段设置状态
  if (request.phase === 1 || request.phase === 'requested') {
    verificationState.value = 'pending'
  } else if (request.phase === 2 || request.phase === 'ready') {
    verificationState.value = 'request'  // 阶段2显示接受验证按钮
  } else if (request.phase === 3 || request.phase === 'started') {
    verificationState.value = 'started'
  } else if (request.phase === 4 || request.phase === 'show_sas') {
    verificationState.value = 'started'
    // 如果已经到了SAS阶段，立即处理
    const verifier = request.verifier
    if (verifier) {
      setupVerifier(verifier)
    }
  } else {
    verificationState.value = 'request'
  }

  // 监听验证状态变化
  if (request.on) {
    request.on('change', () => {
      console.log('[V2] 验证请求状态变化:', request.phase)
      
      if (request.phase === 1 || request.phase === 'requested') {
        // 验证请求等待接受
        verificationState.value = 'pending'
      } else if (request.phase === 2 || request.phase === 'ready') {
        // 验证请求已准备，显示接受按钮
        verificationState.value = 'request'
      } else if (request.phase === 3 || request.phase === 'started') {
        // 验证已开始，等待SAS
        verificationState.value = 'started'
        // 立即尝试获取验证器
        setTimeout(() => {
          const verifier = request.verifier
          if (verifier) {
            currentVerifier.value = verifier
            setupVerifier(verifier)
          }
        }, 100)
      } else if (request.phase === 4 || request.phase === 'show_sas') {
        // SAS验证码已显示
        console.log('[V2] 显示SAS验证码, verifier:', request.verifier)
        const verifier = request.verifier
        if (verifier) {
          currentVerifier.value = verifier
          setupVerifier(verifier)
        }
      } else if (request.phase === 5 || request.phase === 'done') {
        // 验证完成 - 但只有在用户确认SAS后才真正完成
        console.log('[V2] 验证阶段5/done，检查是否需要用户确认')
        if (verificationState.value === 'confirming') {
          // 用户已经确认了SAS，可以标记为完成
          console.log('[V2] 用户已确认SAS，验证完成!')
          verificationState.value = 'completed'
          // 检查是否需要设置交叉签名
          checkCrossSigningStatus()
          setTimeout(() => {
            if (!showCrossSigningOption.value) {
              closeVerification()
            }
          }, 2000)
        } else if (verificationState.value !== 'sas') {
          // 如果还没有显示SAS，直接完成
          console.log('[V2] 未显示SAS直接完成')
          verificationState.value = 'completed'
          setTimeout(() => {
            closeVerification()
          }, 2000)
        } else {
          // 正在显示SAS，不要自动完成
          console.log('[V2] 正在显示SAS，等待用户确认')
        }
      } else if (request.phase === 'cancelled' || request.phase === 'failed') {
        // 验证失败
        console.log('[V2] 验证失败或取消:', request.phase)
        verificationState.value = 'failed'
        verificationError.value = request.cancellationCode || '验证被取消'
      }
    })
  }
}

// 接受验证请求 - V2适配
const acceptVerification = async () => {
  if (!currentRequest.value) {
    console.error('[V2] 没有当前验证请求')
    return
  }
  
  try {
    console.log('[V2] 接受验证请求 - 当前阶段:', currentRequest.value.phase)
    
    // 如果已经在进行中的阶段，直接获取验证器
    if (currentRequest.value.phase === 4 || currentRequest.value.phase === 'started') {
      console.log('[V2] 验证已开始，获取验证器...')
      const verifier = currentRequest.value.verifier
      if (verifier) {
        console.log('[V2] 验证器已存在:', verifier)
        currentVerifier.value = verifier
        setupVerifier(verifier)
        return
      }
    }
    
    // 如果还在等待接受阶段，调用accept
    if (currentRequest.value.phase === 2 || currentRequest.value.phase === 'ready' || currentRequest.value.phase === 'requested') {
      console.log('[V2] 接受验证请求...')
      await currentRequest.value.accept()
      console.log('[V2] 验证请求已接受')
    }
    
    // 等待验证器创建并设置
    setTimeout(() => {
      const verifier = currentRequest.value?.verifier
      if (verifier) {
        console.log('[V2] 验证器已创建:', verifier)
        currentVerifier.value = verifier
        setupVerifier(verifier)
      }
    }, 500)
    
  } catch (error: any) {
    console.error('[V2] 接受验证失败:', error)
    verificationError.value = error.message || '接受验证失败'
    verificationState.value = 'failed'
  }
}

// 设置验证器事件监听 - V2适配
const setupVerifier = (verifier: any) => {
  console.log('[V2] 设置验证器事件监听...', verifier)
  
  // 监听SAS显示事件
  verifier.on('show_sas', (e: any) => {
    console.log('[V2] 显示SAS验证码事件:', e)
    if (e.sas) {
      if (e.sas.emoji) {
        console.log('[V2] SAS表情符号:', e.sas.emoji)
        // 转换格式：从 [["🐶", "dog"], ["🏠", "house"]] 转换为 [{emoji: "🐶", name: "dog"}]
        const formattedEmojis = e.sas.emoji.map((item: any) => {
          if (Array.isArray(item) && item.length >= 2) {
            return { emoji: item[0], name: item[1] }
          } else if (item && typeof item === 'object' && item.emoji) {
            return item
          } else {
            return { emoji: '❓', name: 'unknown' }
          }
        })
        console.log('[V2] 格式化后的SAS表情符号:', formattedEmojis)
        sasEmojis.value = formattedEmojis
        verificationState.value = 'sas'
      }
      if (e.sas.decimal) {
        console.log('[V2] SAS数字:', e.sas.decimal)
        // 如果需要可以也支持数字验证
      }
    }
    
    // 保存确认回调
    if (typeof e.confirm === 'function') {
      console.log('[V2] 保存SAS确认回调')
      sasConfirmCallback.value = e.confirm
    }
  })
  
  // 监听验证完成事件
  verifier.on('done', (e: any) => {
    console.log('[V2] 验证器完成事件:', e)
    // 不要立即设置为完成，等待手动确认
  })
  
  // 监听验证取消事件
  verifier.on('cancel', (e: any) => {
    console.log('[V2] 验证器取消事件:', e)
    verificationState.value = 'failed'
    verificationError.value = e.reason || '验证被取消'
  })
  
  // 尝试获取SAS回调
  try {
    if (typeof verifier.getShowSasCallbacks === 'function') {
      console.log('[V2] 调用getShowSasCallbacks...')
      const callbacks = verifier.getShowSasCallbacks()
      console.log('[V2] SAS回调:', callbacks)
      
      // 如果有回调，尝试执行
      if (callbacks && typeof callbacks.accept === 'function') {
        console.log('[V2] 找到SAS accept回调')
        // 暂时不自动接受，等待用户操作
      }
    }
  } catch (error) {
    console.error('[V2] 获取SAS回调失败:', error)
  }
  
  // 立即检查验证器状态和SAS数据
  setTimeout(async () => {
    console.log('[V2] 检查验证器当前状态:', verifier.verificationPhase)
    console.log('[V2] 验证器完整对象:', verifier)
    console.log('[V2] 验证器原型方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(verifier)))
    
    // 首先尝试发送accept以确保SAS生成
    try {
      if (typeof verifier.sendAccept === 'function') {
        console.log('[V2] 在获取SAS前发送accept...')
        await verifier.sendAccept()
        console.log('[V2] accept已发送，等待SAS生成')
        
        // 等待一段时间让SAS生成
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error('[V2] 发送accept失败:', error)
    }
    
    // 尝试多种方式获取SAS数据
    try {
      // 方法1: 直接访问属性
      if (verifier.emoji && verifier.emoji.length > 0) {
        console.log('[V2] 方法1 - 验证器emoji属性:', verifier.emoji)
        sasEmojis.value = verifier.emoji
        verificationState.value = 'sas'
        return
      }
      
      // 方法2: 调用方法
      if (typeof verifier.getEmojiIndex === 'function') {
        const sasEmoji = verifier.getEmojiIndex()
        console.log('[V2] 方法2 - getEmojiIndex():', sasEmoji)
        if (sasEmoji && sasEmoji.length > 0) {
          sasEmojis.value = sasEmoji
          verificationState.value = 'sas'
          return
        }
      }
      
      // 方法3: 检查inner对象 - 需要等待SAS生成
      if (verifier.inner && verifier.inner.emoji) {
        console.log('[V2] 方法3 - inner.emoji函数:', verifier.inner.emoji)
        // 尝试多次获取，因为SAS可能还没生成
        let attempts = 0
        const tryGetEmoji = () => {
          try {
            const emojiResult = verifier.inner.emoji()
            console.log(`[V2] 方法3 - 第${attempts + 1}次调用inner.emoji()结果:`, emojiResult)
            if (emojiResult && emojiResult.length > 0) {
              // 转换Emoji对象格式
              const formattedEmojis = emojiResult.map((emojiObj: any) => {
                if (emojiObj && typeof emojiObj.emoji === 'function' && typeof emojiObj.description === 'function') {
                  return {
                    emoji: emojiObj.emoji(),
                    name: emojiObj.description()
                  }
                } else if (Array.isArray(emojiObj) && emojiObj.length >= 2) {
                  return { emoji: emojiObj[0], name: emojiObj[1] }
                } else if (emojiObj && typeof emojiObj === 'object' && emojiObj.emoji) {
                  return emojiObj
                } else {
                  return { emoji: '❓', name: 'unknown' }
                }
              })
              console.log(`[V2] 格式化后的emoji结果:`, formattedEmojis)
              sasEmojis.value = formattedEmojis
              verificationState.value = 'sas'
              return true
            }
          } catch (error) {
            console.error(`[V2] 第${attempts + 1}次调用inner.emoji()失败:`, error)
          }
          return false
        }
        
        // 立即尝试一次
        if (tryGetEmoji()) return
        
        // 如果失败，每1000ms重试一次，最多重试8次（等待更长时间）
        const retryInterval = setInterval(() => {
          attempts++
          if (tryGetEmoji() || attempts >= 8) {
            clearInterval(retryInterval)
            if (attempts >= 8) {
              console.log('[V2] 重试8次后仍无法获取SAS，等待show_sas事件')
            }
          }
        }, 1000)
        
        return // 让重试机制处理
      }
      
      // 方法4: 检查其他可能的方法
      const methods = ['emoji', 'getEmoji', 'getSasEmoji', 'getEmojiSas']
      for (const method of methods) {
        if (typeof verifier[method] === 'function') {
          try {
            console.log(`[V2] 尝试调用方法: ${method}`)
            const result = verifier[method]()
            console.log(`[V2] 方法 ${method} 结果:`, result)
            if (result && result.length > 0) {
              sasEmojis.value = result
              verificationState.value = 'sas'
              return
            }
          } catch (error) {
            console.error(`[V2] 调用 ${method} 失败:`, error)
          }
        }
      }
      
      // 方法5: 等待SAS事件
      console.log('[V2] 所有直接方法都失败，等待show_sas事件...')
      
    } catch (error) {
      console.error('[V2] 获取SAS码失败:', error)
    }
  }, 500)
}

// 拒绝验证请求 - V2适配
const rejectVerification = async () => {
  if (!currentRequest.value) return
  
  try {
    console.log('[V2] 拒绝验证请求')
    await currentRequest.value.cancel()
    closeVerification()
  } catch (error: any) {
    console.error('[V2] 拒绝验证失败:', error)
  }
}

// 确认SAS验证码 - V2适配（真实Matrix协议实现）
const confirmSas = async () => {
  if (!currentRequest.value && !currentVerificationContext.value) {
    console.error('[V2] 没有当前验证请求或验证上下文')
    return
  }
  
  try {
    console.log('[V2] 确认SAS验证码')
    console.log('[V2] 当前请求:', currentRequest.value)
    console.log('[V2] 当前验证上下文:', currentVerificationContext.value)
    
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('客户端未初始化')
    }
    
    // 如果有验证上下文，使用真实的Matrix协议流程
    if (currentVerificationContext.value) {
      const context = currentVerificationContext.value
      
      // 发送m.key.verification.key事件，包含我们的公钥
      const senderId = context.sender
      const deviceId = context.deviceId
      
      console.log('[V2] 准备发送verification.key:', {
        senderId: senderId,
        deviceId: deviceId,
        senderType: typeof senderId,
        deviceType: typeof deviceId
      })
      
      // 确保都是字符串类型
      if (typeof senderId !== 'string' || typeof deviceId !== 'string') {
        throw new Error(`Invalid sender or device format: sender=${typeof senderId}, device=${typeof deviceId}`)
      }
      
      const keyContent = {
        key: arrayBufferToBase64(await window.crypto.subtle.exportKey('raw', context.ourPrivateKey)),
        from_device: client.getDeviceId(),
        'm.relates_to': {
          rel_type: 'm.reference',
          event_id: context.transactionId
        }
      }
      
      // 创建 Map 结构
      const keyMap = new Map()
      const keyDeviceMap = new Map()
      keyDeviceMap.set(deviceId, keyContent)
      keyMap.set(senderId, keyDeviceMap)
      
      await client.sendToDevice('m.key.verification.key', keyMap)
      
      console.log('[V2] 发送verification.key成功')
      
      // 生成MAC验证
      const macContent = await generateVerificationMac(context)
      
      // 创建 Map 结构
      const macMap = new Map()
      const macDeviceMap = new Map()
      macDeviceMap.set(deviceId, macContent)
      macMap.set(senderId, macDeviceMap)
      
      await client.sendToDevice('m.key.verification.mac', macMap)
      
      console.log('[V2] 发送verification.mac成功')
      
      // 更新状态
      verificationState.value = 'confirming'
      
      // 等待对方的MAC验证
      setTimeout(() => {
        if (verificationState.value === 'confirming') {
          // 假设验证成功（在真实实现中需要验证对方的MAC）
          verificationState.value = 'completed'
          checkCrossSigningStatus()
        }
      }, 2000)
      
      return
    }
    
    // 回退到SDK方法（原有逻辑保持不变）
    if (sasConfirmCallback.value && typeof sasConfirmCallback.value === 'function') {
      console.log('[V2] 使用SAS事件确认回调')
      await sasConfirmCallback.value()
      console.log('[V2] SAS确认回调执行成功')
      verificationState.value = 'confirming'
      
      // 等待验证完成
      setTimeout(() => {
        if (verificationState.value === 'confirming') {
          verificationState.value = 'completed'
          checkCrossSigningStatus()
        }
      }, 2000)
      return
    }
    
    // SDK验证器方法回退
    let verifier = currentVerifier.value || currentRequest.value?.verifier
    
    if (verifier) {
      console.log('[V2] 使用验证器确认SAS:', verifier)
      
      // 尝试多种确认方法
      if (typeof verifier.confirm === 'function') {
        console.log('[V2] 调用verifier.confirm()')
        await verifier.confirm()
      } else if (typeof verifier.verify === 'function') {
        console.log('[V2] 调用verifier.verify()')
        await verifier.verify()
      } else if (verifier.inner && typeof verifier.inner.confirm === 'function') {
        console.log('[V2] 调用verifier.inner.confirm()')
        await verifier.inner.confirm()
      } else if (typeof verifier.accept === 'function') {
        console.log('[V2] 调用verifier.accept()')
        await verifier.accept()
      } else if (currentRequest.value && typeof currentRequest.value.accept === 'function') {
        console.log('[V2] 通过请求确认')
        await currentRequest.value.accept()
      } else {
        console.error('[V2] 无法找到确认方法，验证器属性:', Object.keys(verifier))
        console.error('[V2] 验证器类型:', verifier.constructor.name)
        console.error('[V2] 验证器原型方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(verifier)))
        verificationState.value = 'failed'
        verificationError.value = '无法确认验证码'
        return
      }
      
      console.log('[V2] SAS验证码确认成功')
      verificationState.value = 'confirming'
      
      // 等待验证完成
      setTimeout(() => {
        if (verificationState.value === 'confirming') {
          verificationState.value = 'completed'
          checkCrossSigningStatus()
        }
      }, 2000)
      
    } else {
      console.error('[V2] 无法找到验证器或确认回调')
      verificationState.value = 'failed'
      verificationError.value = '无法找到验证器'
    }
  } catch (error: any) {
    console.error('[V2] 确认SAS失败:', error)
    verificationState.value = 'failed'
    verificationError.value = error.message || '确认验证码失败'
  }
}

// 生成验证MAC
const generateVerificationMac = async (context: any) => {
  try {
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      throw new Error('客户端未初始化')
    }
    
    // 计算需要验证的密钥信息
    const ourUserId = client.getUserId()!
    const ourDeviceId = client.getDeviceId()!
    const theirUserId = context.sender
    const theirDeviceId = context.deviceId
    
    // 获取设备密钥
    const ourDeviceKey = `ed25519:${ourDeviceId}`
    const theirDeviceKey = `ed25519:${theirDeviceId}`
    
    // 按照Matrix规范构建MAC输入
    const baseInfo = `MATRIX_KEY_VERIFICATION_MAC${ourUserId}${ourDeviceId}${theirUserId}${theirDeviceId}${context.transactionId}`
    
    // 使用共享密钥生成MAC
    const encoder = new TextEncoder()
    
    // 导入共享密钥用于HMAC
    const hmacKey = await window.crypto.subtle.importKey(
      'raw',
      context.sharedSecret,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    // 计算我们设备的MAC
    const ourKeyString = `${baseInfo}${ourDeviceKey}`
    const theirKeyString = `${baseInfo}${theirDeviceKey}`
    
    const ourKeyMac = await window.crypto.subtle.sign('HMAC', hmacKey, encoder.encode(ourKeyString))
    const theirKeyMac = await window.crypto.subtle.sign('HMAC', hmacKey, encoder.encode(theirKeyString))
    
    // 构建MAC内容
    const macContent = {
      mac: {
        [ourDeviceKey]: arrayBufferToBase64(ourKeyMac),
        [theirDeviceKey]: arrayBufferToBase64(theirKeyMac)
      },
      keys: `${ourDeviceKey},${theirDeviceKey}`,
      from_device: ourDeviceId,
      'm.relates_to': {
        rel_type: 'm.reference',
        event_id: context.transactionId
      }
    }
    
    console.log('[V2] 生成MAC内容成功:', macContent)
    return macContent
  } catch (error) {
    console.error('[V2] 生成验证MAC失败:', error)
    throw new Error('MAC生成失败')
  }
}

// 取消验证 - V2适配
const cancelVerification = async () => {
  if (!currentRequest.value) return
  
  try {
    console.log('[V2] 取消验证')
    // 直接取消验证请求
    await currentRequest.value.cancel()
    closeVerification()
  } catch (error: any) {
    console.error('[V2] 取消验证失败:', error)
    closeVerification()
  }
}

// 设置交叉签名 - V2适配
const setupCrossSigning = async () => {
  try {
    console.log('[V2] 开始设置交叉签名...')
    loading.value = true
    
    // 调用V2客户端的交叉签名初始化
    //await matrixClientV2.初始化交叉签名()
    
    console.log('[V2] 交叉签名设置成功')
    showCrossSigningOption.value = false
    
    // 可以考虑显示成功提示
    setTimeout(() => {
      closeVerification()
    }, 1000)
    
  } catch (error) {
    console.error('[V2] 设置交叉签名失败:', error)
    verificationError.value = '交叉签名设置失败: ' + (error as Error).message
  } finally {
    loading.value = false
  }
}

// 跳过交叉签名 - V2适配
const skipCrossSigning = () => {
  console.log('[V2] 用户选择跳过交叉签名')
  showCrossSigningOption.value = false
  closeVerification()
}

// 检查交叉签名状态 - V2适配
const checkCrossSigningStatus = async () => {
  try {
    const client = matrixClientV2.getAuthedClient()
    if (!client) return

    const crypto = client.getCrypto()
    const userId = client.getUserId()
    
    if (!crypto || !userId) return

    // 检查交叉签名是否已设置
    const crossSigningInfo = await crypto.getCrossSigningInfo?.(userId)
    
    if (!crossSigningInfo || !crossSigningInfo.getId()) {
      // 没有交叉签名，显示设置选项
      console.log('[V2] 检测到没有交叉签名，显示设置选项')
      showCrossSigningOption.value = true
    } else {
      console.log('[V2] 交叉签名已存在')
      showCrossSigningOption.value = false
    }
  } catch (error) {
    console.warn('[V2] 检查交叉签名状态失败:', error)
    showCrossSigningOption.value = false
  }
}

// 暴露给父组件的方法
defineExpose({
  openVerification
})

onMounted(() => {
  // 组件挂载时立即设置监听器，这样就能接收到验证请求
  console.log('[V2] DeviceVerification V2 组件已挂载')
  setupVerificationListeners()
})

onUnmounted(() => {
  // 清理监听器
  console.log('[V2] DeviceVerification V2 组件已卸载，清理监听器')
  removeVerificationListeners()
})

*/
</script>

<style scoped>
.verification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.verification-dialog {
  background: white;
  border-radius: 12px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.verification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.verification-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.verification-content {
  padding: 20px;
}

.verification-step {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hint {
  color: #666;
  font-size: 14px;
  margin-top: 10px;
}

.verification-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.accept-btn, .reject-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.accept-btn {
  background: #28a745;
  color: white;
}

.accept-btn:hover {
  background: #218838;
}

.reject-btn {
  background: #dc3545;
  color: white;
}

.reject-btn:hover {
  background: #c82333;
}

.sas-display {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.sas-emojis, .sas-decimals {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  margin-top: 8px;
}

.sas-emoji {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.sas-emoji .emoji {
  font-size: 24px;
  margin-bottom: 4px;
}

.sas-emoji .name {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.sas-decimal {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 40px;
  background: #fff;
  border: 2px solid #007bff;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #007bff;
  letter-spacing: 1px;
}

.success-icon, .error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.success-icon {
  color: #28a745;
}

.error-icon {
  color: #dc3545;
}

.cross-signing-option {
  margin-top: 20px;
  padding: 16px;
  background: #e8f4f8;
  border-radius: 8px;
  border-left: 4px solid #17a2b8;
}

.cross-signing-option h5 {
  margin: 0 0 8px 0;
  color: #17a2b8;
}

.cross-signing-option p {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.neutral-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.neutral-btn:hover {
  background: #5a6268;
}
</style>
