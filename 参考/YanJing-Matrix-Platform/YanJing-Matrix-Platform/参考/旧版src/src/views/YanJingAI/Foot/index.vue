<template>
    <div class="footer" id="关于我们">
        <div class="foot-content">
            <div class="foot1">
                <div class="foot11">
                    <svg width="109" height="36" viewBox="0 0 109 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M42.9925 0.115736L38.2853 4.1197L38.0152 6.83272L38.009 6.89585L36.0954 6.90291L35.0121 15.057L37.7034 15.0471L37.6917 15.1276L37.1394 18.9238L37.1308 18.9838L34.5828 18.9932L32.9384 31.515L32.9305 31.5759L26.5579 31.5995L26.5677 31.5202L28.1395 19.0171L25.1625 19.0281L22.6011 31.5581L22.595 31.5883L22.5684 31.6042L15.3629 35.9168L15.2239 36L15.257 35.8423L18.7873 19.0517L16.8823 19.0588L16.8926 18.9793L17.3743 15.2538L17.3822 15.1926L19.5811 15.1845L21.2212 7.0282L18.7484 7.03747L18.7595 6.95718L19.3113 3.02063L19.3198 2.95999H19.3815L37.2051 2.96414L42.9135 0L42.9925 0.115736ZM98.3167 30.9631H91.4392L88.568 9.4437H86.5649L82.6255 19.8518H88.301L88.7016 24.212H80.8894L78.2853 30.9631H60.9916L61.9263 23.8603H60.3238L55.9837 31.4554L46.836 35.7453L54.715 23.8603H51.5101L52.8454 13.3819L72.4762 13.4522L71.074 23.8603H67.5352L67.2013 27.2359H72.8768L81.4235 6.41975L79.8879 4.6617H94.1768L98.3167 30.9631ZM105.528 30.9631H98.8509L101.856 6.41975L100.52 4.6617H109L105.528 30.9631ZM2.17847 3.16419L18.0378 3.24601L18.117 3.24642L18.1076 3.3245L17.6269 7.3311L17.6196 7.39285L12.8582 7.41057L10.2555 12.9004L16.8796 12.8759L16.8689 12.9555L14.5276 30.6698L14.5197 30.7307L2.19969 30.7764L2.20996 30.6968L3.57599 20.0917L0 20.105L0.0536815 20.002L6.60795 7.43369L3.74341 7.44435L3.75146 7.36654L4.0207 4.73452L2.13491 3.29003L1.96901 3.16322L2.17847 3.16419ZM50.3164 3.03115L49.3258 10.5451H51.1971L51.1838 10.6274L50.5832 14.3578L50.5735 14.4174H48.7729L47.527 23.3821L49.8973 22.8706L49.9955 22.8494L49.9828 22.9488L49.4488 27.1456L49.4426 27.1949L49.394 27.2059L38.7816 29.6039L38.6817 29.6265L38.6956 29.5253L39.2962 25.1287L39.303 25.0796L39.3514 25.069L41.4388 24.6132L42.8228 14.4174H40.6211L40.631 14.3377L41.0982 10.6073L41.106 10.5451H43.3746L44.0317 4.64052L42.8472 3.06437L42.7621 2.95099H50.327L50.3164 3.03115ZM9.31574 16.4871L9.30798 16.5487L8.00201 27.0925L7.9923 27.1715L9.90485 27.1645L9.91262 27.103L11.2186 16.5591L11.2283 16.4801L9.31574 16.4871ZM57.4526 21.188H65.8659L65.9993 19.7815H57.5862L57.4526 21.188ZM57.9201 17.4608H66.3332L66.5335 15.9137H58.1204L57.9201 17.4608ZM27.4794 6.86456L27.4684 6.92132L25.8706 15.1476L25.8548 15.2294L25.9385 15.2312L28.7706 15.291L28.8342 15.2922L28.8423 15.2299L29.9443 6.93516L29.9549 6.85542L27.4794 6.86456ZM73.7092 10.1133L73.5672 11.8145H51.8349L52.119 8.90835H56.3092L55.8831 7.13632H60.9255L61.4227 8.90835H64.7606L65.4708 7.13632H70.7974L70.0162 8.90835H73.3541L78.2545 6.4275L73.7092 10.1133ZM78.7228 0.81306L74.074 4.39216L73.8108 6.49465L73.803 6.55681H53.4366L53.4461 6.47748L53.7798 3.67974L53.7872 3.61717H60.6449L59.468 2.13323L59.3768 2.01846H67.3432L67.3368 2.09515L67.2097 3.61717H72.8557L78.6474 0.693724L78.7228 0.81306Z"
                            fill="var(--zkzs-accent-strong)" />
                    </svg>

                </div>
                <div class="foot12">
                    研境AI为每个组织与成员构建专属智能体，在保障信息边界的同时，自动处理数据、洞察业务、让团队从重复事务中解放，专注创造与决策。
                </div>
            </div>
            <div class="foot2">
                <div class="foot21">
                    <div class="foot211">关于我们</div>
                    <div class="foot212" @click="handleClick('首页')">首页</div>
                    <div class="foot212" @click="handleClick('产品')">产品</div>
                    <div class="foot212" @click="handleClick('开发者与生态')">开发者与生态</div>
                    <div class="foot212" @click="handleClick('企业定制')">企业定制</div>
                </div>
                <div class="foot21">
                    <div class="foot211">快速入口</div>
                    <div class="foot212">研境AI</div>
                    <div class="foot212">中科浙数</div>
                </div>
                <div class="foot21">
                    <div class="foot211">联系方式</div>
                    <div class="foot212">邮箱</div>
                    <div class="foot212">电话</div>
                    <div class="foot212">地址</div>
                </div>
            </div>
        </div>
        <div class="Line"></div>
           <div class="foot-foot">
            <div class="foot-foot1">© 2025 中科浙数 <br />
                <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">浙ICP备2025201674号</a>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'navigate', section: string): void }>();

function handleClick(section: string) {
    emit('navigate', section);
}
</script>

<style scoped>
.footer {
    --footer-bg: var(--zkzs-bg-soft);
    --footer-text: var(--zkzs-text-main);
    --footer-text-strong: var(--zkzs-text-main);
    --footer-text-weak: var(--zkzs-text-muted);
    --footer-accent: var(--zkzs-accent);
    --footer-accent-soft: var(--zkzs-accent-muted);
    --footer-border: var(--zkzs-border-color);
    background-color: var(--footer-bg);
    border-top: 1px solid var(--footer-border);
    padding: 48px 20px 24px;
    color: var(--footer-text);
}

/* 字体强制为 HarmonyOS Sans SC（不使用后备字体） */
.footer,
.footer * {
    font-family: "HarmonyOS Sans SC" !important;
}

.foot-content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.4fr 2fr;
    /* 左logo/文案 + 右导航列 */
    gap: 32px;
    align-items: start;
}

.foot1 {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.foot11 svg {
    display: block;
    height: 36px;
    width: auto;
}

.foot12 {
    font-size: 0.95rem;
    line-height: 1.8;
    color: var(--footer-text-weak);
}

.foot2 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
}

.foot21 {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.foot211 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--footer-text-strong);
}

.foot212 {
    font-size: 0.95rem;
    color: var(--footer-text);
    cursor: pointer;
    user-select: none;
    transition: color 0.2s ease, transform 0.15s ease;
}

.foot212:hover {
    color: var(--footer-accent);
    transform: translateX(2px);
}

.foot212:active {
    transform: translateX(1px);
}

.foot212:focus-visible {
    outline: 2px solid var(--footer-accent-soft);
    outline-offset: 2px;
    border-radius: 4px;
}

.Line {
    max-width: 1200px;
    margin: 28px auto 16px;
    height: 1px;
    background: var(--footer-border);
}

/* 底部版权区 */
.foot-foot {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 24px 28px;
    text-align: center;
    /* 底部小字居中 */
}

.foot-foot1 {
    color: var(--muted);
    font-size: clamp(12px, 1.2vw, 13px);
    line-height: 1.7;
    word-break: break-word;
}

.foot-foot1 a {
    color: inherit;
    text-decoration: none;
    display: inline-block;
    padding: 2px 4px;
    border-radius: 4px;
    transition: color 0.2s ease, background-color 0.2s ease;
}

.foot-foot1 a:hover,
.foot-foot1 a:focus-visible {
    color: var(--accent);
    background-color: color-mix(in srgb, var(--accent) 12%, transparent);
    text-decoration: none;
}

/* 响应式优化 */
@media (max-width: 992px) {
    .foot-content {
        grid-template-columns: 1fr;
        /* 改为上下结构 */
        gap: 24px;
    }

    .foot2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px 24px;
    }
}

@media (max-width: 768px) {
    .footer {
        padding: 32px 16px 20px;
    }

    .foot11 svg {
        height: 32px;
    }

    .foot12 {
        font-size: 1rem;
        /* 移动端略增可读性 */
        line-height: 1.7;
    }

    .foot2 {
        grid-template-columns: 1fr;
        /* 单列更利于阅读/点击 */
    }

    /* 将每一大类内部改为横向排列，自动换行；标题独占一行 */
    .foot21 {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 10px;
        /* 行间距/列间距 */
    }

    .foot21 .foot211 {
        flex: 0 0 100%;
        /* 标题单独占一行 */
        margin-bottom: 4px;
    }

    .foot211 {
        font-size: 1rem;
    }

    .foot212 {
        font-size: 1rem;
    }

    .foot-foot {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    /* 底部这两项在移动端分两行显示 */
    .foot-foot2 {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }
}
</style>