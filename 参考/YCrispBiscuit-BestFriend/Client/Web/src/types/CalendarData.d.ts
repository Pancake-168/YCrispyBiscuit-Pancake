// 日历事件数据类型定义，用于对接后端API
export interface CalendarEvent {
  id?: string; // 创建时不可选，完全后端生成
  title: string;
  content?: string; // 日历内容
  type: 'default' | 'meeting' | 'birthday' | 'holiday' | 'deadline' | 'goal'; // 事件类型
  importance: 'R' | 'SR' | 'SSR' | 'SP'; // 重要性
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'; // 重复类型
  weekdays?: number[]; // 可选，repeat为weekly时使用，0表示星期天，1表示星期一，依此类推；与range互斥
  range?: boolean; // 可选，是否为跨天事件；与weekdays互斥
  // 拆分后的日期字段
  startYear?: number;
  startMonth?: number;
  startDay?: number;
  endYear?: number;
  endMonth?: number;
  endDay?: number;
  // 拆分后的时间字段
  startTimeHour?: number;
  startTimeMinute?: number;
  endTimeHour?: number;
  endTimeMinute?: number;
  status: 'normal' | 'completed' | 'canceled'; // 可选，事件状态
}
