import { API_URLS, MATRIX_SERVER_URL_TAIL } from "@/apiUrls";
import { userInfoManager } from "@/utils/userInfo";
import { addPrefixSuffix, removePrefixSuffix } from "@/utils/stringUtils";
import { useIDmapStore } from "@/stores/IDmap";

import { roomServiceV2 as roomService } from '@/services/matrix/rooms'




import { useWechatStore } from "@/stores/wechat";



//创建新任务,接收任务名称参数,其他字段(user_access_token, topic)由系统补足
export async function CreateNewTask(taskName: string): Promise<any> {




    const token = localStorage.getItem('matrix_access_token')

    // 获取当前用户的 bot 账号(Matrix 用户名全称)
    // 这里需要根据实际情况获取,可能是 username + "userbot" + homeserver
    const username = removePrefixSuffix(userInfoManager.getLoginField("username"), "@", MATRIX_SERVER_URL_TAIL);

    // 构建 bot 账号,格式: @{username}userbot:{homeserver}
    const botAccount = `@${username}userbot${MATRIX_SERVER_URL_TAIL}`;

    //构建user账号,格式: @{username}userbot:{homeserver}
    const user_account = `@${username}${MATRIX_SERVER_URL_TAIL}`


    // URL 编码 bot 账号
    const encodedBotAccount = encodeURIComponent(botAccount);

    const apiurl = API_URLS.CreateTask;

    // 如果未输入任务名，给默认值
    const finalTaskName = taskName && taskName.trim() ? taskName : '新任务';

    // 构建请求数据,只有task_name由用户提供,其他字段系统补足
    const requestData = {
        task_name: finalTaskName,
        user_access_token: token,
        user_account: user_account,
        topic: ""
    };

    try {
        const res = await fetch(apiurl(encodedBotAccount), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : await res.text();

        if (!res.ok) {
            const errMsg = typeof data === 'string' ? data : JSON.stringify(data);
            throw new Error(`Request failed: ${res.status} ${res.statusText} ${errMsg}`);
        }

        return data;
    } catch (error) {
        console.error('临时调用数据时出错:', error);
        throw error;
    }
}









//重做任务
export async function RedoTask(session_id: string): Promise<any> {




    const token = localStorage.getItem('matrix_access_token')


    const apiurl = API_URLS.RedoTask;


    const requestData = {
        user_access_token: token,
    };

    try {
        const res = await fetch(apiurl(session_id), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : await res.text();

        if (!res.ok) {
            const errMsg = typeof data === 'string' ? data : JSON.stringify(data);
            throw new Error(`Request failed: ${res.status} ${res.statusText} ${errMsg}`);
        }

        return data;
    } catch (error) {
        console.error('临时调用数据时出错:', error);
        throw error;
    }
}






// 启动 bot 实例：根据当前房间成员推断 bot 账号
// 逻辑：传入 roomId（必须），读取成员，仅保留 join/invite，排除自己，剩余一个即视为目标 bot。
// 若无法唯一确定（无成员或多于1个非自己成员），返回 null 或抛出错误供上层决定是否忽略。
// [更新] 支持传入 targetBotId，若传入则跳过成员检查直接使用
export async function EnsureBotInstance(roomId: string, targetBotId?: string): Promise<any> {
    if (!roomId) {
        console.warn('[EnsureBotInstance] 缺少 roomId，终止调用');
        return null;
    }

    const apiurl = API_URLS.Instance();

    // 当前用户 canonical Id
    const selfCanonical = addPrefixSuffix(
        removePrefixSuffix(userInfoManager.getLoginField('username'), '@', MATRIX_SERVER_URL_TAIL),
        '@',
        MATRIX_SERVER_URL_TAIL
    )

    let botAccount: string | null = null;

    if (targetBotId) {
        // 如果直接指定了 Bot ID，则跳过成员检查
        botAccount = addPrefixSuffix(
            removePrefixSuffix(targetBotId, '@', MATRIX_SERVER_URL_TAIL),
            '@',
            MATRIX_SERVER_URL_TAIL
        );
        console.log('[EnsureBotInstance] 使用指定的 targetBotId:', botAccount);
    } else {
        try {
            const members = roomService.获取房间成员(roomId)
            if (!Array.isArray(members)) {
                console.warn('[EnsureBotInstance] 房间成员无效，roomId=', roomId)
                return null
            }
            const filtered = members.filter((m: any) => !m?.membership || m.membership === 'join' || m.membership === 'invite')
            const canonicals = Array.from(new Set(filtered.map((m: any) => m?.userId).filter(Boolean)))
            if (canonicals.length < 2) {
                console.warn('[EnsureBotInstance] 非两人房或成员不足，跳过，members=', canonicals)
                return null
            }
            // 排除自身后剩余
            const others = canonicals.filter(c => c !== selfCanonical)
            if (others.length !== 1) {
                console.warn('[EnsureBotInstance] 无法唯一确定 bot 账号，others=', others)
                return null
            }
            botAccount = others[0]
        } catch (e) {
            console.warn('[EnsureBotInstance] 获取房间成员失败，roomId=', roomId, e)
            return null
        }
    }

    if (!botAccount) {
        console.warn('[EnsureBotInstance] 未找到可用 botAccount，终止')
        return null
    }

    const requestData = { account: botAccount }

    try {
        const res = await fetch(apiurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        })
        const contentType = res.headers.get('content-type') || ''
        const data = contentType.includes('application/json') ? await res.json() : await res.text()
        if (!res.ok) {
            const errMsg = typeof data === 'string' ? data : JSON.stringify(data)
            throw new Error(`Request failed: ${res.status} ${res.statusText} ${errMsg}`)
        }
        return data
    } catch (error) {
        console.error('[EnsureBotInstance] 调用接口失败:', error)
        throw error
    }
}




//
export async function EnsureBotInstanceV2(roomId: string, extraAccounts: string[] = []): Promise<any> {
    // V2 版本：不做 bot/人 判断，遍历房间内所有账号依次尝试启动实例。
    // 约束：不抛出错误，任何失败都不影响后续账号尝试。
    if (!roomId) {
        console.warn('[EnsureBotInstanceV2] 缺少 roomId，跳过')
        return []
    }

    const apiurl = API_URLS.Instance()
    const successAccounts: string[] = []

    const idmapStore = useIDmapStore()
    console.log("idmapStore内的现有数据:", idmapStore.list)
    try {
        let members: any[] = []
        try {
            members = roomService.获取房间成员(roomId) || []
        } catch (e) {
            console.warn('[EnsureBotInstanceV2] 获取房间成员失败，将仅使用 extraAccounts', e)
        }

        console.log('[EnsureBotInstanceV2] 房间成员列表：', members, '额外账号:', extraAccounts)

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
                        console.warn(`[EnsureBotInstanceV2] 显式请求的账号 ${account} 未在 IDMap 中找到，无法获取 username，跳过。`);
                    }
                    continue;
                }

                // 只有 bot 才启动实例，或者是显式传入的 extraAccounts (信任调用者)
                if (mapped.type !== 'bot' && !isExplicit) {
                    continue
                }

                console.log('[EnsureBotInstanceV2] 尝试启动实例，account=', account, 'mapped=', mapped)

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
                    console.warn('[EnsureBotInstanceV2] 启动失败:', account, res.status, res.statusText)
                }
            } catch (e) {
                // 网络错误/解析错误等全部吞掉
                console.warn('[EnsureBotInstanceV2] 调用异常:', account, e)
            }
        }
    } catch (e) {
        console.warn('[EnsureBotInstanceV2] 获取房间成员异常，roomId=', roomId, e)
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
