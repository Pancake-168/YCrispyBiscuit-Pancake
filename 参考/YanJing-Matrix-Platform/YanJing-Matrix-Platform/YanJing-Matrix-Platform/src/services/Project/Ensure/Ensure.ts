import { API_URLS } from "@/apiUrls";
import { useIDmapStore } from "@/stores/IDmap";
import { MatrixClientRoom } from '@/services/Matrix/room'




import { useWechatStore } from "@/stores/WeChat";








//
export async function EnsureBotInstanceV2(roomId: string, extraAccounts: string[] = []): Promise<any> {
    // V2 版本：不做 bot/人 判断，遍历房间内所有账号依次尝试启动实例。
    // 约束：不抛出错误，任何失败都不影响后续账号尝试。
    if (!roomId) {
        console.warn('[System:Ensure:EnsureBotInstanceV2] 缺少 roomId，跳过')
        return []
    }

    const apiurl = API_URLS.Instance()
    const successAccounts: string[] = []

    const idmapStore = useIDmapStore()
    console.log("[System:Ensure:EnsureBotInstanceV2] idmapStore内的现有数据:", idmapStore.list)
    try {
        let members: any[] = []
        try {
            members = MatrixClientRoom.getRoomMembersById(roomId) || []
        } catch (e) {
            console.warn('[System:Ensure:EnsureBotInstanceV2] 获取房间成员失败，将仅使用 extraAccounts', e)
        }

        console.log('[System:Ensure:EnsureBotInstanceV2] 房间成员列表：', members, '额外账号:', extraAccounts)

        // 不管 join/invite，不管人/bot，取出所有 userId，并合并额外传入的账号
        const accounts = Array.from(
            new Set([
                ...members
                    .map((m: any) => m?.userId)
                    .filter((id: any) => typeof id === 'string' && id.trim().length > 0),
                ...(extraAccounts || [])
            ])
        )

        for (const account of accounts) {
            try {
                // 判断是否是显式指定的额外账号
                const isExplicit = extraAccounts.includes(account);

                // 按 matrixId 查询本地 ID 表
                const mapped = idmapStore.getByMatrixId(account);

                // 必须在 IDMap 中存在 (为了获取 username，且遵循"只能从IDmap里面获取"的约束)
                if (!mapped) {
                    if (isExplicit) {
                        console.warn(`[System:Ensure:EnsureBotInstanceV2] 显式请求的账号 ${account} 未在 IDMap 中找到，无法获取 username，跳过。`);
                    }
                    continue;
                }

                // 只有 bot 才启动实例，或者是显式传入的 extraAccounts (信任调用者)
                if (mapped.type !== 'bot' && !isExplicit) {
                    continue
                }

                console.log('[System:Ensure:EnsureBotInstanceV2] 尝试启动实例，account=', account, 'mapped=', mapped)

                const body = { "username": mapped.username }
                const res = await fetch(apiurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                })

                if (res.ok) {
                    successAccounts.push(account)
                } else {
                    // 失败不影响后续账号尝试
                    console.warn('[System:Ensure:EnsureBotInstanceV2] 启动失败，matrixid为：', account, res.status, res.statusText)
                }
            } catch (e) {
                // 网络错误/解析错误等全部吞掉
                console.warn('[System:Ensure:EnsureBotInstanceV2] 调用异常，matrixid为：', account, e)
            }
        }
    } catch (e) {
        console.warn('[System:Ensure:EnsureBotInstanceV2] 获取房间成员异常，roomId=', roomId, e)
        return []
    }

    // 去重后返回
    return Array.from(new Set(successAccounts))
}













// 唤醒秘书bot
export async function Secretary(appid?: string) {
    const wechatStore = useWechatStore();
    const token = wechatStore.ssoParams.loginToken;

    let appidLocal = appid;
    if (!appidLocal) {
        appidLocal = "0"
    }

    try {
        const res = await fetch(API_URLS.Secretary(appidLocal), {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        const data = await res.json().catch(() => null);
        return { ok: res.ok, data };
    } catch (error) {
        console.error('Secretary 报错:', error);
        return { ok: false, data: null };
    }
}













// V3版本改为指定用户名，确保实例存在（不区分人/机），失败不抛错，一般来说由外部调用时确保传入为bot即可
export async function EnsureBotInstanceV3(username: string): Promise<any> {


    const apiurl = API_URLS.Instance()


    try {
        console.log('[System:Ensure:EnsureBotInstanceV3] 尝试启动实例，username=', username)

        const body = { "username": username }
        const res = await fetch(apiurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })

        if (res.ok) {
            console.log('[System:Ensure:EnsureBotInstanceV3] 启动成功，username=', username)
        } else {

            console.warn('[System:Ensure:EnsureBotInstanceV3] 启动失败，username=', username, res.status, res.statusText)
        }
    } catch (e) {
        // 网络错误/解析错误等全部吞掉
        console.warn('[System:Ensure:EnsureBotInstanceV3] 调用异常，username=', username, e)
    }
}
 


