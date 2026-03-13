import { defineStore } from 'pinia';
import { ref, computed } from 'vue';


export const useUserBotStore = defineStore('userBot', () => {
    const userBot = ref<any>(null);

    const hasUserBot = computed(() => {
        return userBot.value !== null;
    });

    function setUserBot(botData: any) {
        userBot.value = botData;
        console.log('[UserBot Store] 设置个人助手:', botData);
    }

    function clearUserBot() {
        userBot.value = null;
    }

    return {
        userBot,
        hasUserBot,
        setUserBot,
        clearUserBot,
    };
});