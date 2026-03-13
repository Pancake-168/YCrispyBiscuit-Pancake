<template>
  <!--div class="device-manager-container">
    <div class="device-manager">
      <header class="dm-header">
        <h1>设备管理 V2</h1>
        <p>管理您的Matrix设备，确保账户安全（V2标准版本）</p>
      </header>

   
      <section class="dm-section">
        <div class="dm-section-header">
          <h2>安全概览</h2>
        </div>
        <div class="overview-grid">
          <div class="stat-item">
            <span class="stat-number">{{ securityStats.total }}</span>
            <span class="stat-label">设备总数</span>
          </div>
          <div class="stat-item">
            <span class="stat-number text-success">{{ securityStats.verified }}</span>
            <span class="stat-label">已验证</span>
          </div>
          <div class="stat-item">
            <span class="stat-number text-warning">{{ securityStats.unverified }}</span>
            <span class="stat-label">未验证</span>
          </div>
          <div class="stat-item">
            <span class="stat-number text-danger">{{ securityStats.blocked }}</span>
            <span class="stat-label">已阻止</span>
          </div>
        </div>
        <div class="dm-separator"></div>
        <div class="cross-signing-status">
          <div class="status-text">
            <span class="status-label">交叉签名</span>
            <span class="status-indicator" :class="crossSigningStatus.class">
              {{ crossSigningStatus.text }}
            </span>
          </div>
          <button
            v-if="!crossSigningStatus.enabled"
            @click="setupCrossSigning"
            class="btn btn-primary"
            :disabled="loading"
          >
            启用交叉签名
          </button>
        </div>
      </section>

 
      <section class="dm-section">
        <div class="dm-section-header">
          <h2>设备列表</h2>
          <button @click="refreshDevices" class="btn btn-secondary" :disabled="loading">
            <span v-if="loading">刷新中...</span>
            <span v-else>刷新</span>
          </button>
        </div>

        <div v-if="loading && devices.length === 0" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载设备列表...</p>
        </div>

        <div v-else-if="devices.length === 0" class="empty-state">
          <p>没有找到设备</p>
        </div>

        <div v-else class="device-list">
          <div
            v-for="device in devices"
            :key="device.deviceId"
            class="device-item"
            :class="{ 'current-device': device.isCurrent }"
          >
            <div class="device-icon">
              <span v-if="device.isCurrent" title="当前设备">🖥️</span>
              <span v-else-if="device.isVerified" title="已验证">✅</span>
              <span v-else-if="device.isBlocked" title="已阻止">🚫</span>
              <span v-else-if="device.verificationStatus === 'unknown'" title="状态同步中">⏳</span>
              <span v-else title="未验证">⚠️</span>
            </div>

            <div class="device-info">
              <div class="device-name">
                <span>{{ device.displayName }}</span>
                <span v-if="device.isCurrent" class="badge badge-primary">当前设备</span>
                <span v-if="device.isVerified" class="badge badge-success">已验证</span>
                <span v-if="device.isBlocked" class="badge badge-danger">已阻止</span>
                <span v-if="device.verificationStatus === 'unknown'" class="badge badge-warning">同步中</span>
              </div>
              <div class="device-id">{{ device.deviceId }}</div>
              <div class="device-last-seen">
                最后在线: {{ formatLastSeen(device.lastSeen) }}
              </div>
              <div v-if="device.verificationStatus === 'unknown'" class="device-sync-status">
                💡 设备信息正在同步，验证状态暂时未知
              </div>
            </div>

            <div class="device-actions">
              <button
                v-if="!device.isVerified && !device.isCurrent && device.verificationStatus !== 'unknown'"
                @click="verifyDevice(device)"
                class="btn btn-success"
                :disabled="loading"
              >
                验证
              </button>
              <button
                v-if="device.verificationStatus === 'unknown'"
                @click="refreshDevices"
                class="btn btn-secondary btn-sm"
                :disabled="loading"
              >
                刷新状态
              </button>
              <button
                v-if="!device.isCurrent"
                @click="blockDevice(device)"
                class="btn btn-danger"
                :disabled="loading"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </section>


      <section class="dm-section">
        <div class="dm-section-header">
          <h2>安全建议</h2>
        </div>
        

        <div v-if="showSelfVerificationOption" class="self-verification-section">
          <div class="recommendation-item special" :class="{ verified: currentDeviceIsVerified }">
            <span class="recommendation-icon">
              {{ currentDeviceIsVerified ? '✅' : '🔐' }}
            </span>
            <div class="recommendation-content">
              <div class="recommendation-text">
                <strong v-if="currentDeviceIsVerified">✅ 当前设备已验证</strong>
                <strong v-else-if="currentDeviceNeedsVerification">当前设备需要验证</strong>
                <strong v-else-if="devices.length === 1">单设备账户设置</strong>
                <strong v-else>设备状态检查</strong>
                
                <span v-if="currentDeviceIsVerified">
                  当前设备已通过验证并建立了信任关系。
                </span>
                <span v-else-if="currentDeviceNeedsVerification">
                  当前设备未验证，建议使用密码验证以确保安全。
                </span>
                <span v-else-if="devices.length === 1">
                  您只有一台设备，可以使用账户密码建立设备信任。
                </span>
                <span v-else-if="hasUnknownDevices">
                  部分设备状态正在同步中，请稍后查看或刷新状态。
                </span>
                <span v-else>
                  设备状态正常，可选择性进行密码验证。
                </span>
              </div>
              <button 
                v-if="currentDeviceNeedsVerification || !currentDeviceIsVerified"
                @click="startSelfVerification" 
                class="btn btn-primary btn-sm"
                :disabled="loading"
              >
                密码验证此设备
              </button>
              <span v-else-if="currentDeviceIsVerified" class="verification-status">
                ✓ 设备已验证
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="recommendations.length === 0 && devices.length > 1" class="empty-state">
          <p>暂无安全建议</p>
        </div>
        <div v-else-if="devices.length > 1" class="recommendation-list">
          <div
            v-for="(recommendation, index) in recommendations"
            :key="index"
            class="recommendation-item"
          >
            <span class="recommendation-icon">💡</span>
            <span class="recommendation-text">{{ recommendation }}</span>
          </div>
        </div>
      </section>


      <section class="dm-section">
        <div class="dm-section-header">
          <h2>操作日志</h2>
          <button @click="clearLogs" class="btn btn-secondary btn-sm">
            清空日志
          </button>
        </div>
        <div class="log-container">
          <div v-if="logs.length === 0" class="empty-state">
            <p>暂无操作日志</p>
          </div>
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-entry"
            :class="`log-${log.type}`"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </section>
    </div>

    <PasswordPrompt
      :visible="isPasswordPromptVisible"
      :title="passwordPromptState.title"
      :message="passwordPromptState.message"
      @submit="handlePasswordSubmit"
      @cancel="handlePasswordCancel"
    />
  </div-->
</template>

<script setup lang="ts">
/*
import { ref, onMounted, computed } from 'vue'
import PasswordPrompt from '../Common/PasswordPrompt/index.vue'
import { deviceServiceV2 } from '../../services/matrix/devices'
import { matrixClientV2 } from '../../services/matrix/client'
import type { MatrixDevice } from '../../types'

// 响应式数据
const loading = ref(false)
const devices = ref<MatrixDevice[]>([])
const recommendations = ref<string[]>([])
const logs = ref<Array<{time: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>>([])
const crossSigningStatus = ref({
  enabled: false,
  text: '检查中...',
  class: 'checking'
})
const isPasswordPromptVisible = ref(false)
const passwordPromptState = ref({
  title: '',
  message: '',
  resolve: (_password: string) => {},
  reject: (_reason?: any) => {}
})

// 设备验证状态跟踪 - 基于服务器真实数据
// 注意：不再使用本地时间跟踪，完全依赖服务器状态

// 是否显示自验证选项 - 基于服务器真实数据
const showSelfVerificationOption = computed(() => {
  // 总是显示，但内容根据服务器状态变化
  return true
})

// 当前设备是否需要验证 - 基于服务器数据
const currentDeviceNeedsVerification = computed(() => {
  const currentDevice = devices.value.find(d => d.isCurrent)
  if (!currentDevice) return false
  
  // 基于服务器真实状态：未验证且状态不是未知
  return !currentDevice.isVerified && currentDevice.verificationStatus !== 'unknown'
})

// 当前设备是否已验证 - 基于服务器数据
const currentDeviceIsVerified = computed(() => {
  const currentDevice = devices.value.find(d => d.isCurrent)
  if (!currentDevice) return false
  
  // 基于服务器真实状态
  return currentDevice.isVerified
})

// 检查是否有状态未知的设备
const hasUnknownDevices = computed(() => {
  return devices.value.some(device => device.verificationStatus === 'unknown')
})

// 统一的密码输入Promise函数
const promptForPassword = (title: string, message: string): Promise<string> => {
  passwordPromptState.value.title = title;
  passwordPromptState.value.message = message;
  isPasswordPromptVisible.value = true;
  return new Promise<string>((resolve, reject) => {
    passwordPromptState.value.resolve = resolve;
    passwordPromptState.value.reject = reject;
  });
};

// 计算安全统计
const securityStats = computed(() => {
  const total = devices.value.length
  const verified = devices.value.filter(d => d.isVerified && !d.isBlocked).length
  const blocked = devices.value.filter(d => d.isBlocked).length
  const unverified = total - verified - blocked

  return {
    total,
    verified,
    blocked,
    unverified
  }
})

// 添加日志
const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const time = new Date().toLocaleTimeString('en-GB')
  logs.value.unshift({ time, message, type })
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// 格式化最后在线时间
const formatLastSeen = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return '未知'
  }
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString()
}

// 刷新设备列表 - V2适配
const refreshDevices = async () => {
  loading.value = true
  addLog('[V2] 开始刷新设备列表...', 'info')

  try {
    // 首先尝试刷新加密设备信息
    const client = matrixClientV2.getAuthedClient()
    const crypto = client?.getCrypto()
    const userId = client?.getUserId()
    
    if (crypto && userId && crypto.downloadKeys) {
      try {
        addLog('[V2] 正在同步设备加密信息...', 'info')
        await crypto.downloadKeys([userId], false)
        addLog('[V2] 设备加密信息同步完成', 'success')
        
        // 等待同步完成
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (syncError) {
        addLog(`[V2] 同步设备加密信息失败: ${(syncError as Error).message}`, 'warning')
      }
    }

    devices.value = await deviceServiceV2.获取我的设备列表()
    addLog(`[V2] 成功获取 ${devices.value.length} 个设备`, 'success')
  } catch (error) {
    addLog(`[V2] 刷新设备失败: ${(error as Error).message}`, 'error')
    console.error('[V2] 刷新设备失败:', error)
  } finally {
    loading.value = false
  }
}

// 验证设备 - V2适配
const verifyDevice = async (device: MatrixDevice) => {
  addLog(`[V2] 开始验证设备: ${device.displayName} (${device.deviceId})`, 'info')
  loading.value = true

  try {
    // 检查是否是当前用户的设备
    const client = matrixClientV2.getAuthedClient()
    const currentUserId = client?.getUserId()
    
    if (device.userId !== currentUserId) {
      throw new Error('只能验证自己的设备')
    }

    await deviceServiceV2.启动设备验证(device.userId, device.deviceId)
    addLog(`[V2] ✅ 设备验证成功: ${device.displayName}`, 'success')

    // 立即更新UI以提供即时反馈
    const targetDevice = devices.value.find(d => d.deviceId === device.deviceId)
    if (targetDevice) {
      targetDevice.isVerified = true
    }

    // 在后台刷新整个列表以确保数据同步
    setTimeout(async () => {
      await refreshDevices()
    }, 1000)
    
  } catch (error) {
    const errorMsg = (error as Error).message
    addLog(`[V2] 设备验证遇到问题: ${errorMsg}`, 'warning')
    
    // 对于自己的设备，提供更友好的处理方式
    if (errorMsg.includes('不存在') || errorMsg.includes('不可访问') || errorMsg.includes('超时') || errorMsg.includes('Unknown device')) {
      addLog(`[V2] 💡 这通常是因为设备密钥正在同步中`, 'info')
      addLog(`[V2] 对于自己的设备，不验证通常也不影响正常使用`, 'info')
      addLog(`[V2] 建议操作:`, 'info')
      addLog(`[V2] 1. 等待几分钟后重试验证`, 'info')
      addLog(`[V2] 2. 使用Element等官方客户端验证`, 'info')
      addLog(`[V2] 3. 如果是旧设备可以直接删除`, 'info')
      
      // 对于自己的设备，验证失败不算严重错误，给用户选择是否标记为已验证
      const shouldMarkAsVerified = confirm(
        `设备验证遇到技术问题（${errorMsg}），但这通常不影响使用。\n\n` +
        `是否临时标记此设备为已验证？\n\n` +
        `注意：这只是UI标记，建议稍后重试正常验证流程。`
      )
      if (shouldMarkAsVerified) {
        await forceMarkAsVerified(device)
      }
    } else {
      addLog(`[V2] ❌ 设备验证失败: ${errorMsg}`, 'error')
    }
    
    console.error('[V2] 设备验证失败:', error)
  } finally {
    loading.value = false
  }
}

// 强制标记设备为已验证 - 用于技术问题的临时解决方案
const forceMarkAsVerified = async (device: MatrixDevice) => {
  try {
    const confirmed = confirm(
      `确定要强制标记设备 "${device.displayName}" 为已验证吗？\n\n` +
      `这个操作适用于：\n` +
      `• 设备验证因技术问题失败\n` +
      `• 您确认这是自己的设备\n` +
      `• 密钥同步冲突导致验证无法进行\n\n` +
      `点击确定继续，或取消放弃操作。`
    )
    
    if (!confirmed) {
      addLog(`[V2] 已取消强制验证: ${device.displayName}`, 'info')
      return
    }

    loading.value = true
    addLog(`[V2] 强制标记设备为已验证: ${device.displayName}`, 'warning')
    
    // 直接在UI中标记为已验证
    const targetDevice = devices.value.find(d => d.deviceId === device.deviceId)
    if (targetDevice) {
      targetDevice.isVerified = true
    }
    
    addLog(`[V2] ✅ 设备已强制标记为已验证: ${device.displayName}`, 'success')
    addLog(`[V2] 💡 注意：这只是UI标记，建议稍后使用正常验证流程`, 'info')
    
  } catch (error) {
    addLog(`[V2] 强制验证失败: ${(error as Error).message}`, 'error')
    console.error('[V2] 强制验证失败:', error)
  } finally {
    loading.value = false
  }
}

// 单设备自验证 - 用于其他设备丢失/损坏的情况
const startSelfVerification = async () => {
  addLog(`[V2] 开始单设备自验证流程（用于其他设备丢失/损坏场景）...`, 'info')
  loading.value = true

  try {
    const password = await promptForPassword(
      '单设备验证',
      `此功能适用于：您的其他设备已丢失、损坏或无法访问的情况。<br><br>
      通过输入账户密码，将重新建立当前设备的信任关系：<br>
      • 重新建立交叉签名<br>
      • 验证当前设备<br>
      • 恢复或创建密钥备份<br><br>
      请输入登录密码：`
    )

    await deviceServiceV2.单设备自验证(password)
    addLog(`[V2] ✅ 单设备自验证成功！`, 'success')
    addLog(`[V2] 当前设备已通过密码验证并建立信任`, 'success')
    
    // 刷新设备列表以获取最新状态
    await refreshDevices()
    
  } catch (error) {
    if ((error as Error)?.message === '用户取消输入') {
      addLog(`[V2] 已取消单设备验证`, 'info')
    } else {
      const errorMsg = (error as Error).message
      addLog(`[V2] 单设备验证失败: ${errorMsg}`, 'error')
      
      if (errorMsg.includes('密码')) {
        addLog(`[V2] 💡 请检查密码是否正确`, 'warning')
      } else if (errorMsg.includes('不支持')) {
        addLog(`[V2] 💡 当前服务器可能不支持此功能`, 'warning')
      }
    }
    console.error('[V2] 单设备验证失败:', error)
  } finally {
    loading.value = false
  }
}

// 阻止设备 - V2适配
const blockDevice = async (device: MatrixDevice) => {
  try {
    const password = await promptForPassword(
      '确认删除设备',
      `此操作将永久删除设备 <strong>${device.displayName}</strong> 并且无法撤销。<br><br>要继续，请输入您的登录密码：`
    );

    loading.value = true;
    addLog(`[V2] 正在删除设备: ${device.displayName}`, 'warning');
    const auth = {
      type: 'm.login.password',
      user: device.userId,
      password: password,
    };
    await deviceServiceV2.阻止设备(device.deviceId, auth);
    addLog(`[V2] 成功删除设备: ${device.displayName}`, 'success');
    await refreshDevices(); // 刷新列表以更新UI
  } catch (error) {
    if ((error as Error)?.message === '用户取消输入') {
      addLog(`[V2] 已取消删除设备: ${device.displayName}`, 'info');
    } else {
      addLog(`[V2] 删除设备失败: ${(error as Error).message}`, 'error');
      console.error('[V2] 删除设备失败:', error);
    }
  } finally {
    loading.value = false;
  }
};

// 处理密码提交
const handlePasswordSubmit = (password: string) => {
  isPasswordPromptVisible.value = false;
  passwordPromptState.value.resolve(password);
};

// 处理密码输入取消
const handlePasswordCancel = () => {
  isPasswordPromptVisible.value = false;
  passwordPromptState.value.reject(new Error('用户取消输入'));
};

// 设置交叉签名 - V2适配
const setupCrossSigning = async () => {
  addLog('[V2] 开始设置交叉签名...', 'info');
  loading.value = true;
  
  try {
    // 定义一个函数，该函数将由 `初始化交叉签名` 在需要密码时调用
    const getPassword = () => {
      return promptForPassword(
        '启用交叉签名',
        '为了保护您的账户，启用交叉签名需要您输入密码进行确认。'
      );
    };

    // 调用V2客户端服务，并传入获取密码的回调
    await matrixClientV2.InitializeCrossSigning(getPassword);

    addLog('[V2] 交叉签名设置成功!', 'success');
    await checkCrossSigningStatus(); // 刷新状态
  } catch (error) {
    if ((error as Error)?.message === '用户取消输入') {
      addLog('[V2] 已取消启用交叉签名。', 'info');
    } else {
      addLog(`[V2] 交叉签名设置失败: ${(error as Error).message}`, 'error');
      console.error('[V2] 交叉签名设置失败:', error);
    }
  } finally {
    loading.value = false;
  }
}

// 检查交叉签名状态 - V2适配
const checkCrossSigningStatus = async () => {
  try {
    console.log('[V2] 检查交叉签名状态...')
    
    // 检查客户端是否已登录
    if (!matrixClientV2.CheckLoginStatus()) {
      crossSigningStatus.value = { enabled: false, text: '未登录', class: 'error' }
      return
    }

    const client = matrixClientV2.getAuthedClient()
    if (!client) {
      crossSigningStatus.value = { enabled: false, text: '客户端未初始化', class: 'error' }
      return
    }

    const crypto = client.getCrypto()
    const userId = client.getUserId()

    if (!crypto || !userId) {
      crossSigningStatus.value = { enabled: false, text: '加密未初始化', class: 'error' }
      return
    }

    // 检查交叉签名是否可用
    try {
      const crossSigningInfo = await crypto.getCrossSigningInfo?.(userId)
      if (crossSigningInfo && crossSigningInfo.getId()) {
        crossSigningStatus.value = { enabled: true, text: '已启用', class: 'success' }
      } else {
        crossSigningStatus.value = { enabled: false, text: '未启用', class: 'warning' }
      }
    } catch (error) {
      console.warn('[V2] 获取交叉签名信息失败:', error)
      crossSigningStatus.value = { enabled: false, text: '未启用', class: 'warning' }
    }
  } catch (error) {
    crossSigningStatus.value = { enabled: false, text: '检查失败', class: 'error' }
    console.error('[V2] 检查交叉签名状态失败:', error)
  }
}

// 生成安全建议 - V2适配
const generateRecommendations = async () => {
  try {
    recommendations.value = await deviceServiceV2.生成安全建议()
    addLog(`[V2] 生成了 ${recommendations.value.length} 条安全建议`, 'info')
  } catch (error) {
    addLog(`[V2] 生成安全建议失败: ${(error as Error).message}`, 'error')
    console.error('[V2] 生成安全建议失败:', error)
  }
}

// 清空日志
const clearLogs = () => {
  logs.value = []
  addLog('[V2] 日志已清空', 'info')
}

// 组件挂载时初始化
onMounted(async () => {
  addLog('[V2] 设备管理器V2已加载', 'info')

  // 初始化各项检查
  await Promise.all([
    refreshDevices(),
    checkCrossSigningStatus(),
    generateRecommendations()
  ])
})

*/
</script>

<style scoped>
/* 使用全局主题变量，不再在此处定义 */
.device-manager-container {
  background-color: var(--dm-bg-primary);
  color: var(--dm-text-normal);
  height: 100%; /* 占据父容器的全部高度 */
  overflow-y: auto; /* 当内容超出时，允许垂直滚动 */
  padding: 20px;
  box-sizing: border-box;
  transition: background-color 0.3s ease, color 0.3s ease;
  /* 隐藏滚动条 */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

/* for Chrome, Safari and Opera */
.device-manager-container::-webkit-scrollbar {
    display: none;
}

.device-manager {
  max-width: 800px;
  margin: 0 auto;
  font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.dm-header {
  text-align: left;
  margin-bottom: 30px;
}

.dm-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--dm-header-primary);
  margin: 0 0 8px 0;
}

.dm-header p {
  font-size: 14px;
  color: var(--dm-text-muted);
  margin: 0;
}

.dm-section {
  background-color: var(--dm-bg-secondary);
  border-radius: 8px;
  margin-bottom: 24px;
  padding: 24px;
  transition: background-color 0.3s ease;
}

.dm-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--dm-border);
  transition: border-color 0.3s ease;
}

.dm-section-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--dm-header-primary);
  margin: 0;
  text-transform: uppercase;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  text-align: center;
}

.stat-item .stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--dm-header-primary);
}
.stat-item .text-success { color: var(--dm-green); }
.stat-item .text-warning { color: var(--dm-yellow); }
.stat-item .text-danger { color: var(--dm-red); }

.stat-item .stat-label {
  font-size: 12px;
  color: var(--dm-text-muted);
  text-transform: uppercase;
}

.dm-separator {
  height: 1px;
  background-color: var(--dm-border);
  margin: 24px 0;
  transition: background-color 0.3s ease;
}

.cross-signing-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cross-signing-status .status-text {
  display: flex;
  flex-direction: column;
}

.cross-signing-status .status-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-header-primary);
  margin-bottom: 4px;
}

.status-indicator {
  font-size: 12px;
  font-weight: 500;
}
.status-indicator.success { color: var(--dm-green); }
.status-indicator.warning { color: var(--dm-yellow); }
.status-indicator.error { color: var(--dm-red); }
.status-indicator.checking { color: var(--dm-text-muted); }

.loading-state, .empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--dm-text-muted);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--dm-interactive-normal);
  border-top-color: var(--dm-blurple);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.device-item {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 4px;
  background-color: transparent;
  border: 1px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.device-item:hover {
  background-color: var(--dm-bg-tertiary);
}

.device-item.current-device {
  border-color: var(--dm-blurple);
  background-color: rgba(88, 101, 242, 0.1);
}

.device-icon {
  font-size: 24px;
  text-align: center;
}

.device-info .device-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--dm-header-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.badge {
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-primary { background-color: var(--dm-blurple); color: white; }
.badge-success { background-color: var(--dm-green); color: white; }
.badge-danger { background-color: var(--dm-red); color: white; }
.badge-warning { background-color: var(--dm-yellow); color: white; }

.device-info .device-id,
.device-info .device-last-seen,
.device-info .device-sync-status {
  font-size: 12px;
  color: var(--dm-text-muted);
  font-family: monospace;
}

.device-info .device-sync-status {
  color: var(--dm-yellow);
  font-style: italic;
  margin-top: 4px;
}

.device-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.17s ease, color 0.17s ease;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary { background-color: var(--dm-blurple); color: white; }
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }

.btn-secondary { background-color: var(--dm-interactive-normal); color: var(--dm-text-normal); }
.btn-secondary:hover:not(:disabled) { background-color: var(--dm-interactive-hover); }

.btn-success { background-color: var(--dm-green); color: white; }
.btn-warning { background-color: var(--dm-yellow); color: white; }
.btn-danger { background-color: var(--dm-red); color: white; }

.btn-success:hover:not(:disabled),
.btn-warning:hover:not(:disabled),
.btn-danger:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background-color: rgba(250, 166, 26, 0.1);
  border-radius: 4px;
  border-left: 3px solid var(--dm-yellow);
}
.recommendation-item.special {
  background-color: rgba(88, 101, 242, 0.1);
  border-left-color: var(--dm-blurple);
}
.recommendation-item.special.verified {
  background-color: rgba(67, 181, 129, 0.1);
  border-left-color: var(--dm-green);
}
.recommendation-item.special .recommendation-icon {
  color: var(--dm-blurple);
}
.recommendation-item.special.verified .recommendation-icon {
  color: var(--dm-green);
}
.verification-status {
  font-size: 12px;
  color: var(--dm-green);
  font-weight: 500;
}
.recommendation-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.self-verification-section {
  margin-bottom: 16px;
}
.recommendation-icon { font-size: 18px; color: var(--dm-yellow); }
.recommendation-text { font-size: 14px; line-height: 1.5; }

.log-container {
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--dm-bg-tertiary);
  border-radius: 4px;
  padding: 8px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  transition: background-color 0.3s ease;
}
.log-entry {
  padding: 4px 8px;
  border-radius: 2px;
}
.log-entry:not(:last-child) { margin-bottom: 2px; }
.log-time { color: var(--dm-text-muted); margin-right: 8px; }
.log-success .log-message { color: var(--dm-green); }
.log-error .log-message { color: var(--dm-red); }
.log-warning .log-message { color: var(--dm-yellow); }

/* 响应式设计 */
@media (max-width: 768px) {
  .device-manager-container {
    padding: 10px;
  }
  .dm-section {
    padding: 16px;
  }
  .device-item {
    grid-template-columns: 1fr;
    gap: 12px;
    text-align: center;
  }
  .device-icon {
    margin-bottom: 8px;
  }
  .device-actions {
    justify-content: center;
    margin-top: 12px;
  }
  .cross-signing-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
