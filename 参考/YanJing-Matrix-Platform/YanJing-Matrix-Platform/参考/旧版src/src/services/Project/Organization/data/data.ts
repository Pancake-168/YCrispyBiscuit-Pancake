import {useOrganizationStore} from '@/stores/organization'
import { API_URLS,MATRIX_SERVER_URL_TAIL } from '@/apiUrls'

import { userInfoManager } from '@/utils/userInfo'
import { removePrefixSuffix, addPrefixSuffix } from '@/utils/stringUtils'



export async function createDepartment(parent: number, name: string, appid?: string) {

    let normalizedAppId = '';

    if (appid) {
        normalizedAppId = removePrefixSuffix(appid, "!", MATRIX_SERVER_URL_TAIL);
    } else {
        const store = useOrganizationStore();
        const currentOrg = store.currentOrganization;
        if (!currentOrg || !currentOrg.application_id) {
            console.error('[createDepartment] 缺少当前组织信息');
            throw new Error('缺少当前组织信息');
        }
        normalizedAppId = removePrefixSuffix(currentOrg.application_id, "!", MATRIX_SERVER_URL_TAIL);
    }

  console.log("创建部门: ", { parent, name });
  console.log("appid: ", normalizedAppId);

  const apiurl = API_URLS.CreateDepartment(normalizedAppId);
  const requestBody = {
    parent,
    name
  };
  
  const response = await fetch(apiurl, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
      const errorText = await response.text();
      console.error('[createDepartment] API请求失败:', response.status, errorText);
      throw new Error(`创建部门失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('[createDepartment] API请求成功:', data);
  return data;
}








export async function InviteUserToApplication(appid: string, InvitedUser: string) {
    try {
        // 处理应用ID和用户名格式
        const finalappid = removePrefixSuffix(appid, "!", MATRIX_SERVER_URL_TAIL)
        const space_id = addPrefixSuffix(appid, "!", MATRIX_SERVER_URL_TAIL)
        let finalInvitedUser = removePrefixSuffix(InvitedUser, "@", MATRIX_SERVER_URL_TAIL)
         finalInvitedUser = addPrefixSuffix(finalInvitedUser, "@", MATRIX_SERVER_URL_TAIL)
        let user = userInfoManager.getLoginField('username')
        user = removePrefixSuffix(user, "@", MATRIX_SERVER_URL_TAIL)
        user=addPrefixSuffix(user, "@", MATRIX_SERVER_URL_TAIL)

        // 构造请求 URL
        const requestUrl = API_URLS.InviteUserToApplication(finalappid);

        // 构造请求体
        const requestBody = {
            space_id, // 应用空间标识(home_server标准格式)
            invite_username: finalInvitedUser, // 被邀请用户的用户名(home_server标准格式)
            username: user // 邀请人的用户名(home_server标准格式)
        };

        console.log(`[InviteUserToApplication] 正在邀请用户 ${finalInvitedUser} 进入应用 ${finalappid}，邀请人: ${user}`);
        console.log('[InviteUserToApplication] 请求URL:', requestUrl);
        console.log('[InviteUserToApplication] 请求体:', requestBody);

        // 发送 POST 请求
        const res = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // 处理响应
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`邀请失败: ${res.status} ${errorText}`);
        }

        // 返回 JSON 结果
        const result = await res.json();
        console.log('[InviteUserToApplication] 邀请成功，响应数据:', result);
        return result;
    } catch (error) {
        console.error('Error inviting user:', error);
        throw error;
    }
}











//加入部门
export async function joinDepartment(username: string, departmentId: string) {
  try {
    let appid = userInfoManager.getPersonalInfo("CURRENTORGANIZATION").application_id;
    appid = removePrefixSuffix(appid, "!", MATRIX_SERVER_URL_TAIL);
    const apiurl = API_URLS.JoinDepartment(appid);

    const username1=removePrefixSuffix(username, "@", MATRIX_SERVER_URL_TAIL);

console.log("[InviteToDepartmentDialog] 邀请用户加入部门, apiurl:", apiurl, " username:", username1, " departmentId:", departmentId);
    const requestBody = {
      username: username1,
      departmentId: departmentId
    };
    const res = await fetch(apiurl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }


  } catch (error) {
    console.error('[InviteToDepartmentDialog]  邀请用户失败:', error);
  }
}

