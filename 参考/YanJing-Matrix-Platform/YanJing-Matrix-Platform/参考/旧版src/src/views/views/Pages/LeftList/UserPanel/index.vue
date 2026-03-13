<template>
  <div class="user-panel" :class="{ 'user-panel--compact': compact }">
    
    <!-- 移动端主题切换按钮 -->
  <button v-if="isMobile" class="user-center-btn" @click="toggleTheme" title="切换主题">
      <span class="user-center-content">
        <svg v-if="theme === 'light'" width="20" height="20" viewBox="0 0 16 16" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_115_767)">
            <path
              d="M11.3334 7.99996C11.3334 9.84091 9.84103 11.3333 8.00008 11.3333C6.15913 11.3333 4.66675 9.84091 4.66675 7.99996C4.66675 6.15901 6.15913 4.66663 8.00008 4.66663C9.84103 4.66663 11.3334 6.15901 11.3334 7.99996Z"
              stroke="var(--text-color-secondary)" stroke-width="1.5" />
            <path
              d="M7.99992 1.33337V2.33337M7.99992 13.6667V14.6667M12.7138 12.7142L12.0067 12.0071M3.99276 3.99288L3.28565 3.28577M14.6666 8.00004H13.6666M2.33325 8.00004H1.33325M12.7141 3.28585L12.007 3.99295M3.99308 12.0072L3.28598 12.7143"
              stroke="var(--text-color-secondary)" stroke-width="1.5" stroke-linecap="round" />
          </g>
          <defs>
            <clipPath id="clip0_115_767">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 16 16" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_115_765)">
            <path
              d="M14.3334 9.38554C13.5336 9.81259 12.6202 10.0547 11.6502 10.0547C8.4995 10.0547 5.94536 7.50055 5.94536 4.34986C5.94536 3.37987 6.18745 2.46641 6.6145 1.66663C3.77852 2.33128 1.66675 4.87671 1.66675 7.91537C1.66675 11.4599 4.54015 14.3333 8.08467 14.3333C11.1233 14.3333 13.6688 12.2215 14.3334 9.38554Z"
              stroke="var(--text-color-secondary)" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_115_765">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
        
      </span>
    </button>
    
    
    <!--div class="feedback-container" ref="feedbackContainer">
      <button class="user-center-btn" @click="showFeedbackDialogFunc" title="问题反馈">
        <span class="user-center-content">
          <svg t="1756448176364" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            p-id="9194" width="20" height="20" fill="var(--text-color-secondary)">
            <path
              d="M458.361905 355.961905c0-19.504762 4.87619-39.009524 14.628571-43.885715 9.752381-9.752381 19.504762-14.628571 39.009524-14.628571 14.628571 0 24.380952 4.87619 34.133333 9.752381 9.752381 9.752381 14.628571 19.504762 14.628572 34.133333 0 9.752381-4.87619 24.380952-14.628572 34.133334L487.619048 458.361905c-9.752381 9.752381-14.628571 19.504762-14.628572 29.257143 0 9.752381-4.87619 19.504762-4.87619 34.133333v48.761905h87.771428v-43.885715c0-14.628571 4.87619-24.380952 9.752381-34.133333l58.514286-78.019048c14.628571-19.504762 24.380952-43.885714 24.380952-73.142857 0-39.009524-14.628571-73.142857-43.885714-92.647619-29.257143-19.504762-58.514286-34.133333-97.523809-34.133333s-68.266667 14.628571-97.52381 34.133333c-24.380952 29.257143-39.009524 58.514286-39.009524 97.52381v24.380952h87.771429v-14.628571zM468.114286 604.647619h87.771428v82.895238H468.114286z"
              p-id="9195"></path>
            <path
              d="M58.514286 53.638095v760.685715h287.695238l165.790476 151.161904 165.790476-151.161904h292.571429V53.638095H58.514286z m809.447619 663.161905h-229.180953l-126.780952 117.028571-126.780952-117.028571H156.038095V151.161905h711.92381v565.638095z"
              p-id="9196"></path>
          </svg>
          <span v-if="!isMobile && !compact" class="function-name">反馈</span>
        </span>
      </button>
    </div-->

    <button class="user-center-btn" @click="emit('userInfo')" title="个人中心">
      <span class="user-center-content">
        <svg t="1756274756519" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="5115" width="20" height="20" fill="var(--text-color-secondary)">
          <path
            d="M512 328c-100.8 0-184 83.2-184 184S411.2 696 512 696 696 612.8 696 512 612.8 328 512 328z m0 320c-75.2 0-136-60.8-136-136s60.8-136 136-136 136 60.8 136 136-60.8 136-136 136z"
            p-id="5116"></path>
          <path
            d="M857.6 572.8c-20.8-12.8-33.6-35.2-33.6-60.8s12.8-46.4 33.6-60.8c14.4-9.6 20.8-27.2 16-44.8-8-27.2-19.2-52.8-32-76.8-8-14.4-25.6-24-43.2-19.2-24 4.8-48-1.6-65.6-19.2-17.6-17.6-24-41.6-19.2-65.6 3.2-16-4.8-33.6-19.2-43.2-24-14.4-51.2-24-76.8-32-16-4.8-35.2 1.6-44.8 16-12.8 20.8-35.2 33.6-60.8 33.6s-46.4-12.8-60.8-33.6c-9.6-14.4-27.2-20.8-44.8-16-27.2 8-52.8 19.2-76.8 32-14.4 8-24 25.6-19.2 43.2 4.8 24-1.6 49.6-19.2 65.6-17.6 17.6-41.6 24-65.6 19.2-16-3.2-33.6 4.8-43.2 19.2-14.4 24-24 51.2-32 76.8-4.8 16 1.6 35.2 16 44.8 20.8 12.8 33.6 35.2 33.6 60.8s-12.8 46.4-33.6 60.8c-14.4 9.6-20.8 27.2-16 44.8 8 27.2 19.2 52.8 32 76.8 8 14.4 25.6 22.4 43.2 19.2 24-4.8 49.6 1.6 65.6 19.2 17.6 17.6 24 41.6 19.2 65.6-3.2 16 4.8 33.6 19.2 43.2 24 14.4 51.2 24 76.8 32 16 4.8 35.2-1.6 44.8-16 12.8-20.8 35.2-33.6 60.8-33.6s46.4 12.8 60.8 33.6c8 11.2 20.8 17.6 33.6 17.6 3.2 0 8 0 11.2-1.6 27.2-8 52.8-19.2 76.8-32 14.4-8 24-25.6 19.2-43.2-4.8-24 1.6-49.6 19.2-65.6 17.6-17.6 41.6-24 65.6-19.2 16 3.2 33.6-4.8 43.2-19.2 14.4-24 24-51.2 32-76.8 4.8-17.6-1.6-35.2-16-44.8z m-56 92.8c-38.4-6.4-76.8 6.4-104 33.6-27.2 27.2-40 65.6-33.6 104-17.6 9.6-36.8 17.6-56 24-22.4-30.4-57.6-49.6-97.6-49.6-38.4 0-73.6 17.6-97.6 49.6-19.2-6.4-38.4-14.4-56-24 6.4-38.4-6.4-76.8-33.6-104-27.2-27.2-65.6-40-104-33.6-9.6-17.6-17.6-36.8-24-56 30.4-22.4 49.6-57.6 49.6-97.6 0-38.4-17.6-73.6-49.6-97.6 6.4-19.2 14.4-38.4 24-56 38.4 6.4 76.8-6.4 104-33.6 27.2-27.2 40-65.6 33.6-104 17.6-9.6 36.8-17.6 56-24 22.4 30.4 57.6 49.6 97.6 49.6 38.4 0 73.6-17.6 97.6-49.6 19.2 6.4 38.4 14.4 56 24-6.4 38.4 6.4 76.8 33.6 104 27.2 27.2 65.6 40 104 33.6 9.6 17.6 17.6 36.8 24 56-30.4 22.4-49.6 57.6-49.6 97.6 0 38.4 17.6 73.6 49.6 97.6-6.4 19.2-14.4 38.4-24 56z"
            p-id="5117"></path>
        </svg>
  <span v-if="!isMobile && !compact" class="function-name">设置</span>
      </span>
    </button>

    

    <!-- 问题反馈弹窗组件 -->
    <FeedbackDialog
      :visible="showFeedbackDialog"
      :trigger-rect="triggerRect"
      @close="hideFeedbackDialog"
      @open-bug-report="openBugReport"
      @open-suggestion="openSuggestion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, toRefs } from 'vue'
import FeedbackDialog from '@/components/FeedbackDialog.vue'

const props = withDefaults(defineProps<{
  userInitials: string
  compact?: boolean
}>(), {
  compact: false
})

const { compact } = toRefs(props)
const emit = defineEmits(['userInfo', 'deviceManager'])

// 移动端检测
const isMobile = ref(false)

// 主题切换逻辑（独立于主页面）
const theme = ref('light')
const setTheme = (t: 'light' | 'dark') => {
  theme.value = t
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('theme', t)
}
const toggleTheme = () => {
  setTheme(theme.value === 'light' ? 'dark' : 'light')
}

// 问题反馈弹窗控制
const showFeedbackDialog = ref(false)
const feedbackContainer = ref<HTMLElement>()
const triggerRect = ref<DOMRect>()

// 检测是否为移动端设备
const checkIsMobile = () => {
  const mobileBreakpoint = 769 // 768px以下认为是移动端
  isMobile.value = window.innerWidth < mobileBreakpoint
}

// 显示问题反馈弹窗
const showFeedbackDialogFunc = () => {
  if (feedbackContainer.value) {
    triggerRect.value = feedbackContainer.value.getBoundingClientRect()
  }
  showFeedbackDialog.value = true
}

// 隐藏问题反馈弹窗
const hideFeedbackDialog = () => {
  showFeedbackDialog.value = false
  triggerRect.value = undefined
}

// 打开Bug反馈链接
const openBugReport = () => {
  window.open('http://192.168.10.106:13000/apps/gMMaZPjScjMUhGuIHO/public-forms/c8ws75xwlhc', '_blank')
}

// 打开功能建议链接
const openSuggestion = () => {
  window.open('http://192.168.10.106:13000/apps/gMMaZPjScjMUhGuIHO/public-forms/m1wwmhj9hxq', '_blank')
}

// 组件挂载时检测移动端
onMounted(() => {
  checkIsMobile()
  // 监听窗口大小变化
  window.addEventListener('resize', checkIsMobile)
  // 初始化主题
  setTheme(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light')
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
})
</script>

<style scoped>
.user-panel {
  padding: 8px;
  background-color: var(--bg-color-secondary);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  /* 添加按钮之间的间距 */
}

.user-panel--compact .user-center-btn {
  justify-content: center;
  padding: 0 8px;
}

.user-panel--compact .user-center-content {
  justify-content: center;
  gap: 0;
}


.user-center-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  background: var(--bg-color-secondary);
  border: none;
  cursor: pointer;
  padding: 0 16px;
  
  height: 44px;
  width: 100%;
  transition: background 0.18s, color 0.18s;
  color: var(--text-color-secondary);
  font-size: var(--font-size-base);
}

.user-center-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.user-center-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.user-center-btn .icon {
  color: inherit;
  font-size: var(--font-size-base);
  fill: var(--text-color-secondary);
}

.user-center-btn:hover .icon {
  fill: var(--color-primary);
}

.user-center-btn:hover svg {
  stroke: var(--color-primary);
}

.user-center-btn .function-name {
  font-weight: 500;
  color: inherit;
  font-size: var(--font-size-base);
}

/* 移动端样式 */
@media (max-width: 768px) {
  .user-center-btn {
    justify-content: center;
    gap: 0;
    padding: 0 12px;
  }

  .user-center-content {
    justify-content: center;
    gap: 0;
  }

  .user-center-btn .icon {
    justify-content: center;
  }
}

/* 问题反馈容器样式 */
.feedback-container {
  position: relative;
  width: 100%;
}
</style>
