import { createI18n } from 'vue-i18n'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import en from '@/language/en-US'
import zh from '@/language/zh-CN'
import { getSetting, setSetting } from '@/utils/storage'
import { SystemStorageManager } from '@/utils/SystemStorage'
import type { UserConfig } from '@/types/UserConfig'
import { UpdateUserConfig } from '@/services/Project/UserConfig'

// 语言资源表（注册时扩展）
const messages: Record<string, typeof en> = {
    'en-US': en,
    'zh-CN': zh
}

// 默认语言：浏览器语言优先，回退到 'en-US' 或 'zh-CN'
const defaultLanguage = (typeof navigator !== 'undefined' ? navigator.language : 'zh-CN')

// i18n 实例（仍以默认导出形式提供，供 main.ts 使用）
const i18n = createI18n({
    legacy: false,
    locale: defaultLanguage,
    fallbackLocale: 'zh-CN',
    messages
})

/**
 * Pinia Store: language
 * 提供直观的语言管理 API：getLanguageList / setLanguage / cycleLanguage / initLanguage
 * 注意：不包含任何“用户上传语言”的功能
 */
export const useLanguageStore = defineStore('language', () => {

    const currentLanguage = ref<string>((i18n.global.locale as unknown as { value: string }).value ?? defaultLanguage)

    function getLanguageList(): string[] {
        return Object.keys(messages)
    }

    async function setLanguage(lang: string): Promise<boolean> {
        const list = getLanguageList()
        console.log('[System:Language:setLanguage] 可以使用的语言列表:', list)
        if (!list.includes(lang)) {
            console.warn(`[System:Language:setLanguage] "${lang}" 没有注册。可用的语言有: ${list.join(', ')}`)
            return false
        }

        const globalInstance = (i18n.global as unknown as { locale: { value: string } | string })
        if (typeof globalInstance.locale === 'object' && 'value' in globalInstance.locale) {
            globalInstance.locale.value = lang
        } else {
            (globalInstance as unknown as { locale: string }).locale = lang
        }

        try {
            await setSetting('locale', lang)
            const localConfig = await SystemStorageManager.getUserConfig<UserConfig>()
            const nextConfig: UserConfig = { ...(localConfig ?? {}), language: lang }
            await SystemStorageManager.setUserConfig(nextConfig)
            await UpdateUserConfig(nextConfig)
        } catch {
            // ignore storage errors
        }

        currentLanguage.value = lang
        return true
    }

    async function cycleLanguage() {
        const list = getLanguageList()
        if (list.length <= 1) return
        const idx = Math.max(0, list.indexOf(currentLanguage.value))
        // 使用非空断言，列表不为空且索引合法时 next 一定为 string
        const next = list[(idx + 1) % list.length]!
        await setLanguage(next)
    }

    async function initLanguage() {
        try {
            const saved = await getSetting<string>('locale')
            if (saved && getLanguageList().includes(saved)) {
                await setLanguage(saved)
            } else {
                // 使用 i18n 的当前语言（可能源自浏览器或默认设置）
                const globalInstance = (i18n.global as unknown as { locale: { value: string } | string })
                const detected = (typeof globalInstance.locale === 'object' ? globalInstance.locale.value : globalInstance.locale) || defaultLanguage
                await setLanguage(detected)
            }
        } catch {
            const globalInstance = (i18n.global as unknown as { locale: { value: string } | string })
            const detected = (typeof globalInstance.locale === 'object' ? globalInstance.locale.value : globalInstance.locale) || defaultLanguage
            await setLanguage(detected)
        }
    }

    return {
        currentLanguage,
        getLanguageList,
        setLanguage,
        cycleLanguage,
        initLanguage
    }
})

export default i18n
