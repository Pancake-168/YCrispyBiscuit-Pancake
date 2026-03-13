



export type OverviewNodeType = 'department' | 'post' | 'agent' | 'dataset' | 'workflow';

export type OverviewNode = {
    id: string;
    parentId?: string;
    name: string;
    type: OverviewNodeType;
    description?: string;
    path?: string;
};


export type OverviewApiNode = {
    id: number;
    parentId?: number | null;
    name: string;
    atype: string;
    path?: string | null;
    description?: string | null;
};

export type Nullable<T> = T | null;









export type OverviewApiMeta = {
    page?: number;
    totalPage?: number;
    count?: number;
    pageSize?: number;
    [key: string]: any;
};

export type OverviewApiResponse<TData> = {
    data: Nullable<TData>;
    meta?: OverviewApiMeta | null;
    [key: string]: any;
};

/**
 * GetOverView(appid) 经过前端“全量拉取”后的返回：
 * - ok=true 时 data.data 会被合并为“全量数组”
 * - meta.page/totalPage 会被重置为 1，count 为合并后的长度
 */
export type GetOverViewResponse = OverviewApiResponse<OverviewApiNode[]>;

// ---- Service wrappers (consistent with other Project services) ----
export type GetOverViewResult = { ok: boolean; data: GetOverViewResponse | null };

export type OverviewDepartmentInfo = {
    id: number;
    name?: string | null;
    atype?: 'department' | string;
    description?: string | null;
    path?: string | null;
    parent?: OverviewParentInfo | null;
    [key: string]: any;
};

export type OverviewPostInfo = {
    id: number;
    name?: string | null;
    atype?: 'post' | string;
    description?: string | null;
    parent?: OverviewParentInfo | null;
    [key: string]: any;
};

export type OverviewParentInfo = {
    createdAt?: string | null;
    updatedAt?: string | null;
    parentId?: number | null;
    id: number;
    name?: string | null;
    path?: string | null;
    description?: string | null;
    config?: any | null;
    atype?: string | null;
    createdById?: number | null;
    updatedById?: number | null;
    [key: string]: any;
};

/**
 * GetOverViewDetail - 人员/账号结构（用于 agent 详情返回的 data[]，也用于 department/post 的 users[]）。
 */
export type OverviewUser = {
    id: number;
    nickname?: string | null;
    username?: string | null;
    [key: string]: any;
};

/**
 * GetOverViewDetail - dataset 详情返回的资源项（data[]）。
 * 你目前提供的样例字段：id / atype / name / asset_name / description
 */
export type OverviewDatasetAsset = {
    id: number;
    atype?: string | null;
    /** 后端可能返回 null（样例里为 null） */
    dataset?: any | null;
    name?: string | null;
    asset_name?: string | null;
    description?: string | null;
    /** 后端可能返回 null（样例里为 null） */
    config?: any | null;
    createdAt?: string | null;
    createdById?: number | null;
    updatedAt?: string | null;
    updatedById?: number | null;
    [key: string]: any;
};

/**
 * GetOverViewDetail - department/post 详情里的 child：
 * 后端返回可能是数组，也可能包一层 {data: []}，这里做兼容。
 */
export type OverviewChildList<T = any> = T[] | { data?: T[]; [key: string]: any };

export type OverviewDetailDepartmentData = {
    department: OverviewDepartmentInfo;
    child?: OverviewChildList<OverviewApiNode> | null;
    users?: OverviewUser[] | null;
    [key: string]: any;
};

export type OverviewDetailPostData = {
    post: OverviewPostInfo;
    users?: OverviewUser[] | null;
    [key: string]: any;
};

/**
 * GetOverViewDetail(appid, 'agent', id)
 * 你目前提供的样例：{ data: OverviewUser[], meta }
 */
export type OverviewDetailAgentResponse = OverviewApiResponse<OverviewUser[]>;

/**
 * GetOverViewDetail(appid, 'dataset', id)
 * 你目前提供的样例：{ data: OverviewDatasetAsset[], meta }
 */
export type OverviewDetailDatasetResponse = OverviewApiResponse<OverviewDatasetAsset[]>;

/**
 * GetOverViewDetail(appid, 'department', id)
 * 样例：{ data: { department, child: [...], users: [...] }, meta }
 */
export type OverviewDetailDepartmentResponse = OverviewApiResponse<OverviewDetailDepartmentData>;

/**
 * GetOverViewDetail(appid, 'post', id)
 * 样例：{ data: { post, users: [...] }, meta }
 */
export type OverviewDetailPostResponse = OverviewApiResponse<OverviewDetailPostData>;

/**
 * 统一的 GetOverViewDetail 返回（根据节点 atype 不同，data 形态不同）。
 */
export type GetOverViewDetailResponse =
    | OverviewDetailDepartmentResponse
    | OverviewDetailPostResponse
    | OverviewDetailAgentResponse
    | OverviewDetailDatasetResponse;

export type GetOverViewDetailResult = { ok: boolean; data: GetOverViewDetailResponse | null };