import { API_URLS } from "@/apiUrls";
import { useWechatStore } from "@/stores/WeChat";
import type { GetDepartmentChildrenV2ApiResponse, GetDepartmentsV2ApiResponse } from "@/types/Organization";





const PAGE_SIZE = 40;

/**
 * 获取组织下全量的平铺部门列表
 * (不传 department_id，返回 appid 所在组织的所有部门平铺列表)
 */
//已使用
export async function FetchAllDepartmentsV2(appid: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    const fetchPage = async (page: number): Promise<GetDepartmentsV2ApiResponse | null> => {
        const res = await fetch(API_URLS.GetDepartmentsV2(appid, page, PAGE_SIZE), {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            console.warn(`[System:department:FetchAllDepartmentsV2] HTTP error! status: ${res.status}`);
            return null;
        }
        return (await res.json().catch(() => null)) as GetDepartmentsV2ApiResponse | null;
    };

    try {
        const firstPage = await fetchPage(1);
        if (!firstPage || !firstPage.data) return { ok: false, data: firstPage };

        let allData = [...firstPage.data];
        const totalPage = firstPage.meta.totalPage;

        if (totalPage > 1) {
            const promises = [];
            for (let p = 2; p <= totalPage; p++) {
                promises.push(fetchPage(p));
            }
            const results = await Promise.all(promises);
            results.forEach(res => {
                if (res && res.data) {
                    allData = allData.concat(res.data);
                }
            });
        }

        // 返回后端原生格式，但 meta 修正为全量后的状态
        return {
            ok: true,
            data: {
                data: allData,
                meta: {
                    ...firstPage.meta,
                    page: 1,
                    totalPage: 1,
                    count: allData.length
                }
            }
        };
    } catch (error) {
        console.warn('[System:department:FetchAllDepartmentsV2] 报错:', error);
        return { ok: false, data: null };
    }
}

/**
 * 获取特定部门下的所有子部门和职位
 * (传入 department_id，返回该部门信息及其 child 内部的所有分页子集)
 */
//已使用
export async function FetchDepartmentChildrenAllV2(appid: string, departmentId: number) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    const fetchPage = async (page: number): Promise<GetDepartmentChildrenV2ApiResponse | null> => {
        const res = await fetch(API_URLS.GetDepartmentChildrenV2(appid, departmentId, page, PAGE_SIZE), {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            console.warn(`[System:department:FetchDepartmentChildrenAllV2] HTTP error! status: ${res.status}`);
            return null;
        }
        return (await res.json().catch(() => null)) as GetDepartmentChildrenV2ApiResponse | null;
    };

    try {
        const firstPage = await fetchPage(1);
        if (!firstPage || !firstPage.child) {
            return { ok: false, data: firstPage };
        }

        const departmentInfo = firstPage;
        let allChildren = [...(departmentInfo.child?.data || [])];
        const totalPage = departmentInfo.child?.meta?.totalPage || 1;

        if (totalPage > 1) {
            const promises = [];
            for (let p = 2; p <= totalPage; p++) {
                promises.push(fetchPage(p));
            }
            const results = await Promise.all(promises);
            results.forEach(res => {
                // 注意：分页请求的返回格式，也是直接返回对象
                const childData = res?.child?.data;
                if (childData) {
                    allChildren = allChildren.concat(childData);
                }
            });
        }

        // 深度复制并重组
        const result = JSON.parse(JSON.stringify(firstPage));

        // 防御性检查
        if (result.child) {
            result.child.data = allChildren;
            if (result.child.meta) {
                result.child.meta = {
                    ...departmentInfo.child.meta,
                    page: 1,
                    totalPage: 1,
                    count: allChildren.length
                };
            }
        }

        return {
            ok: true,
            data: result
        };
    } catch (error) {
        console.warn('[System:department:FetchDepartmentChildrenAllV2] 报错:', error);
        return { ok: false, data: null };
    }
}

//已使用
// 创建部门 post请求
export async function CreateDepartmentV2(appid: string, name: string, description: string, parentId: number) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    // TODO: 后端字段未定，这里预留 body
    const body = {
        name: name,
        description: description,
        parentId: parentId
    };
    console.log('[System:department:CreateDepartmentV2] 请求参数:', { appid, name, description, parentId });

    try {
        const res = await fetch(API_URLS.CreateDepartmentV2(appid), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => null);
        console.log('[System:department:CreateDepartmentV2] 响应结果:', { ok: res.ok, data });
        return { ok: res.ok, data };
    } catch (error) {
        console.warn('[System:department:CreateDepartmentV2] 报错:', error);
        return { ok: false, data: null };
    }
}

//已使用
// 更新部门信息 put请求
export async function UpdateDepartmentV2(appid: string, id: number, name: string, description: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;


    const body = {
        name: name,
        description: description
    };

    try {
        const res = await fetch(API_URLS.UpdateDepartmentV2(appid, id), {
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
        console.warn('[System:department:UpdateDepartmentV2] 报错:', error);
        return { ok: false, data: null };
    }
}

//已使用
// 删除部门 delete请求
export async function DeleteDepartmentV2(appid: string,id: number) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;
    try {
        const res = await fetch(API_URLS.DeleteDepartmentV2(appid, id), {
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
        console.warn('[System:department:DeleteDepartmentV2] 报错:', error);
        return { ok: false, data: null };
    }
}
