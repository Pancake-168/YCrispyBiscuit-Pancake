
import { API_URLS } from "@/apiUrls";
import { useWechatStore } from "@/stores/wechat";


//已使用
// 创建房间 post请求
export async function CreateRoom(invitees: string[], room_name?: string, room_topic?: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;


    const body = {
        invitees: invitees,
        room_name: room_name || "",
        room_topic: room_topic || ""
    };

    try {
        const res = await fetch(API_URLS.CreateIMRoom(), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => null);
        return { ok: res.ok, data };
    } catch (error) {
        console.error('CreateIMRoom 报错:', error);
        return { ok: false, data: null };
    }
}
