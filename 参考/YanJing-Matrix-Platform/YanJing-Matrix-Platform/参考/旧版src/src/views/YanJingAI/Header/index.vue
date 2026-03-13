<template>
    <!-- 导航区域 -->
    <header class="header-section">
        <nav class="navbar">
            <div class="nav-container">
                <svg width="109" height="36" viewBox="0 0 109 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M42.9925 0.115736L38.2853 4.1197L38.0152 6.83272L38.009 6.89585L36.0954 6.90291L35.0121 15.057L37.7034 15.0471L37.6917 15.1276L37.1394 18.9238L37.1308 18.9838L34.5828 18.9932L32.9384 31.515L32.9305 31.5759L26.5579 31.5995L26.5677 31.5202L28.1395 19.0171L25.1625 19.0281L22.6011 31.5581L22.595 31.5883L22.5684 31.6042L15.3629 35.9168L15.2239 36L15.257 35.8423L18.7873 19.0517L16.8823 19.0588L16.8926 18.9793L17.3743 15.2538L17.3822 15.1926L19.5811 15.1845L21.2212 7.0282L18.7484 7.03747L18.7595 6.95718L19.3113 3.02063L19.3198 2.95999H19.3815L37.2051 2.96414L42.9135 0L42.9925 0.115736ZM98.3167 30.9631H91.4392L88.568 9.4437H86.5649L82.6255 19.8518H88.301L88.7016 24.212H80.8894L78.2853 30.9631H60.9916L61.9263 23.8603H60.3238L55.9837 31.4554L46.836 35.7453L54.715 23.8603H51.5101L52.8454 13.3819L72.4762 13.4522L71.074 23.8603H67.5352L67.2013 27.2359H72.8768L81.4235 6.41975L79.8879 4.6617H94.1768L98.3167 30.9631ZM105.528 30.9631H98.8509L101.856 6.41975L100.52 4.6617H109L105.528 30.9631ZM2.17847 3.16419L18.0378 3.24601L18.117 3.24642L18.1076 3.3245L17.6269 7.3311L17.6196 7.39285L12.8582 7.41057L10.2555 12.9004L16.8796 12.8759L16.8689 12.9555L14.5276 30.6698L14.5197 30.7307L2.19969 30.7764L2.20996 30.6968L3.57599 20.0917L0 20.105L0.0536815 20.002L6.60795 7.43369L3.74341 7.44435L3.75146 7.36654L4.0207 4.73452L2.13491 3.29003L1.96901 3.16322L2.17847 3.16419ZM50.3164 3.03115L49.3258 10.5451H51.1971L51.1838 10.6274L50.5832 14.3578L50.5735 14.4174H48.7729L47.527 23.3821L49.8973 22.8706L49.9955 22.8494L49.9828 22.9488L49.4488 27.1456L49.4426 27.1949L49.394 27.2059L38.7816 29.6039L38.6817 29.6265L38.6956 29.5253L39.2962 25.1287L39.303 25.0796L39.3514 25.069L41.4388 24.6132L42.8228 14.4174H40.6211L40.631 14.3377L41.0982 10.6073L41.106 10.5451H43.3746L44.0317 4.64052L42.8472 3.06437L42.7621 2.95099H50.327L50.3164 3.03115ZM9.31574 16.4871L9.30798 16.5487L8.00201 27.0925L7.9923 27.1715L9.90485 27.1645L9.91262 27.103L11.2186 16.5591L11.2283 16.4801L9.31574 16.4871ZM57.4526 21.188H65.8659L65.9993 19.7815H57.5862L57.4526 21.188ZM57.9201 17.4608H66.3332L66.5335 15.9137H58.1204L57.9201 17.4608ZM27.4794 6.86456L27.4684 6.92132L25.8706 15.1476L25.8548 15.2294L25.9385 15.2312L28.7706 15.291L28.8342 15.2922L28.8423 15.2299L29.9443 6.93516L29.9549 6.85542L27.4794 6.86456ZM73.7092 10.1133L73.5672 11.8145H51.8349L52.119 8.90835H56.3092L55.8831 7.13632H60.9255L61.4227 8.90835H64.7606L65.4708 7.13632H70.7974L70.0162 8.90835H73.3541L78.2545 6.4275L73.7092 10.1133ZM78.7228 0.81306L74.074 4.39216L73.8108 6.49465L73.803 6.55681H53.4366L53.4461 6.47748L53.7798 3.67974L53.7872 3.61717H60.6449L59.468 2.13323L59.3768 2.01846H67.3432L67.3368 2.09515L67.2097 3.61717H72.8557L78.6474 0.693724L78.7228 0.81306Z"
                        fill="var(--zkzs-accent-strong)" />
                </svg>


                <div class="nav-right">
                    <div class="nav-links">
                        <a :class="{ 'nav-link': true, active: props.activeNav === '首页' }"
                            @click="handleNavClick('首页')">首页</a>
                        <a :class="{ 'nav-link': true, active: props.activeNav === '产品' }"
                            @click="handleNavClick('产品')">产品</a>
                        <a :class="{ 'nav-link': true, active: props.activeNav === '开发者与生态' }"
                            @click="handleNavClick('开发者与生态')">开发者与生态</a>
                        <a :class="{ 'nav-link': true, active: props.activeNav === '企业定制' }"
                            @click="handleNavClick('企业定制')">企业定制</a>
                        <a :class="{ 'nav-link': true, active: props.activeNav === '关于我们' }"
                            @click="handleNavClick('关于我们')">关于我们</a>
                    </div>
                    <button class="login-btn" @click="Login()">登录</button>
                </div>
            </div>
        </nav>
    </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import router from '@/router';

const props = defineProps<{ activeNav: string }>();
const emit = defineEmits<{
    (e: 'update:activeNav', nav: string): void;
    (e: 'navigate', section: string): void;
}>();

function handleScroll() {
    const sections = ['首页', '产品', '开发者与生态', '企业定制', '关于我们'];
    const sectionIds = ['首页', '产品', '开发者与生态', '企业定制', '关于我们'];

    for (let i = 0; i < sections.length; i++) {
        const element = document.getElementById(sectionIds[i]);
        if (element) {
            const rect = element.getBoundingClientRect();
            // 如果section的顶部在视窗顶部附近（考虑一些偏移）
            if (rect.top <= 100 && rect.bottom >= 100) {
                if (props.activeNav !== sections[i]) {
                    emit('update:activeNav', sections[i]);
                }
                break;
            }
        }
    }
}

function handleNavClick(sectionName: string) {
    emit('update:activeNav', sectionName);
    emit('navigate', sectionName);
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll);
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
})

function Login() {
    router.push('/login');
}
</script>

<style scoped>
/* ===== 导航区域 ===== */
.header-section {
    padding: 0;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10;
    background-color: var(--zkzs-bg-soft);
    border-bottom: 1px solid var(--zkzs-border-color);
    box-shadow: var(--zkzs-shadow);
    backdrop-filter: blur(10px);
}

/* 强制本组件内所有文本仅使用 HarmonyOS Sans SC */
.header-section,
.header-section * {
    font-family: HarmonyOS Sans SC !important;
}

.navbar {
    background-color: transparent;
    width: 100%;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo {
    height: 40px;
    width: auto;
    margin-left: -50px;
}

.nav-right {
    display: flex;
    align-items: center;
    gap: 48px;
}

.nav-links {
    display: flex;
    align-items: center;
    gap: 32px;
    padding-right: 40px;
    border-right: 1px solid var(--zkzs-border-color);
    /* 允许在窄屏时压缩并配合 overflow 滚动，避免把按钮挤窄 */
    flex: 1 1 auto;
    min-width: 0;
}

.nav-link {
    font-family: HarmonyOS Sans SC;
    font-size: 16px;
    font-weight: 500;
    color: var(--zkzs-text-secondary);
    text-decoration: none;
    transition: color 0.3s ease;
    position: relative;
    cursor: pointer;
}

.nav-link:hover,
.nav-link.active {
    color: var(--zkzs-accent);
}

.login-btn {
    background-color: var(--zkzs-accent-strong);
    color: var(--zkzs-text-inverse);
    font-family: HarmonyOS Sans SC;
    font-size: 14px;
    font-weight: 500;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
    /* 防止中文逐字换行，按钮不被压缩到极窄导致竖排 */
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    box-shadow: 0 6px 18px rgba(122, 107, 198, 0.24);
}

.login-btn:hover {
    background-color: var(--zkzs-accent-hover);
    box-shadow: 0 10px 24px rgba(122, 107, 198, 0.26);
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
    .nav-container {
        max-width: 100%;
        padding: 12px 12px;
        /* 缩小左右内边距，避免拥挤 */
        gap: 28px;
    }

    .logo,
    svg[width="127"][height="36"] {
        width: 100px;
        /* 缩小 LOGO，使头部更紧凑 */
        height: auto;
    }

    .nav-right {
        gap: 16px;
    }

    .nav-links {
        gap: 16px;
        padding-right: 0;
        /* 移除右分隔，降低拥挤感 */
        border-right: none;
        overflow-x: auto;
        /* 链接过多时可横向滚动 */
        -webkit-overflow-scrolling: touch;
    }

    .nav-link {
        font-size: 14px;
    }

    .login-btn {
        padding: 6px 10px;
        font-size: 13px;
    }
}

/* 更小屏幕（如 360px）进一步收紧 */
@media (max-width: 380px) {
    .nav-container {
        padding: 10px 10px;
    }

    .login-btn {
        padding: 6px 10px;
        font-size: 12px;
    }
}
</style>
