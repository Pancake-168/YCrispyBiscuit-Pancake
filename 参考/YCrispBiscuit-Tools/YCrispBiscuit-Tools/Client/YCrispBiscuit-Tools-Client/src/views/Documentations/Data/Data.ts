import request from '@/utils/request' // 请求工具


// ===================== 统一分区字段定义 =====================
export interface Documentations {
  /** 文件夹名称 */
  folder_name: string;
  /** logo */
  logo: string;
  /** 唯一标识Key */
  Documentations_Key: string;
  /** 分区名称 */
  Documentations_Title: string;
  /** 分区简要描述 */
  Documentations_Desc: string;
  /** 分区详情 */
  Documentations_Details: string;
}

const IMAGE_BASE_URL = 'http://localhost:8080/static/'; // TODO: 部署时请替换为实际后端地址

let _cachedPartitions: any[] | null = null;

// 获取所有分区原始数据（只请求一次，后续用缓存）
export async function fetchAllPartitions(): Promise<any[]> {
  if (_cachedPartitions) return _cachedPartitions ?? [];
  try {
    const res = await request.get('/api/Documentations/all');
    const data = res.data || res;
    _cachedPartitions = data.partitions || [];
    return _cachedPartitions ?? [];
  } catch (e) {
    _cachedPartitions = [];
    return [];
  }
}

// 获取指定分区下所有md文件（递归获取，包括子文件夹）
export async function getCategoryDocs(categoryKey: string): Promise<{ title: string, key: string, label: string }[]> {
  const partitions = await fetchAllPartitions();
  const partition = partitions.find((p: any) => p.folder_name === categoryKey);
  if (!partition || !Array.isArray(partition.children)) return [];

  // 递归遍历所有子文件夹，收集所有 md 文件
  function collectMdFiles(children: any[], parentPath = ''): { title: string, key: string, label: string }[] {
    let result: { title: string, key: string, label: string }[] = [];
    for (const c of children) {
      if (c.type === 'file' && c.name.endsWith('.md')) {
        const filePath = parentPath ? parentPath + '/' + c.name : c.name;
        const label = filePath.replace(/\.md$/i, '');
        console.log('[collectMdFiles] file:', { title: c.name, key: filePath, label });
        result.push({
          title: c.name,
          key: filePath,
          label
        });
      } else if (c.type === 'folder' && Array.isArray(c.children)) {
        const folderName = c.folder_name || c.name || '';
        const folderPath = parentPath ? parentPath + '/' + folderName : folderName;
        console.log('[collectMdFiles] folder:', { folderName, folderPath });
        result = result.concat(collectMdFiles(c.children, folderPath));
      }
    }
    return result;
  }

  const docs = collectMdFiles(partition.children, '');
  console.log('[getCategoryDocs] docs:', docs);
  return docs;
}

// 获取分区原始数据（全字段原样，直接用于页面渲染）
export async function getDocumentationsList(): Promise<Documentations[]> {
  const partitions = await fetchAllPartitions();
  return partitions.map((item: any) => ({
    folder_name: item.folder_name,
    logo: item.logo
      ? IMAGE_BASE_URL + item.logo.replace(
        /^resources[\/]?/, ''
      ) : '',
    Documentations_Key: item.info?.Documentations_Key || '',
    Documentations_Title: item.info?.Documentations_Title || '',
    Documentations_Desc: item.info?.Documentations_Desc || '',
    Documentations_Details: item.info?.Documentations_Details || '',
  }));
}

// 获取指定md文档内容（直接访问静态资源）
export async function getDocContent(docKey: string, categoryKey?: string): Promise<string> {
  if (!docKey || !categoryKey) return '';
  try {
    // 拼接静态md文件URL，如 /static/分区名/xxx.md
    const url = `/api/static/Documentations/${categoryKey}/${docKey}`;

    console.log(`getDocContent 请求URL：`, url); // 日志输出
    const res = await request.get(url, { responseType: 'text' });
    //const res = await axios.get(url, { responseType: 'text' });
    //console.log('原生 axios 返回：', res);
    // axios自动解包data，直接返回字符串内容
    console.log(`getDocContent 返回：`, res); // 日志输出
    console.log('getDocContent 返回类型:', typeof res, res);
    return typeof res === 'string' ? res : (res?.data ?? '');
  } catch {
    return '';
  }
}