import { APIClient } from '@nocobase/sdk'
import { nocoClient } from './client'

/**
 * 函数1：解析 NocoBase 页面 URL
 * ...existing code...
 */
export function parseNocoUrl(url: string) {
  // ...existing code...
  try {
    // 兼容完整 URL 和相对路径
    const path = url.startsWith('http') ? new URL(url).pathname : url

    // 1. 获取 AppID (如果有)
    // 匹配 /apps/ 后面的一段
    const appMatch = path.match(/\/apps\/([^\/]+)/)
    const appId = appMatch ? appMatch[1] : null

    // 2. 获取 SchemaUID
    // 逻辑：取 URL 路径的最后一段，不再依赖 /admin/ 前缀
    // 这样无论是 /admin/, /mobile/, /public/ 都能正常提取
    const cleanPath = path.replace(/[\/\\]+$/, '') // 去除末尾斜杠
    const segments = cleanPath.split('/')
    const schemaUid = segments.length > 0 ? segments[segments.length - 1] : null

    console.log(`[NocoBase] 解析 URL: ${url}`)
    console.log(`[NocoBase] AppID: ${appId}, SchemaUID: ${schemaUid}`)

    if (!schemaUid) {
      throw new Error('无法从 URL 中解析出 SchemaUID')
    }

    return { appId, schemaUid }
  } catch (error) {
    console.error('[NocoBase] URL 解析失败:', error)
    throw error
  }
}

/**
 * 函数2：获取该链接页面下的全量信息
 * 组合获取：Schema (结构) -> Fields (字段) -> Data (内容)
 * 
 * @param url 页面完整 URL
 */
export async function fetchFullPageContent(url: string) {
  console.group('[NocoBase] 开始获取全量页面信息')
  
  try {
    // =====================================================
    // 第1步：依照函数1的返回值获取关键参数
    // =====================================================
    const { appId, schemaUid } = parseNocoUrl(url)
    
    // 关键修正：创建一个专门针对目标 App 的临时 SDK 客户端
    let targetClient: APIClient

    if (appId) {
      console.log(`1. 检测到 App 上下文 [${appId}]，正在配置 SDK 客户端 (X-App Header)...`)
      // 根据参考日志 (1.txt)，NocoBase 多应用模式下 API 路径依然是 /api/
      // 但是需要通过 X-App 请求头来指定应用上下文
      targetClient = new APIClient({
        baseURL: `/nocobase-proxy/api/`, // 保持根路径
        headers: {
          'X-App': appId // 添加应用标识头
        }
      })
      // 共享主客户端的 Token (实现免登漫游)
      targetClient.auth.setToken(nocoClient.auth.getToken())
    } else {
      console.log(`1. 未检测到 App 上下文，使用主 SDK 客户端`)
      targetClient = nocoClient
    }


    // =====================================================
    // 第2步：依照 SchemaUID 获取数据表结构 (UI Schema)
    // =====================================================
    console.log(`2. 正在获取页面结构 (SchemaUID: ${schemaUid})...`)
    
    let schema = null
    
    // 尝试直接获取 Schema
    try {
      const schemaResponse = await targetClient.request({
        url: `/uiSchemas:getJsonSchema/${schemaUid}`,
        params: {
          includeAsyncNode: true
        }
      })
      schema = schemaResponse.data?.data
    } catch (e: any) {
      // 如果是 404，尝试通过路由反查 SchemaUID
      // 这种情况很常见，因为 URL 中的 ID 往往是 Route Name 而不是 Schema UID
      if (e.response?.status === 404) {
        console.warn(`[NocoBase] 直接获取 Schema 失败 (404)，尝试通过路由反查...`)
        try {
          // 获取所有可访问路由
          const routesRes = await targetClient.request({ url: 'uiRoutes:getAccessible' })
          const routes = routesRes.data?.data || []
          
          // 递归查找匹配的路由
          const findRoute = (items: any[]): any => {
            for (const item of items) {
              // 检查 name 或 path 是否匹配
              // 注意：URL 中的 schemaUid 可能是 path 的一部分
              if (item.name === schemaUid || item.path === schemaUid || item.path === `/${schemaUid}`) {
                return item
              }
              if (item.routes) {
                const found = findRoute(item.routes)
                if (found) return found
              }
            }
            return null
          }
          
          const matchedRoute = findRoute(routes)
          if (matchedRoute && matchedRoute.uiSchemaUid) {
            console.log(`[NocoBase] 路由反查成功: ${schemaUid} -> ${matchedRoute.uiSchemaUid}`)
            // 使用真实的 SchemaUID 重试
            const retryRes = await targetClient.request({
              url: `/uiSchemas:getJsonSchema/${matchedRoute.uiSchemaUid}`,
              params: { includeAsyncNode: true }
            })
            schema = retryRes.data?.data
          } else {
            console.error(`[NocoBase] 路由反查未找到对应页面: ${schemaUid}`)
            throw e // 抛出原始错误
          }
        } catch (routeError) {
          console.error('[NocoBase] 路由反查失败:', routeError)
          throw e // 抛出原始错误
        }
      } else {
        throw e
      }
    }

    if (!schema) throw new Error('未获取到页面 Schema')
    console.log('   -> 页面结构获取成功')


    // =====================================================
    // 第2.5步：递归解析 BlockTemplate (模板引用)
    // =====================================================
    
    // 缓存模板列表，避免重复请求 (闭包变量，仅在本次 fetchFullPageContent 有效)
    let cachedTemplates: any[] | null = null

    // NocoBase 的页面经常使用 BlockTemplate 来复用区块
    // 我们需要递归加载这些模板，才能找到真正的数据表绑定
    const resolveBlockTemplates = async (s: any) => {
      if (!s || typeof s !== 'object') return

      // 1. 检查当前节点是否是 BlockTemplate
      if (s['x-component'] === 'BlockTemplate' && s['x-component-props']?.templateId) {
        const templateId = s['x-component-props'].templateId
        console.log(`   -> 发现模板引用 [${templateId}]，正在解析...`)
        
        try {
          // 懒加载所有模板 (模仿官方行为: uiSchemaTemplates:list?paginate=false)
          // 官方前端通常是一次性拉取所有模板，然后在前端进行匹配
          if (!cachedTemplates) {
            console.log(`   -> 首次加载所有 UI Schema Templates (仅元数据)...`)
            // 修正策略：只拉取列表元数据，不拉取 schema 内容，避免 500 错误
            const templateResponse = await targetClient.resource('uiSchemaTemplates').list({
              paginate: false
            })
            console.log('>>> [API] Templates List Response:', templateResponse.data)
            cachedTemplates = templateResponse.data?.data || []
            console.log(`   -> 已加载 ${cachedTemplates.length} 个模板`)
            
            // Debug: 打印前几个 Key 以验证数据
            if (cachedTemplates.length > 0) {
              const keys = cachedTemplates.map(t => t.key)
              console.log(`   -> 模板 Keys Preview: ${keys.slice(0, 5).join(', ')} ... (Total: ${keys.length})`)
              // 检查目标 Key 是否存在
              if (keys.includes(templateId)) {
                console.log(`   -> [Check] 目标模板 [${templateId}] 存在于列表中`)
              } else {
                console.warn(`   -> [Check] 目标模板 [${templateId}] 不在列表中!`)
              }
            }
          }

          // 在内存中查找匹配的模板
          const templateRecord = cachedTemplates.find(t => t.key === templateId)
          
          if (templateRecord) {
            // 修正策略：根据 UID 单独获取 Schema 内容
            // 官方实现：BlockTemplate -> getTemplateById -> template.uid -> RemoteSchemaComponent -> useRequestSchema
            const templateUid = templateRecord.uid
            console.log(`   -> 找到模板 [${templateId}], UID: [${templateUid}]，正在获取详情...`)

            const schemaResponse = await targetClient.request({
              url: `/uiSchemas:getJsonSchema/${templateUid}`,
              params: {
                includeAsyncNode: true
              }
            })
            console.log(`>>> [API] Template [${templateId}] Schema Response:`, schemaResponse.data)
            const templateSchema = schemaResponse.data?.data

            if (templateSchema) {
              // 递归解析模板内部可能存在的其他模板
              await resolveBlockTemplates(templateSchema)
              
              // 将模板内容合并到当前节点
              // 核心策略：用模板的属性覆盖当前节点的属性，从而"展开"模板
              Object.assign(s, {
                properties: templateSchema.properties,
                'x-component': templateSchema['x-component'] || 'div', // 替换掉 BlockTemplate 组件名
                'x-component-props': { ...s['x-component-props'], ...templateSchema['x-component-props'] },
                'x-decorator': templateSchema['x-decorator'],
                'x-decorator-props': { ...s['x-decorator-props'], ...templateSchema['x-decorator-props'] },
                // 确保 x-collection 也能被复制
                'x-collection': templateSchema['x-collection'] || s['x-collection'],
                'x-template-resolved': true // 标记位
              })
              
              console.log(`   -> 模板 [${templateId}] 解析并合并完成`)
            } else {
               console.warn(`   -> 模板 [${templateId}] (UID: ${templateUid}) 获取 Schema 失败`)
            }
          } else {
             console.warn(`   -> 模板 [${templateId}] 未在列表中找到 (Key mismatch?)`)
          }
        } catch (err) {
          console.warn(`   -> 模板 [${templateId}] 处理失败:`, err)
        }
      }

      // 2. 递归遍历子节点
      if (s.properties) {
        // 使用 Promise.all 并行处理子节点，提高速度
        await Promise.all(Object.values(s.properties).map(child => resolveBlockTemplates(child)))
      }
    }

    console.log('2.5. 开始解析页面模板引用...')
    await resolveBlockTemplates(schema)


    // =====================================================
    // 第3步：依照结构获取所有相关数据表及其字段 (Metadata)
    // =====================================================
    
    // 3.0 预加载所有 Collections 的元数据 (模仿官方行为 collections:listMeta)
    // 这比一个个去 fetch fields 要快得多，且能获取到正确的关联关系
    console.log('3.0. 正在获取全局数据表元数据 (collections:listMeta)...')
    let globalCollectionsMeta: any[] = []
    try {
      const metaResponse = await targetClient.request({
        url: '/collections:listMeta',
        method: 'post', // 官方是用 POST
      })
      globalCollectionsMeta = metaResponse.data?.data || []
      console.log(`   -> 获取到 ${globalCollectionsMeta.length} 个数据表定义`)
    } catch (e) {
      console.warn('   -> 全局元数据获取失败，将降级为按需获取', e)
    }

    // 3.1 深度扫描 Schema，寻找所有的数据源定义 (Data Blocks)
    // 我们不仅要找 collection name，还要找它的配置 (params, filter, treeTable 等)
    interface DataSourceConfig {
      collection: string
      action?: string
      params?: any
      treeTable?: boolean
      blockId?: string // 用于区分不同的区块
      fields?: Set<string> // 该区块用到的字段
    }

    const dataSources: DataSourceConfig[] = []

    const findDataSources = (s: any) => {
      if (!s || typeof s !== 'object') return

      // 检查是否是数据提供者 (Decorator 或 Component)
      const decoratorProps = s['x-decorator-props'] || {}
      const componentProps = s['x-component-props'] || {}
      
      const collectionName = s['x-collection'] || decoratorProps.collection || componentProps.collection || componentProps.resource

      if (collectionName) {
        console.log(`   [Debug] 发现数据源: ${collectionName} (Component: ${s['x-component']})`)
        
        // 提取配置
        const config: DataSourceConfig = {
          collection: collectionName,
          action: decoratorProps.action || componentProps.action || 'list',
          params: { ...decoratorProps.params, ...componentProps.params }, // 合并 params
          treeTable: decoratorProps.treeTable || componentProps.treeTable,
          blockId: s['x-uid'],
          fields: new Set()
        }
        
        // 扫描该区块内部用到的字段 (用于智能 appends)
        const scanFields = (node: any) => {
          if (!node || typeof node !== 'object') return
          
          // 1. x-collection-field
          if (node['x-collection-field']) {
            config.fields?.add(node['x-collection-field'])
          }
          // 2. dataIndex (Table 列)
          if (node['dataIndex']) {
             // dataIndex 可能是数组或字符串
             const field = Array.isArray(node['dataIndex']) ? node['dataIndex'][0] : node['dataIndex']
             if (field) config.fields?.add(field)
          }

          if (node.properties) {
            Object.values(node.properties).forEach(scanFields)
          }
        }
        scanFields(s) // 仅扫描当前区块内部

        dataSources.push(config)
      }

      // 递归遍历子节点
      if (s.properties) {
        Object.values(s.properties).forEach(findDataSources)
      }
    }

    findDataSources(schema)

    // 如果没找到，尝试暴力搜索 (兜底)
    if (dataSources.length === 0) {
       console.warn('3. 常规扫描未找到数据源，尝试暴力搜索 Collection Name...')
       const jsonStr = JSON.stringify(schema)
       const regex = /"(?:collection|resource)"\s*:\s*"([^"]+)"/g
       let match
       const foundNames = new Set<string>()
       while ((match = regex.exec(jsonStr)) !== null) {
         if (match[1] && !match[1].startsWith('{{')) {
           foundNames.add(match[1])
         }
       }
       foundNames.forEach(name => {
         dataSources.push({ collection: name, fields: new Set() })
       })
    }

    // 去重合并：同一个 Collection 可能有多个 Block，我们这里简单起见，
    // 为每个 Collection 生成一个"最全"的请求配置
    // 或者，如果支持多数据源，应该分别请求。为了兼容性，我们按 Collection Name 分组
    const uniqueCollections = [...new Set(dataSources.map(d => d.collection))]
    console.log(`3. 解析到 ${uniqueCollections.length} 个唯一数据源: [${uniqueCollections.join(', ')}]`)


    // 准备一个对象来存储所有表的数据和元数据
    const collectionsMap: Record<string, { fields: any[], data: any[] }> = {}

    // =====================================================
    // 第4步：依照配置获取数据 (Data)
    // =====================================================
    await Promise.all(uniqueCollections.map(async (name) => {
      try {
        // 4.1 获取字段定义
        let fields: any[] = []
        // 优先从全局元数据中查找
        const meta = globalCollectionsMeta.find((m: any) => m.name === name)
        if (meta) {
            console.log(`   -> [${name}] Collection Meta:`, meta)
        }
        if (meta && meta.fields) {
          console.log(`   -> [${name}] 使用全局元数据 (Fields: ${meta.fields.length})`)
          fields = meta.fields
        } else {
          // 降级：单独请求
          console.log(`   -> [${name}] 全局元数据未找到，单独请求 fields...`)
          const fieldsResponse = await targetClient.resource('collections.fields', name).list({
            paginate: false
          })
          fields = fieldsResponse.data?.data || []
        }

        // 4.2 构造查询参数
        // 找到该 Collection 对应的所有 Config，合并参数
        const configs = dataSources.filter(d => d.collection === name)
        
        // 基础参数：为了解决“数据不全”问题，默认尝试获取全量数据
        const listParams: any = {
          paginate: false,
          appends: [],
          filter: {},
          sort: []
        }

        // 合并 Config 中的参数
        configs.forEach(cfg => {
          // 1. pageSize: 尊重配置
          if (cfg.params?.pageSize) {
            listParams.pageSize = cfg.params.pageSize
          }
          // 2. tree: 只要有一个是 treeTable，就开启 tree
          // 或者 Collection 元数据中定义了 tree 字段
          if (cfg.treeTable || meta?.tree) {
            listParams.tree = true
          }
          // 3. sort: 优先使用配置的 sort
          if (cfg.params?.sort) {
             // 简单的覆盖策略，或者可以尝试合并
             listParams.sort = cfg.params.sort
          }
          // 4. filter: 合并 filter (简单合并)
          if (cfg.params?.filter) {
            Object.assign(listParams.filter, cfg.params.filter)
          }
          
          // 5. appends: 智能计算
          // 遍历该 Block 用到的所有字段，如果是关联字段，则加入 appends
          cfg.fields?.forEach(rawFieldName => {
             const fieldName = rawFieldName.includes('.') ? rawFieldName.split('.').pop() : rawFieldName
             const fieldMeta = fields.find((f: any) => f.name === fieldName)
             
             if (fieldMeta && (['m2o', 'o2m', 'belongsTo', 'hasMany'].includes(fieldMeta.interface) || ['belongsTo', 'hasMany'].includes(fieldMeta.type))) {
               if (!listParams.appends.includes(fieldName)) {
                 listParams.appends.push(fieldName)
               }
             }
          })
        })

        // [CRITICAL FIX] 强制覆盖：无论配置如何，都尝试获取全量数据 (最多5000条)
        // 放在循环后面，确保覆盖掉 Schema 中的默认 pageSize: 20
        listParams.pageSize = 5000;
        listParams.paginate = false;

        // 默认排序策略 (如果没有指定 sort)
        if (!listParams.sort || listParams.sort.length === 0) {
           const hasCreatedAt = fields.some((f: any) => f.name === 'createdAt')
           if (hasCreatedAt) {
             // [Fix] 用户反馈顺序是反的，改为正序 (oldest first)
             listParams.sort = 'createdAt'
           }
        }
        
        // 确保 appends 包含 parent 和 children (如果是 tree 模式)
        if (listParams.tree) {
          if (!listParams.appends.includes('parent')) listParams.appends.push('parent')
          if (!listParams.appends.includes('children')) listParams.appends.push('children')
        }

        console.log(`   -> [${name}] 构造查询参数:`, JSON.stringify(listParams))

        // 4.3 发起请求
        let dataResponse
        try {
           dataResponse = await targetClient.resource(name).list(listParams)
           console.log(`>>> [API] Collection [${name}] Data Response:`, dataResponse.data)
        } catch (listErr) {
           console.warn(`   -> [${name}] 请求失败，尝试简化参数重试...`)
           // 失败重试：去掉 sort 和 filter
           delete listParams.sort
           delete listParams.filter
           dataResponse = await targetClient.resource(name).list(listParams)
        }

        const data = dataResponse.data?.data || []

        // [Fix] 如果 Tree 模式返回空数据，尝试降级为普通列表获取
        // 场景：数据表中没有根节点 (parentId is null)，导致 Tree 模式查不到任何数据
        if (listParams.tree && data.length === 0) {
            console.warn(`   -> [${name}] Tree 模式返回 0 条数据，尝试降级为平铺列表 (tree=false)...`)
            try {
                const fallbackParams = { ...listParams, tree: false }
                // 保持 appends，因为平铺列表也可能需要关联数据
                const fallbackResp = await targetClient.resource(name).list(fallbackParams)
                const fallbackData = fallbackResp.data?.data || []
                
                if (fallbackData.length > 0) {
                    console.log(`   -> [${name}] 降级成功: 获取到 ${fallbackData.length} 条平铺数据`)
                    // 直接使用平铺数据，虽然丢失了层级关系，但至少能显示内容
                    // 注意：data 是 const 引用，这里我们需要修改 collectionsMap 的赋值逻辑，或者重新定义 data
                    // 由于 data 是 const，我们直接在下面赋值时使用 fallbackData
                    collectionsMap[name] = { fields, data: fallbackData }
                    console.log(`   -> [${name}] 获取完毕 (数据: ${fallbackData.length})`)
                    return // 跳过后续默认赋值
                } else {
                    console.log(`   -> [${name}] 降级后仍无数据`)
                }
            } catch (e) {
                console.warn(`   -> [${name}] 降级请求失败:`, e)
            }
        }

        collectionsMap[name] = { fields, data }
        console.log(`   -> [${name}] 获取完毕 (数据: ${data.length})`)

      } catch (err) {
        console.error(`   -> [${name}] 处理失败:`, err)
        collectionsMap[name] = { fields: [], data: [] }
      }
    }))


    // =====================================================
    // 第5步：将内容（结构和数据）整合发给 Vue
    // =====================================================
    const result = {
      appId,
      schema,        // 页面结构
      collections: collectionsMap // 所有相关表的数据集合
    }

    console.log('5. 全量信息整合完毕，准备渲染')
    console.groupEnd()
    
    return result

  } catch (error) {
    console.error('[NocoBase] 获取全量信息失败:', error)
    console.groupEnd()
    throw error
  }
}
