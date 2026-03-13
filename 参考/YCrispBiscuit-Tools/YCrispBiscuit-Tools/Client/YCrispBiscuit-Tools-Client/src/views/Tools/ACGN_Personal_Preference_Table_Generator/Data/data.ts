import request from '@/utils/request' // 请求工具




// ===================== 统一表输出字段定义 =====================
export interface PreferenceTable {
  /** 所属表id */
  tableId: number;
  /** 名称 */
  name: string;
  /** 主要内容 */
  mainContent: string;
  /** 数据源中数据的数量 */
  number: number;
}




// ===================== 统一数据源输出字段定义 =====================
export interface PreferenceTableItem {
  /** 所属表id */
  tableId: number;
  /** 唯一标识id */
  id: number;
  /** 名称 */
  name: string;
  /** 图片url */
  image: string;
}





/**
 * 获取所有生成器表数据
 * GET /ACGN_Personal_Preference_Table_Generator/
 * @returns Promise<PreferenceTable[]>
 */
export async function fetchAllPreferenceTables(): Promise<PreferenceTable[]> {
  const res = await request.get('/api/ACGN_Personal_Preference_Table_Generator/all')
  console.log('fetchAllPreferenceTables 返回：', res) // 日志输出
  const arr = Array.isArray(res) ? res : res?.data // 只判断 res
  if (!Array.isArray(arr)) {
    console.warn('fetchAllPreferenceTables 未获取到数组，实际返回：', res)
    return []
  }
  const mapped = arr.map(item => ({
    tableId: item.ACGN_Personal_Preference_Table_Generator_ID,
    name: item.ACGN_Personal_Preference_Table_Generator_Name,
    mainContent: item.ACGN_Personal_Preference_Table_Generator_Main_Content,
    number: item.Data_Source_Number
  }))
  console.log('fetchAllPreferenceTables 映射后：', mapped)
  return mapped
}




// 获取指定表的数据源
/**
 * 获取指定表的数据源
 * GET /ACGN_Personal_Preference_Table_Generator/items?tableId=xxx
 * @param tableId 表id
 * @returns Promise<PreferenceTableItem[]>
 */
export async function fetchPreferenceTableItems(tableId: number): Promise<PreferenceTableItem[]> {
  console.log('fetchPreferenceTableItems tableId返回：', tableId)
  const res = await request.get(`/api/Data_Source_ACGN_Personal_Preference_Table_Generator/${tableId}`)
  console.log('fetchPreferenceTableItems 返回：', res)
  const arr = Array.isArray(res) ? res : res?.data
  if (!Array.isArray(arr)) {
    console.warn('fetchPreferenceTableItems 未获取到数组，实际返回：', res)
    return []
  }
  // 图片基础URL，根据实际后端服务地址修改
  const IMAGE_BASE_URL = 'http://localhost:8080/static/'; // TODO: 部署时请替换为实际后端地址

  return arr.map(item => ({
    tableId: item.ACGN_Personal_Preference_Table_Generator_ID,
    id: item.Item_ID,
    name: item.Item_Name,
    image: item.Item_Picture
      ? IMAGE_BASE_URL + item.Item_Picture.replace(
        /^resources[\\\/]?/, // 匹配开头的 resources/ 或 resources\
        ''
      )
      : '',
  }))
}

/**
 * 触发后端爬取指定表ID的数据源
 * POST /Data_Source_ACGN_Personal_Preference_Table_Generator/fetch/{id}
 * @param tableId 表id
 * @returns Promise<{ success: boolean, message: string }>
 */
export async function fetchDataSourceByGeneratorId(tableId: number): Promise<{ success: boolean, message: string }> {
  console.log('fetchDataSourceByGeneratorId tableId返回：', tableId)
  const res = await request.post(`/api/Data_Source_ACGN_Personal_Preference_Table_Generator/fetch/${tableId}`)
  console.log('fetchDataSourceByGeneratorId 返回：', res)
  return res as unknown as { success: boolean, message: string }
}



