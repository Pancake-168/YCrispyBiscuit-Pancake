
import { API_URLS } from "@/apiUrls";
import { useWechatStore } from "@/stores/WeChat";

type CreateRoomResponse = {
    room_id?: string;
} | null;

type InviteUsersResponse = {
    room_id?: string;
    invited?: number;
} | null;

type KickUsersResponse = {
    room_id?: string;
    kicked?: number;
} | null;

type LeaveRoomResponse = {
    room_id?: string;
    left?: number;
} | null;


//已使用
// 创建房间 post请求
export async function CreateRoom(invitees: string[], room_name?: string, room_topic?: string): Promise<{ ok: boolean; data: CreateRoomResponse }> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:CreateRoom:CreateRoom] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    const body = {
        invitees: invitees,
        room_name: room_name || "",
        room_topic: room_topic || ""
    };

    try {
        const res = await fetch(API_URLS.CreateRoom(), {
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
        console.warn('[System:CreateRoom:CreateRoom] 报错:', error);
        return { ok: false, data: null };
    }
}



export async function InviteUsers(room_id: string, invitees: string[]): Promise<{ ok: boolean; data: InviteUsersResponse }> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:CreateRoom:InviteUsers] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    const body = {
        room_id,
        invitees,
    };

    try {
        const res = await fetch(API_URLS.InviteUsers(), {
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
        console.warn('[System:CreateRoom:InviteUsers] 报错:', error);
        return { ok: false, data: null };
    }
}

export async function KickUsers(room_id: string, usernames: string[]): Promise<{ ok: boolean; data: KickUsersResponse }> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:CreateRoom:KickUsers] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    const body = {
        room_id,
        usernames,
    };

    try {
        const res = await fetch(API_URLS.KickUsers(), {
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
        console.warn('[System:CreateRoom:KickUsers] 报错:', error);
        return { ok: false, data: null };
    }
}

export async function LeaveRoom(room_id: string): Promise<{ ok: boolean; data: LeaveRoomResponse }> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:CreateRoom:LeaveRoom] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    const body = {
        room_id,
    };

    try {
        const res = await fetch(API_URLS.LeaveRoom(), {
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
        console.warn('[System:CreateRoom:LeaveRoom] 报错:', error);
        return { ok: false, data: null };
    }
}