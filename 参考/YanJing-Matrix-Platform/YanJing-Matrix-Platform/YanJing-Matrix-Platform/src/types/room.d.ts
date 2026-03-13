
export interface MatrixRoom{
  roomId: string
  name?: string
  topic?: string
  avatarUrl?: string

  //最后活动时间戳，可以用于房间列表排序
  lastActiveTs?: number

  
}