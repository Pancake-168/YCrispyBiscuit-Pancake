<template>
    <!-- 顶部导航栏外层，负责固定和背景 -->
    <div class="header-nav">
        <!-- 内容居中和最大宽度限制 -->
        <div class="header-content">
            <!-- 左侧 logo 和网站名，点击跳转主页 -->
            <div class="logo-area" @click="goHome">
                <img src="/logo.svg" alt="logo" class="logo" />
                <span class="site-name">YCrispBiscuit-Tools</span>
            </div>
            <!-- 右侧导航菜单 -->
            <n-menu mode="horizontal" :options="menuOptions" :value="activeMenu" @update:value="handleMenuChange"
                class="nav-menu" />
            <!-- 最右侧主题切换（无button） -->
            <div class="theme-switch" @click="toggleTheme">
                <n-icon size="22">
                    <template v-if="isDark"> <moon-outline /> </template>
                    <template v-else> <sunny-outline /> </template>
                </n-icon>
                <span class="theme-label">{{ isDark ? '暗色' : '亮色' }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// 引入 vue 的 ref、computed 响应式API
import { ref, computed } from 'vue'
// 引入 vue-router 的路由跳转API
import { useRouter, useRoute } from 'vue-router'
// 引入 naive-ui 的菜单和图标组件
import { NMenu, NIcon } from 'naive-ui'
// 引入太阳和月亮图标（用于主题切换）
import { SunnyOutline as sunnyOutline, MoonOutline as moonOutline } from '@vicons/ionicons5'
// 引入全局主题store（Pinia）
import { useAppStore } from '@/stores/app'

// 创建路由实例，用于页面跳转
const router = useRouter()
// 获取当前路由信息
const route = useRoute()
// 获取全局主题store实例
const appStore = useAppStore();

// 顶部导航栏菜单配置，包含三个页面
const menuOptions = [
    { label: '主页', key: '/' }, // 首页
    { label: '工具', key: '/Tools' }, // 工具页
    { label: '文档', key: '/Documentations' },// 文档页
    { label: '关于', key: '/About' }, // 关于页
]

// 当前激活的菜单项，初始为当前路由路径
const activeMenu = ref(route.path)

// 菜单切换事件，切换菜单时更新激活项并跳转路由
function handleMenuChange(key: string) {
    activeMenu.value = key // 更新激活菜单
    router.push(key) // 跳转到对应页面
}
// 点击logo跳转主页
function goHome() {
    router.push('/') // 跳转到首页
}
// 切换主题（黑白）
function toggleTheme() {
    appStore.toggleTheme() // 调用全局store切换主题
}
// 计算属性，判断当前是否为暗色主题
const isDark = computed(() => appStore.isDark)
</script>

<style scoped>
/* 顶部导航栏外层，固定在页面顶部，宽度100vw，z-index保证悬浮，背景和文字色用全局变量，支持主题切换 */
.header-nav {
    position: fixed;
    /* 固定定位 */
    top: 0;
    /* 顶部 */
    left: 0;
    /* 左侧 */
    width: 100vw;
    /* 占满屏幕宽度 */
    z-index: 1000;
    /* 悬浮在最上层 */
    background: var(--bg-color);
    /* 背景色跟随主题 */
    color: var(--text-color);
    /* 文字色跟随主题 */
    backdrop-filter: blur(12px);
    /* 高斯模糊 */
    box-shadow: 0 10px 10px 0 rgba(0, 0, 0, 0.04);
    /* 阴影 */
    opacity: 0.75;
    /* 整体半透明，内容和背景一起变淡 */
}

/* 内容区域，居中显示，最大宽度1200px，左右padding，flex布局 */
.header-content {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    justify-content: space-between;
    /* 两端对齐 */
    max-width: 1200px;
    /* 最大宽度 */
    margin: 0 auto;
    /* 居中 */
    height: 64px;
    /* 高度 */
    padding: 0 32px;
    /* 左右内边距 */
    width: 100%;
    /* 占满父容器 */
    box-sizing: border-box;
    /* 包含内边距 */
}

/* logo和网站名区域，点击可跳转主页 */
.logo-area {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    cursor: pointer;
    /* 鼠标手型 */
    user-select: none;
    /* 禁止选中 */
}

/* logo图片样式，圆角，右侧有间距 */
.logo {
    width: 36px;
    /* 宽度 */
    height: 36px;
    /* 高度 */
    margin-right: 10px;
    /* 右侧间距 */
    border-radius: 30%;
    /* 圆角 */
}

/* 网站名样式，加粗、字间距、主题色 */
.site-name {
    font-size: 1.4rem;
    /* 字号 */
    font-weight: bold;
    /* 加粗 */
    color: var(--text-color);
    /* 跟随主题 */
    letter-spacing: 2px;
    /* 字间距 */
}

/* 菜单区域，flex自适应宽度，左右有间距 */
.nav-menu {
    flex: 1;
    /* 占据剩余空间 */
    min-width: 320px;
    /* 最小宽度 */
    margin: 0 32px;
    /* 左右间距 */
    justify-content: flex-end;
    /* 菜单靠右 */
}


:deep(.n-menu) {
  --n-item-text-color: var(--text-color) !important;
  --n-item-text-color-active: var(--primary-color) !important;
  --n-item-text-color-hover: var(--primary-color) !important;
}


/* 主题切换区域，横向排列，鼠标手型，颜色跟随主题 */
.theme-switch {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    cursor: pointer;
    /* 鼠标手型 */
    color: var(--text-color-secondary);
    /* 次要文字色 */
    font-size: 1rem;
    /* 字号 */
    user-select: none;
    /* 禁止选中 */
    transition: color 0.2s;
    /* 颜色过渡 */
}

/* 主题切换悬停高亮主色 */
.theme-switch:hover {
    color: var(--color-primary);
}

/* 主题切换文字，左侧有间距 */
.theme-label {
    margin-left: 6px;
    /* 左间距 */
    font-size: 1rem;
    /* 字号 */
}
:deep(.theme-switch) {
    color: var(--text-color) !important;
    transition: color 0.2s;
}
/* 响应式：900px以下，缩小padding和字体、菜单宽度 */
@media (max-width: 900px) {
    .header-content {
        padding: 0 12px;
        /* 缩小内边距 */
    }

    .nav-menu {
        min-width: 180px;
        /* 菜单最小宽度变小 */
        margin: 0 8px;
        /* 左右间距变小 */
    }

    .site-name {
        font-size: 1rem;
        /* 网站名变小 */
    }
}

/* 响应式：600px以下，进一步缩小高度和logo、网站名 */
@media (max-width: 600px) {
    .header-content {
        height: 48px;
        /* 高度变小 */
    }

    .logo {
        width: 28px;
        /* logo变小 */
        height: 28px;
    }

    .site-name {
        font-size: 0.9rem;
        /* 网站名更小 */
    }
}
</style>
