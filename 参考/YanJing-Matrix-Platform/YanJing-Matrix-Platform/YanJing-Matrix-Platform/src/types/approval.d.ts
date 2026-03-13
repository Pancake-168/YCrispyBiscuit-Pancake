/**
 * 审批职位信息
 */
export interface ApprovalPosition {
  /** 职位ID */
  id: number;
  /** 职位代码 (例如: DEPT_MANAGER) */
  code: string;
  /** 职位名称 (例如: 销售部经理) */
  name: string;
  /** 职位等级 */
  level: number;
  /** 职位标识 */
  position: string;
}

/**
 * 审批类型信息
 */
export interface ApprovalType {
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
    /** 类型名称 (例如: 采购申请) */
    name: string;
    /** 类型描述 */
    description: string;
    /** 类型ID */
    id: number;
    /** 类型代码 (例如: purchase) */
    code: string;
    /** 创建人ID */
    createdById: number;
    /** 更新人ID */
    updatedById: number;
}

/**
 * 创建审批类型入参
 */
export interface ApprovalTypeCreateInput {
  /** 类型代码 (例如: purchase) */
  code: string;
  /** 类型名称 (例如: 采购) */
  name: string;
  /** 描述 (可选) */
  description?: string;
}

export interface ApprovalUiConfigField {
    /** 字段ID */
    id: string;
    /** 字段标签 */
    label: string;
    /** 字段类型 (例如: number, textarea) */
    type: string;
    /** 占位符 */
    placeholder?: string;
    /** 校验规则 */
    rules?: Record<string, any>;
}

/**
 * 审批模板 UI 配置
 */
export interface ApprovalTemplateUIConfig {
    /** 布局方式 (例如: vertical) */
    layout: string;
    /** 表单字段列表 */
    fields: Array<ApprovalUiConfigField>;
}

/**
 * 审批模板详细信息
 */
export interface ApprovalTemplate {
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
    /** 模板名称 */
    name: string;
    /** 版本号 */
    version: string;
    /** 是否激活 */
    is_active: boolean;
    /** 关联字段 (主要用于关联回审批类型，值为ApprovalType.id) */
    f_uvljca55h6d: string;
    /** 模板ID */
    id: number;
    /** UI配置 */
    ui_config: ApprovalTemplateUIConfig;
    /** 创建人ID */
    createdById: number;
    /** 更新人ID */
    updatedById: number;
}

/**
 * 审批流程节点
 */
export interface ApprovalNode {
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
    /** 关联模板ID字段 (值为ApprovalTemplate.id) */
    f_o4gcgk6wnek: number;
    /** 审批人角色 (例如: DEPT_MANAGER) */
    approver_role: string;
    /** 节点顺序 */
    node_order: number;
    /** 是否必须 */
    required: boolean;
    /** 节点ID */
    id: number;
    /** 审批人类型 (例如: position) */
    approver_type: string;
    /** 创建人ID */
    createdById: number;
    /** 更新人ID */
    updatedById: number;
}

/**
 * 获取激活的审批模板返回结果
 */
export interface ApprovalTemplateActiveResult {
    /** 模板信息 */
    template: ApprovalTemplate;
    /** 审批流节点列表 */
    nodes: ApprovalNode[];
}

/**
 * 待办事项
 */
export interface ApprovalTodo {
    /** 实例ID */
    instanceId: number;
    /** 当前节点信息 */
    currentNode: ApprovalNode;
    /** 模板ID */
    templateId: number;
    /** 业务摘要/详情数据 */
    dataJson?: Record<string, any>;
    /** 提交人 */
    submitter?: string;
    /** 提交时间 */
    createdAt?: string;
    /** 真实字段: 提交人名称 */
    submitter_name?: string;
    /** 真实字段: 状态 */
    status?: string;
    /** 真实字段: 表单类型 */
    form_type?: string | null;
    /** 真实字段: 数据JSON */
    data_json?: Record<string, any>;
}

/**
 * 我的审批提交记录（列表项）
 */
export interface ApprovalMySubmission {
  formData: {
    id: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    data_json?: Record<string, any>;
    [key: string]: any;
  };
  instance: {
    id: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
  };
  instanceId: number;
  status?: string;
}

/**
 * 模板节点输入参数
 */
export interface ApprovalTemplateNodeInput {
  id?: number;
  node_order: number;
  approver_type: "position" | "manager";
  approver_role: string;
  condition?: string | null;
  required?: boolean;
}

/**
 * 创建/更新模板输入参数
 */
export interface ApprovalTemplateUpsertInput {
  templateId?: number;
  /** 关联的审批类型ID */
  typeId?: number;
  typeCode: string;
  name: string;
  version: number;
  isActive?: boolean;
  uiConfig?: ApprovalTemplateUIConfig | null;
  nodes: ApprovalTemplateNodeInput[];
}

/**
 * 提交审批输入参数
 */
export interface ApprovalSubmitInput {
  typeCode: string;
  dataJson: Record<string, any>;
  submitterName?: string;
}

/**
 * 审批操作输入参数
 */
export interface ApprovalActionInput {
  instanceId: number;
  action: "approve" | "reject";
  comment?: string | null;
  actorUsername?: string;
}
