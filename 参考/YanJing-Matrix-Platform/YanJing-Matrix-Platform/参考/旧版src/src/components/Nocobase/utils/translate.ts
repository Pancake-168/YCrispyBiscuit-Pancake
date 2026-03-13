export function t(text: any): string {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  
  // Handle NocoBase translation format: {{ t("key") }}
  const match = text.match(/\{\{\s*t\("(.+?)"\)\s*\}\}/);
  if (match) {
    const key = match[1];
    // Simple common translations
    const common: Record<string, string> = {
      'Actions': '操作',
      'Delete': '删除',
      'Edit': '编辑',
      'Add new': '新增',
      'Users': '用户',
      'Department': '部门',
      'Departments': '部门',
      'Submit': '提交',
      'Cancel': '取消',
      'Search': '搜索',
      'Reset': '重置',
      'Filter': '筛选',
      'Refresh': '刷新',
      'ID': 'ID',
      'Name': '名称',
      'Created at': '创建时间',
      'Updated at': '更新时间',
      'Parent': '父级',
      'Children': '子级',
      'Nickname': '昵称',
      'Username': '用户名',
      'Email': '邮箱',
      'Phone': '电话',
      'Description': '描述',
      'Status': '状态',
      'Role': '角色',
      'Roles': '角色',
    };
    return common[key] || key;
  }
  
  return text;
}
