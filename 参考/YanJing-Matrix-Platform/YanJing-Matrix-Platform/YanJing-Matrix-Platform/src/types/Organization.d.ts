import type { WechatUserApp } from './WeChat';

// 纯净的 V2 版组织架构类型定义

// 1. API 原始响应数据接口
export type ApiV2NodeType = 'department' | 'post';


export interface ApiV2BaseNode {
  id: number;
  parentId: number | null;
  name: string;
  atype: ApiV2NodeType;
  description?: string;
  path?: string; // e.g. "1/3/4"
  createdAt?: string;
  updatedAt?: string;
  createdById?: number;
  updatedById?: number;
}

export interface ApiV2PaginationMeta {
  count: number;
  totalPage: number;
  pageSize: number;
  page: number;
}

// 部门节点（可能包含 child 分页数据）
export interface ApiV2Department extends ApiV2BaseNode {
  atype: 'department';
  child?: {
    data: (ApiV2Department | ApiV2Post)[];
    meta: ApiV2PaginationMeta;
  };
}

// 职位节点（通常是叶子，暂无 child）
export interface ApiV2Post extends ApiV2BaseNode {
  atype: 'post';
  // 注意：不同接口对 users 字段形态不同。
  // - GetOrganizationPostV2（旧）：users: { data, meta }
  // - GetOrganizationPostV2（新）：users: ApiV2PostUserRelation[]
  // 在组织树里我们通过 FetchPostUsersV2 的返回类型来约束。
  users?: ApiV2PostUserRelation[] | { data: ApiV2PostUserRelation[]; meta: ApiV2PaginationMeta };
}

export interface ApiV2PostUserRelation {
  id: number; // 关联 ID
  user: {
    id: number;
    nickname: string;
    username: string;
    avatar?: string;
  };
}

// ---- Department service response types ----
export type GetDepartmentsV2ApiResponse = {
  data: ApiV2Department[];
  meta: ApiV2PaginationMeta;
};

export type GetDepartmentChildrenV2ApiResponse = ApiV2Department & {
  child: {
    data: Array<ApiV2Department | ApiV2Post>;
    meta: ApiV2PaginationMeta;
  };
};

// ---- Service return types (normalized) ----
// 新 GetOrganizationPostV2 返回：{ data: { ...post, users: [...] }, meta: { page... } }
export interface FetchPostUsersV2ApiResponse {
  data: Omit<ApiV2Post, 'users'> & { users: ApiV2PostUserRelation[] };
  meta: ApiV2PaginationMeta;
}

export type FetchPostUsersV2Result =
  | { ok: true; data: FetchPostUsersV2ApiResponse }
  | { ok: false; data: null };






















  
// 2. 前端 Store 存储用的节点结构
export type OrgNodeV2Type = 'org' | 'department' | 'post' | 'person';

export interface OrgNodeV2 {
  id: string;          // 统一转为 string，避免 0/null 问题
  name: string;
  type: OrgNodeV2Type; // 前端使用的类型枚举
  parentId?: string;
  
  // 核心数据
  description?: string;
  
  // 树状结构的关键
  children?: OrgNodeV2[];

  // ---- Person(人员)节点扩展字段 ----
  // 仅当 type === 'person' 时有意义；其他类型可能为 undefined
  username?: string;
  nickname?: string;
  avatar?: string;

  // 扩展字段：如果需要存储 path 等
  path?: string;
  
  // 标记该节点的数据来源于 API 的完整程度
  // 'skeleton': 仅来自列表平铺数据，可能缺子级
  // 'detail': 来自 children 接口，包含子级详情
  // 'loading': 正在加载子级数据
  loadStatus?: 'skeleton' | 'detail' | 'loading'; 
}

// 应用/组织元数据 (沿用 SSO 定义)
export interface ApplicationV2 extends WechatUserApp {
    // 扩展字段
    name?: string; // SSO 列表中无此字段，但在详情或旧版转换中可能存在
}

