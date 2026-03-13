

import { GetIMUserInfo } from '@/services/SSO/UserInfo'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import { addPrefixSuffix, removePrefixSuffix } from '@/utils/stringUtils'
import { findRoomByUserIds2, roomMatcher2 } from '@/utils/roomMatcher2'
import { roomCreateServiceV2 } from '@/services/rooms/room-create.service'
import { inviteManagementServiceV2 } from '@/services/members/invite.service'
import { useWechatStore } from '@/stores/wechat'
import { CreateRoom } from '@/services/Project/createRoom/Createroom'
import { useOrganizationStoreV2 } from '@/stores/organizationV2'
import { Secretary } from '@/services/Project/Task/task'

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
        console.warn('无法获取当前用户名，无法发起对话');
        return;
    }

    //在这里调api，要求返回matrix id，返回俩人的matrix id，自己和传入的

    const self = await GetIMUserInfo(loginUsername);
    const target = await GetIMUserInfo(username);

    const selfIM = self.data?.im;
    const targetIM = target.data?.im;

    if (!selfIM || !targetIM) {
        console.warn('[OrganizationV2] 缺少 MatrixId，无法发起对话', { selfIM, targetIM, loginUsername, username });
        return;
    }

    const targetUserIds = [selfIM, targetIM];

    // 关键：RoomMatcher 会缓存“未匹配到!”；如果不清理，后续即便房间已创建/已同步也会继续走创建分支。
    try {
        roomMatcher2.clearCache();
    } catch (e) {
        console.warn('[OrganizationV2] clearCacheFor 调用失败，忽略并继续：', e);
    }

    const pureId = removePrefixSuffix(targetIM || "", "@", MATRIX_SERVER_URL_TAIL);

    if (target.data?.atype === 'bot') {
        // 处理与bot的对话逻辑
        const existingRoomId = await findRoomByUserIds2(targetUserIds, true);

        if (existingRoomId && existingRoomId !== "未匹配到!") {
            console.log('找到已存在的房间:', existingRoomId);
            onRoomReady?.(pureId, existingRoomId)
            return existingRoomId
        }

        const roomName = target.data?.nickname || target.data?.username;
        const roomOptions = {
            name: roomName,
            topic: `与${roomName}的对话`,
            visibility: 'private' as const,
            encryption: false,
            invites: [],
            historyVisibility: 'invited' as const,
            joinRule: 'invite' as const,
            guestAccess: 'forbidden' as const,
            //  ...(currentOrganization.value?.app_id ? { belongSpace: addPrefixSuffix(currentOrganization.value?.app_id, '!', MATRIX_SERVER_URL_TAIL) } : {})
        };

        // 调用创建不加密房间的方法
        const newRoom = await roomCreateServiceV2.创建不加密的房间(roomOptions);

        // 创建成功后，清掉本次查找写入的“未匹配到!”负缓存
        try {
            roomMatcher2.clearCache();
        } catch (e) {
            console.warn('[OrganizationV2] clearCacheFor 调用失败，忽略并继续：', e);
        }

        try {
            await inviteManagementServiceV2.邀请用户(newRoom.roomId, addPrefixSuffix(pureId, "@", MATRIX_SERVER_URL_TAIL), `邀请 ${roomName} 加入对话`);
        } catch (inviteError) {
            console.warn('邀请智能体失败，但房间创建成功:', inviteError);
        }

        onRoomReady?.(pureId, newRoom.roomId)
        return newRoom.roomId

    } else {

        // 处理与普通用户的对话逻辑
        // 处理与bot的对话逻辑
        console.log('targetUserIds', targetUserIds)
        const existingRoomId = await findRoomByUserIds2(targetUserIds, false);



        if (existingRoomId && existingRoomId !== "未匹配到!") {
            console.log('找到已存在的房间:', existingRoomId);

            const organizationStore = useOrganizationStoreV2()


            const result = await Secretary(organizationStore.currentOrganization?.app_id)
            console.log('------------------------------------------[OrganizationV2]启动唤醒秘书', result)

            onRoomReady?.(pureId, existingRoomId)
            return existingRoomId
        }

        const invitees = [username].filter(Boolean)
        if (invitees.length !== 1) {
            console.warn('[OrganizationV2] 缺少用户名，无法创建房间', { invitees })
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
            console.warn('[OrganizationV2] CreateRoom 失败', roomResult)
            return
        }

        const createdRoomId = roomResult.data?.room_id || roomResult.data?.roomId
        if (!createdRoomId) {
            console.warn('[OrganizationV2] CreateRoom 返回缺少 roomId', roomResult.data)
            return
        }

        const organizationStore = useOrganizationStoreV2()

        const result = await Secretary(organizationStore.currentOrganization?.app_id)
        console.log('------------------------------------------------[OrganizationV2]启动唤醒秘书', result)

        onRoomReady?.(pureId, createdRoomId)
        return createdRoomId

    }
}


