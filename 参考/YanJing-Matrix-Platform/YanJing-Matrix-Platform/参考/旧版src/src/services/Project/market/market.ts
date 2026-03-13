
import { API_URLS } from '@/apiUrls';
import { userInfoManager } from '@/utils/userInfo'



// 创建应用的API方法
export async function handleCreateApplication({ displayName, author }: { displayName: string; author: string }) {


  const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
  const res = await fetch(API_URLS.createApplication(appid), {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ displayName, author })
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

// 获取智能体市场的公有应用列表 (GET)
export async function fetchPublicApplications(page: number = 1) {
  try {
    const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
    //const appid="applicationMarket"


    console.log("fetchPublicrApplications中的appid:", appid);


    const res = await fetch(API_URLS.getPublicApplications1(appid, page), {
      method: 'GET',
      headers: { 'accept': 'application/json' }
    });
 
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error) {
    console.error('fetchPublicApplications error:', error);
    return { ok: false, data: null };
  }
}

// 获取指定用户的应用列表 (GET)
export async function fetchUserApplications(userId: string, page: number = 1) {
  try {
    const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
    console.log("fetchUserApplications中的appid:", appid);
    console.log("fetchUserApplications中的userId:", userId);

    const res = await fetch(API_URLS.getUserApplications(appid, userId, page), {
      method: 'GET',
      headers: { 'accept': 'application/json' }
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error) {
    console.error('fetchUserApplications error:', error);
    return { ok: false, data: null };
  }
}


//搜索指定的公有应用并返回搜索结果
export async function searchMarketApplications(name: string, page: number = 1) {
  try {
    const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
    //const appid="applicationMarket"


    console.log("searchMarketApplications的appid:", appid);


    const res = await fetch(API_URLS.searchMarketApplications(appid, encodeURIComponent(name), page), {
      method: 'GET',
      headers: { 'accept': 'application/json' }
    });
 
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error) {
    console.error('searchMarketApplications error:', error);
    return { ok: false, data: null };
  }
}




// 获取指定应用下的智能体Agent列表 (GET)
export async function fetchApplicationAgents(marketappid: string) {

  const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
  const res = await fetch(API_URLS.getApplicationAgents(appid, marketappid), {
    method: 'GET',
    headers: { 'accept': 'application/json' }
  });
  body: JSON.stringify(marketappid)
  const data = await res.json();
  return { ok: res.ok, data };
}

// 获取智能体Agent信息 (GET)
export async function fetchAgentInfo(agentId: string) {
  const res = await fetch(API_URLS.getAgentInfo(agentId), {
    method: 'GET',
    headers: { 'accept': 'application/json' }
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

// 公开指定的应用 (POST)
export async function publicApplication(marketid: string, isPublic: boolean) {

  const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
  const requestUrl = API_URLS.publicApplication(appid, marketid);
  const requestBody = { isPublic };



  try {
    const res = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });



    const data = await res.json();

    console.log(' Response 数据:');
    console.log('  - data:', data);
    console.log('  - data (JSON字符串):', JSON.stringify(data, null, 2));

    const result = { ok: res.ok, data };
    console.log(' publicApplication API 调用完成，返回:', result);

    return result;
  } catch (error) {
    console.error(' publicApplication API 调用异常:', error);
    console.error('异常详情:', {
      message: (error as Error).message || '未知错误',
      stack: (error as Error).stack || '无堆栈信息',
      name: (error as Error).name || '未知异常类型'
    });
    throw error;
  }
}

// 公开指定的智能体 (POST)
export async function publicAgent(agentId: string, isPublic: boolean) {


  const requestUrl = API_URLS.publicAgent(agentId);
  const requestBody = { isPublic };



  try {
    const res = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });



    const data = await res.json();



    const result = { ok: res.ok, data };
    console.log(' publicAgent API 调用完成，返回:', result);

    return result;
  } catch (error) {
    console.error(' publicAgent API 调用异常:', error);
    console.error('异常详情:', {
      message: (error as Error).message || '未知错误',
      stack: (error as Error).stack || '无堆栈信息',
      name: (error as Error).name || '未知异常类型'
    });
    throw error;
  }
}




//部署agent智能体
export async function deployAgent(agentId: string, isDeploy: boolean) {

  const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
  const requestUrl = API_URLS.deployAgent(appid, agentId);



  try {
    const res = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ state: String(isDeploy) })

    });



    const data = await res.json();

    console.log(' Response 数据:');
    console.log('  - data:', data);
    console.log('  - data (JSON字符串):', JSON.stringify(data, null, 2));

    const result = { ok: res.ok, data };
    console.log(' deployAgent API 调用完成，返回:', result);

    return result;
  } catch (error) {
    console.error(' deployAgent API 调用异常:', error);
    console.error('异常详情:', {
      message: (error as Error).message || '未知错误',
      stack: (error as Error).stack || '无堆栈信息',
      name: (error as Error).name || '未知异常类型'
    });
    throw error;
  }
}



//撤销agent智能体部署
export async function undeployAgent(agentId: string) {
  console.log(' undeployAgent API 调用开始');
  console.log(' 请求参数:');
  console.log('  - agentId (原始):', agentId);
  console.log('  - agentId (类型):', typeof agentId);

  const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
  const requestUrl = API_URLS.deployAgent(appid, agentId);


  try {
    const res = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agentid: String(agentId) })
    });



    const data = await res.json();

    console.log(' Response 数据:');
    console.log('  - data:', data);
    console.log('  - data (JSON字符串):', JSON.stringify(data, null, 2));

    const result = { ok: res.ok, data };
    console.log(' undeployAgent API 调用完成，返回:', result);

    return result;
  } catch (error) {
    console.error(' undeployAgent API 调用异常:', error);
    console.error('异常详情:', {
      message: (error as Error).message || '未知错误',
      stack: (error as Error).stack || '无堆栈信息',
      name: (error as Error).name || '未知异常类型'
    });
    throw error;
  }
}






//创建智能体
export async function createAgent(agentData: { masket_id: string; botAccount: string; botNickname: string; author: string }) {
  console.log(' createAgent API 调用开始');
  console.log(' 请求参数:', agentData);

  const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
  const requestUrl = API_URLS.createAgent(appid);



  try {
    const res = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agentData)
    });



    const data = await res.json();

    console.log(' Response 数据:', data);

    const result = { ok: res.ok, data };
    console.log(' createAgent API 调用完成，返回:', result);

    return result;
  } catch (error) {
    console.error(' createAgent API 调用异常:', error);
    throw error;
  }
}




// 删除智能体
export async function destroyAgent({ agent_id }: { agent_id: string }) {


  const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
  const requestUrl = API_URLS.destroyAgent(appid, agent_id);

  const res = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function editorAgent({ appid, agentAccount, userAccount }: { appid: string, agentAccount: string, userAccount: string }) {

  console.log("接收到参数:", { appid, agentAccount, userAccount });

  const res = await fetch(API_URLS.editorAgent(appid), {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ agentAccount, userAccount })
  });
  const data = await res.json();
  return { ok: res.ok, data };
}


// 复制智能体市场上的应用
export async function handleMarketCopyApplication({ displayName, description, copy_appid, organization_name }: {
  displayName: string;
  description: string;
  copy_appid: string;
  organization_name: string;
}) {


  try {

    // 获取当前用户账号作为 author
    const author = userInfoManager.getLoginField('username');




    // config 字段结构调整为 { organization: { organization_name: ... } }
    const config = {
      organization: {
        name: organization_name || '' // 组织名称留空，后续补充
      }
    };

    const requestBody = {
      displayName,
      author,
      description,
      copy_appid,
      config
    };

    const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
    console.log("复制应用请求参数:", requestBody);
    console.log("请求的url链接:", API_URLS.MarketCopyApplication(appid));
    const res = await fetch(API_URLS.MarketCopyApplication(appid), {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }
  catch (error) {
    console.log(error)
  }
}






// 部署市场上的应用
export async function handleMarketApplicationDeploy(params: {
  account: string;
  app_marketid: string;
  organization_appid: string;
  organization_department_id: string;
}) {
  try {
    const appid = userInfoManager.getPersonalInfo("APPLICATION_ID");
    const res = await fetch(API_URLS.MarketApplicationDeploy(appid), {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error) {
    console.error('handleMarketApplicationDeploy error:', error);
    return { ok: false, data: null };
  }
}