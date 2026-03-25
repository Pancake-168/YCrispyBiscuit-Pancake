import type { Context, Next } from 'hono'

// 对应 FastAPI 中 Request ID 中间件
export const requestIdMiddleware = async (c: Context, next: Next) => {
  const reqId = crypto.randomUUID()
  c.set('requestId', reqId)

  await next()

  c.res.headers.set('X-Request-Id', reqId)
}
