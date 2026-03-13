import { API_URLS } from "@/apiUrls";
import { useWechatStore } from "@/stores/WeChat";
import { useOrganizationStore } from "@/stores/Organization";
import { useIDmapStore } from "@/stores/IDmap";
import type { IDMapUser, IDMapUserType } from "@/types/IDmap";
import type { GetIMUserInfoApiResponse} from "@/types/WeChat";


/**
 * 返回个人信息
 */

export async function UserInfo() {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    if (!token) {
        console.log('[System:UserInfo:UserInfo] 没有 SSO loginToken，无法获取用户信息')
        return null
    }

    try {
        const res = await fetch(API_URLS.UserInfo(), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!res.ok) {
            console.warn('[System:UserInfo:UserInfo] 获取用户信息失败，状态码:', res.status);
            return { ok: false, data: null };
        }

        const data = await res.json();

        // 存入 wechatStore 内部
        if (data) {
            wechatStore.setUserProfile(data);


            console.log('[System:UserInfo:UserInfo] UserInfo 接口数据:', data);



            // 同步到 Organization Store
            if (data.apps) {
                const orgStore = useOrganizationStore();
                orgStore.setOrganizationList(data.apps);
            }

        }

        return { ok: true, data };
    } catch (error) {
        // 报错也能正常运行，不干扰其他程序
        console.error('[System:UserInfo:UserInfo] UserInfo 接口异常:', error);
        return { ok: false, data: null };
    }

}









//已使用
// V3版sso-一个更改个人信息的接口
export async function userdetail(nickname: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';
    const body = {
        nickname: nickname
    }
    try {
        const res = await fetch(API_URLS.userdetail(), {
            method: 'PUT',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)

        });

        const userProfile = wechatStore.userProfile;
        if (userProfile && res.ok) {
            userProfile.nickname = nickname;
            wechatStore.setUserProfile(userProfile);
        }
        return { ok: res.ok };
    } catch (error) {
        console.error('userdetail 报错:', error);
        return { ok: false, data: null };
    }
}











//已使用
// V3版sso-获取IM用户信息
export async function GetIMUserInfo(username: string): Promise<{ ok: boolean; data: GetIMUserInfoApiResponse | null }> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    try {
        const res = await fetch(API_URLS.GetIMUserInfo(username), {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!res.ok) {
            console.warn('获取IM用户信息失败，状态码:', res.status);
            return { ok: false, data: null };
        }

        const data = (await res.json().catch(() => null)) as GetIMUserInfoApiResponse | null;
        if (data) {
            await updateIDmapInGetIMUserInfo(data);
        }
        return { ok: true, data };
    } catch (error) {
        console.warn('GetIMUserInfo 接口异常:', error);
        return { ok: false, data: null };
    }
}


// 新增：按 username 更新本地 IDmap（命中则跳过，未命中则拉取并写入 Pinia）
export async function updateIDmap(username: string): Promise<void> {
    try {
        if (!username) return;

        const idmapStore = useIDmapStore();
        const exists = idmapStore.getByUsername(username);
        if (exists) return;

        const { ok, data } = await GetIMUserInfo(username);
        if (!ok || !data) return;

        const type: IDMapUserType = data.atype === 'bot' ? 'bot' : 'user';

        const user: IDMapUser = {
            username: data.username,
            matrixId: data.im,
            nickname: data.nickname,
            type
        };

        idmapStore.set(user);
    } catch (error) {
        // 不抛错，避免影响其他程序运行
        console.warn('updateIDmap 报错:', error);
    }
}



// 内部函数：将 GetIMUserInfo 拿到的数据直接更新本地 IDmap（不再二次调用接口，避免递归）
export async function updateIDmapInGetIMUserInfo(data: GetIMUserInfoApiResponse): Promise<void> {
    try {
        if (!data?.username || !data?.im) return;

        const idmapStore = useIDmapStore();
        const exists = idmapStore.getByUsername(data.username);
        if (exists) return;

        const type: IDMapUserType = data.atype === 'bot' ? 'bot' : 'user';

        const user: IDMapUser = {
            username: data.username,
            matrixId: data.im,
            nickname: data.nickname,
            type
        };

        idmapStore.set(user);
    } catch (error) {
        // 不抛错，避免影响其他程序运行
        console.warn('updateIDmapInGetIMUserInfo 报错:', error);
    }
}




