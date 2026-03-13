

import { GetIMUserInfo } from '@/services/Project/SSO/UserInfo'
import { findRoomByUserIds2, roomMatcher2 } from '@/utils/RoomMatcher2'
import { useWechatStore } from '@/stores/WeChat'

import { useOrganizationStore } from '@/stores/Organization'
import { Secretary } from '@/services/Project/Ensure/Ensure'

import { SendPrivateMessage } from "@/services/Project/IM/Room";
import { GetPrivateRoom } from "@/services/Project/IM/Room";
import { AcceptRoomInvite } from "@/services/Project/IM/Room";

export type TalkWithTargetAccountHandler = (roomId?: string) => void

async function createPrivateRoomAndAcceptInvite(targetUsername: string): Promise<string | void> {
    const sendResult = await SendPrivateMessage(targetUsername, 'Hello~!');

    if (!sendResult.ok || !sendResult.data?.room_id) {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] SendPrivateMessage 创建房间失败:', sendResult);
        return;
    }

    const privateRoomResult = await GetPrivateRoom(targetUsername);

    if (!privateRoomResult.ok || !privateRoomResult.data?.exists || !privateRoomResult.data.room_id) {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] GetPrivateRoom 未确认到主房间:', {
            targetUsername,
            sendRoomId: sendResult.data.room_id,
            privateRoomResult,
        });
        return;
    }

    const roomId = privateRoomResult.data.room_id;
    const acceptResult = await AcceptRoomInvite(roomId);

    if (!acceptResult.ok) {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] AcceptRoomInvite 失败:', {
            targetUsername,
            roomId,
            acceptResult,
        });
        return;
    }

    console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] 私聊主房间已确认并接受邀请，房间id为:', roomId);
    return roomId;
}

export async function talkWithTargetAccount(
    username: string,
    onRoomReady?: TalkWithTargetAccountHandler
): Promise<string | void> {



    const wechatStore = useWechatStore();
    const loginUsername = wechatStore.userProfile?.username || '';




    if (!username) return;

    // 动态获取当前用户ID
    //const loginUsername = userInfoManager.getLoginField('username')


    if (!loginUsername) {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 无法获取当前用户名，无法发起对话');
        return;
    }

    //在这里调api，要求返回matrix id，返回俩人的matrix id，自己和传入的

    const self = await GetIMUserInfo(loginUsername);
    const target = await GetIMUserInfo(username);

    const selfIM = self.data?.im;
    const targetIM = target.data?.im;

    if (!selfIM || !targetIM) {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 缺少 MatrixId，无法发起对话', { selfIM, targetIM, loginUsername, username });
        return;
    }

    const targetUserIds = [selfIM, targetIM];

    // 关键：RoomMatcher 会缓存“未匹配到!”；如果不清理，后续即便房间已创建/已同步也会继续走创建分支。
    try {
        roomMatcher2.clearCache();
    } catch (e) {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] clearCacheFor 调用失败，忽略并继续：', e);
    }




    if (target.data?.atype === 'bot') {
        // 处理与bot的对话逻辑
        const existingRoomId = await findRoomByUserIds2(targetUserIds, true);
        const targetUsername = target.data?.username;

        if (!targetUsername) {
            console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] bot 用户缺少 username，无法发起对话');
            return;
        }

        const matchedRoomId = existingRoomId && existingRoomId !== '未匹配到!'
            ? existingRoomId
            : undefined;

        const privateRoomResult = await GetPrivateRoom(targetUsername);
        const privateRoomId = privateRoomResult.ok
            && privateRoomResult.data?.exists
            && privateRoomResult.data.room_id
            ? privateRoomResult.data.room_id
            : undefined;

        let resolvedRoomId: string | undefined;

        if (matchedRoomId && privateRoomId) {
            if (matchedRoomId === privateRoomId) {
                console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] findRoomByUserIds2 与 GetPrivateRoom 命中同一房间:', matchedRoomId);
                resolvedRoomId = matchedRoomId;
            } else {
                console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] findRoomByUserIds2 与 GetPrivateRoom 不一致，优先使用 GetPrivateRoom:', {
                    matchedRoomId,
                    privateRoomId,
                });
                resolvedRoomId = privateRoomId;
            }
        } else if (privateRoomId) {
            console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] GetPrivateRoom 命中房间:', privateRoomId);
            resolvedRoomId = privateRoomId;
        } else if (matchedRoomId) {
            console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] findRoomByUserIds2 命中房间:', matchedRoomId);
            console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] 未发现系统记录的主房间，默认跳过已存在房间，继续走创建流程。');
           
        }

        if (resolvedRoomId) {
            const acceptResult = await AcceptRoomInvite(resolvedRoomId);

            if (!acceptResult.ok) {
                console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 调用AcceptRoomInvite房间邀请失败:', {
                    roomId: resolvedRoomId,
                    acceptResult,
                });
            }

            onRoomReady?.(resolvedRoomId)
            return resolvedRoomId
        }

        const roomId = await createPrivateRoomAndAcceptInvite(targetUsername);
        if (!roomId) return;

        // 创建成功后，清掉本次查找写入的“未匹配到!”负缓存
        try {
            console.log('[-----------------------------System:useTalkWithTargetAccount:talkWithTargetAccount] 房间创建成功，房间id为:', roomId);
            roomMatcher2.clearCache();
        } catch (e) {
            console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] clearCacheFor 调用失败，忽略并继续：', e);
        }

        onRoomReady?.(roomId)
        return roomId


    } else if (target.data?.atype === 'user') {

        // 处理与普通用户的对话逻辑
        console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] targetUserIds', targetUserIds)

        // 关键修复：房间匹配现在强制要求 4 个 ID 才能进普通用户分支。
        // 但其实只校验前两个是 A 和 B，后两个我们可以暂时补上 system 和 bot 的占位符（或者你的真实小秘书/bot ID）。
        // 不过如果你这里可以拿到小助理 ID，最好填真实的。
        const fake4Ids = [selfIM, targetIM, "@system:matrix.org", "@bot:matrix.org"];
        const existingRoomId = await findRoomByUserIds2(fake4Ids, false);
        const targetUsername = target.data?.username;

        if (!targetUsername) {
            console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] user 用户缺少 username，无法发起对话');
            return;
        }

        const matchedRoomId = existingRoomId && existingRoomId !== '未匹配到!'
            ? existingRoomId
            : undefined;

        const privateRoomResult = await GetPrivateRoom(targetUsername);
        const privateRoomId = privateRoomResult.ok
            && privateRoomResult.data?.exists
            && privateRoomResult.data.room_id
            ? privateRoomResult.data.room_id
            : undefined;

        let resolvedRoomId: string | undefined;

        if (matchedRoomId && privateRoomId) {
            if (matchedRoomId === privateRoomId) {
                console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] findRoomByUserIds2 与 GetPrivateRoom 命中同一房间:', matchedRoomId);
                resolvedRoomId = matchedRoomId;
            } else {
                console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] findRoomByUserIds2 与 GetPrivateRoom 不一致，优先使用 GetPrivateRoom:', {
                    matchedRoomId,
                    privateRoomId,
                });
                resolvedRoomId = privateRoomId;
            }
        } else if (privateRoomId) {
            console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] GetPrivateRoom 命中房间:', privateRoomId);
            resolvedRoomId = privateRoomId;
        } else if (matchedRoomId) {
            console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] findRoomByUserIds2 命中房间:', matchedRoomId);
            console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] 未发现系统记录的主房间，默认跳过已存在房间，继续走创建流程。');
           
        }

        if (resolvedRoomId) {
            const acceptResult = await AcceptRoomInvite(resolvedRoomId);

            if (!acceptResult.ok) {
                console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 调用AcceptRoomInvite房间邀请失败:', {
                    roomId: resolvedRoomId,
                    acceptResult,
                });
            }

            const organizationStore = useOrganizationStore()


            const result = await Secretary(organizationStore.currentOrganization?.app_id)
            console.log('------------------------------------------[OrganizationV2]启动唤醒秘书', result)


            onRoomReady?.(resolvedRoomId)
            return resolvedRoomId
        }

        const roomId = await createPrivateRoomAndAcceptInvite(targetUsername);
        if (!roomId) return;

        // 创建成功后，清掉本次查找写入的“未匹配到!”负缓存
        try {
            console.log('[-----------------------------System:useTalkWithTargetAccount:talkWithTargetAccount] 房间创建成功，房间id为:', roomId);
            roomMatcher2.clearCache();
        } catch (e) {
            console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] clearCacheFor 调用失败，忽略并继续：', e);
        }





        const organizationStore = useOrganizationStore()

        const result = await Secretary(organizationStore.currentOrganization?.app_id)
        console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] 启动唤醒秘书', result)


        onRoomReady?.(roomId)
        return roomId
    }
}


