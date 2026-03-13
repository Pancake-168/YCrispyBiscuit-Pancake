import { API_URLS } from '@/apiUrls';
import { useWechatStore } from "@/stores/WeChat";

type AgentSessionPayload = {
    username: string;
    name?: string;
    stateData?: Record<string, unknown>;
    other?: Record<string, unknown>;
};

export type CreateAgentSessionResponse = {
    id: number;
    session_id: string;
    agent: string;
    room: string;
    user: string;
    name: string;
    stateData?: Record<string, unknown>;
    other?: Record<string, unknown>;
    createdAt: string;
    createdById: number;
    updatedAt: string;
    updatedById: number;
} | null;

/**
 * AgentSession 相关接口
 * 
 * 什么是AgentSession？每个session就是一个房间，通常用于bot房间
 * 
 * 由于针对各种bot聊天都需要用到多任务模式，所以默认的主房间是dm房间，那么多任务列表呢？没错，就是AgentSession了
 */


// 创建AgentSession，也就是创建room，本质上是针对某个bot创建一个分任务的房间
export async function CreateAgentSession(
    appid: string,
    username: string,
    name: string = '',
    stateData: Record<string, unknown> = {},
    other: Record<string, unknown> = {}
): Promise<{ ok: boolean; data: CreateAgentSessionResponse }> {

    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:AgentSession:CreateAgentSession] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    if (!username) {
        console.warn('[System:AgentSession:CreateAgentSession] 缺少 username');
        return { ok: false, data: null };
    }

    if (!appid) {
        console.warn('[System:AgentSession:CreateAgentSession] 缺少 appid');
        return { ok: false, data: null };
    }

    const body: AgentSessionPayload = {
        username,
        name,
        stateData,
        other,
    };

    try {
        const res = await fetch(API_URLS.CreateAgentSession(appid), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => null) as CreateAgentSessionResponse;
        return { ok: res.ok, data };
    } catch (error) {
        console.warn('[System:AgentSession:CreateAgentSession] 报错:', error);
        return { ok: false, data: null };
    }
}



