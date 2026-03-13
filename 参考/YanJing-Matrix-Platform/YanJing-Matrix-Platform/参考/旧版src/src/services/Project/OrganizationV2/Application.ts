import { API_URLS } from "@/apiUrls";
import { useWechatStore } from "@/stores/wechat";
import type { GetApplicationBotResponse, GetApplicationUserResponse, GetDatasetResponse } from "@/types/application";
import { updateIDmap } from "@/services/SSO/UserInfo";

const PAGE_SIZE = 20;

//已使用
// 创建组织应用
export async function CreateOrganizationApplicationMarket(name: string) {

    const params = {
        display_name: name
    }

    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    try {
        const res = await fetch(API_URLS.CreateOrganizationApplicationMarket(), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(params)
        });
        const data = await res.json();

        console.log('[Application] CreateOrganizationApplicationMarket API result:', res.ok, data);

        return { ok: res.ok, data };
    } catch (error) {
        console.error('V2版创建组织应用:', error);
        return { ok: false, data: null };
    }
}



// v2创建应用市场应用
export async function CreateApplicationMarket(name: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';


    const body = {
        display_name: name
    };

    try {
        const res = await fetch(API_URLS.CreateApplicationMarket(), {
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
        console.error('CreateApplicationMarket 报错:', error);
        return { ok: false, data: null };
    }
}
















// 注册bot post请求
export async function ApplicationRegisterBot(appid: string, nickname: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    // TODO: 后端字段未定，这里预留 body
    const body = {
        nickname: nickname
    };

    try {
        const res = await fetch(API_URLS.ApplicationRegisterBot(appid), {
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
        console.error('ApplicationRegisterBot 报错:', error);
        return { ok: false, data: null };
    }
}

// 获取bot信息 get请求（分页查询，全量拉取）
// 已使用
export async function GetApplicationBot(appid: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    const fetchPage = async (page: number) => {
        try {
            const res = await fetch(API_URLS.GetApplicationBot(appid, page, PAGE_SIZE), {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) return { ok: false, data: null };
            const data = (await res.json().catch(() => null)) as GetApplicationBotResponse | null;
            return { ok: true, data };
        } catch (error) {
            console.error('GetApplicationBot fetchPage 报错:', error);
            return { ok: false, data: null };
        }
    };

    try {
        const first = await fetchPage(1);
        if (!first.ok || !first.data) return { ok: false, data: first.data };

        const firstPage: any = first.data;
        let allData = Array.isArray(firstPage?.data) ? [...firstPage.data] : [];
        const totalPage = Number(firstPage?.meta?.totalPage ?? 1);

        if (totalPage > 1) {
            const promises: Array<Promise<{ ok: boolean; data: any }>> = [];
            for (let p = 2; p <= totalPage; p++) {
                promises.push(fetchPage(p));
            }

            const results = await Promise.all(promises);
            results.forEach(r => {
                const items = Array.isArray(r.data?.data) ? r.data.data : [];
                if (items.length) allData = allData.concat(items);
            });
        }

        return {
            ok: true,
            data: {
                ...firstPage,
                data: allData,
                meta: {
                    ...(firstPage?.meta || {}),
                    page: 1,
                    totalPage: 1,
                    count: allData.length
                }
            }
        };
    } catch (error) {
        console.error('GetApplicationBot 报错:', error);
        return { ok: false, data: null };
    }
}

// Bot token post请求
// 已使用
export async function ApplicationBotToken(appid: string, bot_id: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';
    try {
        const res = await fetch(API_URLS.ApplicationBotToken(appid, bot_id), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },

        });
        const rawText = await res.text().catch(() => '');
        if (!rawText) return { ok: res.ok, data: null };
        try {
            const data = JSON.parse(rawText);
            return { ok: res.ok, data };
        } catch {
            return { ok: res.ok, data: rawText };
        }
    } catch (error) {
        console.error('ApplicationBotToken 报错:', error);
        return { ok: false, data: null };
    }
}




//已使用
// user用户 get请求（分页查询，全量拉取）
export async function GetApplicationUser(appid: string): Promise<{ ok: boolean; data: GetApplicationUserResponse | null }> {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    const fetchPage = async (page: number) => {
        try {
            const res = await fetch(API_URLS.GetApplicationUser(appid, page, PAGE_SIZE), {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) return { ok: false, data: null };
            const data = (await res.json().catch(() => null)) as GetApplicationUserResponse | null;
                return { ok: true, data };
        } catch (error) {
            console.error('GetApplicationUser fetchPage 报错:', error);
            return { ok: false, data: null };
        }
    };

    try {
        const first = await fetchPage(1);
        if (!first.ok || !first.data) return { ok: false, data: first.data };

        const firstPage: any = first.data;
        let allData = Array.isArray(firstPage?.data) ? [...firstPage.data] : [];
        const totalPage = Number(firstPage?.meta?.totalPage ?? 1);

        if (totalPage > 1) {
            const promises: Array<Promise<{ ok: boolean; data: any }>> = [];
            for (let p = 2; p <= totalPage; p++) {
                promises.push(fetchPage(p));
            }

            const results = await Promise.all(promises);
            results.forEach(r => {
                const items = Array.isArray(r.data?.data) ? r.data.data : [];
                if (items.length) allData = allData.concat(items);
            });
        }

        // 返回前：同步更新本地 IDmap（按 username）
        try {
            const usernames = allData
                .map((u: any) => u?.username)
                .filter((u: any) => typeof u === 'string' && u.length > 0) as string[];

            await Promise.all(usernames.map((u) => updateIDmap(u)));
        } catch (error) {
            // 不抛错，避免影响其他程序运行
            console.error('GetApplicationUser updateIDmap 报错:', error);
        }


        console.log("___________________________________________________[GetApplicationUser] allData:", allData);
          
        return {
            ok: true,
            data: {
                ...firstPage,
                data: allData,
                meta: {
                    ...(firstPage?.meta || {}),
                    page: 1,
                    totalPage: 1,
                    count: allData.length
                }
            } as GetApplicationUserResponse
        };
    } catch (error) {
        console.error('GetApplicationUser 报错:', error);
        return { ok: false, data: null };
    }
}




//已使用
//邀请加入应用 post请求
//返回值为null是正确的
export async function Acceptinvitation(appid: string,username:string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    console.log('Acceptinvitation 参数:', appid, username);
    try {
        const res = await fetch(API_URLS.Acceptinvitation(appid, username), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        return { ok: res.ok };
    } catch (error) {
        console.error('Acceptinvitation 报错:', error);
        return { ok: false, data: null };
    }
}






//已使用
// 后端同步函数 post请求
// 有事没事调一下
//返回值为null是正确的
export async function ApplicationSync(appid: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    try {
        const res = await fetch(API_URLS.ApplicationSync(appid), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },

        });

        return { ok: res.ok };
    } catch (error) {
        console.error('ApplicationSync 报错:', error);
        return { ok: false, data: null };
    }
}




















// GetDataset获取数据（分页查询，全量拉取）
export async function GetDataset(appid: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    const fetchPage = async (page: number) => {
        try {
            const res = await fetch(API_URLS.GetDataset(appid, page, PAGE_SIZE), {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) return { ok: false, data: null };
            const data = (await res.json().catch(() => null)) as GetDatasetResponse | null;
            return { ok: true, data };
        } catch (error) {
            console.error('GetDataset fetchPage 报错:', error);
            return { ok: false, data: null };
        }
    };

    try {
        const first = await fetchPage(1);
        if (!first.ok || !first.data) return { ok: false, data: first.data };

        const firstPage: any = first.data;
        let allData = Array.isArray(firstPage?.data) ? [...firstPage.data] : [];
        const totalPage = Number(firstPage?.meta?.totalPage ?? 1);

        if (totalPage > 1) {
            const promises: Array<Promise<{ ok: boolean; data: any }>> = [];
            for (let p = 2; p <= totalPage; p++) {
                promises.push(fetchPage(p));
            }

            const results = await Promise.all(promises);
            results.forEach(r => {
                const items = Array.isArray(r.data?.data) ? r.data.data : [];
                if (items.length) allData = allData.concat(items);
            });
        }

        return {
            ok: true,
            data: {
                ...firstPage,
                data: allData,
                meta: {
                    ...(firstPage?.meta || {}),
                    page: 1,
                    totalPage: 1,
                    count: allData.length
                }
            }
        };
    } catch (error) {
        console.error('GetDataset 报错:', error);
        return { ok: false, data: null };
    }
}

// 创建Dataset post请求
export async function CreateDataset(appid: string, name: string, description: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';


    const body = {
        name: name,
        description: description
    };

    try {
        const res = await fetch(API_URLS.CreateDataset(appid), {
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
        console.error('CreateDataset 报错:', error);
        return { ok: false, data: null };
    }
}

// 创建asset post请求
export async function CreateAsset(appid: string, name: string, description: string, type: string, dataset_id: number) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken || '';

    const body = {
        name: name,
        description: description,
        type: type,
        dataset_id: dataset_id
    };

    try {
        const res = await fetch(API_URLS.CreateAsset(appid), {
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
        console.error('CreateAsset 报错:', error);
        return { ok: false, data: null };
    }
}








