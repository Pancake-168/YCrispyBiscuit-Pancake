<template>
  <div class="main-container">

    <!-- 侧边抽屉 -->
    <n-drawer v-model:show="drawerVisible" :width="300" placement="left" :auto-focus="false">
      <n-drawer-content title="几何背景风格选择">
        <n-list>
          <n-list-item v-for="(style, index) in styles" :key="style.name" clickable @click="selectStyle(index)"
            :class="{ 'selected': currentIndex === index }">
            <template #prefix>
              <n-icon :component="style.icon" />
            </template>
            <n-thing :title="style.name" :description="style.description" />
          </n-list-item>
        </n-list>
      </n-drawer-content>
    </n-drawer>

    <!-- 主内容区域 -->
    <div class="content-area">
      <!-- 顶部控制栏 -->
      <div class="control-bar">



        <n-button type="primary" @click="goBack">返回工具页</n-button>

        <n-button @click="drawerVisible = true" type="primary">
          <template #icon>
            <n-icon :component="Menu" />
          </template>
          选择风格
        </n-button>
        <div class="current-style">
          当前风格: {{ styles[currentIndex].name }}
        </div>
      </div>

      <!-- 动态背景组件 -->
      <component :is="currentComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NDrawer, NDrawerContent, NList, NListItem, NButton, NIcon, NThing } from 'naive-ui'
import { MenuOutline as Menu } from '@vicons/ionicons5'

// 导入所有背景组件
import ParticleNetwork from './styles/ParticleNetwork.vue'
import PaperPolyhedra from './styles/PaperPolyhedra.vue'
import LineNetwork from './styles/LineNetwork.vue'
import CellNetwork from './styles/3DCellNetwork.vue'


// 风格配置
const styles = [
  {
    name: '动态粒子',
    description: '动态粒子通过线段连接，形成网络结构',
    component: ParticleNetwork,
    icon: Menu
  },
  {
    name: '纸片多面体',
    description: '三维空间中的纸片多面体，旋转翻转移动',
    component: PaperPolyhedra,
    icon: Menu
  },

  {
    name: '移动直线网络',
    description: '超长直线随机移动，产生动态交点',
    component: LineNetwork,
    icon: Menu
  },
  {
    name: '3D细胞网络',
    description: '超大型3D细胞组织结构，自转的云状网络',
    component: CellNetwork,
    icon: Menu
  }
]

// 状态管理
const router = useRouter()
const drawerVisible = ref(false)
const currentIndex = ref(0)

// 当前组件
const currentComponent = computed(() => styles[currentIndex.value].component)

// 选择风格
function selectStyle(index: number) {
  currentIndex.value = index
  drawerVisible.value = false
}

function goBack() {
  router.push('/Tools')
}
</script>

<style scoped>
.main-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  /* 真实的星云背景渐变 - 充满气态尘埃的暖色调，自然过渡 */
  background: linear-gradient(135deg,
      #f08080 0%,
      #cd5c5c 25%,
      #daa520 50%,
      #db7093 75%,
      #dda0dd 100%);
  /* 添加一些星点和尘埃效果 */
  background-image:
    radial-gradient(3px 3px at 20px 30px, #daa520, transparent),
    radial-gradient(2px 2px at 40px 70px, #cd5c5c, transparent),
    radial-gradient(1px 1px at 90px 40px, #f0e68c, transparent),
    radial-gradient(2px 2px at 130px 80px, #dda0dd, transparent),
    radial-gradient(3px 3px at 160px 30px, #f08080, transparent),
    linear-gradient(135deg,
      #f08080 0%,
      #cd5c5c 25%,
      #daa520 50%,
      #db7093 75%,
      #dda0dd 100%);
}


.content-area {
  position: relative;
  width: 100%;
  height: 100%;
}

.control-bar {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.current-style {
  color: white;
  font-size: 16px;
  font-weight: 500;
}

.selected {
  background-color: rgba(24, 160, 88, 0.1);
  border-left: 3px solid #18a058;
}

/* 美化抽屉样式 */
:deep(.n-drawer) {
  --n-color: rgba(255, 255, 255, 0.95);
  --n-border-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 0 20px 20px 0;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

:deep(.n-drawer-content) {
  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(20px);
  border-radius: 0 20px 20px 0;
}

:deep(.n-drawer-header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 24px;
  background: linear-gradient(90deg,
      rgba(240, 128, 128, 0.1) 0%,
      rgba(218, 165, 32, 0.1) 100%);
  border-radius: 0 20px 0 0;
}

:deep(.n-drawer-header__title) {
  color: #2c1810;
  font-weight: 600;
  font-size: 18px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

:deep(.n-list) {
  padding: 16px;
}

:deep(.n-list-item) {
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px 20px;
}

:deep(.n-list-item:hover) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

:deep(.n-list-item__prefix) {
  margin-right: 12px;
}

:deep(.n-list-item.selected) {
  background: linear-gradient(90deg,
      rgba(240, 128, 128, 0.3) 0%,
      rgba(218, 165, 32, 0.3) 100%);
  border: 2px solid rgba(218, 165, 32, 0.5);
  box-shadow: 0 0 20px rgba(218, 165, 32, 0.3);
}

:deep(.n-thing-title) {
  color: #2c1810;
  font-weight: 500;
  font-size: 15px;
}

:deep(.n-thing-description) {
  color: #8b4513;
  font-size: 13px;
  margin-top: 4px;
}

:deep(.n-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  background: linear-gradient(135deg,
      rgba(240, 128, 128, 0.8) 0%,
      rgba(218, 165, 32, 0.8) 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(240, 128, 128, 0.3);
}

:deep(.n-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 128, 128, 0.4);
  background: linear-gradient(135deg,
      rgba(240, 128, 128, 0.9) 0%,
      rgba(218, 165, 32, 0.9) 100%);
}

:deep(.n-button:active) {
  transform: translateY(0);
}

/* 美化控制栏 */
.control-bar {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  padding: 12px 24px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.current-style {
  color: #2c1810;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}
</style>