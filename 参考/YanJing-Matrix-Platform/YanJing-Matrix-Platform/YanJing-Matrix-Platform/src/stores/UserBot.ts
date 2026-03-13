import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { IDMapUser } from '@/types/IDmap';

export const useUserBotStore = defineStore('userBot', () => {
    const userBot = ref<IDMapUser | null>(null);

    const hasUserBot = computed(() => {
        return userBot.value !== null;
    });

    function setUserBot(botData: IDMapUser | null | undefined) {
        userBot.value = botData ?? null;
        console.log('[System:UserBot:setUserBot] 设置个人助手:', botData);
    }

    function clearUserBot() {
        userBot.value = null;
        console.log('[System:UserBot:clearUserBot] 清空个人助手');
    }

    return {
        userBot,
        hasUserBot,
        setUserBot,
        clearUserBot,
    };
});