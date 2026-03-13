import { useAppStore } from "@/stores/app";
import { useLanguageStore } from "@/stores/language";
import { useSystemStore } from "@/stores/System";
import { MatrixClientRoom } from '@/services/Matrix/room'
import { matrixClient } from '@/services/Matrix/client'
import { matrixEventManager } from '@/services/Matrix/eventManager'
import { MatrixEventType } from '@/types/eventManager'
import { StartApplyUserConfig } from "@/services/Project/UserConfig";
import { SystemStorageManager } from "@/utils/SystemStorage";
import type { UserConfig } from "@/types/UserConfig";
import { wechatSSOService } from "@/services/Project/SSO/WeChatSSO";
import { UserInfo } from '@/services/Project/SSO/UserInfo'
import { useOrganizationStore } from '@/stores/Organization'
import { GetUserBot } from '@/services/Project/UserBot/GetUserBot'
import { useWechatStore } from "@/stores/WeChat";
import { useRoomMapStore } from '@/stores/RoomMap'
import type { ApplicationV2 } from '@/types/Organization'
//import { useUserBotStore } from "@/stores/UserBot";
import { GetPrivateRoom } from "@/services/Project/IM/Room";
import { CreateDMRoom } from "@/services/Project/IM/Room";
import { useRoomDisplayStore } from '@/stores/RoomDisplay'
import { useRoomClassificationStore } from '@/stores/RoomClassification'
import { systemNotificationService } from '@/services/Project/SystemNotification'

export async function startApp() {
    // 获取全局状态管理实例
    const appStore = useAppStore();
    const wechatStore = useWechatStore();

    // 获取全局语言管理实例
    const languageStore = useLanguageStore();


    console.log('[System:ProjectStart:startApp] 项目初始化中...');




    // 1.先确保 loginToken 已从本地回填，再加载用户配置
    await wechatStore.refreshLoginToken();
    await StartApplyUserConfig();








    // 2.初始化主题
    appStore.initTheme();
    console.log('[System:ProjectStart:startApp] 主题初始化完成，当前主题：', appStore.theme);

    // 2.1 先加载本地用户配置（如果有）,如果用户配置里有主题，则覆盖默认主题
    try {
        const localConfig = await SystemStorageManager.getUserConfig<UserConfig>()

        // 将用户配置中的功能列表设置应用到 appStore 中
        // 这里本来应该写到4.0的，但就一行代码没必要再开一部分了
        appStore.applyFunctionListConfig(localConfig)
        appStore.applyNotificationSoundConfig(localConfig)


        if (localConfig?.theme === 'dark' || localConfig?.theme === 'light') {
            await appStore.setTheme(localConfig.theme)
            console.log('[System:ProjectStart:startApp] 从用户配置加载主题：', localConfig.theme)
        }
        else {
            console.log('[System:ProjectStart:startApp] 加载本地用户配置失败，使用默认主题')
        }
    } catch {
        // ignore

    }





    // 3.初始化语言
    await languageStore.initLanguage();
    console.log('[System:ProjectStart:startApp] 语言初始化完成，当前语言：', languageStore.currentLanguage);

    // 3.1 从用户配置加载语言设置（如果有），覆盖默认语言
    try {
        const localConfig = await SystemStorageManager.getUserConfig<UserConfig>()
        if (localConfig?.language) {
            await languageStore.setLanguage(localConfig.language)
            console.log('[System:ProjectStart:startApp] 从用户配置加载语言：', localConfig.language)
        }
        else {
            console.log('[System:ProjectStart:startApp] 加载本地用户配置失败，使用默认语言')
        }
    } catch {
        // ignore

    }














}



export async function startProject() {

    const appStore = useAppStore();
    appStore.setLoading(true, "项目初始化中...");



    await startApp();



    console.log('[System:ProjectStart:startProject] 主页面初始化中...');

    // 主页面特有的初始化逻辑

    const systemStore = useSystemStore();
    const roomMapStore = useRoomMapStore();
    const roomDisplayStore = useRoomDisplayStore();
    const roomClassificationStore = useRoomClassificationStore();
    const roomMembershipRefreshTimers = new Map<string, ReturnType<typeof setTimeout>>()
    let knownRoomIds = new Set<string>()

    systemNotificationService.init()









    /**
     * 1.待Matrix客户端初始化完成后，加载房间列表并存入useSystemStore
     */
    const refreshRooms = async (
        changedRoomId?: string,
        options?: { showLoading?: boolean; loadingText?: string }
    ) => {
        const showLoading = options?.showLoading ?? false

        if (showLoading) {
            appStore.setLoading(true, options?.loadingText || '正在整理房间列表...')
        }

        try {
            const rooms = MatrixClientRoom.getNormalRooms()
            const nextRoomIds = new Set(rooms.map((room) => MatrixClientRoom.getRoomId(room)).filter(Boolean))
            const addedRoomIds = knownRoomIds.size === 0
                ? Array.from(nextRoomIds)
                : Array.from(nextRoomIds).filter((roomId) => !knownRoomIds.has(roomId))
            const removedRoomIds = Array.from(knownRoomIds).filter((roomId) => !nextRoomIds.has(roomId))
            const roomIdsChanged = knownRoomIds.size === 0 || addedRoomIds.length > 0 || removedRoomIds.length > 0

            await roomClassificationStore.refreshRoomClassifications(rooms, {
                force: roomIdsChanged,
                changedRoomId,
            })

            systemStore.setTaggedSystemRooms(roomClassificationStore.buildTaggedRoomEntries(rooms))
            roomMapStore.rebuildFromSystemRooms()

            if (showLoading) {
                await roomDisplayStore.prefetchRoomDisplayProfiles(Array.from(nextRoomIds), true)
            } else {
                if (addedRoomIds.length > 0) {
                    await roomDisplayStore.prefetchRoomDisplayProfiles(addedRoomIds)
                }

                if (changedRoomId && nextRoomIds.has(changedRoomId)) {
                    await roomDisplayStore.prefetchRoomDisplayProfiles([changedRoomId], true)
                }
            }

            knownRoomIds = nextRoomIds
        } finally {
            if (showLoading) {
                appStore.setLoading(false)
            }
        }
    }

    const clearMembershipRefreshTimer = (key: string) => {
        const timerId = roomMembershipRefreshTimers.get(key)
        if (timerId) {
            clearTimeout(timerId)
            roomMembershipRefreshTimers.delete(key)
        }
    }

    const scheduleMembershipAwareRefresh = (roomId: string | undefined, expectedMembership: 'invite' | 'join' | 'leave') => {
        if (!roomId) {
            void refreshRooms()
            return
        }

        clearMembershipRefreshTimer(roomId)

        let attempt = 0
        const maxAttempts = 12
        const intervalMs = 200

        const checkAndRefresh = () => {
            attempt += 1

            const client = matrixClient.getAuthedClient()
            const room = client?.getRoom(roomId)
            const membership = room?.getMyMembership?.() || ''

            const ready = expectedMembership === 'leave'
                ? !room || membership === 'leave' || membership === 'ban'
                : Boolean(room) && membership === expectedMembership

            if (ready || attempt >= maxAttempts) {
                roomMembershipRefreshTimers.delete(roomId)
                void refreshRooms(roomId, {
                    showLoading: true,
                    loadingText: expectedMembership === 'leave' ? '正在更新房间列表...' : '正在同步房间列表...',
                })
                return
            }

            const timerId = setTimeout(checkAndRefresh, intervalMs)
            roomMembershipRefreshTimers.set(roomId, timerId)
        }

        checkAndRefresh()
    }

    // 先尝试加载一次（如果尚未同步完成会是空数组）
    await refreshRooms(undefined, {
        showLoading: true,
        loadingText: '正在整理房间列表...',
    })

    // 同步完成后再刷新，确保能拿到完整房间列表
    matrixEventManager.on(MatrixEventType.SYNC_COMPLETED, () => {
        void refreshRooms(undefined, {
            showLoading: true,
            loadingText: '正在同步房间列表...',
        })
    })

    // 关键：运行中若收到邀请/加入/离开/房间元信息变化，也要即时刷新房间列表
    matrixEventManager.on(MatrixEventType.ROOM_INVITED, (payload) => {
        scheduleMembershipAwareRefresh(payload.room?.roomId, 'invite')
    })
    matrixEventManager.on(MatrixEventType.ROOM_JOINED, (payload) => {
        scheduleMembershipAwareRefresh(payload.room?.roomId, 'join')
    })
    matrixEventManager.on(MatrixEventType.ROOM_LEFT, (payload) => {
        scheduleMembershipAwareRefresh(payload.room?.roomId, 'leave')
    })
    matrixEventManager.on(MatrixEventType.ROOM_UPDATED, (payload) => {
        void refreshRooms(payload.room?.roomId)
    })









    /**
     * 2. Nocobase的Token兑换,此处拿到一个root的token，但应该是没什么用的
     */
    await wechatSSOService.generateNocobaseToken()



    /**
     * 3. 获取个人微信详细资料
     */
    await UserInfo()


    /**
     * 4. 获取组织架构
     */
    await initOrganization()



    /**
     * 5. 获取个人助手
     */
    await GetUserBot()
//    await ensureUserBotDMRoom()

    /**
     * 6. 获取通用助手
     */
    await ensuretongyongBotDMRoom()

    /**
     * N-1. 基于最新房间与 IDmap 重建实体房间映射
     */
    roomMapStore.rebuildFromSystemRooms()




















    /**
     * 第n个：设置当前组织
     * 逻辑顺序 (后者覆盖前者): 
     * 1. 本地记录的“当前组织” (CURRENTORGANIZATION)
     * 2. 用户配置中的组织（来自后端）
     * 3. 跳转参数指定的“来源组织” (FromOrganization) -> 只要存在有效值，就覆盖前者
     */

    const organizationStore = useOrganizationStore();
    const wechatStore = useWechatStore();

    if (wechatStore.userProfile?.username) {

        const currentOrgRaw = await SystemStorageManager.getUserField(wechatStore.userProfile?.username, 'CURRENTORGANIZATION');

        const fromOrgId = await SystemStorageManager.getUserField(wechatStore.userProfile?.username, 'FromOrganization');

        let targetOrg: ApplicationV2 | null = null;
        let source = '';



        // 1. 尝试匹配 CURRENTORGANIZATION
        console.log('[System:ProjectStart:startProject] 检查本地存储 CURRENTORGANIZATION:', currentOrgRaw);
        const currentOrgRecord = (typeof currentOrgRaw === 'object' && currentOrgRaw !== null)
            ? currentOrgRaw as { app_id?: string | number }
            : null
        if (currentOrgRecord?.app_id) {
            const appId = currentOrgRecord.app_id;
            // 强转字符串比较
            const found = organizationStore.organizationList.find(org => String(org.app_id) === String(appId));
            if (found) {
                targetOrg = found;
                source = 'CURRENTORGANIZATION';
            } else {
                console.warn(`[System:ProjectStart:startProject] 本地记录的 appId (${appId}) 在当前组织列表里找不到`);
            }
        }

        // 2. 尝试匹配 用户配置中的 currentOrg（如果有）
        try {
            const localConfig = await SystemStorageManager.getUserConfig<UserConfig>()
            const configOrgId = localConfig?.currentOrg
            if (!targetOrg && configOrgId) {
                const found = organizationStore.organizationList.find(org => String(org.app_id) === String(configOrgId));
                if (found) {
                    targetOrg = found;
                    source = 'UserConfig';
                }
            }
        } catch {
            // ignore
        }

        // 3. 尝试匹配 FromOrganization (如果有，直接覆盖目标)
        if (fromOrgId) {
            const found = organizationStore.organizationList.find(org => String(org.app_id) === String(fromOrgId));
            if (found) {
                targetOrg = found;
                source = 'FromOrganization';
            }
        }

        if (targetOrg) {
            organizationStore.switchOrganization(targetOrg);
            console.log(`[System:ProjectStart:startProject] 已切换到组织 (${source}): ${targetOrg.name} (${targetOrg.app_id})`);

            // 4. 如果 FromOrganization 生效了，则清除它
            if (source === 'FromOrganization') {
                SystemStorageManager.removeUserField(wechatStore.userProfile?.username, 'FromOrganization');
                console.log('[System:ProjectStart:startProject] 已清除本地存储的 FromOrganization');
            }
        } else {
            // 4. [Fallback] 如果以上都没命中（比如新用户），默认选第一个
            if (organizationStore.organizationList.length > 0) {
                const defaultOrg = organizationStore.organizationList[0]
                if (defaultOrg) {
                    organizationStore.switchOrganization(defaultOrg)
                    console.log(`[System:ProjectStart:startProject] 无历史记录/跳转参数，默认选中第一个组织: ${defaultOrg.name}`)
                } else {
                    console.log('[System:ProjectStart:startProject] 本地无有效组织记录，且列表为空')
                }
            } else {
                console.log('[System:ProjectStart:startProject] 本地无有效组织记录，且列表为空')
            }
        }




    }
    else {
        console.log('[System:ProjectStart:startProject] 当前用户信息未加载完成，无法获取 CURRENTORGANIZATION');

    }
















    appStore.setLoading(false);



}






// --- [V2] V2 组织架构初始化 ---
export async function initOrganization() {
    console.log('[System:ProjectStart:initOrganization]开始初始化 V2 组织架构...');
    const orgStoreV2 = useOrganizationStore();

    // 此时 orgStoreV2.organizationList 应该已经被 UserInfo() -> setOrganizationList() 填充
    const v2List = orgStoreV2.organizationList;

    if (v2List.length > 0) {
        for (const org of v2List) {
            if (org.app_id) {
                console.log(`[System:ProjectStart:initOrganization] 加载组织骨架: ${org.name} (${org.app_id})`);
                await orgStoreV2.loadSkeleton(org.app_id);

                // 启动阶段：逐个组织拉取应用用户列表，填充全局 IDmap
                /*  try {
                      await orgStoreV2.loadApplicationUsers(org.app_id)
                  } catch (e) {
                      console.warn('[System:ProjectStart:initOrganization] loadApplicationUsers 异常:', e)
                  }*/
            }
        }

        // 初始化完成后，不要强制默认选中第一个，交给 Project_Start 后续逻辑决定
        // orgStoreV2.switchOrganization(v2List[0]);
        // console.log(`[System:ProjectStart:initOrganization]初始化完成，默认选中: ${v2List[0].name}`);
        console.log(`[System:ProjectStart:initOrganization]初始化完成，等待应用默认组织策略...`);
    } else {
        console.warn('[System:ProjectStart:initOrganization]未找到组织列表 (UserInfo 可能未返回 valid apps)');
    }
}




// 项目启动时需要确保missionlist里面有一个个人助手的DM房间 Qdq24HAlmmtw89AF
/*
async function ensureUserBotDMRoom() {
    const userBotStore = useUserBotStore();
    const userBot = userBotStore.userBot;
    const username = userBot?.username;
    if (!username) {
        console.warn('[System:ProjectStart:ensureUserBotDMRoom] 当前没有个人助手，跳过确保 DM 房间的步骤');
        return;
    }
    // 获取其DM房间，没有的话就创建
    const DMroom = await GetPrivateRoom(username)
    if (DMroom.ok && DMroom.data?.exists && DMroom.data?.room_id) {
        console.log('[System:ProjectStart:ensureUserBotDMRoom] 个人助手 DM 房间已存在:', DMroom.data.room_id);
        return;
    } else {
        console.log('[System:ProjectStart:ensureUserBotDMRoom] 个人助手 DM 房间不存在，尝试创建 DM 房间');
        const createResult = await CreateDMRoom(username);
        if (!createResult.ok || !createResult.data?.room_id) {
            console.warn('[System:ProjectStart:ensureUserBotDMRoom] CreateDMRoom 创建个人助手 DM 房间失败:', {
                username,
                createResult,
            });
            return;
        }
        console.log('[System:ProjectStart:ensureUserBotDMRoom] CreateDMRoom 创建个人助手 DM 房间成功，房间 ID:', createResult.data.room_id);
        return;
    }
}
*/

// 项目启动时需要确保missionlist里面有一个通用助手的DM房间 Qdq24HAlmmtw89AF
async function ensuretongyongBotDMRoom() {

    const username = 'Qdq24HAlmmtw89AF';
    if (!username) {
        console.warn('[System:ProjectStart:ensuretongyongBotDMRoom] 当前没有通用助手，跳过确保 DM 房间的步骤');
        return;
    }
    // 获取其DM房间，没有的话就创建
    const DMroom = await GetPrivateRoom(username)
    if (DMroom.ok && DMroom.data?.exists && DMroom.data?.room_id) {
        console.log('[System:ProjectStart:ensuretongyongBotDMRoom] 通用助手 DM 房间已存在:', DMroom.data.room_id);
        return;
    } else {
        console.log('[System:ProjectStart:ensuretongyongBotDMRoom] 通用助手 DM 房间不存在，尝试创建 DM 房间');
        const createResult = await CreateDMRoom(username);
        if (!createResult.ok || !createResult.data?.room_id) {
            console.warn('[System:ProjectStart:ensuretongyongBotDMRoom] CreateDMRoom 创建通用助手 DM 房间失败:', {
                username,
                createResult,
            });
            return;
        }
        console.log('[System:ProjectStart:ensuretongyongBotDMRoom] CreateDMRoom 创建通用助手 DM 房间成功，房间 ID:', createResult.data.room_id);
        return;
    }
}