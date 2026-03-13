<template>
    <div class="Topmenu">

        <div class="div2" role="button" tabindex="0" title="返回主页面" @click="goHome" @keydown.enter="goHome">
            <div class="icon1">
                <img src='@/assets/YanJingAI2/研境LOGO@1x.webp' alt='logo' />
            </div>
        </div>


        <div class="div1" :class="{ 'mobile-active': isMenuOpen }">
            <div class="div11">
                <div class="div111" @click="scrollToSession('session2')">
                    <div class="text1">
                        {{ $t('YanJingAI2.Topmenu.text1') }}
                    </div>
                </div>
                 <div class="div115" @click="scrollToSession('session3')">
                    <div class="text5">
                        {{ $t('YanJingAI2.Topmenu.text5') }}
                    </div>
                </div>
                <div class="div112" @click="scrollToSession('session4')">
                    <div class="text2">
                        {{ $t('YanJingAI2.Topmenu.text2') }}
                    </div>
                </div>
                <div class="div113" @click="scrollToSession('session5')">
                    <div class="text3">
                        {{ $t('YanJingAI2.Topmenu.text3') }}
                    </div>
                </div>
                <div class="div114" @click="scrollToSession('session6')">
                    <div class="text4">
                        {{ $t('YanJingAI2.Topmenu.text4') }}
                    </div>
                </div>
               
                <!--div class="div116" @click="scrollToSession('session1')">
                    <div class="text6">
                        {{ $t('YanJingAI2.Topmenu.text6') }}
                    </div>
                </div-->
            </div>


            <div class="line">

            </div>


            <div class="div12">


                <div class="div121" @click="openMvp">
                    <div class="text7">
                        {{ $t('YanJingAI2.Topmenu.text7') }}
                    </div>
                </div>
                <div class="div122">
                    <div class="text8">
                        {{ $t('YanJingAI2.Topmenu.text8') }}
                    </div>
                </div>
                <div class="div123" @click="openGitHub">
                    <div class="text9">
                        {{ $t('YanJingAI2.Topmenu.text9') }}
                    </div>
                </div>

                <div class="div124" @click="Login()">
                    <div class="icon2">
                        <img src='@/assets/YanJingAI2/ICON@1x.webp' alt='logo' />

                    </div>
                    <div class="text10">
                        {{ $t('YanJingAI2.Topmenu.text10') }}
                    </div>
                </div>
            </div>
        </div>

        <div class="mobile-toggle" @click="toggleMenu">
            <div class="hamburger" :class="{ 'is-active': isMenuOpen }">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';
const isMenuOpen = ref(false);

const route = useRoute();
const router = useRouter();

const handleHashNavigation = async (rawHash?: string) => {
    const hash = rawHash ?? route.hash;
    if (!hash) return;
    const id = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!id) return;
    await scrollToSession(id, { keepHash: true });
};

watch(
    () => route.hash,
    async (hash) => {
        await handleHashNavigation(hash);
    },
    { immediate: true }
);

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
};

const waitForElement = (id: string, tries = 120) => new Promise<HTMLElement | null>((resolve) => {
    let count = 0;
    const check = () => {
        const el = document.getElementById(id);
        if (el || count >= tries) {
            resolve(el);
            return;
        }
        count += 1;
        requestAnimationFrame(check);
    };
    check();
});

const getScrollContainer = () => {
    const container = document.querySelector('.YanJingAI2') as HTMLElement | null;
    if (container && container.scrollHeight > container.clientHeight + 1) {
        return container;
    }
    return document.scrollingElement;
};

const headerOffset = 72;

const goHome = async () => {
    const query: LocationQueryRaw = { ...route.query };
    delete query.body;
    delete query.bodyId;

    await router.push({ path: '/', query });
    await nextTick();
    const container = getScrollContainer();
    if (container && container !== document.scrollingElement) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const scrollToElement = (element: HTMLElement) => {
    const container = getScrollContainer();
    if (container && container !== document.scrollingElement) {
        const containerTop = container.getBoundingClientRect().top;
        const targetTop = element.getBoundingClientRect().top;
        container.scrollTo({
            top: container.scrollTop + (targetTop - containerTop) - headerOffset,
            behavior: 'smooth'
        });
    } else {
        const top = window.scrollY + element.getBoundingClientRect().top - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
};

const scrollToSession = async (id: string, options?: { keepHash?: boolean }) => {
    isMenuOpen.value = false;
    const element = document.getElementById(id);
    if (element) {
        scrollToElement(element);
        return;
    }

    const query: LocationQueryRaw = { ...route.query };
    delete query.body;
    delete query.bodyId;

    const basePath = ['/opc', '/cua', '/custom'].includes(route.path) ? '/' : route.path;

    await router.push({
        path: basePath,
        query,
        hash: options?.keepHash ? `#${id}` : undefined
    });
    await nextTick();
    const target = await waitForElement(id);
    if (target) {
        scrollToElement(target);
    } else {
        const container = getScrollContainer();
        if (container && container !== document.scrollingElement) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
};

onMounted(() => {
    const handler = () => handleHashNavigation(window.location.hash);
    window.addEventListener('hashchange', handler);
    handler();
    onBeforeUnmount(() => {
        window.removeEventListener('hashchange', handler);
    });
});

const openMvp = () => {
    window.open('https://mvp.zheshu.tech', '_blank');
};

const openGitHub = () => {
    window.open('https://github.com/Region-AI', '_blank');
};

function Login() {
    router.push('/login');
}
</script>

<style scoped>
.Topmenu {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 64px;
    opacity: 1;

    /* 自动布局 */
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0px 48px;
    align-self: stretch;

    /* 白色 */
    background: #FFFFFF;

    box-sizing: border-box;
    /* 研境紫 */
    border-width: 0px 0px 1px 0px;
    border-style: solid;
    border-color: #BFA8FF;

    z-index: 1000;
}

@media (max-width: 768px) {
    .Topmenu {
        height: 56px;
        padding: 0px 16px; /* 增加一点呼吸感 */
    }

    .div2 {
        width: 100px; /* 移动端 Logo 容器变窄 */
    }

    .icon1 {
        width: 100px;
        height: 56px;
    }
}

.div2 {
    position: relative;
    width: 142px;
    height: 64px;
    opacity: 1;
    cursor: pointer;
}

.div2 :hover {
    opacity: 1.1;
}

.icon1 {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 128px;
    height: 128px; /* 稍微缩小高度容器，适应 64px 的 Header */
    opacity: 1;
    display: flex;
    align-items: center;
}

.icon1 img {
    width: 100%;
    height: 100%;
    object-fit: contain; /* 保证高分辨率 LOGO 完美缩放不失真 */
}

.div1 {
    /* 自动布局子元素 */
    opacity: 1;

    /* 自动布局 */
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    padding: 0px;
    gap: 32px;

    z-index: 1;
}

@media (max-width: 768px) {
    .div1 {
        position: fixed;
        top: 56px;
        left: 0;
        width: 100%;
        height: 100vh; /* 全屏遮罩高度 */
        flex-direction: column;
        background: rgba(255, 255, 255, 0.98); /* 稍微透明背景 */
        backdrop-filter: blur(10px);
        overflow-y: auto;
        transform: translateX(100%); /* 默认在右侧隐藏 */
        transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        padding: 40px 0;
        gap: 0;
        justify-content: flex-start;
        box-shadow: none;
        z-index: 1000;
        display: flex;
    }

    .div1.mobile-active {
        transform: translateX(0); /* 滑入 */
    }

    .line {
        display: none;
    }
}

.div11 {
    /* 自动布局子元素 */
    border-radius: 500px;
    opacity: 1;

    /* 自动布局 */
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px;
    gap: 32px;

    z-index: 0;
}

@media (max-width: 768px) {
    .div11 {
        flex-direction: column;
        width: 100%;
        gap: 8px;
        padding-bottom: 24px;
    }

    .div111, .div112, .div113, .div114, .div115, .div116 {
        width: 100%;
        padding: 20px 24px;
        justify-content: center;
        align-items: center; /* 增加对齐 */
        border-bottom: 1px solid rgba(0,0,0,0.03);
    }

    .text1, .text2, .text3, .text4, .text5, .text6 {
        font-size: 14px !important; /* 缩小两个等级 */
        font-weight: 500;
        text-align: center; /* 增加居中 */
    }
}

.line {
    /* 自动布局子元素 */
    width: 1px;
    height: 24px;
    opacity: 1;

    /* 研境紫 */
    background: #BFA8FF;

    z-index: 1;
}

.div12 {
    /* 自动布局子元素 */
    opacity: 1;

    /* 自动布局 */
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    padding: 0px;
    gap: 24px;

    z-index: 2;
}

@media (max-width: 768px) {
    .div12 {
        flex-direction: column;
        width: 100%;
        gap: 12px;
        margin-top: 0;
        padding-top: 24px;
        border-top: 1px solid rgba(0,0,0,0.05);
    }

    .div121, .div122, .div123 {
        width: 100%;
        padding: 12px 24px;
        justify-content: center;
    }

    .text7, .text8, .text9 {
        font-size: 12px !important;
        opacity: 0.7;
    }

    .div124 {
        margin: 24px 40px;
        height: 48px;
        justify-content: center;
        border-radius: 12px;
    }

    .text10 {
        font-size: 12px !important;
    }
}


.div111,
.div112,
.div113,
.div114,
.div115,
.div116 {
    opacity: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.div111:hover,
.div112:hover,
.div113:hover,
.div114:hover,
.div115:hover,
.div116:hover {
    opacity: 0.6;
    transform: translateY(-2px);
}

.text1,
.text2,
.text3,
.text4,
.text5,
.text6 {
    /* 自动布局子元素 */
    position: static;
    opacity: 1;

    font-family: MiSans;
    font-size: 13px;
    font-weight: 600;
    line-height: 120%;
    letter-spacing: 0.04em;

    font-variation-settings: "opsz" auto;
    font-feature-settings: "kern" on;
    /* 黑色 */
    color: #000000;

    z-index: 0;
}


.div121,
.div122,
.div123 {
    opacity: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.div121:hover,
.div122:hover,
.div123:hover {
    opacity: 0.6;
    transform: translateY(-2px);
}

.div124 {
    cursor: pointer;
    border-radius: 10px;
    opacity: 1;

    /* 自动布局 */
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0 16px;
    height: 40px;
    gap: 8px;

    /* 蓝紫渐变 */
    background: linear-gradient(90deg, #1A32B9 0%, #9A77FD 51%, #D398FF 100%);

    z-index: 3;
    transition: all 0.3s;
}

.div124:hover {
    box-shadow: 0px 4px 12px rgba(26, 50, 185, 0.3);
    transform: translateY(-1px);
}

.text7,
.text8,
.text9 {
    /* 自动布局子元素 */
    position: static;
    opacity: 1;

    font-family: MiSans;
    font-size: 13px;
    font-weight: normal;
    line-height: 120%;
    letter-spacing: 0.04em;

    font-variation-settings: "opsz" auto;
    font-feature-settings: "kern" on;
    /* 黑色 */
    color: #000000;

    z-index: 0;
}


.icon2 {
    width: 12px;
    height: 12px;
    opacity: 1;
    z-index: 1;
}

.text10 {
    opacity: 1;

    font-family: MiSans;
    font-size: 13px;
    font-weight: 600;
    line-height: 120%;
    letter-spacing: 0.04em;

    font-variation-settings: "opsz" auto;
    font-feature-settings: "kern" on;
    /* 白色 */
    color: #FFFFFF;

    z-index: 0;
}

/* 移动端菜单按钮 */
.mobile-toggle {
    display: none;
    cursor: pointer;
    z-index: 1001;
}

@media (max-width: 768px) {
    .mobile-toggle {
        display: block;
    }
}

.hamburger {
    width: 24px;
    height: 18px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.hamburger span {
    display: block;
    width: 100%;
    height: 2px;
    background-color: #333;
    border-radius: 2px;
    transition: all 0.3s ease;
}

.hamburger.is-active span:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
}

.hamburger.is-active span:nth-child(2) {
    opacity: 0;
}

.hamburger.is-active span:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
}
</style>
