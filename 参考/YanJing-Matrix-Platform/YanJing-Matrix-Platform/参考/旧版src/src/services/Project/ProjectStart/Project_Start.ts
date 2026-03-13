import { API_URLS, MATRIX_SERVER_URL } from '../../../apiUrls';
import { userInfoManager } from '@/utils/userInfo'
import { useTaskStore } from '@/stores/task'
import { useOrganizationStore } from '@/stores/organization'
import { useOrganizationStoreV2 } from '@/stores/organizationV2'
import { fetchAllOrgTrees } from '@/services/Project/Organization/data/defaultData'
import { wechatSSOService } from '@/services/SSO/wechatSSO'
import { UserInfo } from '@/services/SSO/UserInfo'
import { GetUserBot } from '@/services/userbot/GetUserBot'


export async function Project_Start() {
    // 在这里执行项目的自动化操作序列

    // -1. NocoBase token 兑换（不妨碍后续逻辑）
    await wechatSSOService.generateNocobaseToken()

    // 0. 获取微信详细资料 (SSO 登录后或刷新页面时恢复)
    await UserInfo()

    //第一个，调用api从后端获取必要的application_id，这个是智能体市场id
    // await getApplicationFromTag()


    //第二个，调用api从后端获取必要的组织列表，每个组织的核心，注意这是一个list
    // await getOrganizationList()


    //获取组织架构
    //await NewProject_Start_GetAllOrgTrees()


    //V2获取组织架构
    await initOrganizationV2()


    //获取个人助手
    await GetUserBot()


    //第三个，调用api获取系统图谱
    //await fetchFullOverView('a_9rbvzez4jx6')



    //第n个:设置当前组织
    // 逻辑顺序 (后者覆盖前者): 
    // 1. 本地记录的“当前组织” (CURRENTORGANIZATION)
    // 2. 跳转参数指定的“来源组织” (FromOrganization) -> 只要存在有效值，就覆盖前者
    const orgStoreV2 = useOrganizationStoreV2();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentOrgRaw = userInfoManager.getPersonalInfo('CURRENTORGANIZATION');
    const fromOrgId = localStorage.getItem('FromOrganization');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let targetOrg: any = null;
    let source = '';

    // 1. 尝试匹配 CURRENTORGANIZATION
    console.log('[Project_Start] 检查本地存储 CURRENTORGANIZATION:', currentOrgRaw);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (currentOrgRaw && (currentOrgRaw as any).app_id) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const appId = (currentOrgRaw as any).app_id;
         // 强转字符串比较
         const found = orgStoreV2.organizationList.find(org => String(org.app_id) === String(appId));
         if (found) {
             targetOrg = found;
             source = 'CURRENTORGANIZATION';
         } else {
             console.warn(`[Project_Start] 本地记录的 appId (${appId}) 在当前组织列表里找不到`);
         }
    }

    // 2. 尝试匹配 FromOrganization (如果有，直接覆盖目标)
    if (fromOrgId) {
        const found = orgStoreV2.organizationList.find(org => String(org.app_id) === String(fromOrgId));
        if (found) {
            targetOrg = found;
            source = 'FromOrganization';
        }
    }

    if (targetOrg) {
        orgStoreV2.switchOrganization(targetOrg);
        console.log(`[Project_Start] 已切换到组织 (${source}): ${targetOrg.name} (${targetOrg.app_id})`);

        // 3. 如果 FromOrganization 生效了，则清除它
        if (source === 'FromOrganization') {
            localStorage.removeItem('FromOrganization');
            console.log('[Project_Start] 已清除本地存储的 FromOrganization');
        }
    } else {
        // 4. [Fallback] 如果以上都没命中（比如新用户），默认选第一个
        if (orgStoreV2.organizationList.length > 0) {
             const defaultOrg = orgStoreV2.organizationList[0];
             orgStoreV2.switchOrganization(defaultOrg);
             console.log(`[Project_Start] 无历史记录/跳转参数，默认选中第一个组织: ${defaultOrg.name}`);
        } else {
             console.log('[Project_Start] 本地无有效组织记录，且列表为空');
        }
    }


}

/**
 * 获取微信详细资料并存入 store
 * 放在 Project_Start 最开始，确保刷新页面也能恢复昵称和头像
 */
/*
async function fetchWechatProfile() {
    const wechatStore = useWechatStore()
    const client = matrixClientV2.getAuthedClient()
    if (!client) {
        console.log('[Project_Start] Matrix 客户端未就绪，跳过微信资料获取');
        return
    }

    const userId = client.getUserId()
    if (!userId) return

    try {
        console.log('[Project_Start] 正在获取微信详细资料...');
        const userinfoRes = await fetch(API_URLS.GetWechatUserInfo(userId));
        if (userinfoRes.ok) {
            const detailedInfo = await userinfoRes.json();
            wechatStore.rawSsoResponse = detailedInfo;
            console.log('[Project_Start] 微信详细资料已存入 store:', detailedInfo);
        } else {
            console.warn('[Project_Start] 获取微信详细资料失败:', userinfoRes.status);
        }
    } catch (err) {
        console.error('[Project_Start] 获取微信详细资料时发生错误:', err);
    }
}
*/





async function getApplicationFromTag(): Promise<void> {
    try {
        console.log('[Project_Start] 开始获取智能体市场数据...');

        // 调用API获取智能体市场空间数据，传参固定为 'market'
        const response = await fetch(API_URLS.GetApplicationFromTag('market'), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // 如果是404，记录警告但不抛出错误，继续运行
            if (response.status === 404) {
                console.warn('[Project_Start] 智能体市场API不存在 (404)，跳过数据获取');
                userInfoManager.addField('APPLICATION', []);
                userInfoManager.addField('APPLICATION_ID', null);
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const applicationData = await response.json();
        console.log('[Project_Start] 获取到应用数据:', applicationData);

        // 验证返回的数据格式
        if (!Array.isArray(applicationData)) {
            throw new Error('返回的数据格式不正确，期望为数组');
        }

        // 将获取到的数组存储到 userInfoManager 中，字段名为 APPLICATION（全大写）
        userInfoManager.addField('APPLICATION', applicationData);

        console.log('[Project_Start] 应用数据已存储到 userInfoManager.APPLICATION');
        console.log('[Project_Start] 存储的数据:', applicationData);

        // 如果需要获取 application_id，可以从第一个元素中提取
        if (applicationData.length > 0 && applicationData[0].application_id) {
            const applicationId = applicationData[0].application_id;
            console.log('[Project_Start] 提取到 application_id:', applicationId);

            // 也可以单独存储 application_id 以便快速访问
            userInfoManager.addField('APPLICATION_ID', applicationId);
        }

    } catch (error) {
        console.error('[Project_Start] 获取应用数据失败:', error);
        // 在错误情况下，存储空数组以避免后续代码出错，但不抛出错误
        userInfoManager.addField('APPLICATION', []);
        userInfoManager.addField('APPLICATION_ID', null);
        // throw error; // 注释掉这行，不抛出错误
    }
}




export async function getOrganizationList(): Promise<void> {

    try {
        console.log('[Project_Start] 开始获取组织列表数据...');

        // 第一步：调用API获取组织列表，传参固定为 'organization'
        const response = await fetch(API_URLS.GetApplicationFromTag('organization'), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const organizationData = await response.json();
        console.log('[Project_Start] 获取到组织列表数据:', organizationData);

        // 验证返回的数据格式
        if (!Array.isArray(organizationData)) {
            throw new Error('返回的数据格式不正确，期望为数组');
        }

        // 第二步：获取当前用户名并调用 getApplicationByUser
        const username = userInfoManager.getLoginField('username');
        if (!username) {
            throw new Error('无法获取当前用户名');
        }

        // 调用内部函数获取用户应用数据，直接返回结果用于过滤
        const userApplicationData = await getUserApplicationData(username);
        console.log('[Project_Start] 获取到用户应用数据:', userApplicationData);

        // 第三步：使用用户应用数据过滤组织列表
        // 使用 application_id 和 application_tag 双重匹配进行过滤
        const filteredOrganizationData = organizationData.filter((org: any) => {
            // 检查是否存在匹配的用户应用
            return userApplicationData.some((userApp: any) =>
                userApp.application_id === org.application_id &&
                userApp.application_tag === org.application_tag
            );
        });

        console.log('[Project_Start] 用户应用数据:', userApplicationData);
        console.log('[Project_Start] 过滤条件: application_id + application_tag 双重匹配');

        console.log('[Project_Start] 过滤后的组织列表:', filteredOrganizationData);

        // 存储过滤后的数据到 userInfoManager 的 ORGANIZATION 字段
        userInfoManager.addField('ORGANIZATION', filteredOrganizationData);
        console.log('[Project_Start] 过滤后的组织列表已存储到 userInfoManager.ORGANIZATION');
        console.log('[Project_Start] 存储的数据:', filteredOrganizationData);








    } catch (error) {
        console.error('[Project_Start] 获取组织列表失败:', error);
        // 错误情况下存储空数组
        userInfoManager.addField('ORGANIZATION', []);
        // 不再抛出错误，直接返回
    }
}




// 根据用户名获取用户所在的应用
export async function getApplicationByUser(username: string): Promise<void> {
    try {
        console.log('[Project_Start] 开始获取用户应用数据...');

        const response = await fetch(API_URLS.GetApplicationByUser(username), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const applicationData = await response.json();
        console.log('[Project_Start] 获取到用户应用数据:', applicationData);

        // 验证返回的数据格式


        // 存储到 userInfoManager 的 USER_APPLICATION 字段
        userInfoManager.addField('USER_APPLICATION', applicationData);
        console.log('[Project_Start] 用户应用数据已存储到 userInfoManager.USER_APPLICATION');

    } catch (error) {
        console.error('[Project_Start] 获取用户应用数据失败:', error);
        // 错误情况下存储空数组
        userInfoManager.addField('USER_APPLICATION', []);
        // 不再抛出错误，直接返回
    }
}

// 内部函数：获取用户应用数据并直接返回，不存储
async function getUserApplicationData(username: string): Promise<any[]> {
    try {
        console.log('[Project_Start] 调用API获取用户应用数据...');

        const response = await fetch(API_URLS.GetApplicationByUser(username), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const applicationData = await response.json();
        console.log('[Project_Start] API返回用户应用数据:', applicationData);

        // 验证返回的数据格式
        if (!Array.isArray(applicationData)) {
            throw new Error('返回的用户应用数据格式不正确，期望为数组');
        }

        return applicationData;

    } catch (error) {
        console.error('[Project_Start] 获取用户应用数据失败:', error);
        return [];
    }
}

/**
 * 获取任务列表
 * 调用 NocobaseSessions API 获取用户的任务列表，每个任务对应一个 Matrix 房间
 * 此函数独立导出，不在 Project_Start() 中调用，而是在 MainPage 初始化流程中调用
 */
export async function getTaskList(): Promise<void> {
    try {
        console.log('[Project_Start] 开始获取任务列表...');

        // 从 userInfoManager 获取当前用户信息
        const username = userInfoManager.getLoginField('username');


        if (!username) {
            throw new Error('无法获取当前用户信息，username 缺失');
        }

        // 构建完整的用户账号：@username:homeserver，全称
        const fullUserAccount = `@${username}:${MATRIX_SERVER_URL}`;

        // 构建 bot 账号，简称
        const botAccountSimple = `${username}userbot`;

        console.log('[Project_Start] 用户账号:（全称）', fullUserAccount);
        console.log('[Project_Start] Bot账号:（简称）', botAccountSimple);

        // URL 编码特殊字符（@、:）
        const encodedBotAccount = encodeURIComponent(botAccountSimple);
        const encodedUserAccount = encodeURIComponent(fullUserAccount);

        // 调用 API 获取任务列表
        const response = await fetch(
            API_URLS.NocobaseSessions('root', encodedBotAccount, encodedUserAccount),
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const taskListData = await response.json();
        console.log('[Project_Start] 获取到任务列表数据:', taskListData);

        // 验证返回的数据格式
        if (!Array.isArray(taskListData)) {
            throw new Error('返回的任务列表数据格式不正确，期望为数组');
        }

        // 双存储：1. 存储到 Pinia store（业务逻辑使用）
        const taskStore = useTaskStore()
        taskStore.setTaskList(taskListData)
        console.log('[Project_Start]  任务列表已存储到 Pinia store（业务数据）')

        // 双存储：2. 存储到 localStorage（通过 userInfoManager，方便调试查看）
        const taskRoomIds = taskListData.map((task: any) => task.room_id).filter(Boolean)
        userInfoManager.addField('TASK_LIST', taskListData)
        userInfoManager.addField('TASK_ROOM_IDS', taskRoomIds)
        console.log('[Project_Start]  任务列表已存储到 localStorage（调试数据）')
        console.log('[Project_Start] 任务房间ID列表:', taskRoomIds)

    } catch (error) {
        console.error('[Project_Start] 获取任务列表失败:', error);
        // 错误情况下存储空数组，确保后续代码不会因为数据缺失而报错

        // 清空 Pinia store
        const taskStore = useTaskStore()
        taskStore.clearTaskList()

        // 清空 localStorage
        userInfoManager.addField('TASK_LIST', []);
        userInfoManager.addField('TASK_ROOM_IDS', []);

        console.log('[Project_Start]  任务列表已重置为空数组')
        // 不抛出错误，让程序继续运行
    }
}





















// --- [New Architecture] 新版组织架构初始化 ---
export async function NewProject_Start_GetAllOrgTrees() {
    console.log('[Project_Start] [New] 开始新版组织架构初始化...');
    const orgStore = useOrganizationStore();

    try {
        // 1. 获取所有组织 (Tag=organization)
        const orgRes = await fetch(API_URLS.GetApplicationFromTag('organization'));
        if (!orgRes.ok) throw new Error('Fetch organization failed');
        const allOrgs = await orgRes.json();

        // 2. 获取用户应用权限
        const username = userInfoManager.getLoginField('username');
        if (!username) throw new Error('未找到用户信息');

        const userAppRes = await fetch(API_URLS.GetApplicationByUser(username));
        if (!userAppRes.ok) throw new Error('Fetch user apps failed');
        const userApps = await userAppRes.json();

        // 3. 过滤: application_id 和 application_tag 双重匹配
        const myOrgs = allOrgs.filter((org: any) =>
            Array.isArray(userApps) && userApps.some((uApp: any) =>
                uApp.application_id === org.application_id &&
                uApp.application_tag === org.application_tag
            )
        );

        console.log(`[Project_Start] [New] 获取到 ${myOrgs.length} 个组织`);

        // 4. 存入 Store
        orgStore.setOrganizationList(myOrgs);

        // 5. 针对每个组织，获取全部分页组织骨架
        if (myOrgs.length > 0) {
            for (const org of myOrgs) {
                // 切换当前组织 (fetchAllOrgTrees 依赖当前组织上下文)
                orgStore.switchOrganization(org);
                console.log(`[Project_Start] [New] 加载组织骨架: ${org.application_name}`);

                // 调用新版 Service 获取树结构
                await fetchAllOrgTrees();
            }

            // 初始化完成后，默认切回第一个
            orgStore.switchOrganization(myOrgs[0]);
            console.log(`[Project_Start] [New] 初始化完成，默认选中: ${myOrgs[0].application_name}`);
        } else {
            console.warn('[Project_Start] [New] 未找到有效组织，跳过骨架获取');
        }

    } catch (e) {
        console.error('[Project_Start] [New] 初始化异常:', e);
    }
}





// --- [V2] V2 组织架构初始化 ---
export async function initOrganizationV2() {
    console.log('[Project_Start] [V2] 开始初始化 V2 组织架构...');
    const orgStoreV2 = useOrganizationStoreV2();

    // 此时 orgStoreV2.organizationList 应该已经被 UserInfo() -> setOrganizationList() 填充
    const v2List = orgStoreV2.organizationList;

    if (v2List.length > 0) {
        for (const org of v2List) {
            if (org.app_id) {
                console.log(`[Project_Start] [V2] 加载组织骨架: ${org.name} (${org.app_id})`);
                await orgStoreV2.loadSkeleton(org.app_id);

                // 启动阶段：逐个组织拉取应用用户列表，填充全局 IDmap
                /*  try {
                      await orgStoreV2.loadApplicationUsers(org.app_id)
                  } catch (e) {
                      console.warn('[Project_Start] [V2] loadApplicationUsers 异常:', e)
                  }*/
            }
        }

        // 初始化完成后，不要强制默认选中第一个，交给 Project_Start 后续逻辑决定
        // orgStoreV2.switchOrganization(v2List[0]);
        // console.log(`[Project_Start] [V2] 初始化完成，默认选中: ${v2List[0].name}`);
        console.log(`[Project_Start] [V2] 初始化完成，等待应用默认组织策略...`);
    } else {
        console.warn('[Project_Start] [V2] 未找到组织列表 (UserInfo 可能未返回 valid apps)');
    }
}