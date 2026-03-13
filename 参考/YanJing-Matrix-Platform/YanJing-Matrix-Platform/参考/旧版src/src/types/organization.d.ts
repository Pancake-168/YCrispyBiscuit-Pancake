export interface ApiDepartment {
  id: number
  name: string
  parentId: number | null
  du?: ApiDeptUser[]
  createdAt?: string
  updatedAt?: string
  createdById?: number
  updatedById?: number
}

export interface ApiDeptUser {
  id: number
  userId: number // 注意：API返回的是 user_id，这里可能需要映射或修改接口定义
  roleId: string // API返回的是 role_id
  user_id?: number // 兼容 API
  department_id?: number // 兼容 API
  role_id?: string // 兼容 API
  user: {
    id: number
    nickname: string
    username: string
    atype: string // 新增：人员类型
    assistant: string // 新增：助理标识符
    createdAt?: string
    updatedAt?: string
    email?: string | null
    phone?: string | null
  }
}

// 新增：应用/组织元数据接口 (对应 GetApplicationFromTag 返回值)
export interface Application {
  id: number
  application_id: string
  application_name: string
  application_tag: string
  author: string | null
  config: any
  from_market: string | null
  copy_to: string | null
  createdAt: string
  updatedAt: string
  createdById: number
  updatedById: number
  // 前端辅助字段
  avatar?: string 
}

//组织架构树节点
export interface OrgNode {
  id: string
  name: string
  type: 'org' | 'department' | 'person'
  avatar?: string
  position?: string
  parentId?: string
  children?: OrgNode[]
  role?: string // 新增：人员节点的角色（如主管/成员）

  // 新增：仅对 type: 'person' 节点
  username?: string         // 后端 user.username
  nickname?: string         // 后端 user.nickname
  nocobaseID?: number | string       // 后端 user.id

  atype?:'user' | 'bot' // 新增：区分人员类型。是普通用户？还是助理？
  assistant?:string // 新增：当atype为user时，存储助理的标识符
}

//面包屑导航
export interface BreadcrumbItem {
  id: string
  name: string
  isDepartment?: boolean
}

//菜单项
export interface MenuItem {
  type: 'org' | 'dept' | 'agent'
  text: string
  prefix?: string
  deptId?: string
}