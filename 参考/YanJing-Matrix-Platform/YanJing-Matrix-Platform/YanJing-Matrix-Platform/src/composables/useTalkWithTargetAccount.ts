

import { GetIMUserInfo } from '@/services/Project/SSO/UserInfo'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import { addPrefixSuffix, removePrefixSuffix } from '@/utils/stringUtils'
import { findRoomByUserIds2, roomMatcher2 } from '@/utils/RoomMatcher'
import { roomManagementService } from '@/services/Matrix/roomManagement'
import { useWechatStore } from '@/stores/WeChat'

import { useOrganizationStore } from '@/stores/Organization'
import { Secretary } from '@/services/Project/Ensure/Ensure'
import { CreateRoom } from '@/services/Project/CreateRoom/Createroom'
export type TalkWithTargetAccountHandler = (userId: string, roomId?: string) => void

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

    const pureId = removePrefixSuffix(targetIM || "", "@", MATRIX_SERVER_URL_TAIL);
    const targetMatrixUserId = addPrefixSuffix(pureId, "@", MATRIX_SERVER_URL_TAIL);

    if (target.data?.atype === 'bot') {
        // 处理与bot的对话逻辑
        const existingRoomId = await findRoomByUserIds2(targetUserIds, true);

        if (existingRoomId && existingRoomId !== "未匹配到!") {
            console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] 找到已存在的房间:', existingRoomId);
            onRoomReady?.(pureId, existingRoomId)
            return existingRoomId
        }

        const roomName = target.data?.nickname || target.data?.username;
        const roomTopic = `与${roomName}的对话`;

        // 调用新版房间管理创建普通私有房间（不加密）
        const newRoom = await roomManagementService.createNormalRoom({
            name: roomName,
            topic: roomTopic,
            inviteUserIds: [],
            isFederated: true,
        });

        // 创建成功后，清掉本次查找写入的“未匹配到!”负缓存
        try {
            console.log('[-----------------------------System:useTalkWithTargetAccount:talkWithTargetAccount] 房间创建成功，房间id为:', newRoom.roomId);
            roomMatcher2.clearCache();
        } catch (e) {
            console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] clearCacheFor 调用失败，忽略并继续：', e);
        }

        try {
            await roomManagementService.inviteUser(newRoom.roomId, targetMatrixUserId, `邀请 ${roomName} 加入对话`);




        } catch (inviteError) {
            console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 邀请智能体失败，但房间创建成功:', inviteError);
        }

        onRoomReady?.(pureId, newRoom.roomId)
        return newRoom.roomId

    } else if (target.data?.atype === 'user') {

        // 处理与普通用户的对话逻辑
        console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] targetUserIds', targetUserIds)

        // 关键修复：房间匹配现在强制要求 4 个 ID 才能进普通用户分支。
        // 但其实只校验前两个是 A 和 B，后两个我们可以暂时补上 system 和 bot 的占位符（或者你的真实小秘书/bot ID）。
        // 不过如果你这里可以拿到小助理 ID，最好填真实的。
        const fake4Ids = [selfIM, targetIM, "@system:matrix.org", "@bot:matrix.org"];
        const existingRoomId = await findRoomByUserIds2(fake4Ids, false);



        if (existingRoomId && existingRoomId !== "未匹配到!") {
            console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] 找到已存在的房间:', existingRoomId);

            const organizationStore = useOrganizationStore()


            const result = await Secretary(organizationStore.currentOrganization?.app_id)
            console.log('------------------------------------------[OrganizationV2]启动唤醒秘书', result)


            onRoomReady?.(pureId, existingRoomId)
            return existingRoomId
        }

        const invitees = [username].filter(Boolean)

        if (invitees.length !== 1) {
            console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] 缺少用户名，无法创建房间', { invitees })
            return
        }

        let roomName = '新对话';
        if (!target.data?.nickname || !self.data?.nickname) {
            console.warn('[OrganizationV2] 缺少昵称')
            roomName = target.data?.username + '、' + self.data?.username;
        }
        else {
            roomName = target.data?.nickname + '、' + self.data?.nickname;
        }

        const roomResult = await CreateRoom(invitees, roomName, "")
        if (!roomResult.ok) {
            console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] CreateRoom 失败', roomResult)
            return
        }

        const createdRoomId = (roomResult.data as { room_id: string })?.room_id
        if (!createdRoomId) {
            console.warn('[System:useTalkWithTargetAccount:talkWithTargetAccount] createNormalRoom 返回缺少 room_id', roomResult)
            return
        }



        const organizationStore = useOrganizationStore()

        const result = await Secretary(organizationStore.currentOrganization?.app_id)
        console.log('[System:useTalkWithTargetAccount:talkWithTargetAccount] 启动唤醒秘书', result)


        onRoomReady?.(pureId, createdRoomId)
        return createdRoomId

    }
}


