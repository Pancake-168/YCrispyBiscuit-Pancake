import { API_URLS } from '@/apiUrls';




//获取指定applicationID和account的markdown内容
export async function fetchMarkdownContent(applicationId: string, account: string) {
  // 对account参数进行URL编码以处理特殊字符
  const encodedAccount = encodeURIComponent(account);
  const url = API_URLS.getMarkdown(applicationId, encodedAccount);
  
  console.log('API请求URL:', url);
  console.log('原始参数 - applicationId:', applicationId, 'account:', account);
  console.log('编码后参数 - encodedAccount:', encodedAccount);
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'accept': 'application/json' }
    });
    
    console.log('API响应状态:', res.status);
    console.log('API响应URL:', res.url);
    
    const data = await res.json();
    
    console.log('API响应数据:', data);
    
    return { ok: res.ok, data };
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}