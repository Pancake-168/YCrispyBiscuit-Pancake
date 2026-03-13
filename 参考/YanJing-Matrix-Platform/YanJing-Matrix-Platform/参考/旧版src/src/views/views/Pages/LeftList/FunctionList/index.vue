<template>
  <div class="function-list" :class="{ compact }">
    <!--div class="function-item" @click="emit('function-change', 'rooms')">
      <span class="function-icon">
        <svg class="icon" viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
          <path
            d="M512 896H224a96.2 96.2 0 0 1-96-96V512a384 384 0 1 1 384 384z m0-704a320 320 0 0 0-320 320V800a32.1 32.1 0 0 0 32 32h288a320 320 0 0 0 0-640z"
            p-id="10106"></path>
          <path d="M320 384m32 0l192 0q32 0 32 32l0 0q0 32-32 32l-192 0q-32 0-32-32l0 0q0-32 32-32Z" p-id="10107">
          </path>
          <path d="M320 512m32 0l320 0q32 0 32 32l0 0q0 32-32 32l-320 0q-32 0-32-32l0 0q0-32 32-32Z" p-id="10108">
          </path>
          <path d="M320 640m32 0l320 0q32 0 32 32l0 0q0 32-32 32l-320 0q-32 0-32-32l0 0q0-32 32-32Z" p-id="10109">
          </path>
        </svg>
      </span>
      <span v-if="!isMobile && !compact" class="function-name">消息</span>
    </div-->



    <!--div class="function-item" @click="emit('function-change', 'newrooms')">
      <span class="function-icon">
        <svg class="icon" viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
          <path
            d="M512 896H224a96.2 96.2 0 0 1-96-96V512a384 384 0 1 1 384 384z m0-704a320 320 0 0 0-320 320V800a32.1 32.1 0 0 0 32 32h288a320 320 0 0 0 0-640z"
            p-id="10106"></path>
          <path d="M320 384m32 0l192 0q32 0 32 32l0 0q0 32-32 32l-192 0q-32 0-32-32l0 0q0-32 32-32Z" p-id="10107">
          </path>
          <path d="M320 512m32 0l320 0q32 0 32 32l0 0q0 32-32 32l-320 0q-32 0-32-32l0 0q0-32 32-32Z" p-id="10108">
          </path>
          <path d="M320 640m32 0l320 0q32 0 32 32l0 0q0 32-32 32l-320 0q-32 0-32-32l0 0q0-32 32-32Z" p-id="10109">
          </path>
        </svg>
      </span>
      <span v-if="!isMobile && !compact" class="function-name">消息</span>
    </div-->





    <div class="function-item" @click="emit('function-change', 'MessagePage')">
      <span class="function-icon">
        <svg class="icon" viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
          <path
            d="M512 896H224a96.2 96.2 0 0 1-96-96V512a384 384 0 1 1 384 384z m0-704a320 320 0 0 0-320 320V800a32.1 32.1 0 0 0 32 32h288a320 320 0 0 0 0-640z"
            p-id="10106"></path>
          <path d="M320 384m32 0l192 0q32 0 32 32l0 0q0 32-32 32l-192 0q-32 0-32-32l0 0q0-32 32-32Z" p-id="10107">
          </path>
          <path d="M320 512m32 0l320 0q32 0 32 32l0 0q0 32-32 32l-320 0q-32 0-32-32l0 0q0-32 32-32Z" p-id="10108">
          </path>
          <path d="M320 640m32 0l320 0q32 0 32 32l0 0q0 32-32 32l-320 0q-32 0-32-32l0 0q0-32 32-32Z" p-id="10109">
          </path>
        </svg>
      </span>
      <span v-if="!isMobile && !compact" class="function-name">消息</span>
    </div>




    <!--div class="function-item" @click="emit('function-change', 'organization')">
      <span class="function-icon">
        <svg class="icon" viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
          <path
            d="M207.36 656H110.08a96 96 0 0 1-96-96V462.72a96 96 0 0 1 96-96h97.28a96 96 0 0 1 96 96v97.28a96 96 0 0 1-96 96zM110.08 430.72a32 32 0 0 0-32 32v97.28a32 32 0 0 0 32 32h97.28a32 32 0 0 0 32-32V462.72a32 32 0 0 0-32-32zM920.96 296.96h-97.92a96 96 0 0 1-96-96V103.68a96 96 0 0 1 96-96h97.92a96 96 0 0 1 95.36 96v97.28a96 96 0 0 1-95.36 96z m-97.92-225.28a32 32 0 0 0-32 32v97.28a32 32 0 0 0 32 32h97.92a31.36 31.36 0 0 0 31.36-32V103.68a31.36 31.36 0 0 0-31.36-32zM920.96 656h-97.92a96 96 0 0 1-96-96V462.72a96 96 0 0 1 96-96h97.92a96 96 0 0 1 95.36 96v97.28a96 96 0 0 1-95.36 96z m-97.92-225.28a32 32 0 0 0-32 32v97.28a32 32 0 0 0 32 32h97.92a31.36 31.36 0 0 0 31.36-32V462.72a31.36 31.36 0 0 0-31.36-32zM920.96 1015.04h-97.92a96 96 0 0 1-96-96v-97.28a96 96 0 0 1 96-96h97.92a96 96 0 0 1 95.36 96v97.28a96 96 0 0 1-95.36 96z m-97.92-225.28a32 32 0 0 0-32 32v97.28a32 32 0 0 0 32 32h97.92a31.36 31.36 0 0 0 31.36-32v-97.28a31.36 31.36 0 0 0-31.36-32zM673.92 912.64H478.08a32 32 0 0 1-32-32V152.32a32 32 0 0 1 32-32h195.84a32 32 0 0 1 0 64H512v664.32h163.84a32 32 0 0 1 32 32 32 32 0 0 1-33.92 32z"
            p-id="13099"></path>
          <path
            d="M664.96 548.48h-320a32.64 32.64 0 0 1-32-32 32 32 0 0 1 32-32h320a32 32 0 0 1 32 32 32 32 0 0 1-32 32z"
            p-id="13100"></path>
        </svg>
      </span>
      <span v-if="!isMobile && !compact" class="function-name">组织</span>
    </div-->


    <div class="function-item" @click="emit('function-change', 'NewOrganization')">
      <span class="function-icon">
        <svg class="icon" viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
          <path
            d="M207.36 656H110.08a96 96 0 0 1-96-96V462.72a96 96 0 0 1 96-96h97.28a96 96 0 0 1 96 96v97.28a96 96 0 0 1-96 96zM110.08 430.72a32 32 0 0 0-32 32v97.28a32 32 0 0 0 32 32h97.28a32 32 0 0 0 32-32V462.72a32 32 0 0 0-32-32zM920.96 296.96h-97.92a96 96 0 0 1-96-96V103.68a96 96 0 0 1 96-96h97.92a96 96 0 0 1 95.36 96v97.28a96 96 0 0 1-95.36 96z m-97.92-225.28a32 32 0 0 0-32 32v97.28a32 32 0 0 0 32 32h97.92a31.36 31.36 0 0 0 31.36-32V103.68a31.36 31.36 0 0 0-31.36-32zM920.96 656h-97.92a96 96 0 0 1-96-96V462.72a96 96 0 0 1 96-96h97.92a96 96 0 0 1 95.36 96v97.28a96 96 0 0 1-95.36 96z m-97.92-225.28a32 32 0 0 0-32 32v97.28a32 32 0 0 0 32 32h97.92a31.36 31.36 0 0 0 31.36-32V462.72a31.36 31.36 0 0 0-31.36-32zM920.96 1015.04h-97.92a96 96 0 0 1-96-96v-97.28a96 96 0 0 1 96-96h97.92a96 96 0 0 1 95.36 96v97.28a96 96 0 0 1-95.36 96z m-97.92-225.28a32 32 0 0 0-32 32v97.28a32 32 0 0 0 32 32h97.92a31.36 31.36 0 0 0 31.36-32v-97.28a31.36 31.36 0 0 0-31.36-32zM673.92 912.64H478.08a32 32 0 0 1-32-32V152.32a32 32 0 0 1 32-32h195.84a32 32 0 0 1 0 64H512v664.32h163.84a32 32 0 0 1 32 32 32 32 0 0 1-33.92 32z"
            p-id="13099"></path>
          <path
            d="M664.96 548.48h-320a32.64 32.64 0 0 1-32-32 32 32 0 0 1 32-32h320a32 32 0 0 1 32 32 32 32 0 0 1-32 32z"
            p-id="13100"></path>
        </svg>
      </span>
      <span v-if="!isMobile && !compact" class="function-name">组织</span>
    </div>

    <div class="function-item" @click="emit('function-change', 'workbench')">
      <span class="function-icon">
        <svg class="icon" viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
          <path
            d="M910.762667 369.664l-135.765334 135.765333a85.333333 85.333333 0 0 1-120.661333 0l-135.765333-135.765333a85.333333 85.333333 0 0 1 0-120.661333l135.765333-135.765334a85.333333 85.333333 0 0 1 120.661333 0l135.765334 135.765334a85.333333 85.333333 0 0 1 0 120.661333zM362.666667 938.666667H170.666667a85.333333 85.333333 0 0 1-85.333334-85.333334v-192a85.333333 85.333333 0 0 1 85.333334-85.333333h192a85.333333 85.333333 0 0 1 85.333333 85.333333v192a85.333333 85.333333 0 0 1-85.333333 85.333334z m0-448H170.666667a85.333333 85.333333 0 0 1-85.333334-85.333334v-192a85.333333 85.333333 0 0 1 85.333334-85.333333h192a85.333333 85.333333 0 0 1 85.333333 85.333333v192a85.333333 85.333333 0 0 1-85.333333 85.333334z m256 85.333333h192a85.333333 85.333333 0 0 1 85.333333 85.333333v192a85.333333 85.333333 0 0 1-85.333333 85.333334h-192a85.333333 85.333333 0 0 1-85.333334-85.333334v-192a85.333333 85.333333 0 0 1 85.333334-85.333333z"
            p-id="2382"></path>
        </svg>
      </span>
      <span v-if="!isMobile && !compact" class="function-name">工作台</span>
    </div>


    <div class="function-item" @click="emit('function-change', 'systemmap')">
      <span class="function-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="lucide lucide-map" aria-hidden="true">
          <path
            d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z">
          </path>
          <path d="M15 5.764v15"></path>
          <path d="M9 3.236v15"></path>
        </svg>

      </span>
      <span v-if="!isMobile && !compact" class="function-name">系统蓝图</span>
    </div>





    <div class="function-item" @click="emit('function-change', 'market')">
      <span class="function-icon">
        <svg class="icon" viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
          <path
            d="M873.411765 219.858824h-153.6c-15.058824-120.470588-102.4-180.705882-207.811765-180.705883s-192.752941 60.235294-207.811765 180.705883H150.588235l-60.235294 783.058823h843.294118l-60.235294-783.058823z m-361.411765-120.470589c72.282353 0 132.517647 30.117647 147.576471 120.470589h-295.152942c15.058824-90.352941 75.294118-120.470588 147.576471-120.470589z m-355.388235 843.294118l51.2-662.588235h608.37647l51.2 662.588235H156.611765z"
            p-id="6923"></path>
        </svg>
      </span>
      <span v-if="!isMobile && !compact" class="function-name">智能体市场</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, toRefs } from 'vue'

// 功能列表组件 - 负责显示左侧的功能按钮列表
const emit = defineEmits(['function-change'])

const props = withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false
})

const { compact } = toRefs(props)

// 移动端检测
const isMobile = ref(false)

// 检测是否为移动端设备
const checkIsMobile = () => {
  const mobileBreakpoint = 769 // 768px以下认为是移动端
  isMobile.value = window.innerWidth < mobileBreakpoint
}

// 组件挂载时检测移动端
onMounted(() => {
  checkIsMobile()
  // 监听窗口大小变化
  window.addEventListener('resize', checkIsMobile)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
})
</script>

<style scoped>
.function-list {

  flex: 1;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  background: var(--bg-color-secondary);
}

.function-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  height: 44px;
  cursor: pointer;

  color: var(--text-color-secondary);
  transition: background 0.18s, color 0.18s;
  font-size: var(--font-size-base);
  position: relative;
}

.function-item .function-icon {
  display: flex;
  align-items: center;
  font-size: var(--font-size-base);
  color: inherit;
}

.function-item .function-name {
  font-weight: 500;
  color: inherit;
}

.function-list.compact .function-item {
  justify-content: center;
  gap: 0;
  padding: 0 8px;
}

.function-list.compact .function-icon {
  justify-content: center;
}

.function-item:hover {
  background: var(--color-primary-light);

  color: var(--color-primary);
}

.function-item.active {
  background: var(--color-primary);
  color: #fff;
}

.function-item.active .function-icon,
.function-item.active .function-name {
  color: #fff;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .function-item {
    justify-content: center;
    gap: 0;
    padding:12px;
    border-radius:20%;
  }

  .function-item .function-icon {
    justify-content: center;
  }
}
</style>