// 用户相关类型定义

// 替代 enum 的方式
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOCKED: 'locked'
} as const;

// 使用联合类型作为类型注解
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];


export interface UserProfile {
  id: string
  name: string
  avatar?: string
  email: string
  phone?: string
  status: UserStatus
  roles: string[]
  permissions: string[]
  createdAt: string
  updatedAt: string
}

// 角色类型
export type UserRole = 'admin' | 'editor' | 'viewer' | 'guest'

// 权限类型
export type Permission = 
  | 'user:create'
  | 'user:read' 
  | 'user:update'
  | 'user:delete'
  | 'content:manage'
  | 'content:review'

// 用户分页查询参数
export interface UserQueryParams {
  page?: number
  size?: number
  name?: string
  email?: string
  status?: UserStatus
  role?: UserRole
}

// 用户列表响应
export interface UserListResponse {
  items: UserProfile[]
  total: number
  page: number
  size: number
}