export interface AgentTeam {
  createdAt: string;
  updatedAt: string;
  id: number;
  name: string;
  imAccount: string;
  application_id: string;
  other: any;
  status: string;
  isPublic: string;
  market_id: number;
  createdById: number;
  updatedById: number;
}

export interface ApiApplicationItem {
  createdAt: string;
  updatedAt: string;
  id: number;
  author: string;
  name: string;
  description: string;
  icon: string;
  application_id: string;
  other: any;
  status: string;
  isPublic: string;
  tag: string;
  createdById: number;
  updatedById: number;
  // 前端补充字段，后端不返回
  agentTeams?: AgentTeam[];
}

export interface Meta {
  count: number;
  page: number;
  pageSize: number;
  totalPage: number;
}