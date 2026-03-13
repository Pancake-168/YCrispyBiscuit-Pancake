import { useAppStore } from "@/stores/app";
import { useLanguageStore } from "@/stores/language";

export async function startProject() {
    // 获取全局状态管理实例
    const appStore = useAppStore();

    // 获取全局语言管理实例
    const languageStore = useLanguageStore();






    console.log('[System] 项目初始化中...');

    // 0.显示加载状态
    appStore.setLoading(true);

    // 1.初始化主题
    appStore.initTheme();

    // 2.初始化语言
    await languageStore.initLanguage();















    // N.隐藏加载状态
    appStore.setLoading(false);
}