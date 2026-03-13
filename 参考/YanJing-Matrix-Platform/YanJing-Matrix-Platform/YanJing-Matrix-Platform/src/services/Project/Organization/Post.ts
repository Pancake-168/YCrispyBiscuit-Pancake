import { API_URLS } from "@/apiUrls";
import { useWechatStore } from "@/stores/WeChat";
import type { FetchPostUsersV2ApiResponse, FetchPostUsersV2Result } from "@/types/Organization";

const PAGE_SIZE = 40;

/**
 * 获取指定职位（Post）下的人员列表
 * 对应 API: GetOrganizationPostV2 
 */
//已使用
export async function FetchPostUsersV2(appid: string, postId: number) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    // 内部函数：获取单层页面
    const fetchPage = async (page: number): Promise<FetchPostUsersV2ApiResponse | null> => {
        const res = await fetch(API_URLS.GetOrganizationPostV2(appid, postId, page, PAGE_SIZE), {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            console.warn(`[System:Post:FetchPostUsersV2] HTTP error! status: ${res.status}`);
            return null;
        }
        return (await res.json().catch(() => null)) as FetchPostUsersV2ApiResponse | null;
    };

    try {
        const first = await fetchPage(1);
        if (!first) return { ok: false, data: null } satisfies FetchPostUsersV2Result;

        // 新返回结构：{ data: { ...post, users: [...] }, meta: { page... } }
        if (!first.data || !Array.isArray(first.data.users)) {
            return { ok: false, data: null } satisfies FetchPostUsersV2Result;
        }

        let allUsers = [...first.data.users];
        const totalPage = Number(first.meta?.totalPage ?? 1);

        if (totalPage > 1) {
            const promises = [];
            for (let p = 2; p <= totalPage; p++) {
                promises.push(fetchPage(p));
            }
            const results = await Promise.all(promises);
            results.forEach(res => {
                const userData = res?.data?.users;
                if (Array.isArray(userData)) allUsers = allUsers.concat(userData);
            });
        }

        // 归一化：保持新结构，但将 users 聚合为全量；meta 也同步为单页
        const normalized: FetchPostUsersV2ApiResponse = {
            data: {
                ...first.data,
                users: allUsers
            },
            meta: {
                ...(first.meta || { count: 0, totalPage: 1, pageSize: PAGE_SIZE, page: 1 }),
            page: 1,
            totalPage: 1,
            count: allUsers.length
            }
        };

        return { ok: true, data: normalized } satisfies FetchPostUsersV2Result;

    } catch (error) {
        console.warn('[System:Post:FetchPostUsersV2] 报错:', error);
        return { ok: false, data: null } satisfies FetchPostUsersV2Result;
    }
}

//已使用
// 创建组织 post请求
export async function CreateOrganizationPostV2(appid: string, name: string, description: string, parentId: number) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;


    const body = {
        name: name,
        description: description,
        parentId: parentId
    };

    try {
        const res = await fetch(API_URLS.CreateOrganizationPostV2(appid), {
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
        console.warn('[System:Post:CreateOrganizationPostV2] 报错:', error);
        return { ok: false, data: null };
    }
}

// 更新组织 put请求
export async function UpdateOrganizationPostV2(appid: string, id: number, name: string, description: string, users: unknown[]) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;


    const body = {
        name: name,
        description: description,
        users: users
    };

    console.log('[System:Post:UpdateOrganizationPostV2] 参数:', appid, id, body);
    try {
        const res = await fetch(API_URLS.UpdateOrganizationPostV2(appid, id), {
            method: 'PUT',
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
        console.warn('[System:Post:UpdateOrganizationPostV2] 报错:', error);
        return { ok: false, data: null };
    }
}

//已使用
// 删除组织 delete请求
export async function DeleteOrganizationPostV2(appid: string,id: number) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    

    try {
        const res = await fetch(API_URLS.DeleteOrganizationPostV2(appid, id), {
            method: 'DELETE',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        const data = await res.json().catch(() => null);
        return { ok: res.ok, data };
    } catch (error) {
        console.warn('[System:Post:DeleteOrganizationPostV2] 报错:', error);
        return { ok: false, data: null };
    }
}




