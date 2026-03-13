import { API_URLS } from "@/apiUrls";
import { useWechatStore } from "@/stores/WeChat";
import type { GetSSOUserInfoApiResponse } from "@/types/WeChat";

type RoomMembersResult = { ok: boolean; data: GetSSOUserInfoApiResponse[] | null }


type IMRoomServiceResult<T> = {
    ok: boolean;
    data: T | null;
};

const DM_ROOM_PAGE_SIZE = 20;

export type DMRoomType = 'uu' | 'ub';

export interface GetDMRoomItem {
    room_id: string;
    other_user: string;
    dm_type: DMRoomType;
}

export interface GetDMRoomMeta {
    count: number;
    page: number;
    pageSize: number;
    totalPage?: number;
    totalpage?: number;
}

export interface GetDMRoomResponse {
    data: GetDMRoomItem[];
    meta: GetDMRoomMeta;
}

export interface SendPrivateMessageResponse {
    event_id: string;
    room_id: string;
    to: string;
}

export interface GetPrivateRoomResponse {
    room_id: string;
    user: string;
    exists: boolean;
}

export interface GetRoomOtherUserResponse {
    user_id: string;
    openid: string;
    username: string;
    atype: string;
    nickname: string | null;
    display_name: string | null;
    avatar_url: string | null;
}

export interface AcceptRoomInviteResponse {
    room_id: string;
    inviter: unknown | null;
    inviter_atype: unknown | null;
    invited_atype: string | null;
    userbots_invited: boolean;
}





// V3版sso-获取IM用户信息-根据roomId获取房间成员的sso信息
export async function getRoomMembersBe(roomId: string): Promise<RoomMembersResult> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    if (!roomId) {
        console.warn('[System:UserInfo:getRoomMembersBe] roomId 不能为空');
        return { ok: false, data: null };
    }
    if (!token) {
        console.warn('[System:UserInfo:getRoomMembersBe] 没有 SSO loginToken，无法获取房间成员信息');
        return { ok: false, data: null };
    }


    const requestPromise = (async (): Promise<RoomMembersResult> => {
        try {
            const res = await fetch(API_URLS.getRoomMembersBe(roomId), {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!res.ok) {
                console.warn('[System:UserInfo:getRoomMembersBe] 获取房间成员信息失败:', res);
                return { ok: false, data: null };
            }

            const payload = (await res.json().catch(() => null)) as { data?: GetSSOUserInfoApiResponse[] | null } | null;
            const data = payload?.data ?? null;



            return { ok: true, data };
        } catch (error) {
            console.warn('[System:UserInfo:getRoomMembersBe] 接口异常:', error);
            return { ok: false, data: null };
        }
    })();


    return await requestPromise;
}


/**
 * 创建DM房间
 */
export async function CreateDMRoom(username: string): Promise<IMRoomServiceResult<GetPrivateRoomResponse>> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:IM:CreateDMRoom] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    if (!username) {
        console.warn('[System:IM:CreateDMRoom] 缺少用户名');
        return { ok: false, data: null };
    }

    try {
        const res = await fetch(API_URLS.CreateDMRoom(), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: username,
            })
        });
        const data = await res.json().catch(() => null) as GetPrivateRoomResponse | null;
        return { ok: res.ok, data };
    } catch (error) {
        console.warn('[System:IM:CreateDMRoom] 报错:', error);
        return { ok: false, data: null };
    }
}



// 获取DM房间列表 get
export async function GetDMRoom(): Promise<IMRoomServiceResult<GetDMRoomResponse>> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:IM:GetDMRoom] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    const fetchPage = async (page: number): Promise<{ ok: boolean; data: GetDMRoomResponse | null }> => {
        try {
            const res = await fetch(API_URLS.GetDMRooms(page, DM_ROOM_PAGE_SIZE), {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!res.ok) {
                console.warn(`[System:IM:GetDMRoom] 获取第 ${page} 页失败，状态码:`, res.status);
                return { ok: false, data: null };
            }

            const data = await res.json().catch(() => null) as GetDMRoomResponse | null;
            return { ok: true, data };
        } catch (error) {
            console.warn(`[System:IM:GetDMRoom] 获取第 ${page} 页报错:`, error);
            return { ok: false, data: null };
        }
    }

    try {
        const first = await fetchPage(1);
        if (!first.ok || !first.data) {
            return { ok: false, data: null };
        }

        const firstPage = first.data;
        const firstList = Array.isArray(firstPage.data) ? firstPage.data : [];
        let allRooms = [...firstList];

        const totalPage = Number(
            firstPage.meta?.totalPage
            ?? firstPage.meta?.totalpage
            ?? 1
        );

        if (totalPage > 1) {
            const promises: Array<Promise<{ ok: boolean; data: GetDMRoomResponse | null }>> = [];
            for (let page = 2; page <= totalPage; page++) {
                promises.push(fetchPage(page));
            }

            const results = await Promise.all(promises);
            results.forEach((result) => {
                const pageItems = Array.isArray(result.data?.data) ? result.data.data : [];
                if (pageItems.length) {
                    allRooms = allRooms.concat(pageItems);
                }
            });
        }

        return {
            ok: true,
            data: {
                ...firstPage,
                data: allRooms,
                meta: {
                    ...(firstPage.meta || { count: 0, page: 1, pageSize: DM_ROOM_PAGE_SIZE }),
                    page: 1,
                    pageSize: firstPage.meta?.pageSize ?? DM_ROOM_PAGE_SIZE,
                    count: allRooms.length,
                    totalPage: 1,
                    totalpage: 1,
                }
            }
        };
    } catch (error) {
        console.warn('[System:IM:GetDMRoom] 报错:', error);
        return { ok: false, data: null };
    }
}




/**
 * 发送私人信息，后端会以此为基础创建主房间
 */
export async function SendPrivateMessage(to_username: string, message: string): Promise<IMRoomServiceResult<SendPrivateMessageResponse>> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:IM:SendPrivateMessage] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    if (!to_username) {
        console.warn('[System:IM:SendPrivateMessage] 缺少用户名');
        return { ok: false, data: null };
    }

    try {
        const res = await fetch(API_URLS.SendPrivateMessage(), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: to_username,
                message,
            })
        });
        const data = await res.json().catch(() => null) as SendPrivateMessageResponse | null;
        return { ok: res.ok, data };
    } catch (error) {
        console.warn('[System:IM:SendPrivateMessage] 报错:', error);
        return { ok: false, data: null };
    }
}


// 获取那个privateRoom，意思是主房间，或者说联系人？ get
export async function GetPrivateRoom(username: string): Promise<IMRoomServiceResult<GetPrivateRoomResponse>> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:IM:GetPrivateRoom] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    if (!username) {
        console.warn('[System:IM:GetPrivateRoom] 缺少用户名');
        return { ok: false, data: null };
    }

    try {
        const res = await fetch(API_URLS.GetPrivateRoom(username), {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json().catch(() => null) as GetPrivateRoomResponse | null;
        return { ok: res.ok, data };
    } catch (error) {
        console.warn('[System:IM:GetPrivateRoom] 报错:', error);
        return { ok: false, data: null };
    }
}
// 获取房间内其他成员的信息 post
export async function GetRoomOtherUser(room_id: string): Promise<IMRoomServiceResult<GetRoomOtherUserResponse>> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:IM:GetRoomOtherUser] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    if (!room_id) {
        console.warn('[System:IM:GetRoomOtherUser] 缺少 room_id');
        return { ok: false, data: null };
    }

    try {
        const res = await fetch(API_URLS.GetRoomOtherUser(), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ room_id })
        });
        const data = await res.json().catch(() => null) as GetRoomOtherUserResponse | null;
        return { ok: res.ok, data };
    } catch (error) {
        console.warn('[System:IM:GetRoomOtherUser] 报错:', error);
        return { ok: false, data: null };
    }
}



// 强制后台某用户接受邀请进入房间 post
export async function AcceptRoomInvite(matrix_room_id: string): Promise<IMRoomServiceResult<AcceptRoomInviteResponse>> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    if (!token) {
        console.warn('[System:IM:AcceptRoomInvite] 缺少 SSO loginToken');
        return { ok: false, data: null };
    }

    if (!matrix_room_id) {
        console.warn('[System:IM:AcceptRoomInvite] 缺少 matrix_room_id');
        return { ok: false, data: null };
    }

    try {
        const res = await fetch(API_URLS.AcceptRoomInvite(), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ matrix_room_id })
        });
        const data = await res.json().catch(() => null) as AcceptRoomInviteResponse | null;
        return { ok: res.ok, data };
    } catch (error) {
        console.warn('[System:IM:AcceptRoomInvite] 报错:', error);
        return { ok: false, data: null };
    }
}