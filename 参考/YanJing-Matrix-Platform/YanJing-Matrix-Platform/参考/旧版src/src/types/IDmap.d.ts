export type IDMapUserType = 'user' | 'bot';

export interface IDMapUser {
	username: string;
	matrixId: string;
	nickname: string;
	type: IDMapUserType;
}

export interface IDmap {
	/** 本地用户映射表（单表） */
	list: IDMapUser[];
}

