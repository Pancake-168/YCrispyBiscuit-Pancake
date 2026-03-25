import { z } from '@hono/zod-openapi'

export class Result<T = unknown> {
  code: number
  msg: string
  data: T | null

  constructor(code: number, msg: string, data: T | null = null) {
    this.code = code
    this.msg = msg
    this.data = data
  }

  static success<T>(data: T, msg: string = 'success'): Result<T> {
    return new Result(200, msg, data)
  }

  // 修改：增加可选的 data 参数，用于透传错误详情（如 Zod errors）
  static error<T = null>(msg: string, code: number = 500, data: T | null = null): Result<T> {
    return new Result(code, msg, data)
  }
}

// 帮助函数：用于生成给 Swagger 的外层统一响应结构模型
export function createResultSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    code: z.number().openapi({ example: 200 }),
    msg: z.string().openapi({ example: 'success' }),
    data: dataSchema.nullable()
  })
}

// 错误响应的标准 Schema
export const ErrorResultSchema = z
  .object({
    code: z.number().openapi({ example: 400 }),
    msg: z.string().openapi({ example: 'Error occurred' }),
    data: z.any().nullable().openapi({ example: null })
  })
  .openapi('ErrorResult')
