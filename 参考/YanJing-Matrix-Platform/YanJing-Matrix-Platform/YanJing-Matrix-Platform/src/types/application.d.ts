// Application / Market / Dataset related type definitions

export interface ApiV2PaginationMeta {
	count: number;
	totalPage: number;
	pageSize: number;
	page: number;
}

export type DatasetAssetType = 'datatable' | string;

export interface DatasetAssetItem {
	id: number;
	atype: DatasetAssetType;
	name: string;
	asset_id: string;
	description: string;
	config: unknown | null;
}

export interface DatasetItem {
	id: number;
	assets: DatasetAssetItem[];
	name: string;
	description: string;
	config: unknown | null;
	createdAt: string;
	createdById: number;
	updatedAt: string;
	updatedById: number;
}

export interface GetDatasetResponse {
	data: DatasetItem[];
	meta: ApiV2PaginationMeta;
}











export type ApplicationUserType = 'bot' | string;

export interface ApplicationBotItem {
	id: number;
	appsid: number;
	userid: number;
	market_userid: number | null;
	apps: unknown | null;
	app_id: string;
	app_tag: string;
	user_type: ApplicationUserType;
	config: unknown | null;
	createdAt: string;
	createdById: number;
	updatedAt: string;
	updatedById: number;


    /** bot token（如果后端列表接口未返回则可能缺失） */
	token?: string | null;



}
//应用内机器人列表，含分页
export interface GetApplicationBotResponse {
	data: ApplicationBotItem[];
	meta: ApiV2PaginationMeta;
}









export interface ApplicationUserItem {
	id: number;
	username: string;
	nickname: string | null;
	type:"user"|"bot";
}
//应用内用户列表，含分页
export interface GetApplicationUserResponse {
	data: ApplicationUserItem[];
	meta: ApiV2PaginationMeta;
}






