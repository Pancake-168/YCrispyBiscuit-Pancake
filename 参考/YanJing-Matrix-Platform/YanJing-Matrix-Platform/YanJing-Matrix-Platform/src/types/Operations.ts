// 消息操作类型定义，精简对齐 Element 的常用动作
export type MsgOperationType =
    | 'reply'        // 回复/引用
    | 'preview'      // 预览（文件）
    | 'download'     // 下载（媒体）
    | 'transcribe'   // 语音转文字（仅音频）
    | 'edit'         // 编辑（仅自己消息）
    | 'forward'      // 转发（支持批量）
    | 'delete'       // 删除/撤回/取消发送，权限设置
    | 'viewSource';  // 查看原始（view source）

export interface MsgOperation {
    type: MsgOperationType
    // 是否仅在媒体消息显示（显式声明）
    onlyWhenMedia: boolean
    // 是否支持批量（显式声明）
    supportsBulk: boolean
}

// 默认操作集合（无具体实现，仅作为模板渲染数据源）
export const MSGoperations: MsgOperation[] = [
    { type: 'reply',      onlyWhenMedia: false, supportsBulk: false },
    { type: 'preview',    onlyWhenMedia: true,  supportsBulk: false },
    { type: 'download',   onlyWhenMedia: true,  supportsBulk: false },
    { type: 'transcribe', onlyWhenMedia: true,  supportsBulk: false },
    { type: 'edit',       onlyWhenMedia: false, supportsBulk: false },
    { type: 'forward',    onlyWhenMedia: false, supportsBulk: true  },
    { type: 'delete',     onlyWhenMedia: false, supportsBulk: false },
    { type: 'viewSource', onlyWhenMedia: false, supportsBulk: false },
]