


export async function handleCreateApplication({ displayName}) {


  const appid = "dXYbunLgXrwIjFOvBF";
  const res = await fetch(API_URLS.createApplication(appid), {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ displayName, author: "ycb" })
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * 批量创建应用，每15秒执行一次
 * @param {Array<{displayName: string, author: string}>} appList - 应用列表
 */
export async function batchCreateApplications(appList) {
  const results = [];
  console.log(` 开始批量创建任务，共 ${appList.length} 个应用`);
  
  for (let i = 0; i < appList.length; i++) {
    const app = appList[i];
    console.log(`\n[${i + 1}/${appList.length}] 正在创建: ${app.displayName}`);
    
    try {
      const result = await handleCreateApplication(app);
      if (result.ok) {
        console.log(` 创建成功: ${app.displayName}`, result.data);
        results.push({
          status: 'success',
          input: app,
          result: result.data
        });
      } else {
        console.error(` 创建失败: ${app.displayName}`, result.data);
        results.push({
          status: 'failed',
          input: app,
          error: result.data
        });
      }
    } catch (error) {
      console.error(` 请求异常: ${app.displayName}`, error);
      results.push({
        status: 'error',
        input: app,
        error: error.message
      });
    }

    // 如果不是最后一个任务，则等待15秒
    if (i < appList.length - 1) {
      console.log(' 等待 15 秒...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  console.log('\n 所有批量创建任务执行完毕');
  return results;
}





// API URL 配置文件 - 统一管理所有完整的接口 URL





// 基础域名,这个是api用到的
// 开发环境使用相对路径（通过 Vite 代理），生产环境使用完整 URL
export const BASE_URL = 'https://api.zheshu.tech/test';  // 开发环境使用相对路径通过代理
// 旧服务器地址已移除：'https://chat.zy-jn.org.cn';




export const API_URLS = {


  //token问题
  //智能体市场创建应用post
  createApplication: (appid) => `${BASE_URL}/api/v2/${appid}/map/application/create`,

  
}


