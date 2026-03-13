<script setup lang="ts">
/**
 * 此文件作为bodies计算式组件，与bodypage平级存在
 * 
 * 1. 鉴于此组件是为了非首页的页面存在，且这些页面的样式完全一致，所以该组件作为一个统一的样式容器存在
 * 2. 顶部一个大图片作为背景，文字靠右贴在图片上面
 * 3. 下方正文分左右两部分，左边作为正文导航目录，右边为正文，类似各种技术性网站的文档页面，目录也是依据markdown文本进行跳转
 * 4. 该组件的内容通过插槽传入，其内容格式为markdown文本
 */



import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import MarkdownIt from 'markdown-it';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import DOMPurify from 'dompurify';

import body1Md from './content/OPC一人公司.md?raw';
import body2Md from './content/存量信息系统的AI化改造.md?raw';
import body3Md from './content/全新AI系统定制.md?raw';

const props = withDefaults(defineProps<{
    titleid?: number
}>(), {
    titleid: 1
});

export interface contentItem {
    text1: string;
    text2: string;
    img: string;
}

const { t } = useI18n();

const topImage1 = new URL('../../../assets/YanJingAI2/yanjingai2-body-top.webp', import.meta.url).href;
const topImage2 = new URL('../../../assets/YanJingAI2/yanjingai2-body2-top.webp', import.meta.url).href;
const topImage3 = new URL('../../../assets/YanJingAI2/yanjingai2-body3-top.webp', import.meta.url).href;

const bodyData = computed<Record<number, contentItem & { img: string }>>(() => ({
    1: {
        text1: t('YanJingAI2.bodies.body1.text1'),
        text2: t('YanJingAI2.bodies.body1.text2'),
        img: topImage1
    },
    2: {
        text1: t('YanJingAI2.bodies.body2.text1'),
        text2: t('YanJingAI2.bodies.body2.text2'),
        img: topImage2
    },
    3: {
        text1: t('YanJingAI2.bodies.body3.text1'),
        text2: t('YanJingAI2.bodies.body3.text2'),
        img: topImage3
    }
}));

const currentBody = computed<contentItem & { img: string }>(() => {
    const fallback = bodyData.value[1]!
    return bodyData.value[props.titleid] ?? fallback
});


const markdownSource = computed(() => {
    const map: Record<number, string> = {
        1: body1Md,
        2: body2Md,
        3: body3Md
    };
    return map[props.titleid] ?? body1Md;
});

type TocItem = {
    id: string;
    text: string;
    level: number;
    prefix?: string;
};

const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    typographer: true
}).use(markdownItHighlightjs);

const parsed = computed(() => {
    const source = markdownSource.value ?? '';
    if (!source.trim()) {
        return {
            html: '',
            toc: [] as TocItem[]
        };
    }

    const tokens = md.parse(source, {});
    const slugCounts = new Map<string, number>();
    const toc: TocItem[] = [];

    const createSlug = (text: string) => {
        const base = text
            .toLowerCase()
            .trim()
            .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
            .replace(/\s+/g, '-');
        const count = slugCounts.get(base) ?? 0;
        slugCounts.set(base, count + 1);
        return count === 0 ? base : `${base}-${count}`;
    };

    for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i];
        if (token.type === 'heading_open') {
            const level = Number(token.tag.slice(1));
            const title = tokens[i + 1]?.content ?? '';
            const match = title.match(/^\s*([0-9]+\.?|[①②③④⑤⑥⑦⑧⑨⑩])\s+/);
            const prefix = match?.[1];
            const cleanTitle = match
                ? title.replace(/^\s*([0-9]+\.?|[①②③④⑤⑥⑦⑧⑨⑩])\s+/, '')
                : title;
            const id = createSlug(title || `section-${i}`);
            token.attrSet('id', id);
            toc.push({ id, text: cleanTitle || title, level, prefix });
        }
    }

    const html = md.renderer.render(tokens, md.options, {});
    return {
        html: DOMPurify.sanitize(html),
        toc
    };
});

const getScrollContainer = () => {
    const container = document.querySelector('.YanJingAI2') as HTMLElement | null;
    if (container && container.scrollHeight > container.clientHeight + 1) {
        return container;
    }
    return document.scrollingElement;
};

const forceScrollTop = async () => {
    await nextTick();
    const container = getScrollContainer();
    const run = () => {
        if (container && container !== document.scrollingElement) {
            container.scrollTop = 0;
        }
        if (document.scrollingElement) {
            document.scrollingElement.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    };
    run();
    requestAnimationFrame(run);
    setTimeout(run, 60);
};

const findHeading = (id: string, tries = 20) => new Promise<HTMLElement | null>((resolve) => {
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

const scrollToHeading = async (id: string) => {
    const target = await findHeading(id);
    if (!target) return;
    const container = getScrollContainer();
    const headerOffset = 72;
    if (container && container !== document.scrollingElement) {
        const containerTop = container.getBoundingClientRect().top;
        const targetTop = target.getBoundingClientRect().top;
        container.scrollTo({
            top: container.scrollTop + (targetTop - containerTop) - headerOffset,
            behavior: 'smooth'
        });
    } else {
        const top = window.scrollY + target.getBoundingClientRect().top - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
};

const onTocClick = (id: string) => {
    void scrollToHeading(id);
    isTocOpen.value = false;
};

const isTocOpen = ref(false);

const toggleToc = () => {
    isTocOpen.value = !isTocOpen.value;
};

const closeToc = () => {
    isTocOpen.value = false;
};

onMounted(() => {
    void forceScrollTop();
});

watch(() => props.titleid, () => {
    void forceScrollTop();
});


</script>













<template>
    <div id="bodies" class="session1">
        <div class="session11">
            <div class="session111">
                <div class="text111">
                    <p v-if="currentBody.text1">{{ currentBody.text1 }}</p>
                    <p v-if="currentBody.text2">{{ currentBody.text2 }}</p>
                </div>
                <img class="img111" :src="currentBody.img" alt="body top image" />
            </div>
        </div>
    </div>


    <div class="session2">

        <div class="session21" :class="{ 'toc-open': isTocOpen }">
            <div class="toc">
                <div class="toc-title">目录</div>
                <ul class="toc-list">
                    <li v-for="item in parsed.toc" :key="item.id" :class="['toc-item', `toc-level-${item.level}`]">
                        <a class="toc-link" :href="`#${item.id}`" @click.prevent="onTocClick(item.id)">
                            <span v-if="item.prefix" class="toc-prefix">{{ item.prefix }}</span>
                            <span class="toc-text">{{ item.text }}</span>
                        </a>
                    </li>
                </ul>
                <div v-if="parsed.toc.length === 0" class="toc-empty">暂无目录</div>
            </div>
        </div>
        <div class="toc-fab" @click="toggleToc">目录</div>
        <div v-if="isTocOpen" class="toc-mask" @click="closeToc"></div>
        <div class="session22">
            <div class="markdown-content" v-html="parsed.html"></div>
        </div>
    </div>

</template>






<style scoped src="./bodypage.css"></style>