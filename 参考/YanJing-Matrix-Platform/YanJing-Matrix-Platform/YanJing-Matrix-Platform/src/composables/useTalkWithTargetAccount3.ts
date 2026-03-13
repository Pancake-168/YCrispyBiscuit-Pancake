

import { GetIMUserInfo } from '@/services/Project/SSO/UserInfo'
import { useWechatStore } from '@/stores/WeChat'

import { useOrganizationStore } from '@/stores/Organization'
import { Secretary } from '@/services/Project/Ensure/Ensure'

import { GetPrivateRoom } from "@/services/Project/IM/Room";
import { AcceptRoomInvite } from "@/services/Project/IM/Room";

import { CreateDMRoom } from "@/services/Project/IM/Room";

export type TalkWithTargetAccountHandler = (roomId?: string) => void












export async function talkWithTargetAccount(
    username: string,
    onRoomReady?: TalkWithTargetAccountHandler
): Promise<string | void> {



    const wechatStore = useWechatStore();
    const loginUsername = wechatStore.userProfile?.username || '';




    if (!username) {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 目标用户名不能为空');
        return;
    }
    // 动态获取当前用户ID
    //const loginUsername = userInfoManager.getLoginField('username')


    if (!loginUsername) {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 无法获取当前用户名，无法发起对话');
        return;
    }



    //在这里调api，要求返回matrix id，返回俩人的matrix id，自己和传入的

    const self = await GetIMUserInfo(loginUsername);
    const target = await GetIMUserInfo(username);


    if (!self) {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 无法获取当前用户信息，无法发起对话');
        return;
    }
    if (!target) {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 无法获取目标用户信息，无法发起对话');
        return;
    }

    const DMroom = await GetPrivateRoom(username)
    if (DMroom.ok && DMroom.data?.exists && DMroom.data?.room_id) {
        console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] 已存在 DM 房间，直接接受邀请进入房间:', DMroom.data.room_id);
        const resolvedRoomId = DMroom.data.room_id;

        if (resolvedRoomId) {
            const acceptResult = await AcceptRoomInvite(resolvedRoomId);

            if (!acceptResult.ok) {
                console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 调用AcceptRoomInvite房间邀请失败:', {
                    roomId: resolvedRoomId,
                    acceptResult,
                });
            }
            if (target.data?.atype === 'user') {
                const organizationStore = useOrganizationStore()
                const result = await Secretary(organizationStore.currentOrganization?.app_id)
                console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] 启动唤醒秘书', result)
            }
            onRoomReady?.(resolvedRoomId)
            return resolvedRoomId
        }
    } else if (DMroom.ok && (!DMroom.data?.exists || !DMroom.data?.room_id)) {
        console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] DM 房间不存在，尝试创建 DM 房间');

        const createResult = await CreateDMRoom(username);

        if (!createResult.ok || !createResult.data?.room_id) {
            console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] CreateDMRoom 创建 DM 房间失败:', {
                username,
                createResult,
            });

            return;
        } else {
            const roomId = createResult.data.room_id;
            console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] CreateDMRoom 创建 DM 房间成功，房间 ID:', roomId);
            const acceptResult = await AcceptRoomInvite(roomId);

            if (!acceptResult.ok) {
                console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 调用AcceptRoomInvite房间邀请失败:', {
                    roomId,
                    acceptResult,
                });
            }
            if (target.data?.atype === 'user') {
                const organizationStore = useOrganizationStore()
                const result = await Secretary(organizationStore.currentOrganization?.app_id)
                console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] 启动唤醒秘书', result)
            }
            onRoomReady?.(roomId)
            return roomId;
        }

    } else {
        console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 获取 DM 房间失败，无法确认房间是否存在:', DMroom);
        return;
    }


}




