import { API_URLS } from "@/apiUrls";
import { useWechatStore } from "@/stores/wechat";
import {useUserBotStore} from "@/stores/UserBot";
import { updateIDmap } from "@/services/SSO/UserInfo";
import { useIDmapStore } from "@/stores/IDmap";


/**
 * 获取个人助手
 */
export async function GetUserBot() {

    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    try {
        const res = await fetch(API_URLS.GetUserBot(), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        const data = await res.json();

        console.log('[UserBot] GetUserBot API result:', res.ok, data);

        const userBotStore = useUserBotStore();
        const idmapStore = useIDmapStore();
        if (res.ok && data) {
            // 同步更新 ID 映射
            await updateIDmap(data?.username);
            await  userBotStore.setUserBot(idmapStore.getByUsername(data?.username));
        } else {
            userBotStore.clearUserBot();
        }

        return { ok: res.ok, data };
    } catch (error) {
        console.error('V2版获取个人助手失败:', error);
        
        const userBotStore = useUserBotStore();
        userBotStore.clearUserBot();

        return { ok: false, data: null };
    }
}