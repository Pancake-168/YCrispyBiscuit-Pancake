<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 状态管理
const step = ref(1);
const installPath = ref('尚未选择...');
const dataPath = ref('尚未选择...');
const isProcessing = ref(false);
const finalTargetPath = ref('');
const appName = import.meta.env.VITE_APP_NAME;

// 初始化检测
const initPaths = async () => {
  if (window.electronAPI) {
    const isDev = await window.electronAPI.getIsDev();
    if (isDev) {
        installPath.value = '开发模式：跳过路径选择';
        dataPath.value = '开发模式：使用 Temp';
    }
  }
};
initPaths();

// 选择安装位置
const handleSelectInstall = async () => {
  const res = await window.electronAPI.confirmInstallPath();
  if (res.success && res.path) {
    installPath.value = res.path;
  }
};

// 选择数据位置
const handleSelectData = async () => {
  const res = await window.electronAPI.confirmDataPath();
  if (res.success && res.path) {
    dataPath.value = res.path;
  }
};

// 执行最终配置
const handleFinalize = async () => {
  if (installPath.value === '尚未选择...' || dataPath.value === '尚未选择...') {
    alert('请先完成路径选择');
    return;
  }

  isProcessing.value = true;
  const res = await window.electronAPI.executeSetup({
    installPath: installPath.value,
    dataPath: dataPath.value
  });

  if (res.success) {
    if (res.targetPath) {
      finalTargetPath.value = res.targetPath;
      step.value = 3; // 进入成功完成页面
    } else {
      // 开发模式
      setTimeout(() => {
        router.push('/');
      }, 1000);
    }
  } else {
    alert('配置失败：' + res.message);
    isProcessing.value = false;
  }
};

const handleLaunch = async () => {
  if (finalTargetPath.value) {
    await window.electronAPI.launchApp(finalTargetPath.value);
  } else {
    router.push('/');
  }
};
</script>

<template>
  <div class="setup-container">
    <main class="content">
      <div class="glass-card setup-card">
        <!-- 步骤 1: 欢迎 -->
        <section v-if="step === 1" class="step-content">
          <div class="icon-hero">
            <img src="/icon.png" class="setup-logo" />
          </div>
          <h1>欢迎使用 {{ appName }}</h1>
          <p>在开始之前，我们需要完成基础配置。</p>
          <div class="actions">
            <button class="btn btn-primary" @click="step = 2">开始配置</button>
          </div>
        </section>

        <!-- 步骤 2: 路径确认 -->
        <section v-if="step === 2" class="step-content">
          <h2>部署确认</h2>
          <p class="desc">请选择应用部署位置及数据存放目录：</p>

          <div class="path-group">
            <label>应用部署位置 (应用本体将存放于此)</label>
            <div class="path-input">
              <span class="path-text" :title="installPath">{{ installPath }}</span>
              <button class="btn btn-ghost btn-sm" @click="handleSelectInstall">选择目录</button>
            </div>
          </div>

          <div class="path-group">
            <label>数据存储位置 (数据库/配置/缓存)</label>
            <div class="path-input">
              <span class="path-text" :title="dataPath">{{ dataPath }}</span>
              <button class="btn btn-ghost btn-sm" @click="handleSelectData">选择目录</button>
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-ghost" @click="step = 1">返回</button>
            <button class="btn btn-primary" :disabled="isProcessing || installPath === '尚未选择...' || dataPath === '尚未选择...'" @click="handleFinalize">
              {{ isProcessing ? '正在部署应用...' : '立即开始安装' }}
            </button>
          </div>
        </section>

        <!-- 步骤 3: 安装完成 -->
        <section v-if="step === 3" class="step-content">
          <div class="icon-hero">
            <img src="/icon.png" class="setup-logo success-anim" />
          </div>
          <h2>部署完成！</h2>
          <p class="desc">应用已成功部署至选定目录，并在桌面创建了快捷方式。</p>
          <div class="actions">
            <button class="btn btn-primary" @click="handleLaunch">立即启动应用</button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.path-group.readonly .path-input {
  background: rgba(255, 255, 255, 0.02);
  cursor: not-allowed;
  opacity: 0.6;
}

.tag {
  font-size: var(--font-xs);
  background: var(--glass-bg);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
}
.setup-container {
  width: 100%;
  height: 100%;
  background: var(--bg-color);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.setup-card {
  width: 100%;
  max-width: 500px;
  padding: var(--space-2xl);
  text-align: center;
}

.icon-hero { margin-bottom: var(--space-xl); }
.setup-logo {
  width: var(--logo-size-lg);
  height: var(--logo-size-lg);
  object-fit: contain;
}
.success-anim {
  animation: scale-up 0.5s ease-out;
}
@keyframes scale-up {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
h1 { margin-bottom: var(--space-sm); }
.desc { font-size: var(--font-base); opacity: 0.7; margin-bottom: var(--space-lg); }

.path-group {
  text-align: left;
  margin-bottom: var(--space-lg);
}
.path-group label {
  display: block;
  font-size: var(--font-sm);
  margin-bottom: var(--space-sm);
  color: var(--text-muted);
}

.path-input {
  background: var(--input-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  display: flex;
  padding: var(--space-xs);
  align-items: center;
}

.path-input span {
  flex: 1;
  padding: 0 var(--space-md);
  font-size: var(--font-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-color);
}

.actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  justify-content: center;
}
</style>
